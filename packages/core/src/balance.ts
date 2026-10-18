/**
 * Every tuning number the rules use. Content ships its own copy (content/data/balance.json);
 * these defaults keep tests self-contained. See docs/PLAN.md §2.2 for the intent behind each.
 */
export interface BalanceConfig {
  readonly apMax: number;
  readonly apStart: number;
  readonly apRegen: number;
  /** Extra AP per height step climbed (descending is free). */
  readonly climbApPerStep: number;
  /** Largest height difference a unit can step up or down in one tile. */
  readonly maxClimb: number;
  /** The first step of a move costs this many times its ground (the classic rule). */
  readonly firstStepMult: number;
  /** Extra AP to pass through a tile an ally stands on. */
  readonly allyPassAp: number;
  /**
   * Gunfire hits harder than a blade (power ×`gunPower`), is harder to aim (`gunAccuracy`) and
   * always pierces `gunPierce` of DEF; bombs hit ×`bombPower`. Applied to the starters and to every
   * shot, volley or throw technique on top of its own numbers. Gunfire cannot be countered.
   */
  readonly gunPower: number;
  readonly gunAccuracy: number;
  readonly gunPierce: number;
  readonly bombPower: number;
  readonly fpMax: number;
  /**
   * AP left unspent at the end of a turn is traded for rest: every this-many AP remove 1 FP
   * (1.5 means 3 AP recover 2 FP). There is no other recovery.
   */
  readonly apPerFpRecovered: number;
  /** At or above this fatigue a unit is Tired. */
  readonly fpTired: number;
  /** Hit-chance penalty when a Tired unit attacks (and bonus when it is attacked). */
  readonly tiredPenalty: number;
  /** FP each reaction adds to the defender. Reactions never cost AP. */
  readonly defendFpCost: number;
  readonly avoidFpCost: number;
  readonly counterFpCost: number;
  /** Hit chance before attributes: base + DEX × factor − target AGL × factor + modifiers. */
  readonly baseHit: number;
  readonly hitMin: number;
  readonly hitMax: number;
  /** Defend doubles the hit chance (the block cannot be dodged) but never past this. */
  readonly defendHitMax: number;
  /** Each point of INT trims this share off every FP a pilot gains from attacks and reactions, up to the max. */
  readonly intFpReduction: number;
  readonly intFpReductionMax: number;
  readonly dexHitFactor: number;
  readonly aglEvadeFactor: number;
  /** Raw damage = (POW + weapon power) × this × attack power × situational multipliers. */
  readonly damagePerPoint: number;
  /** Damage blocked per point of DEF (armaturas have no armour of their own). */
  readonly defDamagePerPoint: number;
  /**
   * The one knob for how lethal blows are: multiplies every blow's damage after DEF has been
   * taken off (so DEF, technique power, height, rear and Defend keep their relative weight).
   * 1 = the raw formula; 0.6 means a typical unit survives 4–5 rear hits (ADR 0014).
   */
  readonly damageScale: number;
  readonly heightHitPerStep: number;
  readonly heightDamagePerStep: number;
  readonly heightDamageMaxSteps: number;
  readonly sideHitBonus: number;
  readonly rearHitBonus: number;
  readonly rearDamageMult: number;
  readonly assistPerAlly: number;
  readonly assistMax: number;
  readonly defendDamageMult: number;
  /** A defender that attacks back or cannot react is easier to hit than one that avoids. */
  readonly counterHitBonus: number;
  /**
   * XP comes only from landing hits: (base + damage share × the fraction of the target's max HP
   * dealt) × level-gap factor × direction factor, plus a bonus for the defeating blow.
   */
  readonly xpHitBase: number;
  readonly xpDamageShare: number;
  readonly xpDefeat: number;
  /** Direction factors: striking head-on is worth the most, from behind the least. */
  readonly xpFront: number;
  readonly xpSide: number;
  readonly xpRear: number;
  /** Multiplier on all XP earned (the global rate). */
  readonly xpScale: number;
  /** XP to go from level 1 to level 2; each later level costs `xpLevelCostGrowth` more (leftover XP carries over). */
  readonly xpPerLevel: number;
  readonly xpLevelCostGrowth: number;
  /**
   * The level-gap multiplier on a hit's XP, by how far the target's level is above (+) or below
   * (−) the attacker's. Above: 1 + `xpGapBonus` × gap + `xpGapCurve` × gap², at most `xpMaxFactor`.
   * Below: `xpGapDecay` ^ |gap|, at least `xpMinFactor`.
   */
  readonly xpGapBonus: number;
  readonly xpGapCurve: number;
  readonly xpGapDecay: number;
  readonly xpMinFactor: number;
  readonly xpMaxFactor: number;
  /** Attribute points granted per level-up. */
  readonly statPointsPerLevel: number;
  /** Highest value any attribute can reach (gear included). */
  readonly statMax: number;
  /** Max HP = level × hpPerLevel + BAS × hpPerBas + hpBase + the armatura's HP. */
  readonly hpPerLevel: number;
  readonly hpPerBas: number;
  readonly hpBase: number;
  /**
   * Technique costs grow with power and accuracy falls, so the starters keep their place:
   * AP = apBase + apPerPower × (power − 1), FP likewise, accuracy = −accPerPower × (power − 1).
   * "Power" is per-strike power × number of strikes.
   */
  readonly techApBase: number;
  readonly techApPerPower: number;
  readonly techApMin: number;
  readonly techFpBase: number;
  readonly techFpPerPower: number;
  /** Extra FP for ranged attacks (shots, volleys, throws): the price of reach. */
  readonly rangedFpSurcharge: number;
  /** Scudi for a victory: a purse, plus per enemy defeated (more for veterans), plus a bonus if no one on your side fell. */
  readonly rewardVictory: number;
  readonly rewardPerEnemy: number;
  readonly rewardPerEnemyLevel: number;
  readonly rewardNoLosses: number;
  /** Salvaged parts (for Workshop crafting): per enemy beaten, and for the victory. */
  readonly partsPerEnemy: number;
  /** Pilot level at which a class can be chosen. */
  readonly promotionLevel: number;
  readonly partsVictory: number;
  /** The Armoury asks for a second tap before spending more than this share of the purse. */
  readonly armouryConfirmFraction: number;
  readonly techFpMin: number;
  readonly techAccPerPower: number;
  readonly techAccMax: number;
  /**
   * Faction techniques are costed by `techniqueStats`: the same AP and FP per power, but a much
   * smaller accuracy tax (`techniqueAccPerPower` instead of `techAccPerPower`), and each rank
   * (2 levels of the technique's unlock level) cuts FP by `techRankFpDiscount`, AP by
   * `techRankApDiscount` and adds `techRankAccBonus` accuracy, so a master technique is both
   * stronger and more economical than an early one.
   */
  readonly techniqueAccPerPower: number;
  readonly techRankAccBonus: number;
  readonly techRankFpDiscount: number;
  readonly techRankApDiscount: number;
  /**
   * The yardstick (see `techniqueValue`): `techValueFatigue` is the damage-equivalent of 1 FP of
   * fatigue inflicted, `techValueNoCounter` that of making a blow unanswerable, and the
   * `techRef…` numbers describe the reference target (raw damage at power 1, and DEF) the damage
   * is measured against.
   */
  /**
   * What a technique's extras add to its price on top of the power formula: a knockdown or
   * collision costs AP and FP; piercing costs `techPierceFp` per whole point of DEF ignored,
   * fatigue inflicted costs `techFatigueFp` FP per FP, sapping and slowing a flat FP, and each
   * point of accuracy bonus costs `techAccAp` AP and `techAccFp` FP. With no rank discounts, a
   * later technique is a different tool, not a cheaper copy of an earlier one.
   */
  readonly techKnockdownAp: number;
  readonly techKnockdownFp: number;
  readonly techCollisionAp: number;
  readonly techCollisionFp: number;
  readonly techPierceFp: number;
  readonly techFatigueFp: number;
  readonly techWeakenFp: number;
  readonly techSlowFp: number;
  readonly techAccAp: number;
  readonly techAccFp: number;
  readonly techValueFatigue: number;
  readonly techValueNoCounter: number;
  /** Damage-equivalents (in starter strikes) of a knockdown, a collision, a sapped foe and each MOV of slow. */
  readonly techValueKnockdown: number;
  readonly techValueCollision: number;
  readonly techValueWeaken: number;
  readonly techValueSlow: number;
  readonly techRefRaw: number;
  readonly techRefDef: number;
  /** Counter: success chance = base + factor × ((DEX + AGL) of defender − of attacker), clamped. */
  readonly counterBaseChance: number;
  readonly counterStatFactor: number;
  /** + Counter chance per point of the defender's INT. */
  readonly counterIntFactor: number;
  /** Tiles within which bonded allies support each other. */
  readonly bondRange: number;
  /** Per bond rank: + hit chance, + damage dealt (fraction), − damage taken (fraction). */
  readonly bondHit: number;
  readonly bondDamage: number;
  readonly bondGuard: number;
  /** − Counter chance against a blow from the side (rear blows cannot be countered). */
  readonly counterSidePenalty: number;
  /** + reflect multiplier per point of the defender's INT. */
  readonly counterReflectPerInt: number;
  readonly counterMinChance: number;
  readonly counterMaxChance: number;
  /** On success the attacker takes this multiple of the blow; on failure the defender does. */
  readonly counterReflectMult: number;
  readonly counterFailMult: number;
  /** AP a knocked-down target starts its next turn without (knockdown / collision). */
  readonly knockdownAp: number;
  readonly collisionAp: number;
  /** Share of its damage a sapped (weakened) unit still deals. */
  readonly weakenMult: number;
  /**
   * Difficulty (chosen per playthrough, see difficulty.ts). Enemies built from content gain
   * `…EnemyLevel` levels (never below 1) and have every attribute multiplied by `…EnemyStats`;
   * all scudi income is multiplied by `…Scudi`. `…DefeatKeepsXp` = 1 means a lost battle keeps
   * the experience the company earned in it (retrying costs nothing); 0 means that attempt's
   * experience is lost. Knight is the reference balance and stays neutral (0, 1, 1).
   */
  readonly squireEnemyLevel: number;
  readonly squireEnemyStats: number;
  readonly squireScudi: number;
  readonly squireDefeatKeepsXp: number;
  readonly knightEnemyLevel: number;
  readonly knightEnemyStats: number;
  readonly knightScudi: number;
  readonly knightDefeatKeepsXp: number;
  readonly grandMasterEnemyLevel: number;
  readonly grandMasterEnemyStats: number;
  readonly grandMasterScudi: number;
  readonly grandMasterDefeatKeepsXp: number;
  /**
   * New Game+: every completed cycle stacks this many enemy levels and this share of the enemy
   * attribute multiplier on top of the difficulty (cycle n: level + n × levels, attributes ×
   * (1 + n × share)).
   */
  readonly ngPlusEnemyLevelPerCycle: number;
  readonly ngPlusEnemyStatsPerCycle: number;
}

export const DEFAULT_BALANCE: BalanceConfig = {
  apMax: 100,
  apStart: 100,
  apRegen: 100,
  climbApPerStep: 0,
  maxClimb: 2,
  firstStepMult: 2,
  allyPassAp: 5,
  gunPower: 1.25,
  gunAccuracy: -25,
  gunPierce: 0.1,
  bombPower: 1.5,
  fpMax: 100,
  apPerFpRecovered: 1.5,
  fpTired: 50,
  tiredPenalty: 10,
  defendFpCost: 30,
  avoidFpCost: 20,
  counterFpCost: 20,
  baseHit: 55,
  hitMin: 5,
  hitMax: 99,
  defendHitMax: 99,
  intFpReduction: 0.015,
  intFpReductionMax: 0.4,
  dexHitFactor: 2.4,
  aglEvadeFactor: 2,
  damagePerPoint: 1.1,
  defDamagePerPoint: 0.8,
  damageScale: 0.7,
  heightHitPerStep: 5,
  heightDamagePerStep: 0.1,
  heightDamageMaxSteps: 3,
  sideHitBonus: 10,
  rearHitBonus: 25,
  rearDamageMult: 1.25,
  assistPerAlly: 5,
  assistMax: 15,
  defendDamageMult: 0.5,
  counterHitBonus: 15,
  xpHitBase: 30,
  xpDamageShare: 100,
  xpDefeat: 200,
  xpFront: 1,
  xpSide: 0.8,
  xpRear: 0.5,
  xpScale: 2.2,
  xpPerLevel: 500,
  xpLevelCostGrowth: 0.06,
  xpGapBonus: 0.3,
  xpGapCurve: 0.05,
  xpGapDecay: 0.72,
  xpMinFactor: 0.05,
  xpMaxFactor: 4,
  statPointsPerLevel: 3,
  statMax: 32,
  hpPerLevel: 2,
  hpPerBas: 7,
  hpBase: 10,
  techApBase: 30,
  techApPerPower: 50,
  techApMin: 20,
  techFpBase: 5,
  techFpPerPower: 45,
  rangedFpSurcharge: 20,
  rewardVictory: 300,
  rewardPerEnemy: 90,
  rewardPerEnemyLevel: 20,
  rewardNoLosses: 150,
  partsPerEnemy: 1,
  promotionLevel: 10,
  partsVictory: 1,
  armouryConfirmFraction: 0.5,
  techFpMin: 5,
  techAccPerPower: 60,
  techAccMax: 20,
  techniqueAccPerPower: 15,
  techRankAccBonus: 0,
  techRankFpDiscount: 0,
  techRankApDiscount: 0,
  techKnockdownAp: 10,
  techKnockdownFp: 10,
  techCollisionAp: 15,
  techCollisionFp: 20,
  techPierceFp: 20,
  techFatigueFp: 0.5,
  techWeakenFp: 10,
  techSlowFp: 6,
  techAccAp: 0.5,
  techAccFp: 0.5,
  techValueFatigue: 0.12,
  techValueNoCounter: 0.4,
  techValueKnockdown: 0.5,
  techValueCollision: 0.9,
  techValueWeaken: 0.3,
  techValueSlow: 0.2,
  techRefRaw: 30,
  techRefDef: 8,
  counterBaseChance: 25,
  counterStatFactor: 1.5,
  counterIntFactor: 3.5,
  bondRange: 2,
  bondHit: 6,
  bondDamage: 0.06,
  bondGuard: 0.06,
  counterSidePenalty: 15,
  counterReflectPerInt: 0.06,
  counterMinChance: 5,
  counterMaxChance: 90,
  counterReflectMult: 1.5,
  counterFailMult: 1.5,
  knockdownAp: 35,
  collisionAp: 55,
  weakenMult: 0.7,
  squireEnemyLevel: -1,
  squireEnemyStats: 0.85,
  squireScudi: 1.5,
  squireDefeatKeepsXp: 1,
  knightEnemyLevel: 0,
  knightEnemyStats: 1,
  knightScudi: 1,
  knightDefeatKeepsXp: 0,
  grandMasterEnemyLevel: 2,
  grandMasterEnemyStats: 1.15,
  grandMasterScudi: 0.75,
  grandMasterDefeatKeepsXp: 0,
  ngPlusEnemyLevelPerCycle: 6,
  ngPlusEnemyStatsPerCycle: 0.2,
};

/** Attack styles that strike from range (guns and grenades): they pay extra FP. */
export const RANGED_STYLES: ReadonlySet<string> = new Set(['shot', 'volley', 'throw']);

/**
 * AP, FP and accuracy a technique of this total power costs under the shared formula. Ranged
 * styles also pay `rangedFpSurcharge` FP.
 */
export function techniqueCost(
  power: number,
  hits: number,
  b: BalanceConfig,
  style?: string,
): { apCost: number; fpCost: number; accuracy: number } {
  const p = power * hits - 1;
  const round5 = (v: number) => Math.round(v / 5) * 5;
  const ranged = style !== undefined && RANGED_STYLES.has(style) ? b.rangedFpSurcharge : 0;
  return {
    apCost: Math.max(b.techApMin, round5(b.techApBase + b.techApPerPower * p)),
    fpCost: Math.max(b.techFpMin, Math.round(b.techFpBase + b.techFpPerPower * p)) + ranged,
    accuracy: Math.min(b.techAccMax, Math.round(-b.techAccPerPower * p)) || 0,
  };
}

/** XP to go from `level` to the next one: `xpPerLevel`, rising by `xpLevelCostGrowth` per level. */
export function xpToNextLevel(level: number, b: BalanceConfig): number {
  const steps = Math.max(0, Math.floor(level) - 1);
  return Math.round((b.xpPerLevel * (1 + b.xpLevelCostGrowth * steps)) / 5) * 5;
}

/**
 * The level-gap multiplier on XP: tougher targets pay more (1 + 0.30·gap + 0.05·gap², capped),
 * weaker ones much less (0.72 per level below, floored).
 */
export function xpGapFactor(gap: number, b: BalanceConfig): number {
  if (gap >= 0) return Math.min(b.xpMaxFactor, 1 + b.xpGapBonus * gap + b.xpGapCurve * gap * gap);
  return Math.max(b.xpMinFactor, Math.pow(b.xpGapDecay, -gap));
}

/** A technique's rank: one for every two levels of its unlock level (level 3 is rank 1). */
export function techniqueRank(level: number): number {
  return Math.floor((Math.max(1, level) - 1) / 2);
}

/** The parts of a technique that cost extra (see `BalanceConfig.techKnockdownAp`). */
export interface TechniqueTraits {
  readonly kind?: 'knockdown' | 'collision' | undefined;
  readonly pierce?: number | undefined;
  readonly fatigue?: number | undefined;
  readonly weaken?: boolean | undefined;
  readonly slow?: number | undefined;
  /** The technique's own precision, added to the formula's accuracy by the caller. */
  readonly accuracyBonus?: number | undefined;
}

/**
 * AP, FP and accuracy of a faction technique: the shared formula with the smaller accuracy tax,
 * plus a price for every extra it carries (knockdown, piercing, fatigue, debuffs, precision).
 * The rank discounts are kept in the balance table but ship at zero. Starters use `techniqueCost`.
 */
export function techniqueStats(
  power: number,
  hits: number,
  level: number,
  b: BalanceConfig,
  style?: string,
  traits: TechniqueTraits = {},
): { apCost: number; fpCost: number; accuracy: number } {
  const p = power * hits - 1;
  const rank = techniqueRank(level);
  const round5 = (v: number) => Math.round(v / 5) * 5;
  const ranged = style !== undefined && RANGED_STYLES.has(style) ? b.rangedFpSurcharge : 0;
  const acc = Math.max(0, traits.accuracyBonus ?? 0);
  const extraAp =
    (traits.kind === 'collision' ? b.techCollisionAp : traits.kind ? b.techKnockdownAp : 0) +
    acc * b.techAccAp;
  const extraFp =
    (traits.kind === 'collision' ? b.techCollisionFp : traits.kind ? b.techKnockdownFp : 0) +
    (traits.pierce ?? 0) * b.techPierceFp +
    (traits.fatigue ?? 0) * b.techFatigueFp +
    (traits.weaken ? b.techWeakenFp : 0) +
    (traits.slow ?? 0) * b.techSlowFp +
    acc * b.techAccFp;
  return {
    apCost: Math.max(
      b.techApMin,
      round5((b.techApBase + b.techApPerPower * p) * (1 - b.techRankApDiscount * rank) + extraAp),
    ),
    // Extras are priced on top of the clamped base, so a cheap technique cannot carry them free.
    fpCost:
      Math.max(
        b.techFpMin,
        Math.round((b.techFpBase + b.techFpPerPower * p) * (1 - b.techRankFpDiscount * rank)),
      ) +
      Math.round(extraFp) +
      ranged,
    accuracy:
      Math.min(b.techAccMax, Math.round(-b.techniqueAccPerPower * p) + b.techRankAccBonus * rank) ||
      0,
  };
}
