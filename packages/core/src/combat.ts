import type { Attack } from './attacks';
import { attackRange, basicAttack, meetsRequirements } from './attacks';
import type { Coord, Facing } from './grid';
import { DIRECTIONS, manhattan } from './grid';
import type { BattleState } from './state';
import { heightAt, livingUnits, terrainAt } from './state';
import type { UnitState, Weapon } from './units';
import { isHostile, pilotStats } from './units';

/**
 * How a defender answers an attack:
 * - defend: always hit, half damage (front or side)
 * - avoid: roll to dodge completely (any direction; the only choice from the rear)
 * - attackBack: take the hit, then strike back if still standing and in range (front or side)
 * - counter: high risk, high reward, head-on only. A small chance to turn the blow back on the
 *   attacker at 1.25×; on failure the defender takes the blow at 1.25×.
 * - none: do nothing and take the blow (always offered)
 *
 * Reactions never cost AP, only FP, and a Spent unit (FP at max) can't react at all.
 */
export type Reaction = 'defend' | 'avoid' | 'attackBack' | 'counter' | 'none';
export type FacingZone = 'front' | 'side' | 'rear';

export const REACTIONS: readonly Reaction[] = ['defend', 'avoid', 'attackBack', 'counter', 'none'];

/** Where the attacker stands relative to the way the target is facing. */
export function facingZone(targetPos: Coord, targetFacing: Facing, attackerPos: Coord): FacingZone {
  const f = DIRECTIONS[targetFacing];
  const dx = attackerPos.x - targetPos.x;
  const dy = attackerPos.y - targetPos.y;
  const along = dx * f.x + dy * f.y;
  const across = Math.abs(dx * f.y - dy * f.x);
  if (along > across) return 'front';
  if (-along > across) return 'rear';
  return 'side';
}

/** The facing that points from `from` most directly toward `to`. */
export function facingToward(from: Coord, to: Coord, fallback: Facing = 'south'): Facing {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) return fallback;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'east' : 'west';
  return dy > 0 ? 'south' : 'north';
}

/** Weapon reach with its basic attack. */
export function inRange(weapon: Weapon, from: Coord, to: Coord): boolean {
  const d = manhattan(from, to);
  return d >= weapon.minRange && d <= weapon.maxRange;
}

export function attackInRange(attack: Attack, weapon: Weapon, from: Coord, to: Coord): boolean {
  const r = attackRange(attack, weapon);
  const d = manhattan(from, to);
  return d >= r.min && d <= r.max;
}

export function canAct(state: BattleState, unit: UnitState): boolean {
  return !unit.defeated && unit.fp < state.balance.fpMax;
}

/** Attacks whose stat requirements the pilot currently meets (always includes the basic one). */
export function unlockedAttacks(unit: UnitState): Attack[] {
  const stats = pilotStats(unit);
  return unit.attacks.filter((a) => meetsRequirements(stats, a));
}

export function findAttack(unit: UnitState, attackId: string | undefined): Attack {
  return (
    unit.attacks.find((a) => a.id === (attackId ?? 'basic')) ??
    unit.attacks[0] ??
    basicAttack(unit.weapon)
  );
}

/** Unlocked attacks the unit can afford and that reach `to` from `from`. */
export function usableAttacks(
  unit: UnitState,
  from: Coord,
  to: Coord,
  apAvailable: number = unit.ap,
): Attack[] {
  return unlockedAttacks(unit).filter(
    (a) => a.apCost <= apAvailable && attackInRange(a, unit.weapon, from, to),
  );
}

/** One entry of the reaction menu: every reaction is listed, with why it can't be used. */
export interface ReactionChoice {
  readonly reaction: Reaction;
  readonly available: boolean;
  /** FP this reaction adds to the defender (after SPI). */
  readonly fpCost: number;
  /** Why the reaction is unavailable, for the menu. */
  readonly reason?: string;
}

/**
 * The attack a defender strikes back with: its main attack, or its other starter attack when
 * only that one reaches (a gunner clubbing an adjacent attacker with the stock).
 */
export function attackBackWith(defender: UnitState, attackerPos?: Coord): Attack {
  const main = findAttack(defender, 'basic');
  const second = defender.attacks[1];
  if (!attackerPos || attackInRange(main, defender.weapon, defender.pos, attackerPos)) return main;
  if (
    second &&
    Object.keys(second.requires).length === 0 &&
    attackInRange(second, defender.weapon, defender.pos, attackerPos)
  ) {
    return second;
  }
  return main;
}

/** FP an attack costs this unit on its own turn (after SPI). */
export function attackFpCost(state: BattleState, unit: UnitState, attack: Attack): number {
  return fpCostFor(state, unit, attack.fpCost);
}

/**
 * FP a reaction costs this defender. Striking back turns the attack's whole AP cost into FP,
 * which makes it the most tiring answer.
 */
export function reactionFpCost(
  state: BattleState,
  defender: UnitState,
  reaction: Reaction,
  attackerPos?: Coord,
): number {
  const b = state.balance;
  switch (reaction) {
    case 'defend':
      return fpCostFor(state, defender, b.defendFpCost);
    case 'avoid':
      return fpCostFor(state, defender, b.avoidFpCost);
    case 'counter':
      return fpCostFor(state, defender, b.counterFpCost);
    case 'attackBack':
      return fpCostFor(state, defender, attackBackWith(defender, attackerPos).apCost);
    case 'none':
      return 0;
  }
}

/** Every reaction, in menu order, marked usable or not against this attack. */
export function reactionChoices(
  state: BattleState,
  defender: UnitState,
  attacker: UnitState,
  attackerPos: Coord = attacker.pos,
  attack?: Attack,
): ReactionChoice[] {
  const zone = facingZone(defender.pos, defender.facing, attackerPos);
  const fresh = canAct(state, defender);
  const spent = 'Too fatigued (FP full)';
  const choice = (reaction: Reaction, reason: string | undefined): ReactionChoice => ({
    reaction,
    available: reason === undefined,
    fpCost: reactionFpCost(state, defender, reaction, attackerPos),
    ...(reason === undefined ? {} : { reason }),
  });
  const back = attackBackWith(defender, attackerPos);
  return [
    choice('defend', !fresh ? spent : zone === 'rear' ? "Can't defend from behind" : undefined),
    choice('avoid', !fresh ? spent : undefined),
    choice(
      'attackBack',
      !fresh
        ? spent
        : zone === 'rear'
          ? "Can't strike back from behind"
          : attack?.noCounter
            ? `${attack.name} can't be answered`
            : !attackInRange(back, defender.weapon, defender.pos, attackerPos)
              ? 'Attacker out of reach'
              : undefined,
    ),
    choice(
      'counter',
      !fresh
        ? spent
        : zone !== 'front'
          ? 'Only against attacks from the front'
          : attack?.noCounter
            ? `${attack.name} can't be answered`
            : undefined,
    ),
    choice('none', undefined),
  ];
}

/** Reactions the defender can use against this attack ('none' is always among them). */
export function availableReactions(
  state: BattleState,
  defender: UnitState,
  attacker: UnitState,
  attackerPos: Coord = attacker.pos,
  attack?: Attack,
): Reaction[] {
  return reactionChoices(state, defender, attacker, attackerPos, attack)
    .filter((c) => c.available)
    .map((c) => c.reaction);
}

/** Chance (percent) that a Counter turns the blow back on the attacker. */
export function counterChance(
  state: BattleState,
  defender: UnitState,
  attacker: UnitState,
): number {
  const b = state.balance;
  return clamp(
    b.counterBaseChance + b.counterIntFactor * (defender.int - attacker.int),
    b.counterMinChance,
    b.counterMaxChance,
  );
}

/** FP an action actually costs this unit after SPI. */
export function fpCostFor(state: BattleState, unit: UnitState, base: number): number {
  const b = state.balance;
  return Math.round(base * (1 - Math.min(b.spiFpCostMax, unit.spi * b.spiFpCostPercent) / 100));
}

/** Size of an enemy fatigue/AP-drain effect after this unit's SPI resistance. */
export function resisted(state: BattleState, unit: UnitState, amount: number): number {
  const b = state.balance;
  return Math.round(amount * (1 - Math.min(b.spiResistMax, unit.spi * b.spiResistPercent) / 100));
}

export interface StrikeNumbers {
  /** Hit chance before the defender's reaction is applied. */
  readonly baseHit: number;
  readonly baseDamage: number;
  readonly zone: FacingZone;
  readonly heightDiff: number;
  readonly assist: number;
  readonly pierce: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** Raw numbers for `attacker` (standing at `from`) hitting `target` with `attack`. */
export function strikeNumbers(
  state: BattleState,
  attacker: UnitState,
  target: UnitState,
  from: Coord = attacker.pos,
  attack: Attack = attacker.attacks[0] ?? basicAttack(attacker.weapon),
): StrikeNumbers {
  const b = state.balance;
  const zone = facingZone(target.pos, target.facing, from);
  const heightDiff = heightAt(state, from) - heightAt(state, target.pos);
  const allies = livingUnits(state).filter(
    (u) => u.id !== attacker.id && !isHostile(u, attacker) && manhattan(u.pos, target.pos) === 1,
  ).length;
  const assist = Math.min(allies * b.assistPerAlly, b.assistMax);
  const zoneHit = zone === 'rear' ? b.rearHitBonus : zone === 'side' ? b.sideHitBonus : 0;
  const tired =
    (attacker.fp >= b.fpTired ? -b.tiredPenalty : 0) +
    (target.fp >= b.fpTired ? b.tiredPenalty : 0);
  // Starter attacks (no requirements) are plain weapon work; INT sharpens learned techniques.
  const technique =
    Object.keys(attack.requires).length === 0 ? 0 : attacker.int * b.intTechniqueAccuracy;
  const baseHit =
    attacker.weapon.accuracy +
    attack.accuracy +
    technique +
    attacker.skl * b.sklHitFactor -
    target.agi * b.agiEvadeFactor +
    heightDiff * b.heightHitPerStep +
    zoneHit +
    assist -
    (terrainAt(state, target.pos)?.avoid ?? 0) +
    tired;
  const heightMult = 1 + clamp(heightDiff, 0, b.heightDamageMaxSteps) * b.heightDamagePerStep;
  const zoneMult = zone === 'rear' ? b.rearDamageMult : 1;
  const raw = (attacker.weapon.power + attacker.str) * attack.power * heightMult * zoneMult;
  return { baseHit, baseDamage: raw, zone, heightDiff, assist, pierce: attack.pierce ?? 0 };
}

export function hitChanceFor(state: BattleState, n: StrikeNumbers, reaction: Reaction): number {
  const b = state.balance;
  // Defending blocks rather than dodges; a failed Counter leaves the defender wide open.
  if (reaction === 'defend' || reaction === 'counter') return 100;
  const bonus = reaction === 'avoid' ? 0 : b.counterHitBonus;
  return clamp(Math.round(n.baseHit + bonus), b.hitMin, b.hitMax);
}

export function damageFor(
  state: BattleState,
  n: StrikeNumbers,
  target: UnitState,
  reaction: Reaction,
): number {
  const b = state.balance;
  const mult =
    reaction === 'defend' ? b.defendDamageMult : reaction === 'counter' ? b.counterFailMult : 1;
  const blocked = (target.arm + target.def * b.defDamagePerPoint) * (1 - n.pierce);
  return Math.max(1, Math.round(n.baseDamage * mult - blocked));
}

/** XP an attacker earns for a hit (or defeating blow) on a target, scaled by level difference. */
export function xpFor(
  state: BattleState,
  attacker: UnitState,
  target: UnitState,
  defeated: boolean,
): number {
  const b = state.balance;
  const factor = clamp(
    1 + (target.level - attacker.level) * b.xpLevelFactor,
    b.xpMinFactor,
    b.xpMaxFactor,
  );
  return Math.max(1, Math.round((defeated ? b.xpDefeat : b.xpHit) * factor));
}

export interface AttackForecast {
  readonly attack: Attack;
  readonly hits: number;
  readonly zone: FacingZone;
  readonly heightDiff: number;
  readonly assist: number;
  readonly reactions: readonly Reaction[];
  /** Per-strike chance and damage for each reaction (for 'counter': if it fails). */
  readonly hitChance: Readonly<Record<Reaction, number>>;
  readonly damage: Readonly<Record<Reaction, number>>;
  /** Present when the target could attack back from where it stands. */
  readonly retaliation?: { readonly hitChance: number; readonly damage: number };
  /** Present when the target could Counter: success chance and the damage it would reflect. */
  readonly counter?: { readonly chance: number; readonly reflect: number };
}

/** Everything the combat panel shows before an attack is confirmed. */
export function forecastAttack(
  state: BattleState,
  attacker: UnitState,
  target: UnitState,
  from: Coord = attacker.pos,
  attack: Attack = attacker.attacks[0] ?? basicAttack(attacker.weapon),
): AttackForecast {
  const n = strikeNumbers(state, attacker, target, from, attack);
  const reactions = availableReactions(state, target, attacker, from, attack);
  const hitChance = {} as Record<Reaction, number>;
  const damage = {} as Record<Reaction, number>;
  for (const r of REACTIONS) {
    hitChance[r] = hitChanceFor(state, n, r);
    damage[r] = damageFor(state, n, target, r);
  }
  const hits = attack.hits ?? 1;
  let out: AttackForecast = {
    attack,
    hits,
    zone: n.zone,
    heightDiff: n.heightDiff,
    assist: n.assist,
    reactions,
    hitChance,
    damage,
  };
  // Attackers turn to face their target before striking, so a strike back lands on their front.
  const movedAttacker = {
    ...attacker,
    pos: from,
    facing: facingToward(from, target.pos, attacker.facing),
  };
  if (reactions.includes('attackBack')) {
    const back = strikeNumbers(state, target, movedAttacker, target.pos);
    out = {
      ...out,
      retaliation: {
        hitChance: hitChanceFor(state, back, 'none'),
        damage: damageFor(state, back, movedAttacker, 'none'),
      },
    };
  }
  if (reactions.includes('counter')) {
    out = {
      ...out,
      counter: {
        chance: counterChance(state, target, movedAttacker),
        reflect: reflectDamage(state, damage.none * hits),
      },
    };
  }
  return out;
}

/** Damage a successful Counter turns back on the attacker. */
export function reflectDamage(state: BattleState, incoming: number): number {
  return Math.max(1, Math.round(incoming * state.balance.counterReflectMult));
}
