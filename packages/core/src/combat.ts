import type { Attack } from './attacks';
import { attackRange, basicAttack, meetsRequirements } from './attacks';
import type { Coord, Facing } from './grid';
import { DIRECTIONS, manhattan } from './grid';
import type { BattleState } from './state';
import { heightAt, livingUnits, terrainAt } from './state';
import type { UnitState, Weapon } from './units';
import { isHostile, pilotStats } from './units';

export type Reaction = 'defend' | 'avoid' | 'counter';
export type FacingZone = 'front' | 'side' | 'rear';

export const REACTIONS: readonly Reaction[] = ['defend', 'avoid', 'counter'];

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

/** Reactions the defender can afford against this attack. Defend is always possible. */
export function availableReactions(
  state: BattleState,
  defender: UnitState,
  attacker: UnitState,
  attackerPos: Coord = attacker.pos,
  attack?: Attack,
): Reaction[] {
  const out: Reaction[] = ['defend'];
  if (!canAct(state, defender)) return out;
  if (defender.ap >= state.balance.avoidApCost) out.push('avoid');
  const counter = defender.attacks[0] ?? basicAttack(defender.weapon);
  if (
    !attack?.noCounter &&
    defender.ap >= counter.apCost &&
    attackInRange(counter, defender.weapon, defender.pos, attackerPos)
  ) {
    out.push('counter');
  }
  return out;
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
  const baseHit =
    attacker.weapon.accuracy +
    attack.accuracy +
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

export function hitChanceFor(
  state: BattleState,
  n: StrikeNumbers,
  reaction: Reaction | 'none',
): number {
  const b = state.balance;
  if (reaction === 'defend') return 100;
  const bonus = reaction === 'avoid' ? 0 : b.counterHitBonus;
  return clamp(Math.round(n.baseHit + bonus), b.hitMin, b.hitMax);
}

export function damageFor(
  state: BattleState,
  n: StrikeNumbers,
  target: UnitState,
  reaction: Reaction | 'none',
): number {
  const mult = reaction === 'defend' ? state.balance.defendDamageMult : 1;
  const armour = Math.round(target.arm * (1 - n.pierce));
  return Math.max(1, Math.round(n.baseDamage * mult) - armour);
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
  /** Per-strike chance and damage for each reaction. */
  readonly hitChance: Readonly<Record<Reaction, number>>;
  readonly damage: Readonly<Record<Reaction, number>>;
  /** Present when the target could counter from where it stands. */
  readonly counter?: { readonly hitChance: number; readonly damage: number };
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
  const base = {
    attack,
    hits: attack.hits ?? 1,
    zone: n.zone,
    heightDiff: n.heightDiff,
    assist: n.assist,
    reactions,
    hitChance,
    damage,
  };
  if (!reactions.includes('counter')) return base;
  // Attackers turn to face their target before striking, so the counter lands on their front.
  const movedAttacker = {
    ...attacker,
    pos: from,
    facing: facingToward(from, target.pos, attacker.facing),
  };
  const back = strikeNumbers(state, target, movedAttacker, target.pos);
  return {
    ...base,
    counter: {
      hitChance: hitChanceFor(state, back, 'none'),
      damage: damageFor(state, back, movedAttacker, 'none'),
    },
  };
}
