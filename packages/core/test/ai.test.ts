import { describe, expect, it } from 'vitest';
import { chooseReaction, createBattle, planAiTurn } from '../src';
import { makeMap, setup, unit } from './fixtures';

const map = makeMap(['pppppp', 'pppppp', 'pppppp', 'pppppp']);

describe('AI', () => {
  it('moves in and attacks when a target is reachable', () => {
    const { state } = createBattle(
      setup({
        map,
        units: [
          unit({ id: 'ai', stats: { pow: 6, dex: 6, agl: 30 }, at: { x: 0, y: 0 } }),
          unit({ id: 'p', side: 'enemy', at: { x: 2, y: 1 } }),
        ],
      }),
    );
    const plan = planAiTurn(state, 'ai');
    expect(plan.map((c) => c.type)).toEqual(['move', 'attack', 'endTurn']);
  });

  it('closes distance when nothing is in reach', () => {
    const { state } = createBattle(
      setup({
        map: makeMap(['pppppppppppp']),
        units: [
          unit({ id: 'ai', stats: { pow: 6, dex: 6, agl: 30 }, at: { x: 0, y: 0 } }),
          unit({ id: 'p', side: 'enemy', at: { x: 11, y: 0 } }),
        ],
      }),
    );
    const [first] = planAiTurn(state, 'ai');
    expect(first).toMatchObject({ type: 'move' });
  });

  it('escaping units head for their goal instead of fighting', () => {
    const { state } = createBattle(
      setup({
        map: makeMap(['pppppppppppp']),
        victory: [{ type: 'escape', unitId: 'runner', tiles: [{ x: 11, y: 0 }] }],
        units: [
          unit({ id: 'runner', stats: { pow: 6, dex: 6, agl: 30 }, at: { x: 4, y: 0 } }),
          unit({ id: 'e', side: 'enemy', at: { x: 3, y: 0 } }),
        ],
      }),
    );
    const [first] = planAiTurn(state, 'runner');
    expect(first).toMatchObject({ type: 'move' });
    expect(first?.type === 'move' && first.to.x).toBeGreaterThan(4);
  });

  it('defensive units do not charge into a crowd', () => {
    const { state } = createBattle(
      setup({
        map: makeMap(['pppppppp', 'pppppppp', 'pppppppp', 'pppppppp']),
        units: [
          unit({
            id: 'ai',
            ai: 'defensive',
            stats: { pow: 6, dex: 6, agl: 30 },
            at: { x: 0, y: 3 },
          }),
          // An aggressive ally keeps 'ai' in its cautious role (a lone cautious unit goes on the attack).
          unit({ id: 'ally', stats: { pow: 6, dex: 6, agl: 1 }, at: { x: 0, y: 0 } }),
          unit({ id: 'p1', side: 'enemy', at: { x: 3, y: 1 } }),
          unit({ id: 'p2', side: 'enemy', at: { x: 4, y: 1 } }),
          unit({ id: 'p3', side: 'enemy', at: { x: 3, y: 0 } }),
          unit({ id: 'p4', side: 'enemy', at: { x: 4, y: 2 } }),
        ],
      }),
    );
    expect(planAiTurn(state, 'ai').map((c) => c.type)).toEqual(['endTurn']);
  });

  it('hold units never move', () => {
    const { state } = createBattle(
      setup({
        map,
        units: [
          unit({ id: 'ai', ai: 'hold', stats: { pow: 6, dex: 6, agl: 30 }, at: { x: 0, y: 0 } }),
          unit({ id: 'p', side: 'enemy', at: { x: 3, y: 3 } }),
        ],
      }),
    );
    expect(planAiTurn(state, 'ai').map((c) => c.type)).toEqual(['endTurn']);
  });

  it('defends rather than risking death by avoiding', () => {
    const { state } = createBattle(
      setup({
        map,
        units: [
          unit({ id: 'a', stats: { pow: 6, dex: 6, agl: 30 }, at: { x: 1, y: 1 } }),
          unit({ id: 'd', side: 'enemy', at: { x: 1, y: 2 }, facing: 'north' }),
        ],
      }),
    );
    const weak = { ...state, units: state.units.map((u) => (u.id === 'd' ? { ...u, hp: 20 } : u)) };
    expect(chooseReaction(weak, 'd', 'a')).toBe('defend');
  });
});
