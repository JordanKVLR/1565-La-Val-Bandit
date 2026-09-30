import type { Character } from './schemas';

type Stats = Character['stats'];

/**
 * Deterministic growth: a stat with growth g% gains floor(L·g/100) − floor((L−1)·g/100) at level L,
 * so 50% growth means +1 every other level with no dice (replays and saves stay predictable).
 */
export function growthAt(level: number, rate: number): number {
  return Math.floor((level * rate) / 100) - Math.floor(((level - 1) * rate) / 100);
}

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
  const keys = ['str', 'skl', 'agi'] as const;
  const total = Math.max(0, level - 1) * pointsPerLevel;
  const weight = keys.reduce((n, k) => n + c.growth[k], 0) || 1;
  const exact = keys.map((k) => (total * c.growth[k]) / weight);
  const given = exact.map(Math.floor);
  let left = total - given.reduce((a, b) => a + b, 0);
  const order = keys
    .map((_, i) => i)
    .sort((a, b) => exact[b]! - given[b]! - (exact[a]! - given[a]!) || a - b);
  for (const i of order) {
    if (left <= 0) break;
    given[i]! += 1;
    left -= 1;
  }
  return {
    str: c.stats.str + given[0]!,
    skl: c.stats.skl + given[1]!,
    agi: c.stats.agi + given[2]!,
  };
}
