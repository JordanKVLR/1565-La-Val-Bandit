import { describe, expect, it } from 'vitest';
import type { BattleId } from '../src';
import {
  attackPool,
  battleSalvage,
  characterSkills,
  loadSkillBook,
  battleSources,
  BattleSourceSchema,
  buildBattle,
  loadBattle,
  loadLibrary,
  loadMap,
  loadTerrains,
  mapSources,
} from '../src';
import { activeSkills, createBattle, DEFAULT_BALANCE } from '@m1565/core';
import castData from '../data/cast.json';

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

  it('gives stand-in portraits only to cast members', () => {
    const cast = new Set(castData.map((c) => c.id));
    for (const [id, src] of Object.entries(battleSources)) {
      for (const u of (src as { units: Array<{ portrait?: string }> }).units) {
        if (u.portrait) expect(cast.has(u.portrait), `${id}: ${u.portrait}`).toBe(true);
      }
    }
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

describe('armaturas and weapon progression', () => {
  const lib = loadLibrary();
  const sum = (b: Record<string, number | undefined>) =>
    Object.values(b).reduce<number>((n, v) => n + (v ?? 0), 0);

  it('every armatura gives BAS, DEF and WEP, heavy ones more DEF and light ones more AGL/DEX', () => {
    const player = [...lib.frames.values()].filter(
      (f) => !['barge', 'siege-tower', 'colossus', 'prototipo'].includes(f.id),
    );
    for (const f of player) {
      expect(f.bonus.bas ?? 0, f.id).toBeGreaterThan(0);
      expect(f.bonus.def ?? 0, f.id).toBeGreaterThan(0);
      expect(f.bonus.wep ?? 0, f.id).toBeGreaterThan(0);
      // One budget per class: what heavy frames gain in DEF, light ones get in AGL and DEX.
      expect(sum(f.bonus), f.id).toBeGreaterThanOrEqual(9);
      expect(sum(f.bonus), f.id).toBeLessThanOrEqual(12);
    }
    const avg = (cls: string, k: 'def' | 'agl' | 'dex') => {
      const fs = player.filter((f) => f.class === cls);
      return fs.reduce((n, f) => n + (f.bonus[k] ?? 0), 0) / fs.length;
    };
    expect(avg('heavy', 'def')).toBeGreaterThan(avg('medium', 'def'));
    expect(avg('medium', 'def')).toBeGreaterThan(avg('light', 'def'));
    expect(avg('light', 'agl') + avg('light', 'dex')).toBeGreaterThan(
      avg('heavy', 'agl') + avg('heavy', 'dex'),
    );
  });

  it('every route unlocks fine and masterwork weapons for the Maltese and Ottoman pilots', () => {
    const routes = {
      cross: 'a3-castile-breach',
      island: 'i3-marsa-raid',
      crescent: 'c4-corradino-heights',
    };
    const weaponStock = () =>
      lib.shop
        .filter((s) => s.kind === 'weapon')
        .map((s) => ({ ...s, w: lib.weapons.get(s.item)! }));
    for (const [route, last] of Object.entries(routes)) {
      const won = new Set([
        ...Object.keys(battleSources).filter((b) => b.startsWith('b')),
        ...Object.keys(battleSources).filter((b) => b[0] === last[0] && b <= last),
      ]);
      for (const side of ['malta', 'ottoman'] as const) {
        const tiers = new Set(
          weaponStock()
            .filter((s) => s.allegiance === side && (s.after === null || won.has(s.after)))
            .map((s) => s.w.tier),
        );
        expect([...tiers].sort(), `${route} ${side}`).toEqual(['common', 'fine', 'masterwork']);
      }
    }
  });
});

describe('pilot skills', () => {
  const lib = loadLibrary();

  it('give every named character three skills at rising levels, all distinct', () => {
    const seen = new Set<string>();
    for (const id of lib.characters.keys()) {
      const skills = characterSkills(lib, id);
      expect(
        skills.map((s) => s.level),
        id,
      ).toEqual([1, 5, 10]);
      for (const s of skills) {
        expect(seen.has(s.id), `${s.id} is given twice`).toBe(false);
        seen.add(s.id);
      }
    }
    expect(lib.skills.size).toBeGreaterThanOrEqual(20);
    expect(lib.skills.size).toBeLessThanOrEqual(30);
  });

  it('only assigns skills to real characters, with short plain descriptions', () => {
    for (const id of lib.skillSets.keys()) expect(lib.characters.has(id), id).toBe(true);
    for (const s of lib.skills.values()) {
      expect(s.description.length, s.id).toBeLessThanOrEqual(140);
      const sentences = s.description.split(/[.!?](?:\s|$)/).filter((x) => x.trim());
      expect(sentences.length, s.id).toBeLessThanOrEqual(2);
    }
  });

  it('rejects unknown skills and out-of-order unlocks', () => {
    const skills = [{ id: 'x', name: 'X', description: 'X.', effect: { type: 'regen', hp: 1 } }];
    expect(() =>
      loadSkillBook({ skills, characters: { ninu: [{ skill: 'nope', level: 1 }] } }),
    ).toThrow(/unknown skill/);
    expect(() =>
      loadSkillBook({
        skills,
        characters: {
          ninu: [
            { skill: 'x', level: 5 },
            { skill: 'x', level: 5 },
          ],
        },
      }),
    ).toThrow(/rising levels/);
    const huge = [{ ...skills[0], effect: { type: 'regen', hp: 99 } }];
    expect(() => loadSkillBook({ skills: huge, characters: {} })).toThrow();
  });

  it('reach named units in battle, locked until their level', () => {
    const { state } = createBattle(loadBattle('b1-marsaxlokk'));
    const ninu = state.units.find((u) => u.characterId === 'ninu')!;
    expect(ninu.skills.map((s) => s.id)).toEqual(characterSkills(lib, 'ninu').map((s) => s.id));
    expect(activeSkills(ninu).map((s) => s.id)).toEqual(['medallion-promise']);
  });

  it('can be given to generic units from battle JSON', () => {
    const base = battleSources['b1-marsaxlokk'] as { units: Array<Record<string, unknown>> };
    const generic = base.units.find((u) => !u.character)!;
    const others = base.units.filter((u) => u !== generic);
    const withSkills = (skills: string[]) =>
      BattleSourceSchema.parse({ ...base, units: [...others, { ...generic, skills }] });
    const spec = buildBattle(withSkills(['keen-eyes']), lib).units.find(
      (u) => u.id === generic.id,
    )!;
    expect(spec.skills?.map((s) => [s.id, s.level])).toEqual([['keen-eyes', 1]]);
    expect(() => buildBattle(withSkills(['nope']), lib)).toThrow(/unknown skill/);
  });
});
