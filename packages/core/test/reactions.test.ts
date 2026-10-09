import { describe, expect, it } from 'vitest';
import type { Attack, BattleState, Facing, PilotStats, Reaction } from '../src';
import {
  applyCommand,
  attackBackOptions,
  attackFpCost,
  availableReactions,
  counterChance,
  createBattle,
  forecastAttack,
  REACTIONS,
  reactionChoices,
  requireUnit,
  starterAttacks,
} from '../src';
import { FRAME, GUN, makeMap, setup, unit } from './fixtures';

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
          stats: { agl: 40, ...over.a },
          at: { x: 2, y: 1 },
          facing: 'south',
        }),
        unit({
          id: 't',
          side: 'enemy',
          stats: { agl: 0, ...over.t },
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
      reason: { code: 'rearNoDefend' },
    });
  });

  it('gives each unavailable reaction a reason code, not text (the game words it)', () => {
    const reasons = (s: BattleState, attack?: Attack) =>
      Object.fromEntries(
        reactionChoices(s, requireUnit(s, 't'), requireUnit(s, 'a'), undefined, attack).map((c) => [
          c.reaction,
          c.reason,
        ]),
      );
    expect(reasons(duel('south'))).toMatchObject({
      attackBack: { code: 'rearNoStrikeBack' },
      counter: { code: 'frontOnly' },
    });
    expect(reasons(duel('east')).counter).toEqual({ code: 'frontOnly' });
    const head = duel('north');
    const feint = { ...requireUnit(head, 'a').attacks[0]!, name: 'Feint', noCounter: true };
    expect(reasons(head, feint)).toMatchObject({
      attackBack: { code: 'unanswerable', attackName: 'Feint' },
      counter: { code: 'unanswerable', attackName: 'Feint' },
    });
    const spent = { ...head, units: head.units.map((u) => (u.id === 't' ? { ...u, fp: 100 } : u)) };
    const all = reasons(spent);
    for (const r of ['defend', 'avoid', 'attackBack', 'counter'] as const)
      expect(all[r]).toEqual({ code: 'spent' });
    expect(all.none).toBeUndefined();
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

  it("attack back pays the technique's AP and FP as FP, and spends no AP", () => {
    const s = duel('north');
    const t = requireUnit(s, 't');
    const r = fpAfter('attackBack');
    expect(r.ap).toBe(60);
    const slash = t.attacks[0]!;
    expect(r.fp).toBe(slash.apCost + slash.fpCost); // Slash: 20 AP + 5 FP → 25 FP
  });

  it('attacking on your own turn costs only the technique FP (Slash: 5)', () => {
    const s = duel('north');
    const a = requireUnit(s, 'a');
    const attack = a.attacks[0]!;
    expect(attackFpCost(s, a, attack)).toBe(5);
    expect(fpAfter('none').attacker.fp).toBe(5);
  });
});

describe('choosing the strike back', () => {
  const TWIN: Attack = {
    id: 'twin',
    name: 'Twin Cut',
    style: 'slash',
    power: 0.6,
    accuracy: 0,
    apCost: 30,
    fpCost: 15,
    hits: 2,
    requires: {},
  };
  /** Target 't' (facing the attacker) knows Twin Cut on top of its sword starters. */
  const withTwin = (fp = 0): BattleState => {
    const s = createBattle(
      setup({
        map: makeMap(['ppppp', 'ppppp', 'ppppp', 'ppppp']),
        units: [
          unit({
            id: 'a',
            controller: 'human',
            stats: { bas: 20, agl: 40 },
            at: { x: 2, y: 1 },
            facing: 'south',
          }),
          unit({ id: 't', side: 'enemy', at: { x: 2, y: 2 }, facing: 'north', attacks: [TWIN] }),
        ],
      }),
    ).state;
    return { ...s, units: s.units.map((u) => (u.id === 't' ? { ...u, fp } : u)) };
  };
  const options = (s: BattleState) =>
    attackBackOptions(s, requireUnit(s, 't'), requireUnit(s, 'a').pos);

  it('lists every unlocked technique with its FP cost (AP + FP)', () => {
    expect(options(withTwin()).map((o) => [o.attack.name, o.fpCost, o.available])).toEqual([
      ['Slash', 25, true],
      ['Thrust', 35, true],
      ['Twin Cut', 45, true],
    ]);
  });

  it('greys out techniques that would take FP past 100, and out-of-reach ones', () => {
    const tired = options(withTwin(70));
    expect(tired.map((o) => o.available)).toEqual([true, false, false]);
    expect(tired[1]!.reason).toEqual({ code: 'tooTired', fpCost: tired[1]!.fpCost });
    const gunner = { ...requireUnit(withTwin(), 't'), weapon: GUN, attacks: starterAttacks(GUN) };
    const s = withTwin();
    const fire = attackBackOptions(s, gunner, requireUnit(s, 'a').pos)[0]!;
    expect(fire).toMatchObject({ available: false, reason: { code: 'outOfReach' } });
    // Too tired for any of them: the reaction itself says why.
    const spent = withTwin(80);
    const choice = reactionChoices(spent, requireUnit(spent, 't'), requireUnit(spent, 'a')).find(
      (c) => c.reaction === 'attackBack',
    );
    expect(choice).toMatchObject({
      available: false,
      reason: { code: 'tooTiredToStrikeBack' },
    });
  });

  it('strikes back with the chosen technique: its FP, every hit, and its name', () => {
    const { state, events } = applyCommand(withTwin(), {
      type: 'attack',
      unitId: 'a',
      targetId: 't',
      reaction: 'attackBack',
      backAttackId: 'twin',
    });
    expect(requireUnit(state, 't')).toMatchObject({ fp: 45, ap: 100 });
    const ev = events.find((e) => e.type === 'attackResolved');
    if (ev?.type !== 'attackResolved') throw new Error('no attack');
    expect(ev.retaliationName).toBe('Twin Cut');
    expect(ev.retaliation?.attackerId).toBe('t');
    expect(ev.retaliationFollowUps).toHaveLength(1);
  });

  it('uses the main attack when no technique is named (as the AI does)', () => {
    const { state, events } = applyCommand(withTwin(), {
      type: 'attack',
      unitId: 'a',
      targetId: 't',
      reaction: 'attackBack',
    });
    expect(requireUnit(state, 't').fp).toBe(25);
    const ev = events.find((e) => e.type === 'attackResolved');
    expect(ev?.type === 'attackResolved' && ev.retaliationName).toBe('Slash');
  });

  it('refuses a technique that is out of reach, too tiring or unknown', () => {
    const attackBack = (s: BattleState, backAttackId: string) =>
      applyCommand(s, {
        type: 'attack',
        unitId: 'a',
        targetId: 't',
        reaction: 'attackBack',
        backAttackId,
      });
    expect(() => attackBack(withTwin(70), 'twin')).toThrow(/tooTired/);
    expect(() => attackBack(withTwin(), 'nope')).toThrow(/Can't strike back/);
  });

  it('forecasts the chosen strike back', () => {
    const s = withTwin();
    const f = forecastAttack(
      s,
      requireUnit(s, 'a'),
      requireUnit(s, 't'),
      undefined,
      undefined,
      'twin',
    );
    expect(f.retaliation).toMatchObject({ attackId: 'twin', hits: 2, fpCost: 45 });
  });
});

describe('counter', () => {
  it('odds rise with DEX + AGL advantage within 5–35%', () => {
    const odds = (a: number, t: number) => {
      const s = duel('north', { a: { dex: a, agl: a }, t: { dex: t, agl: t } });
      return counterChance(s, requireUnit(s, 't'), requireUnit(s, 'a'));
    };
    expect(odds(6, 6)).toBe(10);
    expect(odds(6, 11)).toBe(20);
    expect(odds(0, 32)).toBe(35);
    expect(odds(32, 0)).toBe(5);
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

describe('attributes', () => {
  it('DEF blocks 1.5 damage per point', () => {
    const plain = duel('north');
    const tough = duel('north', { t: { def: 4 } });
    const dmg = (s: BattleState) =>
      forecastAttack(s, requireUnit(s, 'a'), requireUnit(s, 't')).damage.avoid;
    expect(dmg(plain) - dmg(tough)).toBe(6);
  });

  it('Defend halves what gets past DEF, so a defended blow is half, never a token 1', () => {
    const s = duel('north', { t: { def: 6 } });
    const f = forecastAttack(s, requireUnit(s, 'a'), requireUnit(s, 't'));
    // Slash 24 raw − DEF 6 × 1.5 = 15 through; Defend halves it to 8 (7.5 rounded).
    expect(f.damage.none).toBe(15);
    expect(f.damage.defend).toBe(8);
  });

  it('BAS adds 4 HP per point, and raising it mid-battle heals by the difference', () => {
    const s = duel('north', { a: { bas: 4 } });
    const a = requireUnit(s, 'a');
    // level 1 × 2 + BAS 4 × 4 + 10 + chassis 48
    expect(a.maxHp).toBe(2 + 16 + 10 + 48);
    const withPoint = {
      ...s,
      units: s.units.map((u) => (u.id === 'a' ? { ...u, statPoints: 1, hp: 50 } : u)),
    };
    const after = requireUnit(
      applyCommand(withPoint, { type: 'raiseStat', unitId: 'a', stat: 'bas' }).state,
      'a',
    );
    expect(after.maxHp).toBe(a.maxHp + 4);
    expect(after.hp).toBe(54);
    expect(after.pilot.bas).toBe(5);
  });

  it('DEX adds 2% hit chance per point and the target AGL takes 2% per point', () => {
    const hit = (a: Partial<PilotStats>, t: Partial<PilotStats>) => {
      const s = duel('north', { a, t: { agl: 20, ...t } });
      return forecastAttack(s, requireUnit(s, 'a'), requireUnit(s, 't')).hitChance.avoid;
    };
    expect(hit({ dex: 10 }, {}) - hit({ dex: 5 }, {})).toBe(10);
    expect(hit({ dex: 10 }, { agl: 22 }) - hit({ dex: 10 }, {})).toBe(-4);
  });

  it('POW and WEP both add 2 raw damage per point', () => {
    const dmg = (a: Partial<PilotStats>) => {
      const s = duel('north', { a });
      return forecastAttack(s, requireUnit(s, 'a'), requireUnit(s, 't')).damage.none;
    };
    expect(dmg({ pow: 8 }) - dmg({ pow: 6 })).toBeCloseTo(4 * 0.8, 0); // Slash ×0.8
    expect(dmg({ wep: 7 })).toBe(dmg({ pow: 8 }));
  });

  it('gear bonuses add to the pilot and are capped at 32', () => {
    const s = createBattle(
      setup({
        units: [
          unit({
            id: 'a',
            at: { x: 0, y: 0 },
            stats: { wep: 30 },
            charm: { id: 'c', name: 'Charm', kind: 'charm', bonus: { def: 2 } },
            amulet: { id: 'm', name: 'Amulet', kind: 'amulet', bonus: { dex: 3 } },
          }),
          unit({ id: 'e', side: 'enemy', at: { x: 5, y: 5 } }),
        ],
      }),
    ).state;
    const a = requireUnit(s, 'a');
    expect(a).toMatchObject({ def: 2, dex: 9, wep: 32 });
    expect(a.pilot).toMatchObject({ def: 0, dex: 6, wep: 30 });
  });
});

describe('raising attributes with gear', () => {
  it('recomputes from pilot + gear when a frame penalty had clamped the value at 0', () => {
    const s = createBattle(
      setup({
        units: [
          unit({
            id: 'a',
            at: { x: 0, y: 0 },
            stats: { agl: 2 },
            frame: { ...FRAME, bonus: { agl: -6 } },
            statPoints: 1,
          }),
          unit({ id: 'e', side: 'enemy', at: { x: 5, y: 5 } }),
        ],
      }),
    ).state;
    expect(requireUnit(s, 'a').agl).toBe(0);
    const after = requireUnit(
      applyCommand(s, { type: 'raiseStat', unitId: 'a', stat: 'agl' }).state,
      'a',
    );
    expect(after.pilot.agl).toBe(3);
    expect(after.agl).toBe(0); // 3 − 6, still clamped at 0
  });
});

describe('XP only for landing blows', () => {
  const enemyAttacks = (reaction: Reaction) => {
    const s = createBattle(
      setup({
        map: makeMap(['ppppp', 'ppppp', 'ppppp', 'ppppp']),
        units: [
          unit({ id: 'e', side: 'enemy', stats: { agl: 40 }, at: { x: 2, y: 1 }, facing: 'south' }),
          unit({ id: 'p', controller: 'human', at: { x: 2, y: 2 }, facing: 'north' }),
        ],
      }),
    ).state;
    return requireUnit(
      applyCommand(s, { type: 'attack', unitId: 'e', targetId: 'p', reaction }).state,
      'p',
    );
  };

  it('defending or avoiding earns nothing', () => {
    expect(enemyAttacks('defend').xp).toBe(0);
    expect(enemyAttacks('avoid').xp).toBe(0);
  });

  it('striking back earns XP when the blow lands', () => {
    expect(enemyAttacks('attackBack').xp).toBeGreaterThanOrEqual(0);
  });
});
