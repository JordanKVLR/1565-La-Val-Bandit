import type { BattleMap, BattleSetup, Frame, TerrainType, UnitSpec, Weapon } from '../src';
import { DEFAULT_BALANCE } from '../src';

export const TERRAINS: Record<string, TerrainType> = {
  plain: { id: 'plain', name: 'Plain', moveCost: 4, avoid: 0 },
  road: { id: 'road', name: 'Road', moveCost: 3, avoid: 0 },
  scrub: { id: 'scrub', name: 'Scrub', moveCost: 5, avoid: 15 },
  sea: { id: 'sea', name: 'Sea', moveCost: 99, avoid: 0, impassable: true },
};

/** Builds a map from rows of terrain chars (p/r/g/~) and optional height rows. */
export function makeMap(rows: string[], heights?: string[]): BattleMap {
  const legend: Record<string, string> = { p: 'plain', r: 'road', g: 'scrub', '~': 'sea' };
  const tiles = rows.flatMap((row, y) =>
    [...row].map((ch, x) => ({ terrain: legend[ch]!, height: Number(heights?.[y]?.[x] ?? 0) })),
  );
  return { id: 'test', name: 'Test', width: rows[0]!.length, depth: rows.length, tiles };
}

export const SWORD: Weapon = {
  id: 'sword',
  type: 'blade',
  name: 'Sword',
  power: 24,
  accuracy: 80,
  apCost: 25,
  fpCost: 15,
  minRange: 1,
  maxRange: 1,
};
export const GUN: Weapon = {
  id: 'gun',
  type: 'firearm',
  name: 'Arquebus',
  power: 22,
  accuracy: 70,
  apCost: 35,
  fpCost: 20,
  minRange: 2,
  maxRange: 4,
};
export const FRAME: Frame = {
  class: 'medium',
  id: 'frame',
  name: 'Frame',
  hp: 80,
  armour: 8,
  move: 4,
  agility: 0,
};

export function unit(over: Partial<UnitSpec> & Pick<UnitSpec, 'id' | 'at'>): UnitSpec {
  return {
    name: over.id,
    side: 'player',
    controller: 'ai',
    level: 1,
    stats: { str: 6, skl: 6, agi: 6 },
    frame: FRAME,
    weapon: SWORD,
    facing: 'north',
    ...over,
  };
}

export function setup(over: Partial<BattleSetup> & Pick<BattleSetup, 'units'>): BattleSetup {
  return {
    map: makeMap(Array.from({ length: 8 }, () => 'pppppppp')),
    terrains: TERRAINS,
    balance: DEFAULT_BALANCE,
    victory: [{ type: 'rout' }],
    seed: 1565,
    ...over,
  };
}
