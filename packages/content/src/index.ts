import type {
  BalanceConfig,
  BattleMap,
  BattleSetup,
  Frame,
  TerrainType,
  Tile,
  UnitSpec,
  Weapon,
} from '@m1565/core';
import { getTile, validateMap } from '@m1565/core';
import balanceData from '../data/balance.json';
import barkData from '../data/barks.json';
import b1Battle from '../data/battles/b1-marsaxlokk.json';
import characterData from '../data/characters.json';
import frameData from '../data/frames.json';
import b1Marsaxlokk from '../data/maps/b1-marsaxlokk.json';
import terrainData from '../data/terrain.json';
import weaponData from '../data/weapons.json';
import {
  BalanceSchema,
  BarksSchema,
  BattleSourceSchema,
  CharacterSchema,
  FrameSchema,
  MapSourceSchema,
  TerrainSchema,
  WeaponSchema,
} from './schemas';
import type { BattleSource, MapSource } from './schemas';

export * from './schemas';

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

export const battleSources = { 'b1-marsaxlokk': b1Battle } as const;
export type BattleId = keyof typeof battleSources;

const byId = <T extends { id: string }>(
  list: readonly T[],
  kind: string,
): ReadonlyMap<string, T> => {
  const map = new Map<string, T>();
  for (const item of list) {
    if (map.has(item.id)) throw new Error(`Duplicate ${kind} id "${item.id}"`);
    map.set(item.id, item);
  }
  return map;
};

/** All static content, parsed and validated once. */
export function loadLibrary() {
  return {
    balance: BalanceSchema.parse(balanceData) as BalanceConfig,
    terrains: loadTerrains(),
    weapons: byId(WeaponSchema.array().parse(weaponData) as Weapon[], 'weapon'),
    frames: byId(FrameSchema.array().parse(frameData) as Frame[], 'frame'),
    characters: byId(CharacterSchema.array().parse(characterData), 'character'),
    frameFactions: new Map(
      FrameSchema.array()
        .parse(frameData)
        .map((f) => [f.id, f.faction]),
    ),
    barks: BarksSchema.parse(barkData),
  };
}
export type Library = ReturnType<typeof loadLibrary>;

function need<T>(map: ReadonlyMap<string, T>, key: string, what: string, where: string): T {
  const v = map.get(key);
  if (!v) throw new Error(`${where}: unknown ${what} "${key}"`);
  return v;
}

/** Resolves a battle's references (map, frames, weapons, characters) into a core BattleSetup. */
export function buildBattle(source: BattleSource, lib: Library = loadLibrary()): BattleSetup {
  const where = `battle ${source.id}`;
  const mapSource = mapSources[source.map as MapId];
  if (!mapSource) throw new Error(`${where}: unknown map "${source.map}"`);
  const map = loadMap(mapSource, lib.terrains);
  const occupied = new Set<string>();
  const units: UnitSpec[] = source.units.map((u) => {
    const character = u.character
      ? need(lib.characters, u.character, 'character', where)
      : undefined;
    const at = { x: u.at[0], y: u.at[1] };
    const tile = getTile(map, at);
    const terrain = tile && lib.terrains.get(tile.terrain);
    if (!terrain || terrain.impassable)
      throw new Error(`${where}: unit ${u.id} is placed off-map or on impassable terrain`);
    const key = `${at.x},${at.y}`;
    if (occupied.has(key)) throw new Error(`${where}: two units start on ${key}`);
    occupied.add(key);
    return {
      id: u.id,
      ...(u.character ? { characterId: u.character } : {}),
      name: u.name ?? character!.name,
      side: u.side,
      controller: u.controller,
      ...(u.ai ? { ai: u.ai } : {}),
      level: u.level,
      stats: u.stats ?? character!.stats,
      frame: need(lib.frames, u.frame, 'frame', where),
      weapon: need(lib.weapons, u.weapon, 'weapon', where),
      at,
      facing: u.facing,
    };
  });
  const ids = new Set(units.map((u) => u.id));
  for (const v of source.victory) {
    if (v.type === 'defeatLeader' && !ids.has(v.unitId))
      throw new Error(`${where}: unknown leader "${v.unitId}"`);
  }
  for (const d of source.defeat) {
    if (!ids.has(d.unitId)) throw new Error(`${where}: unknown protected unit "${d.unitId}"`);
  }
  return {
    map,
    terrains: lib.terrains,
    balance: lib.balance,
    units,
    victory: source.victory,
    defeat: source.defeat,
    seed: source.seed,
  };
}

export function loadBattle(id: BattleId, lib: Library = loadLibrary()): BattleSetup {
  return buildBattle(BattleSourceSchema.parse(battleSources[id]), lib);
}
