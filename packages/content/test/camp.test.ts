import { Story } from 'inkjs';
import { describe, expect, it } from 'vitest';
import story from '../story/main.ink';
import {
  activeBonds,
  availableCamp,
  availableRecipes,
  bondRankFor,
  campVars,
  battleSources,
  loadLibrary,
} from '../src';

const lib = loadLibrary();
const knot = (id: string) => `camp_${id.replace(/-/g, '_')}`;

/** Plays one camp talk, returning the lines it showed and the bond variables it changed. */
function play(id: string): { lines: string[]; changed: Record<string, number> } {
  const s = new Story(story as ConstructorParameters<typeof Story>[0]);
  const vars = lib.bondTable.bonds.map((b) => b.var);
  const before = Object.fromEntries(vars.map((v) => [v, Number(s.variablesState.$(v))]));
  s.ChoosePathString(knot(id));
  const lines: string[] = [];
  for (let guard = 0; guard < 200; guard++) {
    while (s.canContinue) lines.push((s.Continue() ?? '').trim());
    if (!s.currentChoices.length) break;
    s.ChooseChoiceIndex(0);
  }
  const changed: Record<string, number> = {};
  for (const v of vars) {
    const d = Number(s.variablesState.$(v)) - before[v]!;
    if (d) changed[v] = d;
  }
  return { lines, changed };
}

describe('camp talks', () => {
  it('every scene follows a real battle, features real characters and has a knot', () => {
    for (const c of lib.camp) {
      expect(c.after in battleSources, `${c.id} after ${c.after}`).toBe(true);
      for (const w of c.with) expect(lib.characters.has(w), `${c.id} with ${w}`).toBe(true);
      const { lines } = play(c.id);
      expect(lines.length, `${c.id} has text`).toBeGreaterThan(5);
    }
  });

  it('each scene ends with endcamp and raises exactly one bond between its own characters', () => {
    for (const c of lib.camp) {
      const { lines, changed } = play(c.id);
      expect(
        lines.filter((l) => l === '>>> endcamp'),
        c.id,
      ).toHaveLength(1);
      const vars = Object.keys(changed);
      expect(vars, c.id).toHaveLength(1);
      expect(changed[vars[0]!], c.id).toBe(1);
      const bond = lib.bondTable.bonds.find((b) => b.var === vars[0])!;
      expect(c.with, c.id).toContain(bond.a);
      expect(c.with, c.id).toContain(bond.b);
    }
  });

  it('scene ids are unique and every scene has its own knot', () => {
    expect(new Set(lib.camp.map((c) => c.id)).size).toBe(lib.camp.length);
  });

  it('only offers scenes that are unlocked, on the right route, unheard, with everyone present', () => {
    const all = ['ninu', 'kateri', 'luis', 'ganni', 'rozi', 'balbi'];
    const early = availableCamp(lib, ['b2-marsa-wells'], '', [], all).map((c) => c.id);
    expect(early).toEqual(['kateri-springs', 'ganni-nets']);
    expect(
      availableCamp(lib, ['b2-marsa-wells'], '', ['ganni-nets'], all).map((c) => c.id),
    ).toEqual(['kateri-springs']);
    // Route scenes need their route, and everyone in the scene must still be here.
    expect(availableCamp(lib, ['i2-mdina-walls'], '', [], [...all, 'anastagi'])).toEqual([]);
    expect(
      availableCamp(lib, ['i2-mdina-walls'], 'island', [], [...all, 'anastagi']).map((c) => c.id),
    ).toEqual(['anastagi-horse']);
    expect(
      availableCamp(lib, ['b2-marsa-wells'], '', [], ['ninu', 'kateri']).map((c) => c.id),
    ).toEqual(['kateri-springs']);
  });

  it('every route can hear a good number of talks', () => {
    for (const route of ['cross', 'island', 'crescent']) {
      const done = lib.camp.filter((c) => !c.route || c.route === route);
      expect(done.length, route).toBeGreaterThanOrEqual(10);
    }
  });
});

describe('bonds', () => {
  it('rank rises with the score and stops at 3', () => {
    expect([0, 1, 2, 3, 4, 5, 9].map((s) => bondRankFor(lib, s))).toEqual([0, 1, 1, 2, 2, 3, 3]);
  });

  it('every bond is between real characters and reads a story variable that exists', () => {
    const s = new Story(story as ConstructorParameters<typeof Story>[0]);
    for (const b of lib.bondTable.bonds) {
      expect(lib.characters.has(b.a) && lib.characters.has(b.b), `${b.a}-${b.b}`).toBe(true);
      expect(typeof s.variablesState.$(b.var), b.var).toBe('number');
    }
    for (const v of campVars(lib)) expect(s.variablesState.$(v), v).not.toBeUndefined();
  });

  it('activeBonds lists only bonds with rank above 0', () => {
    expect(activeBonds(lib, {})).toEqual([]);
    expect(activeBonds(lib, { aff_kateri: 3, bond_ninu_ganni: 1 })).toEqual([
      { a: 'ninu', b: 'kateri', rank: 2 },
      { a: 'ninu', b: 'ganni', rank: 1 },
    ]);
  });
});

describe('workshop recipes', () => {
  it('make real items from real items, with unique ids', () => {
    const have = (kind: string, id: string) =>
      kind === 'weapon' ? lib.weapons.has(id) : lib.gear.has(id);
    expect(new Set(lib.recipes.map((r) => r.id)).size).toBe(lib.recipes.length);
    for (const r of lib.recipes) {
      expect(have(r.result.kind, r.result.id), r.id).toBe(true);
      if (r.from) expect(have(r.from.kind, r.from.id), r.id).toBe(true);
      if (r.after) expect(r.after in battleSources, r.id).toBe(true);
    }
  });

  it('an upgrade beats the item it is made from, and costs more to buy', () => {
    for (const r of lib.recipes.filter((x) => x.from?.kind === 'weapon')) {
      const from = lib.weapons.get(r.from!.id)!;
      const to = lib.weapons.get(r.result.id)!;
      expect(to.power, r.id).toBeGreaterThan(from.power);
      expect(to.price, r.id).toBeGreaterThan(from.price);
      expect(to.type, r.id).toBe(from.type);
      expect(to.apCost, r.id).toBe(from.apCost);
    }
  });

  it('unlock as battles are won', () => {
    expect(availableRecipes(lib, []).length).toBe(0);
    const later = availableRecipes(lib, ['b3-sciberras', 'b5-tigne']);
    expect(later.length).toBeGreaterThan(5);
  });
});
