import type {
  Attack,
  BalanceConfig,
  PilotStats,
  BattleMap,
  Skill,
  SkillEffect,
  BattleSetup,
  Frame,
  Gear,
  TerrainType,
  Tile,
  UnitSpec,
  Weapon,
} from '@m1565/core';
import { getTile, techniqueCost, validateMap } from '@m1565/core';
import armourerData from '../data/armourers.json';
import attackData from '../data/attacks.json';
import balanceData from '../data/balance.json';
import barkData from '../data/barks.json';
import castData from '../data/cast.json';
import characterData from '../data/characters.json';
import frameData from '../data/frames.json';
import gearData from '../data/gear.json';
import shopData from '../data/shop.json';
import skillData from '../data/skills.json';
import terrainData from '../data/terrain.json';
import weaponData from '../data/weapons.json';
import {
  ArmourersSchema,
  AttackSchema,
  BalanceSchema,
  BarksSchema,
  BattleSourceSchema,
  CastSchema,
  ShopItemSchema,
  SkillBookSchema,
  CharacterSchema,
  FrameSchema,
  GearSchema,
  MapSourceSchema,
  TerrainSchema,
  WeaponSchema,
} from './schemas';
import { derivedStats, statsAtLevel } from './progression';
import type { BattleSource, Character, MapSource, SkillData } from './schemas';

export * from './progression';
export * from './schemas';

export function loadTerrains(raw: unknown = terrainData): ReadonlyMap<string, TerrainType> {
  const list = TerrainSchema.array().parse(raw) as TerrainType[];
  return new Map(list.map((t) => [t.id, t]));
}

function globById(modules: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(modules).map(([path, data]) => [path.replace(/^.*\/(.+)\.json$/, '$1'), data]),
  );
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

/** Every map in data/maps, keyed by file name (which must match its id). */
export const mapSources: Readonly<Record<string, unknown>> = globById(
  import.meta.glob('../data/maps/*.json', { eager: true, import: 'default' }),
);
export type MapId = string;

/** Every battle in data/battles, keyed by file name (which must match its id). */
export const battleSources: Readonly<Record<string, unknown>> = globById(
  import.meta.glob('../data/battles/*.json', { eager: true, import: 'default' }),
);
export type BattleId = string;

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

/** Parses skills.json and checks every assignment names a known skill, in level order. */
export function loadSkillBook(raw: unknown = skillData) {
  const book = SkillBookSchema.parse(raw);
  const skills = byId(book.skills as SkillData[], 'skill');
  const characters = new Map<string, readonly { skill: string; level: number }[]>();
  for (const [characterId, list] of Object.entries(book.characters)) {
    list.forEach((entry, i) => {
      if (!skills.has(entry.skill))
        throw new Error(`skills.json: ${characterId} has unknown skill "${entry.skill}"`);
      if (i > 0 && entry.level <= list[i - 1]!.level)
        throw new Error(`skills.json: ${characterId}'s skills must unlock at rising levels`);
    });
    characters.set(characterId, list);
  }
  return { skills, characters };
}

/** All static content, parsed and validated once. */
export function loadLibrary() {
  const skillBook = loadSkillBook();
  return {
    balance: BalanceSchema.parse(balanceData) as BalanceConfig,
    terrains: loadTerrains(),
    weapons: byId(
      WeaponSchema.array().parse(weaponData) as (Weapon & {
        price: number;
        tier: 'common' | 'fine' | 'masterwork';
        description: string;
      })[],
      'weapon',
    ),
    frames: byId(
      FrameSchema.array().parse(frameData) as (Frame & { description: string })[],
      'frame',
    ),
    gear: byId(
      GearSchema.array().parse(gearData) as (Gear & { price: number; description: string })[],
      'gear',
    ),
    characters: byId(CharacterSchema.array().parse(characterData), 'character'),
    frameFactions: new Map(
      FrameSchema.array()
        .parse(frameData)
        .map((f) => [f.id, f.faction]),
    ),
    frameModels: new Map(
      FrameSchema.array()
        .parse(frameData)
        .map((f) => [f.id, f.model]),
    ),
    barks: BarksSchema.parse(barkData),
    cast: byId(CastSchema.array().parse(castData), 'cast member'),
    shop: ShopItemSchema.array().parse(shopData),
    armourers: ArmourersSchema.parse(armourerData),
    attacks: AttackSchema.array().parse(attackData),
    skills: skillBook.skills,
    /** characterId → the skills that character gains, with the level each unlocks at. */
    skillSets: skillBook.characters,
  };
}
export type Library = ReturnType<typeof loadLibrary>;

function need<T>(map: ReadonlyMap<string, T>, key: string, what: string, where: string): T {
  const v = map.get(key);
  if (!v) throw new Error(`${where}: unknown ${what} "${key}"`);
  return v;
}

/** Persistent state of a named character between battles (the player's roster). */
export interface RosterEntry {
  readonly characterId: string;
  readonly level: number;
  readonly xp: number;
  readonly stats: PilotStats;
  readonly frame: string;
  readonly weapon: string;
  /** Charm fitted to the armatura and amulet worn by the pilot (gear ids), if any. */
  readonly charm?: string | null;
  readonly amulet?: string | null;
  /** Unspent stat points from level-ups. */
  readonly statPoints?: number;
}

/**
 * Battle progress of a named character who has fought on the player's side but isn't in the
 * company yet; it carries into their next battle and into the company when they join.
 */
export type CharacterProgress = Pick<RosterEntry, 'level' | 'xp' | 'stats' | 'statPoints'>;

/** Techniques a pilot in this frame with this weapon can learn (stat requirements aside). */
export function attackPool(lib: Library, frame: Frame, weapon: Weapon): Attack[] {
  const faction = lib.frameFactions.get(frame.id);
  return lib.attacks
    .filter(
      (a) =>
        a.faction === faction &&
        a.weaponTypes.includes(weapon.type) &&
        (a.frameClasses.length === 0 || a.frameClasses.includes(frame.class)),
    )
    .map(
      ({ faction: _f, weaponTypes: _w, frameClasses: _c, accuracyBonus, apBonus, ...attack }) => {
        // Stronger techniques cost more AP and FP and are less accurate (one shared formula);
        // ranged ones pay extra FP. A few careful techniques add accuracy for extra AP.
        const cost = techniqueCost(attack.power, attack.hits ?? 1, lib.balance, attack.style);
        return {
          ...attack,
          ...cost,
          accuracy: cost.accuracy + (accuracyBonus ?? 0),
          apCost: cost.apCost + (apBonus ?? 0),
        } as Attack;
      },
    );
}

/** Every skill a named character has or will gain, each with its unlock level. */
export function characterSkills(lib: Library, characterId: string): Skill[] {
  return (lib.skillSets.get(characterId) ?? []).map(({ skill, level }) =>
    toSkill(lib.skills.get(skill)!, level),
  );
}

function toSkill(s: SkillData, level: number): Skill {
  // zod's optional `when` is `T | undefined`; the engine's type is the same data.
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    level,
    effect: s.effect as SkillEffect,
  };
}

/** A generic unit's extra skills from battle JSON: all active from level 1. */
function genericSkills(lib: Library, ids: readonly string[], where: string): Skill[] {
  return ids.map((sid) => toSkill(need(lib.skills, sid, 'skill', where), 1));
}

/**
 * A unit's full stats: saved/explicit values first; named characters fill gaps from their
 * expected build at this level; generic units derive BAS/DEF/WEP from level and frame.
 */
function resolveStats(
  given: { readonly [K in keyof PilotStats]?: number | undefined } | undefined,
  character: Character | undefined,
  level: number,
  frameClass: Frame['class'],
  side: 'player' | 'enemy',
  lib: Library,
): PilotStats {
  const expected = character
    ? statsAtLevel(character, level, lib.balance.statPointsPerLevel)
    : undefined;
  const fallback = expected ?? { pow: 6, dex: 6, agl: 6, ...derivedStats(level, frameClass, side) };
  const out = { ...fallback };
  for (const [k, v] of Object.entries(given ?? {}))
    if (v !== undefined) out[k as keyof PilotStats] = v;
  return out;
}

/**
 * Resolves a battle's references (map, frames, weapons, characters) into a core BattleSetup.
 * Named player characters found in `roster` fight with their saved level, stats and loadout.
 */
export function buildBattle(
  source: BattleSource,
  lib: Library = loadLibrary(),
  roster: readonly RosterEntry[] = [],
  progress: Readonly<Record<string, CharacterProgress>> = {},
): BattleSetup {
  const saved = new Map(roster.map((r) => [r.characterId, r]));
  const where = `battle ${source.id}`;
  const mapSource = mapSources[source.map];
  if (!mapSource) throw new Error(`${where}: unknown map "${source.map}"`);
  const map = loadMap(mapSource, lib.terrains);
  const occupied = new Set<string>();
  const units: UnitSpec[] = source.units.map((u0) => {
    const r = u0.side === 'player' && u0.character ? saved.get(u0.character) : undefined;
    // An ally who fought for the player before joining keeps what they earned (unless the
    // story brings them in stronger than that).
    const p = !r && u0.side === 'player' && u0.character ? progress[u0.character] : undefined;
    const veteran = p && p.level >= u0.level ? p : undefined;
    const u = r
      ? { ...u0, level: r.level, stats: r.stats, frame: r.frame, weapon: r.weapon }
      : veteran
        ? { ...u0, level: veteran.level, stats: veteran.stats }
        : u0;
    const character = u.character
      ? need(lib.characters, u.character, 'character', where)
      : undefined;
    const at = { x: u.at[0], y: u.at[1] };
    const tile = getTile(map, at);
    const terrain = tile && lib.terrains.get(tile.terrain);
    if (!terrain || terrain.impassable)
      throw new Error(`${where}: unit ${u.id} is placed off-map or on impassable terrain`);
    const frame = need(lib.frames, u.frame, 'frame', where);
    const weapon = need(lib.weapons, u.weapon, 'weapon', where);
    // A charm only fits the charm slot and an amulet the amulet slot.
    const gear = (id: string | null | undefined, kind: 'charm' | 'amulet') => {
      const g = id ? lib.gear.get(id) : undefined;
      return g?.kind === kind ? g : undefined;
    };
    const charm = gear(r?.charm, 'charm');
    const amulet = gear(r?.amulet, 'amulet');
    const skills = [
      ...(u.character ? characterSkills(lib, u.character) : []),
      ...genericSkills(lib, u.skills ?? [], where),
    ];
    const key = `${at.x},${at.y}`;
    if (occupied.has(key)) throw new Error(`${where}: two units start on ${key}`);
    occupied.add(key);
    return {
      id: u.id,
      ...(u.character ? { characterId: u.character } : {}),
      ...(u.portrait ? { portrait: u.portrait } : {}),
      name: u.name ?? character!.name,
      side: u.side,
      controller: u.controller,
      ...(u.ai ? { ai: u.ai } : {}),
      level: u.level,
      // Without a saved roster entry, a named character arrives at the level the battle expects.
      stats: resolveStats(u.stats, character, u.level, frame.class, u.side, lib),
      frame,
      weapon,
      ...(charm ? { charm } : {}),
      ...(amulet ? { amulet } : {}),
      attacks: attackPool(lib, frame, weapon),
      ...(skills.length ? { skills } : {}),
      ...(r ? { xp: r.xp, statPoints: r.statPoints ?? 0 } : {}),
      ...(veteran ? { xp: veteran.xp, statPoints: veteran.statPoints ?? 0 } : {}),
      at,
      facing: u.facing,
    };
  });
  const ids = new Set(units.map((u) => u.id));
  for (const v of source.victory) {
    if (v.type === 'escape') {
      if (!ids.has(v.unitId)) throw new Error(`${where}: unknown escaping unit "${v.unitId}"`);
      for (const [x, y] of v.tiles) {
        const t = getTile(map, { x, y });
        if (!t || lib.terrains.get(t.terrain)?.impassable)
          throw new Error(`${where}: escape tile ${x},${y} is not walkable`);
      }
    }
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
    victory: source.victory.map((v) =>
      v.type === 'escape' ? { ...v, tiles: v.tiles.map(([x, y]) => ({ x, y })) } : v,
    ),
    defeat: source.defeat,
    seed: source.seed,
  };
}

export function loadBattle(
  id: BattleId,
  lib: Library = loadLibrary(),
  roster: readonly RosterEntry[] = [],
  progress: Readonly<Record<string, CharacterProgress>> = {},
): BattleSetup {
  return buildBattle(BattleSourceSchema.parse(battleSources[id]), lib, roster, progress);
}

export function isBattleId(id: string): id is BattleId {
  return id in battleSources;
}

/** Armaturas the player recovers from the field after winning this battle. */
export function battleSalvage(id: BattleId): readonly string[] {
  const raw = battleSources[id];
  return raw ? BattleSourceSchema.parse(raw).salvage : [];
}
