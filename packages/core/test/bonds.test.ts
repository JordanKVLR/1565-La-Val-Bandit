import { describe, expect, it } from 'vitest';
import type { Bond, BattleState } from '../src';
import { bondRankAt, createBattle, forecastAttack, requireUnit } from '../src';
import { TEST_BALANCE, makeMap, setup, unit } from './fixtures';

const DEFAULT = TEST_BALANCE;

function field(bonds: Bond[], allyAt = { x: 3, y: 1 }, seed = 1565): BattleState {
  return createBattle(
    setup({
      seed,
      bonds,
      map: makeMap(['ppppp', 'ppppp', 'ppppp', 'ppppp']),
      units: [
        unit({ id: 'a', characterId: 'ninu', controller: 'human', at: { x: 2, y: 1 } }),
        unit({ id: 'f', characterId: 'kateri', controller: 'human', at: allyAt }),
        unit({ id: 't', side: 'enemy', at: { x: 2, y: 2 }, facing: 'north' }),
      ],
    }),
  ).state;
}

const forecast = (s: BattleState) => forecastAttack(s, requireUnit(s, 'a'), requireUnit(s, 't'));

describe('bonds', () => {
  const bond: Bond = { a: 'ninu', b: 'kateri', rank: 1 };

  it('a bonded ally within range steadies aim and adds damage', () => {
    const plain = forecast(field([]));
    const bonded = forecast(field([bond]));
    expect(bonded.hitParts.bond).toBe(DEFAULT.bondHit);
    expect(plain.hitParts.bond).toBe(0);
    expect(bonded.damage.none).toBeGreaterThan(plain.damage.none);
  });

  it('a deeper bond is worth proportionally more', () => {
    const one = forecast(field([bond]));
    const three = forecast(field([{ ...bond, rank: 3 }]));
    expect(three.hitParts.bond).toBe(one.hitParts.bond * 3);
    expect(three.damage.none).toBeGreaterThan(one.damage.none);
  });

  it('does nothing when the partner is too far away, fallen, or on the other side', () => {
    expect(bondRankAt(field([bond], { x: 0, y: 3 }), requireUnit(field([bond]), 'a'))).toBe(0);
    const s = field([bond]);
    const down = { ...s, units: s.units.map((u) => (u.id === 'f' ? { ...u, defeated: true } : u)) };
    expect(bondRankAt(down, requireUnit(down, 'a'))).toBe(0);
    expect(bondRankAt(s, requireUnit(s, 'a'))).toBe(1);
    expect(bondRankAt(s, requireUnit(s, 't'))).toBe(0); // generic units have no bonds
  });

  it('works both ways: the bonded ally also takes less damage', () => {
    const s = field([bond]);
    // The enemy strikes Ninu, whose partner Kateri stands two tiles away.
    const hit = forecastAttack(s, requireUnit(s, 't'), requireUnit(s, 'a'));
    const bare = field([]);
    const hitBare = forecastAttack(bare, requireUnit(bare, 't'), requireUnit(bare, 'a'));
    expect(hit.damage.none).toBeLessThan(hitBare.damage.none);
  });

  it('survives a save round trip', () => {
    const s = field([bond]);
    expect(JSON.parse(JSON.stringify(s)).bonds).toEqual([bond]);
  });
});
