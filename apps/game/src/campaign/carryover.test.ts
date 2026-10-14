import type { BattleState, UnitState } from '@m1565/core';
import { loadLibrary } from '@m1565/content';
import { beforeEach, describe, expect, it } from 'vitest';
import { GameSession } from './GameSession';
import { installFakePlatform, playUntil, wonState } from './testkit';

/**
 * Levels earned in a battle must reach the roster and the next battle, for every pilot that
 * fought, whatever the battle's file calls their unit.
 */
const lib = loadLibrary();

beforeEach(() => {
  installFakePlatform();
});

const battleOf = (s: GameSession) => {
  const screen = s.state.screen;
  if (screen.kind !== 'battle') throw new Error(`expected a battle, got ${screen.kind}`);
  return screen;
};

/** The battle as won, every player unit having levelled up and spent some points. */
function wonAndLevelled(s: GameSession): BattleState {
  const won = wonState(battleOf(s).setup);
  return {
    ...won,
    units: won.units.map((u): UnitState =>
      u.side === 'player'
        ? {
            ...u,
            level: u.level + 2,
            xp: 123,
            statPoints: 4,
            pilot: { ...u.pilot, pow: u.pilot.pow + 3 },
          }
        : u,
    ),
  };
}

describe('levels carry over from the first battle', () => {
  it('every company pilot who fought keeps level, XP, points and stats into battle 2', () => {
    const s = new GameSession(lib, undefined, { difficulty: 'knight' });
    playUntil(s, (v) => v.screen.kind === 'battle');
    const first = battleOf(s);
    const fought = first.setup.units.filter((u) => u.side === 'player');
    const company = s.state.roster.map((r) => r.characterId);
    // Everybody in the company must be a named character in the battle, or their progress is lost.
    for (const id of company) expect(fought.map((u) => u.characterId)).toContain(id);

    const after = wonAndLevelled(s);
    const earned = new Map(
      after.units.filter((u) => u.characterId).map((u) => [u.characterId!, u]),
    );
    s.finishBattle('victory', after);

    for (const entry of s.state.roster) {
      const u = earned.get(entry.characterId)!;
      expect(entry, entry.characterId).toMatchObject({
        level: u.level,
        xp: 123,
        statPoints: 4,
        stats: u.pilot,
      });
    }

    // …and on into the next battle.
    playUntil(s, (v) => v.screen.kind === 'battle');
    expect(battleOf(s).battleId).not.toBe(first.battleId);
    for (const unit of battleOf(s).setup.units) {
      const was = earned.get(unit.characterId ?? '');
      if (unit.side !== 'player' || !was) continue;
      expect(unit.level, unit.id).toBeGreaterThanOrEqual(was.level);
      expect(unit.xp, unit.id).toBe(123);
      expect(unit.stats.pow, unit.id).toBeGreaterThanOrEqual(was.pilot.pow);
    }
  });

  it('survives a save and a relaunch', () => {
    const s = new GameSession(lib, undefined, { difficulty: 'knight' });
    playUntil(s, (v) => v.screen.kind === 'battle');
    s.finishBattle('victory', wonAndLevelled(s));
    s.autosave();
    const again = GameSession.load(lib, 'auto')!;
    expect(again.state.roster.map((r) => [r.characterId, r.level, r.xp])).toEqual(
      s.state.roster.map((r) => [r.characterId, r.level, r.xp]),
    );
    expect(again.state.roster.every((r) => r.level >= 3)).toBe(true);
  });

  it('a pilot who falls in the battle still keeps what they earned', () => {
    const s = new GameSession(lib, undefined, { difficulty: 'knight' });
    playUntil(s, (v) => v.screen.kind === 'battle');
    const after = wonAndLevelled(s);
    const fallen = {
      ...after,
      units: after.units.map((u) =>
        u.side === 'player' && u.characterId !== 'ninu' ? { ...u, hp: 0, defeated: true } : u,
      ),
    };
    s.finishBattle('victory', fallen);
    expect(s.state.roster.every((r) => r.level >= 3)).toBe(true);
  });
});
