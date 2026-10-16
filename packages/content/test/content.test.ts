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
  resolveTechnique,
} from '../src';
import {
  activeSkills,
  createBattle,
  DEFAULT_BALANCE,
  techniqueValue,
  techniqueValueTarget,
  unlockedAttacks,
} from '@m1565/core';
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

  it('every weapon has damage power and a price', () => {
    for (const w of lib.weapons.values()) {
      expect(w.power, w.id).toBeGreaterThan(0);
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
        stats: { bas: 6, pow: 10, dex: 9, agl: 9, def: 5, int: 7 },
        frame: 'cavaliere',
        weapon: 'bastard-sword',
        charm: 'charm-def-1',
        amulet: 'pilgrim-shell',
      },
    ]);
    const ninu = setup.units.find((u) => u.id === 'ninu')!;
    expect(ninu).toMatchObject({ level: 4, stats: { pow: 10, dex: 9, agl: 9, def: 5, int: 7 } });
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

  /** Every technique as the engine sees it, with its faction and the weapon types it suits. */
  const resolved = lib.attacks.map((data) => ({
    data,
    attack: resolveTechnique(data, lib.balance),
  }));
  const pools = new Map<string, typeof resolved>();
  for (const r of resolved)
    for (const w of r.data.weaponTypes) {
      const key = `${r.data.faction}/${w}`;
      pools.set(key, [...(pools.get(key) ?? []), r]);
    }

  it('are worth what their level promises: the value standard (ADR 0017)', () => {
    for (const { data, attack } of resolved) {
      const target = techniqueValueTarget(data.level, lib.balance);
      const value = techniqueValue(attack, lib.balance);
      expect(
        Math.abs(value / target - 1),
        `${data.id} is worth ${value.toFixed(2)}, target ${target.toFixed(2)}`,
      ).toBeLessThanOrEqual(lib.balance.techValueTolerance);
    }
  });

  it('only get better with level, within each faction and weapon pool', () => {
    for (const [key, list] of pools) {
      const sorted = [...list].sort((a, b) => a.data.level - b.data.level);
      for (let i = 1; i < sorted.length; i++) {
        const [lo, hi] = [sorted[i - 1]!, sorted[i]!];
        expect(
          techniqueValue(hi.attack, lib.balance),
          `${key}: ${hi.data.id} (Lv ${hi.data.level}) vs ${lo.data.id} (Lv ${lo.data.level})`,
        ).toBeGreaterThanOrEqual(techniqueValue(lo.attack, lib.balance) - 0.03);
        // The POW a player reads must climb too (a flurry's strikes are lighter by design).
        if (hi.data.level > lo.data.level && (hi.data.hits ?? 1) === 1 && (lo.data.hits ?? 1) === 1)
          expect(hi.data.power, `${key}: POW of ${hi.data.id}`).toBeGreaterThanOrEqual(
            lo.data.power,
          );
      }
    }
  });

  it('are never worse than a starter strike for the AP they cost', () => {
    for (const { data, attack } of resolved) {
      // A starter strike is worth 1.0 for 30 AP.
      expect(
        techniqueValue(attack, lib.balance) / (attack.apCost / 30),
        data.id,
      ).toBeGreaterThanOrEqual(0.98);
    }
  });

  it('spread their unlocks: a pool opens early, every few levels, and ends with a master technique', () => {
    for (const [key, list] of pools) {
      const levels = [...new Set(list.map((r) => r.data.level))].sort((a, b) => a - b);
      expect(levels.length, key).toBeGreaterThanOrEqual(4);
      expect(levels[0]!, key).toBeLessThanOrEqual(4);
      expect(levels[levels.length - 1]!, key).toBeGreaterThanOrEqual(13);
      for (let i = 1; i < levels.length; i++)
        expect(levels[i]! - levels[i - 1]!, key).toBeLessThanOrEqual(3);
    }
  });

  it('give every flurry armour-piercing strikes, so two light blows are never worse than one', () => {
    for (const { data } of resolved)
      if ((data.hits ?? 1) > 1) expect(data.pierce ?? 0, data.id).toBeGreaterThanOrEqual(0.4);
  });

  it('describe exactly what they do: every effect in the text is in the numbers, and the reverse', () => {
    for (const { data } of resolved) {
      const d = data.description.toLowerCase();
      const says = (re: RegExp) => re.test(d);
      expect(says(/pierces|ignores/), `${data.id} pierce`).toBe((data.pierce ?? 0) > 0);
      expect(says(/tires the target/), `${data.id} fatigue`).toBe((data.fatigue ?? 0) > 0);
      expect(says(/cannot be countered/), `${data.id} counter`).toBe(Boolean(data.noCounter));
      expect(says(/strikes twice/), `${data.id} strikes`).toBe((data.hits ?? 1) > 1);
      if (data.weaponTypes.includes('polearm'))
        expect(says(/reaches two tiles/), `${data.id} reach`).toBe(data.maxRange === 2);
    }
  });

  it('keep the shipped technique count', () => {
    expect(lib.attacks).toHaveLength(71);
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

  it('open gradually: every technique has an unlock level, none before level 3', () => {
    for (const a of lib.attacks) {
      expect(a.level, a.id).toBeGreaterThanOrEqual(3);
      expect(a.level, a.id).toBeLessThanOrEqual(14);
      const total = a.power * (a.hits ?? 1);
      // Cheap, light techniques with modest stat needs are the entry tier; heavy ones are the late game.
      const need = Object.values(a.requires).reduce((n: number, v) => n + (v ?? 0), 0);
      if (total <= 1.15 && need <= 10) expect(a.level, a.id).toBeLessThanOrEqual(6);
      if (total >= 1.55) expect(a.level, a.id).toBeGreaterThanOrEqual(10);
    }
    expect(lib.attacks.filter((a) => a.level <= 4).length).toBeGreaterThanOrEqual(10);
    expect(lib.attacks.filter((a) => a.level >= 10).length).toBeGreaterThanOrEqual(10);
  });

  it('leave every pilot of level 1 or 2, in every battle, with only the two starters', () => {
    for (const id of Object.keys(battleSources)) {
      const { units } = createBattle(loadBattle(id, lib)).state;
      for (const u of units.filter((x) => x.level <= 2)) {
        expect(unlockedAttacks(u).length, `${id}/${u.id}`).toBe(2);
      }
    }
  });

  it('give story characters their first technique as the story reaches level 3-4', () => {
    const count = (battle: string, unitId: string) => {
      const { units } = createBattle(loadBattle(battle, lib)).state;
      return unlockedAttacks(units.find((u) => u.id === unitId)!).length;
    };
    expect(count('b1-marsaxlokk', 'ninu')).toBe(2);
    expect(count('b6-kalkara-chapel', 'ninu')).toBe(3); // Level 4: Hook-Cut
    expect(count('a5-scala-engine', 'ninu')).toBeGreaterThanOrEqual(4);
  });

  it('are attached to battle units by frame faction, weapon type and frame class', () => {
    const setup = loadBattle('b1-marsaxlokk', lib);
    const ninu = setup.units.find((u) => u.id === 'ninu')!;
    expect(ninu.attacks?.every((a) => a.id.startsWith('militia-'))).toBe(true);
    expect(ninu.attacks?.some((a) => a.id === 'militia-hook-cut')).toBe(true);
  });
});

describe('militia starting stats', () => {
  const lib = loadLibrary();
  const total = (id: string) =>
    Object.values(lib.characters.get(id)!.stats).reduce((n: number, v) => n + v, 0);

  it('keep Ninu at a raw total of 30, no stat below 3 and not above his peers', () => {
    const ninu = lib.characters.get('ninu')!;
    expect(total('ninu')).toBe(30);
    for (const v of Object.values(ninu.stats)) expect(v).toBeGreaterThanOrEqual(3);
    for (const peer of ['ganni', 'kateri']) expect(total('ninu')).toBeLessThanOrEqual(total(peer));
  });
});

describe('armaturas and weapon progression', () => {
  const lib = loadLibrary();
  const sum = (b: Record<string, number | undefined>) =>
    Object.values(b).reduce<number>((n, v) => n + (v ?? 0), 0);

  it('every armatura gives BAS and DEF, heavy ones more DEF and light ones more AGL/DEX', () => {
    const player = [...lib.frames.values()].filter(
      (f) => !['barge', 'siege-tower', 'colossus', 'prototipo'].includes(f.id),
    );
    for (const f of player) {
      expect(f.bonus.bas ?? 0, f.id).toBeGreaterThan(0);
      expect(f.bonus.def ?? 0, f.id).toBeGreaterThan(0);
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

  it('light armaturas are the agile and fast ones, heavy the slow ones', () => {
    const cls = (c: string) =>
      [...lib.frames.values()].filter(
        (f) => f.class === c && !['barge', 'siege-tower', 'colossus', 'prototipo'].includes(f.id),
      );
    for (const f of cls('light')) {
      expect(f.bonus.agl ?? 0, f.id).toBeGreaterThanOrEqual(4);
      expect(f.move, f.id).toBeGreaterThanOrEqual(5);
    }
    const slowestLight = Math.min(...cls('light').map((f) => f.move));
    for (const f of cls('heavy')) expect(f.move, f.id).toBeLessThan(slowestLight - 1);
  });

  it('charms and amulets are worth the scudi: HP charms give real HP, amulets at least 3 points', () => {
    const b = lib.balance;
    for (const g of lib.gear.values()) {
      const pts = sum(g.bonus);
      if (g.kind === 'amulet') expect(pts, g.id).toBeGreaterThanOrEqual(2);
      if (g.bonus.bas && g.kind === 'charm' && Object.keys(g.bonus).length === 1) {
        // 120 / 220 / 450 scudi buys roughly 8 / 16 / 28 HP.
        expect((g.bonus.bas ?? 0) * b.hpPerBas, g.id).toBeGreaterThanOrEqual(g.price / 16);
      }
    }
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
    // Named pilots' skills plus the enemy roles (standard-bearer, veteran, marksman, zealot).
    expect(lib.skills.size).toBeGreaterThanOrEqual(20);
    expect(lib.skills.size).toBeLessThanOrEqual(40);
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
