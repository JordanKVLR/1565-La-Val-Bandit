import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BALANCE as B,
  techniquePowerTarget,
  techniqueStats,
  techniqueTierAccuracy,
} from '../src';

describe('technique power curve (ADR 0024)', () => {
  it('rises 0.09 per unlock level, scaled by the tool', () => {
    expect(techniquePowerTarget(10, 'heavy', B)).toBeCloseTo(1.9 * 1.1);
    expect(techniquePowerTarget(21, 'collision', B)).toBeCloseTo(2.89 * 0.85);
    expect(techniquePowerTarget(25, 'debuff', B)).toBeCloseTo(3.25 * 0.8);
    expect(techniquePowerTarget(21, 'heavy', B)).toBeGreaterThan(
      techniquePowerTarget(3, 'heavy', B) * 2,
    );
  });

  it('gives a deep pierce a smaller share than a light one', () => {
    expect(techniquePowerTarget(13, 'pierce', B, 0.5)).toBeCloseTo(2.17 * 0.9);
    expect(techniquePowerTarget(13, 'pierce', B, 0.65)).toBeCloseTo(2.17 * 0.85);
  });

  it('aims better in higher tiers', () => {
    expect([3, 7, 13, 18, 25].map((l) => techniqueTierAccuracy(l, B))).toEqual([0, 5, 10, 15, 15]);
  });
});

describe('technique costs (ADR 0024)', () => {
  it('prices Weight tools mostly in AP and Spirit tools mostly in FP', () => {
    const weight = techniqueStats(3.18, 1, 21, B, 'overhead', { tool: 'heavy' });
    const spirit = techniqueStats(3.18, 1, 21, B, 'thrust', { tool: 'pierce' });
    expect(weight).toMatchObject({ apCost: 65, fpCost: 49 });
    expect(spirit).toMatchObject({ apCost: 35, fpCost: 80 });
    expect(weight.apCost).toBeGreaterThan(spirit.apCost);
    expect(weight.fpCost).toBeLessThan(spirit.fpCost);
  });

  it('adds AP for a knockdown or collision, and nothing for other riders', () => {
    const plain = techniqueStats(2, 1, 13, B, 'bash', { tool: 'knockdown' });
    const kd = techniqueStats(2, 1, 13, B, 'bash', { tool: 'knockdown', kind: 'knockdown' });
    const col = techniqueStats(2, 1, 13, B, 'bash', { tool: 'collision', kind: 'collision' });
    expect(kd.apCost - plain.apCost).toBe(10);
    expect(col.apCost - plain.apCost).toBe(15);
    expect(techniqueStats(2, 1, 13, B, 'thrust', { tool: 'pierce', pierce: 0.8 })).toEqual(
      techniqueStats(2, 1, 13, B, 'thrust', { tool: 'pierce' }),
    );
  });

  it('makes gunfire and bombs pay in FP, never more than the cap', () => {
    const shot = techniqueStats(2.4, 1, 21, B, 'shot', { tool: 'heavy' });
    expect(shot.apCost).toBeLessThanOrEqual(35);
    expect(shot.fpCost).toBe(B.techFpMax);
  });

  it('never undercuts a starter on FP', () => {
    expect(techniqueStats(1.1, 1, 3, B, 'slash', { tool: 'precise' }).fpCost).toBe(
      B.techniqueFpMin,
    );
  });

  it('gives the tier accuracy on top of the formula', () => {
    expect(techniqueStats(1.5, 1, 6, B, 'slash', { tool: 'heavy' }).accuracy).toBe(0);
    expect(techniqueStats(1.5, 1, 21, B, 'slash', { tool: 'heavy' }).accuracy).toBe(15);
  });
});
