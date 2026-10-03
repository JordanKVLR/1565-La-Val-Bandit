import type {
  BattleMap,
  BattleSetup,
  Frame,
  PilotStats,
  TerrainType,
  UnitSpec,
  Weapon,
} from '../src';
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

/** WEP+4 like a basic arming sword. */
export const SWORD: Weapon = {
  id: 'sword',
  type: 'blade',
  name: 'Sword',
  bonus: { wep: 4 },
  apCost: 25,
  minRange: 1,
  maxRange: 1,
};
export const GUN: Weapon = {
  id: 'gun',
  type: 'firearm',
  name: 'Arquebus',
  bonus: { wep: 3 },
  apCost: 35,
  minRange: 2,
  maxRange: 4,
};
/** With the default BAS 5 at level 1: 2 + 20 + 10 + 48 = 80 HP. */
export const FRAME: Frame = {
  class: 'medium',
  id: 'frame',
  name: 'Frame',
  hp: 48,
  move: 4,
  bonus: {},
};

/**
 * A unit spec with sensible defaults: BAS 5, POW 6, DEX 6, AGL 6, DEF 0, WEP 5. With the sword
 * (WEP+4) that is (6 + 9) × 2 = 30 raw damage and 80 HP, easy numbers to check by hand.
 */
export function unit(
  over: Omit<Partial<UnitSpec>, 'stats'> &
    Pick<UnitSpec, 'id' | 'at'> & { stats?: Partial<PilotStats> },
): UnitSpec {
  const { stats, ...rest } = over;
  return {
    name: over.id,
    side: 'player',
    controller: 'ai',
    level: 1,
    frame: FRAME,
    weapon: SWORD,
    facing: 'north',
    ...rest,
    stats: { bas: 5, pow: 6, dex: 6, agl: 6, def: 0, wep: 5, ...stats },
  };
}

/**
 * Rules tests run on a fixed reference balance (round numbers that are easy to check by hand),
 * so retuning the shipped defaults doesn't rewrite every expected value.
 */
export const TEST_BALANCE = {
  ...DEFAULT_BALANCE,
  baseHit: 75,
  damagePerPoint: 2,
  xpHitBase: 30,
  xpDamageShare: 100,
  xpDefeat: 150,
};

export function setup(over: Partial<BattleSetup> & Pick<BattleSetup, 'units'>): BattleSetup {
  return {
    map: makeMap(Array.from({ length: 8 }, () => 'pppppppp')),
    terrains: TERRAINS,
    balance: TEST_BALANCE,
    victory: [{ type: 'rout' }],
    seed: 1565,
    ...over,
  };
}
