import { describe, expect, it } from 'vitest';
import type { Attack, Reaction } from '../src';
import {
  applyCommand,
  availableReactions,
  chooseReaction,
  createBattle,
  forecastAttack,
  requireUnit,
} from '../src';
import { makeMap, setup, TEST_BALANCE, unit } from './fixtures';

const base: Attack = {
  id: 'x',
  name: 'Test Blow',
  style: 'bash',
  power: 1,
  accuracy: 100,
  apCost: 30,
  fpCost: 10,
  requires: {},
};
const KNOCK: Attack = { ...base, id: 'knock', kind: 'knockdown' };
const CRASH: Attack = { ...base, id: 'crash', kind: 'collision' };
const SAP: Attack = { ...base, id: 'sap', weaken: true, slow: 2 };
const BALANCE = { ...TEST_BALANCE, hitMin: 100, hitMax: 100, defendHitMax: 100 };

/** Plays endTurn for everyone else until it is `id`'s turn. */
function toTurn(s: ReturnType<typeof createBattle>['state'], id: string) {
  let state = s;
  for (let i = 0; i < 8 && state.turn?.unitId !== id; i++)
    state = applyCommand(state, { type: 'endTurn', unitId: state.turn!.unitId }).state;
  return state;
}

function duel(attack: Attack, back = true) {
  const s = createBattle(
    setup({
      balance: BALANCE,
      map: makeMap(['ppp', 'ppp', 'ppp']),
      units: [
        unit({ id: 'a', at: { x: 1, y: 0 }, facing: 'south', attacks: [attack] }),
        unit({ id: 't', side: 'enemy', at: { x: 1, y: 1 }, facing: 'north', level: back ? 1 : 1 }),
      ],
    }),
  ).state;
  return toTurn(s, 'a');
}
const hit = (s: ReturnType<typeof duel>, id: string, reaction: Reaction) =>
  applyCommand(s, { type: 'attack', unitId: 'a', targetId: 't', reaction, attackId: id });

describe('attack kinds', () => {
  it('a knockdown cannot be countered but can be answered by Attack back', () => {
    const s = duel(KNOCK);
    const options = availableReactions(
      s,
      requireUnit(s, 't'),
      requireUnit(s, 'a'),
      undefined,
      KNOCK,
    );
    expect(options).not.toContain('counter');
    expect(options).toContain('attackBack');
  });

  it('a landed knockdown cancels the strike back and drains AP from the next turn', () => {
    const { state, events } = hit(duel(KNOCK), 'knock', 'attackBack');
    const ev = events.find((e) => e.type === 'attackResolved');
    expect(ev?.type === 'attackResolved' && ev.downed).toBe(true);
    expect(ev?.type === 'attackResolved' && ev.retaliation).toBeUndefined();
    expect(requireUnit(state, 'a').hp).toBe(requireUnit(state, 'a').maxHp);
    expect(requireUnit(state, 't').apDebt).toBe(BALANCE.knockdownAp);
  });

  it('Defend holds a knockdown off, but not a collision', () => {
    const k = hit(duel(KNOCK), 'knock', 'defend').state;
    expect(requireUnit(k, 't').apDebt ?? 0).toBe(0);
    const c = hit(duel(CRASH), 'crash', 'defend').state;
    expect(requireUnit(c, 't').apDebt).toBe(BALANCE.collisionAp);
  });

  it('a toppled unit starts its next turn short of AP, once', () => {
    let s = hit(duel(KNOCK), 'knock', 'avoid').state;
    expect(requireUnit(s, 't').apDebt).toBe(BALANCE.knockdownAp);
    s = toTurn(s, 't');
    expect(s.turn?.unitId).toBe('t');
    expect(requireUnit(s, 't').ap).toBe(TEST_BALANCE.apMax - BALANCE.knockdownAp);
    expect(requireUnit(s, 't').apDebt).toBe(0);
  });

  it('the forecast names the kind, and the AI prefers Defend against a knockdown', () => {
    const s = duel(KNOCK);
    expect(forecastAttack(s, requireUnit(s, 'a'), requireUnit(s, 't'), undefined, KNOCK).kind).toBe(
      'knockdown',
    );
    expect(chooseReaction(s, 't', 'a', 'knock')).not.toBe('counter');
  });

  it('a sapping technique weakens and slows, for exactly the target next turn', () => {
    let s = hit(duel(SAP), 'sap', 'avoid').state;
    const t0 = requireUnit(s, 't');
    expect(t0.weakened).toBe(true);
    expect(t0.slowedBy).toBe(2);
    const mov = t0.mov;
    const full = TEST_BALANCE.damagePerPoint;
    expect(full).toBeGreaterThan(0);
    s = toTurn(s, 't');
    expect(requireUnit(s, 't').statusTurns).toBe(1);
    s = applyCommand(s, { type: 'endTurn', unitId: 't' }).state;
    const after = requireUnit(s, 't');
    expect(after.weakened).toBe(false);
    expect(after.mov).toBe(mov + 2);
  });

  it('a weakened unit deals less damage', () => {
    const s = duel(base);
    const t = requireUnit(s, 't');
    const a = requireUnit(s, 'a');
    const normal = forecastAttack(s, t, a, t.pos, t.attacks[0]!).damage.none;
    t.weakened = true;
    const sapped = forecastAttack(s, t, a, t.pos, t.attacks[0]!).damage.none;
    expect(sapped).toBeLessThan(normal);
    expect(sapped).toBe(Math.round(normal * TEST_BALANCE.weakenMult));
  });
});
