import { describe, expect, it } from 'vitest';
import type { Attack, BattleState } from '../src';
import {
  applyCommand,
  createBattle,
  deserializeBattle,
  OutdatedSaveError,
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
  requires: { agl: 10 },
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
  requires: { pow: 8 },
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
          stats: { pow: 8, dex: 30, agl: 20 },
          at: { x: 1, y: 0 },
          facing: 'south',
          attacks: [TWIN, HEAVY],
        }),
        unit({
          id: 'e',
          side: 'enemy',
          level: targetLevel,
          stats: { pow: 6, dex: 6, agl: 0 },
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
  it('rises with the share of max HP dealt, and a defeating blow is worth much more', () => {
    const s = duel();
    const a = requireUnit(s, 'a');
    const e = requireUnit(s, 'e');
    const small = xpFor(s, a, e, 8, 'front', false);
    const big = xpFor(s, a, e, 40, 'front', false);
    // 30 + 100 × 8/80 = 40; 30 + 100 × 40/80 = 80: more damage, slightly more XP
    expect(small).toBe(40);
    expect(big).toBe(80);
    expect(xpFor(s, a, e, 8, 'front', true)).toBe(40 + 150);
  });

  it('is worth most head-on, less from the side and least from behind', () => {
    const s = duel();
    const a = requireUnit(s, 'a');
    const e = requireUnit(s, 'e');
    expect(xpFor(s, a, e, 8, 'side', false)).toBe(32);
    expect(xpFor(s, a, e, 8, 'rear', false)).toBe(20);
  });

  it('drops against weaker enemies and rises against stronger ones', () => {
    const even = duel(5, 5);
    const bully = duel(9, 3);
    const brave = duel(3, 7);
    const hit = (s: BattleState) =>
      xpFor(s, requireUnit(s, 'a'), requireUnit(s, 'e'), 10, 'front', false);
    expect(hit(bully)).toBeLessThan(hit(even));
    expect(hit(brave)).toBeGreaterThan(hit(even));
    expect(hit(duel(30, 1))).toBeGreaterThanOrEqual(1);
  });

  it('is earned only when a hit lands, and reported on the strike', () => {
    const { state, events } = applyCommand(duel(), {
      type: 'attack',
      unitId: 'a',
      targetId: 'e',
      reaction: 'defend',
    });
    const ev = events[0];
    if (ev?.type !== 'attackResolved') throw new Error('no attack');
    const strike = ev.strikes[0]!;
    expect(strike.hit).toBe(true);
    expect(strike.xp).toBeGreaterThan(30);
    expect(requireUnit(state, 'a').xp).toBe(strike.xp);
  });

  it('levels up every 500 XP, carrying the remainder, with HP and 3 stat points', () => {
    let s = duel(1, 1, 1);
    s = { ...s, units: s.units.map((u) => (u.id === 'a' ? { ...u, xp: 490 } : u)) };
    const before = requireUnit(s, 'a');
    const { state, events } = applyCommand(s, {
      type: 'attack',
      unitId: 'a',
      targetId: 'e',
      reaction: 'defend',
    });
    const a = requireUnit(state, 'a');
    const ev = events[0];
    const gained = ev?.type === 'attackResolved' ? ev.strikes[0]!.xp : 0;
    expect(a.level).toBe(2);
    expect(a.xp).toBe(490 + gained - 500);
    expect(a.maxHp).toBe(before.maxHp + state.balance.hpPerLevel);
    expect(a.statPoints).toBe(3);
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
    s = applyCommand(s, { type: 'raiseStat', unitId: 'a', stat: 'pow' }).state;
    s = applyCommand(s, { type: 'raiseStat', unitId: 'a', stat: 'agl' }).state;
    const a = requireUnit(s, 'a');
    expect(a).toMatchObject({ pow: 9, statPoints: 0 });
    expect(() => applyCommand(s, { type: 'raiseStat', unitId: 'a', stat: 'dex' })).toThrow(
      /no stat points/,
    );
  });

  it('can unlock an attack mid-battle', () => {
    let s = createBattle(
      setup({
        units: [
          unit({
            id: 'a',
            stats: { pow: 7, dex: 6, agl: 6 },
            at: { x: 0, y: 0 },
            attacks: [HEAVY],
          }),
          unit({ id: 'e', side: 'enemy', at: { x: 5, y: 5 } }),
        ],
      }),
    ).state;
    expect(unlockedAttacks(requireUnit(s, 'a')).map((x) => x.id)).toEqual(['basic', 'thrust']);
    s = { ...s, units: s.units.map((u) => (u.id === 'a' ? { ...u, statPoints: 1 } : u)) };
    s = applyCommand(s, { type: 'raiseStat', unitId: 'a', stat: 'pow' }).state;
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
            stats: { pow: 6, dex: 6, agl: 30 },
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
    // (POW 8 + WEP 9) × 2 × 1.5 = 51 (the target has no DEF to pierce)
    expect(f.damage.avoid).toBe(51);
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

describe('save compatibility', () => {
  it('refuses battle saves from before the six-attribute rules, so the battle restarts', () => {
    const old = { ...duel(), saveVersion: 6 };
    expect(() => deserializeBattle(JSON.stringify(old))).toThrow(OutdatedSaveError);
  });

  it('round-trips a current save', () => {
    const s = duel();
    expect(deserializeBattle(JSON.stringify(s))).toEqual(JSON.parse(JSON.stringify(s)));
    expect(s.saveVersion).toBe(SAVE_VERSION);
  });
});
