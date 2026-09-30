import { describe, expect, it } from 'vitest';
import {
  assistFor,
  attackBackWith,
  availableReactions,
  findAttack,
  createBattle,
  facingToward,
  facingZone,
  forecastAttack,
  requireUnit,
  starterAttacks,
} from '../src';
import { GUN, makeMap, setup, unit } from './fixtures';

describe('facing', () => {
  it('classifies front, side and rear', () => {
    const t = { x: 2, y: 2 };
    expect(facingZone(t, 'north', { x: 2, y: 1 })).toBe('front');
    expect(facingZone(t, 'north', { x: 2, y: 3 })).toBe('rear');
    expect(facingZone(t, 'north', { x: 3, y: 2 })).toBe('side');
    expect(facingZone(t, 'north', { x: 3, y: 1 })).toBe('side'); // diagonal counts as side
    expect(facingZone(t, 'east', { x: 5, y: 2 })).toBe('front');
  });

  it('turns toward a target on the dominant axis', () => {
    expect(facingToward({ x: 0, y: 0 }, { x: 3, y: 1 })).toBe('east');
    expect(facingToward({ x: 0, y: 0 }, { x: 0, y: -2 })).toBe('north');
    expect(facingToward({ x: 1, y: 1 }, { x: 1, y: 1 }, 'west')).toBe('west');
  });
});

function duel(
  opts: {
    attackerAt?: { x: number; y: number };
    targetFacing?: 'north' | 'south';
    heights?: string[];
  } = {},
) {
  const map = makeMap(['ppppp', 'ppppp', 'ppppp'], opts.heights);
  const { state } = createBattle(
    setup({
      map,
      units: [
        unit({ id: 'a', at: opts.attackerAt ?? { x: 2, y: 0 } }),
        unit({ id: 't', side: 'enemy', at: { x: 2, y: 1 }, facing: opts.targetFacing ?? 'north' }),
      ],
    }),
  );
  return { state, a: requireUnit(state, 'a'), t: requireUnit(state, 't') };
}

describe('forecast', () => {
  it('computes golden numbers for a frontal attack on flat ground', () => {
    const { state, a, t } = duel();
    const f = forecastAttack(state, a, t, a.pos, findAttack(a, 'thrust'));
    // Thrust: hit = 80 + 6*2 - 6*2 = 80; attack back / no reaction +15 → 95 (cap); defend and a failed counter always hit
    expect(f.zone).toBe('front');
    expect(f.hitChance).toEqual({ defend: 100, avoid: 80, attackBack: 95, counter: 100, none: 95 });
    // damage = (24 + 6) - 8 = 22; defend = round(30*0.5) - 8 = 7
    // failed counter: 30 × 1.25 − 8 = 29.5 → 30
    expect(f.damage).toEqual({ defend: 7, avoid: 22, attackBack: 22, counter: 30, none: 22 });
  });

  it('rewards rear attacks with hit and damage bonuses', () => {
    const { state, a, t } = duel({ targetFacing: 'south' });
    const f = forecastAttack(state, a, t, a.pos, findAttack(a, 'thrust'));
    expect(f.zone).toBe('rear');
    expect(f.hitChance.avoid).toBe(95);
    expect(f.damage.avoid).toBe(Math.round(30 * 1.25) - 8);
  });

  it('rewards height and penalises attacking uphill', () => {
    const up = duel({ heights: ['00200', '00000', '00000'] });
    const fu = forecastAttack(up.state, up.a, up.t, up.a.pos, findAttack(up.a, 'thrust'));
    expect(fu.heightDiff).toBe(2);
    expect(fu.hitChance.avoid).toBe(90);
    expect(fu.damage.avoid).toBe(Math.round(30 * 1.2) - 8);

    const down = duel({ heights: ['00000', '00200', '00000'] });
    const fd = forecastAttack(down.state, down.a, down.t, down.a.pos, findAttack(down.a, 'thrust'));
    expect(fd.hitChance.avoid).toBe(70);
    expect(fd.damage.avoid).toBe(22); // no damage penalty downhill
  });

  it('counts adjacent allies as assist, capped', () => {
    const map = makeMap(['ppppp', 'ppppp', 'ppppp']);
    const { state } = createBattle(
      setup({
        map,
        units: [
          unit({ id: 'a', at: { x: 2, y: 0 } }),
          unit({ id: 'b', at: { x: 1, y: 1 } }),
          unit({ id: 'c', at: { x: 3, y: 1 } }),
          unit({ id: 'd', at: { x: 2, y: 2 } }),
          unit({ id: 't', side: 'enemy', at: { x: 2, y: 1 }, facing: 'north' }),
        ],
      }),
    );
    const f = forecastAttack(state, requireUnit(state, 'a'), requireUnit(state, 't'));
    expect(f.assist).toBe(15);
    // The grid lists every ally next to the target, even past the cap.
    const grid = assistFor(state, requireUnit(state, 'a'), { x: 2, y: 1 });
    expect(grid.bonus).toBe(15);
    expect(grid.allies).toHaveLength(3);
  });

  it('offers attack back only in reach; reactions need FP, not AP', () => {
    const { state, a, t } = duel();
    const all = ['defend', 'avoid', 'attackBack', 'counter', 'none'];
    expect(availableReactions(state, t, a)).toEqual(all);
    // A gunner can't fire at point-blank range but strikes back with the stock.
    const gunner = { ...t, weapon: GUN, attacks: starterAttacks(GUN) };
    expect(availableReactions(state, gunner, a)).toEqual(all);
    expect(attackBackWith(gunner, a.pos).name).toBe('Stock Strike');
    // With no melee option it can't strike back, but a Counter needs no reach.
    const fireOnly = { ...gunner, attacks: gunner.attacks.slice(0, 1) };
    expect(availableReactions(state, fireOnly, a)).toEqual(['defend', 'avoid', 'counter', 'none']);
    const broke = { ...t, ap: 0 };
    expect(availableReactions(state, broke, a)).toEqual(all);
    const spent = { ...t, fp: 100 };
    expect(availableReactions(state, spent, a)).toEqual(['none']);
  });

  it('forecasts the strike back and the counter gamble', () => {
    const { state, a, t } = duel();
    const f = forecastAttack(state, a, t, a.pos, findAttack(a, 'thrust'));
    // The defender strikes back with Slash: 80 + 20 = 100 → 95 (cap); (24 + 6) × 0.8 − 8 = 16
    expect(f.retaliation).toEqual({ hitChance: 95, damage: 16 });
    // equal INT: 10% base chance; reflects the Thrust's 22 × 1.25 = 27.5 → 28
    expect(f.counter).toEqual({ chance: 10, reflect: 28 });
  });
});
