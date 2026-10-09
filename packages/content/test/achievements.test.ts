import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Achievement, AchievementEvent, AchievementTrigger, TrophyGrade } from '../src';
import {
  achievementsForEvent,
  battleSources,
  EVENT_TRIGGERS,
  loadAchievements,
  loadLibrary,
  metaAchievements,
} from '../src';

const list = loadAchievements();
const lib = loadLibrary();

/** The routes the story can set (`~ route = "…"`), read from the ink sources. */
function storyRoutes(): Set<string> {
  const dir = resolve(__dirname, '../story');
  const routes = new Set<string>();
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.ink'))) {
    for (const m of readFileSync(resolve(dir, file), 'utf8').matchAll(/~\s*route\s*=\s*"(\w+)"/g))
      routes.add(m[1]!);
  }
  return routes;
}

/** An event that earns `trigger`, or null for the meta and manual ones. */
function sampleEvent(t: AchievementTrigger): AchievementEvent | null {
  switch (t.type) {
    case 'battleWon':
      return {
        type: 'battleWon',
        battle: t.battles?.[0] ?? 'b1-marsaxlokk',
        difficulty: t.difficulty ?? 'knight',
        noLosses: !!t.noLosses,
        round: t.maxRound ?? 9,
      };
    case 'ending':
      return {
        type: 'ending',
        route: t.route ?? 'cross',
        difficulty: t.difficulty ?? 'knight',
        ngPlus: t.minNgPlus ?? 0,
      };
    case 'newGamePlus':
      return { type: 'newGamePlus', cycle: 1 };
    case 'skillUnlocked':
      return { type: 'skillUnlocked', level: t.minLevel };
    case 'itemBought':
      return { type: 'itemBought' };
    case 'gearFitted':
      return { type: 'gearFitted', tiers: t.tier ? [t.tier] : [], fullKit: !!t.fullKit };
    case 'scudiHeld':
      return { type: 'scudiHeld', amount: t.amount };
    case 'codexRead':
      return { type: 'codexRead', read: t.all ? 25 : 1, total: 25 };
    default:
      return null;
  }
}

describe('achievement and trophy registry', () => {
  it('is a full list for the campaign with unique, stable ids and names', () => {
    expect(list.length).toBeGreaterThanOrEqual(30);
    expect(list.length).toBeLessThanOrEqual(45);
    expect(new Set(list.map((a) => a.id)).size).toBe(list.length);
    expect(new Set(list.map((a) => a.name)).size).toBe(list.length);
    // Shipped Steamworks API names never change: they key players' existing unlocks.
    for (const id of [
      'ACH_FIRST_STAND',
      'ACH_OTHER_SHORE',
      'ACH_ST_ELMO',
      'ACH_ENDING_CROSS',
      'ACH_ENDING_ISLAND',
      'ACH_ENDING_CRESCENT',
    ]) {
      expect(list.map((a) => a.id)).toContain(id);
    }
  });

  it('has exactly one platinum and a sensible spread of grades', () => {
    const count = (g: TrophyGrade) => list.filter((a) => a.grade === g).length;
    expect(count('platinum')).toBe(1);
    expect(count('gold')).toBeGreaterThanOrEqual(4);
    expect(count('gold')).toBeLessThan(count('silver') + count('bronze'));
    expect(count('bronze')).toBeGreaterThanOrEqual(8);
  });

  it('names only battles, routes and skill levels that exist', () => {
    const routes = storyRoutes();
    expect([...routes].sort()).toEqual(['crescent', 'cross', 'island']);
    const skillLevels = new Set(
      [...lib.skillSets.values()].flatMap((list) => list.map((s) => s.level)),
    );
    for (const a of list) {
      const t = a.trigger;
      if (t.type === 'battleWon')
        for (const b of t.battles ?? []) expect(battleSources, `${a.id}: ${b}`).toHaveProperty(b);
      if (t.type === 'ending' && t.route) expect(routes, a.id).toContain(t.route);
      if (t.type === 'skillUnlocked') expect(skillLevels, a.id).toContain(t.minLevel);
    }
  });

  it('covers every route: its finale battle and its ending', () => {
    for (const finale of ['a9-marsa-lines', 'i9-st-pauls-bay', 'c9-st-pauls-bay']) {
      expect(
        list.some(
          (a) =>
            a.trigger.type === 'battleWon' &&
            a.trigger.battles?.length === 1 &&
            a.trigger.battles[0] === finale,
        ),
        finale,
      ).toBe(true);
    }
    for (const route of storyRoutes()) {
      expect(list.some((a) => a.trigger.type === 'ending' && a.trigger.route === route)).toBe(true);
    }
  });

  it('every entry but the platinum is earned by a reported event, a meta rule or by hand', () => {
    for (const a of list) {
      const t = a.trigger;
      if (t.type === 'platinum' || t.type === 'allEndings') continue;
      if (t.type === 'manual') {
        expect(t.reason.length, a.id).toBeGreaterThan(10);
        continue;
      }
      expect(EVENT_TRIGGERS as readonly string[], a.id).toContain(t.type);
      const event = sampleEvent(t)!;
      expect(
        achievementsForEvent(list, event).map((x) => x.id),
        a.id,
      ).toContain(a.id);
    }
  });

  it('marks route spoilers hidden but keeps the first battle of each route visible', () => {
    const byId = new Map(list.map((a) => [a.id, a] as const));
    for (const id of ['ACH_CROSS_FINALE', 'ACH_ENDING_CRESCENT', 'ACH_CRESCENT_MEDALLION'])
      expect(byId.get(id)?.hidden, id).toBe(true);
    for (const id of ['ACH_FIRST_STAND', 'ACH_CROSS_RELIEF', 'ACH_PLATINUM'])
      expect(byId.get(id)?.hidden, id).toBe(false);
  });
});

describe('matching events', () => {
  const ids = (e: AchievementEvent) => achievementsForEvent(list, e).map((a) => a.id);

  it('a battle win earns its battle, and flawless or fast wins earn more', () => {
    const base = {
      type: 'battleWon',
      battle: 'b1-marsaxlokk',
      difficulty: 'knight',
      noLosses: false,
      round: 6,
    } as const;
    expect(ids(base)).toEqual(['ACH_FIRST_STAND']);
    expect(ids({ ...base, noLosses: true })).toEqual(['ACH_FIRST_STAND', 'ACH_NO_LOSSES']);
    expect(ids({ ...base, round: 3 })).toContain('ACH_SWIFT_ROUT');
    // An escape battle won quickly is not a rout.
    expect(ids({ ...base, battle: 'b9-fall-of-st-elmo', round: 2 })).toEqual(['ACH_ST_ELMO']);
    expect(ids({ ...base, battle: 'b9-fall-of-st-elmo', difficulty: 'grandMaster' })).toEqual([
      'ACH_ST_ELMO',
      'ACH_GM_ST_ELMO',
    ]);
  });

  it('an ending earns its route, and New Game+ or Grand Master endings earn more', () => {
    const e = { type: 'ending', route: 'island', difficulty: 'knight', ngPlus: 0 } as const;
    expect(ids(e)).toEqual(['ACH_ENDING_ISLAND']);
    expect(ids({ ...e, ngPlus: 2, difficulty: 'grandMaster' }).sort()).toEqual(
      ['ACH_ENDING_ISLAND', 'ACH_GM_ENDING', 'ACH_NG_PLUS_ENDING'].sort(),
    );
  });

  it('skills, gear, scudi and notes', () => {
    expect(ids({ type: 'skillUnlocked', level: 5 })).toEqual(['ACH_FIRST_SKILL']);
    expect(ids({ type: 'skillUnlocked', level: 10 })).toEqual([
      'ACH_FIRST_SKILL',
      'ACH_THIRD_SKILL',
    ]);
    expect(ids({ type: 'gearFitted', tiers: ['common', 'fine'], fullKit: false })).toEqual([]);
    expect(ids({ type: 'gearFitted', tiers: ['masterwork'], fullKit: true })).toEqual([
      'ACH_MASTERWORK',
      'ACH_FULL_KIT',
    ]);
    expect(ids({ type: 'scudiHeld', amount: 4999 })).toEqual([]);
    expect(ids({ type: 'scudiHeld', amount: 5000 })).toEqual(['ACH_TREASURY']);
    expect(ids({ type: 'codexRead', read: 3, total: 25 })).toEqual(['ACH_CODEX_FIRST']);
    expect(ids({ type: 'codexRead', read: 25, total: 25 })).toEqual([
      'ACH_CODEX_FIRST',
      'ACH_CODEX_ALL',
    ]);
  });

  it('all endings, then the platinum once everything else is earned', () => {
    const endings = ['ACH_ENDING_CROSS', 'ACH_ENDING_ISLAND', 'ACH_ENDING_CRESCENT'];
    expect(metaAchievements(list, new Set(endings.slice(0, 2)))).toEqual([]);
    expect(metaAchievements(list, new Set(endings)).map((a) => a.id)).toEqual(['ACH_ALL_ENDINGS']);
    const allButPlatinum = new Set(
      list.filter((a: Achievement) => a.grade !== 'platinum').map((a) => a.id),
    );
    expect(metaAchievements(list, allButPlatinum).map((a) => a.id)).toEqual(['ACH_PLATINUM']);
  });

  it('rejects a registry with duplicate ids or a stray platinum', () => {
    const one = list[0]!;
    expect(() => loadAchievements([one, one])).toThrow(/Duplicate/);
    expect(() => loadAchievements([{ ...one, grade: 'platinum' }])).toThrow(/platinum/);
  });
});
