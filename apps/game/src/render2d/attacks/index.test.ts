import { describe, expect, it } from 'vitest';
import type { AttackStyle } from '@m1565/core';
import { ATTACK_SCRIPTS, scriptFor } from './index';

const STYLES: AttackStyle[] = [
  'slash',
  'thrust',
  'overhead',
  'sweep',
  'bash',
  'charge',
  'shot',
  'volley',
  'throw',
];

describe('scriptFor', () => {
  it('returns a complete default script for every style', () => {
    for (const s of STYLES) {
      const sc = scriptFor(undefined, s);
      expect(typeof sc.impactFx).toBe('function');
      expect(sc.palette.main).toBeTruthy();
    }
  });
  it('unknown ids fall back to the style default', () => {
    expect(scriptFor('NOPE', 'slash').palette).toEqual(scriptFor(undefined, 'slash').palette);
  });
  it('authored scripts keep their own hooks and inherit the missing ones', () => {
    const own = Object.values(ATTACK_SCRIPTS)[0];
    if (!own) return;
    const id = Object.keys(ATTACK_SCRIPTS)[0]!;
    const sc = scriptFor(id, 'slash');
    expect(sc.impactFx).toBe(own.impactFx);
    expect(sc.palette).toBe(own.palette);
    expect(sc.windup ?? own.windup).toBeTruthy();
  });
});
