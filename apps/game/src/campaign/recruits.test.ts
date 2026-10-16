import { enemyAverageLevel, loadLibrary, nextBattleId, raisedTo } from '@m1565/content';
import { beforeEach, describe, expect, it } from 'vitest';
import { readSave } from '../platform/storage';
import { GameSession } from './GameSession';
import { newRosterEntry } from './progression';
import { installFakePlatform, playUntil } from './testkit';
import type { CampaignSave } from './types';

const lib = loadLibrary();

beforeEach(() => {
  installFakePlatform();
});

describe('the campaign order', () => {
  it('names the next battle: the prologue first, then the chosen route', () => {
    expect(nextBattleId(lib, '', [])).toBe('b1-marsaxlokk');
    expect(nextBattleId(lib, '', ['b1-marsaxlokk', 'b2-marsa-wells'])).toBe('b3-sciberras');
    const prologue = lib.order.prologue;
    expect(nextBattleId(lib, '', prologue)).toBeNull();
    expect(nextBattleId(lib, 'cross', prologue)).toBe('a1-piccolo-soccorso');
    expect(nextBattleId(lib, 'crescent', [...prologue, 'c1-marsa-camp'])).toBe('c6-boat-road');
    // Skirmishes won in between do not move the story along.
    expect(nextBattleId(lib, 'cross', [...prologue, 's7-sapper-nest'])).toBe('a1-piccolo-soccorso');
  });

  it('lists every story battle exactly once per route', () => {
    for (const route of Object.keys(lib.order.routes)) {
      const all = [...lib.order.prologue, ...lib.order.routes[route]!];
      expect(new Set(all).size, route).toBe(all.length);
    }
  });

  it('the enemies get steadily stronger along every route, finishing around Lv 23–27', () => {
    for (const route of Object.keys(lib.order.routes)) {
      const roster = [...lib.order.prologue, ...lib.order.routes[route]!].filter(
        (b) => !lib.order.interludes.includes(b),
      );
      const avg = roster.map((b) => enemyAverageLevel(lib, b));
      for (let i = 1; i < avg.length; i++)
        expect(avg[i]!, `${route} ${roster[i]}`).toBeGreaterThanOrEqual(avg[i - 1]!);
      expect(avg[0], route).toBeLessThanOrEqual(2);
      expect(avg.at(-1)!, route).toBeGreaterThanOrEqual(23);
      expect(avg.at(-1)!, route).toBeLessThanOrEqual(27);
    }
  });

  it('a higher difficulty meets stronger enemies', () => {
    expect(enemyAverageLevel(lib, 'a3-castile-breach', 'grandMaster')).toBeGreaterThan(
      enemyAverageLevel(lib, 'a3-castile-breach', 'squire'),
    );
  });
});

describe('raising a pilot to a level', () => {
  const base = newRosterEntry(lib, 'kateri');

  it('sets the level and the expected build, and restarts XP', () => {
    const r = raisedTo(lib, { ...base, xp: 77 }, 8);
    expect(r.level).toBe(8);
    expect(r.xp).toBe(0);
    expect(r.stats.dex).toBeGreaterThan(base.stats.dex);
  });

  it('never lowers a level or takes away a stat the pilot has earned', () => {
    const strong = { ...base, level: 12, stats: { ...base.stats, pow: 30 } };
    expect(raisedTo(lib, strong, 5)).toBe(strong);
    expect(raisedTo(lib, strong, 20).stats.pow).toBe(30);
  });
});

describe('recruits arrive at the level of the enemies they are about to face', () => {
  const levelOf = (s: GameSession, id: string) =>
    s.state.roster.find((r) => r.characterId === id)?.level;

  it('Kateri and Luis join at the level of the next battle, not at level 1', () => {
    const s = new GameSession(lib, undefined, { difficulty: 'knight' });
    playUntil(
      s,
      (v) => v.screen.kind === 'battle' && v.roster.some((r) => r.characterId === 'luis'),
    );
    expect(levelOf(s, 'kateri')).toBeGreaterThanOrEqual(2);
    expect(levelOf(s, 'luis')).toBe(enemyAverageLevel(lib, 'b3-sciberras'));
  });

  it('Deniz and Yusuf, joining for the Tigné interlude, match its enemies', () => {
    const s = new GameSession(lib, undefined, { difficulty: 'knight' });
    playUntil(
      s,
      (v) => v.screen.kind === 'battle' && v.roster.some((r) => r.characterId === 'deniz'),
    );
    const need = enemyAverageLevel(lib, 'b5-tigne');
    expect(need).toBeGreaterThanOrEqual(4);
    expect(levelOf(s, 'deniz')).toBeGreaterThanOrEqual(need);
    expect(levelOf(s, 'yusuf')).toBeGreaterThanOrEqual(need);
  });

  it('Deniz, who sat out the long middle of the war, rejoins the Crescent route at its level', () => {
    const s = new GameSession(lib, undefined, { difficulty: 'knight' });
    playUntil(
      s,
      (v) => v.screen.kind === 'battle' && v.screen.battleId === 'c1-marsa-camp',
      /Find the other half|Let him go/,
    );
    expect(levelOf(s, 'deniz')).toBeGreaterThanOrEqual(enemyAverageLevel(lib, 'c1-marsa-camp'));
  });
});

describe('saves made before the level curve was retuned', () => {
  it('are caught up to within a few levels of the next battle’s enemies, once', () => {
    const s = new GameSession(lib, undefined, { difficulty: 'knight' });
    playUntil(
      s,
      (v) => v.completedBattles.includes('b4-night-crossing') && v.screen.kind === 'prep',
    );
    expect(s.saveTo('slot1')).toBe(true);
    const save = readSave<CampaignSave>('slot1')!;
    expect(save.curve).toBeGreaterThanOrEqual(2);
    const old = {
      ...save,
      curve: undefined,
      roster: save.roster.map((r) => ({ ...r, level: 1, xp: 0 })),
    } as unknown as CampaignSave;
    delete (old as { curve?: number }).curve;
    const caught = new GameSession(lib, old);
    const next = nextBattleId(lib, '', old.completedBattles)!;
    const floor = enemyAverageLevel(lib, next) - 3;
    expect(floor).toBeGreaterThan(1);
    for (const r of caught.state.roster)
      expect(r.level, r.characterId).toBeGreaterThanOrEqual(floor);
    // A save already on the new curve is left alone.
    const fresh = new GameSession(lib, { ...old, curve: 2 });
    expect(fresh.state.roster.every((r) => r.level === 1)).toBe(true);
  });
});
