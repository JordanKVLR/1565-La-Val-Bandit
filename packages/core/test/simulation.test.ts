import { describe, expect, it } from 'vitest';
import { deserializeBattle, requireUnit, serializeBattle } from '../src';
import { simulate } from './sim';

describe('AI vs AI simulation', () => {
  it('finishes battles with a decisive outcome across many seeds', () => {
    const outcomes = { victory: 0, defeat: 0, ongoing: 0 };
    for (let seed = 1; seed <= 30; seed++) outcomes[simulate(seed).state.outcome]++;
    expect(outcomes.ongoing).toBe(0);
    // Mirror-matched sides: both should win sometimes.
    expect(outcomes.victory).toBeGreaterThan(0);
    expect(outcomes.defeat).toBeGreaterThan(0);
  });

  it('is fully deterministic for a seed', () => {
    expect(simulate(42).state).toEqual(simulate(42).state);
  });

  it('survives a save/load round trip mid-battle', () => {
    const mid = simulate(7, 20).state;
    const loaded = deserializeBattle(serializeBattle(mid));
    expect(loaded).toEqual(mid);
    expect(requireUnit(loaded, 'p1').name).toBe('p1');
  });

  it('rejects saves from the future or garbage', () => {
    expect(() => deserializeBattle('{"saveVersion":999}')).toThrow(/newer/);
    expect(() => deserializeBattle('{}')).toThrow(/Not a battle save/);
  });
});
