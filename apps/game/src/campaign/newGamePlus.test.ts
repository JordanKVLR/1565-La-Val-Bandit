import { loadLibrary } from '@m1565/content';
import { beforeEach, describe, expect, it } from 'vitest';
import { readSave } from '../platform/storage';
import { GameSession } from './GameSession';
import { countOf } from './inventory';
import { canStartNewGamePlus, newGamePlus, refitKit } from './newGamePlus';
import { newRosterEntry } from './progression';
import { installFakePlatform, playUntil } from './testkit';
import type { CampaignSave, RosterEntry } from './types';

const lib = loadLibrary();
let platform: ReturnType<typeof installFakePlatform>;

beforeEach(() => {
  platform = installFakePlatform();
});

const CROSS = /Stand with the Order/;

/** A whole playthrough on the Order's route, saved at its ending. */
function finishedSave(): CampaignSave {
  const s = new GameSession(lib, undefined, { difficulty: 'knight' });
  playUntil(s, () => false, CROSS);
  expect(s.state.screen.kind).toBe('end');
  return readSave<CampaignSave>('auto')!;
}

/** The finished company made veteran: high level, unspent points, a charm and a bought blade. */
function veteranise(save: CampaignSave): CampaignSave {
  const roster = save.roster.map((r): RosterEntry => ({
    ...r,
    level: 14,
    xp: 230,
    statPoints: 2,
    stats: { ...r.stats, pow: r.stats.pow + 5 },
    ...(r.characterId === 'ninu' ? { weapon: 'pike', charm: 'charm-pow-1' } : {}),
  }));
  return { ...save, roster, scudi: 4321 };
}

describe('reaching an ending', () => {
  it('records the ending, unlocks its achievement and offers New Game+', () => {
    const save = finishedSave();
    expect(save.ending).toBe('cross');
    expect(platform.unlocked).toContain('ACH_ENDING_CROSS');
    expect(canStartNewGamePlus(save)).toBe(true);
    expect(canStartNewGamePlus({ ending: null })).toBe(false);
    expect(canStartNewGamePlus(null)).toBe(false);
  });
});

describe('New Game+', () => {
  it('carries progress, gear, stores and scudi; story progress starts over', () => {
    const save = veteranise(finishedSave());
    const opts = newGamePlus(lib, save);
    expect(opts).toMatchObject({ difficulty: 'knight', ngPlus: 1 });
    const carry = opts.carry!;
    expect(carry.scudi).toBe(4321);
    expect(carry.veterans['ninu']).toMatchObject({ level: 14, xp: 230, statPoints: 2 });
    expect(carry.kit['ninu']).toMatchObject({ weapon: 'pike', charm: 'charm-pow-1' });
    // Fitted items wait in the stores; a pilot's own starting kit returns with them instead.
    expect(countOf(carry.stores, 'weapon', 'pike')).toBe(
      countOf(save.stores, 'weapon', 'pike') + 1,
    );
    expect(countOf(carry.stores, 'charm', 'charm-pow-1')).toBe(
      countOf(save.stores, 'charm', 'charm-pow-1') + 1,
    );
    const ninu = lib.characters.get('ninu')!;
    expect(countOf(carry.stores, 'frame', ninu.frame)).toBe(
      countOf(save.stores, 'frame', ninu.frame),
    );

    const s = new GameSession(lib, undefined, opts);
    expect(s.state).toMatchObject({ ngPlus: 1, ending: null, scudi: 4321, completedBattles: [] });
    expect(s.getVar('route')).not.toBe('cross');
  });

  it('returning pilots join with their carried level, stats and gear; enemies are tougher', () => {
    const save = veteranise(finishedSave());
    const s = new GameSession(lib, undefined, newGamePlus(lib, save));
    playUntil(s, (v) => v.screen.kind === 'battle');
    const ninu = s.state.roster.find((r) => r.characterId === 'ninu')!;
    const was = save.roster.find((r) => r.characterId === 'ninu')!;
    expect(ninu).toMatchObject({
      level: 14,
      xp: 230,
      statPoints: 2,
      stats: was.stats,
      weapon: 'pike',
      charm: 'charm-pow-1',
    });
    expect(s.state.kit['ninu']).toBeUndefined();
    expect(s.state.veterans['ninu']).toBeUndefined();

    // The first battle's enemies gain the per-cycle levels.
    const screen = s.state.screen;
    if (screen.kind !== 'battle') throw new Error('expected a battle');
    const fresh = new GameSession(lib);
    playUntil(fresh, (v) => v.screen.kind === 'battle');
    const firstLevels = (g: GameSession) => {
      const sc = g.state.screen;
      return sc.kind === 'battle'
        ? sc.setup.units.filter((u) => u.side === 'enemy').map((u) => u.level)
        : [];
    };
    expect(firstLevels(s)).toEqual(
      firstLevels(fresh).map((l) => l + lib.balance.ngPlusEnemyLevelPerCycle),
    );
  });

  it('pilots who join later keep their carried progress, and the ending unlocks again', () => {
    const save = veteranise(finishedSave());
    const s = new GameSession(lib, undefined, newGamePlus(lib, save));
    const later = save.roster.find((r) => r.characterId !== 'ninu')!.characterId;
    playUntil(s, (v) => v.roster.some((r) => r.characterId === later), CROSS);
    expect(s.state.roster.find((r) => r.characterId === later)).toMatchObject({
      level: 14,
      xp: 230,
    });
    platform.unlocked.length = 0;
    playUntil(s, () => false, CROSS);
    expect(s.state.ending).toBe('cross');
    expect(platform.unlocked).toContain('ACH_ENDING_CROSS');
    s.autosave();
    const again = readSave<CampaignSave>('auto')!;
    expect(again.ngPlus).toBe(1);
    // Cycles stack.
    expect(newGamePlus(lib, again).ngPlus).toBe(2);
  });

  it('a pilot who leaves the company keeps their progress', () => {
    const s = new GameSession(lib);
    let had = false;
    playUntil(s, (v) => {
      const has = v.roster.some((r) => r.characterId === 'luis');
      had ||= has;
      return had && !has;
    });
    expect(s.state.veterans['luis']).toBeDefined();
  });
});

describe('refitKit', () => {
  const base = {
    roster: [newRosterEntry(lib, 'ninu')],
    stores: { 'weapon:pike': 1, 'charm:charm-pow-1': 1 },
    scudi: 0,
  };
  const own = base.roster[0]!;

  it('fits what is in the stores and returns the story kit to them', () => {
    const h = refitKit(lib, base, 'ninu', {
      frame: own.frame,
      weapon: 'pike',
      charm: 'charm-pow-1',
      amulet: null,
    });
    expect(h.roster[0]).toMatchObject({ weapon: 'pike', charm: 'charm-pow-1' });
    expect(h.stores).toEqual({ [`weapon:${own.weapon}`]: 1 });
  });

  it('skips items that are gone or that the pilot cannot use', () => {
    const h = refitKit(lib, base, 'ninu', {
      frame: 'levend', // an Ottoman armatura: not for a Maltese pilot
      weapon: 'arquebus', // not in the stores
      charm: null,
      amulet: null,
    });
    expect(h).toBe(base);
    expect(refitKit(lib, base, 'nobody', { frame: 'x', weapon: 'y' })).toBe(base);
  });
});
