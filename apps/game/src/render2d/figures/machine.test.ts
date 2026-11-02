import type { FrameClass, WeaponType } from '@m1565/core';
import { describe, expect, it } from 'vitest';
import { guardFor } from '../../render/Armatura';
import type { Pose } from '../../render/Armatura';
import { createRig } from '../rig';
import { K } from './kit';

const WEAPONS: WeaponType[] = ['blade', 'polearm', 'blunt', 'firearm', 'explosive'];
const CLASSES: FrameClass[] = ['light', 'medium', 'heavy'];

/** A canvas context that accepts everything and checks that save/restore stay balanced. */
function fakeCtx(scale: number): CanvasRenderingContext2D {
  const state: Record<string, unknown> = {};
  let depth = 0;
  const target = {
    save: () => void depth++,
    restore: () => {
      depth--;
      if (depth < 0) throw new Error('unbalanced restore');
    },
    getTransform: () => ({ a: scale, b: 0, c: 0, d: -scale }),
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

const spec = (weaponType: WeaponType, frameClass: FrameClass, hero = false) =>
  ({ model: 'machine', weaponType, frameClass, accent: '#2a6fd6', hero }) as const;

describe('machine figures (prototipo, colossus)', () => {
  it('draws every weapon x class x livery at four scales and both facings', () => {
    for (const w of WEAPONS)
      for (const c of CLASSES)
        for (const hero of [false, true])
          for (const face of [1, -1] as const)
            for (const scale of [50, 96, 160, 390]) {
              const rig = createRig(spec(w, c, hero), 0, face);
              const ctx = fakeCtx(scale);
              for (const [i, p] of EXTREME.entries()) {
                rig.pose = { ...guardFor(w), ...p };
                rig.time = i * 0.41;
                rig.flash = i % 2 ? 0.7 : 0;
                expect(() => rig.draw(ctx)).not.toThrow();
              }
              expect((ctx as unknown as { depth: () => number }).depth()).toBe(0);
              for (const v of Object.values(rig.anchors()))
                expect(Number.isFinite(v.x + v.y)).toBe(true);
            }
  });

  it('uses all three levels of detail', () => {
    const rig = createRig(spec('blunt', 'heavy'), 0, 1);
    const seen: number[] = [];
    for (const scale of [60, 150, 400]) {
      rig.draw(fakeCtx(scale));
      seen.push(K.lod);
    }
    expect(seen).toEqual([0, 1, 2]);
  });

  it('streams the exhaust with the stride without breaking', () => {
    const rig = createRig(spec('firearm', 'medium'), 0, 1);
    const ctx = fakeCtx(300);
    for (let i = 0; i < 40; i++) {
      rig.pose = { ...guardFor('firearm'), x: i * 0.05 };
      rig.time = i / 30;
      expect(() => rig.draw(ctx)).not.toThrow();
    }
    expect((ctx as unknown as { depth: () => number }).depth()).toBe(0);
  });

  it('keeps anchors finite and the colossus no shorter than the prototipo', () => {
    const a = createRig(spec('blunt', 'medium'), 0, 1).anchors();
    const b = createRig(spec('blunt', 'heavy'), 0, 1).anchors();
    for (const v of [...Object.values(a), ...Object.values(b)]) {
      expect(Number.isFinite(v.x)).toBe(true);
      expect(Number.isFinite(v.y)).toBe(true);
    }
    expect(b.head.y).toBeGreaterThanOrEqual(a.head.y - 1e-6);
  });
});
