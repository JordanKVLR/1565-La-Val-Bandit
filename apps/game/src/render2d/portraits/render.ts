/**
 * Draws a cast portrait: backdrop, hair/hood behind, body, head with expression, hair and
 * headwear in front. Optional micro-motion (breathing, blinking, a tiny sway) for story scenes.
 */
import type { CastArt, Setting } from './artTypes';
import { MALTA_CAST } from './castMalta';
import { OTTOMAN_CAST } from './castOttoman';
import { EXPR, type ExprParams, type Expression, lerpExpr } from './expressions';
import { drawFace } from './face';
import { HEAD_X, HEAD_Y } from './parts';
import {
  type Ctx,
  U,
  alpha,
  circle,
  clipped,
  ellipse,
  flat,
  lightOf,
  mix,
  poly,
  rng,
  shadeOf,
} from './kit';

export const CAST: Readonly<Record<string, CastArt>> = Object.fromEntries(
  [...MALTA_CAST, ...OTTOMAN_CAST].map((a) => [a.id, a]),
);
export const CAST_IDS: readonly string[] = [...MALTA_CAST, ...OTTOMAN_CAST].map((a) => a.id);

export function hasPortrait(id: string | null | undefined): boolean {
  return !!id && id in CAST;
}

export interface MotionState {
  /** Seconds. */
  time: number;
}

/** 0..1 blink amount at a time, with a deterministic, per-character rhythm. */
export function blinkAt(time: number, seed = 1): number {
  const period = 3.4 + (seed % 7) * 0.23;
  const k = Math.floor(time / period);
  const r = rng(k * 7919 + seed * 131)();
  const start = k * period + 0.6 + r * (period - 1.4);
  const dt = time - start;
  const dur = 0.16;
  if (dt < 0 || dt > dur) return 0;
  return Math.sin((dt / dur) * Math.PI);
}

const SKY: Record<Setting, [string, string]> = {
  stone: ['#d9c9a6', '#8a7a5e'],
  sky: ['#bcd8e6', '#d9c58c'],
  sea: ['#a9cfe0', '#5d8ea6'],
  workshop: ['#f0b968', '#7a4a2a'],
  tent: ['#d98a6a', '#6a3a46'],
  night: ['#5a6a8e', '#241f33'],
};

function backdrop(c: Ctx, art: CastArt): void {
  const [top, bot] = SKY[art.setting];
  const t = mix(top, art.accent, 0.28);
  const b = mix(bot, art.accent, 0.35);
  const g = c.createLinearGradient(0, 0, 0, U);
  g.addColorStop(0, t);
  g.addColorStop(1, b);
  c.fillStyle = g;
  c.fillRect(0, 0, U, U);
  const halo = c.createRadialGradient(100, 70, 6, 100, 80, 96);
  halo.addColorStop(0, alpha(lightOf(t, 0.5), 0.85));
  halo.addColorStop(1, alpha(t, 0));
  c.fillStyle = halo;
  c.fillRect(0, 0, U, U);
  const dark = shadeOf(b, 0.45);
  switch (art.setting) {
    case 'stone':
      for (let r = 0; r < 6; r++)
        for (let i = 0; i < 5; i++)
          flat(
            c,
            poly([
              [i * 48 - (r % 2) * 24 + 2, r * 36 + 2],
              [i * 48 - (r % 2) * 24 + 46, r * 36 + 2],
              [i * 48 - (r % 2) * 24 + 46, r * 36 + 34],
              [i * 48 - (r % 2) * 24 + 2, r * 36 + 34],
            ]),
            alpha(dark, 0.1 + ((i + r) % 3) * 0.04),
          );
      break;
    case 'sky':
      flat(c, circle(156, 44, 16), alpha('#fff3c4', 0.8));
      flat(c, ellipse(40, 150, 90, 38), alpha('#8a9a5a', 0.7));
      flat(c, ellipse(170, 160, 80, 34), alpha('#a8a060', 0.7));
      break;
    case 'sea':
      flat(
        c,
        poly([
          [0, 120],
          [200, 120],
          [200, 200],
          [0, 200],
        ]),
        alpha('#3d6f8a', 0.55),
      );
      for (const [x, s] of [
        [30, 1],
        [150, 1.3],
        [178, 0.8],
      ] as const) {
        flat(
          c,
          poly([
            [x, 120 - 30 * s],
            [x + 14 * s, 120],
            [x, 120],
          ]),
          alpha('#f3ecd6', 0.8),
        );
        flat(
          c,
          poly([
            [x - 2, 120 - 22 * s],
            [x - 12 * s, 120],
            [x - 2, 120],
          ]),
          alpha('#e8dcc0', 0.8),
        );
      }
      break;
    case 'workshop':
      flat(c, circle(150, 60, 34), alpha('#ffdc8a', 0.5));
      flat(c, circle(150, 60, 20), alpha('#ff9a3a', 0.55));
      for (let i = 0; i < 4; i++)
        flat(
          c,
          poly([
            [12 + i * 12, 30],
            [16 + i * 12, 30],
            [16 + i * 12, 80 + (i % 2) * 14],
            [12 + i * 12, 80 + (i % 2) * 14],
          ]),
          alpha('#3a2414', 0.4),
        );
      break;
    case 'tent':
      for (let i = 0; i < 5; i++)
        flat(
          c,
          poly([
            [i * 44 - 10, 0],
            [i * 44 + 22, 0],
            [i * 44 + 12, 200],
            [i * 44 - 20, 200],
          ]),
          alpha(i % 2 ? '#f0c88a' : '#6a2a3a', 0.16),
        );
      break;
    case 'night':
      flat(c, circle(40, 50, 30), alpha('#ff9a3a', 0.26));
      for (let i = 0; i < 14; i++)
        flat(c, circle(((i * 53) % 190) + 5, ((i * 37) % 90) + 6, 1.1), alpha('#fff3d2', 0.7));
      flat(
        c,
        poly([
          [0, 130],
          [30, 112],
          [60, 130],
          [60, 200],
          [0, 200],
        ]),
        alpha('#14101e', 0.5),
      );
      break;
  }
  // arch frame behind the head
  c.save();
  c.strokeStyle = alpha('#fff3d2', 0.18);
  c.lineWidth = 5;
  c.beginPath();
  c.arc(100, 90, 78, Math.PI, 0);
  c.stroke();
  c.restore();
}

export interface DrawOpts {
  /** Show a backdrop (default true). */
  bg?: boolean;
  /** Seconds for breathing and blinking; omit for a still frame. */
  time?: number;
  /** Explicit expression parameters (for tweens); overrides `expression`. */
  params?: ExprParams;
}

/** Draws into the 200 x 200 design square at the current transform. */
export function drawPortraitU(c: Ctx, id: string, expression: Expression, o: DrawOpts = {}): void {
  const art = CAST[id] ?? CAST['soldier']!;
  const e = o.params ?? EXPR[expression];
  const f = art.face;
  const t = o.time;
  let breath = 0;
  let sway = 0;
  let blink = 0;
  let params = e;
  if (t !== undefined) {
    breath = Math.sin(t * 1.9);
    sway = Math.sin(t * 0.7 + id.length);
    blink = blinkAt(t, id.length * 5 + id.charCodeAt(0));
    // the eyes wander a little
    params = lerpExpr(
      e,
      { ...e, gx: e.gx + Math.sin(t * 0.43) * 0.3, gy: e.gy + Math.sin(t * 0.31 + 1) * 0.12 },
      1,
    );
  }
  c.save();
  c.beginPath();
  c.rect(0, 0, U, U);
  c.clip();
  if (o.bg !== false) backdrop(c, art);
  const z = art.zoom ?? 1.25;
  c.translate(100, 206);
  c.scale(z, z);
  c.translate(-100, -206);
  const bodyDy = params.shoulders * 0.7 + breath * 1.1;
  const headDy = params.dy + breath * 0.8;
  c.save();
  c.translate(HEAD_X, HEAD_Y + headDy);
  c.rotate(((params.tiltDeg + sway * 0.7) * Math.PI) / 180);
  c.translate(0, 0);
  art.back?.(c, f, params);
  c.restore();
  c.save();
  c.translate(0, bodyDy);
  art.body(c, f, params);
  c.restore();
  c.save();
  c.translate(HEAD_X, HEAD_Y + headDy);
  c.rotate(((params.tiltDeg + sway * 0.7) * Math.PI) / 180);
  art.mid?.(c, f, params);
  drawFace(c, f, params, blink);
  art.front?.(c, f, params);
  c.restore();
  c.restore();
  void clipped;
}
