import type { Bond, Difficulty } from '@m1565/core';
import { enemyScaling, scaleEnemyLevel } from '@m1565/core';
import type { Library, RosterEntry } from './index';
import { battleSources } from './index';
import { statsAtLevel } from './progression';
import type { CampScene, Recipe } from './schemas';
import { BattleSourceSchema } from './schemas';

/** Story variables that bond scores live in, plus the other facts camp scenes read and write. */
export function campVars(lib: Library): string[] {
  return [
    ...new Set([
      ...lib.bondTable.bonds.map((b) => b.var),
      'helped_village',
      'obeyed_orders',
      'showed_medallion',
      'route',
    ]),
  ];
}

/** Rank (0–3) a bond score reaches against the table's thresholds. */
export function bondRankFor(lib: Library, score: number): number {
  return lib.bondTable.thresholds.filter((t) => score >= t).length;
}

/** The bonds that are active, given the current value of each bond variable. */
export function activeBonds(lib: Library, vars: Readonly<Record<string, number>>): Bond[] {
  return lib.bondTable.bonds
    .map((b) => ({ a: b.a, b: b.b, rank: bondRankFor(lib, Number(vars[b.var] ?? 0)) }))
    .filter((b) => b.rank > 0);
}

/**
 * Camp talks on offer: the battle they follow is won, the route matches, nobody in the scene
 * has left the company, and they haven't been heard yet. A scene with Ninu in it needs only
 * the others to be here.
 */
export function availableCamp(
  lib: Library,
  completed: readonly string[],
  route: string,
  done: readonly string[],
  present: readonly string[],
): CampScene[] {
  return lib.camp.filter(
    (c) =>
      completed.includes(c.after) &&
      (!c.route || c.route === route) &&
      !done.includes(c.id) &&
      c.with.every((w) => present.includes(w)),
  );
}

/** Workshop recipes unlocked by the battles won so far. */
export function availableRecipes(lib: Library, completed: readonly string[]): Recipe[] {
  return lib.recipes.filter((r) => r.after === null || completed.includes(r.after));
}

/**
 * The next battle the story will play: the first of the prologue and then the chosen route's
 * battles that has not been won yet (null once the route is done, or before a route is chosen
 * and the prologue is over).
 */
export function nextBattleId(
  lib: Library,
  route: string,
  completed: readonly string[],
): string | null {
  const order = [...lib.order.prologue, ...(lib.order.routes[route] ?? [])];
  return order.find((b) => !completed.includes(b)) ?? null;
}

/**
 * The average level of a battle's enemies as the player will meet them (with the difficulty's
 * level bonus), rounded: the level a new recruit should arrive at.
 */
export function enemyAverageLevel(
  lib: Library,
  battleId: string,
  difficulty: Difficulty = 'knight',
  ngPlus = 0,
): number {
  const raw = battleSources[battleId as keyof typeof battleSources];
  if (!raw) return 1;
  const scaling = enemyScaling(lib.balance, difficulty, ngPlus);
  const levels = BattleSourceSchema.parse(raw)
    .units.filter((u) => u.side === 'enemy')
    .map((u) => scaleEnemyLevel(u.level, scaling));
  return levels.length
    ? Math.max(1, Math.round(levels.reduce((a, b) => a + b, 0) / levels.length))
    : 1;
}

/**
 * A pilot brought up to `level` (never lowered): each stat is the better of what they have and
 * the expected build for that level, so earned points are never taken away. XP restarts at the
 * new level.
 */
export function raisedTo(lib: Library, entry: RosterEntry, level: number): RosterEntry {
  if (entry.level >= level) return entry;
  const c = lib.characters.get(entry.characterId);
  if (!c) return entry;
  const expected = statsAtLevel(c, level, lib.balance.statPointsPerLevel);
  const stats = { ...entry.stats };
  for (const k of Object.keys(stats) as (keyof typeof stats)[])
    stats[k] = Math.max(stats[k], expected[k]);
  return { ...entry, level, xp: 0, stats };
}
