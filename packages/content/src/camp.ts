import type { Bond } from '@m1565/core';
import type { Library } from './index';
import type { CampScene, Recipe } from './schemas';

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
