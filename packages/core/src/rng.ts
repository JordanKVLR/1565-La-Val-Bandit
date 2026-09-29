/**
 * Deterministic seeded RNG (mulberry32). The state is a plain 32-bit integer so it can live
 * inside serializable game state: same seed + same commands = same battle, every time.
 */
export type RngState = number;

export function createRng(seed: number): RngState {
  return seed >>> 0;
}

/** Returns a float in [0, 1) and the next RNG state. Never mutates. */
export function nextFloat(state: RngState): [value: number, next: RngState] {
  const next = (state + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

/** Returns an integer in [min, max] inclusive. */
export function nextInt(
  state: RngState,
  min: number,
  max: number,
): [value: number, next: RngState] {
  if (max < min) throw new RangeError(`nextInt: max (${max}) < min (${min})`);
  const [f, next] = nextFloat(state);
  return [min + Math.floor(f * (max - min + 1)), next];
}

/** Rolls a percentage check: true when a d100 roll (1–100) is <= chance. */
export function rollPercent(state: RngState, chance: number): [success: boolean, next: RngState] {
  const [roll, next] = nextInt(state, 1, 100);
  return [roll <= chance, next];
}
