import type { AttackStyle, WeaponType } from '@m1565/core';
import { describe, expect, it } from 'vitest';
import { moveFor, reactionFor } from './duelMoves';

const PAIRS: [WeaponType, AttackStyle][] = [
  ['blade', 'slash'],
  ['blade', 'thrust'],
  ['blade', 'overhead'],
  ['blade', 'sweep'],
  ['polearm', 'thrust'],
  ['polearm', 'charge'],
  ['polearm', 'sweep'],
  ['polearm', 'bash'],
  ['blunt', 'bash'],
  ['blunt', 'overhead'],
  ['firearm', 'shot'],
  ['firearm', 'volley'],
  ['firearm', 'bash'],
  ['explosive', 'throw'],
  ['explosive', 'bash'],
];

describe('duel moves', () => {
  it.each(PAIRS)('%s %s strikes after a wind-up and settles back to guard', (weapon, style) => {
    const m = moveFor({ weapon, style, power: 1, reach: 1 });
    const times = m.keys.map((k) => k.t);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(m.impact).toBeGreaterThan(m.keys[0]!.t - 1e-9);
    expect(m.impact).toBeLessThan(times[times.length - 1]!);
    const last = m.keys[m.keys.length - 1]!.p;
    // Ends at guard (a full turn counts as facing forward again).
    expect(Object.entries(last).every(([k, v]) => k === 'spin' && v === Math.PI * 2)).toBe(true);
  });

  it('gives spears, guns and throws their own reach', () => {
    expect(
      moveFor({ weapon: 'polearm', style: 'thrust', power: 1, reach: 2 }).standoff,
    ).toBeGreaterThan(0);
    expect(moveFor({ weapon: 'polearm', style: 'thrust', power: 1, reach: 1 }).standoff).toBe(0);
    expect(moveFor({ weapon: 'firearm', style: 'shot', power: 1, reach: 4 }).projectile).toBe(
      'shot',
    );
    expect(moveFor({ weapon: 'explosive', style: 'throw', power: 1, reach: 3 }).projectile).toBe(
      'bomb',
    );
  });

  it('winds up longer and hits heavier with more power', () => {
    const light = moveFor({ weapon: 'blade', style: 'slash', power: 0.8, reach: 1 });
    const strong = moveFor({ weapon: 'blade', style: 'slash', power: 1.8, reach: 1 });
    expect(strong.impact).toBeGreaterThan(light.impact);
    expect(strong.heavy).toBe(true);
    expect(light.heavy).toBe(false);
  });

  it('ducks under swings and sidesteps thrusts when avoiding', () => {
    const avoid = (attackStyle: AttackStyle) =>
      reactionFor({
        reaction: 'avoid',
        hit: false,
        defeated: false,
        weapon: 'blade',
        attackStyle,
        heavy: false,
      });
    expect(avoid('slash')[0]!.p.y).toBeLessThan(0);
    expect(avoid('thrust')[0]!.p.z).toBeGreaterThan(0);
  });
});
