import { describe, expect, it } from 'vitest';
import type { BattleState, Command } from '../src';
import { applyCommand, CommandError, createBattle, requireUnit } from '../src';
import { makeMap, setup, unit } from './fixtures';

function start(
  units = [
    unit({ id: 'a', stats: { pow: 6, dex: 6, agl: 20 }, at: { x: 0, y: 0 }, facing: 'south' }),
    unit({ id: 'e', side: 'enemy', at: { x: 0, y: 3 } }),
  ],
) {
  return createBattle(setup({ map: makeMap(['pppp', 'pppp', 'pppp', 'pppp']), units })).state;
}

const run = (s: BattleState, ...cmds: Command[]) =>
  cmds.reduce((st, c) => applyCommand(st, c).state, s);

describe('turn flow', () => {
  it('starts round 1 with the fastest unit on full AP', () => {
    const s = start();
    expect(s.round).toBe(1);
    expect(s.turn?.unitId).toBe('a');
    expect(requireUnit(s, 'a').ap).toBe(100);
  });

  it('rejects commands from the wrong unit', () => {
    expect(() => applyCommand(start(), { type: 'endTurn', unitId: 'e' })).toThrow(CommandError);
  });

  it('moves, spends AP, faces the direction of travel and can undo', () => {
    const s0 = start();
    const s1 = run(s0, { type: 'move', unitId: 'a', to: { x: 2, y: 0 } });
    const a1 = requireUnit(s1, 'a');
    expect(a1.pos).toEqual({ x: 2, y: 0 });
    expect(a1.ap).toBe(92);
    expect(a1.facing).toBe('east');
    expect(() => applyCommand(s1, { type: 'move', unitId: 'a', to: { x: 3, y: 0 } })).toThrow(
      /Already/,
    );
    const s2 = run(s1, { type: 'undoMove', unitId: 'a' });
    expect(requireUnit(s2, 'a')).toMatchObject({ pos: { x: 0, y: 0 }, ap: 100, facing: 'south' });
    expect(s0).toEqual(start()); // the original state was never mutated
  });

  it('refuses unreachable moves and undo with nothing to undo', () => {
    const s = start();
    expect(() => applyCommand(s, { type: 'move', unitId: 'a', to: { x: 0, y: 3 } })).toThrow(
      /reachable/,
    );
    expect(() => applyCommand(s, { type: 'undoMove', unitId: 'a' })).toThrow(/Nothing/);
  });

  it('recovers fatigue from unspent AP: 3 AP rest off 2 FP', () => {
    let s = start();
    s = { ...s, units: s.units.map((u) => (u.id === 'a' ? { ...u, fp: 90 } : u)) };
    // 100 AP unspent → 66 FP recovered
    const rested = run(s, { type: 'endTurn', unitId: 'a', facing: 'east' });
    expect(requireUnit(rested, 'a')).toMatchObject({ fp: 24, facing: 'east' });
    const moved = run(
      s,
      { type: 'move', unitId: 'a', to: { x: 1, y: 0 } },
      { type: 'endTurn', unitId: 'a' },
    );
    // moving one plain tile costs 4 AP; 96 left → 64 FP recovered
    expect(requireUnit(moved, 'a').fp).toBe(26);
    expect(moved.turn?.unitId).toBe('e');
  });

  it('starts a new round after everyone has acted', () => {
    const s = run(start(), { type: 'endTurn', unitId: 'a' }, { type: 'endTurn', unitId: 'e' });
    expect(s.round).toBe(2);
    expect(requireUnit(s, 'a').ap).toBe(100);
  });

  it('stops a spent unit from moving or attacking', () => {
    let s = start();
    s = { ...s, units: s.units.map((u) => (u.id === 'a' ? { ...u, fp: 100 } : u)) };
    expect(() => applyCommand(s, { type: 'move', unitId: 'a', to: { x: 1, y: 0 } })).toThrow(
      /fatigued/,
    );
  });
});

describe('attacks', () => {
  const adjacent = () =>
    start([
      unit({ id: 'a', stats: { pow: 6, dex: 6, agl: 20 }, at: { x: 1, y: 1 }, facing: 'south' }),
      unit({ id: 'e', side: 'enemy', at: { x: 1, y: 2 }, facing: 'north' }),
    ]);
  const withAp = (s: BattleState, id: string, ap: number): BattleState => ({
    ...s,
    units: s.units.map((u) => (u.id === id ? { ...u, ap } : u)),
  });

  it('defend always hits for reduced damage and costs the defender 30 FP, no AP', () => {
    const { state, events } = applyCommand(adjacent(), {
      type: 'attack',
      unitId: 'a',
      targetId: 'e',
      reaction: 'defend',
    });
    const e = requireUnit(state, 'e');
    // Slash: (24 + 6) × 0.8 = 24 (DEF 0), halved by Defend to 12
    expect(e.hp).toBe(80 - 12);
    expect(e).toMatchObject({ ap: 100, fp: 30 });
    // Slash costs 20 AP and only 5 FP; XP 30 + 100 × 12/80 = 45.
    expect(requireUnit(state, 'a')).toMatchObject({ ap: 80, fp: 5, xp: 45 });
    expect(events[0]).toMatchObject({
      type: 'attackResolved',
      reaction: 'defend',
      strikes: [{ hit: true, damage: 12 }],
    });
  });

  it("attack back pays the technique's AP and FP as FP, spends no AP and strikes back", () => {
    const { state, events } = applyCommand(withAp(adjacent(), 'e', 60), {
      type: 'attack',
      unitId: 'a',
      targetId: 'e',
      reaction: 'attackBack',
    });
    const e = requireUnit(state, 'e');
    expect(e.ap).toBe(60);
    expect(e.fp).toBe(25); // Slash: 20 AP + 5 FP, all paid as FP when striking back
    const ev = events[0];
    expect(ev?.type === 'attackResolved' && ev.retaliation?.attackerId).toBe('e');
  });

  it('rejects reactions a Spent unit cannot make, out-of-range targets and friendly fire', () => {
    const s = adjacent();
    const poor = { ...s, units: s.units.map((u) => (u.id === 'e' ? { ...u, fp: 100 } : u)) };
    expect(() =>
      applyCommand(poor, { type: 'attack', unitId: 'a', targetId: 'e', reaction: 'avoid' }),
    ).toThrow(/not available/);
    const far = start();
    expect(() =>
      applyCommand(far, { type: 'attack', unitId: 'a', targetId: 'e', reaction: 'defend' }),
    ).toThrow(/range/);
    const friends = start([
      unit({ id: 'a', stats: { pow: 6, dex: 6, agl: 20 }, at: { x: 0, y: 0 } }),
      unit({ id: 'b', at: { x: 0, y: 1 } }),
      unit({ id: 'e', side: 'enemy', at: { x: 3, y: 3 } }),
    ]);
    expect(() =>
      applyCommand(friends, { type: 'attack', unitId: 'a', targetId: 'b', reaction: 'defend' }),
    ).toThrow(/Invalid/);
  });

  it('defeating the last enemy wins the battle and blocks further commands', () => {
    let s = adjacent();
    s = { ...s, units: s.units.map((u) => (u.id === 'e' ? { ...u, hp: 3 } : u)) };
    const { state, events } = applyCommand(s, {
      type: 'attack',
      unitId: 'a',
      targetId: 'e',
      reaction: 'defend',
    });
    expect(state.outcome).toBe('victory');
    expect(events.map((e) => e.type)).toEqual(['attackResolved', 'unitDefeated', 'battleEnded']);
    expect(requireUnit(state, 'a').xp).toBe(30 + 15 + 150); // hit (12 of 80 HP) + defeating blow
    expect(() => applyCommand(state, { type: 'endTurn', unitId: 'a' })).toThrow(/over/);
  });

  it('an attacker killed by a counter loses its turn', () => {
    let s = start([
      unit({ id: 'a', stats: { pow: 6, dex: 6, agl: 20 }, at: { x: 1, y: 1 } }),
      unit({ id: 'b', stats: { pow: 6, dex: 6, agl: 10 }, at: { x: 3, y: 3 } }),
      unit({
        id: 'e',
        side: 'enemy',
        stats: { pow: 6, dex: 30, agl: 0 },
        at: { x: 1, y: 2 },
        facing: 'north',
      }),
    ]);
    s = { ...s, units: s.units.map((u) => (u.id === 'a' ? { ...u, hp: 1 } : u)) };
    const { state } = applyCommand(withAp(s, 'e', 60), {
      type: 'attack',
      unitId: 'a',
      targetId: 'e',
      reaction: 'attackBack',
    });
    expect(requireUnit(state, 'a').defeated).toBe(true);
    expect(state.outcome).toBe('ongoing');
    expect(state.turn?.unitId).toBe('b');
  });
});
