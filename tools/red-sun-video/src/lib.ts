export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);
export const easeIn = (t: number) => t * t * t;
export const easeOutBack = (t: number) => {
  const c1 = 1.4, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
/** Eased 0..1 progress of t between a and b. Never linear. */
export const prog = (t: number, a: number, b: number, ease = easeInOut) => ease(clamp((t - a) / (b - a)));
/** Eased interpolation through [time, value] keyframes. */
export function keyed(t: number, keys: [number, number][], ease = easeInOut): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
      return lerp(v0, v1, ease(clamp((t - t0) / Math.max(1e-6, t1 - t0))));
    }
  }
  return keys[keys.length - 1][1];
}
/** Deterministic PRNG (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const mix = (c1: [number, number, number], c2: [number, number, number], t: number) =>
  `rgb(${Math.round(lerp(c1[0], c2[0], t))},${Math.round(lerp(c1[1], c2[1], t))},${Math.round(lerp(c1[2], c2[2], t))})`;
/** One arm of the 8-pointed Maltese cross (centre 0,0, radius 1). Rotate by 90 degrees four times. */
export const MALTESE_ARM = "M-0.1 -0.1 L-0.26 -1 L0 -0.8 L0.26 -1 L0.1 -0.1 Z";
