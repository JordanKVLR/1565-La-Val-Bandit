import type { BalanceConfig } from './balance';
import type { PilotStats } from './units';

/**
 * How hard a playthrough is. Squire is the story mode, Knight the reference balance (default),
 * Grand Master the stiffest. The numbers behind each live in the balance config (ADR 0007).
 */
export type Difficulty = 'squire' | 'knight' | 'grandMaster';

export const DIFFICULTIES: readonly Difficulty[] = ['squire', 'knight', 'grandMaster'];
export const DEFAULT_DIFFICULTY: Difficulty = 'knight';

export function isDifficulty(v: unknown): v is Difficulty {
  return typeof v === 'string' && (DIFFICULTIES as readonly string[]).includes(v);
}

export interface DifficultyMods {
  /** Levels added to every enemy (negative removes them; enemies never drop below level 1). */
  readonly enemyLevel: number;
  /** Multiplier on every enemy attribute. */
  readonly enemyStats: number;
  /** Multiplier on all scudi income. */
  readonly scudi: number;
  /** A lost battle keeps the experience earned in it. */
  readonly defeatKeepsXp: boolean;
}

export function difficultyMods(b: BalanceConfig, d: Difficulty): DifficultyMods {
  return {
    enemyLevel: b[`${d}EnemyLevel`],
    enemyStats: b[`${d}EnemyStats`],
    scudi: b[`${d}Scudi`],
    defeatKeepsXp: b[`${d}DefeatKeepsXp`] > 0,
  };
}

/** How content-built enemies are adjusted for a difficulty and New Game+ cycle. */
export interface EnemyScaling {
  readonly levelBonus: number;
  readonly statMult: number;
}

export const NO_SCALING: EnemyScaling = { levelBonus: 0, statMult: 1 };

/**
 * Difficulty and New Game+ stack: cycle n adds n × `ngPlusEnemyLevelPerCycle` levels and
 * multiplies attributes by (1 + n × `ngPlusEnemyStatsPerCycle`) on top of the difficulty.
 */
export function enemyScaling(b: BalanceConfig, d: Difficulty, ngPlus = 0): EnemyScaling {
  const mods = difficultyMods(b, d);
  const cycle = Math.max(0, Math.floor(ngPlus));
  return {
    levelBonus: mods.enemyLevel + cycle * b.ngPlusEnemyLevelPerCycle,
    statMult: mods.enemyStats * (1 + cycle * b.ngPlusEnemyStatsPerCycle),
  };
}

export function scaleEnemyLevel(level: number, s: EnemyScaling): number {
  return Math.max(1, level + s.levelBonus);
}

/** Multiplies every attribute, rounding and keeping each within 1…statMax. Neutral is a no-op. */
export function scaleEnemyStats(stats: PilotStats, s: EnemyScaling, statMax: number): PilotStats {
  if (s.statMult === 1) return stats;
  const out = { ...stats };
  for (const k of Object.keys(out) as (keyof PilotStats)[]) {
    out[k] = Math.max(1, Math.min(statMax, Math.round(out[k] * s.statMult)));
  }
  return out;
}

/** Scudi income after the difficulty multiplier (whole coins). */
export function scaleScudi(amount: number, b: BalanceConfig, d: Difficulty): number {
  return Math.round(amount * difficultyMods(b, d).scudi);
}
