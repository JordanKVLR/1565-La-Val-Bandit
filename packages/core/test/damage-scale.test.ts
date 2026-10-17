import { describe, expect, it } from 'vitest';
import type { BalanceConfig } from '../src';
import {
  createBattle,
  damageFor,
  DEFAULT_BALANCE,
  findAttack,
  forecastAttack,
  reflectDamage,
  requireUnit,
  strikeNumbers,
  xpFor,
  xpGapFactor,
} from '../src';
import { makeMap, setup, unit } from './fixtures';

/** A veteran swordsman against a typical mid-game enemy, on the shipped balance. */
function matchup(balance: BalanceConfig, targetFacing: 'north' | 'south') {
  const { state } = createBattle(
    setup({
      balance,
      map: makeMap(['ppppp', 'ppppp', 'ppppp']),
      units: [
        unit({ id: 'a', at: { x: 2, y: 0 }, stats: { pow: 15 } }),
        unit({
          id: 't',
          side: 'enemy',
          at: { x: 2, y: 1 },
          facing: targetFacing,
          level: 4,
          stats: { bas: 7, def: 5 },
        }),
      ],
    }),
  );
  const a = requireUnit(state, 'a');
  const t = requireUnit(state, 't');
  return { state, a, t, f: forecastAttack(state, a, t, a.pos, findAttack(a, 'basic')) };
}

const hitsToKill = (hp: number, dmg: number) => Math.ceil(hp / dmg);

describe('damageScale', () => {
  it('ships in the shipped balance below 1', () => {
    expect(DEFAULT_BALANCE.damageScale).toBeGreaterThan(0);
    expect(DEFAULT_BALANCE.damageScale).toBeLessThan(1);
  });

  it('takes a typical unit 4 to 9 rear basic hits, 5 to 11 front hits, and more when defended', () => {
    const rear = matchup(DEFAULT_BALANCE, 'south');
    expect(rear.f.zone).toBe('rear');
    const rearHits = hitsToKill(rear.t.maxHp, rear.f.damage.none);
    expect(rearHits).toBeGreaterThanOrEqual(4);
    expect(rearHits).toBeLessThanOrEqual(9);

    const front = matchup(DEFAULT_BALANCE, 'north');
    expect(front.f.zone).toBe('front');
    const frontHits = hitsToKill(front.t.maxHp, front.f.damage.none);
    expect(frontHits).toBeGreaterThanOrEqual(5);
    expect(frontHits).toBeLessThanOrEqual(11);
    expect(hitsToKill(front.t.maxHp, front.f.damage.defend)).toBeGreaterThan(frontHits * 1.7);
  });

  it('reads the knob from balance data and scales damage after DEF', () => {
    const full = matchup({ ...DEFAULT_BALANCE, damageScale: 1 }, 'north');
    const half = matchup({ ...DEFAULT_BALANCE, damageScale: 0.5 }, 'north');
    const raw = strikeNumbers(full.state, full.a, full.t).baseDamage;
    const blocked = full.t.def * DEFAULT_BALANCE.defDamagePerPoint;
    expect(full.f.damage.none).toBe(Math.round(raw - blocked));
    expect(half.f.damage.none).toBe(Math.round((raw - blocked) * 0.5));
  });

  it('keeps Defend, rear and counter multipliers relative to the scaled blow', () => {
    const { state, a, t, f } = matchup(DEFAULT_BALANCE, 'north');
    expect(Math.abs(f.damage.defend - f.damage.none * 0.5)).toBeLessThanOrEqual(1);
    expect(
      Math.abs(f.damage.counter - f.damage.none * DEFAULT_BALANCE.counterFailMult),
    ).toBeLessThan(1);
    const n = strikeNumbers(state, a, t);
    expect(damageFor(state, n, t, 'none')).toBe(f.damage.none);
    // A reflected Counter is built from the scaled damage, so it shrinks with the knob too.
    expect(reflectDamage(state, f.damage.none)).toBeLessThan(
      reflectDamage(state, f.damage.none / DEFAULT_BALANCE.damageScale),
    );
  });

  it('never drops a landed blow below 1 damage', () => {
    const { state, a, t } = matchup({ ...DEFAULT_BALANCE, damageScale: 0.01 }, 'north');
    expect(damageFor(state, strikeNumbers(state, a, t), t, 'defend')).toBe(1);
  });
});

describe('shipped XP rates', () => {
  it('pay about a level for killing a foe in ~5 front hits (was about two)', () => {
    const { state, a, t } = matchup(DEFAULT_BALANCE, 'north');
    const ratio = xpGapFactor(t.level - a.level, DEFAULT_BALANCE) * DEFAULT_BALANCE.xpScale;
    const hitShare = Math.round(t.maxHp / 5);
    const perHit = xpFor(state, a, t, hitShare, 'front', false);
    const kill = xpFor(state, a, t, hitShare, 'front', true);
    // Bounds: one landed blow is a small fraction of a level; a full kill (5 hits + defeat) is
    // between half and one and a half levels (before the level-gap factor `ratio`).
    expect(perHit).toBeLessThan((DEFAULT_BALANCE.xpPerLevel / 8) * ratio);
    // The defeat bonus is rounded together with the hit, so allow a point of rounding.
    expect(Math.abs(kill - perHit - DEFAULT_BALANCE.xpDefeat * ratio)).toBeLessThanOrEqual(1);
    const wholeKill = perHit * 4 + kill;
    expect(wholeKill).toBeGreaterThanOrEqual(DEFAULT_BALANCE.xpPerLevel * 0.5 * ratio);
    expect(wholeKill).toBeLessThanOrEqual(DEFAULT_BALANCE.xpPerLevel * 1.5 * ratio);
  });

  it('base rates are half of the pre-halving ones (75 / 200 / 400); xpScale then sets the pace', () => {
    expect(DEFAULT_BALANCE.xpHitBase).toBe(75 / 2.5);
    expect(DEFAULT_BALANCE.xpDamageShare).toBe(200 / 2);
    expect(DEFAULT_BALANCE.xpDefeat).toBe(400 / 2);
    // 2.2×: about 1–1.5 levels a battle, so the company nears Lv 25 by the finale.
    expect(DEFAULT_BALANCE.xpScale).toBe(2.2);
  });
});
