import { describe, expect, it } from 'vitest';
import type { BattleId } from '../src';
import {
  attackPool,
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
        stats: { str: 10, skl: 9, agi: 9, def: 5, int: 6, spi: 6, vit: 5 },
        frame: 'cavaliere',
        weapon: 'bastard-sword',
      },
    ]);
    const ninu = setup.units.find((u) => u.id === 'ninu')!;
    expect(ninu).toMatchObject({ level: 4, stats: { str: 10, skl: 9, agi: 9, def: 5 } });
    expect(ninu.frame.id).toBe('cavaliere');
    expect(ninu.weapon.id).toBe('bastard-sword');
  });
});

describe('attacks', () => {
  const lib = loadLibrary();

  it('have unique ids and reachable requirements', () => {
    const ids = lib.attacks.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of lib.attacks) {
      const total = (a.requires.str ?? 0) + (a.requires.skl ?? 0) + (a.requires.agi ?? 0);
      // A level 15 pilot has ~42 points on top of base stats around 6 each.
      expect(total, a.id).toBeLessThanOrEqual(30);
    }
  });

  it('give every faction techniques for each weapon it fields', () => {
    const fielded = new Set<string>();
    for (const file of Object.values(battleSources) as Array<{
      units: Array<{ frame: string; weapon: string }>;
    }>) {
      for (const u of file.units) fielded.add(`${u.frame}|${u.weapon}`);
    }
    const bare = [...fielded].filter((key) => {
      const [f, w] = key.split('|') as [string, string];
      const frame = lib.frames.get(f)!;
      if (frame.id === 'barge') return false;
      return attackPool(lib, frame, lib.weapons.get(w)!).length === 0;
    });
    expect(bare).toEqual([]);
  });

  it('are attached to battle units by frame faction, weapon type and frame class', () => {
    const setup = loadBattle('b1-marsaxlokk', lib);
    const ninu = setup.units.find((u) => u.id === 'ninu')!;
    expect(ninu.attacks?.every((a) => a.id.startsWith('militia-'))).toBe(true);
    expect(ninu.attacks?.some((a) => a.id === 'militia-hook-cut')).toBe(true);
  });
});
