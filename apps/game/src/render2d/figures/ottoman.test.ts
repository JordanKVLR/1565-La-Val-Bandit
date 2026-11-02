import type { FrameClass, WeaponType } from '@m1565/core';
import { describe, expect, it } from 'vitest';
import { guardFor } from '../../render/Armatura';
import type { Pose } from '../../render/Armatura';
import { createRig } from '../rig';

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

const WEAPONS: WeaponType[] = ['blade', 'polearm', 'blunt', 'firearm', 'explosive'];
const CLASSES: FrameClass[] = ['light', 'medium', 'heavy'];
const POSES: Partial<Pose>[] = [
  {},
  { sR: 3.1, eR: 0.4, wR: 0.3, sL: 3.0, eL: 0.5, lean: 0.25, hR: 0.6, kR: -0.9 },
  { x: 1.5, y: -0.38, lean: -0.42, sR: 1.55, sL: -0.6, hR: 1.0, hL: -0.7, kR: -1.7 },
  { fall: 1.52, y: 0.12, x: -1.1, sR: 2.8, sL: 2.6, hR: 0.8, hL: 0.6 },
  { spin: Math.PI * 2, y: -0.1 },
  { z: 0.8, spin: -1.2, lean: 0.65 },
  { sR: -3, eR: 3, wR: -3, sL: 3.5, eL: -2, kR: 1, kL: -2 },
];

describe.each(['janissary', 'sipahi'] as const)('%s figure', (model) => {
  it('draws every variant at four scales, mirrored, in extreme poses', () => {
    for (const w of WEAPONS)
      for (const c of CLASSES)
        for (const hero of [false, true])
          for (const face of [1, -1] as const)
            for (const scale of [60, 100, 160, 390]) {
              const rig = createRig(
                { model, weaponType: w, frameClass: c, accent: '#2a6fd6', hero },
                0,
                face,
              );
              const ctx = fakeCtx(scale);
              for (const [i, p] of POSES.entries()) {
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
});
