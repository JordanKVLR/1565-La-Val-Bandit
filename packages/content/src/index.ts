import type { BattleMap, TerrainType, Tile } from '@m1565/core';
import { validateMap } from '@m1565/core';
import terrainData from '../data/terrain.json';
import b1Marsaxlokk from '../data/maps/b1-marsaxlokk.json';
import { MapSourceSchema, TerrainSchema } from './schemas';
import type { MapSource } from './schemas';

export { MapSourceSchema, TerrainSchema } from './schemas';
export type { MapSource } from './schemas';

export function loadTerrains(raw: unknown = terrainData): ReadonlyMap<string, TerrainType> {
  const list = TerrainSchema.array().parse(raw) as TerrainType[];
  return new Map(list.map((t) => [t.id, t]));
}

export function buildMap(source: MapSource): BattleMap {
  const tiles: Tile[] = [];
  source.terrain.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      tiles.push({ terrain: source.legend[ch] ?? ch, height: Number(source.height[y]?.[x] ?? 0) });
    });
  });
  return {
    id: source.id,
    name: source.name,
    width: source.terrain[0]?.length ?? 0,
    depth: source.terrain.length,
    tiles,
  };
}

/** Parses and cross-checks a map source; throws with every problem listed. */
export function loadMap(
  raw: unknown,
  terrains: ReadonlyMap<string, TerrainType> = loadTerrains(),
): BattleMap {
  const map = buildMap(MapSourceSchema.parse(raw));
  const problems = validateMap(map, terrains);
  if (problems.length) throw new Error(`Invalid map:\n${problems.join('\n')}`);
  return map;
}

export const mapSources = { 'b1-marsaxlokk': b1Marsaxlokk } as const;
export type MapId = keyof typeof mapSources;
