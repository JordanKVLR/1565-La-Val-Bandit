import { describe, expect, it } from 'vitest';
import { createRng, nextFloat, nextInt, rollPercent } from '../src';

describe('rng', () => {
  it('is deterministic for the same seed', () => {
    const a = nextFloat(createRng(1565));
    const b = nextFloat(createRng(1565));
    expect(a).toEqual(b);
  });

  it('produces different sequences for different seeds', () => {
    expect(nextFloat(createRng(1))[0]).not.toBe(nextFloat(createRng(2))[0]);
  });

  it('keeps floats in [0, 1) and ints within bounds', () => {
    let s = createRng(42);
    for (let i = 0; i < 10_000; i++) {
      const [f, s1] = nextFloat(s);
      const [n, s2] = nextInt(s1, 3, 7);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(7);
      s = s2;
    }
  });

  it('rejects an inverted range', () => {
    expect(() => nextInt(createRng(0), 5, 1)).toThrow(RangeError);
  });

  it('rollPercent respects 0% and 100%', () => {
    let s = createRng(7);
    for (let i = 0; i < 500; i++) {
      const [never, s1] = rollPercent(s, 0);
      const [always, s2] = rollPercent(s1, 100);
      expect(never).toBe(false);
      expect(always).toBe(true);
      s = s2;
    }
  });
});
