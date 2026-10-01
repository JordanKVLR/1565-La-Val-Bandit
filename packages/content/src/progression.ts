import type { Character } from './schemas';

type Stats = Character['stats'];

/**
 * Deterministic growth: a stat with growth g% gains floor(L·g/100) − floor((L−1)·g/100) at level L,
 * so 50% growth means +1 every other level with no dice (replays and saves stay predictable).
 */
export function growthAt(level: number, rate: number): number {
  return Math.floor((level * rate) / 100) - Math.floor(((level - 1) * rate) / 100);
}

const KEYS = ['bas', 'pow', 'dex', 'agl', 'def', 'wep'] as const;

/**
 * Typical stats for a character who has reached `level`: base stats plus the stat points from
 * each level-up, spread in proportion to the character's growth leanings. Players choose where
 * their points go; this is the "expected" build used for battle defaults and AI allies.
 */
export function statsAtLevel(
  c: Pick<Character, 'stats' | 'growth'>,
  level: number,
  pointsPerLevel = 3,
): Stats {
  const total = Math.max(0, level - 1) * pointsPerLevel;
  const weight = KEYS.reduce((n, k) => n + c.growth[k], 0) || 1;
  const exact = KEYS.map((k) => (total * c.growth[k]) / weight);
  const given = exact.map(Math.floor);
  let left = total - given.reduce((a, b) => a + b, 0);
  const order = KEYS.map((_, i) => i).sort(
    (a, b) => exact[b]! - given[b]! - (exact[a]! - given[a]!) || a - b,
  );
  for (const i of order) {
    if (left <= 0) break;
    given[i]! += 1;
    left -= 1;
  }
  return Object.fromEntries(KEYS.map((k, i) => [k, c.stats[k] + given[i]!])) as Stats;
}

/**
 * BAS/DEF/WEP for generic units that only list POW/DEX/AGL: they grow with level, and heavier
 * frames are sturdier. Enemies are kept lighter than allied militia, so fights are won by tactics
 * rather than attrition (tuned with the balance simulation).
 */
export function derivedStats(
  level: number,
  frameClass: 'light' | 'medium' | 'heavy',
  side: 'player' | 'enemy' = 'enemy',
): Pick<Stats, 'bas' | 'def' | 'wep'> {
  const heft = frameClass === 'heavy' ? 2 : frameClass === 'medium' ? 1 : 0;
  const mine = side === 'player';
  return {
    bas: (mine ? 4 : 3) + Math.round(level * 0.5) + heft,
    def: mine ? 2 + Math.round(level * 0.5) + heft * 2 : 1 + Math.round(level * 0.3) + heft,
    wep: 4 + Math.round(level * 0.5),
  };
}
