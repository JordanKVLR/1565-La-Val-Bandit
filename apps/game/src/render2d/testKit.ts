/** Test helpers: a canvas whose 2D context accepts any call, and a stub rig. */
import type { FighterAnchors, FigureSpec, Rig } from './contract';
import { guardFor } from '../render/Armatura';

export function fakeCtx(): CanvasRenderingContext2D {
  const grad = { addColorStop: () => undefined };
  const target: Record<string, unknown> = {};
  return new Proxy(target, {
    get(t, k: string) {
      if (k in t) return t[k];
      if (k.startsWith('create')) return () => grad;
      if (k === 'measureText') return () => ({ width: 10 });
      return () => undefined;
    },
    set(t, k: string, v) {
      t[k] = v;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

export function fakeCanvas(w = 640, h = 360): HTMLCanvasElement {
  const ctx = fakeCtx();
  return {
    clientWidth: w,
    clientHeight: h,
    width: w,
    height: h,
    getContext: () => ctx,
    getBoundingClientRect: () => ({ width: w, height: h }),
  } as unknown as HTMLCanvasElement;
}

export function stubRig(spec: FigureSpec, baseX: number, facing: 1 | -1): Rig {
  const rig: Rig = {
    spec,
    baseX,
    facing,
    pose: { ...guardFor(spec.weaponType) },
    time: 0,
    flash: 0,
    anchors(): FighterAnchors {
      const x = rig.baseX + rig.pose.x * rig.facing;
      const p = (dx: number, y: number) => ({ x: x + dx * rig.facing, y: y + rig.pose.y });
      return { chest: p(0, 1.1), head: p(0, 1.6), hand: p(0.5, 1.1), offHand: p(0.3, 1), tip: p(1.1, 1.1), feet: p(0, 0) };
    },
    draw: () => undefined,
  };
  return rig;
}
