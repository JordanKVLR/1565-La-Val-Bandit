import { describe, expect, it } from 'vitest';
import type { BattleState, ScriptedEvent, UnitSpec } from '../src';
import { applyCommand, bonusResults, createBattle, requireUnit } from '../src';
import { FRAME, makeMap, setup, SWORD, TERRAINS, unit } from './fixtures';

const spec = (id: string, at: { x: number; y: number }): UnitSpec => ({
  id,
  name: id,
  side: 'enemy',
  controller: 'ai',
  level: 1,
  stats: { bas: 5, pow: 6, dex: 6, agl: 6, def: 0, int: 5 },
  frame: FRAME,
  weapon: SWORD,
  at,
  facing: 'south',
});

function field(
  script: ScriptedEvent[],
  bonus: Parameters<typeof setup>[0]['bonus'] = [],
): { state: BattleState; events: ReturnType<typeof createBattle>['events'] } {
  return createBattle(
    setup({
      script,
      bonus,
      map: makeMap(['ppppp', 'ppppp', 'ppppp', 'ppppp']),
      units: [
        unit({ id: 'a', controller: 'human', at: { x: 0, y: 0 } }),
        unit({ id: 'e', side: 'enemy', at: { x: 4, y: 3 } }),
      ],
    }),
  );
}

/** Ends turns until the round counter reaches `round`. */
function toRound(state: BattleState, round: number): { state: BattleState; events: unknown[] } {
  const all: unknown[] = [];
  let s = state;
  for (let guard = 0; guard < 200 && s.round < round && s.outcome === 'ongoing'; guard++) {
    const id = s.turn!.unitId;
    const r = applyCommand(s, { type: 'endTurn', unitId: id });
    s = r.state;
    all.push(...r.events);
  }
  return { state: s, events: all };
}

describe('scripted events', () => {
  it('reinforcements arrive when their round starts, and only once', () => {
    const script: ScriptedEvent[] = [
      {
        id: 'cavalry',
        when: { type: 'round', round: 2 },
        actions: [
          { type: 'message', text: 'Horns on the ridge!', speaker: 'ANASTAGI' },
          { type: 'reinforce', units: [spec('rider', { x: 2, y: 2 })] },
        ],
      },
    ];
    const { state } = field(script);
    expect(state.units.map((u) => u.id)).toEqual(['a', 'e']);
    const r = toRound(state, 2);
    const s = r.state;
    expect(s.units.map((u) => u.id)).toEqual(['a', 'e', 'rider']);
    expect(s.script ?? []).toEqual([]);
    expect(r.events).toContainEqual(
      expect.objectContaining({
        type: 'scriptEvent',
        id: 'cavalry',
        reinforced: ['rider'],
        messages: [{ text: 'Horns on the ridge!', speaker: 'ANASTAGI' }],
      }),
    );
    // The newcomer fights next round: it is in that round's turn order.
    expect(toRound(s, 3).state.turnOrder).toContain('rider');
    // Later rounds do not bring it again.
    expect(toRound(s, 4).state.units.filter((u) => u.id === 'rider')).toHaveLength(1);
  });

  it('a reinforcement on an occupied tile lands on the nearest free one', () => {
    const { state } = field([
      {
        id: 'r',
        when: { type: 'round', round: 1 },
        actions: [{ type: 'reinforce', units: [spec('x', { x: 0, y: 0 })] }],
      },
    ]);
    const x = requireUnit(state, 'x');
    expect(Math.abs(x.pos.x) + Math.abs(x.pos.y)).toBe(1);
  });

  it('ground changes rewrite the map and the event names the tiles', () => {
    const terrain = 'scrub';
    expect(TERRAINS[terrain]).toBeDefined();
    const { state, events } = field([
      {
        id: 'burn',
        when: { type: 'round', round: 1 },
        actions: [{ type: 'terrain', tiles: [{ x: 2, y: 1 }], terrain }],
      },
    ]);
    expect(state.map.tiles[1 * 5 + 2]!.terrain).toBe(terrain);
    expect(state.map.tiles[0]!.terrain).toBe('plain');
    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'scriptEvent',
        terrain: [{ tiles: [{ x: 2, y: 1 }], terrain }],
      }),
    );
  });

  it('fires when a named unit falls', () => {
    const { state } = field([
      {
        id: 'vengeance',
        when: { type: 'defeated', unitId: 'e' },
        actions: [{ type: 'message', text: 'He is down.' }],
      },
    ]);
    // Wound the enemy to 1 HP, stand next to it and strike.
    const s: BattleState = {
      ...state,
      units: state.units.map((u) =>
        u.id === 'e' ? { ...u, hp: 1, pos: { x: 1, y: 0 } } : u.id === 'a' ? { ...u, ap: 100 } : u,
      ),
      turn: { ...state.turn!, unitId: 'a' },
    };
    const r = applyCommand(s, {
      type: 'attack',
      unitId: 'a',
      targetId: 'e',
      reaction: 'defend',
    });
    expect(r.events.some((e) => e.type === 'scriptEvent' && e.id === 'vengeance')).toBe(true);
  });

  it('survives a save round trip with its pending events', () => {
    const { state } = field([
      { id: 'later', when: { type: 'round', round: 9 }, actions: [{ type: 'message', text: 'x' }] },
    ]);
    const copy = JSON.parse(JSON.stringify(state)) as BattleState;
    expect(copy.script).toHaveLength(1);
  });
});

describe('optional goals', () => {
  it('are judged on the finished battle', () => {
    const { state } = field(
      [],
      [
        { type: 'rounds', max: 3, scudi: 100, parts: 2 },
        { type: 'noLosses', scudi: 50, parts: 1 },
        { type: 'keepAlive', unitId: 'a', scudi: 50, parts: 0 },
      ],
    );
    expect(bonusResults(state).map((r) => r.met)).toEqual([true, true, true]);
    const late: BattleState = {
      ...state,
      round: 5,
      units: state.units.map((u) => (u.id === 'a' ? { ...u, defeated: true } : u)),
    };
    expect(bonusResults(late).map((r) => r.met)).toEqual([false, false, false]);
  });

  it('a unit that does not exist never counts as kept alive', () => {
    const { state } = field([], [{ type: 'keepAlive', unitId: 'ghost', scudi: 1, parts: 0 }]);
    expect(bonusResults(state)[0]!.met).toBe(false);
  });
});
