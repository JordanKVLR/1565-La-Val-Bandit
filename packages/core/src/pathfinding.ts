import type { Coord } from './grid';
import { DIRECTIONS, inBounds } from './grid';
import type { BattleState } from './state';
import { heightAt, terrainAt, unitAt } from './state';
import type { UnitState } from './units';
import { isHostile } from './units';

export interface Reach {
  /** Total AP to get here. */
  readonly cost: number;
  /** Tiles walked, start excluded. */
  readonly path: readonly Coord[];
}

export const coordKey = (c: Coord): string => `${c.x},${c.y}`;

/** AP to step from one tile to a neighbour, or null if the step is impossible. */
export function stepCost(state: BattleState, from: Coord, to: Coord): number | null {
  if (!inBounds(state.map, to)) return null;
  const terrain = terrainAt(state, to);
  if (!terrain || terrain.impassable) return null;
  const climb = heightAt(state, to) - heightAt(state, from);
  if (Math.abs(climb) > state.balance.maxClimb) return null;
  return terrain.moveCost + Math.max(0, climb) * state.balance.climbApPerStep;
}

/**
 * Every tile the unit can end its move on, with the cheapest path. Enemies block movement;
 * allies can be passed through but not stopped on. Limited by both AP and the frame's MOV.
 * Search state is (tile, steps) so a cheap-but-long path never hides a short one.
 */
export function reachableTiles(
  state: BattleState,
  unit: UnitState,
  apBudget: number = unit.ap,
): Map<string, Reach> {
  interface Node extends Reach {
    readonly at: Coord;
  }
  const best = new Map<string, number>(); // `${x},${y},${steps}` -> cost
  const open: Node[] = [{ at: unit.pos, cost: 0, path: [] }];
  const result = new Map<string, Reach>();

  while (open.length) {
    // Small maps: a linear scan beats a heap in both simplicity and practice.
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i]!.cost < open[bi]!.cost) bi = i;
    const node = open.splice(bi, 1)[0]!;
    const key = coordKey(node.at);
    const occupant = unitAt(state, node.at);
    const canStop = !occupant || occupant.id === unit.id;
    const known = result.get(key);
    if (canStop && (!known || node.cost < known.cost))
      result.set(key, { cost: node.cost, path: node.path });
    if (node.path.length >= unit.mov) continue;

    for (const d of Object.values(DIRECTIONS)) {
      const next = { x: node.at.x + d.x, y: node.at.y + d.y };
      const cost = stepCost(state, node.at, next);
      if (cost === null || node.cost + cost > apBudget) continue;
      const blocker = unitAt(state, next);
      if (blocker && isHostile(blocker, unit)) continue;
      const steps = node.path.length + 1;
      const sk = `${next.x},${next.y},${steps}`;
      const total = node.cost + cost;
      if ((best.get(sk) ?? Infinity) <= total) continue;
      best.set(sk, total);
      open.push({ at: next, cost: total, path: [...node.path, next] });
    }
  }
  return result;
}
