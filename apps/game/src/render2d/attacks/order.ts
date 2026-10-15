/**
 * Knights of St John: red, white and gold, Maltese crosses, chivalric heroism.
 * Ten attack scripts; local helpers are shared but each attack has its own shapes and timing.
 */
import { withVariants } from './variants';
import type { Key, Move } from '../../render/duelMoves';
import type { AttackScript, AttackScripts, FxContext, V2 } from '../contract';
import { eng, face, hitPoint, outcomeOf } from './styleDefaults';

const TAU = Math.PI * 2;
const RED = '#d02a32';
const GOLD = '#f2c14e';
const CREAM = '#fff6e0';

// ── choreography helpers ──

function retime(base: Move, map: (t: number) => number, keys: readonly Key[] = base.keys): Move {
  return {
    ...base,
    keys: keys.map((k) => ({ t: map(k.t), p: k.p })),
    impact: map(base.impact),
    trail: base.trail ? [map(base.trail[0]), map(base.trail[1])] : null,
    dust: base.dust.map(map),
  };
}

function withKeys(base: Move, extra: readonly Key[], impact = base.impact): Move {
  const keys = [...base.keys, ...extra].sort((a, b) => a.t - b.t);
  return { ...base, keys, impact };
}

/** Pushes everything at or after `from` back by `dt` (a held pose, a pause). */
const hold = (base: Move, from: number, dt: number): Move =>
  retime(base, (t) => (t >= from ? t + dt : t));

// ── drawing helpers ──

const cross = new Float32Array(32);
/** Fills `cross` with the 16 vertices of an eight-pointed (Maltese) cross. */
function crossPoints(x: number, y: number, r: number, rot: number): void {
  let n = 0;
  for (let a = 0; a < 4; a++) {
    const th = rot + (a * Math.PI) / 2;
    const c = Math.cos(th);
    const s = Math.sin(th);
    const u = [0.2, 1.0, 0.8, 1.0];
    const v = [-0.2, -0.38, 0, 0.38];
    for (let i = 0; i < 4; i++) {
      cross[n++] = x + (u[i]! * c - v[i]! * s) * r;
      cross[n++] = y + (u[i]! * s + v[i]! * c) * r;
    }
  }
}
function crossPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rot: number,
  upTo = 16,
): void {
  crossPoints(x, y, r, rot);
  ctx.beginPath();
  ctx.moveTo(cross[0]!, cross[1]!);
  const whole = Math.floor(upTo);
  for (let i = 1; i < whole; i++) ctx.lineTo(cross[i * 2]!, cross[i * 2 + 1]!);
  if (upTo >= 16) ctx.closePath();
  else if (whole < 16) {
    const f = upTo - whole;
    const a = whole - 1;
    const b = whole % 16;
    ctx.lineTo(
      cross[a * 2]! + (cross[b * 2]! - cross[a * 2]!) * f,
      cross[a * 2 + 1]! + (cross[b * 2 + 1]! - cross[a * 2 + 1]!) * f,
    );
  }
}

/** A Maltese cross that pops, spins slightly and fades. */
function crossPop(
  c: FxContext,
  at: V2,
  r: number,
  life: number,
  fill: string,
  edge = CREAM,
  rot = 0,
): void {
  // Big crosses are capped so a finisher stamp never covers the fighters.
  const R = (r <= 1.2 ? r : 1.2 + (r - 1.2) * 0.5) * 0.8;
  eng(c).layer('front', life, (ctx, k) => {
    const grow = 1 - (1 - Math.min(1, k * 3)) ** 3;
    ctx.globalAlpha = k < 0.6 ? 1 : (1 - k) / 0.4;
    crossPath(ctx, at.x, at.y, R * (0.35 + 0.65 * grow), rot + k * 0.5);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = R * 0.07;
    ctx.strokeStyle = edge;
    ctx.stroke();
  });
}

/** A tapering light stroke drawn quickly from a to b, then fading. */
function cutLine(c: FxContext, a: V2, b: V2, life: number, color: string, width: number): void {
  eng(c).layer('front', life, (ctx, k) => {
    const u = Math.min(1, k * 5);
    const ex = a.x + (b.x - a.x) * u;
    const ey = a.y + (b.y - a.y) * u;
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = color;
    ctx.lineWidth = width * (1 - k * 0.7);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = width * 0.35 * (1 - k);
    ctx.stroke();
  });
}

/** Motes of light drawn in towards a moving anchor while the blow is wound up. */
function motes(
  c: FxContext,
  anchor: 'hand' | 'tip' | 'chest',
  color: string,
  reach: number,
  n: number,
  life: number,
  up = false,
): void {
  const rig = c.attacker;
  eng(c).layer('front', life, (ctx, k) => {
    const p = rig.anchors()[anchor];
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = color;
    const fade = Math.min(1, k * 4) * (k > 0.9 ? (1 - k) * 10 : 1);
    for (let i = 0; i < n; i++) {
      const ph = (k * 2.4 + i / n) % 1;
      const a = i * 2.399 + k * 2;
      const d = (1 - ph) * reach;
      ctx.globalAlpha = fade * ph * 0.9;
      const x = p.x + (up ? Math.cos(a) * reach * 0.5 : Math.cos(a) * d);
      const y = p.y + (up ? -0.4 + ph * reach * 1.4 : Math.sin(a) * d);
      ctx.beginPath();
      ctx.arc(x, y, 0.035 + 0.03 * ph, 0, TAU);
      ctx.fill();
    }
  });
}

/** A glowing line along the weapon (hand to tip) that brightens towards contact. */
function glowBlade(c: FxContext, color: string, width: number, life: number): void {
  const rig = c.attacker;
  eng(c).layer('front', life, (ctx, k) => {
    const a = rig.anchors();
    const on = Math.min(1, k * 2.2) * (k > 0.9 ? (1 - k) * 10 : 1);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.globalAlpha = on * (0.55 + 0.25 * Math.sin(k * 60));
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(a.hand.x, a.hand.y);
    ctx.lineTo(a.tip.x, a.tip.y);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = on * 0.8;
    ctx.lineWidth = width * 0.3;
    ctx.stroke();
  });
}

/** A four-pointed glint. */
function glint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
): void {
  ctx.fillStyle = color;
  for (let i = 0; i < 2; i++) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(i * Math.PI * 0.5);
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.quadraticCurveTo(0, r * 0.12, r, 0);
    ctx.quadraticCurveTo(0, -r * 0.12, -r, 0);
    ctx.fill();
    ctx.restore();
  }
}

const dirAng = (c: FxContext) => (c.dir === 1 ? 0 : Math.PI);

function whiffWord(c: FxContext, text: string, color: string): void {
  const at = c.defender.anchors().chest;
  eng(c).word({ x: at.x - c.dir * 0.3, y: at.y + 0.75 }, text, { color, size: 0.42, life: 0.6 });
}

/** Shield pieces flying off a point (red, cream and steel). */
function shards(c: FxContext, at: V2, n: number, speed: number): void {
  const fx = eng(c);
  const cols = [RED, CREAM, '#aab6c4'];
  for (let i = 0; i < n; i++) {
    const a = fx.rand() * Math.PI + 0.1;
    const sp = speed * (0.5 + fx.rand());
    const col = cols[i % 3]!;
    const spin = (fx.rand() - 0.5) * 20;
    fx.sprite({
      from: at,
      to: { x: at.x + Math.cos(a) * sp * 0.45 * (fx.rand() < 0.5 ? -1 : 1), y: 0.05 },
      life: 0.5 + fx.rand() * 0.2,
      arc: 0.5 + sp * 0.12,
      paint: (ctx, p, _ang, k) => {
        ctx.translate(p.x, p.y);
        ctx.rotate(k * spin);
        ctx.globalAlpha = 1 - k * k;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(-0.1, -0.06);
        ctx.lineTo(0.12, 0);
        ctx.lineTo(-0.04, 0.11);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3a2a20';
        ctx.lineWidth = 0.015;
        ctx.stroke();
      },
    });
  }
}

// ═════════════════════════════ scripts ═════════════════════════════

const crossCut: AttackScript = {
  palette: { main: CREAM, accent: RED, dark: '#4a0d12' },
  choreograph: (base) => {
    const w = base.keys[0]!;
    // Coil back with a half-step, then spring in on the diagonal; a trailing recovery cut.
    return withKeys(
      retime(base, (t) => t * 1.1),
      [
        { t: w.t * 0.5, p: { x: -0.25, lean: 0.22, sR: 1.2, eR: 0.9, hR: 0.5, kR: -0.8 } },
        {
          t: base.impact * 1.1 + 0.4,
          p: { x: (base.keys[1]!.p.x ?? 0) + 0.1, sR: 2.2, eR: 0.3, wR: 0.4, lean: -0.1 },
        },
      ],
    );
  },
  start: (c) => {
    eng(c).wash('#4a0d12', 0.14, 0.6);
    glowBlade(c, RED, 0.12, c.impact + 0.1);
  },
  windup: (c) => {
    const fx = eng(c);
    if (c.t > 0.08 && c.t < c.impact - 0.05 && (Math.floor(c.t * 40) & 3) === 0) {
      const t = c.attacker.anchors().tip;
      fx.spark(t, { n: 1, color: CREAM, speed: 1.5, size: 0.025 });
    }
    if (c.t >= c.impact - 0.15 && fx.once('smear')) {
      const a = c.attacker.anchors().chest;
      fx.arc(
        { x: a.x + c.dir * 0.2, y: a.y + 0.3 },
        {
          radius: 1.2,
          from: face(2.4, c.dir),
          to: face(-0.8, c.dir),
          width: 0.5,
          color: RED,
          life: 0.28,
        },
      );
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const p = hitPoint(c);
    const sx = c.dir * 0.55;
    if (o === 'hit') {
      cutLine(c, { x: p.x - sx, y: p.y + 0.95 }, { x: p.x + sx, y: p.y - 0.95 }, 0.45, RED, 0.2);
      crossPop(c, { x: p.x - c.dir * 0.05, y: p.y + 0.1 }, 0.5, 0.55, RED);
      fx.burst(p, { n: 9, color: CREAM, length: 1.1, life: 0.3 });
      fx.spark(p, { n: 16, color: RED, speed: 7, dir: face(0.9, c.dir), spread: 2.2 });
      fx.spark(p, { n: 8, color: CREAM, speed: 9, dir: face(-0.9, c.dir), spread: 1.2 });
      fx.word({ x: p.x - c.dir * 0.1, y: p.y + 0.95 }, 'SHING!', {
        color: RED,
        size: 0.55,
        life: 0.8,
      });
      fx.speedLines({ dir: face(-0.7, c.dir), color: CREAM, life: 0.22, n: 12 });
    } else if (o === 'block') {
      cutLine(
        c,
        { x: p.x - sx, y: p.y + 0.95 },
        { x: p.x - sx * 0.15, y: p.y + 0.15 },
        0.3,
        CREAM,
        0.14,
      );
      fx.word({ x: p.x, y: p.y + 0.95 }, 'CLANG!', { color: CREAM, size: 0.45, life: 0.6 });
    } else {
      cutLine(
        c,
        { x: p.x - c.dir * 0.9, y: p.y + 0.9 },
        { x: p.x - c.dir * 0.2, y: p.y - 0.8 },
        0.35,
        RED,
        0.14,
      );
      whiffWord(c, 'SWISH!', RED);
    }
  },
};

const pilgrimThrust: AttackScript = {
  palette: { main: '#fff2c0', accent: '#ffc83a', dark: '#5a3d08' },
  choreograph: (base) => {
    const i = base.impact;
    const wk = base.keys[0]!;
    // A quick feint jab, a hop back, then the deep lunge.
    const m = hold(base, wk.t, 0.2);
    return withKeys(m, [
      { t: wk.t * 0.5, p: { ...wk.p, x: (wk.p.x ?? 0) * 0.8, sR: 1.1, eR: 0.3 } },
      { t: wk.t + 0.1, p: { ...wk.p, x: (wk.p.x ?? 0) - 0.3, y: 0.08 } },
      {
        t: i + 0.2 + 0.28,
        p: { x: (base.keys[1]!.p.x ?? 0) + 0.3, y: -0.15, sR: 1.5, lean: -0.5 },
      },
    ]);
  },
  start: (c) => eng(c).speedLines({ dir: dirAng(c) + Math.PI, color: '#ffe9a0', life: 0.3, n: 8 }),
  windup: (c) => {
    const fx = eng(c);
    const rig = c.attacker;
    if (fx.once('star'))
      fx.layer('front', c.impact + 0.05, (ctx, k) => {
        const t = rig.anchors().tip;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(1, k * 1.8);
        glint(ctx, t.x, t.y, 0.12 + 0.55 * k * k, '#ffe08a');
        glint(ctx, t.x, t.y, 0.06 + 0.3 * k, '#ffffff');
      });
    if (c.t >= c.impact - 0.12 && fx.once('lunge')) {
      const a = rig.anchors();
      fx.layer('front', 0.22, (ctx, k) => {
        const e = Math.min(1, k * 5);
        const x1 = a.hand.x + (a.tip.x - a.hand.x) * 1 + c.dir * 1.8 * e;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = (1 - k) * 0.9;
        ctx.fillStyle = '#ffc83a';
        ctx.beginPath();
        ctx.moveTo(a.hand.x, a.hand.y + 0.12);
        ctx.lineTo(x1, a.tip.y);
        ctx.lineTo(a.hand.x, a.hand.y - 0.12);
        ctx.fill();
      });
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const p = hitPoint(c);
    const out = { x: p.x + c.dir * 0.7, y: p.y };
    if (o === 'hit') {
      // The point goes straight through: entry flash, three piercing rays, exit spray.
      fx.glow(p, { radius: 0.9, color: '#ffc83a', life: 0.25 });
      fx.layer('front', 0.4, (ctx, k) => {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = (1 - k) * 0.95;
        for (let i = -1; i <= 1; i++) {
          ctx.strokeStyle = i === 0 ? '#ffffff' : '#ffc83a';
          ctx.lineWidth = i === 0 ? 0.06 : 0.03;
          ctx.beginPath();
          ctx.moveTo(p.x - c.dir * 0.5, p.y + i * 0.12 * (1 - k));
          ctx.lineTo(p.x + c.dir * (1.8 + k * 0.6), p.y + i * 0.12 * (1 + k));
          ctx.stroke();
        }
        glint(ctx, p.x, p.y, 0.7 * (1 - k), '#fff2c0');
      });
      fx.burst(out, { n: 8, color: '#ffe9a0', length: 0.9, life: 0.28 });
      fx.spark(out, { n: 14, color: '#ffc83a', speed: 8, dir: face(0.1, c.dir), spread: 0.9 });
      fx.ring(p, { color: '#ffc83a', radius: 0.7, life: 0.35, width: 0.07 });
      fx.word({ x: p.x, y: p.y + 0.9 }, 'PIERCE!', { color: '#ffc83a', size: 0.5, life: 0.8 });
      fx.speedLines({ dir: dirAng(c) + Math.PI, color: '#fff2c0', life: 0.25, n: 14 });
    } else if (o === 'block') {
      fx.spark(p, { n: 10, color: '#ffe9a0', speed: 7, dir: Math.PI / 2, spread: 2.4 });
      fx.word({ x: p.x, y: p.y + 0.85 }, 'CLINK!', { color: '#ffe9a0', size: 0.42, life: 0.6 });
    } else {
      fx.spark(
        { x: p.x - c.dir * 0.2, y: p.y + 0.3 },
        { n: 8, color: '#ffe9a0', speed: 5, dir: dirAng(c), spread: 0.6 },
      );
      whiffWord(c, 'WHIFF', '#ffe9a0');
    }
  },
  finish: (c) => {
    const p = hitPoint(c);
    crossPop(c, { x: p.x, y: p.y + 0.2 }, 0.9, 0.9, GOLD);
  },
};

const shieldbreaker: AttackScript = {
  palette: { main: '#e9eef5', accent: '#d63b3b', dark: '#2a1418' },
  choreograph: (base) => {
    const w = base.keys[0]!;
    // Leap high, hang, then crash down with both arms.
    const m = hold(base, base.impact, 0.1);
    return withKeys(m, [
      { t: w.t * 0.55, p: { ...w.p, y: 0.55, x: (w.p.x ?? 0) * 0.9, hR: 1.0, kR: -1.2 } },
    ]);
  },
  start: (c) => {
    eng(c).wash('#2a1418', 0.18, 0.8);
    motes(c, 'chest', '#ff6a5a', 0.9, 10, c.impact, true);
  },
  windup: (c) => {
    const fx = eng(c);
    if (c.t >= c.impact - 0.2 && fx.once('smear')) {
      const a = c.attacker.anchors().chest;
      fx.arc(
        { x: a.x + c.dir * 0.3, y: a.y + 0.4 },
        {
          radius: 1.3,
          from: face(2.9, c.dir),
          to: face(-0.1, c.dir),
          width: 0.7,
          color: '#d63b3b',
          life: 0.3,
        },
      );
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const p = hitPoint(c);
    const guard = c.defender.anchors().offHand;
    const g = o === 'block' ? { x: guard.x, y: guard.y } : p;
    if (o === 'hit' || o === 'block') {
      // A heater shield flashes up and bursts into pieces.
      eng(c).layer('front', 0.25, (ctx, k) => {
        ctx.globalAlpha = 1 - k;
        ctx.translate(g.x, g.y);
        ctx.scale(1 + k * 0.4, 1 + k * 0.4);
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.moveTo(-0.35, 0.4);
        ctx.lineTo(0.35, 0.4);
        ctx.lineTo(0.35, -0.05);
        ctx.quadraticCurveTo(0.3, -0.4, 0, -0.55);
        ctx.quadraticCurveTo(-0.3, -0.4, -0.35, -0.05);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = CREAM;
        ctx.fillRect(-0.06, -0.4, 0.12, 0.8);
        ctx.fillRect(-0.28, 0, 0.56, 0.12);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.03;
        ctx.beginPath();
        ctx.moveTo(-0.2, 0.4);
        ctx.lineTo(0.05, 0.05);
        ctx.lineTo(-0.1, -0.3);
        ctx.moveTo(0.05, 0.05);
        ctx.lineTo(0.3, -0.1);
        ctx.stroke();
      });
      fx.later(0.12, () => shards(c, g, 8, 5));
      fx.word({ x: g.x, y: g.y + 0.95 }, o === 'block' ? 'SHATTER!' : 'CRACK!', {
        color: '#d63b3b',
        size: 0.58,
        life: 0.9,
      });
      fx.burst(g, { n: 12, color: CREAM, length: 1.2, life: 0.3 });
    }
    const f = c.defender.anchors().feet;
    fx.ring(
      { x: f.x - c.dir * 0.3, y: 0.03 },
      { color: '#d63b3b', radius: 2.3, life: 0.55, width: 0.12, flat: 0.22 },
    );
    fx.dust({ x: f.x - c.dir * 0.3, y: 0 }, { n: 14, size: 0.22 });
    fx.shake(0.12, 0.88);
    if (o === 'miss' || o === 'dodge') {
      fx.spark(
        { x: f.x - c.dir * 0.3, y: 0.05 },
        { n: 12, color: CREAM, speed: 5, dir: Math.PI / 2, spread: 2 },
      );
      whiffWord(c, 'THUD!', '#e9eef5');
    }
  },
};

const eightPoint: AttackScript = {
  palette: { main: '#fff3d0', accent: GOLD, dark: '#5a1018' },
  choreograph: (base) => {
    const i = base.impact;
    const ix = i + 0.1;
    const h1 = ix - 0.26;
    const hit = base.keys[1]!.p;
    const up = base.keys[0]!.p;
    const keys: Key[] = [
      {
        t: h1 * 0.5,
        p: { x: (up.x ?? 0) * 0.6, sR: 0.2, eR: 0.7, wR: -0.4, lean: 0.12, hR: 0.5, kR: -0.6 },
      },
      {
        t: h1,
        p: {
          x: (hit.x ?? 0) - 0.1,
          y: 0.08,
          sR: 2.2,
          eR: 0.3,
          wR: 0.2,
          lean: -0.25,
          hR: 0.6,
          kR: -0.5,
        },
      },
      { t: h1 + 0.1, p: { ...up, x: (hit.x ?? 0) - 0.15, y: 0.12, sR: 3.0 } },
      { t: ix, p: { ...hit, x: hit.x ?? 0 } },
      { t: ix + 0.28, p: base.keys[2]!.p },
      { t: ix + 0.6, p: {} },
    ];
    return { ...base, keys, impact: ix, trail: [h1 * 0.5, ix + 0.15], dust: [h1, ix] };
  },
  start: (c) => {
    eng(c).wash('#5a1018', 0.14, 0.9);
    glowBlade(c, GOLD, 0.1, c.impact + 0.1);
  },
  windup: (c) => {
    const fx = eng(c);
    const h1 = c.impact - 0.26;
    if (c.t >= h1 && fx.once('cut1')) {
      const p = hitPoint(c);
      const ok = c.hit || c.reaction === 'defend';
      fx.arc(
        { x: p.x - c.dir * 0.2, y: p.y - 0.4 },
        {
          radius: 1.0,
          from: face(-0.9, c.dir),
          to: face(0.9, c.dir),
          width: 0.45,
          color: GOLD,
          life: 0.25,
        },
      );
      fx.spark(p, { n: ok ? 12 : 4, color: GOLD, speed: 6, dir: face(0.9, c.dir), spread: 1.4 });
      fx.word({ x: p.x - c.dir * 0.2, y: p.y + 0.8 }, ok ? 'SHING!' : 'SWISH!', {
        color: GOLD,
        size: 0.4,
        life: 0.5,
      });
      if (c.hit) {
        c.defender.flash = 0.6;
        fx.hitStop(35);
        fx.shake(0.05);
      }
    }
    if (c.t >= c.impact - 0.12 && fx.once('smear')) {
      const a = c.attacker.anchors().chest;
      fx.arc(
        { x: a.x + c.dir * 0.2, y: a.y + 0.3 },
        {
          radius: 1.2,
          from: face(2.6, c.dir),
          to: face(-0.6, c.dir),
          width: 0.5,
          color: CREAM,
          life: 0.26,
        },
      );
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const p = hitPoint(c);
    const at = { x: p.x - c.dir * 0.05, y: p.y + 0.15 };
    if (o === 'hit' || o === 'block') {
      // The eight-pointed cross is carved in light: traced stroke by stroke, then it floods with gold.
      fx.layer('front', 0.85, (ctx, k) => {
        const trace = Math.min(16, (k * 16) / 0.4);
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineJoin = 'round';
        const r = 0.95 + 0.1 * k;
        if (k > 0.3) {
          crossPath(ctx, at.x, at.y, r, 0.0);
          ctx.globalAlpha = Math.min(1, (k - 0.3) * 3) * (1 - k) * 0.9;
          ctx.fillStyle = GOLD;
          ctx.fill();
        }
        crossPath(ctx, at.x, at.y, r, 0.0, trace);
        ctx.globalAlpha = k < 0.6 ? 1 : (1 - k) / 0.4;
        ctx.strokeStyle = '#fff6d8';
        ctx.lineWidth = 0.09;
        ctx.stroke();
        ctx.strokeStyle = RED;
        ctx.lineWidth = 0.03;
        ctx.stroke();
      });
      fx.glow(at, { radius: 1.8, color: GOLD, life: 0.5 });
      fx.burst(at, { n: 16, color: CREAM, length: 1.5, life: 0.4 });
      fx.ring(at, { color: GOLD, radius: 1.8, life: 0.55, width: 0.1 });
      fx.spark(at, { n: 24, color: GOLD, speed: 8 });
      fx.word({ x: at.x, y: at.y + 1.3 }, 'EIGHT!', { color: GOLD, size: 0.62, life: 0.9 });
      fx.punch(at, 1.15, 0.5);
    } else {
      crossPop(c, { x: at.x - c.dir * 0.4, y: at.y }, 0.6, 0.6, GOLD);
      whiffWord(c, 'SWISH!', GOLD);
    }
  },
  finish: (c) => {
    const p = hitPoint(c);
    const fx = eng(c);
    fx.later(0.15, () => crossPop(c, { x: p.x, y: p.y + 0.3 }, 1.7, 0.9, RED, GOLD, Math.PI / 8));
    fx.impactFrame(0.07);
  },
};

const lastRampart: AttackScript = {
  palette: { main: '#ffe9a8', accent: '#e8a53a', dark: '#2c2118' },
  choreograph: (base) => {
    const w = base.keys[0]!;
    // Long, braced gather with a rising two-handed lift, then a titanic fall.
    const m = retime(base, (t) => t * 1.35);
    return withKeys(m, [
      {
        t: w.t * 0.5,
        p: { x: (w.p.x ?? 0) * 0.4, y: -0.1, sR: 1.2, eR: 0.5, lean: 0.1, hR: 0.5, kR: -0.8 },
      },
      { t: w.t * 1.35 + 0.08, p: { ...w.p, y: 0.5, sR: 3.25, sL: 3.15 } },
    ]);
  },
  start: (c) => {
    const fx = eng(c);
    fx.wash('#2c2118', 0.3, c.impact);
    const rig = c.attacker;
    // The ruined bastion of St Elmo rises behind the knight as the blow gathers.
    fx.layer('back', c.impact + 0.5, (ctx, k) => {
      const a = rig.anchors().feet;
      const u = Math.min(1, (k / 0.7) * 1.0);
      const e = 1 - (1 - u) ** 3;
      const base = 0;
      ctx.globalAlpha = 0.5 * e * (k > 0.85 ? (1 - k) / 0.15 : 1);
      ctx.fillStyle = '#6a5a48';
      const w = 3.2;
      const x0 = a.x - w * 0.35 * c.dir - (c.dir === 1 ? 0 : w);
      ctx.beginPath();
      ctx.rect(x0, base, w, 1.6 * e);
      ctx.fill();
      for (let i = 0; i < 5; i++) ctx.fillRect(x0 + 0.1 + i * 0.64, 1.6 * e, 0.38, 0.35 * e);
      ctx.fillStyle = '#3d3226';
      for (let i = 0; i < 4; i++) ctx.fillRect(x0 + 0.3 + i * 0.8, 0.3, 0.2, 0.9 * e);
      // The Order's banner on the wall.
      ctx.fillStyle = RED;
      ctx.fillRect(a.x - c.dir * 0.2 - 0.3, 1.5 * e, 0.6, 0.9 * e);
      ctx.fillStyle = CREAM;
      ctx.fillRect(a.x - c.dir * 0.2 - 0.05, 1.55 * e, 0.1, 0.8 * e);
      ctx.fillRect(a.x - c.dir * 0.2 - 0.22, 1.85 * e, 0.44, 0.1 * e);
    });
    motes(c, 'hand', '#ffd978', 1.3, 14, c.impact);
  },
  windup: (c) => {
    const fx = eng(c);
    if (c.t >= c.impact - 0.4 && fx.once('slow')) fx.slowmo(0.45, 0.3);
    if (c.t >= c.impact - 0.2 && fx.once('smear')) {
      const a = c.attacker.anchors().chest;
      fx.arc(
        { x: a.x + c.dir * 0.3, y: a.y + 0.5 },
        {
          radius: 1.5,
          from: face(3.0, c.dir),
          to: face(-0.1, c.dir),
          width: 0.9,
          color: '#ffd978',
          life: 0.35,
        },
      );
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const p = hitPoint(c);
    const f = c.defender.anchors().feet;
    const g = { x: f.x - c.dir * 0.25, y: 0.03 };
    fx.ring(g, { color: '#ffd978', radius: 3.4, life: 0.7, width: 0.16, flat: 0.22 });
    fx.ring(g, { color: CREAM, radius: 2.0, life: 0.5, width: 0.1, flat: 0.22 });
    fx.dust(g, { n: 22, size: 0.3 });
    // Masonry flies up and rains back down.
    for (let i = 0; i < 7; i++) {
      const sx = (fx.rand() - 0.5) * 2.4;
      const sz = 0.07 + fx.rand() * 0.07;
      fx.sprite({
        from: { x: g.x + sx * 0.2, y: 0.1 },
        to: { x: g.x + sx, y: 0.04 },
        life: 0.7,
        arc: 0.9 + fx.rand() * 0.7,
        paint: (ctx, q, _a, k) => {
          ctx.translate(q.x, q.y);
          ctx.rotate(k * 6 * (sx > 0 ? 1 : -1));
          ctx.globalAlpha = 1 - k * k * 0.8;
          ctx.fillStyle = '#7a6a56';
          ctx.fillRect(-sz, -sz, sz * 2, sz * 1.6);
        },
      });
    }
    fx.shake(0.22, 0.9);
    fx.speedLines({ color: '#ffe9a8', life: 0.35, n: 30 });
    if (o === 'hit') {
      fx.glow(p, { radius: 2.2, color: '#ffd978', life: 0.4 });
      fx.burst(p, { n: 16, color: '#ffe9a8', length: 1.8, life: 0.4 });
      crossPop(c, { x: p.x, y: p.y + 0.2 }, 1.3, 0.8, GOLD, RED);
      fx.word({ x: p.x, y: p.y + 1.5 }, 'HOLD!', {
        color: '#ffd978',
        size: 0.78,
        life: 1.0,
        rot: -0.06,
      });
      fx.punch(p, 1.2, 0.6);
      fx.wash('#e8a53a', 0.3, 0.5);
    } else if (o === 'miss' || o === 'dodge') {
      whiffWord(c, 'THOOM!', '#ffe9a8');
    }
  },
  finish: (c) => {
    const p = hitPoint(c);
    const fx = eng(c);
    fx.impactFrame(0.08);
    fx.later(0.2, () => crossPop(c, { x: p.x, y: p.y + 0.5 }, 2.3, 1.0, RED, GOLD));
  },
};

const shieldBash: AttackScript = {
  palette: { main: '#dfe8f2', accent: '#4f7fc0', dark: '#16243a' },
  choreograph: (base) => {
    const w = base.keys[0]!;
    // Drop the shoulder, plant a stomp, then barge in with a lurch.
    const m = hold(base, base.impact, 0.06);
    return withKeys(m, [
      { t: w.t * 0.45, p: { ...w.p, x: -0.2, y: -0.18, lean: 0.35, hR: 0.8, kR: -1.3 } },
      { t: w.t + 0.05, p: { ...w.p, y: -0.14, x: (w.p.x ?? 0) - 0.1 } },
    ]);
  },
  start: (c) =>
    eng(c).speedLines({ dir: dirAng(c) + Math.PI, color: '#dfe8f2', life: 0.45, n: 10 }),
  windup: (c) => {
    const fx = eng(c);
    if (c.t > 0.1 && c.t < c.impact - 0.05 && (Math.floor(c.t * 30) & 1) === 0)
      fx.dust({ x: c.attacker.anchors().feet.x - c.dir * 0.25, y: 0 }, { n: 1, size: 0.16 });
    if (c.t >= c.impact - 0.3 && fx.once('boss')) {
      const rig = c.attacker;
      fx.layer('front', 0.3, (ctx, k) => {
        const h = rig.anchors().offHand;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = k * 0.9;
        ctx.fillStyle = '#9ec0f0';
        ctx.beginPath();
        ctx.arc(h.x, h.y, 0.2 + k * 0.2, 0, TAU);
        ctx.fill();
        glint(ctx, h.x, h.y, 0.4 * k, '#ffffff');
      });
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const p = hitPoint(c);
    const f = c.attacker.anchors().feet;
    fx.ring(
      { x: f.x + c.dir * 0.4, y: 0.03 },
      { color: '#dfe8f2', radius: 1.6, life: 0.45, width: 0.1, flat: 0.22 },
    );
    if (o === 'hit') {
      // The shield boss lands: a big heraldic shield stamp, shockwave and dizzy stars.
      fx.layer('front', 0.45, (ctx, k) => {
        const s = 0.8 + Math.min(1, k * 5) * 0.4;
        ctx.globalAlpha = k < 0.5 ? 1 : (1 - k) / 0.5;
        ctx.translate(p.x - c.dir * 0.1, p.y);
        ctx.scale(s, s);
        ctx.fillStyle = '#c0252d';
        ctx.beginPath();
        ctx.moveTo(-0.45, 0.5);
        ctx.lineTo(0.45, 0.5);
        ctx.lineTo(0.45, 0);
        ctx.quadraticCurveTo(0.4, -0.5, 0, -0.7);
        ctx.quadraticCurveTo(-0.4, -0.5, -0.45, 0);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 0.05;
        ctx.strokeStyle = '#dfe8f2';
        ctx.stroke();
        ctx.fillStyle = CREAM;
        ctx.fillRect(-0.08, -0.5, 0.16, 0.9);
        ctx.fillRect(-0.34, -0.1, 0.68, 0.16);
        ctx.beginPath();
        ctx.arc(0, -0.02, 0.1, 0, TAU);
        ctx.fillStyle = '#9aa7b8';
        ctx.fill();
      });
      fx.ring(p, { color: '#ffffff', radius: 1.5, life: 0.35, width: 0.14 });
      fx.burst(p, { n: 10, color: '#9ec0f0', length: 1.2, life: 0.3 });
      fx.spark(p, { n: 12, color: '#dfe8f2', speed: 8, dir: dirAng(c), spread: 1.4 });
      fx.spark(
        { x: p.x, y: p.y + 1.0 },
        { n: 6, color: '#fff3a0', speed: 2.5, dir: Math.PI / 2, spread: 2.5, size: 0.06 },
      );
      fx.word({ x: p.x, y: p.y + 1.1 }, 'CLANK!', { color: '#9ec0f0', size: 0.6, life: 0.8 });
      fx.speedLines({ dir: dirAng(c) + Math.PI, color: '#ffffff', life: 0.25, n: 16 });
      fx.punch(p, 1.15, 0.4);
    } else {
      whiffWord(c, 'WHUMP', '#dfe8f2');
    }
  },
};

const bellRinger: AttackScript = {
  palette: { main: '#f4d982', accent: '#c58a2a', dark: '#4a3010' },
  choreograph: (base) => {
    const w = base.keys[0]!;
    // The mace whirls once around the head like a bell clapper before the blow.
    const m = hold(base, base.impact, 0.04);
    return withKeys(
      m,
      [
        { t: w.t * 0.5, p: { ...w.p, spin: Math.PI, y: 0.15, sR: 2.6 } },
        { t: w.t, p: { ...w.p, spin: Math.PI * 2 } },
        { t: base.impact + 0.04, p: { ...base.keys[1]!.p, spin: Math.PI * 2 } },
        { t: base.impact + 0.3, p: { ...base.keys[2]!.p, spin: Math.PI * 2 } },
        { t: base.impact + 0.7, p: { spin: Math.PI * 2 } },
      ].filter((k) => k.t > 0),
    );
  },
  start: (c) => {
    eng(c).wash('#4a3010', 0.16, 0.7);
    motes(c, 'tip', '#f4d982', 0.8, 8, c.impact);
  },
  windup: (c) => {
    const fx = eng(c);
    if (c.t >= c.impact - 0.2 && fx.once('smear')) {
      const a = c.attacker.anchors().chest;
      fx.arc(
        { x: a.x + c.dir * 0.3, y: a.y + 0.45 },
        {
          radius: 1.3,
          from: face(2.9, c.dir),
          to: face(-0.1, c.dir),
          width: 0.7,
          color: '#c58a2a',
          life: 0.3,
        },
      );
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const head = c.defender.anchors().head;
    const p = o === 'hit' ? { x: head.x, y: head.y } : hitPoint(c);
    if (o === 'hit' || o === 'block') {
      // A bronze bell swings over the struck helm, rings tolling out in widening waves.
      fx.layer('front', 0.9, (ctx, k) => {
        const sw = Math.sin(k * 26) * 0.35 * (1 - k);
        ctx.globalAlpha = k < 0.6 ? 1 : (1 - k) / 0.4;
        ctx.translate(p.x, p.y + 0.95);
        ctx.rotate(sw);
        ctx.fillStyle = '#c58a2a';
        ctx.beginPath();
        ctx.moveTo(-0.34, 0);
        ctx.quadraticCurveTo(-0.3, 0.45, -0.12, 0.6);
        ctx.lineTo(0.12, 0.6);
        ctx.quadraticCurveTo(0.3, 0.45, 0.34, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f4d982';
        ctx.fillRect(-0.3, -0.04, 0.6, 0.07);
        ctx.beginPath();
        ctx.arc(0, 0.62, 0.07, 0, TAU);
        ctx.fillStyle = '#4a3010';
        ctx.fill();
      });
      for (let i = 0; i < 4; i++)
        fx.later(i * 0.1, () => {
          fx.ring(p, {
            color: i % 2 ? '#c58a2a' : '#f4d982',
            radius: 1.2 + i * 0.7,
            life: 0.5,
            width: 0.1 - i * 0.015,
          });
          if (i < 3)
            fx.spark({ x: p.x, y: p.y + 0.1 }, { n: 5, color: '#f4d982', speed: 4, size: 0.03 });
        });
      fx.glow(p, { radius: 1.8, color: '#f4d982', life: 0.5 });
      fx.word({ x: p.x, y: p.y + 1.7 }, 'BONG!', {
        color: '#f4d982',
        size: 0.85,
        life: 1.1,
        rot: 0.05,
      });
      fx.shake(0.18, 0.93);
      fx.flash('#fff3c0', 0.3, 0.14);
      fx.wash('#c58a2a', 0.25, 0.6);
    } else {
      fx.ring({ x: p.x - c.dir * 0.2, y: 0.5 }, { color: '#f4d982', radius: 1.0, life: 0.4 });
      whiffWord(c, 'DING', '#f4d982');
    }
  },
  follow: (c) => {
    // Echoing tremors: a faint ring rolls out as the bell dies away.
    if (c.t > c.impact + 0.5 && eng(c).once('echo')) {
      const h = c.defender.anchors().head;
      eng(c).ring({ x: h.x, y: h.y }, { color: '#c58a2a', radius: 2.6, life: 0.6, width: 0.05 });
    }
  },
  finish: (c) => {
    const h = c.defender.anchors().head;
    for (let i = 0; i < 3; i++)
      eng(c).later(0.25 + i * 0.22, () =>
        eng(c).ring(
          { x: h.x, y: h.y },
          { color: '#f4d982', radius: 1.5 + i * 0.8, life: 0.6, width: 0.07 },
        ),
      );
  },
};

/** Pennants and heraldic streamers whipping behind a galloping lance. */
function pennant(c: FxContext, life: number, color: string): void {
  const rig = c.attacker;
  eng(c).layer('front', life, (ctx, k) => {
    const a = rig.anchors();
    const on = Math.min(1, k * 4) * (k > 0.92 ? (1 - k) * 12 : 1);
    ctx.globalAlpha = on;
    ctx.fillStyle = color;
    ctx.beginPath();
    const x = a.tip.x - c.dir * 0.35;
    const y = a.tip.y + 0.04;
    ctx.moveTo(x, y);
    for (let i = 1; i <= 6; i++)
      ctx.lineTo(x - c.dir * i * 0.17, y + 0.04 * i + Math.sin(k * 40 + i) * 0.05 * i);
    for (let i = 6; i >= 1; i--)
      ctx.lineTo(
        x - c.dir * i * 0.17,
        y - 0.04 * i + 0.14 - i * 0.012 + Math.sin(k * 40 + i + 1) * 0.05 * i,
      );
    ctx.closePath();
    ctx.fill();
  });
}

const aragonLance: AttackScript = {
  palette: { main: '#fff2c8', accent: '#e0b040', dark: '#243a6a' },
  choreograph: (base) => {
    // A jousting gallop: each stride bounds higher, ending in a leaping couch.
    const keys = base.keys.map((k, i) =>
      i >= 1 && i <= 4 ? { t: k.t, p: { ...k.p, y: (k.p.y ?? 0) + 0.06 * i } } : k,
    );
    return { ...base, keys };
  },
  start: (c) => {
    const fx = eng(c);
    fx.wash('#243a6a', 0.22, c.impact);
    fx.speedLines({
      dir: dirAng(c) + Math.PI,
      color: '#fff2c8',
      life: Math.max(0.5, c.impact),
      n: 26,
    });
    pennant(c, c.impact + 0.1, '#d02a32');
  },
  windup: (c) => {
    const fx = eng(c);
    const f = c.attacker.anchors().feet;
    if (c.t > 0.15 && c.t < c.impact && (Math.floor(c.t * 24) & 1) === 0) {
      fx.dust({ x: f.x - c.dir * 0.25, y: 0 }, { n: 2, size: 0.2 });
      fx.spark(
        { x: f.x - c.dir * 0.2, y: 0.05 },
        { n: 1, color: '#e0b040', speed: 2, dir: Math.PI / 2, spread: 1.2 },
      );
    }
    if (c.t > c.impact - 0.25 && fx.once('couch')) {
      const rig = c.attacker;
      fx.layer('front', 0.3, (ctx, k) => {
        const t = rig.anchors().tip;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = k;
        glint(ctx, t.x, t.y, 0.7 * k, '#fff2c8');
      });
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const p = hitPoint(c);
    if (o === 'hit' || o === 'block') {
      // The lance splinters: long ash splinters fly out, ribbons flutter down.
      fx.burst(p, { n: 12, color: '#fff2c8', length: 1.5, life: 0.35 });
      fx.glow(p, { radius: 1.6, color: '#e0b040', life: 0.35 });
      fx.ring(p, { color: '#e0b040', radius: 1.6, life: 0.45, width: 0.12 });
      for (let i = 0; i < 6; i++) {
        const a = (fx.rand() - 0.3) * 2.2;
        const len = 0.25 + fx.rand() * 0.3;
        const rot = fx.rand() * 6;
        const col = i % 3 === 0 ? '#d02a32' : '#d9b887';
        fx.sprite({
          from: p,
          to: {
            x: p.x - c.dir * Math.cos(a) * 1.4 + c.dir * 0.4,
            y: 0.06 + Math.max(0, Math.sin(a)) * 0.2,
          },
          life: 0.55 + fx.rand() * 0.25,
          arc: 0.9 + fx.rand(),
          paint: (ctx, q, _a, k) => {
            ctx.translate(q.x, q.y);
            ctx.rotate(rot + k * 9);
            ctx.globalAlpha = 1 - k * k;
            ctx.fillStyle = col;
            ctx.fillRect(-len, -0.02, len * 2, 0.045);
          },
        });
      }
      fx.word({ x: p.x, y: p.y + 1.0 }, 'CRACK!', { color: '#e0b040', size: 0.65, life: 0.9 });
      fx.speedLines({ color: '#ffffff', life: 0.3, n: 28 });
      fx.punch(p, 1.15, 0.5);
    } else {
      fx.spark(
        { x: p.x + c.dir * 0.6, y: p.y },
        { n: 8, color: '#fff2c8', speed: 6, dir: dirAng(c), spread: 0.5 },
      );
      whiffWord(c, 'WHOOSH!', '#fff2c8');
    }
    const d = c.defender.anchors().feet;
    fx.dust({ x: d.x - c.dir * 0.3, y: 0 }, { n: 12, size: 0.24 });
  },
  follow: (c) => {
    const fx = eng(c);
    if (c.t < c.impact + 0.35 && (Math.floor(c.t * 30) & 3) === 0) {
      const f = c.attacker.anchors().feet;
      fx.dust({ x: f.x, y: 0 }, { n: 1, size: 0.22 });
    }
  },
};

const hedgeOfPikes: AttackScript = {
  palette: { main: '#e4ecf4', accent: '#8fa6c0', dark: '#1f2c3c' },
  choreograph: (base) => {
    const w = base.keys[0]!;
    // Plant the feet, level the pike, hold steady, then drive.
    const m = hold(base, base.impact, 0.2);
    return withKeys(m, [
      { t: w.t + 0.06, p: { ...w.p, y: -0.1, hR: 0.9, kR: -0.9 } },
      { t: w.t + 0.2, p: { ...w.p, y: -0.12, hR: 0.95, kR: -0.95, x: (w.p.x ?? 0) + 0.05 } },
    ]);
  },
  start: (c) => {
    const fx = eng(c);
    fx.wash('#1f2c3c', 0.2, c.impact + 0.3);
    const rig = c.attacker;
    // Ranks of phantom pike points stand behind and beside the thrust, converging on the foe.
    fx.layer('back', c.impact + 0.35, (ctx, k) => {
      const a = rig.anchors();
      const on = Math.min(1, k * 3) * (k > 0.88 ? (1 - k) / 0.12 : 1);
      ctx.globalAlpha = 0.55 * on;
      ctx.strokeStyle = '#8fa6c0';
      ctx.lineWidth = 0.04;
      ctx.lineCap = 'round';
      for (let i = -3; i <= 3; i++) {
        if (i === 0) continue;
        const y = a.tip.y + i * 0.17;
        const x0 = a.hand.x - c.dir * (0.9 + Math.abs(i) * 0.15);
        const adv = Math.min(1, Math.max(0, (k - 0.35) * 2.2)) * 0.4 + 0.1 * Math.sin(k * 8 + i);
        const x1 = a.tip.x - c.dir * (0.3 + Math.abs(i) * 0.12) + c.dir * adv;
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x1, y);
        ctx.stroke();
        ctx.fillStyle = '#e4ecf4';
        ctx.beginPath();
        ctx.moveTo(x1, y - 0.05);
        ctx.lineTo(x1 + c.dir * 0.2, y);
        ctx.lineTo(x1, y + 0.05);
        ctx.fill();
      }
    });
  },
  windup: (c) => {
    const fx = eng(c);
    if (c.t >= c.impact - 0.18 && fx.once('stomp')) {
      const f = c.attacker.anchors().feet;
      fx.ring(
        { x: f.x, y: 0.03 },
        { color: '#e4ecf4', radius: 1.2, life: 0.3, width: 0.07, flat: 0.22 },
      );
      fx.dust({ x: f.x, y: 0 }, { n: 5 });
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const p = hitPoint(c);
    if (o === 'hit' || o === 'block') {
      // A whole square's worth of points arrives in quick succession.
      for (let i = 0; i < 5; i++) {
        const y = p.y + (i - 2) * 0.28;
        fx.later(i * 0.035, () => {
          fx.sprite({
            from: { x: p.x - c.dir * 2.2, y },
            to: { x: p.x - c.dir * 0.05, y },
            life: 0.1,
            trail: '#e4ecf4',
            paint: (ctx, q) => {
              ctx.translate(q.x, q.y);
              ctx.fillStyle = '#e4ecf4';
              ctx.beginPath();
              ctx.moveTo(0, -0.05);
              ctx.lineTo(c.dir * 0.3, 0);
              ctx.lineTo(0, 0.05);
              ctx.fill();
            },
            onEnd: () =>
              fx.spark(
                { x: p.x, y },
                { n: 3, color: '#e4ecf4', speed: 5, dir: face(0.2, c.dir), spread: 1.5 },
              ),
          });
        });
      }
      fx.ring(p, { color: '#8fa6c0', radius: 1.4, life: 0.4, width: 0.1 });
      fx.burst(p, { n: 8, color: '#e4ecf4', length: 0.9, life: 0.26 });
      fx.word({ x: p.x, y: p.y + 1.0 }, 'HOLD!', { color: '#e4ecf4', size: 0.55, life: 0.8 });
      fx.speedLines({ dir: dirAng(c) + Math.PI, color: '#e4ecf4', life: 0.2, n: 14 });
    } else {
      fx.spark(
        { x: p.x + c.dir * 0.4, y: p.y },
        { n: 6, color: '#e4ecf4', speed: 5, dir: dirAng(c), spread: 0.4 },
      );
      whiffWord(c, 'WHIFF', '#e4ecf4');
    }
  },
  finish: (c) => {
    const p = hitPoint(c);
    crossPop(c, { x: p.x, y: p.y + 0.3 }, 1.2, 0.8, '#8fa6c0', CREAM);
  },
};

const knightsCharge: AttackScript = {
  palette: { main: '#ffe3a0', accent: '#d02a32', dark: '#3a0c10' },
  choreograph: (base) => {
    // A long crouch, then the boilers roar: every stride leaps, the last is a full bound.
    const first = base.keys[0]!;
    const m = retime(base, (t) => t * 1.12);
    const keys = m.keys.map((k, i) =>
      i >= 1 && i <= 4 ? { t: k.t, p: { ...k.p, y: (k.p.y ?? 0) + 0.1 * i } } : k,
    );
    return withKeys({ ...m, keys }, [{ t: 0.06, p: { ...first.p, x: -0.7, y: -0.25, lean: 0.4 } }]);
  },
  start: (c) => {
    const fx = eng(c);
    fx.wash('#3a0c10', 0.3, c.impact);
    fx.speedLines({
      dir: dirAng(c) + Math.PI,
      color: '#ffe3a0',
      life: Math.max(0.6, c.impact),
      n: 40,
    });
    pennant(c, c.impact + 0.1, GOLD);
  },
  windup: (c) => {
    const fx = eng(c);
    const a = c.attacker.anchors();
    // Boiler exhaust: steam and embers streaming off the back, a red flare under the feet.
    if (c.t > 0.2 && c.t < c.impact && (Math.floor(c.t * 36) & 1) === 0) {
      fx.smoke(
        { x: a.chest.x - c.dir * 0.4, y: a.chest.y + 0.35 },
        { n: 1, size: 0.16, rise: 0.5, color: '#e8e8ec' },
      );
      fx.ember({ x: a.chest.x - c.dir * 0.45, y: a.chest.y + 0.2 }, { n: 1 });
      fx.dust({ x: a.feet.x - c.dir * 0.2, y: 0 }, { n: 1, size: 0.22 });
    }
    if (c.t >= c.impact - 0.25 && fx.once('roar')) {
      fx.word({ x: a.chest.x - c.dir * 0.6, y: a.head.y + 0.6 }, 'ROAR!', {
        color: GOLD,
        size: 0.5,
        life: 0.5,
      });
      fx.shake(0.08, 0.9);
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const p = hitPoint(c);
    const d = c.defender.anchors().feet;
    fx.ring(
      { x: d.x - c.dir * 0.3, y: 0.03 },
      { color: '#ffe3a0', radius: 3.0, life: 0.65, width: 0.15, flat: 0.22 },
    );
    fx.dust({ x: d.x - c.dir * 0.3, y: 0 }, { n: 22, size: 0.3 });
    if (o === 'hit' || o === 'block') {
      fx.glow(p, { radius: 2.4, color: '#ffb347', life: 0.45 });
      fx.burst(p, { n: 16, color: '#ffe3a0', length: 1.9, life: 0.4 });
      crossPop(c, { x: p.x, y: p.y + 0.2 }, 1.5, 0.8, RED, GOLD);
      fx.ring(p, { color: RED, radius: 2.2, life: 0.5, width: 0.16 });
      fx.spark(p, { n: 30, color: '#ffb347', speed: 10, dir: face(0.5, c.dir), spread: 2.6 });
      fx.ember(p, { n: 10 });
      fx.smoke(p, { n: 4, size: 0.3, rise: 0.8, color: '#e8e8ec' });
      fx.word({ x: p.x, y: p.y + 1.4 }, 'CHARGE!', {
        color: GOLD,
        size: 0.8,
        life: 1.0,
        rot: -0.08,
      });
      fx.speedLines({ color: '#ffffff', life: 0.35, n: 40 });
      fx.slowmo(0.5, 0.2);
      fx.punch(p, 1.25, 0.6);
      fx.shake(0.2, 0.9);
    } else {
      whiffWord(c, 'WHOOSH!', '#ffe3a0');
    }
  },
  follow: (c) => {
    const fx = eng(c);
    if (c.t < c.impact + 0.45 && (Math.floor(c.t * 30) & 3) === 0) {
      const a = c.attacker.anchors();
      fx.smoke(
        { x: a.chest.x - c.dir * 0.4, y: a.chest.y + 0.3 },
        { n: 1, size: 0.2, rise: 0.4, color: '#e8e8ec' },
      );
    }
  },
  finish: (c) => {
    const p = hitPoint(c);
    const fx = eng(c);
    fx.impactFrame(0.08);
    fx.later(0.2, () => crossPop(c, { x: p.x, y: p.y + 0.6 }, 2.4, 1.0, RED, GOLD));
  },
};

const ORDER_BASE: AttackScripts = {
  'order-cross-cut': crossCut,
  'order-pilgrim-thrust': pilgrimThrust,
  'order-shieldbreaker': shieldbreaker,
  'order-eight-point': eightPoint,
  'order-last-rampart': lastRampart,
  'order-shield-bash': shieldBash,
  'order-bell-ringer': bellRinger,
  'order-aragon-lance': aragonLance,
  'order-hedge-of-pikes': hedgeOfPikes,
  'order-knights-charge': knightsCharge,
};

/** The newer techniques borrow a related script, in their own accent colour. */
export const ORDER_SCRIPTS: AttackScripts = withVariants(ORDER_BASE, {
  'order-stoccata-lunga': ['order-pilgrim-thrust', '#cfe3ff'],
  'order-rim-strike': ['order-shield-bash', '#e8d9a8'],
  'order-helm-splitter': ['order-bell-ringer', '#d97a3a'],
  'order-knell-of-saint-john': ['order-bell-ringer', '#f3d27a'],
  'order-halberd-hook': ['order-hedge-of-pikes', '#9ad0ff'],
  'order-charge-of-the-langues': ['order-knights-charge', '#ffe08a'],
});
