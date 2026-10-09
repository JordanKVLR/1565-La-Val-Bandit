import type { BattleSetup, Difficulty, UnitSpec } from '@m1565/core';
import { createBattle, STAT_NAMES } from '@m1565/core';
import { describe, expect, it } from 'vitest';
import { battleSources, loadBattle, loadLibrary } from '../src';

const lib = loadLibrary();
const ids = Object.keys(battleSources);

const enemies = (s: BattleSetup) => s.units.filter((u) => u.side === 'enemy');
const total = (u: UnitSpec) => STAT_NAMES.reduce((n, k) => n + u.stats[k], 0);
/** Sum of every enemy's attributes and max HP once the battle is set up. */
function strength(id: string, difficulty: Difficulty, ngPlus = 0) {
  const setup = loadBattle(id, lib, [], {}, { difficulty, ngPlus });
  const state = createBattle(setup).state;
  const foes = state.units.filter((u) => u.side === 'enemy');
  return {
    stats: enemies(setup).reduce((n, u) => n + total(u), 0),
    hp: foes.reduce((n, u) => n + u.maxHp, 0),
    levels: foes.reduce((n, u) => n + u.level, 0),
  };
}

describe('difficulty scales content-built enemies', () => {
  it.each(ids)('%s: Knight is exactly the authored battle', (id) => {
    expect(loadBattle(id, lib, [], {}, { difficulty: 'knight', ngPlus: 0 })).toEqual(
      loadBattle(id, lib),
    );
  });

  it.each(ids)('%s: Squire is easier and Grand Master harder than Knight', (id) => {
    const squire = strength(id, 'squire');
    const knight = strength(id, 'knight');
    const gm = strength(id, 'grandMaster');
    expect(squire.stats).toBeLessThan(knight.stats);
    expect(squire.hp).toBeLessThan(knight.hp);
    expect(squire.levels).toBeLessThanOrEqual(knight.levels);
    expect(gm.stats).toBeGreaterThan(knight.stats);
    expect(gm.hp).toBeGreaterThan(knight.hp);
    expect(gm.levels).toBeGreaterThan(knight.levels);
  });

  it('leaves the player side alone', () => {
    const player = (d: Difficulty) =>
      loadBattle('b1-marsaxlokk', lib, [], {}, { difficulty: d }).units.filter(
        (u) => u.side === 'player',
      );
    expect(player('squire')).toEqual(player('knight'));
    expect(player('grandMaster')).toEqual(player('knight'));
  });

  it('New Game+ makes every cycle harder than the last', () => {
    for (const id of ['b1-marsaxlokk', 'b9-fall-of-st-elmo', 'a5-scala-engine']) {
      const k0 = strength(id, 'knight', 0);
      const k1 = strength(id, 'knight', 1);
      const k2 = strength(id, 'knight', 2);
      expect(k1.levels).toBeGreaterThan(k0.levels);
      expect(k2.levels).toBeGreaterThan(k1.levels);
      expect(k1.hp).toBeGreaterThan(k0.hp);
      expect(k2.stats).toBeGreaterThanOrEqual(k1.stats);
      // Difficulty still applies on top of the cycle.
      expect(strength(id, 'squire', 1).stats).toBeLessThan(k1.stats);
    }
  });
});
