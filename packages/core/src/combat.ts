import type { Attack } from './attacks';
import { attackRange, basicAttack, isAttackUnlocked } from './attacks';
import { xpGapFactor } from './balance';
import type { Coord, Facing } from './grid';
import { DIRECTIONS, manhattan } from './grid';
import type { SkillContext } from './skills';
import {
  attackFpDiscount,
  counterBonus,
  defendBonus,
  reactionDiscount,
  skillDamageMult,
  skillDamageReduction,
  skillHitModifier,
  xpMult,
} from './skills';
import type { BattleState } from './state';
import { heightAt, livingUnits, terrainAt } from './state';
import type { UnitState, Weapon } from './units';
import { bondRankAt } from './bonds';
import { isHostile, unitStats } from './units';

/**
 * How a defender answers an attack:
 * - defend: always hit, half damage (front or side)
 * - avoid: roll to dodge completely (any direction; the only choice from the rear)
 * - attackBack: take the hit, then strike back if still standing and in range (front or side)
 * - counter: high risk, high reward, head-on only. A small chance to turn the blow back on the
 *   attacker at 1.25×; on failure the defender takes the blow at 1.25×.
 * - none: NOT a choice. The engine's internal value for a blow nobody reacted to (a strike back,
 *   a reflected counter, or a defender too Spent to react). It is never offered or accepted while
 *   the defender can afford a real reaction.
 *
 * Reactions never cost AP, only FP, and a Spent unit (FP at max) can't react at all.
 */
export type Reaction = 'defend' | 'avoid' | 'attackBack' | 'counter' | 'none';
export type FacingZone = 'front' | 'side' | 'rear';

/** The internal value for a blow that is not reacted to; never a menu entry. */
export const NO_REACTION = 'none' satisfies Reaction;

/** The reactions a defender can choose between, in menu order ('none' is not among them). */
export const REACTIONS: readonly Reaction[] = ['defend', 'avoid', 'attackBack', 'counter'];

/** Every value `forecastAttack` tabulates: the real reactions plus the un-reacted blow. */
const FORECAST_KEYS: readonly Reaction[] = [...REACTIONS, NO_REACTION];

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

/**
 * Attacks the pilot can use now: level reached and stat requirements met (always includes the
 * starters).
 */
export function unlockedAttacks(unit: UnitState): Attack[] {
  const stats = unitStats(unit);
  return unit.attacks.filter((a) => isAttackUnlocked(unit.level, stats, a));
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

/**
 * Why a reaction or a strike-back technique can't be used. A code with its numbers, never text:
 * the game words it in the player's language (ADR 0012).
 */
export type UnavailableReason =
  /** The technique can't reach the attacker. */
  | { readonly code: 'outOfReach' }
  /** Paying this technique's FP would take the defender past full fatigue. */
  | { readonly code: 'tooTired'; readonly fpCost: number }
  /** The defender's FP is full (Spent): it cannot react. */
  | { readonly code: 'spent' }
  | { readonly code: 'rearNoDefend' }
  | { readonly code: 'rearNoStrikeBack' }
  /** The attack has `noCounter`. */
  | { readonly code: 'unanswerable'; readonly attackName: string }
  /** No technique reaches the attacker. */
  | { readonly code: 'attackerOutOfReach' }
  /** Every technique that reaches would cost too much FP. */
  | { readonly code: 'tooTiredToStrikeBack' }
  /** Counter cannot be set against a blow from behind. */
  | { readonly code: 'rearNoCounter' };

/** One entry of the reaction menu: every reaction is listed, with why it can't be used. */
export interface ReactionChoice {
  readonly reaction: Reaction;
  readonly available: boolean;
  /** FP this reaction adds to the defender (after SPI). */
  readonly fpCost: number;
  /** Why the reaction is unavailable, for the menu. */
  readonly reason?: UnavailableReason;
}

/**
 * FP a strike back costs: the technique's AP and FP together, all paid as FP (no AP). With the
 * defender given, its skills' discount comes off.
 */
export function attackBackFpCost(attack: Attack, defender?: UnitState): number {
  const full = attack.apCost + attack.fpCost;
  return defender ? Math.max(0, full - reactionDiscount(defender, 'attackBack')) : full;
}

export interface BackAttackOption {
  readonly attack: Attack;
  readonly available: boolean;
  /** FP the strike back would cost. */
  readonly fpCost: number;
  /** Why it can't be used, for the menu. */
  readonly reason?: UnavailableReason;
}

/**
 * Every unlocked technique the defender could strike back with: it must reach the attacker, and
 * paying its FP must not take the defender past full fatigue.
 */
export function attackBackOptions(
  state: BattleState,
  defender: UnitState,
  attackerPos?: Coord,
): BackAttackOption[] {
  const stats = unitStats(defender);
  const fpLeft = state.balance.fpMax - defender.fp;
  return defender.attacks
    .filter((a) => isAttackUnlocked(defender.level, stats, a))
    .map((attack) => {
      const fpCost = attackBackFpCost(attack, defender);
      const reason: UnavailableReason | undefined =
        attackerPos && !attackInRange(attack, defender.weapon, defender.pos, attackerPos)
          ? { code: 'outOfReach' }
          : fpCost > fpLeft
            ? { code: 'tooTired', fpCost }
            : undefined;
      return { attack, available: reason === undefined, fpCost, ...(reason ? { reason } : {}) };
    });
}

/**
 * The attack a defender strikes back with. With `attackId`, that technique (if usable);
 * otherwise the main attack, or the other starter when only that one reaches (a gunner clubbing
 * an adjacent attacker with the stock), or failing both any usable technique. The AI always
 * uses this default.
 */
export function attackBackWith(
  state: BattleState,
  defender: UnitState,
  attackerPos?: Coord,
  attackId?: string,
): Attack {
  const options = attackBackOptions(state, defender, attackerPos);
  const usable = (id: string | undefined) =>
    options.find((o) => o.available && o.attack.id === id)?.attack;
  if (attackId !== undefined) {
    const chosen = usable(attackId);
    if (chosen) return chosen;
  }
  const main = findAttack(defender, 'basic');
  const second = defender.attacks[1];
  return (
    usable(main.id) ??
    (second && Object.keys(second.requires).length === 0 ? usable(second.id) : undefined) ??
    options.find((o) => o.available)?.attack ??
    main
  );
}

/** FP an attack costs this unit on its own turn (after its skills' discount). */
export function attackFpCost(_state: BattleState, unit: UnitState, attack: Attack): number {
  return Math.max(0, attack.fpCost - attackFpDiscount(unit));
}

/**
 * FP a reaction costs this defender. Striking back pays the chosen technique's AP and FP as FP,
 * which makes it the most tiring answer.
 */
export function reactionFpCost(
  state: BattleState,
  defender: UnitState,
  reaction: Reaction,
  attackerPos?: Coord,
  backAttackId?: string,
  incoming?: { readonly attacker: UnitState; readonly attack: Attack },
): number {
  const b = state.balance;
  const less = (cost: number) => Math.max(0, cost - reactionDiscount(defender, reaction));
  switch (reaction) {
    case 'defend':
      return less(b.defendFpCost);
    case 'avoid':
      return less(b.avoidFpCost);
    case 'counter':
      // Turning a blow back costs the blow's own FP on top of the flat Counter price.
      return less(
        b.counterFpCost + (incoming ? attackFpCost(state, incoming.attacker, incoming.attack) : 0),
      );
    case 'attackBack':
      return attackBackFpCost(attackBackWith(state, defender, attackerPos, backAttackId), defender);
    case 'none':
      return 0; // internal only: nothing was chosen, nothing is paid
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
  const spent: UnavailableReason = { code: 'spent' };
  const unanswerable = (a: Attack): UnavailableReason => ({
    code: 'unanswerable',
    attackName: a.name,
  });
  const choice = (reaction: Reaction, reason: UnavailableReason | undefined): ReactionChoice => ({
    reaction,
    available: reason === undefined,
    fpCost: reactionFpCost(
      state,
      defender,
      reaction,
      attackerPos,
      undefined,
      attack ? { attacker, attack } : undefined,
    ),
    ...(reason === undefined ? {} : { reason }),
  });
  const backs = attackBackOptions(state, defender, attackerPos);
  return [
    choice('defend', !fresh ? spent : zone === 'rear' ? { code: 'rearNoDefend' } : undefined),
    choice('avoid', !fresh ? spent : undefined),
    choice(
      'attackBack',
      !fresh
        ? spent
        : zone === 'rear'
          ? { code: 'rearNoStrikeBack' }
          : attack?.noCounter
            ? unanswerable(attack)
            : backs.some((o) => o.available)
              ? undefined
              : backs.every((o) => o.reason?.code === 'outOfReach')
                ? { code: 'attackerOutOfReach' }
                : { code: 'tooTiredToStrikeBack' },
    ),
    choice(
      'counter',
      !fresh
        ? spent
        : zone === 'rear'
          ? { code: 'rearNoCounter' }
          : attack?.noCounter
            ? unanswerable(attack)
            : undefined,
    ),
  ];
}

/** Reactions the defender can choose against this attack; empty only when it is too Spent to react. */
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

/** Chance (percent) that a Counter turns the blow back on the attacker (skills add after the clamp). */
export function counterChance(
  state: BattleState,
  defender: UnitState,
  attacker: UnitState,
  attackerPos: Coord = attacker.pos,
): number {
  const b = state.balance;
  // A blow from the side is harder to read than one head-on.
  const sidePenalty =
    facingZone(defender.pos, defender.facing, attackerPos) === 'side' ? b.counterSidePenalty : 0;
  return (
    clamp(
      b.counterBaseChance +
        b.counterIntFactor * defender.int +
        b.counterStatFactor * (defender.dex + defender.agl - (attacker.dex + attacker.agl)) -
        sidePenalty,
      b.counterMinChance,
      b.counterMaxChance,
    ) + counterBonus(defender)
  );
}

/**
 * Where a strike's hit chance comes from, in percentage points, so the combat panel can show
 * every term (the technique's own accuracy, DEX against the target's AGL, flank, height, allies,
 * the target's ground, fatigue and skills). They sum with the base hit to `baseHit`.
 */
export interface HitParts {
  readonly technique: number;
  /** Attacker's DEX against the target's AGL. */
  readonly stats: number;
  readonly flank: number;
  readonly height: number;
  readonly assist: number;
  /** Negative: the target's ground makes it harder to hit. */
  readonly terrain: number;
  readonly tired: number;
  readonly skills: number;
  /** A bonded ally close by steadies the striker's aim. */
  readonly bond: number;
}

export interface StrikeNumbers {
  /** Hit chance before the defender's reaction is applied. */
  readonly baseHit: number;
  readonly hitParts: HitParts;
  readonly baseDamage: number;
  readonly zone: FacingZone;
  readonly heightDiff: number;
  readonly assist: number;
  readonly pierce: number;
  /** Hit chance from skills (attacker's bonuses and allies' auras, minus the target's evasion). */
  readonly skillHit: number;
  /** Fraction of the final damage the target's skills take off. */
  readonly reduction: number;
}

/**
 * Allies of `striker` standing next to the tile it strikes (each adds hit chance, capped), and
 * the resulting bonus. The UI draws these as the 3×3 assist grid.
 */
export function assistFor(
  state: BattleState,
  striker: UnitState,
  targetPos: Coord,
): { readonly bonus: number; readonly allies: readonly Coord[] } {
  const b = state.balance;
  const allies = livingUnits(state)
    .filter(
      (u) => u.id !== striker.id && !isHostile(u, striker) && manhattan(u.pos, targetPos) === 1,
    )
    .map((u) => u.pos);
  return { bonus: Math.min(allies.length * b.assistPerAlly, b.assistMax), allies };
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
  const assist = assistFor(state, attacker, target.pos).bonus;
  const bondAtk = bondRankAt(state, attacker, from);
  const zoneHit = zone === 'rear' ? b.rearHitBonus : zone === 'side' ? b.sideHitBonus : 0;
  const tired =
    (attacker.fp >= b.fpTired ? -b.tiredPenalty : 0) +
    (target.fp >= b.fpTired ? b.tiredPenalty : 0);
  const ctx: SkillContext = {
    self: attacker,
    foe: target,
    heightDiff,
    distance: manhattan(from, target.pos),
    flank: zone !== 'front',
  };
  const skillHit = skillHitModifier(state, attacker, from, target, ctx);
  const hitParts: HitParts = {
    technique: attack.accuracy,
    stats: attacker.dex * b.dexHitFactor - target.agl * b.aglEvadeFactor,
    flank: zoneHit,
    height: heightDiff * b.heightHitPerStep,
    assist,
    terrain: -(terrainAt(state, target.pos)?.avoid ?? 0),
    tired,
    skills: skillHit,
    bond: bondAtk * b.bondHit,
  };
  const baseHit =
    b.baseHit +
    hitParts.technique +
    hitParts.stats +
    hitParts.height +
    hitParts.flank +
    hitParts.assist +
    hitParts.terrain +
    hitParts.tired +
    hitParts.skills +
    hitParts.bond;
  const heightMult = 1 + clamp(heightDiff, 0, b.heightDamageMaxSteps) * b.heightDamagePerStep;
  const zoneMult = zone === 'rear' ? b.rearDamageMult : 1;
  const raw =
    (attacker.pow + attacker.weapon.power) *
    b.damagePerPoint *
    attack.power *
    heightMult *
    zoneMult *
    skillDamageMult(attacker, ctx) *
    (1 + bondAtk * b.bondDamage);
  const guard = bondRankAt(state, target) * b.bondGuard;
  return {
    baseHit,
    hitParts,
    baseDamage: raw,
    zone,
    heightDiff,
    assist,
    pierce: attack.pierce ?? 0,
    skillHit,
    reduction: 1 - (1 - skillDamageReduction(target, ctx)) * (1 - guard),
  };
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
    reaction === 'defend'
      ? Math.max(0, b.defendDamageMult - defendBonus(target) / 100)
      : reaction === 'counter'
        ? b.counterFailMult
        : 1;
  // DEF blocks first, then damageScale sets how lethal blows are overall; Defend then halves what gets through (so a defended blow is about half),
  // and the target's skills take their share last.
  const blocked = target.def * b.defDamagePerPoint * (1 - n.pierce);
  return Math.max(
    1,
    Math.round((n.baseDamage - blocked) * b.damageScale * mult * (1 - n.reduction)),
  );
}

/**
 * XP for landing a hit, in the classic way: a base amount plus a share for how much of the
 * target's max HP the blow took, scaled by the level gap and by direction (head-on is worth
 * the most, from behind the least), plus a bonus for the defeating blow.
 */
export function xpFor(
  state: BattleState,
  attacker: UnitState,
  target: UnitState,
  damage: number,
  zone: FacingZone,
  defeated: boolean,
): number {
  const b = state.balance;
  const level = xpGapFactor(target.level - attacker.level, b);
  const direction = zone === 'front' ? b.xpFront : zone === 'side' ? b.xpSide : b.xpRear;
  const share = Math.min(1, damage / Math.max(1, target.maxHp));
  const hit = (b.xpHitBase + b.xpDamageShare * share) * direction;
  // Levels cost more as a pilot rises (xpLevelCostGrowth), so blows pay more too: a battle is worth
  // about the same share of a level at Lv 3 as at Lv 23.
  const rise = 1 + b.xpLevelCostGrowth * (attacker.level - 1);
  return Math.max(
    1,
    Math.round((hit + (defeated ? b.xpDefeat : 0)) * level * rise * b.xpScale * xpMult(attacker)),
  );
}

export interface AttackForecast {
  readonly attack: Attack;
  readonly hits: number;
  readonly zone: FacingZone;
  /** The terms of the attacker's hit chance (see `HitParts`). */
  readonly hitParts: HitParts;
  /** The level-gap multiplier on the XP this attack earns (above 1: a tougher foe, below: a weaker one). */
  readonly xpGap: number;
  readonly heightDiff: number;
  readonly assist: number;
  readonly reactions: readonly Reaction[];
  /** Per-strike chance and damage for each reaction (for 'counter': if it fails). */
  readonly hitChance: Readonly<Record<Reaction, number>>;
  readonly damage: Readonly<Record<Reaction, number>>;
  /** Present when the target could attack back from where it stands. */
  readonly retaliation?: {
    readonly attackId: string;
    readonly attackName: string;
    /** Strikes the technique lands (twin techniques strike twice). */
    readonly hits: number;
    readonly fpCost: number;
    /** Per strike. */
    readonly hitChance: number;
    readonly damage: number;
    /** The terms of the strike back's hit chance, and the zone it lands on. */
    readonly hitParts: HitParts;
    readonly zone: FacingZone;
  };
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
  /** The technique the target would strike back with (its default when omitted). */
  backAttackId?: string,
): AttackForecast {
  const n = strikeNumbers(state, attacker, target, from, attack);
  const reactions = availableReactions(state, target, attacker, from, attack);
  const hitChance = {} as Record<Reaction, number>;
  const damage = {} as Record<Reaction, number>;
  for (const r of FORECAST_KEYS) {
    hitChance[r] = hitChanceFor(state, n, r);
    damage[r] = damageFor(state, n, target, r);
  }
  const hits = attack.hits ?? 1;
  let out: AttackForecast = {
    attack,
    hits,
    zone: n.zone,
    hitParts: n.hitParts,
    xpGap: Math.round(xpGapFactor(target.level - attacker.level, state.balance) * 100) / 100,
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
    const backAttack = attackBackWith(state, target, from, backAttackId);
    const back = strikeNumbers(state, target, movedAttacker, target.pos, backAttack);
    out = {
      ...out,
      retaliation: {
        attackId: backAttack.id,
        attackName: backAttack.name,
        hits: backAttack.hits ?? 1,
        fpCost: attackBackFpCost(backAttack, target),
        hitChance: hitChanceFor(state, back, NO_REACTION),
        damage: damageFor(state, back, movedAttacker, NO_REACTION),
        hitParts: back.hitParts,
        zone: back.zone,
      },
    };
  }
  if (reactions.includes('counter')) {
    out = {
      ...out,
      counter: {
        chance: counterChance(state, target, movedAttacker, from),
        reflect: reflectDamage(state, damage.none * hits, target),
      },
    };
  }
  return out;
}

/** Damage a successful Counter turns back on the attacker: sharper wits drive the blow back harder. */
export function reflectDamage(state: BattleState, incoming: number, defender?: UnitState): number {
  const b = state.balance;
  const mult = b.counterReflectMult + (defender ? b.counterReflectPerInt * defender.int : 0);
  return Math.max(1, Math.round(incoming * mult));
}
