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
  readonly fpRecovery: number;
  readonly fpRestRecovery: number;
  /** At or above this fatigue a unit is Tired. */
  readonly fpTired: number;
  /** Hit-chance penalty when a Tired unit attacks (and bonus when it is attacked). */
  readonly tiredPenalty: number;
  readonly avoidApCost: number;
  readonly avoidFpCost: number;
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
  /** A defender that counters or cannot react is easier to hit than one that avoids. */
  readonly counterHitBonus: number;
  readonly xpHit: number;
  readonly xpDefeat: number;
}

export const DEFAULT_BALANCE: BalanceConfig = {
  apMax: 100,
  apStart: 20,
  apRegen: 40,
  climbApPerStep: 4,
  maxClimb: 2,
  fpMax: 100,
  fpRecovery: 15,
  fpRestRecovery: 35,
  fpTired: 50,
  tiredPenalty: 10,
  avoidApCost: 10,
  avoidFpCost: 10,
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
  xpDefeat: 30,
};
