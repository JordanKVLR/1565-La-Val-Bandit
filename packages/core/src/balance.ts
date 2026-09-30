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
  readonly hitMin: number;
  readonly hitMax: number;
  readonly sklHitFactor: number;
  readonly agiEvadeFactor: number;
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
  /** Base XP for landing a hit, and for the blow that defeats a unit. */
  readonly xpHit: number;
  readonly xpDefeat: number;
  /** XP needed for each level. Always the same amount; leftover XP carries over. */
  readonly xpPerLevel: number;
  /** XP changes by this fraction per level the target is above (+) or below (−) the attacker. */
  readonly xpLevelFactor: number;
  readonly xpMinFactor: number;
  readonly xpMaxFactor: number;
  /** Stat points granted per level-up, spent by the player on STR/SKL/AGI. */
  readonly statPointsPerLevel: number;
  /** Max HP gained per level (before VIT). */
  readonly hpPerLevel: number;
  /** Damage blocked per point of DEF. */
  readonly defDamagePerPoint: number;
  /** Max HP added per point of VIT, as a percentage of base HP. */
  readonly vitHpPercent: number;
  /** Accuracy bonus per INT point for techniques (not basic attacks). */
  readonly intTechniqueAccuracy: number;
  /** FP cost reduction per SPI point (percent), and its cap. */
  readonly spiFpCostPercent: number;
  readonly spiFpCostMax: number;
  /** Extra FP recovered per turn per SPI point. */
  readonly spiFpRecovery: number;
  /** Resistance to enemy fatigue/AP-drain effects per SPI point (percent), and its cap. */
  readonly spiResistPercent: number;
  readonly spiResistMax: number;
  /** Counter: success chance = base + factor × (defender INT − attacker INT), clamped. */
  readonly counterBaseChance: number;
  readonly counterIntFactor: number;
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
  climbApPerStep: 4,
  maxClimb: 2,
  fpMax: 100,
  apPerFpRecovered: 1.5,
  fpTired: 50,
  tiredPenalty: 10,
  defendFpCost: 30,
  avoidFpCost: 20,
  counterFpCost: 20,
  hitMin: 5,
  hitMax: 95,
  sklHitFactor: 2,
  agiEvadeFactor: 2,
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
  xpHit: 10,
  xpDefeat: 40,
  xpPerLevel: 100,
  xpLevelFactor: 0.2,
  xpMinFactor: 0.1,
  xpMaxFactor: 3,
  statPointsPerLevel: 5,
  hpPerLevel: 3,
  defDamagePerPoint: 1.5,
  vitHpPercent: 5,
  intTechniqueAccuracy: 1,
  spiFpCostPercent: 2,
  spiFpCostMax: 50,
  spiFpRecovery: 1,
  spiResistPercent: 3,
  spiResistMax: 60,
  counterBaseChance: 10,
  counterIntFactor: 2,
  counterMinChance: 5,
  counterMaxChance: 35,
  counterReflectMult: 1.25,
  counterFailMult: 1.25,
};
