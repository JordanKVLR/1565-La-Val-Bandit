import type { Difficulty } from '@m1565/core';
import { loadLibrary } from '@m1565/content';
import { beforeEach, describe, expect, it } from 'vitest';
import { readSave } from '../platform/storage';
import { GameSession } from './GameSession';
import { installFakePlatform, lostState, playUntil, wonState } from './testkit';
import type { CampaignSave } from './types';

const lib = loadLibrary();

beforeEach(() => {
  installFakePlatform();
});

/** A new game on this difficulty, stopped at its first battle. */
function atFirstBattle(difficulty: Difficulty): GameSession {
  const s = new GameSession(lib, undefined, { difficulty });
  playUntil(s, (v) => v.screen.kind === 'battle');
  return s;
}

function battleOf(s: GameSession) {
  const screen = s.state.screen;
  if (screen.kind !== 'battle') throw new Error(`expected a battle, got ${screen.kind}`);
  return screen;
}

const enemyTotal = (s: GameSession) =>
  battleOf(s)
    .setup.units.filter((u) => u.side === 'enemy')
    .reduce((n, u) => n + Object.values(u.stats).reduce((a, b) => a + b, 0), 0);

describe('difficulty in a playthrough', () => {
  it('defaults to Knight and is saved with the game', () => {
    const s = new GameSession(lib);
    expect(s.state.difficulty).toBe('knight');
    const chosen = atFirstBattle('grandMaster');
    chosen.autosave();
    expect(readSave<CampaignSave>('auto')).toMatchObject({ difficulty: 'grandMaster', ngPlus: 0 });
  });

  it('scales the enemies of each battle', () => {
    const squire = enemyTotal(atFirstBattle('squire'));
    const knight = enemyTotal(atFirstBattle('knight'));
    const gm = enemyTotal(atFirstBattle('grandMaster'));
    expect(squire).toBeLessThan(knight);
    expect(gm).toBeGreaterThan(knight);
  });

  it('pays more scudi on Squire and less on Grand Master', () => {
    const b = lib.balance;
    /** Scudi actually paid, and the Knight-rate purse for the same (scaled) enemies. */
    const reward = (d: Difficulty) => {
      const s = atFirstBattle(d);
      const before = s.state.scudi;
      const { setup } = battleOf(s);
      const purse =
        b.rewardVictory +
        b.rewardNoLosses +
        setup.units
          .filter((u) => u.side === 'enemy')
          .reduce((n, u) => n + b.rewardPerEnemy + b.rewardPerEnemyLevel * u.level, 0);
      s.finishBattle('victory', wonState(setup));
      return { paid: s.state.scudi - before, purse };
    };
    const knight = reward('knight');
    expect(knight.paid).toBe(knight.purse);
    const squire = reward('squire');
    const gm = reward('grandMaster');
    expect(squire.paid).toBe(Math.round(squire.purse * b.squireScudi));
    expect(gm.paid).toBe(Math.round(gm.purse * b.grandMasterScudi));
    expect(squire.paid).toBeGreaterThan(knight.paid);
    expect(gm.paid).toBeLessThan(knight.paid);
  });

  it('can be changed mid-game; the next battle uses it', () => {
    const s = atFirstBattle('knight');
    const knight = enemyTotal(s);
    s.setDifficulty('grandMaster');
    expect(s.state.difficulty).toBe('grandMaster');
    expect(readSave<CampaignSave>('auto')?.difficulty).toBe('grandMaster');
    s.retryBattle(lostState(battleOf(s).setup, { level: 0, xp: 0 }));
    expect(enemyTotal(s)).toBeGreaterThan(knight);
  });
});

describe('retrying a lost battle', () => {
  const ninu = (s: GameSession) => s.state.roster.find((r) => r.characterId === 'ninu');

  it('on Squire keeps the experience earned before losing (free retry)', () => {
    const s = atFirstBattle('squire');
    expect(s.defeatKeepsXp).toBe(true);
    const before = ninu(s)!;
    const { battleId, key } = battleOf(s);
    s.retryBattle(lostState(battleOf(s).setup, { level: 1, xp: 120 }));
    const again = battleOf(s);
    expect(again.battleId).toBe(battleId);
    expect(again.key).not.toBe(key);
    expect(again.initial).toBeUndefined();
    expect(ninu(s)).toMatchObject({ level: before.level + 1, xp: 120 });
    // The restarted battle fields the stronger pilot, and the autosave restarts it too.
    expect(again.setup.units.find((u) => u.characterId === 'ninu')?.level).toBe(before.level + 1);
    expect(readSave<CampaignSave>('auto')?.battle).toEqual({ id: battleId });
  });

  it('on Knight restarts the battle and that attempt’s experience is lost', () => {
    const s = atFirstBattle('knight');
    expect(s.defeatKeepsXp).toBe(false);
    const before = ninu(s)!;
    const { battleId, key } = battleOf(s);
    s.retryBattle(lostState(battleOf(s).setup, { level: 1, xp: 120 }));
    expect(battleOf(s)).toMatchObject({ battleId });
    expect(battleOf(s).key).not.toBe(key);
    expect(ninu(s)).toEqual(before);
  });

  it('giving up on Squire also keeps the experience; on Grand Master it does not', () => {
    const squire = atFirstBattle('squire');
    const lv = ninu(squire)!.level;
    squire.finishBattle('defeat', lostState(battleOf(squire).setup, { level: 2, xp: 10 }));
    expect(squire.state.screen.kind).toBe('title');
    expect(
      readSave<CampaignSave>('auto')?.roster.find((r) => r.characterId === 'ninu'),
    ).toMatchObject({ level: lv + 2, xp: 10 });

    const gm = atFirstBattle('grandMaster');
    const kept = ninu(gm);
    gm.finishBattle('defeat', lostState(battleOf(gm).setup, { level: 2, xp: 10 }));
    expect(ninu(gm)).toEqual(kept);
  });

  it('ignores a retry outside battle', () => {
    const setup = battleOf(atFirstBattle('knight')).setup;
    const s = new GameSession(lib);
    const screen = s.state.screen;
    s.retryBattle(wonState(setup));
    expect(s.state.screen).toBe(screen);
  });
});
