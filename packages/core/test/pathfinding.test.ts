import { describe, expect, it } from 'vitest';
import { coordKey, createBattle, reachableTiles, requireUnit, stepCost } from '../src';
import { makeMap, setup, unit } from './fixtures';

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
    expect(stepCost(state, { x: 0, y: 0 }, { x: 1, y: 0 })).toBe(4 + 4);
    expect(stepCost(state, { x: 1, y: 0 }, { x: 2, y: 0 })).toBe(4 + 8);
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
