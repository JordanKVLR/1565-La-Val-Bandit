import type { Character } from './schemas';

type Stats = Character['stats'];

/**
 * Deterministic growth: a stat with growth g% gains floor(L·g/100) − floor((L−1)·g/100) at level L,
 * so 50% growth means +1 every other level with no dice (replays and saves stay predictable).
 */
export function growthAt(level: number, rate: number): number {
  return Math.floor((level * rate) / 100) - Math.floor(((level - 1) * rate) / 100);
}

/** A character's stats at a level, from base stats plus deterministic growth. */
export function statsAtLevel(c: Pick<Character, 'stats' | 'growth'>, level: number): Stats {
  const out = { ...c.stats };
  for (let l = 2; l <= level; l++) {
    out.str += growthAt(l, c.growth.str);
    out.skl += growthAt(l, c.growth.skl);
    out.agi += growthAt(l, c.growth.agi);
  }
  return out;
}
