import { describe, expect, it } from 'vitest';
import type { Attack, BattleState } from '../src';
import {
  applyCommand,
  createBattle,
  deserializeBattle,
  forecastAttack,
  requireUnit,
  SAVE_VERSION,
  unlockedAttacks,
  xpFor,
} from '../src';
import { makeMap, setup, unit } from './fixtures';

const TWIN: Attack = {
  id: 'twin',
  name: 'Twin Cut',
  style: 'slash',
  power: 0.6,
  accuracy: 0,
  apCost: 30,
  fpCost: 15,
  hits: 2,
  requires: { agi: 10 },
};
const HEAVY: Attack = {
  id: 'heavy',
  name: 'Heavy Blow',
  style: 'overhead',
  power: 1.5,
  accuracy: -10,
  apCost: 35,
  fpCost: 20,
  pierce: 0.5,
  fatigue: 20,
  apDamage: 15,
  noCounter: true,
  requires: { str: 8 },
};

function duel(attackerLevel = 1, targetLevel = 1, targetHp?: number): BattleState {
  const s = createBattle(
    setup({
      map: makeMap(['pppp', 'pppp', 'pppp']),
      units: [
        unit({
          id: 'a',
          controller: 'human',
          level: attackerLevel,
          stats: { str: 8, skl: 30, agi: 20 },
          at: { x: 1, y: 0 },
          facing: 'south',
          attacks: [TWIN, HEAVY],
        }),
        unit({
          id: 'e',
          side: 'enemy',
          level: targetLevel,
          stats: { str: 6, skl: 6, agi: 0 },
          at: { x: 1, y: 1 },
          facing: 'north',
        }),
      ],
    }),
  ).state;
  return targetHp === undefined
    ? s
    : { ...s, units: s.units.map((u) => (u.id === 'e' ? { ...u, hp: targetHp } : u)) };
}

describe('XP', () => {
  it('KO blows are worth more than hits', () => {
    const s = duel();
    const a = requireUnit(s, 'a');
    const e = requireUnit(s, 'e');
    expect(xpFor(s, a, e, true)).toBeGreaterThan(xpFor(s, a, e, false));
  });

  it('drops against weaker enemies and rises against stronger ones', () => {
    const even = duel(5, 5);
    const bully = duel(9, 3);
    const brave = duel(3, 7);
    const hit = (s: BattleState) => xpFor(s, requireUnit(s, 'a'), requireUnit(s, 'e'), false);
    expect(hit(bully)).toBeLessThan(hit(even));
    expect(hit(brave)).toBeGreaterThan(hit(even));
    expect(hit(duel(30, 1))).toBeGreaterThanOrEqual(1);
  });

  it('is earned when a hit lands and reported on the strike', () => {
    const { state, events } = applyCommand(duel(), {
      type: 'attack',
      unitId: 'a',
      targetId: 'e',
      reaction: 'defend',
    });
    expect(requireUnit(state, 'a').xp).toBe(20);
    const ev = events[0];
    expect(ev?.type === 'attackResolved' && ev.strikes[0]?.xp).toBe(20);
  });

  it('levels up every 100 XP, carrying the remainder, with HP and stat points', () => {
    let s = duel(1, 1, 1);
    s = { ...s, units: s.units.map((u) => (u.id === 'a' ? { ...u, xp: 90 } : u)) };
    const before = requireUnit(s, 'a');
    const { state, events } = applyCommand(s, {
      type: 'attack',
      unitId: 'a',
      targetId: 'e',
      reaction: 'defend',
    });
    const a = requireUnit(state, 'a');
    expect(a.level).toBe(2);
    expect(a.xp).toBe(90 + 60 - 100);
    expect(a.maxHp).toBe(before.maxHp + state.balance.hpPerLevel);
    expect(a.statPoints).toBe(state.balance.statPointsPerLevel);
    expect(events.some((e) => e.type === 'levelUp' && e.unitId === 'a' && e.level === 2)).toBe(
      true,
    );
  });

  it('is not earned by enemy units', () => {
    const s = duel();
    const e = requireUnit(s, 'e');
    expect(e.xp).toBe(0);
  });
});

describe('stat points', () => {
  it('are spent one at a time on the chosen stat, even outside the unit turn', () => {
    let s = duel();
    s = { ...s, units: s.units.map((u) => (u.id === 'a' ? { ...u, statPoints: 2 } : u)) };
    s = applyCommand(s, { type: 'raiseStat', unitId: 'a', stat: 'str' }).state;
    s = applyCommand(s, { type: 'raiseStat', unitId: 'a', stat: 'agi' }).state;
    const a = requireUnit(s, 'a');
    expect(a).toMatchObject({ str: 9, statPoints: 0 });
    expect(() => applyCommand(s, { type: 'raiseStat', unitId: 'a', stat: 'skl' })).toThrow(
      /no stat points/,
    );
  });

  it('can unlock an attack mid-battle', () => {
    let s = createBattle(
      setup({
        units: [
          unit({
            id: 'a',
            stats: { str: 7, skl: 6, agi: 6 },
            at: { x: 0, y: 0 },
            attacks: [HEAVY],
          }),
          unit({ id: 'e', side: 'enemy', at: { x: 5, y: 5 } }),
        ],
      }),
    ).state;
    expect(unlockedAttacks(requireUnit(s, 'a')).map((x) => x.id)).toEqual(['basic', 'thrust']);
    s = { ...s, units: s.units.map((u) => (u.id === 'a' ? { ...u, statPoints: 1 } : u)) };
    s = applyCommand(s, { type: 'raiseStat', unitId: 'a', stat: 'str' }).state;
    expect(unlockedAttacks(requireUnit(s, 'a')).map((x) => x.id)).toEqual([
      'basic',
      'thrust',
      'heavy',
    ]);
  });
});

describe('attacks', () => {
  it('rejects locked or unknown attacks', () => {
    const s = createBattle(
      setup({
        map: makeMap(['pppp', 'pppp']),
        units: [
          unit({
            id: 'a',
            stats: { str: 6, skl: 6, agi: 30 },
            at: { x: 1, y: 0 },
            attacks: [HEAVY],
          }),
          unit({ id: 'e', side: 'enemy', at: { x: 1, y: 1 } }),
        ],
      }),
    ).state;
    expect(() =>
      applyCommand(s, {
        type: 'attack',
        unitId: 'a',
        targetId: 'e',
        reaction: 'defend',
        attackId: 'heavy',
      }),
    ).toThrow(/not unlocked/);
    expect(() =>
      applyCommand(s, {
        type: 'attack',
        unitId: 'a',
        targetId: 'e',
        reaction: 'defend',
        attackId: 'nope',
      }),
    ).toThrow(/Unknown attack/);
  });

  it('twin attacks strike twice, each rolling separately', () => {
    const { events } = applyCommand(duel(), {
      type: 'attack',
      unitId: 'a',
      targetId: 'e',
      reaction: 'defend',
      attackId: 'twin',
    });
    const ev = events[0];
    expect(ev?.type === 'attackResolved' && ev.strikes.length).toBe(2);
  });

  it('applies pierce, fatigue, AP damage and blocks counters', () => {
    const s = { ...duel(), units: duel().units.map((u) => (u.id === 'e' ? { ...u, ap: 60 } : u)) };
    const a = requireUnit(s, 'a');
    const e = requireUnit(s, 'e');
    const heavy = a.attacks.find((x) => x.id === 'heavy')!;
    const basic = forecastAttack(s, a, e);
    const f = forecastAttack(s, a, e, a.pos, heavy);
    expect(basic.reactions).toContain('attackBack');
    expect(f.reactions).not.toContain('attackBack');
    expect(f.reactions).not.toContain('counter');
    // (24 + 8) × 1.5 = 48, armour 8 halved to 4 → 44
    expect(f.damage.avoid).toBe(44);
    const { state } = applyCommand(s, {
      type: 'attack',
      unitId: 'a',
      targetId: 'e',
      reaction: 'defend',
      attackId: 'heavy',
    });
    // 30 FP to defend plus 20 fatigue from the technique; AP damage 15.
    expect(requireUnit(state, 'e')).toMatchObject({ fp: 50, ap: 45 });
    // Attacking costs the technique's AP from a full 100, and only its own FP.
    expect(requireUnit(state, 'a')).toMatchObject({ ap: 100 - 35, fp: 20 });
  });
});

describe('save migration', () => {
  it('upgrades a version 1 battle save', () => {
    const v2 = duel();
    const v1 = {
      ...v2,
      saveVersion: 1,
      units: v2.units.map(
        ({ attacks: _a, statPoints: _s, frameAgility: _f, frameClass: _c, ...rest }) => ({
          ...rest,
          weapon: { ...rest.weapon, type: undefined },
          xp: 250,
        }),
      ),
    };
    const loaded = deserializeBattle(JSON.stringify(v1));
    expect(loaded.saveVersion).toBe(SAVE_VERSION);
    const a = requireUnit(loaded, 'a');
    expect(a.attacks.map((x) => x.id)).toEqual(['basic', 'thrust']);
    expect(a.weapon.type).toBe('blade');
    expect(a.xp).toBeLessThan(100);
  });
});
