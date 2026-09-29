import type { TerrainType } from './terrain';

export interface Coord {
  readonly x: number;
  readonly y: number;
}

export interface Tile {
  readonly terrain: string;
  /** Height in steps; each step is one "H" in the terrain label. */
  readonly height: number;
}

export interface BattleMap {
  readonly id: string;
  readonly name: string;
  readonly width: number;
  readonly depth: number;
  /** Row-major, length = width * depth. */
  readonly tiles: readonly Tile[];
}

export type Facing = 'north' | 'east' | 'south' | 'west';

export const DIRECTIONS: Readonly<Record<Facing, Coord>> = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 },
};

export function inBounds(map: BattleMap, c: Coord): boolean {
  return c.x >= 0 && c.y >= 0 && c.x < map.width && c.y < map.depth;
}

export function getTile(map: BattleMap, c: Coord): Tile | undefined {
  return inBounds(map, c) ? map.tiles[c.y * map.width + c.x] : undefined;
}

export function neighbors(map: BattleMap, c: Coord): Coord[] {
  return Object.values(DIRECTIONS)
    .map((d) => ({ x: c.x + d.x, y: c.y + d.y }))
    .filter((n) => inBounds(map, n));
}

export function manhattan(a: Coord, b: Coord): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/** Checks a map's shape and that every tile references a known terrain. Returns problems found. */
export function validateMap(map: BattleMap, terrains: ReadonlyMap<string, TerrainType>): string[] {
  const problems: string[] = [];
  if (map.tiles.length !== map.width * map.depth) {
    problems.push(`${map.id}: expected ${map.width * map.depth} tiles, got ${map.tiles.length}`);
  }
  map.tiles.forEach((t, i) => {
    if (!terrains.has(t.terrain))
      problems.push(`${map.id}: tile ${i} has unknown terrain "${t.terrain}"`);
    if (t.height < 0) problems.push(`${map.id}: tile ${i} has negative height`);
  });
  return problems;
}
