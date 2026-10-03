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
  readonly dexHitFactor: number;
  readonly aglEvadeFactor: number;
  /** Raw damage = (POW + WEP) × this × attack power × situational multipliers. */
  readonly damagePerPoint: number;
  /** Damage blocked per point of DEF (armaturas have no armour of their own). */
  readonly defDamagePerPoint: number;
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
  /** XP needed for each level. Always the same amount; leftover XP carries over. */
  readonly xpPerLevel: number;
  /** XP changes by this fraction per level the target is above (+) or below (−) the attacker. */
  readonly xpLevelFactor: number;
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
  /** The Armoury asks for a second tap before spending more than this share of the purse. */
  readonly armouryConfirmFraction: number;
  readonly techFpMin: number;
  readonly techAccPerPower: number;
  readonly techAccMax: number;
  /** Counter: success chance = base + factor × ((DEX + AGL) of defender − of attacker), clamped. */
  readonly counterBaseChance: number;
  readonly counterStatFactor: number;
  readonly counterMinChance: number;
  readonly counterMaxChance: number;
  /** On success the attacker takes this multiple of the blow; on failure the defender does. */
  readonly counterReflectMult: number;
  readonly counterFailMult: number;
}

export const DEFAULT_BALANCE: BalanceConfig = {
  apMax: 100,
  apStart: 100,
  apRegen: 100,
  climbApPerStep: 6,
  maxClimb: 2,
  fpMax: 100,
  apPerFpRecovered: 1.5,
  fpTired: 50,
  tiredPenalty: 10,
  defendFpCost: 30,
  avoidFpCost: 20,
  counterFpCost: 20,
  baseHit: 65,
  hitMin: 5,
  hitMax: 95,
  dexHitFactor: 2,
  aglEvadeFactor: 2,
  damagePerPoint: 1.6,
  defDamagePerPoint: 1.5,
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
  xpHitBase: 75,
  xpDamageShare: 200,
  xpDefeat: 400,
  xpFront: 1,
  xpSide: 0.8,
  xpRear: 0.5,
  xpPerLevel: 500,
  xpLevelFactor: 0.2,
  xpMinFactor: 0.1,
  xpMaxFactor: 3,
  statPointsPerLevel: 3,
  statMax: 32,
  hpPerLevel: 2,
  hpPerBas: 4,
  hpBase: 10,
  techApBase: 30,
  techApPerPower: 50,
  techApMin: 20,
  techFpBase: 5,
  techFpPerPower: 45,
  rangedFpSurcharge: 20,
  rewardVictory: 150,
  rewardPerEnemy: 60,
  rewardPerEnemyLevel: 15,
  rewardNoLosses: 100,
  armouryConfirmFraction: 0.5,
  techFpMin: 5,
  techAccPerPower: 60,
  techAccMax: 20,
  counterBaseChance: 10,
  counterStatFactor: 1,
  counterMinChance: 5,
  counterMaxChance: 35,
  counterReflectMult: 1.25,
  counterFailMult: 1.25,
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
