import { describe, expect, it } from 'vitest';
import type { BattleId } from '../src';
import {
  attackPool,
  battleSalvage,
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

describe('armoury and gear', () => {
  const lib = loadLibrary();

  it('only sells real weapons, charms and amulets (never armaturas)', () => {
    for (const s of lib.shop) {
      const known =
        s.kind === 'weapon' ? lib.weapons.has(s.item) : lib.gear.get(s.item)?.kind === s.kind;
      expect(known, s.item).toBe(true);
    }
  });

  it('every weapon grants attribute bonuses and has a price', () => {
    for (const w of lib.weapons.values()) {
      const total = Object.values(w.bonus).reduce((a, b) => a + (b ?? 0), 0);
      expect(total, w.id).toBeGreaterThan(0);
      expect(w.price, w.id).toBeGreaterThan(0);
    }
  });

  it('salvage only names real armaturas', () => {
    for (const id of Object.keys(battleSources) as BattleId[]) {
      for (const f of battleSalvage(id)) expect(lib.frames.has(f), `${id}: ${f}`).toBe(true);
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
        stats: { bas: 6, pow: 10, dex: 9, agl: 9, def: 5, wep: 7 },
        frame: 'cavaliere',
        weapon: 'bastard-sword',
        charm: 'charm-def-1',
        amulet: 'pilgrim-shell',
      },
    ]);
    const ninu = setup.units.find((u) => u.id === 'ninu')!;
    expect(ninu).toMatchObject({ level: 4, stats: { pow: 10, dex: 9, agl: 9, def: 5, wep: 7 } });
    expect(ninu.charm?.id).toBe('charm-def-1');
    expect(ninu.amulet?.id).toBe('pilgrim-shell');
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
      const total = Object.values(a.requires).reduce((n: number, v) => n + (v ?? 0), 0);
      // A level 15 pilot has 42 points on top of base stats around 5 each, plus gear.
      expect(total, a.id).toBeLessThanOrEqual(32);
    }
  });

  it('cost more AP and FP, and lose accuracy, the stronger they are', () => {
    const ninu = lib.characters.get('ninu')!;
    const techs = attackPool(lib, lib.frames.get('cavaliere')!, lib.weapons.get('arming-sword')!);
    expect(ninu).toBeDefined();
    const byPower = [...techs].sort((a, b) => a.power * (a.hits ?? 1) - b.power * (b.hits ?? 1));
    for (let i = 1; i < byPower.length; i++) {
      const [lo, hi] = [byPower[i - 1]!, byPower[i]!];
      expect(hi.apCost, hi.id).toBeGreaterThanOrEqual(lo.apCost);
      expect(hi.fpCost, hi.id).toBeGreaterThanOrEqual(lo.fpCost);
      expect(hi.accuracy, hi.id).toBeLessThanOrEqual(lo.accuracy);
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
