import { describe, expect, it } from 'vitest';
import type { BattleState, Facing, PilotStats, Reaction } from '../src';
import {
  applyCommand,
  attackFpCost,
  availableReactions,
  counterChance,
  createBattle,
  deserializeBattle,
  forecastAttack,
  fpCostFor,
  REACTIONS,
  reactionChoices,
  requireUnit,
  resisted,
  SAVE_VERSION,
} from '../src';
import { makeMap, setup, unit } from './fixtures';

/** Attacker at (2,1) strikes a target at (2,2) facing the given way. */
function duel(
  targetFacing: Facing,
  over: { a?: Partial<PilotStats>; t?: Partial<PilotStats> } = {},
  seed = 1565,
): BattleState {
  const s = createBattle(
    setup({
      seed,
      map: makeMap(['ppppp', 'ppppp', 'ppppp', 'ppppp']),
      units: [
        unit({
          id: 'a',
          controller: 'human',
          stats: { agi: 40, ...over.a },
          at: { x: 2, y: 1 },
          facing: 'south',
        }),
        unit({
          id: 't',
          side: 'enemy',
          stats: { agi: 0, ...over.t },
          at: { x: 2, y: 2 },
          facing: targetFacing,
        }),
      ],
    }),
  ).state;
  return { ...s, units: s.units.map((u) => (u.id === 't' ? { ...u, ap: 60 } : u)) };
}

const reactions = (s: BattleState) =>
  availableReactions(s, requireUnit(s, 't'), requireUnit(s, 'a'));

describe('facing rules', () => {
  it('head-on: defend, avoid, attack back, counter, or do nothing', () => {
    expect(reactions(duel('north'))).toEqual(['defend', 'avoid', 'attackBack', 'counter', 'none']);
  });

  it('from the side: no counter', () => {
    expect(reactions(duel('east'))).toEqual(['defend', 'avoid', 'attackBack', 'none']);
  });

  it('from behind: avoid or do nothing', () => {
    expect(reactions(duel('south'))).toEqual(['avoid', 'none']);
  });

  it('lists every reaction with the reason it is unavailable', () => {
    const s = duel('south');
    const choices = reactionChoices(s, requireUnit(s, 't'), requireUnit(s, 'a'));
    expect(choices.map((c) => c.reaction)).toEqual(REACTIONS);
    expect(choices.find((c) => c.reaction === 'defend')).toMatchObject({
      available: false,
      reason: "Can't defend from behind",
    });
  });

  it('reacting needs no AP, but a Spent unit (FP full) can only do nothing', () => {
    const base = duel('north');
    const broke = { ...base, units: base.units.map((u) => (u.id === 't' ? { ...u, ap: 0 } : u)) };
    expect(reactions(broke)).toEqual(['defend', 'avoid', 'attackBack', 'counter', 'none']);
    const spent = { ...base, units: base.units.map((u) => (u.id === 't' ? { ...u, fp: 100 } : u)) };
    expect(reactions(spent)).toEqual(['none']);
  });
});

describe('reaction and attack costs', () => {
  const fpAfter = (reaction: Reaction) => {
    const s = duel('north');
    const { state } = applyCommand(s, { type: 'attack', unitId: 'a', targetId: 't', reaction });
    const t = requireUnit(state, 't');
    return { fp: t.fp, ap: t.ap, attacker: requireUnit(state, 'a') };
  };

  it('defend costs 30 FP, avoid and counter 20, doing nothing 0, and none cost AP', () => {
    // Fixture pilots have SPI 0, so costs are exact.
    expect(fpAfter('defend')).toMatchObject({ fp: 30, ap: 60 });
    expect(fpAfter('avoid')).toMatchObject({ fp: 20, ap: 60 });
    expect(fpAfter('counter')).toMatchObject({ fp: 20, ap: 60 });
    expect(fpAfter('none')).toMatchObject({ fp: 0, ap: 60 });
  });

  it('attack back costs the attack FP plus the surcharge, and no AP', () => {
    const s = duel('north');
    const t = requireUnit(s, 't');
    const r = fpAfter('attackBack');
    expect(r.ap).toBe(60);
    expect(r.fp).toBeGreaterThanOrEqual(attackFpCost(s, t, t.attacks[0]!));
  });

  it('every attack adds 20 FP on top of the technique cost', () => {
    const s = duel('north');
    const a = requireUnit(s, 'a');
    const attack = a.attacks[0]!;
    expect(attackFpCost(s, a, attack)).toBe(attack.fpCost + 20);
    expect(fpAfter('none').attacker.fp).toBe(attack.fpCost + 20);
  });
});

describe('counter', () => {
  it('odds rise with INT advantage within 5–35%', () => {
    const odds = (a: number, t: number) => {
      const s = duel('north', { a: { int: a }, t: { int: t } });
      return counterChance(s, requireUnit(s, 't'), requireUnit(s, 'a'));
    };
    expect(odds(5, 5)).toBe(10);
    expect(odds(5, 10)).toBe(20);
    expect(odds(0, 40)).toBe(35);
    expect(odds(40, 0)).toBe(5);
  });

  it('on success, reflects 1.25× the blow onto the attacker and the defender is unharmed', () => {
    // Search seeds for a success (10% odds) to keep the test independent of RNG order.
    for (let seed = 1; seed < 400; seed++) {
      const s = duel('north', {}, seed);
      const { state, events } = applyCommand(s, {
        type: 'attack',
        unitId: 'a',
        targetId: 't',
        reaction: 'counter',
      });
      const ev = events.find((e) => e.type === 'attackResolved');
      if (ev?.type !== 'attackResolved' || !ev.counter?.success) continue;
      const f = forecastAttack(s, requireUnit(s, 'a'), requireUnit(s, 't'));
      expect(requireUnit(state, 't').hp).toBe(requireUnit(s, 't').hp);
      expect(ev.retaliation?.damage).toBe(f.counter!.reflect);
      expect(requireUnit(state, 'a').hp).toBe(requireUnit(s, 'a').hp - f.counter!.reflect);
      return;
    }
    throw new Error('no successful counter in 400 seeds');
  });

  it('on failure, the defender takes the blow at 1.25×', () => {
    for (let seed = 1; seed < 50; seed++) {
      const s = duel('north', {}, seed);
      const { state, events } = applyCommand(s, {
        type: 'attack',
        unitId: 'a',
        targetId: 't',
        reaction: 'counter',
      });
      const ev = events.find((e) => e.type === 'attackResolved');
      if (ev?.type !== 'attackResolved' || ev.counter?.success) continue;
      const f = forecastAttack(s, requireUnit(s, 'a'), requireUnit(s, 't'));
      expect(ev.strikes[0]).toMatchObject({ hit: true, damage: f.damage.counter });
      expect(f.damage.counter).toBeGreaterThan(f.damage.avoid);
      expect(requireUnit(state, 't').hp).toBe(requireUnit(s, 't').hp - f.damage.counter);
      return;
    }
    throw new Error('no failed counter in 50 seeds');
  });
});

describe('new stats', () => {
  it('DEF blocks 1.5 damage per point', () => {
    const plain = duel('north');
    const tough = duel('north', { t: { def: 4 } });
    const dmg = (s: BattleState) =>
      forecastAttack(s, requireUnit(s, 'a'), requireUnit(s, 't')).damage.avoid;
    expect(dmg(plain) - dmg(tough)).toBe(6);
  });

  it('VIT adds 5% of base HP per point, and raising it mid-battle heals by the difference', () => {
    const s = duel('north', { a: { vit: 4 } });
    const a = requireUnit(s, 'a');
    expect(a.maxHp).toBe(Math.round(80 * 1.2));
    const withPoint = {
      ...s,
      units: s.units.map((u) => (u.id === 'a' ? { ...u, statPoints: 1, hp: 50 } : u)),
    };
    const after = requireUnit(
      applyCommand(withPoint, { type: 'raiseStat', unitId: 'a', stat: 'vit' }).state,
      'a',
    );
    expect(after.maxHp).toBe(Math.round(80 * 1.25));
    expect(after.hp).toBe(50 + (after.maxHp - a.maxHp));
  });

  it('INT sharpens techniques but not basic attacks', () => {
    // The target's AGI keeps both chances under the 95% cap so the full difference shows.
    const s = duel('north', { a: { int: 10, str: 20 }, t: { agi: 20 } });
    const TECH = {
      id: 'tech',
      name: 'Tech',
      style: 'slash' as const,
      power: 1,
      accuracy: 0,
      apCost: 25,
      fpCost: 10,
      requires: {},
    };
    const a = { ...requireUnit(s, 'a'), attacks: [...requireUnit(s, 'a').attacks, TECH] };
    const t = requireUnit(s, 't');
    const basic = forecastAttack(s, a, t, a.pos, a.attacks[0]);
    const tech = forecastAttack(s, a, t, a.pos, TECH);
    expect(tech.hitChance.avoid - basic.hitChance.avoid).toBe(10);
  });

  it('SPI trims FP costs, resists fatigue effects and speeds recovery', () => {
    const s = duel('north', { t: { spi: 10 } });
    const t = requireUnit(s, 't');
    expect(fpCostFor(s, t, 20)).toBe(16);
    expect(resisted(s, t, 20)).toBe(14);
    const plain = requireUnit(duel('north'), 't');
    expect(fpCostFor(s, plain, 20)).toBe(20);
  });
});

describe('save migration v3 → v4', () => {
  it('replaces AP-based reaction costs with the FP costs', () => {
    const now = duel('north');
    const oldBalance: Record<string, unknown> = {
      ...now.balance,
      avoidApCost: 10,
      avoidFpCost: 10,
    };
    for (const k of ['defendFpCost', 'counterFpCost', 'attackFpSurcharge']) delete oldBalance[k];
    const v3 = { ...now, saveVersion: 3, balance: oldBalance };
    const loaded = deserializeBattle(JSON.stringify(v3));
    expect(loaded.saveVersion).toBe(SAVE_VERSION);
    expect(loaded.balance).toMatchObject({
      defendFpCost: 30,
      avoidFpCost: 20,
      counterFpCost: 20,
      attackFpSurcharge: 20,
    });
    expect('avoidApCost' in loaded.balance).toBe(false);
  });
});
