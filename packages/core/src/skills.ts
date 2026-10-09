import type { Coord } from './grid';
import { manhattan } from './grid';
import type { BattleState } from './state';
import { livingUnits } from './state';
import type { UnitState } from './units';

/**
 * Pilot skills (ADR 0008): passive abilities a named pilot gains at level milestones. Each skill
 * has exactly one effect from the small set below; every number comes from content data.
 *
 * Conditions are read from the skill owner's point of view in one strike:
 * - always
 * - higher: the owner stands higher than the other unit
 * - flank: the blow lands on the defender's side or rear (for a defender: it is struck there)
 * - melee / ranged: the two units are adjacent / further apart
 * - foeHeavy / foeLight: the other unit pilots a heavy / light armatura
 * - foeWounded / selfWounded: that unit is at or below half its max HP
 */
export type SkillCondition =
  | 'always'
  | 'higher'
  | 'flank'
  | 'melee'
  | 'ranged'
  | 'foeHeavy'
  | 'foeLight'
  | 'foeWounded'
  | 'selfWounded';

/** Reactions whose FP cost a skill can lower. */
export type DiscountableReaction = 'defend' | 'avoid' | 'counter' | 'attackBack';

export type SkillEffect =
  /** + hit chance (percentage points) on the owner's own strikes. */
  | { readonly type: 'hitBonus'; readonly amount: number; readonly when?: SkillCondition }
  /** + raw damage (percent) on the owner's own strikes, before DEF. */
  | { readonly type: 'damageBonus'; readonly percent: number; readonly when?: SkillCondition }
  /** − hit chance (percentage points) of strikes against the owner. */
  | { readonly type: 'evadeBonus'; readonly amount: number; readonly when?: SkillCondition }
  /** − damage taken (percent), after DEF and the reaction. */
  | { readonly type: 'damageReduction'; readonly percent: number; readonly when?: SkillCondition }
  /** Defend lets through this many percentage points less (×0.5 becomes ×0.4 at 10). */
  | { readonly type: 'defendBonus'; readonly percent: number }
  /** That reaction costs this much less FP (never below 0). */
  | {
      readonly type: 'reactionFpDiscount';
      readonly reaction: DiscountableReaction;
      readonly amount: number;
    }
  /** The owner's own techniques cost this much less FP (never below 0). */
  | { readonly type: 'attackFpDiscount'; readonly amount: number }
  /** + Counter success chance, added after the usual clamp. */
  | { readonly type: 'counterBonus'; readonly amount: number }
  /** HP recovered at the start of each of the owner's turns. */
  | { readonly type: 'regen'; readonly hp: number }
  /** + FP recovered from unspent AP at the end of a turn (percent). */
  | { readonly type: 'restBonus'; readonly percent: number }
  /** + XP from every blow (percent). */
  | { readonly type: 'xpBonus'; readonly percent: number }
  /** + tiles of MOV. */
  | { readonly type: 'moveBonus'; readonly tiles: number }
  /** Allies standing next to the owner get + hit chance on their strikes (best aura only). */
  | { readonly type: 'aura'; readonly amount: number }
  /** + initiative each round (added to AGL + d6). */
  | { readonly type: 'initiative'; readonly amount: number };

export type SkillEffectType = SkillEffect['type'];

export interface Skill {
  readonly id: string;
  readonly name: string;
  /** Plain-language summary for the UI. */
  readonly description?: string;
  /** Pilot level at which the skill becomes active (1 = from the start). */
  readonly level: number;
  readonly effect: SkillEffect;
}

/** Skills the unit has reached the level for. */
export function activeSkills(unit: Pick<UnitState, 'skills' | 'level'>): Skill[] {
  return (unit.skills ?? []).filter((s) => s.level <= unit.level);
}

/** Skills that become active on reaching exactly `level`. */
export function skillsUnlockedAt(unit: Pick<UnitState, 'skills'>, level: number): Skill[] {
  return (unit.skills ?? []).filter((s) => s.level === level);
}

type EffectOf<T extends SkillEffectType> = Extract<SkillEffect, { type: T }>;

/** Active effects of one type. */
export function skillEffects<T extends SkillEffectType>(
  unit: Pick<UnitState, 'skills' | 'level'>,
  type: T,
): EffectOf<T>[] {
  return activeSkills(unit)
    .map((s) => s.effect)
    .filter((e): e is EffectOf<T> => e.type === type);
}

/** Sum of one numeric field over the unit's active effects of a type. */
function total<T extends SkillEffectType>(
  unit: Pick<UnitState, 'skills' | 'level'>,
  type: T,
  value: (e: EffectOf<T>) => number,
  applies: (e: EffectOf<T>) => boolean = () => true,
): number {
  return skillEffects(unit, type)
    .filter(applies)
    .reduce((n, e) => n + value(e), 0);
}

/** One strike, seen from a skill owner: who the other unit is, and how they stand. */
export interface SkillContext {
  readonly self: Pick<UnitState, 'hp' | 'maxHp'>;
  readonly foe: Pick<UnitState, 'hp' | 'maxHp' | 'frameClass'>;
  /** Owner's height minus the foe's. */
  readonly heightDiff: number;
  readonly distance: number;
  /** Whether the blow lands on the defender's side or rear. */
  readonly flank: boolean;
}

const wounded = (u: Pick<UnitState, 'hp' | 'maxHp'>) => u.hp * 2 <= u.maxHp;

export function conditionMet(when: SkillCondition | undefined, c: SkillContext): boolean {
  switch (when ?? 'always') {
    case 'always':
      return true;
    case 'higher':
      return c.heightDiff > 0;
    case 'flank':
      return c.flank;
    case 'melee':
      return c.distance <= 1;
    case 'ranged':
      return c.distance > 1;
    case 'foeHeavy':
      return c.foe.frameClass === 'heavy';
    case 'foeLight':
      return c.foe.frameClass === 'light';
    case 'foeWounded':
      return wounded(c.foe);
    case 'selfWounded':
      return wounded(c.self);
  }
}

/** The same strike from the defender's side: heights swap, the zone stays. */
function flip(c: SkillContext): SkillContext {
  return {
    ...c,
    self: c.foe as SkillContext['self'],
    foe: c.self as SkillContext['foe'],
    heightDiff: -c.heightDiff,
  };
}

/**
 * Hit chance skills add to a strike: the attacker's own bonuses, the best aura of an ally next to
 * the tile it strikes from, minus the defender's evasion. `ctx` is from the attacker's side.
 */
export function skillHitModifier(
  state: BattleState,
  attacker: UnitState,
  from: Coord,
  defender: UnitState,
  ctx: SkillContext,
): number {
  const own = total(
    attacker,
    'hitBonus',
    (e) => e.amount,
    (e) => conditionMet(e.when, ctx),
  );
  const evade = total(
    defender,
    'evadeBonus',
    (e) => e.amount,
    (e) => conditionMet(e.when, flip(ctx)),
  );
  return own + auraFor(state, attacker, from) - evade;
}

/** Best aura among the attacker's allies adjacent to `from` (auras don't stack). */
export function auraFor(state: BattleState, attacker: UnitState, from: Coord): number {
  let best = 0;
  for (const u of livingUnits(state)) {
    if (u.id === attacker.id || u.side !== attacker.side || manhattan(u.pos, from) !== 1) continue;
    for (const e of skillEffects(u, 'aura')) best = Math.max(best, e.amount);
  }
  return best;
}

/** Multiplier on raw damage from the attacker's skills. */
export function skillDamageMult(attacker: UnitState, ctx: SkillContext): number {
  return (
    1 +
    total(
      attacker,
      'damageBonus',
      (e) => e.percent,
      (e) => conditionMet(e.when, ctx),
    ) /
      100
  );
}

/** Fraction (0–0.9) of damage the defender's skills take off. `ctx` is from the attacker's side. */
export function skillDamageReduction(defender: UnitState, ctx: SkillContext): number {
  const pct = total(
    defender,
    'damageReduction',
    (e) => e.percent,
    (e) => conditionMet(e.when, flip(ctx)),
  );
  return Math.min(0.9, Math.max(0, pct / 100));
}

/** Percentage points Defend lets through less for this unit. */
export function defendBonus(unit: UnitState): number {
  return total(unit, 'defendBonus', (e) => e.percent);
}

/** FP a reaction's cost is lowered by. */
export function reactionDiscount(unit: UnitState, reaction: string): number {
  return total(
    unit,
    'reactionFpDiscount',
    (e) => e.amount,
    (e) => e.reaction === reaction,
  );
}

export function attackFpDiscount(unit: UnitState): number {
  return total(unit, 'attackFpDiscount', (e) => e.amount);
}

export function counterBonus(unit: UnitState): number {
  return total(unit, 'counterBonus', (e) => e.amount);
}

/** Multiplier on FP recovered by resting. */
export function restMult(unit: UnitState): number {
  return 1 + total(unit, 'restBonus', (e) => e.percent) / 100;
}

export function xpMult(unit: UnitState): number {
  return 1 + total(unit, 'xpBonus', (e) => e.percent) / 100;
}

export function moveBonus(unit: Pick<UnitState, 'skills' | 'level'>): number {
  return total(unit, 'moveBonus', (e) => e.tiles);
}

export function initiativeBonus(unit: UnitState): number {
  return total(unit, 'initiative', (e) => e.amount);
}
