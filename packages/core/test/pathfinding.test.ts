import { describe, expect, it } from 'vitest';
import { coordKey, createBattle, reachableTiles, requireUnit, stepCost } from '../src';
import { FRAME, makeMap, setup, TEST_BALANCE, unit } from './fixtures';

describe('pathfinding', () => {
  it('charges terrain cost per tile and limits by MOV', () => {
    const { state } = createBattle(
      setup({
        units: [
          unit({ id: 'a', at: { x: 0, y: 0 } }),
          unit({ id: 'e', side: 'enemy', at: { x: 7, y: 7 } }),
        ],
      }),
    );
    const a = requireUnit(state, 'a');
    const reach = reachableTiles(state, a, 100);
    expect(reach.get('2,0')?.cost).toBe(8);
    expect(reach.has('4,0')).toBe(true); // 4 steps = MOV
    expect(reach.has('5,0')).toBe(false);
  });

  it('respects the AP budget', () => {
    const { state } = createBattle(
      setup({
        units: [
          unit({ id: 'a', at: { x: 0, y: 0 } }),
          unit({ id: 'e', side: 'enemy', at: { x: 7, y: 7 } }),
        ],
      }),
    );
    const reach = reachableTiles(state, requireUnit(state, 'a'), 8);
    expect(reach.has('2,0')).toBe(true);
    expect(reach.has('3,0')).toBe(false);
  });

  it('adds climb cost, forbids steep steps and impassable tiles', () => {
    const map = makeMap(['pppp', 'pp~p'], ['0130', '0000']);
    const { state } = createBattle(
      setup({
        map,
        units: [
          unit({ id: 'a', at: { x: 0, y: 0 } }),
          unit({ id: 'e', side: 'enemy', at: { x: 3, y: 1 } }),
        ],
      }),
    );
    // climbing costs 6 AP per height step
    expect(stepCost(state, { x: 0, y: 0 }, { x: 1, y: 0 })).toBe(4 + 6);
    expect(stepCost(state, { x: 1, y: 0 }, { x: 2, y: 0 })).toBe(4 + 12);
    expect(stepCost(state, { x: 0, y: 0 }, { x: 0, y: 1 })).toBe(4);
    expect(stepCost(state, { x: 2, y: 0 }, { x: 3, y: 0 })).toBeNull(); // drop of 3
    expect(stepCost(state, { x: 1, y: 1 }, { x: 2, y: 1 })).toBeNull(); // sea
  });

  it('lets units pass allies but not stop on them, and blocks on enemies', () => {
    const map = makeMap(['ppppp']);
    const { state } = createBattle(
      setup({
        map,
        units: [
          unit({ id: 'a', at: { x: 0, y: 0 } }),
          unit({ id: 'ally', at: { x: 1, y: 0 } }),
          unit({ id: 'e', side: 'enemy', at: { x: 3, y: 0 } }),
        ],
      }),
    );
    const reach = reachableTiles(state, requireUnit(state, 'a'), 100);
    expect(reach.has(coordKey({ x: 1, y: 0 }))).toBe(false);
    expect(reach.get(coordKey({ x: 2, y: 0 }))?.path).toHaveLength(2);
    expect(reach.has(coordKey({ x: 4, y: 0 }))).toBe(false);
  });

  it('prefers cheaper routes (road over scrub)', () => {
    const map = makeMap(['pgp', 'rrr']);
    const { state } = createBattle(
      setup({
        map,
        units: [
          unit({ id: 'a', at: { x: 0, y: 0 } }),
          unit({ id: 'e', side: 'enemy', at: { x: 1, y: 1 } }),
        ],
      }),
    );
    // Straight across scrub: 5 + 4 = 9. Road detour is blocked by the enemy at (1,1).
    expect(reachableTiles(state, requireUnit(state, 'a'), 100).get('2,0')?.cost).toBe(9);
  });
});

describe('classic movement costs', () => {
  const terrains = {
    plain: {
      id: 'plain',
      name: 'Plain',
      moveCost: 10,
      moveCostByClass: { light: 10, heavy: 12 },
      avoid: 0,
    },
    road: { id: 'road', name: 'Road', moveCost: 10, avoid: 0 },
    scrub: { id: 'scrub', name: 'Scrub', moveCost: 12, avoid: 0 },
    sea: { id: 'sea', name: 'Sea', moveCost: 99, avoid: 0, impassable: true },
  };
  const play = (frameClass: 'light' | 'medium' | 'heavy', ally = false) => {
    const { state } = createBattle(
      setup({
        terrains,
        balance: { ...TEST_BALANCE, firstStepMult: 2, allyPassAp: 5, climbApPerStep: 0 },
        units: [
          unit({ id: 'a', at: { x: 0, y: 0 }, frame: { ...FRAME, class: frameClass } }),
          ...(ally ? [unit({ id: 'b', at: { x: 1, y: 0 } })] : []),
          unit({ id: 'e', side: 'enemy', at: { x: 7, y: 7 } }),
        ],
      }),
    );
    return reachableTiles(state, requireUnit(state, 'a'), 100);
  };

  it('charges the first step double, then the ground', () => {
    expect(play('medium').get('1,0')?.cost).toBe(20);
    expect(play('medium').get('3,0')?.cost).toBe(40);
  });

  it('charges heavy frames more on the same ground', () => {
    expect(play('heavy').get('3,0')?.cost).toBe(48);
    expect(play('light').get('3,0')?.cost).toBe(40);
  });

  it('charges 5 AP extra to pass through an ally', () => {
    expect(play('medium', true).get('2,0')?.cost).toBe(35);
  });
});
