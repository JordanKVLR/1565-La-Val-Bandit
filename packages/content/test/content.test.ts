import { describe, expect, it } from 'vitest';
import type { BattleId } from '../src';
import {
  battleSources,
  BattleSourceSchema,
  buildBattle,
  loadBattle,
  loadLibrary,
  loadMap,
  loadTerrains,
  mapSources,
} from '../src';
import { createBattle, DEFAULT_BALANCE } from '@m1565/core';

describe('content', () => {
  const terrains = loadTerrains();

  it('loads the terrain table', () => {
    expect(terrains.get('plain')?.name).toBe('Plain');
  });

  it.each(Object.entries(mapSources))('map %s is valid', (_id, source) => {
    const map = loadMap(source, terrains);
    expect(map.tiles).toHaveLength(map.width * map.depth);
  });

  it('rejects ragged rows and unknown legend characters', () => {
    const bad = {
      id: 'bad',
      name: 'Bad',
      legend: { p: 'plain' },
      terrain: ['pp', 'pq'],
      height: ['00', '0'],
    };
    expect(() => loadMap(bad, terrains)).toThrow(/every row|legend/);
  });

  it('rejects legend entries that point at unknown terrain', () => {
    const bad = { id: 'bad', name: 'Bad', legend: { p: 'lava' }, terrain: ['p'], height: ['0'] };
    expect(() => loadMap(bad, terrains)).toThrow(/unknown terrain/);
  });
});

describe('battles', () => {
  it('loads the library without duplicate ids', () => {
    const lib = loadLibrary();
    expect(lib.frames.size).toBeGreaterThan(10);
    expect(lib.weapons.get('kilij')?.name).toBe('Kilij');
  });

  it.each(Object.keys(battleSources) as BattleId[])('battle %s resolves and starts', (id) => {
    const setup = loadBattle(id);
    const { state } = createBattle(setup);
    expect(state.outcome).toBe('ongoing');
    // Every battle fields at least one named story character on the player's side.
    expect(state.units.some((u) => u.side === 'player' && u.characterId)).toBe(true);
  });

  it('keeps the shipped balance in sync with the core defaults', () => {
    expect(loadLibrary().balance).toEqual(DEFAULT_BALANCE);
  });

  const base = battleSources['b1-marsaxlokk'] as { units: Array<Record<string, unknown>> };
  const withUnits = (units: unknown[]) => BattleSourceSchema.parse({ ...base, units });

  it('rejects unknown frames and overlapping units', () => {
    const [a, b] = base.units;
    expect(() => buildBattle(withUnits([{ ...a, frame: 'nope' }, b]))).toThrow(/unknown frame/);
    expect(() => buildBattle(withUnits([a, { ...b, at: a!['at'] }]))).toThrow(/two units/);
  });

  it('rejects units placed in the sea', () => {
    const [a, b] = base.units;
    expect(() => buildBattle(withUnits([{ ...a, at: [0, 0] }, b]))).toThrow(/impassable/);
  });

  it('rejects generic units without stats', () => {
    const [a, b] = base.units;
    expect(() => withUnits([a, { ...b, name: undefined, character: undefined }])).toThrow();
  });
});

describe('shop', () => {
  it('only sells real items', () => {
    const lib = loadLibrary();
    for (const s of lib.shop) {
      const known = s.kind === 'weapon' ? lib.weapons.has(s.item) : lib.frames.has(s.item);
      expect(known, s.item).toBe(true);
    }
  });
});

describe('roster', () => {
  it('applies saved level, stats and loadout to named player units', () => {
    const setup = loadBattle('b1-marsaxlokk', loadLibrary(), [
      {
        characterId: 'ninu',
        level: 4,
        xp: 10,
        stats: { str: 10, skl: 9, agi: 9 },
        frame: 'cavaliere',
        weapon: 'bastard-sword',
      },
    ]);
    const ninu = setup.units.find((u) => u.id === 'ninu')!;
    expect(ninu).toMatchObject({ level: 4, stats: { str: 10, skl: 9, agi: 9 } });
    expect(ninu.frame.id).toBe('cavaliere');
    expect(ninu.weapon.id).toBe('bastard-sword');
  });
});
