import type { Recipe } from '@m1565/content';
import { loadLibrary } from '@m1565/content';
import { beforeEach, describe, expect, it } from 'vitest';
import { GameSession } from './GameSession';
import { craft, craftBlocked } from './inventory';
import type { WorkshopHoldings } from './inventory';
import { installFakePlatform, lostState, playUntil, wonState } from './testkit';

const lib = loadLibrary();

beforeEach(() => {
  installFakePlatform();
});

const recipe = (id: string): Recipe => lib.recipes.find((r) => r.id === id)!;

/** A new game played to the first preparation screen after `battle` is won. */
function prepAfter(battle: string, prefer?: RegExp): GameSession {
  const s = new GameSession(lib, undefined, { difficulty: 'knight' });
  playUntil(s, (v) => v.completedBattles.includes(battle) && v.screen.kind === 'prep', prefer);
  return s;
}

describe('crafting', () => {
  const base: WorkshopHoldings = {
    roster: [
      {
        characterId: 'ninu',
        level: 1,
        xp: 0,
        statPoints: 0,
        stats: lib.characters.get('ninu')!.stats,
        frame: 'haddiem',
        weapon: 'arming-sword',
        charm: null,
        amulet: null,
      },
    ],
    stores: { 'weapon:pike': 1 },
    scudi: 500,
    parts: 10,
  };

  it('upgrades a spare: it is consumed, the result lands in the stores, costs are paid', () => {
    const r = recipe('temper-pike');
    const out = craft(lib, base, r);
    expect(out.stores).toEqual({ 'weapon:tempered-pike': 1 });
    expect(out.scudi).toBe(500 - r.scudi);
    expect(out.parts).toBe(10 - r.parts);
  });

  it('upgrades the copy a pilot has fitted, in place, leaving the stores alone', () => {
    const r = recipe('temper-arming-sword');
    const out = craft(lib, base, r, 'ninu');
    expect(out.roster[0]!.weapon).toBe('tempered-arming-sword');
    expect(out.stores).toEqual(base.stores);
  });

  it('forges a keepsake from parts alone', () => {
    const out = craft(lib, base, recipe('forge-kateris-spring'));
    expect(out.stores['amulet:kateris-spring']).toBe(1);
  });

  it('refuses without scudi, parts or the item to upgrade', () => {
    expect(craftBlocked({ ...base, scudi: 0 }, recipe('temper-pike'))).toBe('scudi');
    expect(craftBlocked({ ...base, parts: 0 }, recipe('temper-pike'))).toBe('parts');
    expect(craftBlocked(base, recipe('temper-kilij'))).toBe('ingredient');
    expect(craftBlocked(base, recipe('temper-pike'), 'ninu')).toBe('ingredient');
    expect(() => craft(lib, { ...base, parts: 0 }, recipe('temper-pike'))).toThrow(/parts/);
  });
});

describe('a campaign with camp talks and parts', () => {
  it('victories bring salvaged parts', () => {
    const s = new GameSession(lib, undefined, { difficulty: 'knight' });
    playUntil(s, (v) => v.screen.kind === 'results');
    expect(s.state.parts).toBeGreaterThan(0);
    const screen = s.state.screen;
    expect(screen.kind === 'results' && screen.lines.some((l) => l.kind === 'parts')).toBe(true);
  });

  it('a camp talk plays in its own story, raises the bond and returns to preparation', () => {
    const s = prepAfter('b2-marsa-wells');
    const talks = s.campTalks().map((c) => c.id);
    expect(talks).toEqual(expect.arrayContaining(['kateri-springs', 'ganni-nets']));
    const before = s.bondScores();
    const mainLine = s.state.screen;
    s.startCamp('ganni-nets');
    expect(s.inCamp).toBe(true);
    expect(s.state.screen.kind).toBe('story');
    for (let i = 0; i < 200 && s.inCamp; i++) {
      const sc = s.state.screen;
      if (sc.kind === 'story' && sc.choices) s.choose(0);
      else s.advance();
    }
    expect(s.inCamp).toBe(false);
    expect(s.state.screen).toEqual(mainLine);
    expect(s.state.campDone).toEqual(['ganni-nets']);
    expect(s.bondScores().bond_ninu_ganni).toBe(before.bond_ninu_ganni! + 1);
    expect(s.campTalks().map((c) => c.id)).not.toContain('ganni-nets');
  });

  it('a camp talk leaves the stage as it was and never saves a half-heard scene', () => {
    const s = prepAfter('b2-marsa-wells');
    const stage = s.state.stage;
    s.startCamp('kateri-springs');
    s.autosave(); // refused mid-talk: no write
    expect(s.state.stage).not.toEqual(stage);
    s.skipCamp();
    expect(s.state.stage).toEqual(stage);
    expect(s.state.screen.kind).toBe('prep');
  });

  it('only opens talks that are on offer, and only at preparation', () => {
    const s = prepAfter('b2-marsa-wells');
    s.startCamp('anastagi-horse');
    expect(s.inCamp).toBe(false);
    const g = new GameSession(lib, undefined, { difficulty: 'knight' });
    g.startCamp('kateri-springs');
    expect(g.inCamp).toBe(false);
  });

  it('heard talks and parts survive saving and loading', () => {
    const s = prepAfter('b2-marsa-wells');
    s.startCamp('kateri-springs');
    s.skipCamp();
    expect(s.saveTo('slot1')).toBe(true);
    const loaded = GameSession.load(lib, 'slot1')!;
    expect(loaded.state.campDone).toEqual(['kateri-springs']);
    expect(loaded.state.parts).toBe(s.state.parts);
    expect(loaded.bondScores().aff_kateri).toBe(s.bondScores().aff_kateri);
  });

  it('bonds reach the next battle once a bond has some rank', () => {
    const s = prepAfter('b2-marsa-wells');
    s.startCamp('kateri-springs');
    s.skipCamp();
    s.closePrep();
    const screen = s.state.screen;
    expect(screen.kind).toBe('battle');
    if (screen.kind === 'battle') {
      expect(screen.setup.bonds).toContainEqual(
        expect.objectContaining({ a: 'ninu', b: 'kateri' }),
      );
    }
  });
});

describe('skirmishes in a campaign', () => {
  it('are offered at camp once their battle is won, and only on their route', () => {
    const s = prepAfter('b2-marsa-wells');
    expect(s.skirmishes().map((k) => k.id)).toEqual(['s1-wells-patrol']);
    expect(s.skirmishes().every((k) => !k.route)).toBe(true);
  });

  it('fighting one returns to camp, pays its rewards and removes it from the list', () => {
    const s = prepAfter('b2-marsa-wells');
    const scudi = s.state.scudi;
    s.startSkirmish('s1-wells-patrol');
    const screen = s.state.screen;
    expect(screen.kind).toBe('battle');
    if (screen.kind !== 'battle') return;
    expect(screen.setup.units.filter((u) => u.side === 'player').map((u) => u.id)).toEqual(
      s.state.roster.map((r) => r.characterId).slice(0, 5),
    );
    s.finishBattle('victory', wonState(screen.setup));
    expect(s.state.screen.kind).toBe('results');
    expect(s.state.scudi).toBeGreaterThan(scudi);
    s.closeResults();
    expect(s.state.screen.kind).toBe('prep');
    expect(s.skirmishes().map((k) => k.id)).not.toContain('s1-wells-patrol');
    // The story is where it was: leaving preparation carries on to the real next battle.
    s.closePrep();
    expect(s.state.screen.kind).toBe('battle');
  });

  it('losing a skirmish costs nothing and returns to camp', () => {
    const s = prepAfter('b2-marsa-wells');
    const roster = s.state.roster;
    s.startSkirmish('s1-wells-patrol');
    const screen = s.state.screen;
    if (screen.kind !== 'battle') throw new Error('no battle');
    s.finishBattle('defeat', lostState(screen.setup, { level: 0, xp: 0 }));
    expect(s.state.screen.kind).toBe('prep');
    expect(s.state.roster).toEqual(roster);
    expect(s.skirmishes().map((k) => k.id)).toContain('s1-wells-patrol');
  });

  it('cannot start one that is not on offer', () => {
    const s = prepAfter('b2-marsa-wells');
    s.startSkirmish('s7-sapper-nest');
    expect(s.state.screen.kind).toBe('prep');
  });
});
