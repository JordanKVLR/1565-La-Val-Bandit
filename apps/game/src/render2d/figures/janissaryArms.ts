import {
  BASE,
  Frame,
  K,
  RS,
  SHADE,
  Shape,
  disc,
  flag,
  glint,
  glow,
  inkR,
  mkPath,
  paint,
  rivetPath,
  rivets,
  seam,
  streak,
  sw,
} from './kit';
import type { Ctx, Swatch } from './kit';
import { crescentPath } from './janissary';
import type { F } from './types';
import type { WeaponStyle } from './weapons';

/**
 * The Ottoman weapons (janissary and sipahi share the kilij, mace and grenado): steel with a
 * bright band, brass fittings, leather and wood, drawn in WEAPON SPACE like the rest of
 * weapons.ts (origin: the gripping hand, +x along the weapon, +y up) but authored in the
 * reference's pixels (570 px = 1 world unit), so every `weapon*` function runs inside `pxIn`.
 */

interface ArmMats {
  steel: Swatch;
  brass: Swatch;
  leather: Swatch;
  wood: Swatch;
  iron: Swatch;
}
const MAT = new WeakMap<object, ArmMats>();
export function armMats(f: F): ArmMats {
  let m = MAT.get(f.p);
  if (!m) {
    m = {
      steel: f.p.armour.as('metal'),
      brass: sw(f.hero ? (f.p.trim.c[0] as string) : '#d9a443', 'metal'),
      leather: sw('#6b4423', 'matte'),
      wood: sw('#7a5230', 'matte'),
      iron: sw('#4a4f5c', 'metal'),
    };
    MAT.set(f.p, m);
  }
  return m;
}

/** Weapon-space pixels: x along the weapon, y up (the hand is the origin). Pair with `c.restore()`. */
export function pxIn(c: Ctx): void {
  c.save();
  c.scale(RS, RS);
}

/** A plate whose gradient runs across the weapon (y), half-width `hw`. */
export function wShape(d: string, hw: number): Shape {
  return new Shape(mkPath(d), new Frame(0, -hw, 0, hw));
}

const UP = { x: 0, y: 1 };
function upDir(f: F): void {
  const r = f.wAng - Math.PI / 2;
  UP.x = Math.sin(r);
  UP.y = Math.cos(r);
}

/** A flickering ember with a little smoke, in weapon pixels. */
function emberPx(f: F, x: number, y: number, r: number, phase: number): void {
  const c = f.ctx;
  const k = 0.78 + 0.22 * Math.sin(f.t * 17 + phase);
  glow(c, 'ember', x, y, r * 2.4 * k, r * 2.4 * k, 0.9);
  if (K.lod === 0) return;
  upDir(f);
  for (let i = 0; i < 3; i++) {
    const ph = (f.t * 0.9 + i / 3 + phase * 0.1) % 1;
    glow(
      c,
      'steam',
      x + UP.x * (30 + ph * 190) + Math.sin(f.t * 3 + i) * 12,
      y + UP.y * (30 + ph * 190),
      10 + ph * 24,
      10 + ph * 24,
      (1 - ph) * 0.5,
    );
  }
}

/** Cel-shaded curved blade: flat steel, a dark edge strip, a ridge and a specular streak. */
function curvedBlade(
  c: Ctx,
  steel: Swatch,
  body: Path2D,
  edge: Path2D,
  ridge: Path2D,
  hi: Path2D,
  edgeW: number,
): void {
  c.fillStyle = steel.at(BASE);
  c.fill(body);
  if (K.lod > 0) {
    c.save();
    c.clip(body);
    c.lineCap = 'round';
    c.lineWidth = edgeW;
    c.strokeStyle = steel.at(SHADE);
    c.stroke(edge);
    c.restore();
    seam(c, ridge, inkR(4), 0.45);
    streak(c, hi, inkR(4.5), 0.7);
  }
  c.lineWidth = inkR(5);
  c.strokeStyle = '#0e1118';
  c.lineJoin = 'round';
  c.stroke(body);
}

// ── Kilij ─────────────────────────────────────────────────────

const KIL_BODY = mkPath('M 54 14 C 200 22, 390 54, 530 131 C 452 66, 300 -14, 54 -16 Z');
const KIL_EDGE = mkPath('M 530 131 C 452 66, 300 -14, 54 -16');
const KIL_RIDGE = mkPath('M 62 3 C 220 8, 392 40, 515 122');
const KIL_HI = mkPath('M 74 11 C 230 18, 392 52, 506 122');
const SIP_BODY = mkPath('M 54 11 C 200 18, 390 50, 530 131 C 452 62, 300 -6, 54 -10 Z');
const SIP_EDGE = mkPath('M 530 131 C 452 62, 300 -6, 54 -10');
const SIP_RIDGE = mkPath('M 62 2 C 220 6, 392 38, 515 122');
const SIP_HI = mkPath('M 74 8 C 230 14, 392 48, 506 122');
const K_GRIP = wShape('M -64 -13 L 38 -12 L 38 12 L -64 13 Z', 13);
const K_GRIP_WRAP = (() => {
  const p = mkPath();
  for (let i = 0; i < 6; i++) {
    p.moveTo(-56 + i * 16, -11);
    p.lineTo(-44 + i * 16, 11);
  }
  return p;
})();
const K_EAR = wShape('M -62 -12 C -90 -22, -104 -2, -92 18 C -82 30, -66 26, -62 14 Z', 20);
const K_GUARD = wShape('M 36 -30 C 48 -40, 60 -40, 64 -30 L 64 30 C 60 40, 48 40, 36 30 Z', 38);
const K_KNOB_A = Shape.circle(50, 38, 11);
const K_KNOB_B = Shape.circle(50, -38, 11);
const K_COLLAR = wShape('M 40 -17 L 58 -15 L 58 17 L 40 18 Z', 17);

/** The kilij: curved steel blade widening toward the yelman tip, brass ear pommel and quillons. */
export function ottomanKilij(f: F, slim: boolean): void {
  const c = f.ctx;
  const m = armMats(f);
  pxIn(c);
  paint(c, K_GRIP, m.leather, inkR(5));
  if (K.lod > 0) {
    c.lineWidth = inkR(2.5);
    c.strokeStyle = m.brass.at(0);
    c.stroke(K_GRIP_WRAP);
  }
  paint(c, K_EAR, m.brass, inkR(5));
  curvedBlade(
    c,
    m.steel,
    slim ? SIP_BODY : KIL_BODY,
    slim ? SIP_EDGE : KIL_EDGE,
    slim ? SIP_RIDGE : KIL_RIDGE,
    slim ? SIP_HI : KIL_HI,
    slim ? 24 : 30,
  );
  paint(c, K_COLLAR, m.brass, inkR(4));
  paint(c, K_GUARD, m.brass, inkR(5));
  paint(c, K_KNOB_A, m.brass, inkR(4));
  paint(c, K_KNOB_B, m.brass, inkR(4));
  if (K.lod === 2) glint(c, 506, 124, 20, 0.6 + 0.35 * Math.sin(f.t * 3.3));
  c.restore();
}

// ── Pike ──────────────────────────────────────────────────────

const PK_SHAFT = wShape('M -285 -12 L 940 -11 L 940 11 L -285 12 Z', 12);
const PK_LANGETS = wShape('M 690 -12 L 930 -11 L 930 11 L 690 12 Z', 12);
const PK_HEAD = wShape('M 928 -9 C 940 -34, 962 -36, 986 0 C 962 36, 940 34, 928 9 Z', 34);
const PK_RIDGE = mkPath('M 936 0 L 976 0');
const PK_COLLAR = wShape('M 912 -16 L 934 -16 L 934 16 L 912 16 Z', 16);
const PK_BUTT = wShape('M -300 -12 L -278 -12 L -278 12 L -300 12 Z', 12);
const PK_FR = new Frame(0, 50, 0, -50);

/** The janissary pike: a long haft, steel langets, a leaf head and a tassel in the side colour. */
function ottomanPike(f: F): void {
  const c = f.ctx;
  const m = armMats(f);
  pxIn(c);
  paint(c, PK_SHAFT, m.wood, inkR(5));
  paint(c, PK_BUTT, m.brass, inkR(4));
  paint(c, PK_LANGETS, m.steel, inkR(4.5));
  paint(c, PK_HEAD, m.steel, inkR(5));
  if (K.lod > 0) seam(c, PK_RIDGE, inkR(3), 0.5);
  paint(c, PK_COLLAR, m.brass, inkR(4));
  const acc = f.acc.as('cloth');
  flag(
    c,
    acc,
    PK_FR,
    890,
    0,
    Math.PI * 1.02,
    0.35,
    190,
    70,
    18,
    0.24,
    f.t,
    0.9,
    f.drag,
    inkR(4),
    6,
  );
  flag(c, acc, PK_FR, 890, 0, Math.PI * 0.9, 0.5, 130, 48, 12, 0.3, f.t, 2.2, f.drag, inkR(4), 5);
  c.restore();
}

// ── Mace ──────────────────────────────────────────────────────

const MC_HAFT = wShape('M -70 -13 L 336 -12 L 336 12 L -70 13 Z', 13);
const MC_GRIP = wShape('M -40 -16 L 150 -15 L 150 15 L -40 16 Z', 16);
const MC_WRAP = (() => {
  const p = mkPath();
  for (let i = 0; i < 8; i++) {
    p.moveTo(-34 + i * 22, -14);
    p.lineTo(-18 + i * 22, 14);
  }
  return p;
})();
const MC_POMMEL = Shape.circle(-78, 0, 21);
const MC_HEAD = (() => {
  const p = mkPath();
  const n = 6;
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? 62 : 38;
    const x = 372 + Math.cos(a) * r * 0.86;
    const y = Math.sin(a) * r;
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  p.closePath();
  return new Shape(p, new Frame(318, 0, 426, 0));
})();
const MC_RING = Shape.circle(372, 0, 20);
const MC_COLLAR = wShape('M 318 -24 L 340 -24 L 340 24 L 318 24 Z', 24);
const MC_RIVETS = rivetPath([328, -14, 328, 14], 3.4);
const MC_FR = new Frame(0, 40, 0, -40);

/** The Ottoman flanged mace (shishpar): a six-flanged head on a wrapped haft. `gold` for the sipahi. */
export function ottomanMace(f: F, gold: boolean): void {
  const c = f.ctx;
  const m = armMats(f);
  pxIn(c);
  paint(c, MC_HAFT, m.wood, inkR(5));
  paint(c, MC_GRIP, m.leather, inkR(5));
  if (K.lod > 0) {
    c.lineWidth = inkR(2.5);
    c.strokeStyle = m.brass.at(0);
    c.stroke(MC_WRAP);
  }
  paint(c, MC_POMMEL, m.brass, inkR(5));
  paint(c, MC_COLLAR, m.brass, inkR(4));
  rivets(c, MC_RIVETS, inkR(1.5));
  paint(c, MC_HEAD, gold ? m.brass : m.steel, inkR(5.5));
  paint(c, MC_RING, gold ? m.steel : m.brass, inkR(4));
  if (gold)
    flag(
      c,
      f.acc.as('cloth'),
      MC_FR,
      -78,
      0,
      Math.PI * 1.1,
      0.5,
      170,
      42,
      14,
      0.26,
      f.t,
      0.6,
      f.drag,
      inkR(4),
      5,
    );
  c.restore();
}

// ── Musket, arquebus ──────────────────────────────────────────

const MS_STOCK = wShape(
  'M -232 42 L -224 -28 C -200 -52, -120 -46, -40 -42 C 60 -46, 200 -36, 380 -26 L 380 8 C 200 16, 80 24, 10 42 C -50 60, -120 58, -190 54 Z',
  50,
);
const MS_STOCK_HI = mkPath('M -190 40 C -100 38, 0 24, 120 -4');
const MS_BARREL = wShape('M 20 -3 L 661 -4 L 661 28 L 20 29 Z', 16);
const MS_BARREL_HI = mkPath('M 50 20 L 640 20');
const MS_MUZZLE = wShape('M 640 -9 L 668 -13 L 668 38 L 640 33 Z', 26);
const AQ_BARREL = wShape('M 20 -3 L 570 -4 L 570 28 L 20 29 Z', 16);
const AQ_MUZZLE = wShape('M 549 -9 L 577 -13 L 577 38 L 549 33 Z', 26);
const MS_BAND = wShape('M 0 -9 L 16 -9 L 16 34 L 0 34 Z', 22);
const MS_LOCK = wShape('M -24 34 L 74 34 L 86 62 L -12 66 Z', 16);
const MS_COCK = Shape.d('M 30 60 C 22 92, 8 104, -8 98 C 4 92, 10 82, 14 62 Z');
const MS_MOON = crescentPath(140, -8, 17, 13, 6);
const MS_PLATE = wShape('M -240 8 L -218 12 L -222 -34 L -240 -28 Z', 20);
const MS_FR = new Frame(0, 40, 0, -40);
const MS_MATCH: readonly number[] = [34, 96, 10, 118, -8, 100, -34, 124, -62, 112];

/** The orta musket (and the shorter arquebus): long steel barrel, wood stock, a smouldering match. */
export function ottomanGun(f: F, long: boolean): void {
  const c = f.ctx;
  const m = armMats(f);
  pxIn(c);
  paint(c, MS_STOCK, m.wood, inkR(5));
  if (K.lod > 0) streak(c, MS_STOCK_HI, inkR(4), 0.3);
  paint(c, MS_PLATE, m.brass, inkR(4));
  c.save();
  c.fillStyle = m.brass.at(0);
  c.fill(MS_MOON);
  c.lineWidth = inkR(3);
  c.strokeStyle = '#0e1118';
  c.stroke(MS_MOON);
  c.restore();
  paint(c, long ? MS_BARREL : AQ_BARREL, m.steel, inkR(5));
  if (K.lod > 0) streak(c, MS_BARREL_HI, inkR(3), 0.55);
  for (const x of long ? [180, 340, 500] : [160, 300, 440]) {
    c.save();
    c.translate(x, 0);
    paint(c, MS_BAND, m.brass, inkR(4));
    c.restore();
  }
  paint(c, long ? MS_MUZZLE : AQ_MUZZLE, m.brass, inkR(5));
  paint(c, MS_LOCK, m.brass, inkR(4.5));
  paint(c, MS_COCK, m.iron, inkR(4));
  // Smouldering match: the cord hangs from the cock and glows at the tip.
  const sway = Math.sin(f.t * 3) * 6;
  c.beginPath();
  c.moveTo(MS_MATCH[0] as number, MS_MATCH[1] as number);
  for (let i = 1; i < 5; i++)
    c.lineTo(
      (MS_MATCH[i * 2] as number) + (i % 2 ? sway : -sway),
      (MS_MATCH[i * 2 + 1] as number) + sway * 0.4,
    );
  c.lineWidth = inkR(7);
  c.strokeStyle = '#0e1118';
  c.stroke();
  c.lineWidth = inkR(4);
  c.strokeStyle = '#8a7a5a';
  c.stroke();
  emberPx(f, 36, 98, 11, 0);
  flag(
    c,
    f.acc.as('cloth'),
    MS_FR,
    -236,
    8,
    Math.PI * 1.05,
    0.7,
    190,
    52,
    18,
    0.28,
    f.t,
    0.3,
    f.drag,
    inkR(4),
    5,
  );
  c.restore();
}

// ── Grenado ───────────────────────────────────────────────────

const GR_BAND = Shape.d('M 24 -8 C 50 6, 120 6, 146 -8 L 146 14 C 120 28, 50 28, 24 14 Z', true);
const GR_FUSE = mkPath('M 86 74 C 90 96, 112 100, 108 124');
const GR_CAP = Shape.d('M 70 66 L 104 66 L 100 90 L 74 90 Z', true);

/** The grenado: a riveted iron ball with a brass cap and a burning fuse. */
export function ottomanGrenade(f: F): void {
  const c = f.ctx;
  const m = armMats(f);
  pxIn(c);
  disc(c, m.iron, 86, 12, 64, inkR(6));
  paint(c, GR_BAND, m.brass, inkR(4), true);
  if (K.lod > 0) {
    c.save();
    c.translate(86, 12);
    c.lineWidth = inkR(4);
    c.strokeStyle = '#ffffff';
    c.globalAlpha = 0.45;
    c.beginPath();
    c.arc(0, 0, 50, Math.PI * 0.62, Math.PI * 0.9);
    c.stroke();
    c.globalAlpha = 1;
    c.restore();
  }
  rivets(c, GR_RIVETS, inkR(1.5));
  paint(c, GR_CAP, m.brass, inkR(4), true);
  c.lineCap = 'round';
  c.lineWidth = inkR(9);
  c.strokeStyle = '#0e1118';
  c.stroke(GR_FUSE);
  c.lineWidth = inkR(5);
  c.strokeStyle = '#c9b58a';
  c.stroke(GR_FUSE);
  emberPx(f, 108, 128, 14, 1);
  c.restore();
}
const GR_RIVETS = rivetPath([46, 34, 126, 34, 86, 68, 40, -26, 132, -26], 4);

/** Dispatch for the janissary: returns true when it drew the weapon. */
export function janissaryWeapon(f: F, style: WeaponStyle): boolean {
  switch (style) {
    case 'sabre':
      ottomanKilij(f, false);
      return true;
    case 'pike':
      ottomanPike(f);
      return true;
    case 'mace':
      ottomanMace(f, false);
      return true;
    case 'musket':
      ottomanGun(f, true);
      return true;
    case 'grenade':
      ottomanGrenade(f);
      return true;
    default:
      return false;
  }
}
