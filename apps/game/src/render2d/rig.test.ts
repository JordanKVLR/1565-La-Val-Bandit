import { ARMATURA_MODELS } from '@m1565/content';
import type { FrameClass, WeaponType } from '@m1565/core';
import { describe, expect, it } from 'vitest';
import { POSE_KEYS, guardFor } from '../render/Armatura';
import type { Pose } from '../render/Armatura';
import { createRig } from './rig';

const WEAPONS: WeaponType[] = ['blade', 'polearm', 'blunt', 'firearm', 'explosive'];
const CLASSES: FrameClass[] = ['light', 'medium', 'heavy'];

/** A canvas context that records nothing and accepts everything. */
function fakeCtx(): CanvasRenderingContext2D {
  const state: Record<string, unknown> = {};
  let depth = 0;
  const target = {
    save: () => void depth++,
    restore: () => {
      depth--;
      if (depth < 0) throw new Error('unbalanced restore');
    },
    createLinearGradient: () => ({ addColorStop: () => undefined }),
    createRadialGradient: () => ({ addColorStop: () => undefined }),
  } as Record<string, unknown>;
  const ctx = new Proxy(target, {
    get(t, k: string) {
      if (k in t) return t[k];
      if (k in state) return state[k];
      return () => undefined;
    },
    set(_t, k: string, v) {
      state[k] = v;
      return true;
    },
  });
  (ctx as unknown as { depth: () => number }).depth = () => depth;
  return ctx as unknown as CanvasRenderingContext2D;
}

const EXTREME: Partial<Pose>[] = [
  {},
  { sR: 3.1, eR: 0.4, wR: 0.3, sL: 3.0, eL: 0.5, lean: 0.25, hR: 0.6, kR: -0.9 },
  { x: 1.5, y: -0.38, lean: -0.42, sR: 1.55, eR: 0, sL: -0.6, hR: 1.0, hL: -0.7, kR: -1.7 },
  { fall: 1.52, y: 0.12, x: -1.1, sR: 2.8, sL: 2.6, hR: 0.8, hL: 0.6 },
  { spin: Math.PI * 2, y: -0.1 },
  { spin: Math.PI / 2 },
  { z: 0.8, spin: -1.2, lean: 0.65 },
  { sR: -3, eR: 3, wR: -3, sL: 3.5, eL: -2, kR: 1, kL: -2 },
];

const spec = (
  model: (typeof ARMATURA_MODELS)[number],
  weaponType: WeaponType,
  frameClass: FrameClass,
) => ({ model, weaponType, frameClass, accent: '#2a6fd6' }) as const;

describe('2D rig', () => {
  it('draws every model x weapon x class at the extreme poses without throwing', () => {
    for (const model of ARMATURA_MODELS)
      for (const w of WEAPONS)
        for (const c of CLASSES) {
          const rig = createRig({ ...spec(model, w, c), hero: model === 'knight' }, 0, 1);
          const ctx = fakeCtx();
          for (const [i, p] of EXTREME.entries()) {
            rig.pose = { ...guardFor(w), ...p };
            rig.time = i * 0.37;
            rig.flash = i % 3 === 0 ? 0.9 : 0;
            expect(() => rig.draw(ctx)).not.toThrow();
          }
          expect((ctx as unknown as { depth: () => number }).depth()).toBe(0);
        }
  });

  it('keeps anchors finite for every pose key', () => {
    const rig = createRig(spec('knight', 'blade', 'medium'), 1.2, -1);
    for (const key of POSE_KEYS)
      for (const v of [-3, 0, 3]) {
        rig.pose = { ...guardFor('blade'), [key]: v };
        const a = rig.anchors();
        for (const p of Object.values(a)) {
          expect(Number.isFinite(p.x)).toBe(true);
          expect(Number.isFinite(p.y)).toBe(true);
        }
      }
  });

  it('points the weapon tip along sR + eR + wR', () => {
    for (const w of WEAPONS) {
      const rig = createRig(spec('knight', w, 'medium'), 0, 1);
      rig.pose = { ...guardFor(w), lean: 0, fall: 0, spin: 0, z: 0, sR: 0.9, eR: 0.5, wR: 0.2 };
      rig.time = 0;
      const a = rig.anchors();
      const ang = 0.9 + 0.5 + 0.2;
      const dx = a.tip.x - a.hand.x;
      const dy = a.tip.y - a.hand.y;
      // 0 = down, pi/2 = ahead: direction (sin a, -cos a)
      // swords are exact; guns and grenades sit a little off the axis
      expect(Math.abs(Math.atan2(dx, -dy) - ang)).toBeLessThan(
        w === 'firearm' || w === 'explosive' ? 0.3 : 1e-5,
      );
      expect(Math.hypot(dx, dy)).toBeGreaterThan(0.1);
    }
  });

  it('puts the feet on the ground and the head about 1.8 above', () => {
    const rig = createRig(spec('militia', 'blade', 'medium'), 0, 1);
    const a = rig.anchors();
    expect(a.feet.y).toBeCloseTo(0, 5);
    expect(a.head.y).toBeGreaterThan(1.5);
    expect(a.head.y).toBeLessThan(2.0);
  });

  it('mirrors anchors when facing flips', () => {
    for (const w of WEAPONS) {
      const r = createRig(spec('sipahi', w, 'heavy'), 2, 1);
      const l = createRig(spec('sipahi', w, 'heavy'), 2, -1);
      const pose = { ...guardFor(w), x: 0.4, y: 0.1 };
      r.pose = pose;
      l.pose = pose;
      const a = r.anchors();
      const b = l.anchors();
      for (const k of ['chest', 'head', 'hand', 'offHand', 'tip', 'feet'] as const) {
        expect(b[k].x - 2).toBeCloseTo(-(a[k].x - 2), 5);
        expect(b[k].y).toBeCloseTo(a[k].y, 5);
      }
    }
  });

  it('flash tints with no errors and resets', () => {
    const rig = createRig(spec('machine', 'blunt', 'heavy'), 0, 1);
    const ctx = fakeCtx();
    for (const f of [0, 0.5, 1, 7, -1, Number.NaN]) {
      rig.flash = f;
      expect(() => rig.draw(ctx)).not.toThrow();
    }
  });
});
