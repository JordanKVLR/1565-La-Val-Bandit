import {
  Frame,
  K,
  RS,
  Shape,
  flag,
  flat,
  glint,
  glow,
  inkR,
  inkU,
  mkPath,
  paint,
  rivetPath,
  rivets,
  seam,
  streak,
} from './kit';
import type { Ctx } from './kit';
import { mats } from './machine';
import type { F } from './types';

/**
 * The Scala machines' weapons, in the same family as the hulls: gunmetal and brass, a copper
 * boiler on every steam weapon, glowing vents and hissing steam. Weapon space like weapons.ts: the
 * origin is the gripping hand and +x runs along the weapon. Most are authored in the reference's
 * pixels with the hand at py = -24 and the weapon along +py (mapped by `weaponIn`); the spear is
 * authored in world units. The heavy class (colossus) carries the bigger variant of each weapon.
 */

/** Maps reference pixels (px across, py along the weapon, hand at py = -24) to weapon space. */
function weaponIn(ctx: Ctx): void {
  ctx.save();
  ctx.transform(0, RS, RS, 0, 24 * RS, 0);
}

/** Maps reference pixels with x along the weapon and y down (guns, bombs; hand at x = -24). */
function alongIn(ctx: Ctx): void {
  ctx.save();
  ctx.transform(RS, 0, 0, -RS, 24 * RS, 0);
}

function rr(x: number, y: number, w: number, h: number, r: number): string {
  return (
    `M ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} ` +
    `L ${x + w} ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} ` +
    `L ${x + r} ${y + h} Q ${x} ${y + h} ${x} ${y + h - r} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} Z`
  );
}

/** Weapon-space up (world up expressed in weapon space), for steam. */
const UPV = { x: 0, y: 1 };
function upDir(f: F): void {
  const r = f.wAng - Math.PI / 2;
  UPV.x = Math.sin(r);
  UPV.y = Math.cos(r);
}

/** A column of steam puffs rising from (x, y) in weapon units; `ex` is the stride's push. */
function vent(
  f: F,
  x: number,
  y: number,
  n: number,
  speed: number,
  size: number,
  ph0: number,
): void {
  const c = f.ctx;
  upDir(f);
  const ex = Math.min(1, Math.abs(f.drag) * 1.6);
  const cnt = K.lod === 0 ? Math.min(n, 2) : n;
  for (let i = 0; i < cnt; i++) {
    const ph = (f.t * (speed + ex * 0.8) + i / cnt + ph0) % 1;
    const d = 0.04 + ph * (0.26 + ex * 0.1);
    const r = size * (0.5 + ph * 1.4);
    glow(
      c,
      'steam',
      x + UPV.x * d - f.drag * 0.12 * ph,
      y + UPV.y * d + Math.sin(f.t * 3 + i * 2 + ph0) * 0.01,
      r,
      r,
      Math.min(1, (1 - ph) * 1.5) * 0.85,
    );
  }
}

// ── Shared grip and bands ─────────────────────────────────────

const GRIP = Shape.d(rr(-17, -72, 34, 106, 8));
const GRIP_WRAP = (() => {
  const p = mkPath();
  for (let i = 0; i < 5; i++) {
    p.moveTo(-9, -62 + i * 20);
    p.lineTo(9, -50 + i * 20);
  }
  return p;
})();
const GRIP_CAP = Shape.d(rr(-24, -88, 48, 20, 8), true);
const GRIP_COLLAR = Shape.d(rr(-26, 30, 52, 18, 7), true);

function grip(f: F): void {
  const c = f.ctx;
  const m = mats(f);
  paint(c, GRIP, m.leather, inkR(5));
  if (K.lod > 0) {
    c.lineWidth = inkR(2.5);
    c.strokeStyle = m.brass.at(0);
    c.stroke(GRIP_WRAP);
  }
  paint(c, GRIP_CAP, m.brass, inkR(4.5), true);
  paint(c, GRIP_COLLAR, m.brass, inkR(4.5), true);
}

function gauge(f: F, x: number, y: number, r: number, phase: number): void {
  const c = f.ctx;
  const m = mats(f);
  c.save();
  c.translate(x, y);
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fillStyle = m.white.at(0);
  c.fill();
  c.lineWidth = inkR(4);
  c.strokeStyle = m.brass.at(0);
  c.stroke();
  c.lineWidth = inkR(1.8);
  c.strokeStyle = '#0e1118';
  c.beginPath();
  c.arc(0, 0, r + inkR(2.4), 0, Math.PI * 2);
  c.stroke();
  if (K.lod > 0) {
    const a = -0.7 + Math.sin(f.t * 1.9 + phase) * 0.4 + Math.sin(f.t * 8 + phase) * 0.05;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(Math.sin(a) * r * 0.78, -Math.cos(a) * r * 0.78);
    c.lineWidth = inkR(3);
    c.strokeStyle = '#b01c24';
    c.stroke();
  }
  c.restore();
}

// ── Piston hammer (blunt) ─────────────────────────────────────

const HM_CYL = Shape.d(rr(-34, 36, 68, 250, 16));
const HM_CYL_HI = mkPath('M -22 52 L -22 272');
const HM_HOOPS = Shape.d([70, 150, 244].map((y) => rr(-39, y, 78, 16, 6)).join(' '), true);
const HM_ROD = Shape.d(rr(-13, 280, 26, 70, 5));
const HM_ROD_HI = mkPath('M -6 286 L -6 344');
const HM_HEAD = Shape.d(rr(-84, 336, 168, 104, 18));
const HM_HEAD_HI = mkPath('M -70 350 L -70 428');
const HM_FACE = Shape.d(rr(-86, 428, 172, 26, 9), true);
const HM_SLOTS = Shape.d(
  rr(-56, 366, 30, 8, 3) + rr(-56, 384, 30, 8, 3) + rr(-56, 402, 30, 8, 3),
  true,
);
const HM_RIVETS = rivetPath([-66, 352, 66, 352, -66, 420, 66, 420, 0, 440], 4.2);
const HM_STACK = Shape.d(rr(28, 56, 20, 46, 5), true);
const HM_STACK_RIM = Shape.d(rr(22, 44, 32, 16, 5), true);

// The colossus's steam hammer: a bigger, double-hooped ram with two stacks and a spiked face.
const SH_CYL = Shape.d(rr(-46, 30, 92, 280, 20));
const SH_CYL_HI = mkPath('M -32 50 L -32 296');
const SH_HOOPS = Shape.d([62, 132, 206, 276].map((y) => rr(-52, y, 104, 18, 7)).join(' '), true);
const SH_ROD = Shape.d(rr(-18, 304, 36, 54, 6));
const SH_HEAD = Shape.d(rr(-116, 346, 232, 112, 20));
const SH_HEAD_HI = mkPath('M -100 360 L -100 446');
const SH_FACE = Shape.d(rr(-120, 444, 240, 30, 10), true);
const SH_SPIKES = Shape.d(
  'M -96 474 L -80 502 L -64 474 Z M -40 474 L -24 502 L -8 474 Z M 16 474 L 32 502 L 48 474 Z M 72 474 L 88 502 L 104 474 Z',
  true,
);
const SH_SLOTS = Shape.d(
  rr(-90, 376, 42, 9, 3) + rr(-90, 396, 42, 9, 3) + rr(-90, 416, 42, 9, 3),
  true,
);
const SH_RIVETS = rivetPath([-96, 362, 96, 362, -96, 432, 96, 432, -34, 460, 34, 460], 4.8);
const SH_STACK = Shape.d(rr(44, 54, 26, 70, 6), true);
const SH_STACK2 = Shape.d(rr(-70, 54, 26, 50, 6), true);

function machinePiston(f: F): void {
  const c = f.ctx;
  const m = mats(f);
  const heavy = f.cls === 2;
  const slide = Math.sin(f.t * 4.2) * 7 + Math.min(1, Math.abs(f.drag) * 1.6) * 10;
  weaponIn(c);
  grip(f);
  if (heavy) {
    paint(c, SH_CYL, m.copper, inkR(6));
    if (K.lod > 0) {
      streak(c, SH_CYL_HI, inkR(5), 0.4);
      paint(c, SH_HOOPS, m.iron, inkR(4), true);
    }
    paint(c, SH_STACK, m.iron, inkR(4.5), true);
    paint(c, SH_STACK2, m.iron, inkR(4.5), true);
    c.save();
    c.translate(0, slide);
    paint(c, SH_ROD, m.iron, inkR(5));
    paint(c, SH_HEAD, m.iron, inkR(6));
    if (K.lod > 0) streak(c, SH_HEAD_HI, inkR(5), 0.5);
    flat(c, SH_SLOTS.p, '#1a0e08');
    c.lineWidth = inkR(3);
    c.strokeStyle = '#0e1118';
    c.stroke(SH_SLOTS.p);
    glow(c, 'ember', -68, 400, 40, 34, 0.55 + 0.3 * Math.sin(f.t * 7));
    paint(c, SH_FACE, m.brass, inkR(5), true);
    paint(c, SH_SPIKES, m.iron, inkR(4), true);
    rivets(c, SH_RIVETS, inkR(1.6));
    c.restore();
    c.restore();
    vent(f, 78 * RS, 0.225, 4, 1.1, 0.051, 0);
    vent(f, 78 * RS, -0.01, 3, 1.3, 0.043, 0.4);
    return;
  }
  paint(c, HM_CYL, m.copper, inkR(6));
  if (K.lod > 0) {
    streak(c, HM_CYL_HI, inkR(5), 0.4);
    paint(c, HM_HOOPS, m.iron, inkR(4), true);
  }
  paint(c, HM_STACK, m.iron, inkR(4.5), true);
  paint(c, HM_STACK_RIM, m.brass, inkR(4), true);
  gauge(f, 0, 190, 20, 0.3);
  c.save();
  c.translate(0, slide);
  paint(c, HM_ROD, m.iron, inkR(5));
  if (K.lod > 0) streak(c, HM_ROD_HI, inkR(3), 0.6);
  paint(c, HM_HEAD, m.iron, inkR(6));
  if (K.lod > 0) streak(c, HM_HEAD_HI, inkR(5), 0.5);
  flat(c, HM_SLOTS.p, '#1a0e08');
  c.lineWidth = inkR(3);
  c.strokeStyle = '#0e1118';
  c.stroke(HM_SLOTS.p);
  glow(c, 'ember', -40, 388, 30, 26, 0.5 + 0.3 * Math.sin(f.t * 7));
  paint(c, HM_FACE, m.brass, inkR(5), true);
  rivets(c, HM_RIVETS, inkR(1.5));
  c.restore();
  if (K.lod === 2) glint(c, -62, 400, 18, 0.5 + 0.4 * Math.sin(f.t * 3.1));
  c.restore();
  vent(f, 80 * RS, 0.09, 3, 1.2, 0.037, 0);
}

// ── Steam gun (firearm) ───────────────────────────────────────

const GN_STOCK = Shape.d('M -220 36 C -230 -10, -214 -44, -176 -50 L -40 -42 L -36 34 L -160 56 Z');
const GN_STOCK_PAD = Shape.d(rr(-236, -48, 26, 100, 8), true);
const GN_RECV = Shape.d(rr(-48, -52, 190, 100, 16));
const GN_RECV_HI = mkPath('M -34 -34 L 122 -34');
const GN_BARREL = Shape.d(rr(120, -30, 400, 50, 14));
const GN_BARREL_HI = mkPath('M 136 -18 L 506 -18');
const GN_RINGS = Shape.d([190, 290, 390].map((x) => rr(x, -36, 16, 62, 6)).join(' '), true);
const GN_MUZZLE = Shape.d('M 500 -40 L 560 -52 L 560 42 L 500 32 Z', true);
const GN_TANK = Shape.d(rr(20, 52, 260, 54, 24));
const GN_TANK_BANDS = Shape.d([64, 140, 216].map((x) => rr(x, 48, 14, 62, 6)).join(' '), true);
const GN_HOPPER = Shape.d('M 0 -52 L 100 -52 L 86 -96 L 14 -96 Z', true);
const GN_HOSE = mkPath('M 56 56 C 20 30, 10 20, 20 -4');
const GN_HOSE_FR = new Frame(0, -4, 0, 56);
const GN_SIGHT = Shape.d('M 470 -30 L 484 -30 L 480 -58 L 474 -58 Z', true);
const GN_RIVETS = rivetPath([-30, -34, 20, -34, 90, -34, -30, 34, 60, 34, 110, 34], 4);

// The colossus's broadside cannon arm: a fat bore, a flared muzzle, twin tanks and a siege bolt.
const CN_BARREL = Shape.d(rr(110, -52, 380, 94, 20));
const CN_BARREL_HI = mkPath('M 126 -32 L 470 -32');
const CN_RINGS = Shape.d([170, 270, 370].map((x) => rr(x, -60, 20, 110, 8)).join(' '), true);
const CN_MUZZLE = Shape.d('M 474 -64 L 566 -86 L 566 76 L 474 54 Z', true);
const CN_BORE = Shape.d('M 560 -60 C 548 -40, 548 30, 560 48 L 566 48 L 566 -60 Z');
const CN_TANK1 = Shape.d(rr(10, 52, 250, 62, 28));
const CN_TANK2 = Shape.d(rr(10, -122, 250, 52, 24));
const CN_BANDS = Shape.d(
  [50, 130, 210].map((x) => rr(x, 48, 16, 70, 6) + rr(x, -126, 16, 60, 6)).join(' '),
  true,
);
const CN_RECV = Shape.d(rr(-60, -66, 190, 120, 18));
const CN_BOLT = Shape.d('M 500 -10 L 580 -10 L 612 4 L 580 18 L 500 18 Z', true);
const CN_RIVETS = rivetPath([-36, -46, 30, -46, 96, -46, -36, 34, 30, 34, 96, 34], 4.6);

function machineGun(f: F): void {
  const c = f.ctx;
  const m = mats(f);
  const heavy = f.cls === 2;
  alongIn(c);
  if (heavy) {
    paint(c, GN_STOCK, m.dark, inkR(5));
    paint(c, GN_STOCK_PAD, m.brass, inkR(4.5), true);
    paint(c, CN_TANK2, m.copper, inkR(5.5));
    paint(c, CN_TANK1, m.copper, inkR(5.5));
    if (K.lod > 0) paint(c, CN_BANDS, m.iron, inkR(4), true);
    paint(c, CN_BARREL, m.iron, inkR(6));
    if (K.lod > 0) {
      streak(c, CN_BARREL_HI, inkR(5), 0.55);
      paint(c, CN_RINGS, m.brass, inkR(4), true);
    }
    paint(c, CN_BOLT, m.ironFar, inkR(4.5), true);
    paint(c, CN_MUZZLE, m.brass, inkR(5.5), true);
    flat(c, CN_BORE.p, '#120a08');
    paint(c, CN_RECV, m.iron, inkR(6));
    rivets(c, CN_RIVETS, inkR(1.6));
    gauge(f, 90, -22, 24, 0.5);
    c.restore();
    muzzleSteam(f, 590 * RS, 0.0, 0.03);
    vent(f, 0.15, 0.2, 3, 1.1, 0.044, 0.2);
    return;
  }
  paint(c, GN_STOCK, m.dark, inkR(5));
  paint(c, GN_STOCK_PAD, m.brass, inkR(4.5), true);
  paint(c, GN_HOPPER, m.brass, inkR(4.5), true);
  paint(c, GN_TANK, m.copper, inkR(5.5));
  if (K.lod > 0) paint(c, GN_TANK_BANDS, m.iron, inkR(4), true);
  paint(c, GN_BARREL, m.iron, inkR(6));
  if (K.lod > 0) {
    streak(c, GN_BARREL_HI, inkR(4), 0.55);
    paint(c, GN_RINGS, m.brass, inkR(4), true);
  }
  paint(c, GN_SIGHT, m.brass, inkR(3.5), true);
  paint(c, GN_MUZZLE, m.brass, inkR(5), true);
  flat(c, CN_BORE.p, '#120a08');
  paint(c, GN_RECV, m.iron, inkR(6));
  if (K.lod > 0) {
    streak(c, GN_RECV_HI, inkR(4), 0.5);
    c.lineWidth = inkR(11);
    c.lineCap = 'round';
    c.strokeStyle = '#0e1118';
    c.stroke(GN_HOSE);
    c.lineWidth = inkR(7);
    c.strokeStyle = m.brass.grad(c, GN_HOSE_FR, true);
    c.stroke(GN_HOSE);
  }
  rivets(c, GN_RIVETS, inkR(1.5));
  gauge(f, 150, 80, 16, 0.2);
  c.restore();
  muzzleSteam(f, 584 * RS, 0.0, 0.022);
  vent(f, 0.15, 0.19, 3, 1.1, 0.034, 0.1);
}

function muzzleSteam(f: F, x: number, y: number, size: number): void {
  // A thin pressure leak at the muzzle, pushed back by the stride.
  const c = f.ctx;
  for (let i = 0; i < 3; i++) {
    const ph = (f.t * 1.4 + i / 3) % 1;
    glow(
      c,
      'steam',
      x + 0.04 + ph * 0.14,
      y + 0.02 + ph * 0.03,
      size * (0.6 + ph * 1.4),
      size * (0.6 + ph * 1.4),
      (1 - ph) * 0.7,
    );
  }
}

// ── Pressure bomb (explosive) ─────────────────────────────────

const BM_BALL = Shape.circle(96, 0, 66);
const BM_BELT = (() => {
  const p = mkPath();
  p.arc(96, 0, 44, 0, Math.PI * 2);
  return new Shape(p, new Frame(52, 0, 140, 0));
})();
const BM_CAP = Shape.d(rr(134, -22, 38, 44, 10), true);
const BM_FUSE = mkPath('M 168 0 C 194 6, 204 -12, 224 -6');
const BM_RIVETS = rivetPath(
  Array.from({ length: 8 }, (_, i) => [
    96 + Math.cos((i / 8) * Math.PI * 2) * 56,
    Math.sin((i / 8) * Math.PI * 2) * 56,
  ]).flat(),
  3.6,
);
const BM_HI = mkPath('M 58 -38 C 68 -56, 94 -62, 118 -54');

function machineBomb(f: F): void {
  const c = f.ctx;
  const m = mats(f);
  const heavy = f.cls === 2;
  const k = heavy ? 1.2 : 1;
  alongIn(c);
  c.save();
  c.scale(k, k);
  paint(c, BM_BALL, m.iron, inkR(6));
  if (K.lod > 0) streak(c, BM_HI, inkR(5), 0.6);
  c.lineWidth = inkR(16);
  c.strokeStyle = '#0e1118';
  c.stroke(BM_BELT.p);
  c.lineWidth = inkR(10);
  c.strokeStyle = m.brass.grad(c, BM_BELT.fr, false);
  c.stroke(BM_BELT.p);
  rivets(c, BM_RIVETS, inkR(1.5));
  // Glowing seam: the charge cooking inside.
  glow(c, 'ember', 96, 0, 30, 30, 0.45 + 0.3 * Math.sin(f.t * 8));
  gauge(f, 78, 10, 17, 0.9);
  paint(c, BM_CAP, m.brass, inkR(5), true);
  c.lineWidth = inkR(7);
  c.lineCap = 'round';
  c.strokeStyle = '#0e1118';
  c.stroke(BM_FUSE);
  c.lineWidth = inkR(3.5);
  c.strokeStyle = m.leather.at(0);
  c.stroke(BM_FUSE);
  c.restore();
  c.restore();
  // The fuse burns: sparks fly off the tip, smoke trails up.
  const x = (24 + 224 * k) * RS;
  const y = 6 * k * RS;
  const kk = 0.75 + 0.25 * Math.sin(f.t * 17);
  glow(c, 'ember', x, y, 0.06 * kk, 0.06 * kk, 0.9);
  if (K.lod > 0) {
    for (let i = 0; i < 3; i++) {
      const ph = (f.t * 3 + i / 3) % 1;
      glow(
        c,
        'ember',
        x + Math.sin(f.t * 21 + i * 4) * 0.04 * ph,
        y + ph * 0.1,
        0.012,
        0.012,
        1 - ph,
      );
    }
  }
  vent(f, x, y, 3, 0.9, 0.034, 0.3);
}

// ── Steam cleaver (blade) ─────────────────────────────────────

const CL_GUARD = Shape.d(rr(-62, 34, 124, 24, 9), true);
const CL_BLADE = Shape.d('M 32 58 L 36 430 L 6 540 C -28 490, -58 430, -58 340 L -54 58 Z');
const CL_SPINE = Shape.d(rr(28, 58, 18, 380, 6), true);
const CL_EDGE = mkPath('M -54 70 L -58 340 C -58 430, -28 490, 6 540');
const CL_HI = mkPath('M -34 74 L -38 330');
const CL_SLOTS = Shape.d(
  rr(-18, 120, 34, 9, 3) + rr(-22, 190, 38, 9, 3) + rr(-24, 260, 40, 9, 3),
  true,
);
const CL_RIVETS = rivetPath([-38, 80, 14, 80, 14, 320, -38, 320], 4.2);

function machineSword(f: F): void {
  const c = f.ctx;
  const m = mats(f);
  weaponIn(c);
  grip(f);
  paint(c, CL_GUARD, m.brass, inkR(5), true);
  paint(c, CL_BLADE, m.iron, inkR(6));
  if (K.lod > 0) {
    streak(c, CL_HI, inkR(4), 0.6);
    if (K.lod === 2) streak(c, CL_EDGE, inkR(2.5), 0.45, '#ffd9a0');
  }
  paint(c, CL_SPINE, m.brass, inkR(5), true);
  flat(c, CL_SLOTS.p, '#1a0e08');
  c.lineWidth = inkR(3);
  c.strokeStyle = '#0e1118';
  c.stroke(CL_SLOTS.p);
  glow(c, 'ember', 0, 195, 30, 80, 0.5 + 0.25 * Math.sin(f.t * 6));
  rivets(c, CL_RIVETS, inkR(1.5));
  c.restore();
  if (K.lod === 2) {
    weaponIn(c);
    glint(c, -10, 500, 22, 0.55 + 0.35 * Math.sin(f.t * 3.3));
    c.restore();
  }
  vent(f, 0.34, 0.1, 2, 1.0, 0.034, 0.5);
}

// ── Steam lance (polearm), in world units like the knight's spear ──

const SP_SHAFT = new Shape(
  mkPath('M -0.5 -0.034 L 1.3 -0.032 L 1.3 0.032 L -0.5 0.034 Z'),
  new Frame(0, -0.034, 0, 0.034),
);
const SP_HEAD = new Shape(
  mkPath('M 1.3 -0.04 L 1.4 -0.11 L 1.54 -0.13 L 1.74 0 L 1.54 0.13 L 1.4 0.11 L 1.3 0.04 Z'),
  new Frame(0, -0.13, 0, 0.13),
);
const SP_SLOT = mkPath('M 1.42 -0.02 L 1.58 -0.01 L 1.58 0.01 L 1.42 0.02 Z');
const SP_COLLAR = new Shape(
  mkPath('M 1.22 -0.06 L 1.34 -0.06 L 1.34 0.06 L 1.22 0.06 Z'),
  new Frame(0, -0.06, 0, 0.06),
);
const SP_TANK = new Shape(
  mkPath('M 0.4 -0.07 L 0.8 -0.07 Q 0.86 0 0.8 0.07 L 0.4 0.07 Q 0.34 0 0.4 -0.07 Z'),
  new Frame(0, -0.07, 0, 0.07),
);
const SP_RINGS = new Shape(
  mkPath(
    'M 0.5 -0.08 L 0.54 -0.08 L 0.54 0.08 L 0.5 0.08 Z M 0.68 -0.08 L 0.72 -0.08 L 0.72 0.08 L 0.68 0.08 Z',
  ),
  new Frame(0, -0.08, 0, 0.08),
);
const SP_HI = mkPath('M 1.4 0.012 L 1.68 0.004');
const SP_PENNON = new Frame(0, 0.12, 0, -0.12);

function machineSpear(f: F): void {
  const c = f.ctx;
  const m = mats(f);
  paint(c, SP_SHAFT, m.iron, inkU(5));
  paint(c, SP_TANK, m.copper, inkU(5));
  if (K.lod > 0) paint(c, SP_RINGS, m.brass, inkU(3.5), true);
  paint(c, SP_HEAD, m.iron, inkU(5));
  flat(c, SP_SLOT, '#1a0e08');
  glow(c, 'ember', 1.5, 0, 0.1, 0.05, 0.6 + 0.3 * Math.sin(f.t * 6));
  paint(c, SP_COLLAR, m.brass, inkU(4), true);
  if (K.lod > 0) {
    streak(c, SP_HI, inkU(2.5), 0.6);
    seam(c, SP_SLOT, inkU(2), 0.8);
  }
  flag(
    c,
    f.acc.as('cloth'),
    SP_PENNON,
    1.2,
    0,
    Math.PI * 0.98,
    0.1,
    0.46,
    0.2,
    0.03,
    0.26,
    f.t,
    0.5,
    f.drag,
    inkU(4),
    7,
  );
  vent(f, 0.62, 0.08, 3, 1.1, 0.034, 0.2);
}

/** Draws the machine's weapon of `style` (weapon space); false when the style is not one of ours. */
export function machineWeapon(f: F, style: string): boolean {
  switch (style) {
    case 'piston':
      machinePiston(f);
      return true;
    case 'steamgun':
      machineGun(f);
      return true;
    case 'bomb':
      machineBomb(f);
      return true;
    case 'sword':
      machineSword(f);
      return true;
    case 'spear':
      machineSpear(f);
      return true;
    default:
      return false;
  }
}
