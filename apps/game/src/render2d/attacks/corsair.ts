/**
 * Corsair attack scripts: Barbary raiders. Boarding leaps, ropes and grapples, salt spray and
 * deck-dancing acrobatics. Palette: teal sea, crimson sashes, foam white and brass.
 */
import type { Key, Move } from '../../render/duelMoves';
import type { AttackScripts, FxContext, V2 } from '../contract';
import { eng, face, hitPoint, outcomeOf } from './styleDefaults';

const TAU = Math.PI * 2;
const TEAL = '#1fa6a0';
const CRIM = '#c4243b';
const FOAM = '#e8f6f4';
const BRASS = '#e8b84a';
const up = Math.PI / 2;

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

type Paint = (ctx: CanvasRenderingContext2D, p: V2, ang: number, k: number) => void;

const paintDrop: Paint = (ctx, p, _a, k) => {
  ctx.translate(p.x, p.y);
  ctx.globalAlpha = 0.9 * (1 - k * k);
  ctx.fillStyle = k < 0.5 ? FOAM : '#9fe0dc';
  ctx.beginPath();
  ctx.ellipse(0, 0, 0.04, 0.06, 0, 0, TAU);
  ctx.fill();
};

const paintPlank: Paint = (ctx, p, _a, k) => {
  ctx.translate(p.x, p.y);
  ctx.rotate(k * 10 + p.x);
  ctx.globalAlpha = 1 - k * k * 0.6;
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(-0.16, -0.04, 0.32, 0.08);
  ctx.fillStyle = '#9a6a38';
  ctx.fillRect(-0.16, -0.04, 0.32, 0.025);
};

const paintRope: Paint = (ctx, p, _a, k) => {
  ctx.translate(p.x, p.y);
  ctx.rotate(k * 6 + p.y * 2);
  ctx.globalAlpha = 1 - k * k * 0.6;
  ctx.strokeStyle = '#c9b27a';
  ctx.lineWidth = 0.04;
  ctx.beginPath();
  ctx.moveTo(-0.14, 0);
  ctx.quadraticCurveTo(-0.04, 0.09, 0.03, -0.02);
  ctx.quadraticCurveTo(0.09, -0.08, 0.15, 0.02);
  ctx.stroke();
};

const paintClaw: Paint = (ctx, p, ang, _k) => {
  ctx.translate(p.x, p.y);
  ctx.rotate(ang + 0.0);
  ctx.strokeStyle = '#3a4448';
  ctx.lineCap = 'round';
  ctx.lineWidth = 0.06;
  ctx.beginPath();
  ctx.moveTo(-0.12, 0);
  ctx.lineTo(0.05, 0);
  ctx.stroke();
  for (let i = -1; i <= 1; i += 2) {
    ctx.beginPath();
    ctx.moveTo(0.05, 0);
    ctx.quadraticCurveTo(0.2, 0.12 * i, 0.1, 0.24 * i);
    ctx.stroke();
  }
  ctx.strokeStyle = '#9aa8ac';
  ctx.lineWidth = 0.02;
  ctx.beginPath();
  ctx.moveTo(-0.12, 0);
  ctx.lineTo(0.05, 0);
  ctx.stroke();
};

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
        if (i === 0) ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * squash);
        else ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * squash);
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

/** Foam-white splash fountain at a ground point. */
function splash(c: FxContext, x: number, n: number, height: number): void {
  const fx = eng(c);
  fling(c, paintDrop, { x, y: 0.1 }, n, up, 2.2, height, 0.7, 1.0);
  fx.ring({ x, y: 0.03 }, { color: FOAM, radius: 1.4, life: 0.5, width: 0.09, flat: 0.22 });
  fx.ring({ x, y: 0.03 }, { color: TEAL, radius: 2.1, life: 0.6, width: 0.07, flat: 0.22 });
}

export const CORSAIR_SCRIPTS: AttackScripts = {
  // ── Boarding Slash: leap the rail in an arc, cut on the way down ──
  'corsair-boarding-slash': {
    palette: { main: FOAM, accent: CRIM, dark: '#0b2a33' },
    choreograph: (base) => {
      const adv = advOf(base);
      return retime(base, 0.32, 0.9, [
        { t: 0.1, p: { x: -0.35, y: -0.2, lean: 0.25, hR: 0.8, kR: -1.2, sR: 0.3, eR: 1.0 } },
        {
          t: 0.2,
          p: {
            x: adv * 0.35,
            y: 0.7,
            lean: 0.1,
            hR: 0.5,
            kR: -0.3,
            hL: -0.5,
            kL: -0.5,
            sR: 2.4,
            eR: 0.3,
          },
        },
        { t: 0.3, p: { x: adv * 0.7, y: 0.8, lean: -0.1, sR: 2.9, eR: 0.3, hR: 0.2, kR: -0.2 } },
      ]);
    },
    start: (c) => {
      const f = c.attacker.anchors().feet;
      const x = f.x + c.dir * 0.2;
      const dir = c.dir;
      // A ship's rail sliding past under the leap.
      eng(c).layer('back', 0.7, (ctx, k) => {
        const a = Math.sin(k * Math.PI) * 0.7;
        ctx.globalAlpha = a;
        const s = x + dir * (0.3 + k * 0.9);
        ctx.fillStyle = '#6b4423';
        ctx.fillRect(Math.min(s, s - dir * 1.8), 0.62, 1.8, 0.1);
        for (let i = 0; i < 4; i++) ctx.fillRect(s - dir * (0.2 + i * 0.5) - 0.04, 0.0, 0.08, 0.7);
      });
    },
    windup: (c) => {
      const fx = eng(c);
      const f = c.attacker.anchors().feet;
      if (c.t >= 0.12 && fx.once('jump')) {
        fx.dust({ x: f.x, y: 0 }, { n: 6 });
        fling(c, paintDrop, { x: f.x, y: 0.1 }, 5, up, 2, 1.2, 0.5);
        fx.word({ x: f.x - c.dir * 0.2, y: 1.8 }, 'AHOY!', { color: FOAM, size: 0.4, life: 0.6 });
      }
      if (c.t > 0.15 && c.t < c.impact && (Math.floor(c.t * 40) & 1) === 0) {
        const a = c.attacker.anchors().chest;
        fx.spark(
          { x: a.x - c.dir * 0.2, y: a.y },
          { n: 1, color: TEAL, speed: 1.6, dir: face(Math.PI, c.dir), spread: 1, size: 0.05 },
        );
      }
      if (c.t >= c.impact - 0.18 && fx.once('cut')) {
        const a = c.attacker.anchors().chest;
        crescent(
          c,
          { x: a.x + c.dir * 0.25, y: a.y + 0.1 },
          1.2,
          face(2.4, c.dir),
          face(-1.0, c.dir),
          0.6,
          TEAL,
          FOAM,
          0.3,
        );
      }
    },
    impactFx: (c) => {
      const fx = eng(c);
      const o = outcomeOf(c);
      const p = hitPoint(c);
      const f = c.attacker.anchors().feet;
      fx.dust({ x: f.x, y: 0 }, { n: 8 });
      fx.ring(
        { x: f.x, y: 0.03 },
        { color: FOAM, radius: 1.3, life: 0.4, width: 0.08, flat: 0.22 },
      );
      if (o === 'hit') {
        fx.layer('front', 0.4, (ctx, k) => {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 1 - k;
          ctx.strokeStyle = CRIM;
          ctx.lineCap = 'round';
          ctx.lineWidth = 0.16 * (1 - k * 0.5);
          ctx.beginPath();
          ctx.moveTo(p.x - c.dir * 0.8, p.y + 0.8);
          ctx.lineTo(p.x + c.dir * 0.8, p.y - 0.8);
          ctx.stroke();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 0.05;
          ctx.stroke();
        });
        fx.glow(p, { radius: 1.2, color: FOAM, life: 0.25 });
        fx.burst(p, { n: 12, color: CRIM, length: 1.0, life: 0.34 });
        fx.spark(p, { n: 16, color: FOAM, speed: 7, dir: face(0.4, c.dir), spread: 2.6 });
        fling(c, paintDrop, p, 8, face(0.8, c.dir), 2.6, 1.8, 0.6);
        fx.word({ x: p.x, y: p.y + 0.85 }, 'HAAR!', { color: '#ff8a9a', size: 0.62, life: 0.85 });
      } else if (o !== 'block') {
        fling(c, paintDrop, { x: p.x, y: 0.6 }, 5, up, 2, 1.2, 0.5);
        fx.word({ x: p.x, y: p.y + 0.6 }, 'SWISH', { color: FOAM, size: 0.4, life: 0.55 });
      }
    },
    finish: (c) => {
      const p = hitPoint(c);
      eng(c).flash(TEAL, 0.25, 0.18);
      fling(c, paintDrop, { x: p.x, y: p.y + 0.4 }, 10, up, 3.4, 2.2, 0.9, 1.1);
    },
  },

  // ── Deck Dance: a pitching deck, a pirouette between two crossing cuts ──
  'corsair-deck-dance': {
    palette: { main: BRASS, accent: TEAL, dark: '#0b2a33' },
    choreograph: (base) => {
      const adv = advOf(base);
      return retime(base, 0.5, 0.6, [
        { t: 0.1, p: { x: 0.1, z: 0.25, lean: 0.2, hR: 0.5, kR: -0.8, hL: -0.2 } },
        {
          t: 0.22,
          p: {
            x: adv * 0.4,
            z: -0.2,
            spin: 1.8,
            lean: -0.1,
            hR: -0.2,
            kR: -0.3,
            hL: 0.7,
            kL: -0.9,
          },
        },
        {
          t: 0.34,
          p: {
            x: adv * 0.6,
            z: 0.0,
            spin: Math.PI * 2,
            lean: -0.3,
            sR: 1.5,
            eR: 0.1,
            hR: 0.5,
            kR: -0.4,
          },
        },
      ]);
    },
    start: (c) => {
      // The deck: a swaying plank band under the fighters.
      const ax = c.attacker.baseX;
      const bx = c.defender.baseX;
      const x0 = Math.min(ax, bx) - 1.6;
      const w = Math.abs(ax - bx) + 3.2;
      eng(c).layer('back', c.impact + 0.8, (ctx, k) => {
        ctx.globalAlpha = 0.45;
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = i % 2 ? '#6b4423' : '#7d5230';
          const sway = Math.sin(k * 14 + i) * 0.03;
          ctx.fillRect(x0 + (w / 8) * i, -0.04 + sway, w / 8 - 0.03, 0.12);
        }
      });
    },
    windup: (c) => {
      const fx = eng(c);
      const f = c.attacker.anchors().feet;
      for (let i = 0; i < 3; i++) {
        const when = 0.1 + i * 0.12;
        if (c.t >= when && fx.once(`step${i}`)) {
          fx.ring(
            { x: f.x, y: 0.03 },
            { color: i === 1 ? BRASS : TEAL, radius: 0.8, life: 0.35, width: 0.06, flat: 0.22 },
          );
          fx.spark(
            { x: f.x, y: 0.15 },
            { n: 4, color: BRASS, speed: 3, dir: up, spread: 2, size: 0.04 },
          );
          fx.word({ x: f.x - c.dir * 0.3, y: 1.9 + i * 0.2 }, ['TAP', 'TAP', 'TING'][i]!, {
            color: BRASS,
            size: 0.28,
            life: 0.4,
          });
        }
      }
      if (c.t >= 0.22 && fx.once('cut1')) {
        const a = c.attacker.anchors().chest;
        const p = hitPoint(c);
        crescent(
          c,
          { x: a.x + c.dir * 0.2, y: a.y + 0.2 },
          0.9,
          face(2.3, c.dir),
          face(0.2, c.dir),
          0.4,
          TEAL,
          FOAM,
          0.22,
        );
        if (c.hit) {
          fx.spark(p, { n: 8, color: BRASS, speed: 5, dir: face(0.5, c.dir), spread: 2 });
          fx.burst(p, { n: 6, color: TEAL, length: 0.5, life: 0.2 });
          fx.word({ x: p.x, y: p.y + 0.7 }, 'TING!', { color: BRASS, size: 0.38, life: 0.5 });
        }
      }
    },
    impactFx: (c) => {
      const fx = eng(c);
      const o = outcomeOf(c);
      const p = hitPoint(c);
      const a = c.attacker.anchors().chest;
      crescent(
        c,
        { x: a.x + c.dir * 0.3, y: a.y + 0.1 },
        1.0,
        face(-0.6, c.dir),
        face(2.1, c.dir),
        0.45,
        CRIM,
        '#ffe0e4',
        0.26,
      );
      if (o === 'hit') {
        fx.later(0.05, () =>
          crescent(c, p, 0.7, face(2.4, c.dir), face(0.3, c.dir), 0.4, BRASS, '#fff', 0.24),
        );
        fx.glow(p, { radius: 1.1, color: BRASS, life: 0.25 });
        fx.burst(p, { n: 12, color: TEAL, length: 1.0, life: 0.32 });
        fx.spark(p, { n: 16, color: BRASS, speed: 7, dir: face(0.4, c.dir), spread: 2.6 });
        fx.ring(p, { color: CRIM, radius: 0.8, life: 0.35 });
        fx.word({ x: p.x, y: p.y + 0.85 }, 'HEY-HO!', { color: BRASS, size: 0.55, life: 0.85 });
      } else if (o !== 'block') {
        fx.dust({ x: p.x, y: 0 }, { n: 4 });
        fx.word({ x: p.x, y: p.y + 0.7 }, 'OLÉ', { color: BRASS, size: 0.4, life: 0.6 });
      }
    },
  },

  // ── Salt and Steel: the swing of a ship's boom, a sheet of sea water behind the blade ──
  'corsair-salt-and-steel': {
    palette: { main: FOAM, accent: '#58c8d0', dark: '#08303a' },
    choreograph: (base) =>
      retime(base, 0.22, 1.05, [
        { t: 0.12, p: { x: -0.35, y: -0.2, lean: 0.3, spin: -0.6, hR: 0.9, kR: -1.3 } },
      ]),
    start: (c) => {
      const mx = (c.attacker.baseX + c.defender.baseX) / 2;
      const dir = c.dir;
      const imp = c.impact;
      // The boom and a scrap of sail swinging across the background.
      eng(c).layer('back', imp + 0.4, (ctx, k) => {
        const u = Math.min(1, (k * (imp + 0.4)) / imp);
        const swing = -1.1 + u * 2.2;
        ctx.globalAlpha = 0.55 * (1 - Math.max(0, (k * (imp + 0.4) - imp) / 0.4));
        ctx.save();
        ctx.translate(mx - dir * 1.8, 2.7);
        ctx.rotate(dir * (swing * 0.3));
        ctx.fillStyle = '#6b4423';
        ctx.fillRect(0, -0.06, dir * 3.6, 0.12);
        ctx.fillStyle = '#e8dcc0';
        ctx.beginPath();
        ctx.moveTo(0, -0.06);
        ctx.lineTo(dir * 3.4, -0.06);
        ctx.lineTo(0, -1.9);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
    },
    windup: (c) => {
      const fx = eng(c);
      if (c.t > 0.18 && (Math.floor(c.t * 36) & 1) === 0) {
        const t = c.attacker.anchors().tip;
        fx.spark(t, { n: 2, color: FOAM, speed: 3, dir: up, spread: 3, size: 0.04 });
      }
      if (c.t >= c.impact - 0.24 && fx.once('sheet')) {
        const a = c.attacker.anchors().chest;
        crescent(
          c,
          { x: a.x + c.dir * 0.2, y: a.y - 0.1 },
          1.6,
          face(3.5, c.dir),
          face(-0.5, c.dir),
          0.9,
          '#58c8d0',
          FOAM,
          0.4,
          0.55,
        );
        crescent(
          c,
          { x: a.x + c.dir * 0.2, y: a.y - 0.1 },
          1.25,
          face(3.7, c.dir),
          face(-0.3, c.dir),
          0.3,
          FOAM,
          '#fff',
          0.34,
          0.55,
        );
        fx.speedLines({ dir: c.dir === 1 ? Math.PI : 0, color: FOAM, life: 0.3, n: 14 });
      }
    },
    impactFx: (c) => {
      const fx = eng(c);
      const o = outcomeOf(c);
      const p = hitPoint(c);
      const a = c.attacker.anchors().feet;
      splash(c, a.x + c.dir * 0.8, 10, 2.6);
      if (o === 'hit') {
        fx.glow(p, { radius: 1.4, color: FOAM, life: 0.28 });
        fx.burst(p, { n: 14, color: '#58c8d0', length: 1.2, life: 0.36 });
        fx.spark(p, { n: 22, color: FOAM, speed: 8, dir: face(0.5, c.dir), spread: 3 });
        fling(c, paintDrop, p, 12, face(0.8, c.dir), 3, 2.6, 0.8, 0.9);
        fx.word({ x: p.x, y: p.y + 0.9 }, 'SPLASH!', { color: '#9ff0f4', size: 0.66, life: 0.9 });
        fx.wash('#58c8d0', 0.22, 0.5);
        fx.later(0.2, () => fx.dust({ x: p.x, y: 0.3 }, { n: 5, color: FOAM, size: 0.2 }));
      } else if (o !== 'block')
        fx.word({ x: a.x + c.dir * 1.6, y: 1.0 }, 'WHOOSH', { color: FOAM, size: 0.42, life: 0.6 });
    },
  },

  // ── Barbary Reaper: a double whirlwind, three rotating blades of crimson, a red moon on defeat ──
  'corsair-barbary-reaper': {
    palette: { main: '#ff7a8a', accent: CRIM, dark: '#2a0a12' },
    choreograph: (base) => {
      const fixed = base.keys.map((k) =>
        k.p.spin !== undefined && k.p.spin > 6
          ? { t: k.t, p: { ...k.p, spin: k.p.spin + TAU } }
          : k,
      );
      return retime({ ...base, keys: fixed }, 0.2, 1.1, [
        { t: 0.1, p: { x: -0.4, y: -0.25, lean: 0.3, spin: -0.8, hR: 0.9, kR: -1.3 } },
      ]);
    },
    start: (c) => {
      const fx = eng(c);
      fx.wash('#2a0a12', 0.32, c.impact + 0.3);
      fx.speedLines({ dir: c.dir === 1 ? Math.PI : 0, color: '#ff7a8a', life: c.impact, n: 24 });
    },
    windup: (c) => {
      const fx = eng(c);
      const a = c.attacker.anchors();
      if (c.t > 0.25) {
        const ang = c.t * 22;
        fx.trailPoint('reap', a.tip, { color: CRIM, width: 0.4, fade: 0.28 });
        if ((Math.floor(c.t * 30) & 1) === 0) {
          fx.dust(
            { x: a.feet.x + Math.cos(ang) * 0.6, y: 0 },
            { n: 1, size: 0.2, color: '#c9b890' },
          );
          fx.spark(
            { x: a.chest.x, y: a.chest.y + Math.sin(ang) * 0.6 },
            { n: 1, color: '#ff7a8a', speed: 2, dir: ang, spread: 1, size: 0.04 },
          );
        }
      }
      if (c.t >= c.impact - 0.3 && fx.once('whirl')) {
        const x = a.chest.x;
        const y = a.chest.y;
        for (let i = 0; i < 3; i++) {
          crescent(
            c,
            { x, y },
            1.0 + i * 0.35,
            (i * TAU) / 3,
            (i * TAU) / 3 + TAU * 0.9,
            0.4,
            i === 1 ? '#ff7a8a' : CRIM,
            '#ffe0e4',
            0.35,
            0.55,
          );
        }
      }
    },
    impactFx: (c) => {
      const fx = eng(c);
      const o = outcomeOf(c);
      const p = hitPoint(c);
      const a = c.attacker.anchors().feet;
      fx.ring(
        { x: a.x, y: 0.03 },
        { color: '#ff7a8a', radius: 2.4, life: 0.55, width: 0.12, flat: 0.22 },
      );
      fx.ring(
        { x: a.x, y: 0.03 },
        { color: CRIM, radius: 3.2, life: 0.7, width: 0.09, flat: 0.22 },
      );
      fx.dust({ x: a.x, y: 0 }, { n: 14, size: 0.26, color: '#c9b890' });
      if (o === 'hit') {
        fx.slowmo(0.4, 0.2);
        fx.layer('front', 0.5, (ctx, k) => {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = (1 - k) * 0.9;
          ctx.fillStyle = CRIM;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 0.9 + k * 0.7, 0, TAU);
          ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = '#2a0a12';
          ctx.beginPath();
          ctx.arc(p.x + c.dir * 0.25, p.y, 0.8 + k * 0.7, 0, TAU);
          ctx.fill();
        });
        crescent(c, p, 1.3, face(2.6, c.dir), face(-0.6, c.dir), 1.0, CRIM, '#fff', 0.4, 1);
        fx.glow(p, { radius: 1.8, color: '#ff7a8a', life: 0.3 });
        fx.burst(p, { n: 16, color: CRIM, length: 1.6, life: 0.4 });
        fx.spark(p, { n: 24, color: '#ff7a8a', speed: 9, dir: face(0.4, c.dir), spread: 3 });
        fx.word({ x: p.x, y: p.y + 0.95 }, 'REAP!', { color: '#ff9aa6', size: 0.72, life: 0.95 });
        fx.shake(0.2, 0.88);
        fx.punch(p, 1.18, 0.55);
      } else if (o !== 'block')
        fx.word({ x: a.x + c.dir * 1.6, y: 1.1 }, 'WHIRL', {
          color: '#ff9aa6',
          size: 0.46,
          life: 0.6,
        });
    },
    finish: (c) => {
      const fx = eng(c);
      const p = hitPoint(c);
      fx.impactFrame(0.07);
      fx.layer('back', 0.9, (ctx, k) => {
        // A soft blood-red bloom, not a flat disc (a hard-edged circle read as a sticker).
        const cy = p.y + 0.8 + k * 0.6;
        const g = ctx.createRadialGradient(p.x, cy, 0.1, p.x, cy, 1.7);
        g.addColorStop(0, CRIM);
        g.addColorStop(0.55, `${CRIM}99`);
        g.addColorStop(1, `${CRIM}00`);
        ctx.globalAlpha = Math.sin(k * Math.PI) * 0.75;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, cy, 1.7, 0, TAU);
        ctx.fill();
      });
      fx.flash('#ff7a8a', 0.3, 0.2);
    },
  },

  // ── Grapple: an iron hook flung on a rope, hauled tight; the rope stays taut ──
  'corsair-grapple': {
    palette: { main: '#c9d4d8', accent: BRASS, dark: '#1a2428' },
    choreograph: (base) =>
      hauled(
        retime(base, 0.1, 0.9, [{ t: 0.06, p: { x: -0.2, lean: 0.2, sR: 2.2, eR: 0.8 } }]),
        advOf(base),
      ),
    windup: (c) => {
      const fx = eng(c);
      const a = c.attacker.anchors();
      if (c.t > 0.08 && c.t < c.impact - 0.2 && (Math.floor(c.t * 30) & 1) === 0) {
        fx.spark(a.hand, {
          n: 1,
          color: '#c9d4d8',
          speed: 2,
          dir: Math.sin(c.t * 40) * 3,
          spread: 6,
          size: 0.03,
        });
      }
      if (c.t >= c.impact - 0.22 && fx.once('throw')) {
        const from = { x: a.hand.x, y: a.hand.y };
        const d = c.defender.anchors();
        const to =
          c.hit || c.reaction === 'defend'
            ? { x: d.chest.x - c.dir * 0.12, y: d.chest.y }
            : { x: d.chest.x + c.dir * 1.2, y: 0.15 };
        const ax = c.attacker;
        fx.layer('front', 0.22, (ctx, k) => {
          const h = ax.anchors().hand;
          const px = h.x + (to.x - h.x) * k;
          const py = h.y + (to.y - h.y) * k;
          ctx.strokeStyle = '#c9b27a';
          ctx.lineWidth = 0.045;
          ctx.beginPath();
          ctx.moveTo(h.x, h.y);
          ctx.quadraticCurveTo((h.x + px) / 2, (h.y + py) / 2 - 0.25 * (1 - k), px, py);
          ctx.stroke();
        });
        fx.sprite({ from, to, life: 0.22, arc: 0.2, trail: '#c9d4d8', paint: paintClaw });
        fx.word({ x: from.x + c.dir * 0.5, y: from.y + 0.6 }, 'WHIRR', {
          color: '#c9d4d8',
          size: 0.3,
          life: 0.4,
        });
      }
    },
    impactFx: (c) => {
      const fx = eng(c);
      const o = outcomeOf(c);
      const p = hitPoint(c);
      const ax = c.attacker;
      if (o === 'hit') {
        fx.glow(p, { radius: 1.0, color: '#c9d4d8', life: 0.22 });
        fx.burst(p, { n: 8, color: BRASS, length: 0.8, life: 0.28 });
        fx.spark(p, { n: 14, color: '#c9d4d8', speed: 6, dir: face(0.5, c.dir), spread: 2.4 });
        fx.ring(p, { color: BRASS, radius: 0.7, life: 0.35 });
        fx.word({ x: p.x, y: p.y + 0.8 }, 'CLANK!', { color: '#ffe9a0', size: 0.58, life: 0.8 });
        // The rope stays taut and trembles while the target is hauled in.
        fx.layer('front', 0.9, (ctx, k) => {
          const h = ax.anchors().hand;
          ctx.globalAlpha = 1 - Math.max(0, (k - 0.7) / 0.3);
          ctx.strokeStyle = '#c9b27a';
          ctx.lineWidth = 0.05;
          ctx.beginPath();
          ctx.moveTo(h.x, h.y);
          ctx.lineTo((h.x + p.x) / 2, (h.y + p.y) / 2 + Math.sin(k * 60) * 0.04 * (1 - k));
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          ctx.fillStyle = '#3a4448';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 0.1, 0, TAU);
          ctx.fill();
        });
      } else if (o !== 'block') {
        fx.dust({ x: p.x + c.dir * 1.2, y: 0 }, { n: 6 });
        fx.spark(
          { x: p.x + c.dir * 1.2, y: 0.1 },
          { n: 8, color: '#c9d4d8', speed: 5, dir: up, spread: 1.6 },
        );
        fx.word({ x: p.x + c.dir * 1.0, y: 0.8 }, 'CLANG', {
          color: '#c9d4d8',
          size: 0.4,
          life: 0.6,
        });
      }
    },
    follow: (c) => {
      const fx = eng(c);
      if (c.hit && !c.defeated && c.t >= c.impact + 0.3 && fx.once('haul')) {
        const f = c.defender.anchors().feet;
        fx.dust({ x: f.x, y: 0 }, { n: 8 });
        fx.speedLines({ dir: c.dir === 1 ? Math.PI : 0, color: '#c9d4d8', life: 0.3, n: 12 });
        // Low, over the dragged feet, clear of CLANK! up at the hit point and of K.O.!
        fx.word({ x: f.x - c.dir * 0.6, y: 0.4 }, 'HAUL!', { color: BRASS, size: 0.46, life: 0.6 });
      }
    },
  },

  // ── Keelhaul: hook, wrench off balance, drive into the ground and a column of sea water ──
  'corsair-keelhaul': {
    palette: { main: '#9ff0f4', accent: TEAL, dark: '#07282e' },
    choreograph: (base) =>
      retime(base, 0.4, 1.0, [
        { t: 0.1, p: { x: -0.3, lean: 0.3, sR: 2.0, eR: 0.9, sL: 2.0 } },
        { t: 0.24, p: { x: 0.2, lean: -0.15, sR: 1.6, eR: 0.3, sL: 1.7, hR: 0.6, kR: -0.4 } },
        { t: 0.4, p: { x: -0.2, y: 0.18, lean: 0.4, sR: 2.9, eR: 0.5, sL: 2.9 } },
      ]),
    start: (c) => eng(c).wash('#07282e', 0.22, c.impact),
    windup: (c) => {
      const fx = eng(c);
      const a = c.attacker.anchors();
      if (c.t >= 0.24 && fx.once('hook')) {
        const d = c.defender.anchors();
        const to = { x: d.chest.x - c.dir * 0.1, y: d.chest.y };
        fx.sprite({
          from: { x: a.hand.x, y: a.hand.y },
          to,
          life: 0.14,
          trail: '#c9d4d8',
          paint: paintClaw,
        });
        fx.layer('front', 0.5, (ctx, k) => {
          const h = c.attacker.anchors().hand;
          ctx.globalAlpha = 1 - k * k;
          ctx.strokeStyle = '#c9b27a';
          ctx.lineWidth = 0.05;
          ctx.beginPath();
          ctx.moveTo(h.x, h.y);
          ctx.lineTo(to.x, to.y + Math.sin(k * 50) * 0.03);
          ctx.stroke();
        });
        fx.word({ x: a.hand.x + c.dir * 0.6, y: a.hand.y + 0.7 }, 'HOOK!', {
          color: '#c9d4d8',
          size: 0.34,
          life: 0.5,
        });
        fling(c, paintRope, { x: a.hand.x, y: a.hand.y }, 3, up, 2, 1.0, 0.5);
      }
      if (c.t >= c.impact - 0.25 && fx.once('lift')) {
        fx.slowmo(0.4, 0.22);
        fx.speedLines({ color: '#9ff0f4', life: 0.3, n: 16 });
      }
    },
    impactFx: (c) => {
      const fx = eng(c);
      const o = outcomeOf(c);
      const d = c.defender.anchors().feet;
      const x = d.x - c.dir * 0.2;
      splash(c, x, 14, 3.2);
      fx.ring({ x, y: 0.03 }, { color: FOAM, radius: 3.0, life: 0.7, width: 0.12, flat: 0.2 });
      fx.dust({ x, y: 0 }, { n: 14, size: 0.24 });
      if (o === 'hit') {
        fx.layer('front', 0.6, (ctx, k) => {
          const h = 2.4 * Math.min(1, k * 4);
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = (1 - k) * 0.7;
          ctx.fillStyle = TEAL;
          ctx.beginPath();
          ctx.moveTo(x - 0.5, 0);
          ctx.quadraticCurveTo(x - 0.25, h * 0.6, x, h);
          ctx.quadraticCurveTo(x + 0.25, h * 0.6, x + 0.5, 0);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = FOAM;
          ctx.globalAlpha = (1 - k) * 0.8;
          ctx.fillRect(x - 0.1, 0, 0.2, h * 0.8);
        });
        fling(c, paintPlank, { x, y: 0.5 }, 5, up, 2.6, 2.0, 0.8, 1.0);
        fx.glow({ x, y: 0.8 }, { radius: 1.8, color: '#9ff0f4', life: 0.3 });
        fx.word({ x, y: 2.4 }, 'SPLOOSH!', { color: '#bff8fa', size: 0.72, life: 0.95 });
        fx.shake(0.22, 0.88);
        fx.punch({ x, y: 0.8 }, 1.2, 0.6);
      } else if (o !== 'block') {
        fling(c, paintPlank, { x, y: 0.2 }, 3, up, 2, 1.4, 0.6);
        fx.word({ x, y: 1.0 }, 'GLUG', { color: FOAM, size: 0.4, life: 0.6 });
      }
    },
    finish: (c) => {
      const p = hitPoint(c);
      eng(c).impactFrame(0.06);
      fling(c, paintDrop, { x: p.x, y: 0.6 }, 14, up, 3.8, 3, 1.1, 1.3);
    },
  },
};

/** Adds a haul-back lean after the impact (the target is dragged in). */
function hauled(m: Move, adv: number): Move {
  const keys = m.keys.map((k) =>
    k.t > m.impact && k.t < m.impact + 0.4
      ? { t: k.t, p: { ...k.p, x: adv - 0.2, lean: 0.25, sR: 1.1 } }
      : k,
  );
  return { ...m, keys };
}
