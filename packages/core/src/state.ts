import type { BalanceConfig } from './balance';
import type { Bond } from './bonds';
import type { BattleMap, Coord, Facing, Tile } from './grid';
import { getTile } from './grid';
import type { RngState } from './rng';
import type { TerrainType } from './terrain';
import type { UnitSpec, UnitState } from './units';

export type VictoryCondition =
  | { readonly type: 'rout' }
  | { readonly type: 'defeatLeader'; readonly unitId: string }
  /** Win once this many full rounds have been survived. */
  | { readonly type: 'survive'; readonly rounds: number }
  /** Win when the named unit, still standing, reaches any of these tiles. */
  | { readonly type: 'escape'; readonly unitId: string; readonly tiles: readonly Coord[] };

/** When a scripted event fires. */
export type ScriptTrigger =
  /** At the start of this round (round 1 fires as the battle begins). */
  | { readonly type: 'round'; readonly round: number }
  /** As soon as this unit falls. */
  | { readonly type: 'defeated'; readonly unitId: string };

export type ScriptAction =
  /** Units arrive, each on its tile or the nearest free walkable one. */
  | { readonly type: 'reinforce'; readonly units: readonly UnitSpec[] }
  /** The ground changes (a palisade burns, a gate gives way). */
  | { readonly type: 'terrain'; readonly tiles: readonly Coord[]; readonly terrain: string }
  /** A line shown to the player (and the battle log). */
  | { readonly type: 'message'; readonly text: string; readonly speaker?: string };

/** Something the battle does by itself at a set moment. Each fires once. */
export interface ScriptedEvent {
  readonly id: string;
  readonly when: ScriptTrigger;
  readonly actions: readonly ScriptAction[];
}

/**
 * An optional goal for extra reward, judged when the battle is won. The reward is scudi and
 * parts, paid once per goal.
 */
export type BonusGoal = (
  | { readonly type: 'rounds'; readonly max: number }
  | { readonly type: 'noLosses' }
  | { readonly type: 'keepAlive'; readonly unitId: string }
) & { readonly scudi: number; readonly parts: number };

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
  /** Bonds between named allies (absent in older saves, meaning none). */
  bonds?: Bond[];
  /** Scripted events that have not fired yet (absent in older saves, meaning none). */
  script?: ScriptedEvent[];
  /** Optional goals for extra reward (absent in older saves, meaning none). */
  bonus?: BonusGoal[];
  outcome: Outcome;
}

export interface BattleSetup {
  readonly map: BattleMap;
  readonly terrains: ReadonlyMap<string, TerrainType> | Readonly<Record<string, TerrainType>>;
  readonly balance: BalanceConfig;
  readonly units: readonly UnitSpec[];
  readonly victory: readonly VictoryCondition[];
  readonly defeat?: readonly DefeatCondition[];
  readonly bonds?: readonly Bond[];
  readonly script?: readonly ScriptedEvent[];
  readonly bonus?: readonly BonusGoal[];
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
