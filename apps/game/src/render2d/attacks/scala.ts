/**
 * Scala armatura machines: brass, steam, pistons, pressure, cannon fire.
 * Six attack scripts; each has its own mechanism and signature burst.
 */
import { withVariants } from './variants';
import type { Key, Move } from '../../render/duelMoves';
import type { AttackScript, AttackScripts, FxContext, V2 } from '../contract';
import { eng, face, hitPoint, outcomeOf } from './styleDefaults';

const TAU = Math.PI * 2;
const BRASS = '#d9a441';
const STEAM = '#eef3f4';
const IRON = '#3b3f46';

const dirAng = (c: FxContext) => (c.dir === 1 ? 0 : Math.PI);

function retime(base: Move, map: (t: number) => number): Move {
  return {
    ...base,
    keys: base.keys.map((k) => ({ t: map(k.t), p: k.p })),
    impact: map(base.impact),
    trail: base.trail ? [map(base.trail[0]), map(base.trail[1])] : null,
    dust: base.dust.map(map),
  };
}
function withKeys(base: Move, extra: readonly Key[], impact = base.impact): Move {
  return { ...base, keys: [...base.keys, ...extra].sort((a, b) => a.t - b.t), impact };
}

function steamPuff(c: FxContext, at: V2, n = 3, size = 0.16, rise = 0.6): void {
  eng(c).smoke(at, { n, size, rise, color: STEAM });
}

function whiffWord(c: FxContext, text: string, color: string): void {
  const at = c.defender.anchors().chest;
  eng(c).word({ x: at.x - c.dir * 0.3, y: at.y + 0.75 }, text, { color, size: 0.42, life: 0.6 });
}

/** A toothed brass cog (flying scrap). */
function cog(ctx: CanvasRenderingContext2D, r: number, teeth: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * TAU;
    const rr = i % 2 ? r * 0.78 : r;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = IRON;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.3, 0, TAU);
  ctx.fill();
}

function flyingCogs(c: FxContext, at: V2, n: number): void {
  const fx = eng(c);
  for (let i = 0; i < n; i++) {
    const side = fx.rand() < 0.5 ? -1 : 1;
    const r = 0.08 + fx.rand() * 0.07;
    const spin = (fx.rand() - 0.5) * 24;
    const teeth = 6 + (i % 3) * 2;
    fx.sprite({
      from: at,
      to: { x: at.x + side * (0.6 + fx.rand() * 1.6), y: 0.06 },
      life: 0.6 + fx.rand() * 0.3,
      arc: 0.8 + fx.rand() * 0.9,
      paint: (ctx, p, _a, k) => {
        ctx.translate(p.x, p.y);
        ctx.rotate(k * spin);
        ctx.globalAlpha = 1 - k * k * 0.7;
        cog(ctx, r, teeth, i % 2 ? BRASS : '#b5832f');
      },
    });
  }
}

/** A round pressure gauge with a needle (0..1) that can shake. */
function gauge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  v: number,
  shake: number,
): void {
  ctx.save();
  ctx.translate(x + Math.sin(v * 90) * shake, y);
  ctx.fillStyle = BRASS;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f5efdc';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.82, 0, TAU);
  ctx.fill();
  // red zone
  ctx.strokeStyle = '#d6322e';
  ctx.lineWidth = r * 0.16;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.62, -0.1 * Math.PI, -0.62 * Math.PI, true);
  ctx.stroke();
  ctx.strokeStyle = '#24211e';
  ctx.lineWidth = r * 0.07;
  ctx.lineCap = 'round';
  const a = Math.PI * 1.15 - v * Math.PI * 1.3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7);
  ctx.stroke();
  ctx.fillStyle = '#24211e';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.1, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// ═════════════════════════════ scripts ═════════════════════════════

const pistonStrike: AttackScript = {
  palette: { main: STEAM, accent: BRASS, dark: '#3a2a14' },
  choreograph: (base) => {
    const w = base.keys[0]!;
    // Coil back like a spring, then the fist snaps out almost instantly.
    const m = retime(base, (t) => t * 0.92);
    return withKeys(m, [
      { t: w.t * 0.5, p: { ...w.p, x: -0.3, sL: 0.5, eL: 1.5, lean: 0.3 } },
      { t: m.impact - 0.04, p: { ...w.p, x: -0.35, sL: 0.4, eL: 1.6, lean: 0.35 } },
    ]);
  },
  start: (c) => eng(c).wash('#3a2a14', 0.12, 0.6),
  windup: (c) => {
    const fx = eng(c);
    const rig = c.attacker;
    if (fx.once('rod'))
      // The brass piston rod: compresses during the wind-up, then shoots out past the fist.
      fx.layer('front', c.impact + 0.3, (ctx, k) => {
        const a = rig.anchors();
        const imp = c.impact / (c.impact + 0.3);
        const ext =
          k < imp
            ? -0.12 * (k / imp)
            : 0.5 * Math.min(1, (k - imp) / 0.06) * (1 - ((k - imp) / (1 - imp)) * 0.6);
        const dx = a.offHand.x - a.chest.x;
        const dy = a.offHand.y - a.chest.y;
        const l = Math.hypot(dx, dy) || 1;
        ctx.lineCap = 'round';
        ctx.strokeStyle = IRON;
        ctx.lineWidth = 0.15;
        ctx.beginPath();
        ctx.moveTo(a.chest.x, a.chest.y);
        ctx.lineTo(a.offHand.x + (dx / l) * ext, a.offHand.y + (dy / l) * ext);
        ctx.stroke();
        ctx.strokeStyle = BRASS;
        ctx.lineWidth = 0.09;
        ctx.stroke();
        ctx.strokeStyle = '#ffeaa8';
        ctx.lineWidth = 0.025;
        ctx.stroke();
      });
    if (c.t > 0.1 && c.t < c.impact - 0.05 && (Math.floor(c.t * 20) & 1) === 0) {
      const a = c.attacker.anchors();
      steamPuff(c, { x: a.chest.x - c.dir * 0.15, y: a.chest.y + 0.3 }, 1, 0.1, 0.5);
    }
    if (c.t >= c.impact - 0.1 && fx.once('hiss')) {
      const a = c.attacker.anchors();
      steamPuff(c, { x: a.chest.x - c.dir * 0.2, y: a.chest.y + 0.2 }, 4, 0.18, 0.5);
      fx.word({ x: a.chest.x - c.dir * 0.5, y: a.head.y + 0.5 }, 'PSSST', {
        color: STEAM,
        size: 0.32,
        life: 0.5,
      });
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const p = hitPoint(c);
    if (o === 'hit' || o === 'block') {
      // A crack star in the plate, a hard ring and a jet of steam venting out of the elbow.
      fx.layer('front', 0.5, (ctx, k) => {
        ctx.globalAlpha = 1 - k * k;
        ctx.strokeStyle = '#24211e';
        ctx.lineWidth = 0.035;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i < 7; i++) {
          const a = i * 0.9 + 0.3;
          const l = (0.35 + (i % 3) * 0.12) * Math.min(1, k * 8);
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + Math.cos(a) * l, p.y + Math.sin(a) * l);
          ctx.lineTo(p.x + Math.cos(a + 0.35) * l * 1.3, p.y + Math.sin(a + 0.35) * l * 1.3);
        }
        ctx.stroke();
      });
      fx.ring(p, { color: STEAM, radius: 1.3, life: 0.35, width: 0.16 });
      fx.burst(p, { n: 10, color: BRASS, length: 1.1, life: 0.3 });
      fx.spark(p, { n: 14, color: '#ffd37a', speed: 8, dir: face(0.4, c.dir), spread: 2.2 });
      const a = c.attacker.anchors();
      steamPuff(c, { x: a.chest.x - c.dir * 0.1, y: a.chest.y + 0.3 }, 6, 0.22, 0.8);
      fx.word({ x: p.x, y: p.y + 0.95 }, 'CHUNK!', { color: BRASS, size: 0.6, life: 0.8 });
      fx.speedLines({ dir: dirAng(c) + Math.PI, color: STEAM, life: 0.22, n: 14 });
      fx.punch(p, 1.12, 0.4);
    } else {
      steamPuff(c, { x: p.x - c.dir * 0.4, y: p.y }, 5, 0.2, 0.6);
      whiffWord(c, 'PSHHT', STEAM);
    }
  },
};

const steamHammer: AttackScript = {
  palette: { main: '#ffd8a0', accent: '#ff8a2a', dark: '#2a1a10' },
  choreograph: (base) => {
    const w = base.keys[0]!;
    const m = retime(base, (t) => t * 1.15);
    // Valves open: the arm hangs raised and trembling, then falls like a forge hammer.
    return withKeys(m, [
      { t: w.t * 1.15 + 0.07, p: { ...w.p, y: (w.p.y ?? 0) + 0.12, sR: 3.2 } },
      { t: w.t * 1.15 + 0.14, p: { ...w.p, y: (w.p.y ?? 0) + 0.15, sR: 3.25 } },
    ]);
  },
  start: (c) => {
    const fx = eng(c);
    fx.wash('#2a1a10', 0.22, c.impact);
    const rig = c.attacker;
    // Hot glow runs up the arm as the pressure builds.
    fx.layer('front', c.impact + 0.05, (ctx, k) => {
      const a = rig.anchors();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#ff7a1a';
      ctx.globalAlpha = k * (0.6 + 0.3 * Math.sin(k * 70));
      ctx.lineWidth = 0.18;
      ctx.beginPath();
      ctx.moveTo(a.hand.x, a.hand.y);
      ctx.lineTo(a.tip.x, a.tip.y);
      ctx.stroke();
    });
  },
  windup: (c) => {
    const fx = eng(c);
    const a = c.attacker.anchors();
    if (c.t > 0.1 && c.t < c.impact && (Math.floor(c.t * 30) & 1) === 0) {
      steamPuff(c, { x: a.chest.x - c.dir * 0.1, y: a.chest.y + 0.5 }, 1, 0.14, 1.1);
      steamPuff(c, { x: a.hand.x, y: a.hand.y + 0.1 }, 1, 0.11, 0.9);
    }
    if (c.t >= c.impact - 0.4 && fx.once('rumble')) {
      fx.word({ x: a.chest.x - c.dir * 0.4, y: a.head.y + 0.8 }, 'HISSS', {
        color: STEAM,
        size: 0.4,
        life: 0.7,
      });
      fx.shake(0.04, 0.97);
    }
    if (c.t >= c.impact - 0.2 && fx.once('smear'))
      fx.arc(
        { x: a.chest.x + c.dir * 0.3, y: a.chest.y + 0.5 },
        {
          radius: 1.4,
          from: face(3.0, c.dir),
          to: face(-0.1, c.dir),
          width: 0.8,
          color: '#ff8a2a',
          life: 0.3,
        },
      );
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const p = hitPoint(c);
    const f = c.defender.anchors().feet;
    const g = { x: f.x - c.dir * 0.3, y: 0.03 };
    // Anvil strike: ground quake, forge sparks showering and a flung cog or two.
    fx.ring(g, { color: '#ffb35a', radius: 3.0, life: 0.6, width: 0.15, flat: 0.22 });
    fx.ring(g, { color: STEAM, radius: 1.8, life: 0.45, width: 0.1, flat: 0.22 });
    fx.dust(g, { n: 16, size: 0.26 });
    fx.shake(0.2, 0.9);
    if (o === 'hit' || o === 'block') {
      fx.glow(p, { radius: 2.0, color: '#ff8a2a', life: 0.4 });
      fx.burst(p, { n: 14, color: '#ffd8a0', length: 1.5, life: 0.35 });
      fx.spark(p, { n: 34, color: '#ffa23a', speed: 11, dir: Math.PI / 2, spread: 3.4 });
      fx.ember(p, { n: 12 });
      flyingCogs(c, p, 5);
      for (let i = 0; i < 3; i++)
        steamPuff(c, { x: p.x + (i - 1) * 0.35, y: p.y - 0.2 }, 3, 0.25, 1.0);
      fx.word({ x: p.x, y: p.y + 1.1 }, 'CLANG!', {
        color: '#ffb35a',
        size: 0.78,
        life: 1.0,
        rot: -0.07,
      });
      fx.punch(p, 1.2, 0.5);
      fx.wash('#ff8a2a', 0.22, 0.4);
    } else {
      fx.spark(
        { x: g.x, y: 0.05 },
        { n: 16, color: '#ffa23a', speed: 7, dir: Math.PI / 2, spread: 2.4 },
      );
      whiffWord(c, 'THUD!', '#ffd8a0');
    }
  },
  finish: (c) => {
    const p = hitPoint(c);
    const fx = eng(c);
    fx.later(0.1, () => {
      for (let i = 0; i < 5; i++) steamPuff(c, { x: p.x + (i - 2) * 0.3, y: 0.3 }, 3, 0.3, 1.3);
      flyingCogs(c, { x: p.x, y: p.y + 0.3 }, 4);
    });
  },
};

const overpressure: AttackScript = {
  palette: { main: '#fff0d0', accent: '#e8392e', dark: '#2a0e0a' },
  choreograph: (base) => {
    const w = base.keys[0]!;
    // The machine hunches and shudders while pressure climbs, then lunges with everything.
    const m = retime(base, (t) => (t < w.t ? t * 1.5 : t * 1.5 + 0.1));
    const hw = w.t * 1.5;
    return withKeys(m, [
      { t: hw * 0.4, p: { ...w.p, x: -0.1, lean: 0.25, y: -0.1 } },
      { t: hw * 0.7, p: { ...w.p, x: -0.14, lean: 0.3, y: -0.12 } },
      { t: hw + 0.05, p: { ...w.p, x: -0.1, lean: 0.28, y: -0.1 } },
    ]);
  },
  start: (c) => {
    const fx = eng(c);
    fx.wash('#2a0e0a', 0.3, c.impact);
    const rig = c.attacker;
    // A pressure gauge hangs over the machine, needle climbing into the red.
    fx.layer('front', c.impact - 0.05, (ctx, k) => {
      const h = rig.anchors().head;
      const e = Math.min(1, k * 4);
      ctx.globalAlpha = e;
      gauge(ctx, h.x, h.y + 0.75, 0.38 * (0.6 + 0.4 * e), Math.min(1, k * 1.05), 0.025 * k);
      if (k > 0.7) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = (k - 0.7) * 1.4 * (0.6 + 0.4 * Math.sin(k * 90));
        ctx.fillStyle = '#ff3020';
        ctx.beginPath();
        ctx.arc(h.x, h.y + 0.75, 0.5, 0, TAU);
        ctx.fill();
      }
    });
  },
  windup: (c) => {
    const fx = eng(c);
    const a = c.attacker.anchors();
    const k = Math.min(1, c.t / c.impact);
    if (c.t > 0.1 && (Math.floor(c.t * 40) & 1) === 0) {
      steamPuff(
        c,
        { x: a.chest.x - c.dir * 0.2, y: a.chest.y + 0.5 },
        1 + Math.floor(k * 2),
        0.12,
        0.9,
      );
      if (k > 0.5)
        fx.spark(
          { x: a.chest.x, y: a.chest.y + 0.2 },
          { n: 1, color: '#ffb347', speed: 3, size: 0.03 },
        );
    }
    if (k > 0.35) fx.shake(0.015 + 0.04 * k, 0.9);
    if (k > 0.8 && fx.once('red'))
      fx.word({ x: a.chest.x - c.dir * 0.5, y: a.head.y + 1.3 }, 'SSSSS!', {
        color: '#ff8a7a',
        size: 0.45,
        life: 0.5,
      });
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const p = hitPoint(c);
    const a = c.attacker.anchors();
    const h = a.head;
    // The gauge bursts: glass and brass flying, steam blasting from every vent.
    fx.spark({ x: h.x, y: h.y + 0.75 }, { n: 16, color: '#ffe9c0', speed: 6, size: 0.04 });
    flyingCogs(c, { x: h.x, y: h.y + 0.75 }, 3);
    fx.ring({ x: h.x, y: h.y + 0.75 }, { color: STEAM, radius: 1.2, life: 0.4, width: 0.12 });
    for (let i = 0; i < 3; i++)
      fx.smoke(
        { x: a.chest.x - c.dir * (0.2 + i * 0.1), y: a.chest.y + 0.2 + i * 0.3 },
        { n: 4, size: 0.3, rise: 0.4, color: STEAM },
      );
    fx.layer('front', 0.35, (ctx, k) => {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (1 - k) * 0.85;
      const x0 = a.hand.x;
      const l = 1.2 + 3 * Math.min(1, k * 4);
      ctx.fillStyle = STEAM;
      ctx.beginPath();
      ctx.moveTo(x0, a.hand.y);
      ctx.lineTo(x0 + c.dir * l, a.hand.y + 0.5 * (0.4 + k));
      ctx.lineTo(x0 + c.dir * l, a.hand.y - 0.5 * (0.4 + k));
      ctx.fill();
    });
    fx.flash('#fff0d0', 0.45, 0.2);
    fx.shake(0.3, 0.9);
    if (o === 'hit' || o === 'block') {
      fx.glow(p, { radius: 3.0, color: '#ff5a2a', life: 0.5 });
      fx.burst(p, { n: 16, color: '#ff5a2a', length: 2.0, life: 0.42 });
      fx.ring(p, { color: '#ffd0a0', radius: 3.2, life: 0.55, width: 0.18 });
      fx.ring(p, { color: '#e8392e', radius: 2.0, life: 0.4, width: 0.12 });
      fx.spark(p, { n: 32, color: '#ffb347', speed: 11 });
      fx.word({ x: p.x, y: p.y + 1.5 }, 'BOOM!', {
        color: '#e8392e',
        size: 0.95,
        life: 1.1,
        rot: -0.1,
      });
      fx.speedLines({ color: '#ffffff', life: 0.4, n: 40 });
      fx.punch(p, 1.28, 0.6);
      fx.wash('#e8392e', 0.24, 0.6);
      fx.impactFrame(0.05);
    } else {
      fx.ring({ x: p.x, y: 0.2 }, { color: '#ffd0a0', radius: 2.0, life: 0.5, width: 0.1 });
      whiffWord(c, 'PSSHHH!', STEAM);
    }
  },
  finish: (c) => {
    const p = hitPoint(c);
    const fx = eng(c);
    fx.later(0.15, () => {
      fx.ring({ x: p.x, y: p.y }, { color: '#ffd0a0', radius: 3.6, life: 0.7, width: 0.16 });
      for (let i = 0; i < 6; i++) steamPuff(c, { x: p.x + (i - 3) * 0.3, y: 0.3 }, 3, 0.35, 1.4);
    });
  },
};

/** The shared two-shot volley timing for the cannons. */
function twoShots(base: Move, gap: number): Move {
  const fire = base.impact - 0.12;
  const recoil = base.keys[2]?.p ?? {};
  const rest = base.keys[3]?.p ?? {};
  const keys = [
    ...base.keys.slice(0, 2),
    { t: fire + 0.05, p: recoil },
    { t: fire + gap - 0.03, p: rest },
    { t: fire + gap + 0.04, p: recoil },
    { t: fire + gap + 0.5, p: rest },
    { t: fire + gap + 0.9, p: {} },
  ];
  return { ...base, keys, impact: fire + gap + 0.04 };
}

/** A fan of pellets from the muzzle towards the target. */
function pelletFan(c: FxContext, n: number, life: number): void {
  const fx = eng(c);
  const m = c.attacker.anchors().tip;
  const d = c.defender.anchors().chest;
  for (let i = 0; i < n; i++) {
    const spread = (i / (n - 1) - 0.5) * 1.5;
    const reach = Math.abs(d.x - m.x);
    const to: V2 =
      c.hit || c.reaction === 'defend'
        ? { x: d.x - c.dir * 0.1, y: d.y + spread * 0.9 }
        : { x: m.x + c.dir * (reach + 1.2), y: d.y + spread * 1.2 };
    fx.sprite({
      from: { x: m.x, y: m.y },
      to,
      life: life * (0.9 + fx.rand() * 0.2),
      trail: '#ffd37a',
      paint: (ctx, p) => {
        ctx.translate(p.x, p.y);
        ctx.fillStyle = '#2a2a2e';
        ctx.beginPath();
        ctx.arc(0, 0, 0.055, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(-0.015, 0.015, 0.02, 0, TAU);
        ctx.fill();
      },
    });
  }
}

function muzzleSteam(c: FxContext, size: number): V2 {
  const fx = eng(c);
  const m = c.attacker.anchors().tip;
  const at = { x: m.x, y: m.y };
  fx.glow(at, { radius: 0.9 * size, color: '#ffd37a', life: 0.14 });
  fx.burst(at, { n: 8, color: '#ffe9a0', length: 0.6 * size, life: 0.16 });
  fx.spark(at, { n: 10, color: BRASS, speed: 8, dir: dirAng(c), spread: 0.9 });
  steamPuff(c, at, 4, 0.16 * size, 0.5);
  return at;
}

const grapeshot: AttackScript = {
  palette: { main: '#ffe9b0', accent: '#d98a2a', dark: '#2a2018' },
  choreograph: (base) => twoShots(base, 0.24),
  start: (c) => {
    const fx = eng(c);
    fx.wash('#2a2018', 0.12, 0.7);
    const rig = c.attacker;
    // A fan of aim ticks over the target: the gun is loaded with a handful of grape.
    fx.layer('front', c.impact - 0.2, (ctx, k) => {
      const m = rig.anchors().tip;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, k * 3) * 0.55;
      ctx.strokeStyle = '#ffd37a';
      ctx.lineWidth = 0.02;
      ctx.setLineDash([0.06, 0.08]);
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x + c.dir * 2.4, m.y + i * 0.3 * k);
        ctx.stroke();
      }
    });
  },
  windup: (c) => {
    const fx = eng(c);
    const shot1 = c.impact - 0.24;
    if (c.t >= shot1 && fx.once('s1')) {
      muzzleSteam(c, 1);
      pelletFan(c, 7, 0.14);
      fx.word(
        { x: c.attacker.anchors().tip.x + c.dir * 0.5, y: c.attacker.anchors().tip.y + 0.55 },
        'POP!',
        { color: BRASS, size: 0.4, life: 0.5 },
      );
      fx.shake(0.06, 0.85);
      if (c.hit) {
        c.defender.flash = 0.5;
        const d = c.defender.anchors().chest;
        for (let i = 0; i < 5; i++)
          fx.later(0.1 + i * 0.012, () =>
            fx.spark(
              { x: d.x - c.dir * 0.1, y: d.y + (i - 2) * 0.32 },
              { n: 3, color: '#ffd37a', speed: 5, dir: face(0.5, c.dir), spread: 2 },
            ),
          );
      }
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    muzzleSteam(c, 1.3);
    pelletFan(c, 9, 0.12);
    const d = c.defender.anchors().chest;
    const base = { x: d.x - c.dir * 0.1, y: d.y };
    fx.later(0.12, () => {
      if (o === 'hit' || o === 'block') {
        for (let i = 0; i < 7; i++) {
          const q = { x: base.x + (fx.rand() - 0.5) * 0.3, y: base.y + (i - 3) * 0.26 };
          fx.later(i * 0.01, () => {
            fx.spark(q, { n: 4, color: '#ffd37a', speed: 6, dir: face(0.4, c.dir), spread: 2.4 });
            fx.burst(q, { n: 5, color: '#ffe9b0', length: 0.4, life: 0.18 });
          });
        }
        fx.glow(base, { radius: 1.5, color: '#ffd37a', life: 0.3 });
        fx.word({ x: base.x, y: base.y + 0.95 }, 'RATTA!', {
          color: '#ffd37a',
          size: 0.6,
          life: 0.8,
        });
      } else {
        const f = c.defender.anchors().feet;
        for (let i = 0; i < 5; i++)
          fx.spark(
            { x: f.x + c.dir * (0.4 + i * 0.35), y: 0.04 },
            { n: 4, color: '#e8d4a0', speed: 4, dir: Math.PI / 2, spread: 1.4 },
          );
        fx.dust({ x: f.x + c.dir * 1.0, y: 0 }, { n: 8 });
        whiffWord(c, 'PING!', '#e8f0f4');
      }
    });
    fx.shake(0.1, 0.85);
    fx.speedLines({ dir: dirAng(c) + Math.PI, color: '#ffe9b0', life: 0.2, n: 12 });
  },
};

const siegeBolt: AttackScript = {
  palette: { main: '#e6f0f8', accent: '#9ab4cc', dark: '#1c2a38' },
  start: (c) => {
    const fx = eng(c);
    fx.wash('#1c2a38', 0.2, c.impact);
    const rig = c.attacker;
    const def = c.defender;
    // Steam pressure ring tightens at the launcher while a dotted targeting line locks on.
    fx.layer('front', c.impact - 0.1, (ctx, k) => {
      const m = rig.anchors().tip;
      const d = def.anchors().chest;
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 0.04;
      ctx.strokeStyle = '#9ab4cc';
      ctx.globalAlpha = k * 0.9;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 0.6 - 0.4 * k, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(m.x, m.y, 0.9 - 0.65 * k, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([0.07, 0.07]);
      ctx.strokeStyle = '#ff5a4a';
      ctx.globalAlpha = Math.max(0, k - 0.3) * 1.2;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(d.x, d.y);
      ctx.stroke();
      ctx.setLineDash([]);
      // target reticle
      ctx.strokeStyle = '#ff5a4a';
      const r = 0.3 * (1.6 - 0.6 * k);
      ctx.beginPath();
      ctx.arc(d.x, d.y, r, 0, TAU);
      ctx.moveTo(d.x - r * 1.4, d.y);
      ctx.lineTo(d.x + r * 1.4, d.y);
      ctx.moveTo(d.x, d.y - r * 1.4);
      ctx.lineTo(d.x, d.y + r * 1.4);
      ctx.stroke();
    });
  },
  windup: (c) => {
    const fx = eng(c);
    const m = c.attacker.anchors().tip;
    if (c.t > 0.15 && (Math.floor(c.t * 24) & 1) === 0 && c.t < c.impact - 0.1)
      steamPuff(c, { x: m.x - c.dir * 0.3, y: m.y + 0.1 }, 1, 0.1, 0.5);
    if (c.t >= c.impact - 0.12 && fx.once('fire')) {
      const from = { x: m.x, y: m.y };
      const d = c.defender.anchors().chest;
      const ok = c.hit || c.reaction === 'defend';
      const to: V2 = ok
        ? { x: d.x - c.dir * 0.12, y: d.y }
        : { x: d.x + c.dir * 2.6, y: d.y + 0.3 };
      fx.glow(from, { radius: 1.2, color: '#e6f0f8', life: 0.18 });
      steamPuff(c, from, 7, 0.22, 0.4);
      fx.ring(from, { color: '#e6f0f8', radius: 1.1, life: 0.3, width: 0.1 });
      fx.word({ x: from.x + c.dir * 0.6, y: from.y + 0.6 }, 'THWANG!', {
        color: '#e6f0f8',
        size: 0.45,
        life: 0.5,
      });
      fx.speedLines({ dir: dirAng(c) + Math.PI, color: '#e6f0f8', life: 0.2, n: 10 });
      fx.sprite({
        from,
        to,
        life: 0.12,
        trail: '#e6f0f8',
        paint: (ctx, p, ang) => {
          ctx.translate(p.x, p.y);
          ctx.rotate(ang);
          ctx.fillStyle = '#6a7684';
          ctx.fillRect(-0.4, -0.035, 0.6, 0.07);
          ctx.fillStyle = '#c9d6e2';
          ctx.beginPath();
          ctx.moveTo(0.2, -0.07);
          ctx.lineTo(0.42, 0);
          ctx.lineTo(0.2, 0.07);
          ctx.fill();
          ctx.fillStyle = '#d02a32';
          ctx.fillRect(-0.4, -0.06, 0.1, 0.12);
        },
      });
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    const p = hitPoint(c);
    if (o === 'hit') {
      // The bolt punches through armour: a flash, a pinned shaft, and spray out of the back.
      const out = { x: p.x + c.dir * 0.6, y: p.y };
      fx.glow(p, { radius: 1.4, color: '#e6f0f8', life: 0.3 });
      fx.burst(p, { n: 10, color: '#c9d6e2', length: 1.2, life: 0.3 });
      fx.ring(p, { color: '#9ab4cc', radius: 1.5, life: 0.4, width: 0.12 });
      fx.layer('front', 0.7, (ctx, k) => {
        ctx.globalAlpha = k < 0.7 ? 1 : (1 - k) / 0.3;
        ctx.fillStyle = '#6a7684';
        ctx.fillRect(Math.min(p.x - c.dir * 0.45, p.x + c.dir * 0.4), p.y - 0.035, 0.85, 0.07);
        ctx.fillStyle = '#d02a32';
        ctx.fillRect(p.x - c.dir * 0.45 - (c.dir === 1 ? 0 : 0.0), p.y - 0.06, 0.1, 0.12);
      });
      fx.spark(out, { n: 16, color: '#e6f0f8', speed: 9, dir: face(0.1, c.dir), spread: 1.0 });
      fx.burst(out, { n: 7, color: '#c9d6e2', length: 0.8, life: 0.24 });
      fx.word({ x: p.x, y: p.y + 1.35 }, 'PIERCED!', { color: '#e6f0f8', size: 0.5, life: 0.8 });
      fx.punch(p, 1.15, 0.4);
    } else if (o === 'block') {
      fx.spark(p, { n: 12, color: '#e6f0f8', speed: 8, dir: Math.PI / 2, spread: 2.6 });
      fx.word({ x: p.x, y: p.y + 0.9 }, 'KLANG!', { color: '#e6f0f8', size: 0.45, life: 0.6 });
    } else {
      const f = c.defender.anchors().feet;
      const g = { x: f.x + c.dir * 2.6, y: 0.1 };
      fx.spark(g, { n: 10, color: '#e6f0f8', speed: 6, dir: Math.PI / 2, spread: 1.6 });
      fx.dust(g, { n: 8 });
      whiffWord(c, 'ZIP!', '#e6f0f8');
    }
  },
};

const BROAD_GUNS: readonly (readonly [number, number])[] = [
  [-0.55, 1.35],
  [-0.2, 0.55],
  [-0.75, 0.85],
  [0.25, 1.6],
  [-0.4, 1.85],
];

function broadsideVolley(c: FxContext, n: number, big: boolean): void {
  const fx = eng(c);
  const a = c.attacker.anchors();
  const d = c.defender.anchors().chest;
  const ok = c.hit || c.reaction === 'defend';
  for (let i = 0; i < n; i++) {
    const g = BROAD_GUNS[i % BROAD_GUNS.length]!;
    const at = { x: a.chest.x + c.dir * (g[0] + 0.5), y: g[1] };
    fx.later(i * 0.02, () => {
      fx.glow(at, { radius: 0.8, color: '#ffd37a', life: 0.14 });
      fx.burst(at, { n: 6, color: '#ffe9a0', length: 0.5, life: 0.14 });
      fx.smoke(at, { n: big ? 4 : 2, size: 0.28, rise: 0.3, color: '#bdb8b0' });
      fx.spark(at, { n: 6, color: BRASS, speed: 8, dir: dirAng(c), spread: 0.7 });
    });
    if (i < 3)
      fx.sprite({
        from: at,
        to: ok
          ? { x: d.x - c.dir * 0.15, y: d.y + (i - 1) * 0.4 }
          : { x: d.x + c.dir * 2.4, y: 0.2 + i * 0.3 },
        life: 0.13 + i * 0.02,
        trail: '#ffd37a',
        paint: (ctx, p) => {
          ctx.translate(p.x, p.y);
          ctx.fillStyle = '#1f1f24';
          ctx.beginPath();
          ctx.arc(0, 0, 0.1, 0, TAU);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.beginPath();
          ctx.arc(-0.03, 0.03, 0.035, 0, TAU);
          ctx.fill();
        },
      });
  }
}

const broadside: AttackScript = {
  palette: { main: '#ffe3a0', accent: '#f0902a', dark: '#2a1c10' },
  choreograph: (base) => twoShots(base, 0.3),
  start: (c) => eng(c).wash('#2a1c10', 0.22, c.impact + 0.2),
  windup: (c) => {
    const fx = eng(c);
    const shot1 = c.impact - 0.3;
    if (c.t >= shot1 - 0.25 && fx.once('ready')) {
      const a = c.attacker.anchors();
      // The gun ports swing open along the hull (little brass hatches glinting).
      fx.layer('front', 0.25, (ctx, k) => {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = k;
        ctx.fillStyle = '#ffd37a';
        for (let i = 0; i < BROAD_GUNS.length; i++) {
          const g = BROAD_GUNS[i]!;
          ctx.beginPath();
          ctx.arc(a.chest.x + c.dir * (g[0] + 0.5), g[1], 0.07, 0, TAU);
          ctx.fill();
        }
      });
    }
    if (c.t >= shot1 && fx.once('s1')) {
      broadsideVolley(c, 3, false);
      fx.shake(0.12, 0.88);
      fx.word({ x: c.attacker.anchors().chest.x + c.dir * 0.2, y: 2.4 }, 'BOOM!', {
        color: '#f0902a',
        size: 0.5,
        life: 0.6,
      });
      if (c.hit) c.defender.flash = 0.5;
    }
  },
  impactFx: (c) => {
    const fx = eng(c);
    const o = outcomeOf(c);
    broadsideVolley(c, 5, true);
    const d = c.defender.anchors().chest;
    const p = { x: d.x - c.dir * 0.1, y: d.y };
    fx.shake(0.28, 0.9);
    fx.flash('#fff0c0', 0.35, 0.14);
    fx.speedLines({ dir: dirAng(c) + Math.PI, color: '#ffe3a0', life: 0.3, n: 24 });
    fx.later(0.13, () => {
      if (o === 'hit' || o === 'block') {
        for (let i = 0; i < 4; i++) {
          const q = { x: p.x + (fx.rand() - 0.5) * 0.4, y: p.y + (i - 1.5) * 0.45 };
          fx.later(i * 0.025, () => {
            fx.glow(q, { radius: 1.0, color: '#ffb347', life: 0.3 });
            fx.burst(q, { n: 8, color: '#ffe3a0', length: 0.9, life: 0.26 });
            fx.spark(q, { n: 10, color: '#ffa23a', speed: 8 });
          });
        }
        fx.ring(p, { color: '#ffd37a', radius: 2.6, life: 0.5, width: 0.14 });
        fx.smoke(p, { n: 6, size: 0.34, rise: 0.7, color: '#4a4540' });
        fx.word({ x: p.x, y: p.y + 1.4 }, 'BROADSIDE!', {
          color: '#f0902a',
          size: 0.7,
          life: 1.0,
          rot: -0.07,
        });
        fx.punch(p, 1.2, 0.5);
        fx.wash('#f0902a', 0.3, 0.5);
      } else {
        const f = c.defender.anchors().feet;
        fx.ring(
          { x: f.x + c.dir * 2.0, y: 0.05 },
          { color: '#e8d4a0', radius: 2.2, life: 0.5, width: 0.1, flat: 0.22 },
        );
        fx.dust({ x: f.x + c.dir * 2.0, y: 0 }, { n: 14, size: 0.26 });
        fx.spark(
          { x: f.x + c.dir * 2.0, y: 0.1 },
          { n: 16, color: '#ffb347', speed: 8, dir: Math.PI / 2, spread: 2.2 },
        );
        whiffWord(c, 'SPLASH!', '#e8f0f4');
      }
    });
  },
  finish: (c) => {
    const d = c.defender.anchors().chest;
    const fx = eng(c);
    fx.later(0.2, () => {
      fx.glow(d, { radius: 3.2, color: '#ffb347', life: 0.6 });
      fx.ring(d, { color: '#ffd37a', radius: 3.6, life: 0.7, width: 0.16 });
      fx.smoke({ x: d.x, y: 0.4 }, { n: 8, size: 0.4, rise: 1.0, color: '#3a3632' });
      fx.impactFrame(0.07);
    });
  },
};

const SCALA_BASE: AttackScripts = {
  'scala-piston-strike': pistonStrike,
  'scala-steam-hammer': steamHammer,
  'scala-overpressure': overpressure,
  'scala-grapeshot': grapeshot,
  'scala-siege-bolt': siegeBolt,
  'scala-broadside': broadside,
};

/** The newer techniques borrow a related script, in their own accent colour. */
export const SCALA_SCRIPTS: AttackScripts = withVariants(SCALA_BASE, {
  'scala-valve-release': ['scala-steam-hammer', '#f0f4f8'],
  'scala-governor-slam': ['scala-piston-strike', '#ffd080'],
  'scala-rivet-shot': ['scala-siege-bolt', '#e0e8f0'],
  'scala-chain-shot': ['scala-grapeshot', '#c0c8d0'],
});
