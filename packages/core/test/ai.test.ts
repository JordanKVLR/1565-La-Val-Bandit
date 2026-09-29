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
          unit({ id: 'ai', stats: { str: 6, skl: 6, agi: 30 }, at: { x: 0, y: 0 } }),
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
          unit({ id: 'ai', stats: { str: 6, skl: 6, agi: 30 }, at: { x: 0, y: 0 } }),
          unit({ id: 'p', side: 'enemy', at: { x: 11, y: 0 } }),
        ],
      }),
    );
    const [first] = planAiTurn(state, 'ai');
    expect(first).toMatchObject({ type: 'move' });
  });

  it('hold units never move', () => {
    const { state } = createBattle(
      setup({
        map,
        units: [
          unit({ id: 'ai', ai: 'hold', stats: { str: 6, skl: 6, agi: 30 }, at: { x: 0, y: 0 } }),
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
          unit({ id: 'a', stats: { str: 6, skl: 6, agi: 30 }, at: { x: 1, y: 1 } }),
          unit({ id: 'd', side: 'enemy', at: { x: 1, y: 2 }, facing: 'north' }),
        ],
      }),
    );
    const weak = { ...state, units: state.units.map((u) => (u.id === 'd' ? { ...u, hp: 20 } : u)) };
    expect(chooseReaction(weak, 'd', 'a')).toBe('defend');
  });
});
