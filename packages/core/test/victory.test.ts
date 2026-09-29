import { describe, expect, it } from 'vitest';
import type { BattleState } from '../src';
import { applyCommand, createBattle, evaluateOutcome } from '../src';
import { setup, unit } from './fixtures';

const base = (over: Partial<Parameters<typeof setup>[0]> = {}) =>
  createBattle(
    setup({
      units: [
        unit({ id: 'p', at: { x: 0, y: 0 } }),
        unit({ id: 'boss', side: 'enemy', at: { x: 5, y: 5 } }),
        unit({ id: 'e2', side: 'enemy', at: { x: 6, y: 6 } }),
      ],
      ...over,
    }),
  ).state;

const kill = (s: BattleState, id: string): BattleState => ({
  ...s,
  units: s.units.map((u) => (u.id === id ? { ...u, defeated: true, hp: 0 } : u)),
});

describe('outcomes', () => {
  it('rout needs every enemy down', () => {
    expect(evaluateOutcome(kill(base(), 'boss'))).toBe('ongoing');
    expect(evaluateOutcome(kill(kill(base(), 'boss'), 'e2'))).toBe('victory');
  });

  it('defeatLeader wins as soon as the leader falls', () => {
    const s = base({ victory: [{ type: 'defeatLeader', unitId: 'boss' }] });
    expect(evaluateOutcome(kill(s, 'boss'))).toBe('victory');
  });

  it('losing all player units or a protected unit is defeat', () => {
    expect(evaluateOutcome(kill(base(), 'p'))).toBe('defeat');
    const s = base({
      units: [
        unit({ id: 'p', at: { x: 0, y: 0 } }),
        unit({ id: 'vip', at: { x: 1, y: 0 } }),
        unit({ id: 'e', side: 'enemy', at: { x: 7, y: 7 } }),
      ],
      defeat: [{ type: 'protect', unitId: 'vip' }],
    });
    expect(evaluateOutcome(kill(s, 'vip'))).toBe('defeat');
  });

  it('survive wins once the round count passes', () => {
    let s = base({ victory: [{ type: 'survive', rounds: 1 }] });
    while (s.outcome === 'ongoing')
      s = applyCommand(s, { type: 'endTurn', unitId: s.turn!.unitId }).state;
    expect(s.outcome).toBe('victory');
    expect(s.round).toBe(2);
  });

  it('escape wins when the unit stands on a goal tile', () => {
    let s = base({ victory: [{ type: 'escape', unitId: 'p', tiles: [{ x: 1, y: 0 }] }] });
    expect(evaluateOutcome(s)).toBe('ongoing');
    s = applyCommand(
      s,
      s.turn!.unitId === 'p'
        ? { type: 'move', unitId: 'p', to: { x: 1, y: 0 } }
        : { type: 'endTurn', unitId: s.turn!.unitId },
    ).state;
    while (s.outcome === 'ongoing' && s.turn!.unitId !== 'p')
      s = applyCommand(s, { type: 'endTurn', unitId: s.turn!.unitId }).state;
    if (s.outcome === 'ongoing')
      s = applyCommand(s, { type: 'move', unitId: 'p', to: { x: 1, y: 0 } }).state;
    expect(s.outcome).toBe('victory');
  });

  it('rejects duplicate unit ids', () => {
    expect(() =>
      base({
        units: [unit({ id: 'x', at: { x: 0, y: 0 } }), unit({ id: 'x', at: { x: 1, y: 0 } })],
      }),
    ).toThrow(/Duplicate/);
  });
});
