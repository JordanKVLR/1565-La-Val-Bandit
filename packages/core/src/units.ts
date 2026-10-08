import type { Attack } from './attacks';
import { starterAttacks } from './attacks';
import type { BalanceConfig } from './balance';
import type { Coord, Facing } from './grid';
import type { Skill } from './skills';
import { moveBonus } from './skills';

export type Side = 'player' | 'enemy';
export type Controller = 'human' | 'ai';
/** How the AI plays this unit: charge in, only strike what it can reach, or never move. */
export type AiProfile = 'aggressive' | 'defensive' | 'hold';

export type WeaponType = 'blade' | 'polearm' | 'blunt' | 'firearm' | 'explosive';
export type FrameClass = 'light' | 'medium' | 'heavy';

/**
 * The pilot's attributes, as in the classic tactical-RPG framework (each up to 32):
 * BAS max HP · POW damage of every attack · DEX accuracy · AGL evasion and turn order ·
 * DEF damage blocked · WEP weapon damage.
 */
export interface PilotStats {
  readonly bas: number;
  readonly pow: number;
  readonly dex: number;
  readonly agl: number;
  readonly def: number;
  readonly wep: number;
}

export type StatName = keyof PilotStats;
export const STAT_NAMES: readonly StatName[] = ['bas', 'pow', 'dex', 'agl', 'def', 'wep'];

/** Attribute bonuses granted by a piece of gear (armatura, weapon, charm or amulet). */
export type StatBonus = Partial<PilotStats>;

export interface Weapon {
  readonly id: string;
  readonly name: string;
  readonly type: WeaponType;
  /** Added to the wielder's attributes (WEP for most; some add DEX, AGL, POW or DEF). */
  readonly bonus: StatBonus;
  /** AP of the weapon's main ranged attack (Fire, Throw); melee starters have fixed costs. */
  readonly apCost: number;
  readonly minRange: number;
  readonly maxRange: number;
}

/** An Armatura chassis. */
export interface Frame {
  readonly id: string;
  readonly name: string;
  readonly class: FrameClass;
  /** HP the chassis adds on top of the pilot's own. */
  readonly hp: number;
  /** Maximum tiles per move. */
  readonly move: number;
  readonly bonus: StatBonus;
}

/** A charm (fitted to the armatura) or amulet (worn by the pilot): attribute bonuses only. */
export interface Gear {
  readonly id: string;
  readonly name: string;
  readonly kind: 'charm' | 'amulet';
  readonly bonus: StatBonus;
}

/** Everything needed to put a unit on the field. Resolved from content by the loader. */
export interface UnitSpec {
  readonly id: string;
  /** Named story character this unit is (for portraits, barks, persistence), if any. */
  readonly characterId?: string;
  /** Cast portrait for a generic unit that stands in for a story figure. Cosmetic only. */
  readonly portrait?: string;
  readonly name: string;
  readonly side: Side;
  readonly controller: Controller;
  readonly ai?: AiProfile;
  readonly level: number;
  readonly stats: PilotStats;
  readonly frame: Frame;
  readonly weapon: Weapon;
  readonly charm?: Gear;
  readonly amulet?: Gear;
  /** Attacks this frame/weapon combination can learn (besides the two starter attacks). */
  readonly attacks?: readonly Attack[];
  /** Pilot skills, each active from its own level (ADR 0007). */
  readonly skills?: readonly Skill[];
  readonly xp?: number;
  /** Unspent stat points carried in from earlier level-ups. */
  readonly statPoints?: number;
  readonly at: Coord;
  readonly facing: Facing;
}

type MutableStats = { -readonly [K in keyof PilotStats]: PilotStats[K] };

/**
 * Live, serializable unit state. Derived numbers are baked in at battle start; the top-level
 * attributes are the pilot's own plus every gear bonus.
 */
export interface UnitState extends MutableStats {
  id: string;
  characterId: string | null;
  /** Cast portrait for a generic unit (see UnitSpec.portrait). */
  portrait?: string;
  name: string;
  side: Side;
  controller: Controller;
  ai: AiProfile;
  frameId: string;
  frameClass: FrameClass;
  /** Chassis HP, kept so max HP can be recomputed after a level or BAS change. */
  frameHp: number;
  weapon: Weapon;
  charmId: string | null;
  amuletId: string | null;
  /** The pilot's own attributes; the unit's top-level stats add all gear bonuses on top. */
  pilot: PilotStats;
  /** Sum of every gear bonus (unclamped), so a raised attribute can be recomputed exactly. */
  gear: PilotStats;
  /** Starter attacks first, then every technique this frame and weapon allow. */
  attacks: Attack[];
  /** Every pilot skill, locked or not; active ones are those at or below `level`. */
  skills: Skill[];
  level: number;
  /** XP towards the next level (0 to balance.xpPerLevel - 1). */
  xp: number;
  /** Points earned from level-ups that the player has not yet spent. */
  statPoints: number;
  maxHp: number;
  hp: number;
  ap: number;
  fp: number;
  mov: number;
  pos: Coord;
  facing: Facing;
  defeated: boolean;
}

/** Pilot attributes plus every gear bonus, capped at the attribute maximum. */
export function effectiveStats(
  pilot: PilotStats,
  bonuses: readonly (StatBonus | undefined)[],
  max: number,
): PilotStats {
  const out = { ...pilot } as Record<StatName, number>;
  for (const b of bonuses) for (const k of STAT_NAMES) out[k] += b?.[k] ?? 0;
  for (const k of STAT_NAMES) out[k] = Math.max(0, Math.min(max, out[k]));
  return out;
}

/** Max HP = level × 2 + BAS × 4 + 10 + the chassis's HP (the classic formula). */
export function maxHpFor(level: number, bas: number, frameHp: number, b: BalanceConfig): number {
  return level * b.hpPerLevel + bas * b.hpPerBas + b.hpBase + frameHp;
}

export function createUnit(spec: UnitSpec, balance: BalanceConfig): UnitState {
  const pilot = { ...spec.stats };
  const bonuses = [spec.frame.bonus, spec.weapon.bonus, spec.charm?.bonus, spec.amulet?.bonus];
  const stats = effectiveStats(pilot, bonuses, balance.statMax);
  const gear = sumBonuses(bonuses);
  const hp = maxHpFor(spec.level, stats.bas, spec.frame.hp, balance);
  const skills = [...(spec.skills ?? [])];
  return {
    id: spec.id,
    characterId: spec.characterId ?? null,
    ...(spec.portrait ? { portrait: spec.portrait } : {}),
    name: spec.name,
    side: spec.side,
    controller: spec.controller,
    ai: spec.ai ?? 'aggressive',
    frameId: spec.frame.id,
    frameClass: spec.frame.class,
    frameHp: spec.frame.hp,
    weapon: spec.weapon,
    charmId: spec.charm?.id ?? null,
    amuletId: spec.amulet?.id ?? null,
    pilot,
    gear,
    ...stats,
    attacks: [...starterAttacks(spec.weapon), ...(spec.attacks ?? [])],
    skills,
    level: spec.level,
    xp: spec.xp ?? 0,
    statPoints: spec.statPoints ?? 0,
    maxHp: hp,
    hp,
    ap: balance.apStart,
    fp: 0,
    mov: spec.frame.move + moveBonus({ skills, level: spec.level }),
    pos: { ...spec.at },
    facing: spec.facing,
    defeated: false,
  };
}

/** Every bonus added together, per attribute (may be negative). */
export function sumBonuses(bonuses: readonly (StatBonus | undefined)[]): PilotStats {
  const out = { bas: 0, pow: 0, dex: 0, agl: 0, def: 0, wep: 0 };
  for (const b of bonuses) for (const k of STAT_NAMES) out[k] += b?.[k] ?? 0;
  return out;
}

/** The pilot's own attributes, without gear. */
export function pilotStats(u: Pick<UnitState, 'pilot'>): PilotStats {
  return { ...u.pilot };
}

/** The unit's attributes with all gear: what combat and technique requirements use. */
export function unitStats(u: PilotStats): PilotStats {
  return { bas: u.bas, pow: u.pow, dex: u.dex, agl: u.agl, def: u.def, wep: u.wep };
}

export function isHostile(a: Pick<UnitState, 'side'>, b: Pick<UnitState, 'side'>): boolean {
  return a.side !== b.side;
}
