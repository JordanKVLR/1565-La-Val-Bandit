import { loadBattle, loadLibrary } from '@m1565/content';
import { createUnit } from '@m1565/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { GameSession } from './GameSession';
import { newRosterEntry, promote, promotionBlocked } from './progression';
import { installFakePlatform } from './testkit';

const lib = loadLibrary();

beforeEach(() => {
  installFakePlatform();
});

const veteran = (level: number) => ({ ...newRosterEntry(lib, 'ninu'), level });

describe('classes', () => {
  it('there are four, each a six-point stat package and one skill', () => {
    expect(lib.classes.size).toBe(4);
    for (const c of lib.classes.values()) {
      const points = Object.values(c.bonus).reduce<number>((n, v) => n + (v ?? 0), 0);
      expect(points, c.id).toBe(6);
      expect(c.skill.description.length, c.id).toBeGreaterThan(10);
    }
  });

  it('are offered only from the promotion level, once', () => {
    expect(promotionBlocked(lib, veteran(9), 'bulwark')).toBe('level');
    expect(promotionBlocked(lib, veteran(10), 'bulwark')).toBeUndefined();
    expect(promotionBlocked(lib, veteran(10), 'nonesuch')).toBe('unknown');
    const once = promote(lib, [veteran(10)], 'ninu', 'bulwark');
    expect(promotionBlocked(lib, once[0]!, 'duelist')).toBe('chosen');
    expect(() => promote(lib, once, 'ninu', 'duelist')).toThrow(/chosen/);
    expect(() => promote(lib, [veteran(5)], 'ninu', 'bulwark')).toThrow(/level/);
  });

  it('adds the stat package, capped at the maximum', () => {
    const base = veteran(10);
    const out = promote(lib, [base], 'ninu', 'bulwark')[0]!;
    expect(out.class).toBe('bulwark');
    expect(out.stats.bas).toBe(base.stats.bas + 3);
    expect(out.stats.def).toBe(base.stats.def + 3);
    const maxed = { ...base, stats: { ...base.stats, def: lib.balance.statMax } };
    expect(promote(lib, [maxed], 'ninu', 'bulwark')[0]!.stats.def).toBe(lib.balance.statMax);
  });

  it('puts the class skill into battle', () => {
    const entry = promote(lib, [veteran(10)], 'ninu', 'duelist')[0]!;
    const setup = loadBattle('b1-marsaxlokk', lib, [entry]);
    const ninu = setup.units.find((u) => u.id === 'ninu')!;
    expect(ninu.skills?.map((s) => s.id)).toContain('class-duelist');
    const unit = createUnit(ninu, lib.balance);
    expect(unit.skills.some((s) => s.effect.type === 'counterBonus')).toBe(true);
    // Without a class there is no such skill.
    const plain = loadBattle('b1-marsaxlokk', lib, [veteran(10)]).units.find(
      (u) => u.id === 'ninu',
    )!;
    expect(plain.skills?.map((s) => s.id) ?? []).not.toContain('class-duelist');
  });

  it('a session promotes, saves and loads the class', () => {
    const s = new GameSession(lib, undefined, { difficulty: 'knight' });
    s.view.set({ ...s.state, roster: [veteran(10)] });
    s.promoteTo('ninu', 'vanguard');
    expect(s.state.roster[0]!.class).toBe('vanguard');
    expect(s.saveTo('slot1')).toBe(true);
    expect(GameSession.load(lib, 'slot1')!.state.roster[0]!.class).toBe('vanguard');
  });
});
