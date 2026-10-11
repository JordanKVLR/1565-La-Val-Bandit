/**
 * Militia attack scripts: Maltese farmers, fishermen and arquebusiers fighting with improvised
 * tools. Homespun palette: earth, wheat, limestone and Maltese red. Pure presentation.
 */
import type { Key, Move } from '../../render/duelMoves';
import type { AttackScripts, FxContext, V2 } from '../contract';
import { eng, face, hitPoint, outcomeOf } from './styleDefaults';

const TAU = Math.PI * 2;
const RED = '#b3261e';
const LIME = '#e6d9b8';
const WHEAT = '#f0d27a';
const BOARD = '#8a5a2b';

// ── choreography helpers ──

/** Shifts and scales a move in time, with extra keys played before it. */
function retime(base: Move, dt: number, scale: number, pre: readonly Key[]): Move {
  const s = (t: number) => dt + t * scale;
  return {
    ...base,
    keys: [...pre, ...base.keys.map((k) => ({ t: s(k.t), p: k.p }))],
    impact: s(base.impact),
    release: base.release ? s(base.release) : 0,
    trail: base.trail ? [s(base.trail[0]), s(base.trail[1])] : null,
    dust: base.dust.map(s),
  };
}

/** Holds key `idx` for `dur` more seconds (a pause, a breath, a tremble) and delays the rest. */
function hold(base: Move, idx: number, dur: number): Move {
  const k = base.keys[idx]!;
  const sh = (t: number) => (t > k.t ? t + dur : t);
  return {
    ...base,
    keys: [
      ...base.keys.slice(0, idx + 1),
      { t: k.t + dur, p: k.p },
      ...base.keys.slice(idx + 1).map((x) => ({ t: x.t + dur, p: x.p })),
    ],
    impact: sh(base.impact),
    release: base.release ? sh(base.release) : 0,
    trail: base.trail ? [sh(base.trail[0]), sh(base.trail[1])] : null,
    dust: base.dust.map(sh),
  };
}

function advOf(base: Move): number {
  let best = 0;
  let bd = 9;
  for (const k of base.keys) {
    const d = Math.abs(k.t - base.impact);
    if (d < bd && k.p.x !== undefined) {
      bd = d;
      best = k.p.x;
    }
  }
  return best;
}

// ── sprite painters (module level: no per-strike closures) ──
type Paint = (ctx: CanvasRenderingContext2D, p: V2, ang: number, k: number) => void;

const paintStalk: Paint = (ctx, p, _a, k) => {
  ctx.translate(p.x, p.y);
  ctx.rotate(k * 9 + p.x * 2);
  ctx.globalAlpha = 1 - k * k * 0.7;
  ctx.strokeStyle = '#c9972b';
  ctx.lineWidth = 0.025;
  ctx.beginPath();
  ctx.moveTo(-0.17, 0);
  ctx.lineTo(0.1, 0);
  ctx.stroke();
  ctx.fillStyle = WHEAT;
  ctx.beginPath();
  ctx.ellipse(0.16, 0, 0.09, 0.03, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0.1, 0.03, 0.05, 0.02, 0.6, 0, TAU);
  ctx.fill();
};

const paintChip: Paint = (ctx, p, _a, k) => {
  ctx.translate(p.x, p.y);
  ctx.rotate(k * 12 + p.y * 3);
  ctx.globalAlpha = 1 - k * k * 0.6;
  ctx.fillStyle = BOARD;
  ctx.fillRect(-0.09, -0.025, 0.18, 0.05);
  ctx.fillStyle = '#c58a4a';
  ctx.fillRect(-0.09, -0.025, 0.18, 0.015);
};

const paintStone: Paint = (ctx, p, _a, k) => {
  ctx.translate(p.x, p.y);
  ctx.rotate(k * 7 + p.x);
  ctx.globalAlpha = 1 - k * k * 0.5;
  ctx.fillStyle = LIME;
  ctx.beginPath();
  ctx.moveTo(-0.08, -0.04);
  ctx.lineTo(0.02, -0.08);
  ctx.lineTo(0.09, 0.0);
  ctx.lineTo(0.0, 0.07);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(-0.02, -0.01, 0.1, 0.03);
};

const paintPod: Paint = (ctx, p, _a, k) => {
  ctx.translate(p.x, p.y);
  ctx.rotate(k * 8 + p.x * 2);
  ctx.globalAlpha = 1 - k * k * 0.5;
  ctx.strokeStyle = '#4a2a14';
  ctx.lineCap = 'round';
  ctx.lineWidth = 0.075;
  ctx.beginPath();
  ctx.moveTo(-0.17, -0.03);
  ctx.quadraticCurveTo(0, 0.09, 0.17, -0.02);
  ctx.stroke();
  ctx.strokeStyle = '#7a4a28';
  ctx.lineWidth = 0.025;
  ctx.beginPath();
  ctx.moveTo(-0.14, -0.015);
  ctx.quadraticCurveTo(0, 0.08, 0.14, -0.005);
  ctx.stroke();
};

const paintDrop: Paint = (ctx, p, _a, k) => {
  ctx.translate(p.x, p.y);
  ctx.globalAlpha = 0.9 * (1 - k);
  ctx.fillStyle = '#cfeeee';
  ctx.beginPath();
  ctx.ellipse(0, 0, 0.035, 0.05, 0, 0, TAU);
  ctx.fill();
};

/** Throws `n` painted bits from `at` along world angle `ang`, tumbling and falling. */
function fling(
  c: FxContext,
  paint: Paint,
  at: V2,
  n: number,
  ang: number,
  spread: number,
  dist: number,
  life: number,
  lift = 0.5,
): void {
  const fx = eng(c);
  for (let i = 0; i < n; i++) {
    const a = ang + (fx.rand() - 0.5) * spread;
    const d = dist * (0.45 + fx.rand() * 0.55);
    fx.sprite({
      from: { x: at.x, y: at.y },
      to: { x: at.x + Math.cos(a) * d, y: Math.max(0.05, at.y + Math.sin(a) * d * 0.6 - 0.35) },
      life: life * (0.8 + fx.rand() * 0.4),
      arc: lift * (0.6 + fx.rand()),
      paint,
    });
  }
}

/** A tapered crescent swept from angle a0 to a1 (world angles, already faced), fading. */
function crescent(
  c: FxContext,
  at: V2,
  r: number,
  a0: number,
  a1: number,
  thick: number,
  col: string,
  core: string,
  life: number,
  squash = 1,
): void {
  const cx = at.x;
  const cy = at.y;
  eng(c).layer('front', life, (ctx, k) => {
    const head = Math.min(1, k * 3.2);
    const tail = Math.max(0, k * 1.5 - 0.2);
    if (head <= tail) return;
    ctx.globalCompositeOperation = 'lighter';
    for (let pass = 0; pass < 2; pass++) {
      ctx.fillStyle = pass === 0 ? col : core;
      ctx.globalAlpha = (1 - k) * (pass === 0 ? 0.75 : 0.95);
      const th = pass === 0 ? thick : thick * 0.4;
      ctx.beginPath();
      const N = 14;
      for (let i = 0; i <= N; i++) {
        const u = tail + ((head - tail) * i) / N;
        const a = a0 + (a1 - a0) * u;
        const rr = r + th * Math.sin(Math.PI * ((u - tail) / (head - tail || 1))) * 0.5;
        const px = cx + Math.cos(a) * rr;
        const py = cy + Math.sin(a) * rr * squash;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      for (let i = N; i >= 0; i--) {
        const u = tail + ((head - tail) * i) / N;
        const a = a0 + (a1 - a0) * u;
        const rr = r - th * Math.sin(Math.PI * ((u - tail) / (head - tail || 1))) * 0.5;
        ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * squash);
      }
      ctx.closePath();
      ctx.fill();
    }
  });
}

/** Parallel streaks from the weapon hand through the tip (tines, spear drives). */
function streaks(
  c: FxContext,
  offsets: readonly number[],
  col: string,
  life: number,
  extend: number,
  w: number,
): void {
  const a = c.attacker.anchors();
  const x0 = a.hand.x;
  const y0 = a.hand.y;
  const x1 = a.tip.x + c.dir * extend;
  const y1 = a.tip.y;
  const dir = c.dir;
  eng(c).layer('front', life, (ctx, k) => {
    const u = Math.min(1, k * 4);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 1 - k;
    ctx.lineCap = 'round';
    for (let i = 0; i < offsets.length; i++) {
      const o = offsets[i]!;
      ctx.strokeStyle = i % 2 === 0 ? col : '#ffffff';
      ctx.lineWidth = w * (1 - k * 0.6);
      ctx.beginPath();
      ctx.moveTo(x0 + dir * 0.4, y0 + o);
      ctx.lineTo(x0 + (x1 - x0) * u, y0 + o + (y1 - y0) * u);
      ctx.stroke();
    }
  });
}

/** A jagged crack along the ground spreading from x0 in direction sx. */
function crack(c: FxContext, x0: number, sx: number, len: number, col: string, life: number): void {
  const n = 9;
  const jit: number[] = [];
  for (let i = 0; i < n; i++) jit.push((eng(c).rand() - 0.5) * 0.16);
  eng(c).layer('back', life, (ctx, k) => {
    const u = Math.min(1, k * 5);
    ctx.globalAlpha = 1 - k * k;
    ctx.strokeStyle = col;
    ctx.lineWidth = 0.05;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, 0.03);
    for (let i = 1; i < n; i++) {
      const f = (i / (n - 1)) * u;
      ctx.lineTo(x0 + sx * len * f, 0.03 + jit[i]! * (i % 2 ? 1 : -1) * 0.7);
    }
    ctx.stroke();
  });
}

/** Muzzle flash and a tracer that ends on the defender (or flies past on a miss). */
function muzzle(c: FxContext, col: string, scale: number): V2 {
  const fx = eng(c);
  const m = c.attacker.anchors().tip;
  const at = { x: m.x, y: m.y };
  fx.glow(at, { radius: 0.9 * scale, color: '#ffd37a', life: 0.14 });
  fx.burst(at, { n: 7, color: '#ffe9a0', length: 0.55 * scale, life: 0.16 });
  fx.spark(at, {
    n: Math.round(9 * scale),
    color: col,
    speed: 8,
    dir: face(0, c.dir),
    spread: 0.8,
  });
  fx.smoke(at, { n: Math.ceil(4 * scale), size: 0.14 * scale, rise: 0.4 });
  return at;
}

function shoot(
  c: FxContext,
  from: V2,
  to: V2,
  life: number,
  col: string,
  len: number,
  w: number,
  onEnd?: () => void,
): void {
  eng(c).sprite({
    from,
    to,
    life,
    trail: col,
    paint: (ctx, p, ang) => {
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.ellipse(0, 0, len, w, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(len * 0.1, 0, len * 0.5, w * 0.5, 0, 0, TAU);
      ctx.fill();
    },
    ...(onEnd ? { onEnd } : {}),
  });
}

/** Where a shot lands: the target point on a hit/block, a point just past the shoulder otherwise. */
function aimAt(c: FxContext, dy: number): V2 {
  const d = c.defender.anchors().chest;
  const strike = c.hit || c.reaction === 'defend';
  return strike
    ? { x: d.x - c.dir * 0.12, y: d.y + dy }
    : { x: d.x + c.dir * 0.9, y: d.y + dy + 0.5 };
}

/** A shrinking reticle on a world point for `life` seconds. */
function reticle(c: FxContext, at: V2, r0: number, r1: number, col: string, life: number): void {
  const x = at.x;
  const y = at.y;
  eng(c).layer('front', life, (ctx, k) => {
    const r = r0 + (r1 - r0) * (k * k * (3 - 2 * k));
    ctx.globalAlpha = 0.35 + 0.6 * k;
    ctx.strokeStyle = col;
    ctx.lineWidth = 0.035;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - r * 1.5, y);
    ctx.lineTo(x - r * 0.4, y);
    ctx.moveTo(x + r * 0.4, y);
    ctx.lineTo(x + r * 1.5, y);
    ctx.moveTo(x, y - r * 1.5);
    ctx.lineTo(x, y - r * 0.4);
    ctx.moveTo(x, y + r * 0.4);
    ctx.lineTo(x, y + r * 1.5);
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y, 0.025 + 0.03 * k, 0, TAU);
    ctx.fill();
  });
}

const up = Math.PI / 2;

export const MILITIA_SCRIPTS: AttackScripts = {
  // ── Fisherman's Hook-Cut: a low crouch, then a curling cut that draws a fish-hook in the air ──
  'militia-hook-cut': {
    palette: { main: '#dfeeea', accent: '#d7503a', dark: '#243a3c' },
    choreograph: (base) =>
      retime(base, 0.18, 0.92, [
        {
          t: 0.1,
          p: {
            y: -0.22,
            x: -0.1,
            lean: 0.25,
            sR: 0.2,
            eR: 1.1,
            hR: 0.6,
            kR: -0.9,
            hL: -0.2,
            kL: -0.5,
          },
        },
      ]),
    windup: (c) => {
      const fx = eng(c);
      if (c.t > 0.1 && (Math.floor(c.t * 40) & 1) === 0) {
        const t = c.attacker.anchors().tip;
        fx.spark(t, { n: 1, color: '#cfeeee', speed: 2.4, dir: up, spread: 2.4, size: 0.03 });
      }
      if (c.t >= c.impact - 0.2 && fx.once('hook')) {
        const a = c.attacker.anchors().chest;
        crescent(
          c,
          { x: a.x + c.dir * 0.2, y: a.y + 0.15 },
          1.15,
          face(2.6, c.dir),
          face(-0.9, c.dir),
          0.55,
          '#8fd0d0',
          '#ffffff',
          0.32,
        );
      }
    },
    impactFx: (c) => {
      const fx = eng(c);
      const o = outcomeOf(c);
      const p = hitPoint(c);
      const d = c.dir;
      const hook = (ctx: CanvasRenderingContext2D, x: number, y: number, k: number) => {
        const u = Math.min(1, k * 4);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 1 - k * k;
        ctx.lineCap = 'round';
        for (let i = 0; i < 2; i++) {
          ctx.strokeStyle = i === 0 ? '#d7503a' : '#ffffff';
          ctx.lineWidth = i === 0 ? 0.13 : 0.05;
          ctx.beginPath();
          ctx.moveTo(x + d * 0.1, y + 1.0);
          ctx.lineTo(x + d * 0.1, y + 1.0 - 1.1 * u);
          if (u > 0.5)
            ctx.arc(
              x - d * 0.3 + d * 0.4,
              y - 0.1,
              0.4,
              0,
              d === 1 ? Math.PI * 1.4 * Math.min(1, (u - 0.5) * 2) : 0,
              d === 1 ? false : true,
            );
          ctx.stroke();
        }
      };
      if (o === 'hit') {
        fx.layer('front', 0.5, (ctx, k) => hook(ctx, p.x, p.y, k));
        fx.glow(p, { radius: 1.1, color: '#dfeeea', life: 0.25 });
        fx.burst(p, { n: 9, color: '#d7503a', length: 0.9, life: 0.3 });
        fx.spark(p, {
          n: 18,
          color: '#dfeeea',
          speed: 7,
          dir: face(0.5, d),
          spread: 2.8,
          size: 0.035,
        });
        fling(c, paintDrop, p, 7, face(0.9, d), 2.6, 1.6, 0.6);
        fx.ring(p, { color: '#8fd0d0', radius: 0.9, life: 0.35, width: 0.08 });
        fx.word({ x: p.x, y: p.y + 0.8 }, ['SNAG!', 'ZIP!'][Math.floor(fx.rand() * 2)]!, {
          color: '#ffd9c4',
          size: 0.55,
          life: 0.8,
        });
      } else if (o !== 'block') {
        const t = c.attacker.anchors().tip;
        fx.layer('front', 0.4, (ctx, k) => hook(ctx, t.x + d * 0.5, t.y - 0.3, k));
        fling(c, paintDrop, t, 5, face(1.1, d), 2.4, 1.2, 0.5);
        fx.word({ x: t.x + d * 0.4, y: t.y + 0.6 }, 'SWISH', {
          color: '#cfeeee',
          size: 0.4,
          life: 0.6,
        });
      }
    },
  },

  // ── Żejtun Feint: a false step to one side, a first quick cut, then the X of the second ──
  'militia-zejtun-feint': {
    palette: { main: LIME, accent: RED, dark: '#3a2418' },
    choreograph: (base) => {
      const adv = advOf(base);
      return retime(base, 0.38, 0.62, [
        {
          t: 0.1,
          p: { x: -0.3, z: 0.3, lean: 0.2, sR: 0.5, eR: 1.2, hR: 0.5, kR: -0.6, hL: -0.2 },
        },
        {
          t: 0.25,
          p: { x: adv * 0.55, z: -0.2, lean: -0.3, sR: 1.5, eR: 0.1, hR: 0.7, kR: -0.5, hL: -0.5 },
        },
      ]);
    },
    start: (c) => {
      eng(c).wash(RED, 0.08, 0.5);
    },
    windup: (c) => {
      const fx = eng(c);
      const f = c.attacker.anchors().feet;
      if (c.t >= 0.1 && fx.once('step1')) {
        fx.dust({ x: f.x, y: 0 }, { n: 5, size: 0.16 });
        fx.word({ x: f.x - c.dir * 0.1, y: 1.9 }, 'HUP!', { color: LIME, size: 0.34, life: 0.45 });
        fx.glow({ x: f.x, y: 0.9 }, { radius: 0.9, color: LIME, life: 0.2 });
      }
      if (c.t >= 0.25 && fx.once('cut1')) {
        const a = c.attacker.anchors().chest;
        crescent(
          c,
          { x: a.x + c.dir * 0.2, y: a.y + 0.2 },
          0.9,
          face(2.2, c.dir),
          face(0.1, c.dir),
          0.35,
          LIME,
          '#ffffff',
          0.22,
        );
        const p = hitPoint(c);
        if (c.hit) {
          fx.spark(p, { n: 9, color: LIME, speed: 5, dir: face(0.5, c.dir), spread: 2 });
          fx.burst(p, { n: 6, color: RED, length: 0.5, life: 0.2 });
          fx.word({ x: p.x, y: p.y + 0.7 }, 'ZIP!', { color: LIME, size: 0.4, life: 0.5 });
        } else fx.dust({ x: p.x, y: 0 }, { n: 3 });
      }
    },
    impactFx: (c) => {
      const fx = eng(c);
      const o = outcomeOf(c);
      const p = hitPoint(c);
      const a = c.attacker.anchors().chest;
      const at = { x: a.x + c.dir * 0.3, y: a.y + 0.15 };
      crescent(c, at, 1.0, face(-0.5, c.dir), face(2.0, c.dir), 0.42, RED, '#ffe9e0', 0.26);
      if (o === 'hit') {
        fx.later(0.05, () =>
          crescent(c, p, 0.7, face(2.4, c.dir), face(0.3, c.dir), 0.38, LIME, '#ffffff', 0.24),
        );
        fx.glow(p, { radius: 1.1, color: LIME, life: 0.25 });
        fx.burst(p, { n: 12, color: RED, length: 1.0, life: 0.32 });
        fx.spark(p, { n: 16, color: LIME, speed: 7, dir: face(0.4, c.dir), spread: 2.6 });
        fx.ring(p, { color: RED, radius: 0.8, life: 0.35 });
        fx.word({ x: p.x, y: p.y + 0.85 }, 'ZAP!', { color: '#ff8a7a', size: 0.55, life: 0.8 });
      } else if (o !== 'block') {
        fx.dust({ x: p.x, y: 0 }, { n: 5 });
        fx.word({ x: p.x, y: p.y + 0.7 }, 'FOOLED', { color: LIME, size: 0.34, life: 0.6 });
      }
    },
  },

  // ── Harvest Swing: wide sickle arc through the wheat, straw flying everywhere ──
  'militia-harvest-swing': {
    palette: { main: WHEAT, accent: '#c9972b', dark: '#5a4018' },
    choreograph: (base) =>
      retime(base, 0.2, 1.0, [
        {
          t: 0.12,
          p: { x: -0.3, y: -0.2, lean: 0.28, spin: -0.5, hR: 0.9, kR: -1.3, sR: 2.0, eR: 0.3 },
        },
      ]),
    start: (c) => eng(c).wash('#d9a640', 0.14, 0.9),
    windup: (c) => {
      const fx = eng(c);
      const f = c.attacker.anchors().feet;
      if (c.t > 0.15 && Math.floor(c.t * 30) % 3 === 0) {
        fx.spark(
          { x: f.x + (fx.rand() - 0.5) * 1.6, y: 0.1 },
          { n: 1, color: WHEAT, speed: 2, dir: up, spread: 1.2, size: 0.04 },
        );
      }
      if (c.t >= c.impact - 0.22 && fx.once('sickle')) {
        const a = c.attacker.anchors().chest;
        crescent(
          c,
          { x: a.x + c.dir * 0.2, y: a.y - 0.25 },
          1.6,
          face(3.5, c.dir),
          face(-0.5, c.dir),
          0.9,
          WHEAT,
          '#fff7d0',
          0.4,
          0.5,
        );
        fx.speedLines({ dir: c.dir === 1 ? Math.PI : 0, color: WHEAT, life: 0.3, n: 14 });
      }
    },
    impactFx: (c) => {
      const fx = eng(c);
      const o = outcomeOf(c);
      const p = hitPoint(c);
      const a = c.attacker.anchors().feet;
      const at = o === 'hit' ? p : { x: a.x + c.dir * 1.2, y: 0.6 };
      fling(c, paintStalk, at, o === 'hit' ? 10 : 6, face(0.6, c.dir), 1.9, 3.2, 0.9, 0.8);
      fx.ring(
        { x: a.x + c.dir * 0.4, y: 0.03 },
        { color: WHEAT, radius: 2.4, life: 0.55, width: 0.12, flat: 0.22 },
      );
      fx.dust({ x: a.x + c.dir * 0.8, y: 0 }, { n: 10, color: '#d9b866' });
      if (o === 'hit') {
        fx.glow(p, { radius: 1.4, color: WHEAT, life: 0.28 });
        fx.burst(p, { n: 14, color: '#c9972b', length: 1.2, life: 0.38 });
        fx.spark(p, { n: 20, color: WHEAT, speed: 8, dir: face(0.5, c.dir), spread: 3 });
        fx.word({ x: p.x, y: p.y + 0.85 }, 'SHWAK!', { color: '#ffe38a', size: 0.62, life: 0.85 });
        fx.later(0.2, () =>
          fling(c, paintStalk, { x: p.x, y: p.y + 1.2 }, 5, up, 3.4, 1.6, 0.8, 0.2),
        );
        fx.later(0.2, () => fx.dust({ x: p.x, y: 0.2 }, { n: 5, color: '#e8d9a0', size: 0.25 }));
      } else
        fx.word({ x: a.x + c.dir * 1.6, y: 1.2 }, 'SWOOSH', {
          color: WHEAT,
          size: 0.42,
          life: 0.6,
        });
    },
    finish: (c) => {
      const p = hitPoint(c);
      fling(c, paintStalk, { x: p.x, y: p.y + 0.5 }, 9, up, 3.6, 2.4, 1.1, 1.2);
      eng(c).flash(WHEAT, 0.3, 0.2);
    },
  },

  // ── Carob Split: gather, tremble, then split the log: a bright line cleaving the target ──
  'militia-carob-split': {
    palette: { main: '#d9a066', accent: '#7a3e1c', dark: '#2b170c' },
    choreograph: (base) => hold(base, 0, 0.3),
    start: (c) => eng(c).wash('#2b170c', 0.2, 1.0),
    windup: (c) => {
      const fx = eng(c);
      const tip = c.attacker.anchors().tip;
      if (c.t > 0.3 && c.t < c.impact - 0.1 && (Math.floor(c.t * 36) & 1) === 0) {
        fx.spark(tip, { n: 1, color: '#d9a066', speed: 1.8, dir: up, spread: 3, size: 0.04 });
        fx.glow(tip, { radius: 0.5, color: '#d9a066', life: 0.12 });
      }
      if (c.t >= c.impact - 0.2 && fx.once('slow')) {
        fx.slowmo(0.35, 0.22);
        fx.punch(c.attacker.anchors().head, 1.12, 0.5);
      }
    },
    impactFx: (c) => {
      const fx = eng(c);
      const o = outcomeOf(c);
      const d = c.defender.anchors();
      const x = d.chest.x - c.dir * 0.1;
      crack(c, x, c.dir, 2.6, '#2b170c', 0.9);
      crack(c, x, -c.dir, 1.6, '#2b170c', 0.9);
      fx.ring(
        { x, y: 0.03 },
        { color: '#e6d9b8', radius: 2.2, life: 0.55, width: 0.13, flat: 0.24 },
      );
      fx.dust({ x, y: 0 }, { n: 14, size: 0.22 });
      if (o === 'hit') {
        const top = d.head.y + 0.5;
        fx.layer('front', 0.55, (ctx, k) => {
          const u = Math.min(1, k * 6);
          const gap = Math.min(0.5, k * 1.2);
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 1 - k * k;
          ctx.fillStyle = '#ffd89a';
          ctx.beginPath();
          ctx.moveTo(x, top);
          ctx.lineTo(x + gap, top - 1.7 * u * 0.5);
          ctx.lineTo(x, top - 1.7 * u);
          ctx.lineTo(x - gap, top - 1.7 * u * 0.5);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.fillRect(x - 0.025, top - 1.7 * u, 0.05, 1.7 * u);
        });
        fx.glow({ x, y: d.chest.y }, { radius: 1.6, color: '#ffd89a', life: 0.3 });
        fx.burst({ x, y: d.chest.y }, { n: 14, color: '#7a3e1c', length: 1.3, life: 0.4 });
        fling(c, paintPod, { x, y: d.chest.y + 0.3 }, 6, up, 3.2, 2.4, 0.9, 1.0);
        fling(c, paintChip, { x, y: d.chest.y }, 8, up, 3.6, 2.2, 0.7, 0.8);
        fx.word({ x, y: d.head.y + 0.8 }, 'KRAK!', {
          color: '#ffcf8a',
          size: 0.72,
          life: 0.9,
          rot: -0.08,
        });
        fx.shake(0.22, 0.88);
        fx.punch({ x, y: d.chest.y }, 1.2, 0.6);
      } else if (o !== 'block') {
        fling(c, paintChip, { x, y: 0.2 }, 7, up, 2.6, 2.0, 0.6, 0.8);
        fx.word({ x, y: 0.9 }, 'THUNK', { color: '#e6d9b8', size: 0.5, life: 0.7 });
        fx.shake(0.1, 0.86);
      }
    },
    finish: (c) => {
      const p = hitPoint(c);
      eng(c).impactFrame(0.06);
      fling(c, paintPod, { x: p.x, y: p.y + 1.4 }, 8, up, 4, 2.6, 1.2, 1.4);
    },
  },

  // ── Pitchfork Jab: three tines, three puncture marks, hay flying ──
  'militia-pitchfork-jab': {
    palette: { main: '#e8e2c8', accent: '#a56a2a', dark: '#3a2a14' },
    choreograph: (base) =>
      retime(base, 0.12, 0.8, [{ t: 0.06, p: { x: -0.2, lean: 0.14, sR: 0.4, eR: 0.9 } }]),
    windup: (c) => {
      const fx = eng(c);
      if (c.t >= c.impact - 0.14 && fx.once('tines')) {
        streaks(c, [-0.15, 0, 0.15], '#e8e2c8', 0.22, 1.0, 0.05);
        fx.speedLines({ dir: c.dir === 1 ? Math.PI : 0, color: '#e8e2c8', life: 0.22, n: 10 });
      }
    },
    impactFx: (c) => {
      const fx = eng(c);
      const o = outcomeOf(c);
      const p = hitPoint(c);
      if (o === 'hit') {
        for (let i = -1; i <= 1; i++) {
          const q = { x: p.x, y: p.y + i * 0.26 };
          fx.burst(q, { n: 6, color: '#e8e2c8', length: 0.45, life: 0.24 });
          fx.ring(q, { color: '#fff', radius: 0.35, life: 0.3, width: 0.05 });
          fx.spark(q, {
            n: 5,
            color: '#e8e2c8',
            speed: 5,
            dir: face(0.2 * i + 0.3, c.dir),
            spread: 0.9,
          });
        }
        fx.glow(p, { radius: 1.1, color: '#fff3c0', life: 0.22 });
        fling(c, paintStalk, p, 6, face(1.0, c.dir), 2.6, 1.8, 0.7);
        fx.word({ x: p.x, y: p.y + 0.95 }, ['PRONG!', 'POKE!'][Math.floor(fx.rand() * 2)]!, {
          color: '#ffe9a0',
          size: 0.55,
          life: 0.8,
        });
      } else if (o !== 'block') {
        const t = c.attacker.anchors().tip;
        fling(c, paintStalk, { x: t.x + c.dir * 0.8, y: t.y }, 4, face(0.4, c.dir), 1.6, 1.4, 0.6);
        fx.word({ x: t.x + c.dir * 0.6, y: t.y + 0.5 }, 'WHIFF', {
          color: '#e8e2c8',
          size: 0.36,
          life: 0.55,
        });
      }
    },
  },

  // ── Brace and Drive: butt planted in the limestone, a crouch, then a long red driving thrust ──
  'militia-brace-and-drive': {
    palette: { main: '#ffd9c8', accent: RED, dark: '#4a3a2a' },
    choreograph: (base) => {
      const keys = base.keys.map((k, i) =>
        i === 0 ? { t: k.t, p: { ...k.p, y: -0.2, lean: 0.12 } } : k,
      );
      return hold({ ...base, keys }, 0, 0.3);
    },
    windup: (c) => {
      const fx = eng(c);
      const f = c.attacker.anchors().feet;
      if (c.t >= 0.3 && fx.once('plant')) {
        fx.ring(
          { x: f.x - c.dir * 0.3, y: 0.03 },
          { color: LIME, radius: 1.3, life: 0.45, width: 0.1, flat: 0.22 },
        );
        fx.dust({ x: f.x - c.dir * 0.3, y: 0 }, { n: 8, color: LIME });
        fling(c, paintStone, { x: f.x - c.dir * 0.3, y: 0.1 }, 5, up, 3, 1.2, 0.5);
        crack(c, f.x - c.dir * 0.3, -c.dir, 1.0, '#4a3a2a', 0.8);
        fx.word({ x: f.x - c.dir * 0.2, y: 0.7 }, 'THUD', { color: LIME, size: 0.34, life: 0.5 });
        fx.shake(0.04);
      }
      if (c.t > 0.35 && c.t < c.impact - 0.1) {
        const t = c.attacker.anchors().tip;
        if (Math.floor(c.t * 30) % 3 === 0)
          fx.glow(t, { radius: 0.35 + (c.t - 0.35) * 0.9, color: RED, life: 0.12 });
      }
      if (c.t >= c.impact - 0.16 && fx.once('drive')) {
        streaks(c, [-0.07, 0.07], RED, 0.28, 1.6, 0.09);
        fx.speedLines({ dir: c.dir === 1 ? Math.PI : 0, color: '#ffd9c8', life: 0.3, n: 18 });
      }
    },
    impactFx: (c) => {
      const fx = eng(c);
      const o = outcomeOf(c);
      const p = hitPoint(c);
      const d = c.defender.anchors().feet;
      for (let i = 0; i < 3; i++)
        fx.later(i * 0.07, () =>
          fx.ring(
            { x: d.x - c.dir * 0.2, y: 0.03 },
            {
              color: i === 1 ? RED : LIME,
              radius: 1.6 + i * 0.7,
              life: 0.5,
              width: 0.1,
              flat: 0.22,
            },
          ),
        );
      if (o === 'hit') {
        fx.layer('front', 0.4, (ctx, k) => {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 1 - k;
          ctx.fillStyle = RED;
          ctx.fillRect(p.x - 0.1, p.y - 0.09 * (1 - k), c.dir * 3.2, 0.18 * (1 - k));
          ctx.fillStyle = '#fff';
          ctx.fillRect(p.x - 0.1, p.y - 0.03 * (1 - k), c.dir * 3.2, 0.06 * (1 - k));
        });
        fx.glow(p, { radius: 1.6, color: '#ffd9c8', life: 0.3 });
        fx.burst(p, { n: 14, color: RED, length: 1.3, life: 0.4 });
        fx.spark(p, { n: 22, color: LIME, speed: 8, dir: face(0.3, c.dir), spread: 2.8 });
        fling(c, paintStone, p, 8, face(0.7, c.dir), 2.4, 2.4, 0.7);
        fx.word({ x: p.x, y: p.y + 0.95 }, 'DRIVE!', { color: '#ff9a88', size: 0.68, life: 0.9 });
        fx.shake(0.18, 0.88);
        fx.punch(p, 1.16, 0.55);
      } else if (o !== 'block') {
        fling(c, paintStone, { x: d.x, y: 0.2 }, 5, up, 2, 1.6, 0.5);
        fx.word({ x: d.x, y: 1.0 }, 'MISSED', { color: LIME, size: 0.36, life: 0.6 });
      }
    },
    follow: (c) => {
      const fx = eng(c);
      if (c.t >= c.impact + 0.2 && fx.once('shiver')) {
        const d = c.defender.anchors().feet;
        fx.ring(
          { x: d.x, y: 0.03 },
          { color: LIME, radius: 1.2, life: 0.4, width: 0.06, flat: 0.22 },
        );
        fx.dust({ x: d.x, y: 0 }, { n: 4 });
      }
    },
  },

  // ── Watchtower Sweep: a beacon-lit tower behind, a low sweeping haul that throws sand ──
  'militia-watchtower-sweep': {
    palette: { main: '#ffb34d', accent: LIME, dark: '#3a2a1a' },
    choreograph: (base) =>
      retime(base, 0.18, 1.0, [
        { t: 0.1, p: { y: -0.3, x: -0.2, spin: -0.5, lean: 0.2, hR: 0.9, kR: -1.3 } },
      ]),
    start: (c) => {
      const fx = eng(c);
      const mx = (c.attacker.baseX + c.defender.baseX) / 2 + c.dir * 0.3;
      const imp = c.impact;
      const L = imp + 1.1;
      fx.layer('back', L, (ctx, k) => {
        const lit = k * L > imp;
        const f = lit ? Math.min(1, (k * L - imp) * 5) : 0;
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = '#c9bd98';
        ctx.fillRect(mx - 0.45, 0, 0.9, 2.9);
        ctx.fillStyle = '#b3a780';
        ctx.fillRect(mx - 0.55, 2.9, 1.1, 0.25);
        for (let i = 0; i < 3; i++) ctx.fillRect(mx - 0.55 + i * 0.42, 3.15, 0.26, 0.22);
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(mx - 0.1, 1.9, 0.2, 0.4);
        ctx.fillRect(mx - 0.18, 0, 0.36, 0.6);
        if (f > 0) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = (0.85 - Math.max(0, k * L - imp - 0.6)) * f;
          ctx.fillStyle = '#ffb34d';
          ctx.beginPath();
          ctx.arc(mx, 3.55, 0.3 * f, 0, TAU);
          ctx.fill();
          ctx.fillStyle = '#fff3c0';
          ctx.beginPath();
          ctx.arc(mx, 3.5, 0.15 * f, 0, TAU);
          ctx.fill();
        }
      });
    },
    windup: (c) => {
      const fx = eng(c);
      if (c.t >= c.impact - 0.24 && fx.once('low')) {
        const a = c.attacker.anchors();
        crescent(
          c,
          { x: a.chest.x + c.dir * 0.2, y: 0.35 },
          1.9,
          face(3.5, c.dir),
          face(-0.4, c.dir),
          0.55,
          '#ffb34d',
          LIME,
          0.4,
          0.4,
        );
      }
      if (Math.floor(c.t * 30) % 4 === 0 && c.t > 0.2) {
        const f = c.attacker.anchors().feet;
        fx.dust({ x: f.x + c.dir * 0.5, y: 0 }, { n: 1, size: 0.14, color: '#d8c89a' });
      }
    },
    impactFx: (c) => {
      const fx = eng(c);
      const o = outcomeOf(c);
      const p = hitPoint(c);
      const a = c.attacker.anchors().feet;
      fx.ring(
        { x: a.x + c.dir * 0.8, y: 0.03 },
        { color: '#e8d9a8', radius: 2.8, life: 0.55, width: 0.14, flat: 0.2 },
      );
      fx.dust({ x: a.x + c.dir * 1.0, y: 0 }, { n: 14, color: '#d8c89a', size: 0.26 });
      fling(
        c,
        paintStone,
        { x: a.x + c.dir * 1.2, y: 0.2 },
        6,
        face(0.4, c.dir),
        1.4,
        2.8,
        0.7,
        0.5,
      );
      if (o === 'hit') {
        fx.glow(p, { radius: 1.3, color: '#ffb34d', life: 0.28 });
        fx.burst(p, { n: 12, color: '#ffb34d', length: 1.1, life: 0.36 });
        fx.spark(p, { n: 16, color: LIME, speed: 7, dir: face(0.3, c.dir), spread: 2.6 });
        fx.word({ x: p.x, y: p.y + 0.85 }, 'HEAVE!', { color: '#ffd08a', size: 0.62, life: 0.85 });
        fx.wash('#ffb34d', 0.2, 0.5);
      } else if (o !== 'block')
        fx.word({ x: a.x + c.dir * 1.6, y: 0.9 }, 'WHOOSH', { color: LIME, size: 0.42, life: 0.6 });
      fx.later(0.1, () =>
        fx.glow(
          { x: (c.attacker.baseX + c.defender.baseX) / 2, y: 3.4 },
          { radius: 0.9, color: '#ffb34d', life: 0.5 },
        ),
      );
    },
  },

  // ── Aimed Shot: breath held, a tightening reticle, then one clean tap ──
  'militia-aimed-shot': {
    palette: { main: '#fff3d0', accent: RED, dark: '#2a1a14' },
    choreograph: (base) => hold(base, 1, 0.5),
    start: (c) => eng(c).wash('#1a0e0a', 0.18, c.impact),
    windup: (c) => {
      const fx = eng(c);
      if (c.t >= 0.25 && fx.once('ret')) {
        const d = c.defender.anchors().chest;
        reticle(
          c,
          { x: d.x - c.dir * 0.12, y: d.y },
          1.1,
          0.22,
          RED,
          Math.max(0.2, c.impact - 0.37),
        );
      }
      if (
        c.t > 0.3 &&
        c.t < c.impact - 0.15 &&
        (Math.floor(c.t * 4) & 1) === 0 &&
        fx.once(`br${Math.floor(c.t * 4)}`)
      ) {
        fx.smoke(c.attacker.anchors().head, { n: 1, size: 0.1, rise: 0.25, color: '#e8e8e8' });
      }
      if (c.t >= c.impact - 0.12 && fx.once('fire')) {
        const m = muzzle(c, '#ffcf7a', 1);
        fx.word({ x: m.x + c.dir * 0.5, y: m.y + 0.5 }, 'CRACK!', {
          color: '#ffcf7a',
          size: 0.4,
          life: 0.5,
        });
        shoot(c, m, aimAt(c, 0), 0.12, '#ffe2a8', 0.2, 0.04);
      }
    },
    impactFx: (c) => {
      const fx = eng(c);
      const o = outcomeOf(c);
      const p = aimAt(c, 0);
      if (o === 'hit') {
        fx.glow(p, { radius: 1.0, color: '#fff3d0', life: 0.22 });
        for (let i = 0; i < 3; i++)
          fx.later(i * 0.05, () =>
            fx.ring(p, {
              color: i === 1 ? '#ffffff' : RED,
              radius: 0.4 + i * 0.35,
              life: 0.3,
              width: 0.07,
            }),
          );
        fx.burst(p, { n: 8, color: RED, length: 0.9, life: 0.3 });
        fx.spark(p, { n: 12, color: '#fff3d0', speed: 6, dir: face(0.3, c.dir), spread: 2.2 });
        fx.word({ x: p.x, y: p.y + 0.8 }, 'TAP!', { color: '#ff9a88', size: 0.6, life: 0.8 });
        fx.punch(p, 1.14, 0.45);
      } else if (o !== 'block') {
        fx.dust({ x: p.x, y: 0.05 }, { n: 5 });
        fx.spark({ x: p.x, y: 0.1 }, { n: 8, color: LIME, speed: 5, dir: up, spread: 1.5 });
        fx.word({ x: p.x, y: 0.8 }, 'PING!', { color: LIME, size: 0.4, life: 0.6 });
      }
    },
  },

  // ── Double Charge: powder poured twice, glowing barrel, an enormous bang and twin balls ──
  'militia-double-charge': {
    palette: { main: '#ffd37a', accent: '#ff6a1f', dark: '#3a1a0a' },
    choreograph: (base) => {
      const keys = base.keys.map((k, i) =>
        i === 2 ? { t: k.t, p: { ...k.p, x: -0.4, lean: 0.38, y: 0.06 } } : k,
      );
      return hold({ ...base, keys }, 1, 0.3);
    },
    windup: (c) => {
      const fx = eng(c);
      const m = c.attacker.anchors().tip;
      if (c.t >= 0.12 && fx.once('pour1'))
        fx.smoke(m, { n: 2, size: 0.12, rise: 0.3, color: '#cfcfcf' });
      if (c.t >= 0.3 && fx.once('pour2')) {
        fx.smoke(m, { n: 3, size: 0.14, rise: 0.3, color: '#cfcfcf' });
        fx.word({ x: m.x, y: m.y + 0.6 }, 'x2', { color: '#ffd37a', size: 0.4, life: 0.6 });
      }
      if (c.t > 0.35 && (Math.floor(c.t * 30) & 1) === 0) {
        const h = c.attacker.anchors().hand;
        fx.glow(m, { radius: 0.3 + (c.t - 0.35) * 0.5, color: '#ff6a1f', life: 0.1 });
        fx.spark(h, { n: 1, color: '#ffd37a', speed: 2.5, dir: up, spread: 3, size: 0.03 });
      }
      if (c.t >= c.impact - 0.12 && fx.once('fire')) {
        const f = eng(c);
        const mm = muzzle(c, '#ff8a2f', 1.8);
        f.glow(mm, { radius: 1.8, color: '#fff3c4', life: 0.2 });
        f.ring(mm, { color: '#ffd37a', radius: 1.2, life: 0.3 });
        f.shake(0.12, 0.85);
        f.flash('#ffe9a0', 0.25, 0.1);
        f.word({ x: mm.x + c.dir * 0.6, y: mm.y + 0.7 }, 'BLAM!', {
          color: '#ff9a3a',
          size: 0.55,
          life: 0.6,
        });
        shoot(c, { x: mm.x, y: mm.y + 0.06 }, aimAt(c, 0.06), 0.12, '#ffb347', 0.22, 0.06);
        shoot(c, { x: mm.x, y: mm.y - 0.06 }, aimAt(c, -0.06), 0.12, '#ff6a1f', 0.22, 0.06);
      }
    },
    impactFx: (c) => {
      const fx = eng(c);
      const o = outcomeOf(c);
      const p = aimAt(c, 0);
      if (o === 'hit') {
        fx.glow(p, { radius: 1.8, color: '#ffd37a', life: 0.3 });
        fx.burst(p, { n: 14, color: '#ff6a1f', length: 1.4, life: 0.4 });
        fx.ring(p, { color: '#ff6a1f', radius: 1.3, life: 0.4, width: 0.12 });
        fx.later(0.07, () => {
          fx.ring(p, { color: '#ffd37a', radius: 1.9, life: 0.4, width: 0.1 });
          fx.burst(p, { n: 12, color: '#ffd37a', length: 1.6, life: 0.35 });
        });
        fx.spark(p, { n: 26, color: '#ffb347', speed: 9, dir: face(0.3, c.dir), spread: 3 });
        fx.smoke(p, { n: 5, size: 0.25, rise: 0.6, color: '#4a4540' });
        fx.word({ x: p.x, y: p.y + 0.95 }, 'KA-BLAM!', { color: '#ff9a3a', size: 0.7, life: 0.95 });
        fx.shake(0.2, 0.88);
      } else if (o !== 'block') {
        fx.dust({ x: p.x, y: 0.05 }, { n: 10, size: 0.22 });
        fx.spark({ x: p.x, y: 0.1 }, { n: 12, color: '#ffb347', speed: 6, dir: up, spread: 1.6 });
        fx.word({ x: p.x, y: 0.8 }, 'WILD', { color: '#ffd37a', size: 0.4, life: 0.6 });
      }
    },
    follow: (c) => {
      const fx = eng(c);
      if (c.t >= c.impact + 0.15 && fx.once('smoke'))
        fx.smoke(c.attacker.anchors().tip, { n: 8, size: 0.22, rise: 0.5, color: '#8a8580' });
    },
  },

  // ── Crossfire: two shooters' positions, two tracers crossing in an X ──
  'militia-crossfire': {
    palette: { main: '#ffe2a8', accent: '#d94a38', dark: '#2a1a14' },
    choreograph: (base) => {
      const aim = { lean: -0.06, sR: 1.42, eR: 0.08, sL: 1.48, eL: 0.08 };
      const kick = { x: -0.14, lean: 0.22, sR: 1.6, eR: 0.1, sL: 1.66 };
      const low = { y: -0.42, hR: 1.5, kR: -1.5, hL: 0.05, kL: -1.55 };
      const f1 = 0.4;
      const f2 = 0.8;
      return {
        ...base,
        impact: f2 + 0.12,
        release: f2,
        dust: [f1 + 0.2],
        keys: [
          { t: 0.2, p: aim },
          { t: f1 - 0.02, p: aim },
          { t: f1 + 0.05, p: kick },
          { t: f1 + 0.22, p: { ...low, ...aim, x: 0.3 } },
          { t: f2 - 0.02, p: { ...low, ...aim, x: 0.3 } },
          { t: f2 + 0.05, p: { ...low, ...kick, x: 0.15 } },
          { t: f2 + 0.45, p: low },
          { t: f2 + 0.85, p: {} },
        ],
      };
    },
    start: (c) => {
      const f = c.attacker.anchors().feet;
      const x = f.x + c.dir * 0.55;
      const dir = c.dir;
      eng(c).layer('back', c.impact + 0.8, (ctx) => {
        const x0 = Math.min(x, x + dir * 0.9);
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = '#d4c7a0';
        ctx.fillRect(x0, 0, 0.9, 0.5);
        for (let i = 0; i < 3; i++) ctx.fillRect(x0 + i * 0.33, 0.5, 0.24, 0.16);
        ctx.fillStyle = '#9c8f68';
        ctx.fillRect(x0, 0.24, 0.9, 0.02);
        ctx.fillRect(x0 + 0.3, 0, 0.02, 0.24);
        ctx.fillRect(x0 + 0.6, 0.26, 0.02, 0.24);
      });
    },
    windup: (c) => {
      const fx = eng(c);
      if (c.t >= 0.4 && fx.once('s1')) {
        const m = muzzle(c, '#ffe2a8', 1);
        const to = aimAt(c, 0.5);
        shoot(c, m, to, 0.14, '#ffe2a8', 0.2, 0.045);
        fx.word({ x: m.x + c.dir * 0.4, y: m.y + 0.5 }, 'KRAK!', {
          color: '#ffe2a8',
          size: 0.38,
          life: 0.5,
        });
        fx.shake(0.04);
        if (c.hit)
          fx.later(0.14, () =>
            fx.spark(to, {
              n: 6,
              color: '#d94a38',
              speed: 5,
              dir: face(Math.PI, c.dir),
              spread: 1.6,
            }),
          );
      }
      if (c.t >= c.impact - 0.12 && fx.once('s2')) {
        const m = muzzle(c, '#ffb08a', 1);
        shoot(c, m, aimAt(c, -0.5), 0.12, '#ff9a7a', 0.2, 0.045);
        fx.word({ x: m.x + c.dir * 0.6, y: m.y + 0.8 }, 'KRAK!', {
          color: '#ff9a7a',
          size: 0.42,
          life: 0.5,
          rot: 0.1,
        });
        fx.shake(0.04);
      }
    },
    impactFx: (c) => {
      const fx = eng(c);
      const o = outcomeOf(c);
      const p = aimAt(c, 0);
      if (o === 'hit') {
        fx.layer('front', 0.4, (ctx, k) => {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 1 - k;
          ctx.lineCap = 'round';
          for (let i = 0; i < 2; i++) {
            const s = i === 0 ? 1 : -1;
            ctx.strokeStyle = i === 0 ? '#ffe2a8' : '#d94a38';
            ctx.lineWidth = 0.1 * (1 - k * 0.6);
            ctx.beginPath();
            ctx.moveTo(p.x - 0.9 * s, p.y - 0.8);
            ctx.lineTo(p.x + 0.9 * s, p.y + 0.8);
            ctx.stroke();
          }
        });
        fx.glow(p, { radius: 1.2, color: '#ffe2a8', life: 0.25 });
        fx.burst(p, { n: 12, color: '#d94a38', length: 1.0, life: 0.32 });
        fx.spark(p, { n: 16, color: '#ffe2a8', speed: 7, dir: face(0.3, c.dir), spread: 2.6 });
        fx.word({ x: p.x, y: p.y + 0.85 }, 'X-FIRE!', { color: '#ff9a88', size: 0.55, life: 0.85 });
      } else if (o !== 'block') {
        fx.spark({ x: p.x, y: 0.1 }, { n: 10, color: LIME, speed: 6, dir: up, spread: 1.6 });
        fx.dust({ x: p.x, y: 0.05 }, { n: 6 });
        fx.word({ x: p.x, y: 0.8 }, 'PING!', { color: LIME, size: 0.4, life: 0.55 });
      }
    },
  },

  // ── Sharpshooter: lens glint, a slit-sized target, a bullet in slow motion, a pinprick through ──
  'militia-sharpshooter': {
    palette: { main: '#ffffff', accent: '#7fe0ff', dark: '#10181c' },
    choreograph: (base) => hold(base, 1, 0.4),
    start: (c) => eng(c).wash('#0a1216', 0.22, c.impact + 0.2),
    windup: (c) => {
      const fx = eng(c);
      if (c.t >= 0.25 && fx.once('slit')) {
        const d = c.defender.anchors().head;
        const x = d.x - c.dir * 0.12;
        const y = d.y;
        fx.layer('front', Math.max(0.2, c.impact - 0.37), (ctx, k) => {
          ctx.globalAlpha = 0.4 + 0.6 * k;
          ctx.strokeStyle = '#7fe0ff';
          ctx.lineWidth = 0.03;
          const w = 0.34 - 0.16 * k;
          ctx.strokeRect(x - w, y - 0.045, w * 2, 0.09);
          ctx.beginPath();
          ctx.moveTo(x - 0.8, y);
          ctx.lineTo(x - w - 0.05, y);
          ctx.moveTo(x + w + 0.05, y);
          ctx.lineTo(x + 0.8, y);
          ctx.stroke();
        });
      }
      if (c.t >= c.impact - 0.3 && fx.once('glint')) {
        const h = c.attacker.anchors().head;
        const x = h.x + c.dir * 0.2;
        const y = h.y + 0.05;
        fx.layer('front', 0.3, (ctx, k) => {
          const s = Math.sin(k * Math.PI);
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = s;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(x - 0.4 * s, y);
          ctx.lineTo(x, y + 0.04);
          ctx.lineTo(x + 0.4 * s, y);
          ctx.lineTo(x, y - 0.04);
          ctx.moveTo(x, y - 0.4 * s);
          ctx.lineTo(x + 0.04, y);
          ctx.lineTo(x, y + 0.4 * s);
          ctx.lineTo(x - 0.04, y);
          ctx.fill();
        });
      }
      if (c.t >= c.impact - 0.12 && fx.once('fire')) {
        const m = muzzle(c, '#7fe0ff', 0.8);
        const d = c.defender.anchors().head;
        const strike = c.hit || c.reaction === 'defend';
        const to = strike
          ? { x: d.x - c.dir * 0.12, y: d.y }
          : { x: d.x + c.dir * 1.0, y: d.y + 0.4 };
        fx.slowmo(0.28, 0.25);
        fx.word({ x: m.x + c.dir * 0.5, y: m.y + 0.5 }, 'PHT!', {
          color: '#7fe0ff',
          size: 0.34,
          life: 0.5,
        });
        fx.sprite({
          from: m,
          to,
          life: 0.12,
          trail: '#7fe0ff',
          paint: (ctx, p, ang) => {
            ctx.translate(p.x, p.y);
            ctx.rotate(ang);
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = '#7fe0ff';
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.ellipse(0, 0, 0.3, 0.03, 0, 0, TAU);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(0.05, 0, 0.12, 0.015, 0, 0, TAU);
            ctx.fill();
          },
          onStep: (p, k) => {
            if ((Math.floor(k * 40) & 1) === 0)
              fx.spark(p, { n: 1, color: '#7fe0ff', speed: 0.6, dir: up, spread: 6, size: 0.02 });
          },
        });
      }
    },
    impactFx: (c) => {
      const fx = eng(c);
      const o = outcomeOf(c);
      const d = c.defender.anchors().head;
      const p = { x: d.x - c.dir * 0.12, y: d.y };
      if (o === 'hit') {
        fx.impactFrame(0.06);
        fx.layer('front', 0.45, (ctx, k) => {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 1 - k;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.min(p.x, p.x - c.dir * 3), p.y - 0.015, 3, 0.03);
          ctx.fillStyle = '#7fe0ff';
          ctx.fillRect(Math.min(p.x, p.x - c.dir * 3), p.y - 0.045 * (1 - k), 3, 0.09 * (1 - k));
        });
        fx.glow(p, { radius: 0.8, color: '#ffffff', life: 0.2 });
        fx.burst(p, { n: 7, color: '#7fe0ff', length: 0.8, life: 0.3 });
        fx.ring(p, { color: '#7fe0ff', radius: 0.45, life: 0.35, width: 0.05 });
        fx.spark(p, { n: 10, color: '#ffffff', speed: 6, dir: face(0.2, c.dir), spread: 1.4 });
        fx.word({ x: p.x, y: p.y + 0.7 }, 'TINK!', { color: '#bff0ff', size: 0.58, life: 0.8 });
        fx.punch(p, 1.25, 0.6);
      } else if (o !== 'block') {
        const f = c.defender.anchors().feet;
        fx.spark(
          { x: f.x + c.dir, y: 0.1 },
          { n: 8, color: '#7fe0ff', speed: 6, dir: up, spread: 1.4 },
        );
        fx.word({ x: f.x + c.dir, y: 0.8 }, 'WHIZ', { color: '#bff0ff', size: 0.4, life: 0.55 });
      }
    },
    finish: (c) => {
      const p = hitPoint(c);
      eng(c).flash('#bff0ff', 0.3, 0.18);
      eng(c).ring(p, { color: '#ffffff', radius: 1.6, life: 0.5, width: 0.05 });
    },
  },
};
