import { describe, expect, it } from 'vitest';
import type { BattleEvent, BattleState, Facing } from '../src';
import {
  applyCommand,
  attackFpCost,
  bestFacing,
  createBattle,
  forecastAttack,
  requireUnit,
  strikeNumbers,
} from '../src';
import { makeMap, setup, unit } from './fixtures';

/** Attacker 'a' (human, to act) at (2,2) strikes defender 'd' at (2,3), facing the given way. */
function duel(defenderFacing: Facing, defenderFp = 0): BattleState {
  const { state } = createBattle(
    setup({
      map: makeMap(['ppppp', 'ppppp', 'ppppp', 'ppppp', 'ppppp']),
      units: [
        unit({
          id: 'a',
          controller: 'human',
          at: { x: 2, y: 2 },
          facing: 'south',
          stats: { dex: 0, agl: 20 },
        }),
        unit({
          id: 'd',
          side: 'enemy',
          at: { x: 2, y: 3 },
          facing: defenderFacing,
          stats: { dex: 0, agl: 20 },
        }),
      ],
    }),
  );
  const units = state.units.map((u) => (u.id === 'd' ? { ...u, fp: defenderFp } : u));
  return { ...state, units, turn: { ...state.turn!, unitId: 'a' } as BattleState['turn'] };
}

const strike = (s: BattleState, reaction: 'attackBack' | 'avoid' | 'defend' = 'attackBack') => {
  const a = requireUnit(s, 'a');
  return applyCommand(s, {
    type: 'attack',
    unitId: 'a',
    targetId: 'd',
    attackId: a.attacks[0]!.id,
    reaction,
  });
};

type Resolved = Extract<BattleEvent, { type: 'attackResolved' }>;
const resolved = (events: BattleEvent[]) =>
  events.find((e): e is Resolved => e.type === 'attackResolved')!;

describe('being struck does not turn the defender', () => {
  it.each(['north', 'east', 'west', 'south'] as const)(
    'a defender facing %s keeps that facing after the exchange',
    (facing) => {
      const r = strike(duel(facing), 'avoid');
      expect(requireUnit(r.state, 'd').facing).toBe(facing);
    },
  );

  it('a flank stays a flank: a second blow from the same side still gets the flank bonus', () => {
    // Defender faces east; the attacker is north of it, a side attack.
    const first = strike(duel('east'), 'avoid');
    const d = requireUnit(first.state, 'd');
    const a = requireUnit(first.state, 'a');
    expect(d.facing).toBe('east');
    const n = strikeNumbers(first.state, a, d, a.pos, a.attacks[0]!);
    expect(n.zone).toBe('side');
    expect(n.hitParts.flank).toBe(first.state.balance.sideHitBonus);
  });

  it('the attacker still turns to face the target it strikes', () => {
    const s = duel('north');
    const west = {
      ...s,
      units: s.units.map((u) => (u.id === 'a' ? { ...u, facing: 'west' as Facing } : u)),
    };
    expect(requireUnit(strike(west, 'avoid').state, 'a').facing).toBe('south');
  });
});

describe('the forecast is the real hit chance, with no hidden fatigue penalty', () => {
  it('paying the strike-back FP does not tire the strike back (or the blow it answers)', () => {
    // Defender at 30 FP pays 25 to strike back: 55 would be Tired if paid first.
    const s = duel('north', 30);
    const a = requireUnit(s, 'a');
    const d = requireUnit(s, 'd');
    const f = forecastAttack(s, a, d, a.pos, a.attacks[0]!);
    const ev = resolved(strike(s).events);
    expect(ev.strikes[0]!.hitChance).toBe(f.hitChance.attackBack);
    expect(ev.retaliation!.hitChance).toBe(f.retaliation!.hitChance);
  });

  it("paying the attacker's own FP does not tire its own blow", () => {
    // The attacker at 45 FP pays 25 for its attack: 70 would be Tired if paid first.
    const s = duel('north');
    const hot = { ...s, units: s.units.map((u) => (u.id === 'a' ? { ...u, fp: 45 } : u)) };
    const a = requireUnit(hot, 'a');
    const d = requireUnit(hot, 'd');
    const f = forecastAttack(hot, a, d, a.pos, a.attacks[0]!);
    expect(resolved(strike(hot, 'avoid').events).strikes[0]!.hitChance).toBe(f.hitChance.avoid);
  });

  it('the fatigue is still paid once the exchange is over', () => {
    const r = strike(duel('north', 30));
    const a = requireUnit(duel('north', 30), 'a');
    expect(requireUnit(r.state, 'd').fp).toBe(55);
    expect(requireUnit(r.state, 'a').fp).toBe(attackFpCost(r.state, a, a.attacks[0]!));
  });

  it('a Tired striker still gets the penalty, from the fatigue it came in with', () => {
    const s = duel('north');
    const tired = { ...s, units: s.units.map((u) => (u.id === 'a' ? { ...u, fp: 60 } : u)) };
    const a = requireUnit(tired, 'a');
    const d = requireUnit(tired, 'd');
    expect(strikeNumbers(tired, a, d, a.pos, a.attacks[0]!).hitParts.tired).toBe(
      -tired.balance.tiredPenalty,
    );
  });
});

describe('hit parts', () => {
  it('add up to the base hit chance, and explain a strike back that differs from the blow', () => {
    const s = duel('east'); // a side attack on d
    const a = requireUnit(s, 'a');
    const d = requireUnit(s, 'd');
    const f = forecastAttack(s, a, d, a.pos, a.attacks[0]!);
    const sum = (p: typeof f.hitParts) => Object.values(p).reduce((x, y) => x + y, 0);
    expect(s.balance.baseHit + sum(f.hitParts)).toBe(
      strikeNumbers(s, a, d, a.pos, a.attacks[0]!).baseHit,
    );
    // The strike back lands on the attacker's front: it never gets the flank bonus.
    expect(f.hitParts.flank).toBe(s.balance.sideHitBonus);
    expect(f.retaliation!.zone).toBe('front');
    expect(f.retaliation!.hitParts.flank).toBe(0);
  });
});

describe('AI facing at the end of a turn', () => {
  const at = (x: number, y: number, side: 'player' | 'enemy', id: string) =>
    unit({ id, side, at: { x, y }, facing: 'north', controller: 'ai' });
  const state = (enemies: [number, number][]) =>
    createBattle(
      setup({
        map: makeMap(Array.from({ length: 9 }, () => 'ppppppppp')),
        units: [
          at(4, 4, 'player', 'me'),
          ...enemies.map(([x, y], i) => at(x, y, 'enemy', `e${i}`)),
        ],
      }),
    ).state;
  const faceFor = (enemies: [number, number][]) => {
    const s = state(enemies);
    const me = requireUnit(s, 'me');
    return bestFacing(
      s,
      me,
      me.pos,
      s.units.filter((u) => u.side === 'enemy'),
    );
  };

  it('faces the only enemy', () => {
    expect(faceFor([[4, 0]])).toBe('north');
    expect(faceFor([[8, 4]])).toBe('east');
  });

  it('faces the larger or nearer group, keeping its rear to the empty side', () => {
    expect(
      faceFor([
        [4, 1],
        [3, 1],
        [5, 1],
        [4, 8],
      ]),
    ).toBe('north');
    expect(
      faceFor([
        [6, 4],
        [6, 3],
        [6, 5],
        [0, 4],
      ]),
    ).toBe('east');
  });

  it('with enemies on opposite sides, turns side-on so neither is at its rear', () => {
    // Front plus rear would cost 3; two flanks cost 2.
    expect(
      faceFor([
        [4, 3],
        [4, 8],
      ]),
    ).toMatch(/east|west/);
  });

  it('ignores enemies too far away to reach it, falling back to the nearest', () => {
    expect(faceFor([[0, 0]])).toMatch(/north|west/);
  });
});
