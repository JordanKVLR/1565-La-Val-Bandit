import type { BattleEvent } from './events';
import { createRng } from './rng';
import type { BattleSetup, BattleState } from './state';
import type { TerrainType } from './terrain';
import { startRound } from './turns';
import { createUnit } from './units';

export const SAVE_VERSION = 3;

/** Builds a fresh battle and starts round 1 (the first unit's turn is already active). */
export function createBattle(setup: BattleSetup): { state: BattleState; events: BattleEvent[] } {
  const terrains: Record<string, TerrainType> =
    setup.terrains instanceof Map ? Object.fromEntries(setup.terrains) : { ...setup.terrains };
  const ids = new Set<string>();
  for (const u of setup.units) {
    if (ids.has(u.id)) throw new Error(`Duplicate unit id "${u.id}"`);
    ids.add(u.id);
  }
  const state: BattleState = {
    saveVersion: SAVE_VERSION,
    map: setup.map,
    terrains,
    balance: setup.balance,
    units: setup.units.map((spec) => createUnit(spec, setup.balance)),
    round: 0,
    turnOrder: [],
    turnIndex: -1,
    turn: null,
    rng: createRng(setup.seed),
    victory: [...setup.victory],
    defeat: [...(setup.defeat ?? [])],
    outcome: 'ongoing',
  };
  const events: BattleEvent[] = [];
  startRound(state, events);
  return { state, events };
}
