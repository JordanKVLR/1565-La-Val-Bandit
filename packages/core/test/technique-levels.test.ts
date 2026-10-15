import { describe, expect, it } from 'vitest';
import type { Attack } from '../src';
import {
  applyCommand,
  attackBackOptions,
  createBattle,
  isAttackUnlocked,
  meetsRequirements,
  requireUnit,
  unlockedAttacks,
} from '../src';
import { makeMap, setup, unit } from './fixtures';

/** Stat requirement already met by the fixture pilot; only the level gates it. */
const GATED: Attack = {
  id: 'gated',
  name: 'Gated Cut',
  style: 'slash',
  power: 1.1,
  accuracy: 0,
  apCost: 30,
  fpCost: 10,
  requires: { pow: 5 },
  level: 3,
};

const duel = (level: number) =>
  createBattle(
    setup({
      map: makeMap(['pppp', 'pppp']),
      units: [
        unit({
          id: 'a',
          controller: 'human',
          at: { x: 1, y: 0 },
          facing: 'south',
          level,
          stats: { dex: 30, agl: 20 },
          attacks: [GATED],
        }),
        unit({
          id: 'e',
          side: 'enemy',
          at: { x: 1, y: 1 },
          facing: 'north',
          level: 1,
          stats: { agl: 0 },
        }),
      ],
    }),
  ).state;

const withXp = (s: ReturnType<typeof duel>, xp: number) => ({
  ...s,
  units: s.units.map((u) => (u.id === 'a' ? { ...u, xp } : u)),
});

describe('technique unlock levels', () => {
  it('needs the level AND the stats: either one missing keeps it locked', () => {
    const stats = { bas: 5, pow: 6, dex: 6, agl: 6, def: 0, int: 5 };
    expect(meetsRequirements(stats, GATED)).toBe(true);
    expect(isAttackUnlocked(2, stats, GATED)).toBe(false);
    expect(isAttackUnlocked(3, stats, GATED)).toBe(true);
    expect(isAttackUnlocked(3, { ...stats, pow: 4 }, GATED)).toBe(false);
    // Level 1 techniques are open from the start.
    expect(isAttackUnlocked(1, stats, { ...GATED, level: 1 })).toBe(true);
  });

  it('keeps a stat-qualified pilot on the two starters until the level is reached', () => {
    expect(unlockedAttacks(requireUnit(duel(1), 'a')).map((x) => x.id)).toEqual([
      'basic',
      'thrust',
    ]);
    expect(unlockedAttacks(requireUnit(duel(2), 'a'))).toHaveLength(2);
    expect(unlockedAttacks(requireUnit(duel(3), 'a')).map((x) => x.id)).toContain('gated');
  });

  it('refuses to use a technique below its level, and allows it at the level', () => {
    const cmd = {
      type: 'attack',
      unitId: 'a',
      targetId: 'e',
      attackId: 'gated',
      reaction: 'defend',
    } as const;
    expect(() => applyCommand(duel(2), cmd)).toThrow(/not unlocked yet/);
    expect(() => applyCommand(duel(3), cmd)).not.toThrow();
  });

  it('does not offer a locked technique to strike back with', () => {
    const low = duel(2);
    const high = duel(3);
    const ids = (s: typeof low) =>
      attackBackOptions(s, requireUnit(s, 'a')).map((o) => o.attack.id);
    expect(ids(low)).not.toContain('gated');
    expect(ids(high)).toContain('gated');
  });

  it('announces the technique in the level-up event the moment the level is reached', () => {
    const s = withXp(duel(2), 490);
    const { state, events } = applyCommand(s, {
      type: 'attack',
      unitId: 'a',
      targetId: 'e',
      reaction: 'defend',
    });
    expect(requireUnit(state, 'a').level).toBe(3);
    const up = events.find((e) => e.type === 'levelUp');
    expect(up).toMatchObject({ level: 3, newTechniques: ['gated'] });
    expect(unlockedAttacks(requireUnit(state, 'a')).map((x) => x.id)).toContain('gated');
  });

  it('does not announce techniques a level-up does not open', () => {
    const s = withXp(duel(1), 490);
    const { events } = applyCommand(s, {
      type: 'attack',
      unitId: 'a',
      targetId: 'e',
      reaction: 'defend',
    });
    const up = events.find((e) => e.type === 'levelUp');
    expect(up).toBeDefined();
    expect(up).not.toHaveProperty('newTechniques');
  });
});
