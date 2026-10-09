import { describe, expect, it } from 'vitest';
import type { BattleMap, TerrainType } from '../src';
import { getTile, inBounds, manhattan, neighbors, validateMap } from '../src';

const plain: TerrainType = { id: 'plain', name: 'Plain', moveCost: 4, avoid: 5 };
const terrains = new Map([[plain.id, plain]]);
const map: BattleMap = {
  id: 'test',
  name: 'Test',
  width: 3,
  depth: 2,
  tiles: Array.from({ length: 6 }, (_, i) => ({ terrain: 'plain', height: i })),
};

describe('grid', () => {
  it('looks up tiles in row-major order', () => {
    expect(getTile(map, { x: 2, y: 1 })?.height).toBe(5);
    expect(getTile(map, { x: 3, y: 0 })).toBeUndefined();
  });

  it('checks bounds', () => {
    expect(inBounds(map, { x: 0, y: 0 })).toBe(true);
    expect(inBounds(map, { x: -1, y: 0 })).toBe(false);
    expect(inBounds(map, { x: 0, y: 2 })).toBe(false);
  });

  it('returns only in-bounds orthogonal neighbours', () => {
    expect(neighbors(map, { x: 0, y: 0 })).toHaveLength(2);
    expect(neighbors(map, { x: 1, y: 0 })).toHaveLength(3);
  });

  it('measures manhattan distance', () => {
    expect(manhattan({ x: 0, y: 0 }, { x: 2, y: 1 })).toBe(3);
  });

  it('validates maps', () => {
    expect(validateMap(map, terrains)).toEqual([]);
    const bad: BattleMap = { ...map, tiles: [{ terrain: 'lava', height: -1 }] };
    expect(validateMap(bad, terrains)).toHaveLength(3);
  });
});
