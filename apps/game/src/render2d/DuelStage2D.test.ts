import { describe, expect, it } from 'vitest';
import type { AttackStyle, Reaction, WeaponType } from '@m1565/core';
import { DuelStage2D, FIT_UNITS, MAX_UNIT_HEIGHT, MAX_ZOOM, duelScale } from './DuelStage2D';
import { fakeCanvas } from './testKit';

const STYLES: [AttackStyle, WeaponType][] = [
  ['slash', 'blade'],
  ['thrust', 'polearm'],
  ['overhead', 'blade'],
  ['sweep', 'blade'],
  ['bash', 'blunt'],
  ['charge', 'polearm'],
  ['shot', 'firearm'],
  ['volley', 'firearm'],
  ['throw', 'explosive'],
];
const spec = (weaponType: WeaponType) => ({
  model: 'knight' as const,
  weaponType,
  frameClass: 'medium' as const,
  accent: '#f00',
});

function drive(stage: DuelStage2D, p: Promise<void>): Promise<void> {
  let done = false;
  void p.then(() => (done = true));
  return (async () => {
    for (let i = 0; i < 2000 && !done; i++) {
      stage.advance(1 / 30);
      stage.render();
      await Promise.resolve();
    }
    await p;
  })();
}

describe('DuelStage2D', () => {
  const cases: { hit: boolean; defeated: boolean; reaction: Reaction }[] = [
    { hit: true, defeated: false, reaction: 'none' },
    { hit: false, defeated: false, reaction: 'avoid' },
    { hit: true, defeated: true, reaction: 'none' },
    { hit: false, defeated: false, reaction: 'defend' },
    { hit: false, defeated: false, reaction: 'counter' },
  ];
  for (const [style, weapon] of STYLES) {
    it(`${style}: resolves and impacts exactly once for hit, miss, block, counter, defeat`, async () => {
      for (const c of cases) {
        const stage = new DuelStage2D(fakeCanvas(), spec(weapon), spec('blade'), '#5b6b35', 1, {
          manual: true,
        });
        let impacts = 0;
        const p = stage.playStrike({ attacker: 'left', style, ...c, onImpact: () => impacts++ });
        await drive(stage, p);
        expect(impacts).toBe(1);
        stage.dispose();
      }
    });
  }

  it('plays right-to-left and back to back', async () => {
    const stage = new DuelStage2D(fakeCanvas(), spec('blade'), spec('firearm'), '#5b6b35', 1, {
      manual: true,
    });
    let n = 0;
    const a = stage.playStrike({
      attacker: 'right',
      style: 'shot',
      hit: true,
      defeated: false,
      reaction: 'none',
      onImpact: () => n++,
    });
    const b = stage.playStrike({
      attacker: 'left',
      style: 'slash',
      hit: true,
      defeated: false,
      reaction: 'none',
      onImpact: () => n++,
    });
    await drive(
      stage,
      Promise.all([a, b]).then(() => undefined),
    );
    expect(n).toBe(2);
  });

  it('is deterministic: two runs give the same strike length', () => {
    const mk = () => {
      const s = new DuelStage2D(fakeCanvas(), spec('blade'), spec('blade'), '#5b6b35', 1, {
        manual: true,
      });
      s.beginStrike({
        attacker: 'left',
        style: 'slash',
        hit: true,
        defeated: true,
        reaction: 'none',
      });
      let steps = 0;
      while (s.striking && steps < 5000) {
        s.advance(1 / 60);
        steps++;
      }
      return steps;
    };
    expect(mk()).toBe(mk());
  });
});

describe('duel framing', () => {
  const FIGURE_UNITS = 2.3; // a fighter, plume included, in world units
  it('keeps the fighters near half the canvas height on phone and TV canvases', () => {
    for (const [w, h] of [
      [640, 300],
      [851, 393],
      [1280, 720],
      [1920, 1080],
      [2560, 1080],
      [1024, 768],
    ] as const) {
      const rest = (FIGURE_UNITS * duelScale(w, h)) / h;
      expect(rest).toBeLessThanOrEqual(0.53);
      expect(rest).toBeGreaterThanOrEqual(0.33);
      // Even at the zoom cap they stay inside the frame.
      expect(rest * MAX_ZOOM).toBeLessThanOrEqual(0.7);
    }
  });

  it('fits the pair across the width, and pulls back for a standoff', () => {
    expect(duelScale(640, 1000)).toBeCloseTo(640 / FIT_UNITS);
    expect(duelScale(4000, 300)).toBeCloseTo(300 * MAX_UNIT_HEIGHT);
    expect(duelScale(640, 300, 1.4)).toBeLessThan(duelScale(640, 300));
  });
});
