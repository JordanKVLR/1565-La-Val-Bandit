import type { Attack } from './attacks';
import { starterAttacks } from './attacks';
import type { BalanceConfig } from './balance';
import type { Coord, Facing } from './grid';

export type Side = 'player' | 'enemy';
export type Controller = 'human' | 'ai';
/** How the AI plays this unit: charge in, only strike what it can reach, or never move. */
export type AiProfile = 'aggressive' | 'defensive' | 'hold';

export type WeaponType = 'blade' | 'polearm' | 'blunt' | 'firearm' | 'explosive';
export type FrameClass = 'light' | 'medium' | 'heavy';

export interface Weapon {
  readonly id: string;
  readonly name: string;
  readonly type: WeaponType;
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
  readonly class: FrameClass;
  readonly hp: number;
  readonly armour: number;
  /** Maximum tiles per move. */
  readonly move: number;
  /** Added to the pilot's AGI. Heavy frames are negative. */
  readonly agility: number;
}

/**
 * The pilot's attributes. STR damage · SKL accuracy · AGI evasion and turn order · DEF damage
 * blocked · INT counter odds and technique accuracy · SPI fatigue control · VIT max HP.
 */
export interface PilotStats {
  readonly str: number;
  readonly skl: number;
  readonly agi: number;
  readonly def: number;
  readonly int: number;
  readonly spi: number;
  readonly vit: number;
}

export type StatName = keyof PilotStats;
export const STAT_NAMES: readonly StatName[] = ['str', 'skl', 'agi', 'def', 'int', 'spi', 'vit'];

/** Everything needed to put a unit on the field. Resolved from content by the loader. */
export interface UnitSpec {
  readonly id: string;
  /** Named story character this unit is (for portraits, barks, persistence), if any. */
  readonly characterId?: string;
  readonly name: string;
  readonly side: Side;
  readonly controller: Controller;
  readonly ai?: AiProfile;
  readonly level: number;
  readonly stats: PilotStats;
  readonly frame: Frame;
  readonly weapon: Weapon;
  /** Attacks this frame/weapon combination can learn (besides the two starter attacks). */
  readonly attacks?: readonly Attack[];
  readonly xp?: number;
  /** Unspent stat points carried in from earlier level-ups. */
  readonly statPoints?: number;
  readonly at: Coord;
  readonly facing: Facing;
}

/** Live, serializable unit state. Derived numbers are baked in at battle start. */
export interface UnitState {
  id: string;
  characterId: string | null;
  name: string;
  side: Side;
  controller: Controller;
  ai: AiProfile;
  frameId: string;
  frameClass: FrameClass;
  /** The frame's AGI modifier, kept so the pilot's own AGI can be recovered. */
  frameAgility: number;
  weapon: Weapon;
  /** Basic attack first, then every technique this frame and weapon allow. */
  attacks: Attack[];
  level: number;
  /** XP towards the next level (0 to balance.xpPerLevel - 1). */
  xp: number;
  /** Points earned from level-ups that the player has not yet spent. */
  statPoints: number;
  maxHp: number;
  hp: number;
  ap: number;
  fp: number;
  str: number;
  skl: number;
  /** Effective AGI: pilot AGI plus the frame modifier. */
  agi: number;
  def: number;
  int: number;
  spi: number;
  vit: number;
  /** Max HP before VIT: frame HP plus the per-level bonus. */
  baseHp: number;
  arm: number;
  mov: number;
  pos: Coord;
  facing: Facing;
  defeated: boolean;
}

/** Max HP from base HP and VIT (each VIT point adds a percentage of the base). */
export function maxHpFor(baseHp: number, vit: number, balance: BalanceConfig): number {
  return Math.round(baseHp * (1 + (vit * balance.vitHpPercent) / 100));
}

export function createUnit(spec: UnitSpec, balance: BalanceConfig): UnitState {
  const baseHp = spec.frame.hp + (spec.level - 1) * balance.hpPerLevel;
  const hp = maxHpFor(baseHp, spec.stats.vit, balance);
  return {
    id: spec.id,
    characterId: spec.characterId ?? null,
    name: spec.name,
    side: spec.side,
    controller: spec.controller,
    ai: spec.ai ?? 'aggressive',
    frameId: spec.frame.id,
    frameClass: spec.frame.class,
    frameAgility: spec.frame.agility,
    weapon: spec.weapon,
    attacks: [...starterAttacks(spec.weapon), ...(spec.attacks ?? [])],
    level: spec.level,
    xp: spec.xp ?? 0,
    statPoints: spec.statPoints ?? 0,
    maxHp: hp,
    hp,
    ap: balance.apStart,
    fp: 0,
    str: spec.stats.str,
    skl: spec.stats.skl,
    agi: spec.stats.agi + spec.frame.agility,
    def: spec.stats.def,
    int: spec.stats.int,
    spi: spec.stats.spi,
    vit: spec.stats.vit,
    baseHp,
    arm: spec.frame.armour,
    mov: spec.frame.move,
    pos: { ...spec.at },
    facing: spec.facing,
    defeated: false,
  };
}

/** The pilot's own stats (without the frame's AGI modifier): what attack requirements check. */
export function pilotStats(u: PilotStats & Pick<UnitState, 'frameAgility'>): PilotStats {
  return {
    str: u.str,
    skl: u.skl,
    agi: u.agi - u.frameAgility,
    def: u.def,
    int: u.int,
    spi: u.spi,
    vit: u.vit,
  };
}

export function isHostile(a: Pick<UnitState, 'side'>, b: Pick<UnitState, 'side'>): boolean {
  return a.side !== b.side;
}
