import type { BalanceConfig } from './balance';
import type { Coord, Facing } from './grid';

export type Side = 'player' | 'enemy';
export type Controller = 'human' | 'ai';
/** How the AI plays this unit: charge in, only strike what it can reach, or never move. */
export type AiProfile = 'aggressive' | 'defensive' | 'hold';

export interface Weapon {
  readonly id: string;
  readonly name: string;
  readonly power: number;
  /** Base hit chance in percentage points. */
  readonly accuracy: number;
  readonly apCost: number;
  readonly fpCost: number;
  readonly minRange: number;
  readonly maxRange: number;
}

/** An Armatura chassis. */
export interface Frame {
  readonly id: string;
  readonly name: string;
  readonly hp: number;
  readonly armour: number;
  /** Maximum tiles per move. */
  readonly move: number;
  /** Added to the pilot's AGI. Heavy frames are negative. */
  readonly agility: number;
}

export interface PilotStats {
  readonly str: number;
  readonly skl: number;
  readonly agi: number;
}

/** Everything needed to put a unit on the field. Resolved from content by the loader. */
export interface UnitSpec {
  readonly id: string;
  readonly name: string;
  readonly side: Side;
  readonly controller: Controller;
  readonly ai?: AiProfile;
  readonly level: number;
  readonly stats: PilotStats;
  readonly frame: Frame;
  readonly weapon: Weapon;
  readonly at: Coord;
  readonly facing: Facing;
}

/** Live, serializable unit state. Derived numbers are baked in at battle start. */
export interface UnitState {
  id: string;
  name: string;
  side: Side;
  controller: Controller;
  ai: AiProfile;
  frameId: string;
  weapon: Weapon;
  level: number;
  xp: number;
  maxHp: number;
  hp: number;
  ap: number;
  fp: number;
  str: number;
  skl: number;
  agi: number;
  arm: number;
  mov: number;
  pos: Coord;
  facing: Facing;
  defeated: boolean;
}

export function createUnit(spec: UnitSpec, balance: BalanceConfig): UnitState {
  return {
    id: spec.id,
    name: spec.name,
    side: spec.side,
    controller: spec.controller,
    ai: spec.ai ?? 'aggressive',
    frameId: spec.frame.id,
    weapon: spec.weapon,
    level: spec.level,
    xp: 0,
    maxHp: spec.frame.hp,
    hp: spec.frame.hp,
    ap: balance.apStart,
    fp: 0,
    str: spec.stats.str,
    skl: spec.stats.skl,
    agi: spec.stats.agi + spec.frame.agility,
    arm: spec.frame.armour,
    mov: spec.frame.move,
    pos: { ...spec.at },
    facing: spec.facing,
    defeated: false,
  };
}

export function isHostile(a: Pick<UnitState, 'side'>, b: Pick<UnitState, 'side'>): boolean {
  return a.side !== b.side;
}
