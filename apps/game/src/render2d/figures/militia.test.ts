import type { FrameClass, WeaponType } from '@m1565/core';
import { describe, expect, it } from 'vitest';
import { POSE_KEYS, guardFor } from '../../render/Armatura';
import type { Pose } from '../../render/Armatura';
import { createRig } from '../rig';
import { K } from './kit';
import { lookFor } from './index';
import { militiaWeapon } from './militiaArms';
import { styleFor } from './weapons';
import type { WeaponStyle } from './weapons';
import type { F } from './types';

const WEAPONS: WeaponType[] = ['blade', 'polearm', 'blunt', 'firearm', 'explosive'];
const CLASSES: FrameClass[] = ['light', 'medium', 'heavy'];
const MODELS = ['militia', 'gunner'] as const;
const SCALES = [60, 96, 160, 390];

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

interface Probe {
  ctx: CanvasRenderingContext2D;
  depth(): number;
  calls(): number;
}

/** A context that counts calls, keeps save/restore balanced and rejects non-finite numbers. */
function probeCtx(scale: number, stops?: Set<string>): Probe {
  const state: Record<string, unknown> = {};
  let depth = 0;
  let calls = 0;
  const check = (name: string, args: unknown[]): void => {
    for (const a of args)
      if (typeof a === 'number' && !Number.isFinite(a)) throw new Error(`${name}: non-finite ${a}`);
  };
  const target = {
    save: () => void depth++,
    restore: () => {
      depth--;
      if (depth < 0) throw new Error('unbalanced restore');
    },
    getTransform: () => ({ a: scale, b: 0, c: 0, d: -scale }),
    createLinearGradient: (...a: unknown[]) => {
      check('gradient', a);
      return { addColorStop: (_o: number, c: string) => void stops?.add(c) };
    },
    createRadialGradient: () => ({ addColorStop: () => undefined }),
  } as Record<string, unknown>;
  const ctx = new Proxy(target, {
    get(t, k: string) {
      if (k in t) return t[k];
      if (k in state) return state[k];
      return (...a: unknown[]) => {
        calls++;
        check(k, a);
      };
    },
    set(_t, k: string, v) {
      if (typeof v === 'number' && !Number.isFinite(v)) throw new Error(`${k} = ${v}`);
      state[k] = v;
      return true;
    },
  });
  return {
    ctx: ctx as unknown as CanvasRenderingContext2D,
    depth: () => depth,
    calls: () => calls,
  };
}

const spec = (
  model: (typeof MODELS)[number],
  weaponType: WeaponType,
  frameClass: FrameClass,
  extra: { hero?: boolean; accent?: string } = {},
) => ({ model, weaponType, frameClass, accent: extra.accent ?? '#2a6fd6', ...extra }) as const;

describe('militia and gunner figures', () => {
  it('are registered with their own looks', () => {
    expect(lookFor('militia').model).toBe('militia');
    expect(lookFor('gunner').model).toBe('gunner');
    expect(lookFor('militia').segment).toBeTypeOf('function');
    expect(lookFor('gunner').segment).toBeTypeOf('function');
  });

  it('draw every variant at four scales (all LODs) and every extreme pose without throwing', () => {
    for (const model of MODELS)
      for (const w of WEAPONS)
        for (const c of CLASSES)
          for (const hero of [false, true])
            for (const face of [1, -1] as const)
              for (const scale of SCALES) {
                const rig = createRig(
                  spec(model, w, c, { hero, accent: scale % 2 ? '#c0161f' : '#2f7d3a' }),
                  0,
                  face,
                );
                const p = probeCtx(scale);
                for (const [i, pose] of EXTREME.entries()) {
                  rig.pose = { ...guardFor(w), ...pose };
                  rig.time = i * 0.41;
                  rig.flash = i % 3 === 0 ? 0.9 : 0;
                  expect(() => rig.draw(p.ctx)).not.toThrow();
                }
                expect(p.depth()).toBe(0);
                expect(p.calls()).toBeGreaterThan(40);
                for (const v of Object.values(rig.anchors()))
                  expect(Number.isFinite(v.x + v.y)).toBe(true);
              }
  });

  it('draw the simpler map-scale art with fewer calls than the duel-scale art', () => {
    for (const model of MODELS) {
      const rig = createRig(spec(model, 'blade', 'medium'), 0, 1);
      const map = probeCtx(70);
      rig.draw(map.ctx);
      expect(K.lod).toBe(0);
      const duel = probeCtx(400);
      rig.draw(duel.ctx);
      expect(K.lod).toBe(2);
      expect(map.calls()).toBeLessThan(duel.calls());
    }
  });

  it('keep every pose key finite for the anchors', () => {
    for (const model of MODELS) {
      const rig = createRig(spec(model, 'firearm', 'light'), 1.2, -1);
      for (const key of POSE_KEYS)
        for (const v of [-3, 0, 3]) {
          rig.pose = { ...guardFor('firearm'), [key]: v };
          for (const a of Object.values(rig.anchors())) {
            expect(Number.isFinite(a.x)).toBe(true);
            expect(Number.isFinite(a.y)).toBe(true);
          }
        }
    }
  });

  it('stand about as tall as the other armaturas, feet on the ground', () => {
    for (const model of MODELS) {
      const a = createRig(spec(model, 'blade', 'medium'), 0, 1).anchors();
      expect(a.feet.y).toBeCloseTo(0, 5);
      expect(a.head.y).toBeGreaterThan(1.5);
      expect(a.head.y).toBeLessThan(2.0);
    }
  });

  it('carry every weapon of their kit through the figure and decline foreign styles', () => {
    for (const model of MODELS)
      for (const w of WEAPONS) {
        const rig = createRig(spec(model, w, 'medium'), 0, 1);
        const p = probeCtx(300);
        expect(() => rig.draw(p.ctx)).not.toThrow();
        expect(styleFor(model, w)).toBeTypeOf('string');
      }
    const fake = { spec: { model: 'militia' } } as unknown as F;
    for (const s of ['sabre', 'pike', 'lance', 'boarding', 'musket', 'steamgun', 'piston'] as const)
      expect(militiaWeapon(fake, s as WeaponStyle)).toBe(false);
  });

  it('keep the shield for sword and maul fighters only (militia), none for gunners', () => {
    const m = lookFor('militia');
    expect(m.shieldWith?.('blunt')).toBe(true);
    expect(m.shieldWith?.('blade')).toBe(true);
    expect(m.shieldWith?.('firearm')).toBe(false);
    expect(m.shieldWith?.('polearm')).toBe(false);
    expect(lookFor('gunner').shield).toBeUndefined();
  });

  it('show the side colour: another accent changes the gradients drawn', () => {
    for (const model of MODELS)
      for (const w of ['blade', 'firearm'] as const) {
        const stops = (accent: string): Set<string> => {
          const seen = new Set<string>();
          const p = probeCtx(300, seen);
          createRig(spec(model, w, 'medium', { accent }), 0, 1).draw(p.ctx);
          return seen;
        };
        const a = stops('#12ab34');
        const b = stops('#ab1234');
        expect([...a].some((c) => !b.has(c))).toBe(true);
        expect([...b].some((c) => !a.has(c))).toBe(true);
      }
  });
});
