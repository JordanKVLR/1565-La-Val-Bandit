import { describe, expect, it } from 'vitest';
import type { BattleState, Skill, SkillContext, SkillEffect, UnitSpec } from '../src';
import {
  activeSkills,
  applyCommand,
  attackBackOptions,
  attackFpCost,
  auraFor,
  conditionMet,
  counterChance,
  createBattle,
  deserializeBattle,
  findAttack,
  forecastAttack,
  reactionChoices,
  requireUnit,
  SAVE_VERSION,
  skillsUnlockedAt,
  xpFor,
} from '../src';
import { GUN, makeMap, setup, unit } from './fixtures';

let n = 0;
function skill(effect: SkillEffect, level = 1): Skill {
  n += 1;
  return { id: `s${n}`, name: `Skill ${n}`, level, effect };
}

/**
 * Attacker `a` at (2,0) facing south, target `t` at (2,1) facing north (head-on), on flat plain.
 * Default numbers (TEST_BALANCE): avoid 75%, none 90%, raw damage 30, Defend 15.
 */
function duel(
  opts: {
    a?: Partial<UnitSpec>;
    t?: Partial<UnitSpec>;
    extra?: UnitSpec[];
    heights?: string[];
  } = {},
): { state: BattleState } {
  const map = makeMap(['ppppp', 'ppppp', 'ppppp', 'ppppp'], opts.heights);
  return createBattle(
    setup({
      map,
      units: [
        unit({ id: 'a', at: { x: 2, y: 0 }, facing: 'south', stats: { agl: 20 }, ...opts.a }),
        unit({ id: 't', side: 'enemy', at: { x: 2, y: 1 }, ...opts.t }),
        ...(opts.extra ?? []),
      ],
    }),
  );
}

function forecast(state: BattleState, from?: { x: number; y: number }) {
  const a = requireUnit(state, 'a');
  return forecastAttack(state, a, requireUnit(state, 't'), from ?? a.pos, findAttack(a, 'thrust'));
}

const withHp = (s: BattleState, id: string, hp: number): BattleState => ({
  ...s,
  units: s.units.map((u) => (u.id === id ? { ...u, hp } : u)),
});

describe('skill levels', () => {
  it('only skills at or below the pilot level are active', () => {
    const early = skill({ type: 'xpBonus', percent: 10 }, 1);
    const late = skill({ type: 'xpBonus', percent: 10 }, 5);
    const u = { skills: [early, late], level: 4 };
    expect(activeSkills(u)).toEqual([early]);
    expect(activeSkills({ ...u, level: 5 })).toEqual([early, late]);
    expect(skillsUnlockedAt(u, 5)).toEqual([late]);
    expect(activeSkills({ level: 3 } as never)).toEqual([]);
  });

  it('carry from the spec into unit state', () => {
    const s = skill({ type: 'regen', hp: 3 });
    const { state } = duel({ a: { skills: [s] } });
    expect(requireUnit(state, 'a').skills).toEqual([s]);
    expect(requireUnit(state, 't').skills).toEqual([]);
  });
});

describe('skill conditions', () => {
  const base: SkillContext = {
    self: { hp: 80, maxHp: 80 },
    foe: { hp: 80, maxHp: 80, frameClass: 'medium' },
    heightDiff: 0,
    distance: 1,
    flank: false,
  };
  it.each([
    ['always', base, true],
    [undefined, base, true],
    ['higher', base, false],
    ['higher', { ...base, heightDiff: 1 }, true],
    ['flank', base, false],
    ['flank', { ...base, flank: true }, true],
    ['melee', base, true],
    ['ranged', base, false],
    ['ranged', { ...base, distance: 3 }, true],
    ['foeHeavy', { ...base, foe: { ...base.foe, frameClass: 'heavy' } }, true],
    ['foeLight', base, false],
    ['foeLight', { ...base, foe: { ...base.foe, frameClass: 'light' } }, true],
    ['foeWounded', { ...base, foe: { ...base.foe, hp: 40 } }, true],
    ['foeWounded', { ...base, foe: { ...base.foe, hp: 41 } }, false],
    ['selfWounded', { ...base, self: { hp: 10, maxHp: 80 } }, true],
    ['selfWounded', base, false],
  ] as const)('%s → %s', (when, ctx, expected) => {
    expect(conditionMet(when, ctx as SkillContext)).toBe(expected);
  });
});

describe('strike skills (forecast and resolution agree)', () => {
  it('hitBonus adds accuracy, only when its condition holds', () => {
    const always = duel({ a: { skills: [skill({ type: 'hitBonus', amount: 10 })] } });
    expect(forecast(always.state).hitChance.avoid).toBe(85);
    const flank = duel({
      a: { skills: [skill({ type: 'hitBonus', amount: 10, when: 'flank' })] },
    });
    expect(forecast(flank.state).hitChance.avoid).toBe(75);
    // From the side: +10 for the side, +10 more from the skill.
    expect(forecast(flank.state, { x: 3, y: 1 }).hitChance.avoid).toBe(95);
  });

  it('damageBonus raises raw damage before DEF', () => {
    const { state } = duel({
      a: { skills: [skill({ type: 'damageBonus', percent: 20 })] },
      t: { stats: { def: 4 } },
    });
    // (30 × 1.2) − 4 × 1.5 = 30 (vs 24 without the skill).
    expect(forecast(state).damage.none).toBe(30);
    const { state: after, events } = applyCommand(state, {
      type: 'attack',
      unitId: 'a',
      targetId: 't',
      attackId: 'thrust',
      reaction: 'defend',
    });
    const ev = events[0];
    if (ev?.type !== 'attackResolved') throw new Error('no attack');
    expect(ev.strikes[0]!.damage).toBe(forecast(state).damage.defend);
    expect(requireUnit(after, 't').hp).toBe(requireUnit(state, 't').hp - 15);
  });

  it('higher-ground damage needs the height', () => {
    const s = [skill({ type: 'damageBonus', percent: 10, when: 'higher' })];
    expect(forecast(duel({ a: { skills: s } }).state).damage.none).toBe(30);
    const high = duel({ a: { skills: s }, heights: ['00100', '00000', '00000', '00000'] });
    // Height ×1.1 and the skill ×1.1: 30 × 1.21 = 36.3.
    expect(forecast(high.state).damage.none).toBe(36);
  });

  it('evadeBonus makes the owner harder to hit, by condition', () => {
    const always = duel({ t: { skills: [skill({ type: 'evadeBonus', amount: 10 })] } });
    expect(forecast(always.state).hitChance.avoid).toBe(65);
    const ranged = duel({
      t: { skills: [skill({ type: 'evadeBonus', amount: 10, when: 'ranged' })] },
    });
    expect(forecast(ranged.state).hitChance.avoid).toBe(75);
    // A defender standing higher counts as "higher" from its own side.
    const high = duel({
      t: { skills: [skill({ type: 'evadeBonus', amount: 10, when: 'higher' })] },
      heights: ['00000', '00100', '00000', '00000'],
    });
    expect(forecast(high.state).hitChance.avoid).toBe(75 - 5 - 10);
  });

  it('damageReduction cuts what gets through, here only while wounded', () => {
    const s = [skill({ type: 'damageReduction', percent: 50, when: 'selfWounded' })];
    const fresh = duel({ t: { skills: s } }).state;
    expect(forecast(fresh).damage.none).toBe(30);
    const hurt = withHp(fresh, 't', 40);
    expect(forecast(hurt).damage.none).toBe(15);
    expect(forecast(hurt).damage.defend).toBe(8); // 30 × 0.5 × 0.5 = 7.5
  });

  it('damageReduction never goes past 90%', () => {
    const { state } = duel({ t: { skills: [skill({ type: 'damageReduction', percent: 200 })] } });
    expect(forecast(state).damage.none).toBe(3);
  });

  it('defendBonus makes Defend let through less', () => {
    const { state } = duel({ t: { skills: [skill({ type: 'defendBonus', percent: 10 })] } });
    expect(forecast(state).damage.defend).toBe(12); // 30 × 0.4
    expect(forecast(state).damage.none).toBe(30);
  });
});

describe('fatigue skills', () => {
  it('reactionFpDiscount lowers one reaction, and the defender pays the lower cost', () => {
    const { state } = duel({
      t: { skills: [skill({ type: 'reactionFpDiscount', reaction: 'defend', amount: 10 })] },
    });
    const choices = reactionChoices(state, requireUnit(state, 't'), requireUnit(state, 'a'));
    expect(choices.find((c) => c.reaction === 'defend')!.fpCost).toBe(20);
    expect(choices.find((c) => c.reaction === 'avoid')!.fpCost).toBe(20);
    const after = applyCommand(state, {
      type: 'attack',
      unitId: 'a',
      targetId: 't',
      reaction: 'defend',
    }).state;
    expect(requireUnit(after, 't').fp).toBe(20);
  });

  it('an attack-back discount reaches the menu and the forecast, never below 0', () => {
    const { state } = duel({
      t: {
        skills: [skill({ type: 'reactionFpDiscount', reaction: 'attackBack', amount: 500 })],
      },
    });
    const t = requireUnit(state, 't');
    expect(attackBackOptions(state, t, requireUnit(state, 'a').pos)[0]!.fpCost).toBe(0);
    expect(forecast(state).retaliation!.fpCost).toBe(0);
  });

  it('attackFpDiscount lowers the cost of every technique the owner uses', () => {
    const { state } = duel({ a: { skills: [skill({ type: 'attackFpDiscount', amount: 3 })] } });
    const a = requireUnit(state, 'a');
    expect(attackFpCost(state, a, findAttack(a, 'thrust'))).toBe(2);
    expect(attackFpCost(state, a, { ...findAttack(a, 'thrust'), fpCost: 1 })).toBe(0);
    const after = applyCommand(state, {
      type: 'attack',
      unitId: 'a',
      targetId: 't',
      attackId: 'thrust',
      reaction: 'defend',
    }).state;
    expect(requireUnit(after, 'a').fp).toBe(2);
  });

  it('restBonus recovers more FP from unspent AP', () => {
    const rest = (skills: Skill[]) => {
      const { state } = duel({ a: { skills } });
      const tired = {
        ...state,
        units: state.units.map((u) => ({ ...u, fp: u.id === 'a' ? 90 : u.fp })),
      };
      const after = applyCommand(tired, { type: 'endTurn', unitId: 'a' }).state;
      return requireUnit(after, 'a').fp;
    };
    expect(rest([])).toBe(90 - 66);
    expect(rest([skill({ type: 'restBonus', percent: 25 })])).toBe(90 - 83);
  });
});

describe('other skills', () => {
  it('counterBonus adds to the Counter chance after the clamp', () => {
    const { state } = duel({ t: { skills: [skill({ type: 'counterBonus', amount: 8 })] } });
    const plain = duel().state;
    const chance = (s: BattleState) => counterChance(s, requireUnit(s, 't'), requireUnit(s, 'a'));
    expect(chance(state)).toBe(chance(plain) + 8);
    expect(forecast(state).counter!.chance).toBe(chance(state));
  });

  it('xpBonus scales every blow', () => {
    const { state } = duel({ a: { skills: [skill({ type: 'xpBonus', percent: 50 })] } });
    const plain = duel().state;
    const xp = (s: BattleState) =>
      xpFor(s, requireUnit(s, 'a'), requireUnit(s, 't'), 30, 'front', false);
    // 30 + 100 × 30/80 = 67.5: 68 plain, 101 with +50% (rounded once, at the end).
    expect(xp(plain)).toBe(68);
    expect(xp(state)).toBe(101);
  });

  it('regen restores HP as the owner turn starts, never above max', () => {
    const s = skill({ type: 'regen', hp: 5 });
    let { state } = duel({ t: { skills: [s] } });
    state = withHp(state, 't', 70);
    // a acts first (AGL 20); ending its turn starts t's.
    const { state: after, events } = applyCommand(state, { type: 'endTurn', unitId: 'a' });
    expect(after.turn!.unitId).toBe('t');
    expect(requireUnit(after, 't').hp).toBe(75);
    expect(events).toContainEqual({
      type: 'unitRecovered',
      unitId: 't',
      skillId: s.id,
      amount: 5,
      hp: 75,
    });
    const nearlyFull = applyCommand(withHp(state, 't', 78), { type: 'endTurn', unitId: 'a' });
    expect(requireUnit(nearlyFull.state, 't').hp).toBe(80);
    const full = applyCommand(duel({ t: { skills: [s] } }).state, {
      type: 'endTurn',
      unitId: 'a',
    });
    expect(full.events.some((e) => e.type === 'unitRecovered')).toBe(false);
  });

  it('initiative moves the owner up the turn order', () => {
    const { state } = duel({
      a: { stats: { agl: 0 } },
      t: { skills: [skill({ type: 'initiative', amount: 100 })] },
    });
    expect(state.turnOrder[0]).toBe('t');
  });

  it('moveBonus adds MOV from its level', () => {
    const s = skill({ type: 'moveBonus', tiles: 1 }, 2);
    expect(requireUnit(duel({ a: { skills: [s] } }).state, 'a').mov).toBe(4);
    expect(requireUnit(duel({ a: { skills: [s], level: 2 } }).state, 'a').mov).toBe(5);
  });

  it('aura helps adjacent allies only, and the best one counts', () => {
    const aura = (amount: number) => [skill({ type: 'aura', amount })];
    const { state } = duel({
      a: { skills: aura(20) },
      extra: [
        unit({ id: 'ally', at: { x: 1, y: 0 }, skills: aura(5) }),
        unit({ id: 'ally2', at: { x: 3, y: 0 }, skills: aura(7) }),
        unit({ id: 'far', at: { x: 0, y: 3 }, skills: aura(30) }),
        unit({ id: 'foe', side: 'enemy', at: { x: 2, y: 3 }, skills: aura(40) }),
      ],
    });
    const a = requireUnit(state, 'a');
    // The owner's own aura doesn't count; ally2's 7 beats ally's 5.
    expect(auraFor(state, a, a.pos)).toBe(7);
    expect(forecast(state).hitChance.avoid).toBe(82);
    // Forecasting from another tile uses the allies next to that tile.
    expect(auraFor(state, a, { x: 1, y: 3 })).toBe(30);
  });
});

describe('level-up unlocks', () => {
  it('announces skills reached at the new level and applies MOV at once', () => {
    const move = skill({ type: 'moveBonus', tiles: 1 }, 2);
    let { state } = createBattle(
      setup({
        map: makeMap(['pppp', 'pppp', 'pppp']),
        units: [
          unit({
            id: 'a',
            controller: 'human',
            stats: { pow: 20, dex: 30, agl: 20 },
            at: { x: 1, y: 0 },
            facing: 'south',
            skills: [move],
          }),
          unit({ id: 'e', side: 'enemy', stats: { agl: 0 }, at: { x: 1, y: 1 } }),
        ],
      }),
    );
    state = { ...state, units: state.units.map((u) => (u.id === 'a' ? { ...u, xp: 490 } : u)) };
    const { state: after, events } = applyCommand(state, {
      type: 'attack',
      unitId: 'a',
      targetId: 'e',
      reaction: 'defend',
    });
    expect(events).toContainEqual(
      expect.objectContaining({ type: 'levelUp', unitId: 'a', level: 2, newSkills: [move.id] }),
    );
    expect(requireUnit(after, 'a').mov).toBe(5);
  });

  it('level-ups without a new skill say nothing about skills', () => {
    let { state } = createBattle(
      setup({
        map: makeMap(['pppp', 'pppp']),
        units: [
          unit({ id: 'a', stats: { dex: 30, agl: 20 }, at: { x: 1, y: 0 }, facing: 'south' }),
          unit({ id: 'e', side: 'enemy', stats: { agl: 0 }, at: { x: 1, y: 1 } }),
        ],
      }),
    );
    state = { ...state, units: state.units.map((u) => (u.id === 'a' ? { ...u, xp: 490 } : u)) };
    const { events } = applyCommand(state, {
      type: 'attack',
      unitId: 'a',
      targetId: 'e',
      reaction: 'defend',
    });
    const up = events.find((e) => e.type === 'levelUp');
    expect(up).toBeDefined();
    expect(up).not.toHaveProperty('newSkills');
  });
});

describe('skills and saves', () => {
  it('a version 7 battle save loads with no skills', () => {
    const { state } = duel({ a: { weapon: GUN } });
    const old = {
      ...state,
      saveVersion: 7,
      units: state.units.map(({ skills: _s, ...u }) => u),
    };
    const loaded = deserializeBattle(JSON.stringify(old));
    expect(loaded.saveVersion).toBe(SAVE_VERSION);
    expect(loaded.units.every((u) => Array.isArray(u.skills) && u.skills.length === 0)).toBe(true);
    const bare = deserializeBattle(JSON.stringify({ saveVersion: 7 }));
    expect(bare.units).toEqual([]);
  });
});
