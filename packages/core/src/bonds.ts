import type { Coord } from './grid';
import { manhattan } from './grid';
import type { BattleState } from './state';
import type { UnitState } from './units';

/**
 * A bond between two named characters, earned through camp talks and shared battles. While the
 * two fight within `bondRange` tiles of each other, each strikes harder and truer and takes a
 * little less from blows; a deeper bond (rank 1–3) multiplies those effects.
 */
export interface Bond {
  readonly a: string;
  readonly b: string;
  readonly rank: number;
}

/**
 * The deepest bond `unit` has with a living ally standing within range of `at` (0 if none).
 * Bonds are between character ids, so generic units never have one.
 */
export function bondRankAt(state: BattleState, unit: UnitState, at: Coord = unit.pos): number {
  const bonds = state.bonds;
  if (!bonds?.length || !unit.characterId) return 0;
  let best = 0;
  for (const bond of bonds) {
    const other =
      bond.a === unit.characterId ? bond.b : bond.b === unit.characterId ? bond.a : undefined;
    if (!other || bond.rank <= best) continue;
    const ally = state.units.find(
      (u) =>
        u.characterId === other &&
        !u.defeated &&
        u.side === unit.side &&
        manhattan(u.pos, at) <= state.balance.bondRange,
    );
    if (ally) best = bond.rank;
  }
  return best;
}
