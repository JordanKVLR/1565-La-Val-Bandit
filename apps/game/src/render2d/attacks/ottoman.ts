/**
 * Ottoman attack scripts: janissary scimitars (crescent moons, twin blades), orta musket
 * volleys, sipahi cavalry (spectral steeds, hoofbeat rings, pennants) and grenadiers (fire-pots,
 * iron-and-smoke bombs, burning pitch). Palette: crimson, gold and deep blue; every motif
 * (crescents, eight-point stars, tughra-style flourishes, horses, flames) is an original vector
 * shape drawn here. Hooks are stateless; one-shots use `fx.once`, delays use `fx.later`.
 */
import type { Move } from '../../render/duelMoves';
import type { AttackScript, AttackScripts, FxContext, Pose, V2 } from '../contract';
import { rgba } from '../fx';
import { eng, face, hitPoint, outcomeOf } from './styleDefaults';

const TAU = Math.PI * 2;
const GOLD = '#ffd35a';
const CRIMSON = '#e0283a';

// ───────────────────────────── move editing ─────────────────────────────

type Key = Move['keys'][number];

function insertKey(keys: readonly Key[], k: Key): Key[] {
  const out = keys.slice();
  let i = 0;
  while (i < out.length && out[i]!.t < k.t) i++;
  out.splice(i, 0, k);
  return out;
}

/** Pose at the moment of contact (the key sitting on `impact`). */
function strikePose(base: Move): Partial<Pose> {
  let best: Key | undefined;
  for (const k of base.keys) if (k.t <= base.impact + 1e-6) best = k;
  return best?.p ?? {};
}

/** Pushes everything from time `from` on later by `dt` (holds the pose reached at `from`). */
function delayFrom(base: Move, from: number, dt: number): Move {
  const s = (t: number) => (t >= from ? t + dt : t);
  return {
    ...base,
    keys: base.keys.map((k) => (k.t >= from ? { t: k.t + dt, p: k.p } : k)),
    impact: s(base.impact),
    release: s(base.release),
    trail: base.trail ? [s(base.trail[0]), s(base.trail[1])] : null,
    dust: base.dust.map(s),
  };
}

// ───────────────────────────── vector motifs ─────────────────────────────

const BITE = 0.78;
const OFF = 0.46;
const X0 = (OFF * OFF + 1 - BITE * BITE) / (2 * OFF);
const TH = Math.acos(X0);
const PSI = Math.atan2(-Math.sin(TH), X0 - OFF);

function fillCrescent(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number, color: string, alpha: number): void {
  if (alpha <= 0.01) return;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.fillStyle = color;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.arc(0, 0, r, TH, TAU - TH, false);
  ctx.arc(OFF * r, 0, BITE * r, PSI, -PSI, true);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Eight-pointed star (two squares) centred on x,y. */
function fillStar8(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number, color: string, alpha: number): void {
  if (alpha <= 0.01) return;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = rot + (i * TAU) / 16;
    const rr = i & 1 ? r * 0.5 : r;
    if (i === 0) ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    else ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

/** Four-point glint. */
function fillGlint(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number): void {
  if (alpha <= 0.01) return;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.quadraticCurveTo(x, y, x, y + r * 1.6);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y - r * 1.6);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.fill();
}

/**
 * A tughra-style flourish: three tall staves rising from a pair of linked loops, with a long
 * calligraphic tail. Original shapes only. `u` 0..1 draws it stroke by stroke.
 */
function strokeTughra(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, u: number, color: string, alpha: number): void {
  if (alpha <= 0.01 || u <= 0) return;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = 0.05 * s;
  // linked loops
  const loops = Math.min(1, u * 2);
  ctx.beginPath();
  ctx.ellipse(x - 0.3 * s, y, 0.55 * s, 0.2 * s, -0.12, 0, TAU * loops);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x + 0.3 * s, y + 0.02 * s, 0.5 * s, 0.17 * s, 0.1, 0, TAU * loops);
  ctx.stroke();
  // three staves
  const st = Math.max(0, (u - 0.35) / 0.65);
  for (let i = 0; i < 3; i++) {
    const sx = x + (i - 1) * 0.28 * s;
    const h = (1.0 + (i === 1 ? 0.35 : 0)) * s * Math.min(1, st * 1.4);
    ctx.beginPath();
    ctx.moveTo(sx, y + 0.1 * s);
    ctx.quadraticCurveTo(sx - 0.07 * s, y + h * 0.55, sx + 0.02 * s, y + h);
    ctx.stroke();
  }
  // tail sweeping to the right and a small crescent hook
  if (u > 0.6) {
    const tl = (u - 0.6) / 0.4;
    ctx.beginPath();
    ctx.moveTo(x - 0.8 * s, y - 0.05 * s);
    ctx.quadraticCurveTo(x, y - 0.35 * s, x + (0.9 * tl - 0.1) * s, y - 0.12 * s);
    ctx.stroke();
  }
}

/** A licking tongue of flame with its base at bx,by. */
function flameTongue(ctx: CanvasRenderingContext2D, bx: number, by: number, w: number, h: number, sway: number): void {
  ctx.beginPath();
  ctx.moveTo(bx - w, by);
  ctx.quadraticCurveTo(bx - w * 0.7, by + h * 0.55, bx + sway, by + h);
  ctx.quadraticCurveTo(bx + w * 0.7, by + h * 0.5, bx + w, by);
  ctx.closePath();
  ctx.fill();
}

/** A spectral steed in side view, galloping toward +x (flip with `fd`). */
function ghostHorse(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, phase: number, fd: number, color: string, alpha: number): void {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(fd * s, s);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  const bob = Math.sin(phase * 2) * 0.05;
  ctx.translate(0, bob);
  // body
  ctx.beginPath();
  ctx.ellipse(0, 0.78, 0.72, 0.3, 0, 0, TAU);
  ctx.fill();
  // neck and head
  ctx.beginPath();
  ctx.moveTo(0.46, 0.9);
  ctx.quadraticCurveTo(0.75, 1.0, 0.92, 1.35);
  ctx.lineTo(1.12, 1.28);
  ctx.quadraticCurveTo(1.25, 1.2, 1.3, 1.1);
  ctx.lineTo(1.05, 1.0);
  ctx.quadraticCurveTo(0.85, 0.7, 0.62, 0.62);
  ctx.closePath();
  ctx.fill();
  // ear
  ctx.beginPath();
  ctx.moveTo(0.96, 1.33);
  ctx.lineTo(0.98, 1.5);
  ctx.lineTo(1.06, 1.32);
  ctx.fill();
  // legs, four, scissoring
  ctx.lineWidth = 0.1;
  for (let i = 0; i < 4; i++) {
    const front = i < 2;
    const bx = front ? 0.45 : -0.5;
    const a = Math.sin(phase + i * 1.7) * 0.7;
    const lift = Math.max(0, Math.cos(phase + i * 1.7)) * 0.18;
    ctx.beginPath();
    ctx.moveTo(bx, 0.62);
    ctx.lineTo(bx + 0.3 * Math.sin(a) - 0.1, 0.32 + lift);
    ctx.lineTo(bx + 0.5 * Math.sin(a) - 0.18, 0.04 + lift);
    ctx.stroke();
  }
  // streaming tail
  ctx.lineWidth = 0.09;
  ctx.beginPath();
  ctx.moveTo(-0.68, 0.9);
  ctx.quadraticCurveTo(-1.05, 0.95 + Math.sin(phase * 2) * 0.08, -1.3, 0.78);
  ctx.stroke();
  ctx.restore();
}

// ───────────────────────────── shared effect helpers ─────────────────────────────

/** A crescent moon that sweeps through angles `a0..a1` at `at`, growing and fading. */
function moonSweep(c: FxContext, at: V2, r: number, a0: number, a1: number, life: number, main: string, accent: string, grow = 0.5): void {
  const f0 = face(a0, c.dir);
  const f1 = face(a1, c.dir);
  eng(c).layer('front', life, (ctx, k) => {
    const e = 1 - (1 - k) * (1 - k);
    const rot = f0 + (f1 - f0) * e;
    const rr = r * (0.7 + grow * e);
    const a = 1 - k * k;
    ctx.globalCompositeOperation = 'lighter';
    fillCrescent(ctx, at.x, at.y, rr * 1.12, rot, accent, a * 0.6);
    fillCrescent(ctx, at.x, at.y, rr, rot, main, a);
  });
}

/** Eight-pointed star that spins out and fades. */
function starPop(c: FxContext, at: V2, r: number, life: number, color: string, spin = 1): void {
  eng(c).layer('front', life, (ctx, k) => {
    const e = 1 - (1 - k) * (1 - k) * (1 - k);
    ctx.globalCompositeOperation = 'lighter';
    fillStar8(ctx, at.x, at.y, r * (0.3 + 0.9 * e), spin * k * 1.6, color, (1 - k) * 0.9);
  });
}

function sparkle(c: FxContext, at: V2, r: number, life: number, color: string): void {
  eng(c).layer('front', life, (ctx, k) => {
    ctx.globalCompositeOperation = 'lighter';
    fillGlint(ctx, at.x, at.y, r * (1 - Math.abs(k - 0.4) * 1.3), color, 1 - k);
  });
}

/** What a blocked blow looks like: the motif cracks against the guard. */
function guardCrack(c: FxContext, main: string, accent: string): void {
  const fx = eng(c);
  const t = c.defender.anchors().tip;
  fx.layer('front', 0.35, (ctx, k) => {
    ctx.globalCompositeOperation = 'lighter';
    fillCrescent(ctx, t.x - c.dir * 0.1 * k, t.y, 0.5 + 0.3 * k, face(Math.PI * 0.5 + 3 * k, c.dir), main, 1 - k);
    fillCrescent(ctx, t.x + c.dir * 0.1 * k, t.y, 0.5 + 0.3 * k, face(-Math.PI * 0.5 - 3 * k, c.dir), accent, 1 - k);
  });
  fx.spark(t, { n: 10, color: accent, speed: 6, dir: Math.PI / 2, spread: 3 });
  fx.word({ x: t.x, y: t.y + 0.75 }, 'HOLD!', { color: main, size: 0.42, life: 0.6 });
}

function whiffWord(c: FxContext, text: string, color: string): void {
  const a = c.defender.anchors().chest;
  eng(c).word({ x: a.x - c.dir * 0.2, y: a.y + 0.7 }, text, { color, size: 0.4, life: 0.6 });
  eng(c).dust({ x: a.x, y: 0 }, { n: 4 });
}

function dirAngle(c: FxContext): number {
  return c.dir === 1 ? Math.PI : 0;
}

/** Hoofbeat ring on the ground under the attacker's feet. */
function hoofRing(c: FxContext, color: string, radius: number, n = 1): void {
  const fx = eng(c);
  const f = c.attacker.anchors().feet;
  fx.ring({ x: f.x, y: 0.03 }, { color, radius, life: 0.4, width: 0.08, flat: 0.2 });
  fx.dust({ x: f.x - c.dir * 0.3, y: 0 }, { n, size: 0.22 });
}

/** Spectral horse(s) racing along under/behind the attacker until contact. */
function spiritSteeds(c: FxContext, count: number, main: string, accent: string, scale: number): void {
  const life = Math.max(0.3, c.impact);
  eng(c).layer('back', life + 0.15, (ctx, k) => {
    const f = c.attacker.anchors().feet;
    const tt = k * (life + 0.15);
    const fade = Math.min(1, tt * 6) * (tt > life ? Math.max(0, 1 - (tt - life) / 0.15) : 1);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = count - 1; i >= 0; i--) {
      const lag = i * 0.55 * scale;
      ghostHorse(ctx, f.x - c.dir * (0.1 + lag), 0.0 + i * 0.015, scale * (1 - i * 0.08), tt * 22 + i * 1.3, c.dir, i === 0 ? main : accent, fade * (0.6 - i * 0.12));
    }
  });
}

/** Banner/pennant: a swallow-tailed crimson flag on a staff, flapping. */
function pennant(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, rot: number, phase: number, color: string, alpha: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0.08);
  const w1 = Math.sin(phase) * 0.08;
  const w2 = Math.sin(phase + 1.4) * 0.1;
  ctx.quadraticCurveTo(len * 0.5, 0.1 + w1, len, 0.14 + w2);
  ctx.lineTo(len * 0.82, -0.02 + w2 * 0.4);
  ctx.lineTo(len, -0.18 + w2);
  ctx.quadraticCurveTo(len * 0.5, -0.1 + w1, 0, -0.08);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Flames licking over the defender's body for `life` seconds. */
function burningBody(c: FxContext, life: number, outer: string, inner: string, tongues: number): void {
  const e = eng(c);
  e.layer('front', life, (ctx, k) => {
    const a = c.defender.anchors();
    const t = k * life;
    ctx.globalCompositeOperation = 'lighter';
    const fade = k < 0.7 ? 1 : (1 - k) / 0.3;
    for (let i = 0; i < tongues; i++) {
      const u = i / tongues;
      const bx = a.chest.x + (((i * 7) % 5) - 2) * 0.12;
      const by = a.feet.y + 0.15 + u * 1.35;
      const wob = Math.sin(t * 14 + i * 2.1);
      const h = (0.38 + 0.18 * wob) * (0.8 + 0.5 * Math.min(1, t * 4));
      ctx.globalAlpha = 0.75 * fade;
      ctx.fillStyle = outer;
      flameTongue(ctx, bx, by, 0.14, h, wob * 0.07);
      ctx.globalAlpha = 0.85 * fade;
      ctx.fillStyle = inner;
      flameTongue(ctx, bx, by, 0.07, h * 0.6, wob * 0.04);
    }
  });
}

/** Thrown object arcing to the target; `paint` draws it in a local frame. */
function lobber(
  c: FxContext,
  paint: (ctx: CanvasRenderingContext2D, p: V2, ang: number, k: number) => void,
  step: (p: V2, k: number) => void,
  arc = 1.5,
): void {
  const fx = eng(c);
  const a = c.attacker.anchors();
  const d = c.defender.anchors();
  const to: V2 = c.hit ? { x: d.chest.x - c.dir * 0.1, y: d.chest.y - 0.15 } : { x: d.feet.x + c.dir * 0.35, y: 0.18 };
  fx.sprite({
    from: { x: a.hand.x, y: a.hand.y + 0.1 },
    to,
    life: 0.45,
    arc,
    paint,
    onStep: step,
  });
}

// ───────────────────────────── the scripts ─────────────────────────────

const crescentSlash: AttackScript = {
  palette: { main: GOLD, accent: CRIMSON, dark: '#3a0812' },
  choreograph: (base) => {
    const first = base.keys[0]?.t ?? 0.3;
    const sp = strikePose(base);
    let keys = insertKey(base.keys, { t: first * 0.5, p: { x: -0.28, lean: 0.3, sR: 2.5, eR: 0.7, wR: 0.2, hR: 0.5, kR: -0.8 } });
    // the draw-cut follows the curve of the blade: a flick after contact
    keys = insertKey(keys, { t: base.impact + 0.12, p: { ...sp, sR: (sp.sR ?? 1.5) - 0.6, lean: (sp.lean ?? -0.3) * 0.6, spin: 0.35 } });
    return { ...base, keys };
  },
  start: (c) => eng(c).wash('#3a0812', 0.14, 0.7),
  windup: (c) => {
    const fx = eng(c);
    const a = c.attacker.anchors();
    if ((Math.floor(c.t * 60) & 3) === 0) {
      fx.glow(a.tip, { radius: 0.32, color: GOLD, life: 0.12 });
      fx.spark(a.tip, { n: 1, color: GOLD, speed: 1.4, dir: Math.PI / 2, spread: 3, size: 0.03 });
    }
    if (c.t >= c.impact - 0.2 && fx.once('arcs')) {
      const ch = a;
      const at = { x: ch.chest.x + c.dir * 0.15, y: ch.chest.y + 0.3 };
      fx.arc(at, { radius: 1.3, from: face(2.4, c.dir), to: face(-0.8, c.dir), width: 0.5, color: CRIMSON, life: 0.32 });
      fx.arc(at, { radius: 1.1, from: face(2.3, c.dir), to: face(-0.7, c.dir), width: 0.22, color: GOLD, life: 0.28 });
      moonSweep(c, at, 0.8, 2.4, -0.6, 0.34, '#fff1c0', GOLD, 0.8);
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const p = hitPoint(c);
    if (o === 'hit') {
      fx.glow(p, { radius: 1.5, color: GOLD, life: 0.3 });
      // the great crescent carved through the foe, with a star beside it
      moonSweep(c, p, 1.25, 1.4, -1.6, 0.55, '#fff4c8', CRIMSON, 0.9);
      starPop(c, { x: p.x + c.dir * 0.2, y: p.y + 0.85 }, 0.55, 0.6, GOLD, 2);
      fx.burst(p, { n: 12, color: GOLD, length: 1.0, life: 0.34 });
      fx.spark(p, { n: 16, color: CRIMSON, speed: 7, dir: face(0.4, c.dir), spread: 2.2, size: 0.04 });
      fx.spark(p, { n: 8, color: '#fff4c8', speed: 9, dir: face(0.1, c.dir), spread: 0.6, size: 0.03 });
      fx.ring(p, { color: GOLD, radius: 1.0, life: 0.4, width: 0.1 });
      fx.word({ x: p.x - c.dir * 0.1, y: p.y + 0.85 }, 'HILAL!', { color: GOLD, size: 0.55, life: 0.85 });
      fx.speedLines({ dir: face(0.3, c.dir), color: GOLD, life: 0.25, n: 14 });
    } else if (o === 'block') {
      guardCrack(c, GOLD, CRIMSON);
    } else {
      moonSweep(c, { x: p.x + c.dir * 0.7, y: p.y + 0.1 }, 0.9, 1.0, -1.4, 0.5, rgba(GOLD, 0.8), CRIMSON, 0.4);
      whiffWord(c, 'SWISH!', GOLD);
    }
  },
  finish: (c) => {
    const p = hitPoint(c);
    const fx = eng(c);
    fx.layer('front', 1.1, (ctx, k) => {
      ctx.globalCompositeOperation = 'lighter';
      const e = 1 - (1 - k) * (1 - k);
      fillCrescent(ctx, p.x, p.y + 0.4 + e * 0.6, 1.9 + e * 0.5, Math.PI / 2 + e * 0.5, CRIMSON, (1 - k) * 0.55);
      fillStar8(ctx, p.x + c.dir * 0.5, p.y + 1.05 + e * 0.5, 0.5, k * 2, GOLD, (1 - k) * 0.9);
    });
  },
};

const janissaryOath: AttackScript = {
  palette: { main: '#9ec6ff', accent: GOLD, dark: '#0c1a48' },
  choreograph: (base) => {
    // rise on the toes with the blade held high, a short vow, then the drop
    const hi = base.keys[0]!;
    const up: Key = { t: hi.t * 0.4, p: { y: 0.1, sR: 2.6, eR: 0.6, sL: 0.9, lean: 0.12 } };
    let keys = insertKey(base.keys, up);
    keys = insertKey(keys, { t: base.impact - 0.07, p: { ...hi.p, y: 0.34 } });
    return { ...base, keys };
  },
  start: (c) => eng(c).wash('#0c1a48', 0.22, Math.max(0.6, c.impact)),
  windup: (c) => {
    const fx = eng(c);
    const a = c.attacker.anchors();
    const f = a.feet;
    const u = Math.min(1, c.t / Math.max(0.2, c.impact - 0.12));
    if (fx.once('oath')) {
      const impact = c.impact;
      fx.layer('back', impact, (ctx, k) => {
        const ff = c.attacker.anchors();
        ctx.globalCompositeOperation = 'lighter';
        // a standing ring of light with a rotating eight-point star beneath the swordsman
        ctx.globalAlpha = 0.4 * k;
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 0.05;
        ctx.beginPath();
        ctx.ellipse(ff.feet.x, 0.04, 0.9 + 0.35 * k, 0.16 + 0.05 * k, 0, 0, TAU);
        ctx.stroke();
        // pillar of blue light above the raised blade
        const g = 0.5 * k;
        ctx.globalAlpha = g * 0.5;
        ctx.fillStyle = '#6fa0ff';
        ctx.fillRect(ff.hand.x - 0.2, ff.hand.y, 0.4, 3.5);
        ctx.globalAlpha = g;
        ctx.fillStyle = '#e8f2ff';
        ctx.fillRect(ff.hand.x - 0.05, ff.hand.y, 0.1, 3.5);
        fillStar8(ctx, ff.hand.x, ff.hand.y + 0.9 + 0.2 * k, 0.28 + 0.4 * k, k * 3, GOLD, 0.9 * k);
        fillCrescent(ctx, ff.hand.x, ff.hand.y + 0.9 + 0.2 * k, 0.75 * (0.6 + 0.5 * k), -Math.PI / 2 + k, '#cfe0ff', 0.7 * k);
      });
    }
    if ((Math.floor(c.t * 60) % 4) === 0) {
      fx.spark({ x: f.x + (fx.rand() - 0.5) * 0.9, y: 0.05 }, { n: 1, color: GOLD, speed: 2.5 + 2 * u, dir: Math.PI / 2, spread: 0.4, size: 0.035 });
    }
    if (c.t >= c.impact - 0.2 && fx.once('smear')) {
      eng(c).arc({ x: a.chest.x + c.dir * 0.15, y: a.chest.y + 0.5 }, { radius: 1.35, from: face(2.9, c.dir), to: face(-0.2, c.dir), width: 0.7, color: '#bcd6ff', life: 0.32 });
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const d = c.defender.anchors();
    const gx = d.feet.x;
    if (o === 'hit' || o === 'block') {
      // a vertical cleave of light falls from the sky onto the target
      fx.layer('front', 0.5, (ctx, k) => {
        ctx.globalCompositeOperation = 'lighter';
        const w = 0.55 * (1 - k) + 0.05;
        ctx.globalAlpha = (1 - k) * 0.55;
        ctx.fillStyle = '#6fa0ff';
        ctx.fillRect(gx - w, 0, 2 * w, 5);
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(gx - w * 0.2, 0, w * 0.4, 5);
      });
    }
    // the oath sigil burns into the ground: eight-point star and crescents
    fx.layer('back', 0.9, (ctx, k) => {
      ctx.globalCompositeOperation = 'lighter';
      const e = 1 - (1 - k) * (1 - k);
      ctx.save();
      ctx.translate(gx, 0.06);
      ctx.scale(1, 0.22);
      fillStar8(ctx, 0, 0, 1.9 * e + 0.2, k * 1.2, GOLD, (1 - k) * 0.9);
      fillCrescent(ctx, 0, 0, 1.5 * e + 0.2, Math.PI / 2, '#9ec6ff', (1 - k) * 0.7);
      ctx.restore();
    });
    fx.ring({ x: gx, y: 0.03 }, { color: GOLD, radius: 2.8, life: 0.6, width: 0.14, flat: 0.22 });
    fx.dust({ x: gx, y: 0 }, { n: 14, size: 0.22 });
    if (o === 'hit') {
      const p = hitPoint(c);
      fx.glow(p, { radius: 1.9, color: '#9ec6ff', life: 0.34 });
      fx.burst(p, { n: 16, color: GOLD, length: 1.5, life: 0.4 });
      fx.spark(p, { n: 26, color: GOLD, speed: 8, dir: Math.PI / 2, spread: 3 });
      starPop(c, { x: p.x, y: p.y + 0.2 }, 1.2, 0.6, '#ffffff', 1);
      fx.word({ x: p.x, y: p.y + 1.0 }, 'YEMIN!', { color: GOLD, size: 0.7, life: 1.0 });
      fx.punch(p, 1.15, 0.5);
      fx.flash('#cfe0ff', 0.35, 0.15);
    } else if (o === 'block') {
      guardCrack(c, '#9ec6ff', GOLD);
    } else {
      whiffWord(c, 'THUD!', GOLD);
      fx.shake(0.12, 0.88);
    }
  },
  finish: (c) => {
    const p = hitPoint(c);
    eng(c).layer('front', 1.4, (ctx, k) => {
      ctx.globalCompositeOperation = 'lighter';
      strokeTughra(ctx, p.x, p.y + 0.8, 1.5, Math.min(1, k * 2.2), GOLD, k < 0.7 ? 0.9 : (1 - k) / 0.3 * 0.9);
    });
  },
};

const twinMoons: AttackScript = {
  palette: { main: '#dff0ff', accent: '#7fb4ff', dark: '#10224f' },
  choreograph: (base) => {
    const sp = strikePose(base);
    const i = base.impact;
    const t1 = Math.max(0.12, i - 0.22);
    const pre = base.keys.filter((k) => k.t < t1 - 0.04);
    const keys: Key[] = [
      ...pre,
      // high cut, half a turn
      { t: t1, p: { ...sp, x: (sp.x ?? 0) * 0.8, sR: 2.2, eR: 0.2, lean: -0.2, spin: 0.9 } },
      { t: t1 + 0.07, p: { ...sp, x: (sp.x ?? 0) * 0.9, sR: 1.7, eR: 0.3, lean: -0.15, spin: 1.7 } },
      // low cut, back round
      { t: i, p: { ...sp, y: -0.12, sR: 0.95, eR: 0.1, lean: -0.5, spin: -0.2, hR: 1.0, kR: -0.9 } },
      { t: i + 0.12, p: { ...sp, y: -0.1, sR: 0.8, lean: -0.4, spin: -0.4 } },
      { t: i + 0.5, p: {} },
    ];
    return { ...base, keys, trail: [t1 - 0.05, i + 0.12] };
  },
  windup: (c) => {
    const fx = eng(c);
    const a = c.attacker.anchors();
    const t1 = Math.max(0.12, c.impact - 0.22);
    if (c.t < t1 && (Math.floor(c.t * 60) & 3) === 0) fx.glow(a.tip, { radius: 0.3, color: '#bfe0ff', life: 0.12 });
    if (c.t >= t1 && fx.once('cut1')) {
      const at = { x: a.chest.x + c.dir * 0.35, y: a.chest.y + 0.5 };
      moonSweep(c, at, 0.95, 1.9, 0.1, 0.3, '#ffffff', '#7fb4ff', 0.5);
      fx.arc(at, { radius: 1.2, from: face(2.4, c.dir), to: face(0.3, c.dir), width: 0.3, color: '#bfe0ff', life: 0.25 });
      if (c.hit) {
        const p = hitPoint(c);
        fx.spark({ x: p.x, y: p.y + 0.4 }, { n: 8, color: '#dff0ff', speed: 5, dir: face(0.8, c.dir), spread: 1.6 });
        fx.word({ x: p.x, y: p.y + 1.1 }, 'ONE', { color: '#bfe0ff', size: 0.34, life: 0.45 });
        fx.shake(0.04, 0.8);
      }
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const p = hitPoint(c);
    const lo = { x: p.x, y: p.y - 0.15 };
    // the second moon sweeps the opposite way: together they make an X
    moonSweep(c, lo, 1.0, -2.0, 0.3, 0.4, '#ffffff', '#7fb4ff', 0.5);
    if (o === 'hit') {
      fx.layer('front', 0.55, (ctx, k) => {
        ctx.globalCompositeOperation = 'lighter';
        const e = 1 - (1 - k) * (1 - k);
        const r = 0.8 + 0.5 * e;
        fillCrescent(ctx, p.x, p.y + 0.1, r, face(0.75, c.dir) + e * 0.3, '#ffffff', (1 - k) * 0.95);
        fillCrescent(ctx, p.x, p.y + 0.1, r, face(-0.75, c.dir) - e * 0.3, '#9cc8ff', (1 - k) * 0.95);
        fillStar8(ctx, p.x, p.y + 0.1, 0.35 + 0.3 * e, k * 4, '#ffffff', (1 - k));
      });
      fx.glow(p, { radius: 1.3, color: '#9cc8ff', life: 0.26 });
      fx.burst(p, { n: 14, color: '#dff0ff', length: 1.1, life: 0.32 });
      fx.spark(p, { n: 16, color: '#bfe0ff', speed: 7, dir: face(0.4, c.dir), spread: 2.6, size: 0.035 });
      fx.ring(p, { color: '#9cc8ff', radius: 1.1, life: 0.4, width: 0.08 });
      fx.word({ x: p.x, y: p.y + 1.0 }, 'TWIN!', { color: '#dff0ff', size: 0.58, life: 0.85 });
    } else if (o === 'block') {
      guardCrack(c, '#dff0ff', '#7fb4ff');
    } else {
      whiffWord(c, 'SWISH SWISH', '#bfe0ff');
    }
  },
  finish: (c) => {
    const p = hitPoint(c);
    eng(c).layer('front', 1.0, (ctx, k) => {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 2; i++) {
        const sgn = i ? 1 : -1;
        fillCrescent(ctx, p.x + sgn * k * 1.4, p.y + 0.8 + k * 0.5, 1.0, Math.PI / 2 + sgn * (0.5 + k), i ? '#ffffff' : '#9cc8ff', (1 - k) * 0.8);
      }
    });
  },
};

const sultansEdge: AttackScript = {
  palette: { main: '#fff0b8', accent: GOLD, dark: '#4a0c1a' },
  choreograph: (base) => {
    // a regal pause: the blade is drawn, held, then the perfect cut falls
    const first = base.keys[0]!;
    const hold = delayFrom(base, first.t + 0.01, 0.22);
    const keys = insertKey(hold.keys, { t: first.t + 0.14, p: { ...first.p, lean: (first.p.lean ?? 0) + 0.08, sR: (first.p.sR ?? 1) + 0.15 } });
    return { ...hold, keys };
  },
  start: (c) => eng(c).wash('#4a0c1a', 0.24, Math.max(0.7, c.impact)),
  windup: (c) => {
    const fx = eng(c);
    const a = c.attacker.anchors();
    if (fx.once('tughra')) {
      const imp = c.impact;
      fx.layer('back', imp + 0.1, (ctx, k) => {
        const ff = c.attacker.anchors();
        ctx.globalCompositeOperation = 'lighter';
        const fade = k < 0.85 ? 1 : (1 - k) / 0.15;
        strokeTughra(ctx, ff.chest.x - c.dir * 0.2, ff.head.y + 0.55, 1.15, Math.min(1, k * 1.3), GOLD, 0.8 * fade);
      });
    }
    if ((Math.floor(c.t * 60) & 1) === 0) {
      fx.glow(a.tip, { radius: 0.4, color: GOLD, life: 0.1 });
      fx.spark(a.tip, { n: 1, color: '#fff4c8', speed: 2, dir: Math.PI / 2, spread: 3.2, size: 0.03 });
    }
    // the world slows just before the cut
    if (c.t >= c.impact - 0.2 && fx.once('hush')) {
      fx.slowmo(0.45, 0.2);
      fx.speedLines({ dir: dirAngle(c), color: GOLD, life: 0.3, n: 16 });
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const p = hitPoint(c);
    const reach = 2.4;
    if (o === 'hit') {
      const ang = face(0.42, c.dir);
      // one perfectly straight seam of light across the whole body
      fx.layer('front', 0.6, (ctx, k) => {
        ctx.globalCompositeOperation = 'lighter';
        const u = Math.min(1, k * 6);
        const x0 = p.x - Math.cos(ang) * reach * 0.5;
        const y0 = p.y - Math.sin(ang) * reach * 0.5;
        ctx.strokeStyle = '#ffffff';
        ctx.lineCap = 'round';
        ctx.globalAlpha = 1 - k;
        ctx.lineWidth = 0.1 * (1 - k) + 0.02;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + Math.cos(ang) * reach * u, y0 + Math.sin(ang) * reach * u);
        ctx.stroke();
        ctx.strokeStyle = GOLD;
        ctx.globalAlpha = (1 - k) * 0.7;
        ctx.lineWidth = 0.3 * (1 - k) + 0.02;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + Math.cos(ang) * reach * u, y0 + Math.sin(ang) * reach * u);
        ctx.stroke();
        // seam glints where the blade finds the joints
        for (let i = 0; i < 3; i++) {
          const gu = 0.25 + i * 0.25;
          if (u > gu) fillGlint(ctx, x0 + Math.cos(ang) * reach * gu, y0 + Math.sin(ang) * reach * gu, 0.28 + 0.1 * i, '#ffffff', (1 - k) * 1.2);
        }
      });
      fx.impactFrame(0.05);
      fx.glow(p, { radius: 1.8, color: GOLD, life: 0.32 });
      fx.burst(p, { n: 14, color: GOLD, length: 1.4, life: 0.4 });
      fx.spark(p, { n: 22, color: GOLD, speed: 9, dir: face(0.4, c.dir), spread: 2, size: 0.04 });
      fx.spark(p, { n: 10, color: '#ffffff', speed: 11, dir: face(0.42, c.dir), spread: 0.3, size: 0.03 });
      fx.ring(p, { color: GOLD, radius: 1.3, life: 0.45, width: 0.1 });
      fx.word({ x: p.x, y: p.y + 1.0 }, 'SULTAN!', { color: GOLD, size: 0.7, life: 1.0 });
      fx.punch(p, 1.18, 0.55);
    } else if (o === 'block') {
      guardCrack(c, '#fff0b8', GOLD);
    } else {
      const ang = face(0.42, c.dir);
      fx.layer('front', 0.4, (ctx, k) => {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = GOLD;
        ctx.lineCap = 'round';
        ctx.globalAlpha = (1 - k) * 0.8;
        ctx.lineWidth = 0.06;
        ctx.beginPath();
        ctx.moveTo(p.x + c.dir * 0.5 - Math.cos(ang) * 1.2, p.y - Math.sin(ang) * 1.2);
        ctx.lineTo(p.x + c.dir * 0.5 + Math.cos(ang) * 1.2, p.y + Math.sin(ang) * 1.2);
        ctx.stroke();
      });
      whiffWord(c, 'SWISH!', GOLD);
    }
  },
  finish: (c) => {
    const p = hitPoint(c);
    eng(c).layer('front', 1.6, (ctx, k) => {
      ctx.globalCompositeOperation = 'lighter';
      strokeTughra(ctx, p.x, p.y + 1.1, 2.0, Math.min(1, k * 2), GOLD, k < 0.75 ? 0.95 : (1 - k) / 0.25 * 0.95);
      fillStar8(ctx, p.x, p.y + 0.5, 0.8 + k, k * 1.5, CRIMSON, (1 - k) * 0.5);
    });
  },
};

// ───────────────────────────── firearms ─────────────────────────────

/** Crescent-ring reticle closing on the defender. */
function reticle(c: FxContext, color: string, accent: string, from: number, to: number): void {
  const life = Math.max(0.2, c.impact - 0.1);
  eng(c).layer('front', life, (ctx, k) => {
    const d = c.defender.anchors().chest;
    const e = k * k * (3 - 2 * k);
    const r = from + (to - from) * e;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, k * 3) * (k > 0.92 ? 0.4 : 0.9);
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.035;
    ctx.beginPath();
    ctx.arc(d.x, d.y, r, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const a = i * (Math.PI / 2) + k * 1.2;
      ctx.beginPath();
      ctx.moveTo(d.x + Math.cos(a) * r * 0.55, d.y + Math.sin(a) * r * 0.55);
      ctx.lineTo(d.x + Math.cos(a) * r * 1.25, d.y + Math.sin(a) * r * 1.25);
      ctx.stroke();
    }
    fillCrescent(ctx, d.x, d.y, r * 0.55, -k * 2.4, accent, 0.8);
  });
}

function bigMuzzle(c: FxContext, main: string, accent: string): V2 {
  const fx = eng(c);
  const m = c.attacker.anchors().tip;
  const at = { x: m.x, y: m.y };
  fx.glow(at, { radius: 1.3, color: '#fff1c0', life: 0.14 });
  fx.burst(at, { n: 9, color: main, length: 0.8, life: 0.18 });
  fx.spark(at, { n: 14, color: accent, speed: 9, dir: face(0, c.dir), spread: 0.9, size: 0.035 });
  fx.smoke(at, { n: 8, size: 0.2, rise: 0.35, color: '#b8c0d0' });
  fx.layer('front', 0.16, (ctx, k) => {
    ctx.globalCompositeOperation = 'lighter';
    fillStar8(ctx, at.x + c.dir * 0.3, at.y, 0.45 * (1 + k), c.dir * k, main, 1 - k);
  });
  return at;
}

function tracerTo(c: FxContext, from: V2, life: number, color: string, aimY: number, onEnd?: () => void): void {
  const fx = eng(c);
  const d = c.defender.anchors();
  const hitMode = c.hit || c.reaction === 'defend';
  const to: V2 = hitMode ? { x: d.chest.x - c.dir * 0.12, y: d.chest.y + aimY } : { x: d.chest.x + c.dir * 0.5, y: d.chest.y + aimY + 0.4 };
  fx.sprite({
    from,
    to,
    life,
    trail: color,
    paint: (ctx, p, ang) => {
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.ellipse(0, 0, 0.26, 0.05, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0.04, 0, 0.14, 0.026, 0, 0, TAU);
      ctx.fill();
    },
    ...(onEnd ? { onEnd } : {}),
  });
}

const steadyVolley: AttackScript = {
  palette: { main: '#ffe9a0', accent: GOLD, dark: '#101a3a' },
  choreograph: (base) => {
    // a brace: settle one step, breathe, then the shot
    const k0 = base.keys[0]!;
    return { ...base, keys: insertKey(base.keys, { t: k0.t * 0.5, p: { x: -0.1, lean: 0.12, sR: 1.1, sL: 1.2 } }) };
  },
  start: (c) => {
    reticle(c, GOLD, '#7fa6ff', 1.3, 0.38);
    eng(c).wash('#101a3a', 0.12, 0.8);
  },
  windup: (c) => {
    const fx = eng(c);
    if (c.t >= c.impact - 0.12 && fx.once('fire')) {
      const m = bigMuzzle(c, '#ffe9a0', GOLD);
      fx.word({ x: m.x + c.dir * 0.6, y: m.y + 0.6 }, 'FIRE!', { color: GOLD, size: 0.42, life: 0.5 });
      fx.shake(0.05, 0.85);
      tracerTo(c, m, 0.12, GOLD, 0);
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const p = hitPoint(c);
    if (o === 'hit') {
      fx.glow(p, { radius: 1.1, color: '#fff1c0', life: 0.22 });
      fx.burst(p, { n: 10, color: GOLD, length: 0.9, life: 0.3 });
      fx.spark(p, { n: 14, color: GOLD, speed: 7, dir: face(0.3, c.dir), spread: 2.2 });
      // a crescent-shaped puncture ring
      fx.layer('front', 0.4, (ctx, k) => {
        ctx.globalCompositeOperation = 'lighter';
        fillCrescent(ctx, p.x, p.y, 0.4 + 0.5 * k, face(Math.PI * 0.5, c.dir) + 2 * k, GOLD, 1 - k);
        fillCrescent(ctx, p.x, p.y, 0.4 + 0.5 * k, face(-Math.PI * 0.5, c.dir) + 2 * k, '#ffffff', 1 - k);
      });
      fx.word({ x: p.x, y: p.y + 0.8 }, 'POW!', { color: GOLD, size: 0.55, life: 0.75 });
    } else if (o === 'block') {
      guardCrack(c, '#ffe9a0', GOLD);
    } else {
      const g = c.defender.anchors().feet;
      const at = { x: g.x + c.dir * 0.8, y: 0.04 };
      fx.spark(at, { n: 10, color: '#ffe9a0', speed: 6, dir: Math.PI / 2, spread: 1.4 });
      fx.dust(at, { n: 8 });
      fx.word({ x: at.x, y: 0.7 }, 'PING!', { color: '#e8f0f4', size: 0.36, life: 0.55 });
    }
  },
};

const rollingFire: AttackScript = {
  palette: { main: '#ffb36b', accent: CRIMSON, dark: '#300a10' },
  choreograph: (base) => {
    const fire = base.impact - 0.12;
    const recoil = base.keys[2]?.p ?? {};
    const rest = base.keys[3]?.p ?? {};
    const keys: Key[] = [
      ...base.keys.slice(0, 2),
      { t: fire + 0.04, p: recoil },
      { t: fire + 0.12, p: { ...rest, lean: -0.1 } },
      { t: fire + 0.2, p: { ...recoil, x: (recoil.x ?? 0) - 0.05 } },
      { t: fire + 0.55, p: rest },
      { t: fire + 0.95, p: {} },
    ];
    return { ...base, keys, impact: fire + 0.3, release: fire };
  },
  start: (c) => eng(c).wash('#300a10', 0.15, 0.9),
  windup: (c) => {
    const fx = eng(c);
    const fire = c.impact - 0.3;
    // the drum of the mehter: pulses under the feet while the first shot is prepared
    if (c.t > 0.15 && c.t < fire && (Math.floor(c.t * 60) % 9) === 0) hoofRing(c, '#ff9a5a', 0.7, 0);
    if (c.t >= fire && fx.once('s1')) {
      const m = bigMuzzle(c, '#ffd0a0', '#ff9a5a');
      tracerTo(c, m, 0.12, '#ff9a5a', 0.1);
      fx.shake(0.05, 0.85);
      fx.word({ x: m.x + c.dir * 0.5, y: m.y + 0.5 }, 'BANG', { color: '#ffb36b', size: 0.36, life: 0.45 });
      if (c.hit) {
        const p = hitPoint(c);
        fx.spark(p, { n: 8, color: '#ffb36b', speed: 5, dir: face(0.3, c.dir), spread: 2 });
      }
    }
    // the second barrel, a little lower
    if (c.t >= fire + 0.17 && fx.once('s2')) {
      const m = bigMuzzle(c, '#fff0c0', CRIMSON);
      tracerTo(c, m, 0.1, CRIMSON, -0.3);
      fx.shake(0.06, 0.85);
      fx.word({ x: m.x + c.dir * 0.7, y: m.y + 0.8 }, 'BANG!', { color: '#ff8a5a', size: 0.46, life: 0.5 });
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const p = hitPoint(c);
    const a = c.attacker.anchors().feet;
    // a rolling bank of smoke along the ground between the two
    fx.ring({ x: a.x + c.dir * 0.8, y: 0.03 }, { color: '#d8c2b0', radius: 1.6, life: 0.6, width: 0.1, flat: 0.2 });
    for (let i = 0; i < 4; i++) fx.smoke({ x: a.x + c.dir * (0.6 + i * 0.5), y: 0.25 }, { n: 2, size: 0.26, rise: 0.25, color: '#b9aeb4' });
    if (o === 'hit') {
      fx.glow(p, { radius: 1.3, color: '#ffb36b', life: 0.24 });
      fx.burst(p, { n: 14, color: '#ff9a5a', length: 1.1, life: 0.32 });
      fx.spark(p, { n: 20, color: '#ffb36b', speed: 8, dir: face(0.3, c.dir), spread: 2.4 });
      fx.layer('front', 0.45, (ctx, k) => {
        ctx.globalCompositeOperation = 'lighter';
        // two stacked impact marks, one per shot
        fillStar8(ctx, p.x, p.y + 0.12, 0.45 + 0.45 * k, k * 2, '#ffd0a0', 1 - k);
        fillStar8(ctx, p.x - c.dir * 0.05, p.y - 0.25, 0.35 + 0.4 * k, -k * 2, CRIMSON, 1 - k);
      });
      fx.word({ x: p.x, y: p.y + 0.9 }, 'RATATAT!', { color: '#ffb36b', size: 0.6, life: 0.85 });
      fx.speedLines({ dir: dirAngle(c), color: '#ffb36b', life: 0.22, n: 18 });
    } else if (o === 'block') {
      guardCrack(c, '#ffd0a0', CRIMSON);
    } else {
      const g = c.defender.anchors().feet;
      for (let i = 0; i < 2; i++) {
        const at = { x: g.x + c.dir * (0.6 + i * 0.5), y: 0.04 };
        fx.spark(at, { n: 8, color: '#ffd0a0', speed: 6, dir: Math.PI / 2, spread: 1.4 });
        fx.dust(at, { n: 5 });
      }
      fx.word({ x: g.x, y: 0.7 }, 'PING PING', { color: '#e8d4c0', size: 0.34, life: 0.55 });
    }
  },
  finish: (c) => {
    const p = hitPoint(c);
    eng(c).layer('front', 0.9, (ctx, k) => {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) {
        const u = Math.max(0, Math.min(1, k * 1.5 - i * 0.1));
        fillGlint(ctx, p.x + (i - 2.5) * 0.35, p.y + 0.4 + (i % 2) * 0.5, 0.25 + u * 0.2, '#ffd0a0', (1 - u) * (u > 0 ? 1 : 0));
      }
    });
  },
};

const ortaMarksman: AttackScript = {
  palette: { main: '#ffe28a', accent: '#3fb0d8', dark: '#0a2230' },
  choreograph: (base) => {
    // the long barrel is laid on the target: hold the aim before the trigger
    const hold = delayFrom(base, (base.keys[1]?.t ?? 0.4), 0.45);
    return hold;
  },
  start: (c) => {
    const fx = eng(c);
    reticle(c, '#7fe0ff', GOLD, 1.9, 0.22);
    fx.wash('#0a2230', 0.24, Math.max(0.8, c.impact));
  },
  windup: (c) => {
    const fx = eng(c);
    const fire = c.impact - 0.12;
    if (c.t >= fire - 0.28 && fx.once('slow')) {
      fx.slowmo(0.4, 0.26);
      fx.punch(c.defender.anchors().chest, 1.1, 0.4);
    }
    // a weak-point glint blinks on the target before the shot
    if (c.t >= fire - 0.2 && fx.once('glint')) {
      const d = c.defender.anchors().chest;
      sparkle(c, { x: d.x - c.dir * 0.1, y: d.y + 0.25 }, 0.5, 0.35, '#ffffff');
    }
    if (c.t >= fire && fx.once('fire')) {
      const m = bigMuzzle(c, '#ffe28a', '#3fb0d8');
      fx.speedLines({ dir: dirAngle(c), color: '#bff0ff', life: 0.18, n: 22 });
      fx.shake(0.07, 0.85);
      tracerTo(c, m, 0.1, '#7fe0ff', 0.25);
      fx.word({ x: m.x + c.dir * 0.5, y: m.y + 0.6 }, 'CRACK!', { color: '#ffe28a', size: 0.46, life: 0.55 });
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const p = hitPoint(c);
    if (o === 'hit') {
      // it goes clean through: a bright entry and a longer exit spray out of the back
      const exit = { x: p.x + c.dir * 0.9, y: p.y + 0.25 };
      fx.glow(p, { radius: 1.2, color: '#fff1c0', life: 0.22 });
      fx.burst(p, { n: 10, color: '#ffe28a', length: 0.9, life: 0.3 });
      fx.spark(exit, { n: 18, color: '#7fe0ff', speed: 10, dir: face(0.1, c.dir) + (c.dir === 1 ? 0 : 0), spread: 0.5, size: 0.035 });
      fx.layer('front', 0.5, (ctx, k) => {
        ctx.globalCompositeOperation = 'lighter';
        // a narrow line of light through the body and a bullseye of rings
        ctx.strokeStyle = '#bff0ff';
        ctx.lineCap = 'round';
        ctx.globalAlpha = 1 - k;
        ctx.lineWidth = 0.05;
        ctx.beginPath();
        ctx.moveTo(p.x - c.dir * 0.9, p.y);
        ctx.lineTo(p.x + c.dir * (1.6 + k), p.y + 0.25 * (1 + k));
        ctx.stroke();
        ctx.lineWidth = 0.03;
        for (let i = 1; i <= 3; i++) {
          ctx.globalAlpha = (1 - k) * (1 - i * 0.2);
          ctx.beginPath();
          ctx.arc(p.x, p.y, i * 0.22 * (0.6 + k), 0, TAU);
          ctx.stroke();
        }
        fillGlint(ctx, p.x, p.y, 0.4 + 0.4 * k, '#ffffff', 1 - k);
      });
      fx.word({ x: p.x, y: p.y + 0.9 }, 'BULLSEYE!', { color: '#ffe28a', size: 0.6, life: 0.9 });
      fx.punch(p, 1.12, 0.45);
    } else if (o === 'block') {
      guardCrack(c, '#ffe28a', '#3fb0d8');
    } else {
      const g = c.defender.anchors().feet;
      const at = { x: g.x + c.dir * 0.9, y: 0.04 };
      fx.spark(at, { n: 10, color: '#7fe0ff', speed: 6, dir: Math.PI / 2, spread: 1.2 });
      fx.dust(at, { n: 6 });
      fx.word({ x: at.x, y: 0.7 }, 'JUST WIDE', { color: '#cfe8f0', size: 0.34, life: 0.6 });
    }
  },
  finish: (c) => {
    const p = hitPoint(c);
    eng(c).layer('front', 1.0, (ctx, k) => {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) fillCrescent(ctx, p.x, p.y + 0.3, 0.5 + k * (0.9 + i * 0.4), Math.PI / 2 + i * 0.4, '#7fe0ff', (1 - k) * 0.5);
    });
  },
};

// ───────────────────────────── cavalry ─────────────────────────────

const sipahiCharge: AttackScript = {
  palette: { main: '#ffd35a', accent: CRIMSON, dark: '#3a0812' },
  start: (c) => {
    const fx = eng(c);
    spiritSteeds(c, 1, '#ffcf6a', CRIMSON, 0.95);
    fx.speedLines({ dir: dirAngle(c), color: GOLD, life: Math.max(0.5, c.impact), n: 30 });
    fx.wash('#3a0812', 0.2, c.impact);
    // pennant streaming from the lance
    fx.layer('front', Math.max(0.3, c.impact), (ctx, k) => {
      const a = c.attacker.anchors();
      ctx.globalCompositeOperation = 'source-over';
      pennant(ctx, a.tip.x - c.dir * 0.45, a.tip.y + 0.02, 0.6 * c.dir, c.dir === 1 ? 0 : 0, k * 40, CRIMSON, Math.min(1, k * 5));
    });
  },
  windup: (c) => {
    const fx = eng(c);
    const beat = Math.floor(c.t * 14);
    if (c.t > 0.2 && beat !== lastBeat(c) && fx.once(`beat${beat}`)) hoofRing(c, '#e7c88a', 0.55, 2);
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const d = c.defender.anchors();
    fx.ring({ x: d.feet.x - c.dir * 0.3, y: 0.03 }, { color: '#e8d4a0', radius: 2.6, life: 0.6, width: 0.14, flat: 0.25 });
    fx.dust({ x: d.feet.x - c.dir * 0.4, y: 0 }, { n: 18, size: 0.26 });
    if (o === 'hit') {
      const p = hitPoint(c);
      fx.glow(p, { radius: 1.6, color: GOLD, life: 0.3 });
      fx.burst(p, { n: 16, color: GOLD, length: 1.5, life: 0.38 });
      fx.spark(p, { n: 22, color: CRIMSON, speed: 8, dir: face(0.4, c.dir), spread: 2.4 });
      // the lance pennant is flung loose and flutters away, with a crescent flash
      fx.layer('front', 0.8, (ctx, k) => {
        ctx.globalCompositeOperation = 'source-over';
        pennant(ctx, p.x - c.dir * 0.2 + c.dir * k * 1.2, p.y + 0.5 + k * 0.9, 0.7 * c.dir, -0.4 * c.dir + k * 3, k * 30, CRIMSON, 1 - k);
        ctx.globalCompositeOperation = 'lighter';
        fillCrescent(ctx, p.x, p.y, 1.1 * (0.5 + k), face(0.3, c.dir), GOLD, (1 - k) * 0.8);
      });
      fx.word({ x: p.x, y: p.y + 0.95 }, 'CHARGE!', { color: GOLD, size: 0.65, life: 0.9 });
      fx.speedLines({ color: '#ffffff', life: 0.28, n: 34 });
      fx.punch(p, 1.12, 0.5);
    } else if (o === 'block') {
      guardCrack(c, GOLD, CRIMSON);
    } else {
      whiffWord(c, 'WHOOSH!', GOLD);
    }
  },
  finish: (c) => {
    const p = hitPoint(c);
    eng(c).layer('front', 1.0, (ctx, k) => {
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 3; i++) pennant(ctx, p.x + (i - 1) * 0.5, p.y + 0.4 + k * (1.1 + i * 0.3), 0.6, -0.6 + i * 0.6 + k * 2, k * 30 + i, i === 1 ? GOLD : CRIMSON, 1 - k);
    });
  },
};

/** Index of the last hoofbeat already issued (derived from the clock; stateless). */
function lastBeat(c: FxContext): number {
  return Math.floor((c.t - 1 / 60) * 14);
}

const lanceFeint: AttackScript = {
  palette: { main: '#bfe0ff', accent: GOLD, dark: '#0e2250' },
  choreograph: (base) => {
    const k0 = base.keys[0]!;
    const sp = strikePose(base);
    const dip = Math.max(0.1, k0.t * 0.9);
    const keys: Key[] = [
      { t: dip * 0.5, p: { ...k0.p, y: -0.1, sR: 0.3, eR: 0.5, wR: 0.2, lean: 0.12 } },
      // the feint: the point dips low and the body commits down...
      { t: dip, p: { x: (k0.p.x ?? 0) + 0.15, y: -0.25, sR: 0.15, eR: 0.5, wR: 0.1, lean: -0.3, hR: 0.9, kR: -1.2 } },
      // ...then snaps up and darts high
      ...base.keys.filter((k) => k.t > dip + 0.06),
    ];
    // make sure the strike pose is ahead of the dip
    const sorted = keys.sort((a, b) => a.t - b.t);
    void sp;
    return { ...base, keys: sorted };
  },
  windup: (c) => {
    const fx = eng(c);
    const a = c.attacker.anchors();
    const fakeAt = Math.max(0.12, c.impact * 0.5);
    if (c.t >= fakeAt && fx.once('fake')) {
      // a pale ghost thrust low, the feint, with a question mark of sparks
      const d = c.defender.anchors();
      fx.layer('front', 0.35, (ctx, k) => {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = '#7fa8ff';
        ctx.globalAlpha = (1 - k) * 0.7;
        ctx.lineWidth = 0.07;
        ctx.lineCap = 'round';
        ctx.setLineDash([0.12, 0.1]);
        ctx.beginPath();
        ctx.moveTo(a.tip.x, 0.3);
        ctx.lineTo(d.feet.x - c.dir * 0.5, 0.25);
        ctx.stroke();
        ctx.setLineDash([]);
      });
      fx.word({ x: a.tip.x + c.dir * 0.6, y: 0.75 }, 'FEINT!', { color: '#9cc0ff', size: 0.38, life: 0.5 });
      fx.dust({ x: a.tip.x + c.dir * 0.4, y: 0 }, { n: 3 });
      if (c.hit || c.reaction === 'avoid') {
        // the defender is lured low
        fx.spark({ x: d.chest.x, y: 0.5 }, { n: 4, color: '#9cc0ff', speed: 3, dir: Math.PI / 2, spread: 2 });
      }
    }
    if (c.t >= c.impact - 0.14 && fx.once('dart')) {
      const d = c.defender.anchors();
      fx.layer('front', 0.28, (ctx, k) => {
        ctx.globalCompositeOperation = 'lighter';
        const u = Math.min(1, k * 4);
        ctx.strokeStyle = GOLD;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 1 - k;
        ctx.lineWidth = 0.14 * (1 - k) + 0.02;
        // the dart: a curve from low to high that ends in the head
        const sx = a.tip.x;
        const ex = d.chest.x - c.dir * 0.1;
        ctx.beginPath();
        ctx.moveTo(sx, 0.3);
        ctx.quadraticCurveTo(sx + (ex - sx) * 0.4, 0.2, sx + (ex - sx) * u, 0.3 + (d.head.y - 0.3) * u * u);
        ctx.stroke();
      });
      fx.speedLines({ dir: dirAngle(c), color: '#bfe0ff', life: 0.2, n: 14 });
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const d = c.defender.anchors();
    const p = { x: d.head.x - c.dir * 0.12, y: d.head.y - 0.1 };
    if (o === 'hit') {
      fx.glow(p, { radius: 1.2, color: '#bfe0ff', life: 0.25 });
      fx.burst(p, { n: 10, color: GOLD, length: 0.9, life: 0.3 });
      fx.spark(p, { n: 14, color: '#bfe0ff', speed: 7, dir: face(0.5, c.dir), spread: 2 });
      fx.layer('front', 0.45, (ctx, k) => {
        ctx.globalCompositeOperation = 'lighter';
        fillGlint(ctx, p.x, p.y, 0.6 + 0.4 * k, '#ffffff', 1 - k);
        // chevron arrowheads fanning from the point of impact
        for (let i = -1; i <= 1; i += 2) fillCrescent(ctx, p.x, p.y, 0.45 + 0.5 * k, face(i * 0.9, c.dir) + i * k, GOLD, (1 - k) * 0.9);
      });
      fx.word({ x: p.x, y: p.y + 0.8 }, 'GOTCHA!', { color: GOLD, size: 0.52, life: 0.8 });
    } else if (o === 'block' || o === 'counter') {
      guardCrack(c, '#bfe0ff', GOLD);
    } else {
      fx.spark({ x: d.chest.x, y: d.head.y }, { n: 6, color: '#bfe0ff', speed: 4, dir: face(0.2, c.dir), spread: 1.4 });
      whiffWord(c, 'TOO SLOW!', '#bfe0ff');
    }
  },
};

const thunderOfHooves: AttackScript = {
  palette: { main: GOLD, accent: '#5a86ff', dark: '#0a1230' },
  start: (c) => {
    const fx = eng(c);
    spiritSteeds(c, 3, '#ffe28a', '#7fa0ff', 1.15);
    fx.speedLines({ dir: dirAngle(c), color: '#ffe28a', life: Math.max(0.6, c.impact), n: 46 });
    fx.wash('#0a1230', 0.32, c.impact + 0.2);
    // stormy sky flickers behind
    fx.layer('back', c.impact, (ctx, k) => {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.12 + 0.1 * Math.sin(k * 40);
      ctx.fillStyle = '#5a86ff';
      ctx.fillRect(-12, 0, 24, 6);
    });
  },
  windup: (c) => {
    const fx = eng(c);
    // rolling hoofbeat rings, quickening as the gallop builds
    const rate = 12 + 12 * Math.min(1, c.t / Math.max(0.2, c.impact));
    const beat = Math.floor(c.t * rate);
    if (c.t > 0.2 && fx.once(`hb${beat}`)) {
      hoofRing(c, '#f2d890', 0.5 + 0.06 * beat * 0.1, 2);
      fx.shake(0.03, 0.8);
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const d = c.defender.anchors();
    const gx = d.feet.x - c.dir * 0.3;
    // a wall of dust and three rings rolling out, one per hoofbeat
    fx.dust({ x: gx, y: 0 }, { n: 24, size: 0.32 });
    for (let i = 0; i < 3; i++) fx.later(i * 0.09, () => fx.ring({ x: gx, y: 0.03 }, { color: i === 1 ? '#5a86ff' : '#f2d890', radius: 2.2 + i * 0.9, life: 0.6, width: 0.15, flat: 0.22 }));
    // lightning bolt out of the sky
    const bolt = [0, 0.1, -0.15, 0.2, -0.1, 0.12, 0];
    fx.layer('front', 0.4, (ctx, k) => {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = (1 - k) * (((Math.floor(k * 14)) & 1) ? 0.6 : 1);
      ctx.lineWidth = 0.14 * (1 - k) + 0.03;
      ctx.beginPath();
      ctx.moveTo(d.chest.x + bolt[0]!, 5);
      for (let i = 1; i < bolt.length; i++) ctx.lineTo(d.chest.x + bolt[i]! * 2, 5 - (i * 5) / (bolt.length - 1));
      ctx.stroke();
      ctx.strokeStyle = '#7fa0ff';
      ctx.lineWidth = 0.4 * (1 - k);
      ctx.globalAlpha = (1 - k) * 0.35;
      ctx.stroke();
    });
    fx.flash('#cfe0ff', 0.45, 0.18);
    fx.shake(0.22, 0.9);
    if (o === 'hit') {
      const p = hitPoint(c);
      fx.glow(p, { radius: 2.2, color: GOLD, life: 0.36 });
      fx.burst(p, { n: 20, color: GOLD, length: 1.9, life: 0.42 });
      fx.spark(p, { n: 30, color: '#ffe28a', speed: 10, dir: face(0.4, c.dir), spread: 2.6 });
      fx.speedLines({ color: '#ffffff', life: 0.35, n: 44 });
      fx.punch(p, 1.2, 0.6);
      fx.word({ x: p.x, y: p.y + 1.1 }, 'THUNDER!', { color: GOLD, size: 0.85, life: 1.1, rot: -0.08 });
      // exhausted: dizzy stars and sweat drops circle the head
      fx.layer('front', 1.4, (ctx, k) => {
        const h = c.defender.anchors().head;
        ctx.globalCompositeOperation = 'lighter';
        const fade = k < 0.7 ? 1 : (1 - k) / 0.3;
        for (let i = 0; i < 4; i++) {
          const a = k * 8 + (i * TAU) / 4;
          fillStar8(ctx, h.x + Math.cos(a) * 0.45, h.y + 0.5 + Math.sin(a) * 0.12, 0.13, a * 2, '#ffe28a', fade * 0.9);
        }
        ctx.globalAlpha = fade * 0.7;
        ctx.fillStyle = '#9cc0ff';
        for (let i = 0; i < 3; i++) {
          const yy = h.y + 0.3 - ((k * 1.6 + i * 0.33) % 1) * 0.6;
          ctx.beginPath();
          ctx.arc(h.x + c.dir * 0.3 + (i - 1) * 0.22, yy, 0.05, 0, TAU);
          ctx.fill();
        }
      });
    } else if (o === 'block') {
      guardCrack(c, GOLD, '#5a86ff');
    } else {
      whiffWord(c, 'WHOOSH!', GOLD);
    }
  },
  follow: (c) => {
    const fx = eng(c);
    // dust cloud rolling on past the impact
    if (c.t < c.impact + 0.5 && (Math.floor(c.t * 60) % 5) === 0) {
      const d = c.defender.anchors().feet;
      fx.dust({ x: d.x - c.dir * (0.3 - (c.t - c.impact)), y: 0 }, { n: 1, size: 0.3 });
    }
  },
  finish: (c) => {
    const p = hitPoint(c);
    eng(c).layer('front', 1.2, (ctx, k) => {
      ctx.globalCompositeOperation = 'lighter';
      ghostHorse(ctx, p.x - c.dir * (1.8 - 4 * k), 0, 1.4, k * 24, c.dir, '#ffe28a', (1 - k) * 0.55);
    });
  },
};

// ───────────────────────────── grenadiers ─────────────────────────────

const firePot: AttackScript = {
  palette: { main: '#ffb347', accent: '#ff5a1a', dark: '#3a1608' },
  windup: (c) => {
    const fx = eng(c);
    const a = c.attacker.anchors();
    // the wick is lit: a lit flicker in the hand
    if (c.t < c.impact - 0.45 && (Math.floor(c.t * 60) & 3) === 0) fx.spark({ x: a.hand.x, y: a.hand.y + 0.2 }, { n: 1, color: '#ffcf5a', speed: 2, dir: Math.PI / 2, spread: 2.5, size: 0.03 });
    if (c.t >= c.impact - 0.45 && fx.once('lob')) {
      lobber(
        c,
        (ctx, p, _ang, k) => {
          ctx.translate(p.x, p.y);
          ctx.rotate(k * 11);
          // clay pot with a crescent motif and a burning rag
          ctx.fillStyle = '#9a4a24';
          ctx.beginPath();
          ctx.ellipse(0, 0, 0.17, 0.15, 0, 0, TAU);
          ctx.fill();
          ctx.fillStyle = '#6a2e14';
          ctx.fillRect(-0.09, 0.11, 0.18, 0.05);
          fillCrescent(ctx, 0, -0.01, 0.08, 0, '#ffd35a', 0.9);
          ctx.fillStyle = '#ffcf5a';
          ctx.globalCompositeOperation = 'lighter';
          flameTongue(ctx, 0, 0.15, 0.06, 0.2 + 0.06 * Math.sin(k * 90), 0);
        },
        (p, k) => {
          const fx2 = eng(c);
          fx2.spark({ x: p.x, y: p.y + 0.2 }, { n: 2, color: '#ffb347', speed: 2.5, dir: Math.PI / 2, spread: 2.4, size: 0.035 });
          if (k > 0.2 && (Math.floor(k * 40) & 3) === 0) fx2.ember({ x: p.x, y: p.y }, { n: 1 });
        },
      );
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const d = c.defender.anchors();
    const at = { x: d.chest.x - c.dir * (c.hit ? 0.1 : -0.35), y: c.hit ? d.chest.y - 0.15 : 0.2 };
    fx.glow(at, { radius: 1.8, color: '#ffb347', life: 0.4 });
    fx.glow(at, { radius: 1.1, color: '#fff3c4', life: 0.18 });
    fx.ring(at, { color: '#ffd37a', radius: 1.6, life: 0.4, width: 0.12 });
    // clay shards fly out, fat tongues of naphtha flame splash up
    for (let i = 0; i < 9; i++) {
      const to = { x: at.x + (fx.rand() - 0.5) * 3.2, y: Math.max(0.05, at.y + (fx.rand() - 0.2) * 1.8) };
      const sz = 0.05 + fx.rand() * 0.05;
      fx.sprite({
        from: at,
        to,
        life: 0.45 + fx.rand() * 0.2,
        arc: 0.6 + fx.rand() * 0.6,
        paint: (ctx, p, _a, k) => {
          ctx.translate(p.x, p.y);
          ctx.rotate(k * 12);
          ctx.fillStyle = '#9a4a24';
          ctx.globalAlpha = 1 - k * k;
          ctx.fillRect(-sz, -sz * 0.6, sz * 2, sz * 1.2);
        },
      });
    }
    fx.layer('front', 0.9, (ctx, k) => {
      ctx.globalCompositeOperation = 'lighter';
      const e = 1 - (1 - k) * (1 - k);
      const fade = k < 0.6 ? 1 : (1 - k) / 0.4;
      for (let i = 0; i < 7; i++) {
        const sx = (i - 3) * 0.28 * (0.5 + e);
        const h = (0.9 - Math.abs(i - 3) * 0.17) * (0.4 + e);
        ctx.globalAlpha = fade * 0.8;
        ctx.fillStyle = '#ff5a1a';
        flameTongue(ctx, at.x + sx, at.y - 0.1, 0.17, h, Math.sin(k * 20 + i) * 0.1);
        ctx.globalAlpha = fade * 0.9;
        ctx.fillStyle = '#ffd37a';
        flameTongue(ctx, at.x + sx, at.y - 0.1, 0.08, h * 0.55, Math.sin(k * 20 + i) * 0.05);
      }
    });
    fx.burst(at, { n: 14, color: '#ff8a1f', length: 1.2, life: 0.4 });
    fx.spark(at, { n: 22, color: '#ffb347', speed: 8, size: 0.045 });
    fx.ember(at, { n: 12 });
    fx.smoke(at, { n: 5, size: 0.24, rise: 0.8, color: '#2a2220' });
    fx.word({ x: at.x, y: at.y + 1.2 }, 'FWOOSH!', { color: '#ffb347', size: 0.62, life: 0.9, rot: -0.1 });
    fx.shake(0.14, 0.88);
    fx.wash('#ff7a1a', 0.2, 0.5);
    if (o === 'hit') burningBody(c, 1.1, '#ff5a1a', '#ffd37a', 6);
    else if (o === 'block') guardCrack(c, '#ffb347', '#ff5a1a');
  },
  finish: (c) => {
    const p = hitPoint(c);
    const fx = eng(c);
    fx.layer('front', 1.2, (ctx, k) => {
      ctx.globalCompositeOperation = 'lighter';
      const e = 1 - (1 - k) * (1 - k);
      ctx.globalAlpha = (1 - k) * 0.8;
      ctx.fillStyle = '#ff7a1a';
      for (let i = 0; i < 5; i++) flameTongue(ctx, p.x + (i - 2) * 0.35, 0.1, 0.22, 1.2 + e * 1.4 - Math.abs(i - 2) * 0.25, Math.sin(k * 14 + i) * 0.1);
    });
  },
};

const smokeAndIron: AttackScript = {
  palette: { main: '#c9d3e6', accent: '#ffb04a', dark: '#1c2236' },
  windup: (c) => {
    const fx = eng(c);
    if (c.t >= c.impact - 0.45 && fx.once('lob')) {
      lobber(
        c,
        (ctx, p, _ang, k) => {
          ctx.translate(p.x, p.y);
          ctx.rotate(k * 9);
          // riveted iron ball with a sputtering fuse
          ctx.fillStyle = '#2b3042';
          ctx.beginPath();
          ctx.arc(0, 0, 0.16, 0, TAU);
          ctx.fill();
          ctx.strokeStyle = '#6c7690';
          ctx.lineWidth = 0.025;
          ctx.beginPath();
          ctx.arc(0, 0, 0.16, 0.4, 2.6);
          ctx.moveTo(-0.16, 0);
          ctx.lineTo(0.16, 0);
          ctx.stroke();
          ctx.fillStyle = '#ffb04a';
          ctx.globalCompositeOperation = 'lighter';
          ctx.beginPath();
          ctx.arc(0.02, 0.2, 0.05 + 0.02 * Math.sin(k * 80), 0, TAU);
          ctx.fill();
        },
        (p, k) => {
          const f = eng(c);
          f.spark({ x: p.x, y: p.y + 0.22 }, { n: 2, color: '#ffb04a', speed: 3, dir: Math.PI / 2, spread: 3, size: 0.03 });
          if ((Math.floor(k * 50) & 3) === 0) f.smoke({ x: p.x, y: p.y }, { n: 1, size: 0.1, rise: 0.25, color: '#9aa4bc' });
        },
        1.3,
      );
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const d = c.defender.anchors();
    const at = { x: d.chest.x - c.dir * (c.hit ? 0.1 : -0.35), y: c.hit ? d.chest.y - 0.15 : 0.35 };
    fx.glow(at, { radius: 1.6, color: '#ffb04a', life: 0.24 });
    fx.glow(at, { radius: 1.0, color: '#ffffff', life: 0.12 });
    fx.burst(at, { n: 16, color: '#ffb04a', length: 1.0, life: 0.3 });
    fx.ring(at, { color: '#c9d3e6', radius: 2.2, life: 0.5, width: 0.14 });
    // iron scrap spraying outward, each fragment spinning and dropping away
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + fx.rand() * 0.4;
      const r = 1.1 + fx.rand() * 1.5;
      const to = { x: at.x + Math.cos(a) * r, y: Math.max(0.05, at.y + Math.sin(a) * r * 0.7) };
      const sz = 0.04 + fx.rand() * 0.05;
      const spin = fx.rand() * 20;
      fx.sprite({
        from: at,
        to,
        life: 0.4 + fx.rand() * 0.2,
        arc: 0.3,
        trail: '#ffb04a',
        paint: (ctx, p, _a, k) => {
          ctx.translate(p.x, p.y);
          ctx.rotate(k * spin);
          ctx.fillStyle = '#3a4054';
          ctx.globalAlpha = 1 - k * k;
          ctx.beginPath();
          ctx.moveTo(-sz * 1.4, -sz * 0.4);
          ctx.lineTo(sz * 1.2, -sz);
          ctx.lineTo(sz * 1.5, sz * 0.5);
          ctx.lineTo(-sz * 0.5, sz);
          ctx.closePath();
          ctx.fill();
        },
      });
    }
    // billowing choking cloud
    fx.smoke(at, { n: 12, size: 0.5, rise: 0.5, color: '#8892aa' });
    fx.smoke({ x: at.x, y: 0.4 }, { n: 8, size: 0.6, rise: 0.3, color: '#5c6680' });
    fx.dust({ x: at.x, y: 0 }, { n: 10, size: 0.32 });
    fx.layer('front', 1.2, (ctx, k) => {
      ctx.globalCompositeOperation = 'source-over';
      const e = 1 - (1 - k) * (1 - k);
      const fade = k < 0.5 ? 1 : (1 - k) * 2;
      ctx.fillStyle = '#7a849e';
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU;
        ctx.globalAlpha = fade * 0.42;
        ctx.beginPath();
        ctx.arc(at.x + Math.cos(a) * 0.75 * e, at.y + 0.2 + Math.sin(a) * 0.5 * e + k * 0.5, 0.45 + 0.4 * e, 0, TAU);
        ctx.fill();
      }
    });
    fx.word({ x: at.x, y: at.y + 1.2 }, 'KABOOM!', { color: '#ffb04a', size: 0.7, life: 1.0, rot: 0.08 });
    fx.flash('#fff0c0', 0.4, 0.15);
    fx.shake(0.2, 0.88);
    fx.wash('#1c2236', 0.35, 1.2);
    if (o === 'hit') {
      fx.layer('front', 1.6, (ctx, k) => {
        const h = c.defender.anchors().head;
        ctx.globalCompositeOperation = 'source-over';
        const fade = k < 0.6 ? 1 : (1 - k) / 0.4;
        // coughing puffs rise from the pilot's helm
        for (let i = 0; i < 4; i++) {
          const u = (k * 2.2 + i * 0.25) % 1;
          ctx.globalAlpha = fade * (1 - u) * 0.5;
          ctx.fillStyle = '#a0aac0';
          ctx.beginPath();
          ctx.arc(h.x + Math.sin(i * 2 + k * 5) * 0.2, h.y + 0.2 + u * 0.8, 0.1 + 0.12 * u, 0, TAU);
          ctx.fill();
        }
      });
    } else if (o === 'block') {
      guardCrack(c, '#c9d3e6', '#ffb04a');
    }
  },
  follow: (c) => {
    const fx = eng(c);
    if (c.t < c.impact + 0.9 && (Math.floor(c.t * 60) % 6) === 0) {
      const d = c.defender.anchors();
      fx.smoke({ x: d.chest.x + (fx.rand() - 0.5) * 1.2, y: 0.4 + fx.rand() * 0.8 }, { n: 1, size: 0.45, rise: 0.25, color: '#7a849e' });
    }
  },
  finish: (c) => {
    const p = hitPoint(c);
    eng(c).layer('front', 1.2, (ctx, k) => {
      ctx.globalCompositeOperation = 'lighter';
      fillCrescent(ctx, p.x, p.y + 0.6, 1.4 + k, Math.PI / 2 - k, '#c9d3e6', (1 - k) * 0.4);
      fillStar8(ctx, p.x, p.y + 0.6, 0.6 + 0.9 * k, k * 2, '#ffb04a', (1 - k) * 0.7);
    });
  },
};

const burningPitch: AttackScript = {
  palette: { main: '#ff7a1a', accent: '#ffd02a', dark: '#2a0d05' },
  choreograph: (base) => {
    // heave the cask: lean back deep, then hurl from the hip
    const k0 = base.keys[0]!;
    return { ...base, keys: insertKey(base.keys, { t: k0.t * 0.6, p: { ...k0.p, lean: 0.4, y: -0.12, hR: 0.5, kR: -0.8 } }) };
  },
  start: (c) => eng(c).wash('#2a0d05', 0.22, 0.9),
  windup: (c) => {
    const fx = eng(c);
    const a = c.attacker.anchors();
    if (c.t < c.impact - 0.45 && (Math.floor(c.t * 60) & 1) === 0) fx.ember({ x: a.hand.x, y: a.hand.y + 0.1 }, { n: 1 });
    if (c.t >= c.impact - 0.45 && fx.once('lob')) {
      lobber(
        c,
        (ctx, p, _ang, k) => {
          ctx.translate(p.x, p.y);
          ctx.rotate(k * 8);
          // a stave-built cask, hoops and a dripping flame
          ctx.fillStyle = '#4a2a14';
          ctx.beginPath();
          ctx.ellipse(0, 0, 0.19, 0.15, 0, 0, TAU);
          ctx.fill();
          ctx.strokeStyle = '#b08a4a';
          ctx.lineWidth = 0.03;
          ctx.beginPath();
          ctx.moveTo(-0.07, -0.14);
          ctx.lineTo(-0.07, 0.14);
          ctx.moveTo(0.07, -0.14);
          ctx.lineTo(0.07, 0.14);
          ctx.stroke();
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = '#ff7a1a';
          flameTongue(ctx, 0, 0.12, 0.1, 0.32 + 0.08 * Math.sin(k * 90), 0.03);
          ctx.fillStyle = '#ffd02a';
          flameTongue(ctx, 0, 0.12, 0.05, 0.16, 0);
        },
        (p, k) => {
          const f = eng(c);
          f.ember({ x: p.x, y: p.y }, { n: 1 });
          f.spark({ x: p.x, y: p.y - 0.1 }, { n: 1, color: '#ff7a1a', speed: 1.4, dir: -Math.PI / 2, spread: 1.2, size: 0.045 });
          if ((Math.floor(k * 40) & 3) === 0) f.smoke({ x: p.x, y: p.y }, { n: 1, size: 0.1, rise: 0.2, color: '#1a1412' });
        },
        1.7,
      );
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const d = c.defender.anchors();
    const at = { x: d.chest.x - c.dir * (c.hit ? 0.1 : -0.35), y: c.hit ? d.chest.y : 0.2 };
    fx.glow(at, { radius: 2.4, color: '#ff7a1a', life: 0.5 });
    fx.glow(at, { radius: 1.2, color: '#ffd02a', life: 0.25 });
    fx.ring(at, { color: '#ffd02a', radius: 2.0, life: 0.45, width: 0.14 });
    fx.burst(at, { n: 14, color: '#ff7a1a', length: 1.3, life: 0.42 });
    // black tar splashes out in thick drops
    for (let i = 0; i < 10; i++) {
      const to = { x: at.x + (fx.rand() - 0.5) * 3.4, y: Math.max(0.06, at.y + (fx.rand() - 0.4) * 1.6) };
      const sz = 0.05 + fx.rand() * 0.06;
      fx.sprite({
        from: at,
        to,
        life: 0.4 + fx.rand() * 0.25,
        arc: 0.7,
        paint: (ctx, p, _a, k) => {
          ctx.translate(p.x, p.y);
          ctx.globalAlpha = 1 - k * k * 0.6;
          ctx.fillStyle = '#140a06';
          ctx.beginPath();
          ctx.arc(0, 0, sz, 0, TAU);
          ctx.fill();
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = '#ff7a1a';
          flameTongue(ctx, 0, sz * 0.6, sz * 0.8, sz * 3, 0);
        },
      });
    }
    // a tall column of fire with a crescent-shaped crown
    fx.layer('front', 1.0, (ctx, k) => {
      ctx.globalCompositeOperation = 'lighter';
      const e = 1 - (1 - k) * (1 - k);
      const fade = k < 0.55 ? 1 : (1 - k) / 0.45;
      for (let i = 0; i < 5; i++) {
        const sx = (i - 2) * 0.3;
        const h = (1.9 - Math.abs(i - 2) * 0.45) * (0.3 + 0.9 * e);
        ctx.globalAlpha = fade * 0.8;
        ctx.fillStyle = '#ff5a14';
        flameTongue(ctx, at.x + sx, Math.max(0.05, at.y - 0.55), 0.2, h, Math.sin(k * 18 + i) * 0.12);
        ctx.globalAlpha = fade * 0.9;
        ctx.fillStyle = '#ffd02a';
        flameTongue(ctx, at.x + sx, Math.max(0.05, at.y - 0.55), 0.09, h * 0.55, Math.sin(k * 18 + i) * 0.06);
      }
      fillCrescent(ctx, at.x, at.y + 1.0 + 0.8 * e, 0.8, Math.PI / 2, '#ffd02a', fade * 0.6);
    });
    fx.ember(at, { n: 18 });
    fx.smoke(at, { n: 8, size: 0.35, rise: 1.0, color: '#1a1412' });
    fx.word({ x: at.x, y: at.y + 1.4 }, 'BURN!', { color: '#ffd02a', size: 0.8, life: 1.1, rot: -0.08 });
    fx.flash('#ffd7a0', 0.45, 0.2);
    fx.shake(0.22, 0.9);
    fx.wash('#ff5a14', 0.28, 0.8);
    if (o === 'hit') {
      fx.punch(at, 1.14, 0.55);
      // flaming pitch clings and drips down the plates
      fx.layer('front', 2.0, (ctx, k) => {
        const a = c.defender.anchors();
        const t = k * 2.0;
        ctx.globalCompositeOperation = 'lighter';
        const fade = k < 0.7 ? 1 : (1 - k) / 0.3;
        for (let i = 0; i < 9; i++) {
          const bx = a.chest.x + (((i * 5) % 7) - 3) * 0.1;
          const start = a.chest.y + 0.65 - (i % 3) * 0.25;
          const u = (t * 0.7 + i * 0.13) % 1;
          const yy = Math.max(0.03, start - u * (start - 0.05));
          ctx.globalAlpha = fade * (0.9 - u * 0.4);
          ctx.fillStyle = '#ff7a1a';
          ctx.beginPath();
          ctx.arc(bx, yy, 0.055, 0, TAU);
          ctx.fill();
          ctx.fillStyle = '#ffd02a';
          flameTongue(ctx, bx, yy + 0.02, 0.05, 0.18 + 0.05 * Math.sin(t * 20 + i), 0);
        }
        // burning crown on the shoulders
        for (let i = 0; i < 4; i++) {
          const w = Math.sin(t * 16 + i * 1.7);
          ctx.globalAlpha = fade * 0.8;
          ctx.fillStyle = '#ff5a14';
          flameTongue(ctx, a.chest.x + (i - 1.5) * 0.2, a.chest.y + 0.5, 0.11, 0.45 + 0.15 * w, w * 0.07);
        }
      });
    } else if (o === 'block') {
      guardCrack(c, '#ff7a1a', '#ffd02a');
    }
  },
  follow: (c) => {
    const fx = eng(c);
    if (c.t < c.impact + 1.0 && (Math.floor(c.t * 60) % 5) === 0) {
      const d = c.defender.anchors();
      fx.ember({ x: d.chest.x + (fx.rand() - 0.5) * 0.7, y: d.chest.y + fx.rand() * 0.6 }, { n: 1 });
      if ((Math.floor(c.t * 60) % 10) === 0) fx.smoke({ x: d.chest.x, y: d.chest.y + 0.6 }, { n: 1, size: 0.25, rise: 0.7, color: '#1a1412' });
    }
  },
  finish: (c) => {
    const p = hitPoint(c);
    eng(c).layer('front', 1.4, (ctx, k) => {
      ctx.globalCompositeOperation = 'lighter';
      const e = 1 - (1 - k) * (1 - k);
      ctx.globalAlpha = (1 - k) * 0.85;
      ctx.fillStyle = '#ff5a14';
      for (let i = 0; i < 7; i++) flameTongue(ctx, p.x + (i - 3) * 0.3, 0.05, 0.22, 1.8 * e - Math.abs(i - 3) * 0.2, Math.sin(k * 16 + i) * 0.12);
      strokeTughra(ctx, p.x, p.y + 1.2, 1.5, Math.min(1, k * 2), '#ffd02a', (1 - k) * 0.8);
    });
  },
};

export const OTTOMAN_SCRIPTS: AttackScripts = {
  'ottoman-crescent-slash': crescentSlash,
  'ottoman-janissary-oath': janissaryOath,
  'ottoman-twin-moons': twinMoons,
  'ottoman-sultans-edge': sultansEdge,
  'ottoman-steady-volley': steadyVolley,
  'ottoman-rolling-fire': rollingFire,
  'ottoman-orta-marksman': ortaMarksman,
  'ottoman-sipahi-charge': sipahiCharge,
  'ottoman-lance-feint': lanceFeint,
  'ottoman-thunder-of-hooves': thunderOfHooves,
  'ottoman-fire-pot': firePot,
  'ottoman-smoke-and-iron': smokeAndIron,
  'ottoman-burning-pitch': burningPitch,
};
