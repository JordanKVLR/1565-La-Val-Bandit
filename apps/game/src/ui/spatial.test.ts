import { describe, expect, it } from 'vitest';
import type { Box } from './spatial';
import { pickInDirection } from './spatial';

const box = (left: number, top: number, width = 100, height = 44): Box => ({
  left,
  top,
  width,
  height,
});

describe('pickInDirection', () => {
  // A 3×3 grid of 100×44 buttons with 10px gaps.
  const grid = [0, 1, 2].flatMap((row) => [0, 1, 2].map((col) => box(col * 110, row * 54)));
  const centre = grid[4]!;

  it('moves to the neighbour in each direction of a grid', () => {
    expect(pickInDirection(centre, grid, 'up')).toBe(1);
    expect(pickInDirection(centre, grid, 'down')).toBe(7);
    expect(pickInDirection(centre, grid, 'left')).toBe(3);
    expect(pickInDirection(centre, grid, 'right')).toBe(5);
  });

  it('returns -1 at an edge', () => {
    expect(pickInDirection(grid[0]!, grid, 'up')).toBe(-1);
    expect(pickInDirection(grid[0]!, grid, 'left')).toBe(-1);
    expect(pickInDirection(grid[8]!, grid, 'right')).toBe(-1);
  });

  it('never picks the box it starts from', () => {
    expect(pickInDirection(centre, [centre], 'down')).toBe(-1);
  });

  it('prefers a box in line over a nearer one off to the side', () => {
    const from = box(0, 0);
    const inLine = box(0, 200);
    const diagonal = box(300, 60);
    expect(pickInDirection(from, [diagonal, inLine], 'down')).toBe(1);
  });

  it('walks a vertical list of full-width buttons', () => {
    const list = [0, 1, 2, 3].map((i) => box(0, i * 50, 300));
    expect(pickInDirection(list[1]!, list, 'down')).toBe(2);
    expect(pickInDirection(list[1]!, list, 'up')).toBe(0);
    expect(pickInDirection(list[1]!, list, 'right')).toBe(-1);
  });

  it('goes from a wide button to the nearest of a row of small ones below', () => {
    const wide = box(0, 0, 330);
    const row = [box(0, 60), box(110, 60), box(220, 60)];
    expect(pickInDirection(wide, row, 'down')).toBe(1);
  });

  it('tolerates slightly overlapping boxes but not ones behind', () => {
    const from = box(0, 0);
    const overlapping = box(80, 0); // starts 20px inside from's right edge
    const behind = box(-90, 0);
    expect(pickInDirection(from, [behind, overlapping], 'right')).toBe(1);
    expect(pickInDirection(from, [overlapping], 'left')).toBe(-1);
  });
});
