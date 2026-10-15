import { describe, expect, it } from 'vitest';
import {
  applyCommand,
  createBattle,
  DEFAULT_BALANCE,
  requireUnit,
  xpFor,
  xpGapFactor,
  xpToNextLevel,
} from '../src';
import { makeMap, setup, unit } from './fixtures';

const B = DEFAULT_BALANCE;

describe('the level-gap XP factor', () => {
  it('is 1 at equal levels', () => {
    expect(xpGapFactor(0, B)).toBe(1);
  });

  it('pays more, and ever more, for tougher foes (1 + 0.30·gap + 0.05·gap²)', () => {
    expect(xpGapFactor(1, B)).toBeCloseTo(1.35);
    expect(xpGapFactor(2, B)).toBeCloseTo(1.8);
    expect(xpGapFactor(3, B)).toBeCloseTo(2.35);
    expect(xpGapFactor(5, B)).toBeCloseTo(3.75);
  });

  it('is capped for very tough foes', () => {
    expect(xpGapFactor(6, B)).toBe(B.xpMaxFactor);
    expect(xpGapFactor(20, B)).toBe(B.xpMaxFactor);
  });

  it('penalises weaker foes by 0.72 per level, down to a floor', () => {
    expect(xpGapFactor(-1, B)).toBeCloseTo(0.72);
    expect(xpGapFactor(-2, B)).toBeCloseTo(0.5184);
    expect(xpGapFactor(-3, B)).toBeCloseTo(0.373, 3);
    expect(xpGapFactor(-30, B)).toBe(B.xpMinFactor);
  });

  it('never rises as the foe gets weaker, and has no jump at zero', () => {
    for (let g = 10; g > -12; g--)
      expect(xpGapFactor(g, B)).toBeGreaterThanOrEqual(xpGapFactor(g - 1, B));
    expect(xpGapFactor(1, B) - xpGapFactor(0, B)).toBeGreaterThan(0);
    expect(xpGapFactor(0, B) - xpGapFactor(-1, B)).toBeGreaterThan(0);
  });
});

describe('XP to the next level', () => {
  it('starts at xpPerLevel and rises 6% of it per level', () => {
    expect(xpToNextLevel(1, B)).toBe(500);
    expect(xpToNextLevel(2, B)).toBe(530);
    expect(xpToNextLevel(5, B)).toBe(620);
    expect(xpToNextLevel(10, B)).toBe(770);
    expect(xpToNextLevel(14, B)).toBe(890);
  });

  it('reaching level 12 costs 7,150 XP in all (5,500 when flat)', () => {
    let total = 0;
    for (let l = 1; l < 12; l++) total += xpToNextLevel(l, B);
    expect(total).toBe(7150);
  });

  it('is flat when the growth is zero', () => {
    expect(xpToNextLevel(9, { ...B, xpLevelCostGrowth: 0 })).toBe(500);
  });
});

describe('XP in a fight', () => {
  const fight = (aLevel: number, tLevel: number) => {
    const { state } = createBattle(
      setup({
        balance: { ...B, damageScale: 1 },
        map: makeMap(['ppppp', 'ppppp', 'ppppp']),
        units: [
          unit({
            id: 'a',
            controller: 'human',
            level: aLevel,
            at: { x: 2, y: 1 },
            facing: 'south',
          }),
          unit({ id: 't', side: 'enemy', level: tLevel, at: { x: 2, y: 2 }, facing: 'north' }),
        ],
      }),
    );
    return state;
  };

  it('pays 25% more than before at equal levels (xpScale)', () => {
    const s = fight(5, 5);
    const a = requireUnit(s, 'a');
    const t = requireUnit(s, 't');
    const flat = xpFor({ ...s, balance: { ...s.balance, xpScale: 1 } }, a, t, 20, 'front', false);
    expect(xpFor(s, a, t, 20, 'front', false)).toBe(Math.round(flat * 1.25));
  });

  it('pays more against a higher-level foe and less against a lower-level one', () => {
    const a = (s: ReturnType<typeof fight>) =>
      xpFor(s, requireUnit(s, 'a'), requireUnit(s, 't'), 20, 'front', false);
    const even = a(fight(5, 5));
    expect(a(fight(5, 7))).toBeGreaterThan(even * 1.7);
    expect(a(fight(5, 3))).toBeLessThan(even * 0.55);
    // A level-9 pilot beating level-3 foes earns little: the penalty keeps high levels from racing ahead.
    expect(a(fight(9, 3))).toBeLessThan(even * 0.25);
  });

  it('levels a unit up at the cost of its own level, carrying the rest over', () => {
    const s = fight(5, 5);
    const a = requireUnit(s, 'a');
    a.xp = xpToNextLevel(5, B) - 1; // 619 of 620
    const r = applyCommand(
      { ...s, turn: { ...s.turn!, unitId: 'a' } as never },
      {
        type: 'attack',
        unitId: 'a',
        targetId: 't',
        attackId: a.attacks[0]!.id,
        reaction: 'avoid',
      },
    );
    const after = requireUnit(r.state, 'a');
    if (after.level > 5) expect(after.xp).toBeLessThan(xpToNextLevel(6, B));
    else expect(after.xp).toBeLessThan(xpToNextLevel(5, B));
  });
});
