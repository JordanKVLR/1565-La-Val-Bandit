import type { BalanceConfig } from './balance';
import type { BattleMap, Coord, Facing, Tile } from './grid';
import { getTile } from './grid';
import type { RngState } from './rng';
import type { TerrainType } from './terrain';
import type { UnitSpec, UnitState } from './units';

export type VictoryCondition =
  | { readonly type: 'rout' }
  | { readonly type: 'defeatLeader'; readonly unitId: string }
  /** Win once this many full rounds have been survived. */
  | { readonly type: 'survive'; readonly rounds: number };

/** Losing every player unit always loses; these add extra ways to lose. */
export type DefeatCondition = { readonly type: 'protect'; readonly unitId: string };

export type Outcome = 'ongoing' | 'victory' | 'defeat';

export interface TurnState {
  unitId: string;
  moved: boolean;
  acted: boolean;
  /** Snapshot for undoing a move before acting. */
  startPos: Coord;
  startFacing: Facing;
  startAp: number;
}

export interface BattleState {
  saveVersion: number;
  map: BattleMap;
  terrains: Record<string, TerrainType>;
  balance: BalanceConfig;
  units: UnitState[];
  round: number;
  turnOrder: string[];
  turnIndex: number;
  turn: TurnState | null;
  rng: RngState;
  victory: VictoryCondition[];
  defeat: DefeatCondition[];
  outcome: Outcome;
}

export interface BattleSetup {
  readonly map: BattleMap;
  readonly terrains: ReadonlyMap<string, TerrainType> | Readonly<Record<string, TerrainType>>;
  readonly balance: BalanceConfig;
  readonly units: readonly UnitSpec[];
  readonly victory: readonly VictoryCondition[];
  readonly defeat?: readonly DefeatCondition[];
  readonly seed: number;
}

export function findUnit(state: BattleState, id: string): UnitState | undefined {
  return state.units.find((u) => u.id === id);
}

export function requireUnit(state: BattleState, id: string): UnitState {
  const unit = findUnit(state, id);
  if (!unit) throw new Error(`Unknown unit "${id}"`);
  return unit;
}

export function unitAt(state: BattleState, c: Coord): UnitState | undefined {
  return state.units.find((u) => !u.defeated && u.pos.x === c.x && u.pos.y === c.y);
}

export function livingUnits(state: BattleState): UnitState[] {
  return state.units.filter((u) => !u.defeated);
}

export function tileAt(state: BattleState, c: Coord): Tile | undefined {
  return getTile(state.map, c);
}

export function terrainAt(state: BattleState, c: Coord): TerrainType | undefined {
  const tile = getTile(state.map, c);
  return tile && state.terrains[tile.terrain];
}

export function heightAt(state: BattleState, c: Coord): number {
  return getTile(state.map, c)?.height ?? 0;
}

export function activeUnit(state: BattleState): UnitState | undefined {
  return state.turn ? findUnit(state, state.turn.unitId) : undefined;
}
