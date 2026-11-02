import {
  Frame,
  K,
  RS,
  Shape,
  disc,
  flag,
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
  sw,
  flat,
} from './kit';
import type { Ctx, Swatch } from './kit';
import type { WeaponStyle } from './weapons';
import type { F } from './types';

/**
 * The corsairs' weapons (and the barge crew's), in the Cavaliere's style: bold ink, cylinder
 * shaded steel with a bright band, brass fittings, leather grips. Weapon space like the rest of
 * weapons.ts: the origin is the gripping hand and +x runs along the weapon; it is authored in
 * reference pixels with the hand at py = -24 and the business end along +py (see `weaponIn`).
 * The reach of each weapon matches `tipUV` in weapons.ts so the anchors stay true.
 */

interface ArmMats {
  steel: Swatch;
  iron: Swatch;
  brass: Swatch;
  leather: Swatch;
  wood: Swatch;
  clay: Swatch;
  rope: Swatch;
}
const M: ArmMats = {
  steel: sw('#b9c3d3', 'metal'),
  iron: sw('#5d6574', 'metal'),
  brass: sw('#d9a443', 'metal'),
  leather: sw('#7a4a22', 'matte'),
  wood: sw('#7a5230', 'matte'),
  clay: sw('#b8683c', 'matte'),
  rope: sw('#d8c690', 'matte'),
};

function weaponIn(ctx: Ctx): void {
  ctx.save();
  ctx.transform(0, RS, RS, 0, 24 * RS, 0);
}

/** Gun-like weapons are authored with x along the weapon and y down (the hand at the origin). */
function alongIn(ctx: Ctx): void {
  ctx.save();
  ctx.scale(RS, -RS);
}

/** A gradient frame across a tilted blade (perpendicular to its mean axis). */
function tilted(cx: number, cy: number, half: number, ax: number, ay: number): Frame {
  const l = Math.hypot(ax, ay) || 1;
  const nx = ay / l;
  const ny = -ax / l;
  return new Frame(cx - nx * half, cy - ny * half, cx + nx * half, cy + ny * half);
}

// ── Kilij / cutlass ──────────────────────────────────────────

const GRIP = Shape.d(
  'M -13 -62 L 15 -62 Q 17 -62 17 -56 L 16 10 Q 16 16 8 16 L -8 16 Q -16 16 -16 10 L -16 -56 Q -16 -62 -13 -62 Z',
);
const GRIP_WRAP = (() => {
  const p = mkPath();
  for (let i = 0; i < 5; i++) {
    p.moveTo(-9, -52 + i * 14);
    p.lineTo(9, -44 + i * 14);
  }
  return p;
})();
/** The bird-head pommel curving toward the spine of the blade. */
const POMMEL = Shape.d(
  'M -16 -62 L 17 -62 C 34 -64 44 -82 30 -96 C 16 -108 -12 -102 -16 -78 Z',
  false,
);
const POMMEL_EYE = Shape.circle(18, -86, 4.4, true);
const QUILLON = Shape.d('M -40 22 C -20 16 20 16 46 22 L 48 40 C 20 34 -20 34 -40 40 Z', true);
const QUILL_L = Shape.circle(-40, 31, 10);
const QUILL_R = Shape.circle(47, 31, 10);
const KNUCKLE = (() => {
  const p = mkPath('M -36 30 C -66 -2 -60 -50 -22 -72');
  return p;
})();
const KNUCKLE_FR = new Frame(-66, 0, -22, 0);
const BLADE = new Shape(
  mkPath('M 22 40 C 26 200, 64 360, 131 508 C 66 404, 24 280, -22 40 Z'),
  tilted(40, 260, 60, 131, 508),
);
const FULLER = mkPath('M 3 70 C 10 210, 44 350, 100 470');
const BLADE_HI = mkPath('M -14 70 C 0 250, 40 380, 108 496');
const BLADE_BACK = mkPath('M 20 70 C 26 210, 60 350, 118 484');

/** Curved kilij or cutlass with a knuckle guard. `straight` draws the barge crew's hanger. */
function sabre(f: F, straight: boolean): void {
  const c = f.ctx;
  weaponIn(c);
  paint(c, GRIP, M.leather, inkR(5));
  if (K.lod > 0) {
    c.lineWidth = inkR(2.5);
    c.strokeStyle = M.brass.at(0);
    c.stroke(GRIP_WRAP);
  }
  paint(c, POMMEL, M.brass, inkR(5), true);
  if (K.lod > 0) paint(c, POMMEL_EYE, M.iron, inkR(2.5), true);
  // Knuckle guard.
  c.lineCap = 'round';
  c.lineWidth = inkR(18);
  c.strokeStyle = '#0e1118';
  c.stroke(KNUCKLE);
  c.lineWidth = inkR(10);
  c.strokeStyle = M.brass.grad(c, KNUCKLE_FR, false);
  c.stroke(KNUCKLE);
  paint(c, QUILLON, M.brass, inkR(5), true);
  paint(c, QUILL_L, M.brass, inkR(4));
  paint(c, QUILL_R, M.brass, inkR(4));
  if (straight) {
    // A straight hanger: the same hilt, a plain blade.
    c.save();
    c.scale(1, 1);
    paint(c, HANGER, M.steel, inkR(5));
    if (K.lod > 0) {
      seam(c, HANGER_RIDGE, inkR(4), 0.45);
      streak(c, HANGER_HI, inkR(3), 0.75);
    }
    c.restore();
  } else {
    paint(c, BLADE, M.steel, inkR(5));
    if (K.lod > 0) {
      seam(c, FULLER, inkR(4.5), 0.45);
      streak(c, BLADE_HI, inkR(3.6), 0.75);
      if (K.lod === 2) {
        streak(c, BLADE_BACK, inkR(2), 0.3);
        glint(c, 112, 470, 20, 0.55 + 0.35 * Math.sin(f.t * 3.1));
      }
    }
  }
  c.restore();
}
const HANGER = Shape.d('M -20 40 L -18 440 L 4 474 L 22 440 L 20 40 Z');
const HANGER_RIDGE = mkPath('M 0 50 L 0 460');
const HANGER_HI = mkPath('M -12 56 L -11 430');

// ── Boarding spear with a grapple barb ───────────────────────

const HAFT = Shape.d('M -12 -300 L 12 -300 L 12 760 L -12 760 Z');
const HAFT_HI = mkPath('M -6 -280 L -6 740');
const FERRULE = Shape.d('M -16 -312 L 16 -312 L 14 -250 L -14 -250 Z', true);
const SOCKET = Shape.d('M -17 730 L 17 730 L 15 790 L -15 790 Z', true);
const SP_HEAD = Shape.d('M -15 786 L 15 786 C 44 820 40 870 0 936 C -40 870 -44 820 -15 786 Z');
const SP_RIDGE = mkPath('M 0 800 L 0 920');
const SP_HI = mkPath('M -20 812 C -26 850 -16 890 -4 916');
const BARB = Shape.d('M 14 794 C 78 806 104 740 88 676 L 66 688 C 74 726 56 762 22 762 Z');
const ROPE_WRAP = (() => {
  const p = mkPath();
  for (let i = 0; i < 6; i++) {
    p.moveTo(-13, 500 + i * 36);
    p.lineTo(13, 514 + i * 36);
  }
  return p;
})();
const SP_PENNON = new Frame(0, 0.12, 0, -0.12);

function boarding(f: F): void {
  const c = f.ctx;
  weaponIn(c);
  paint(c, HAFT, M.wood, inkR(5));
  if (K.lod > 0) streak(c, HAFT_HI, inkR(3), 0.35);
  paint(c, FERRULE, M.brass, inkR(4), true);
  // Coiled rope on the haft below the head.
  c.lineWidth = inkR(5);
  c.lineCap = 'round';
  c.strokeStyle = '#0e1118';
  c.stroke(ROPE_WRAP);
  c.lineWidth = inkR(3);
  c.strokeStyle = M.rope.at(0);
  c.stroke(ROPE_WRAP);
  paint(c, BARB, M.iron, inkR(5));
  paint(c, SP_HEAD, M.steel, inkR(5));
  if (K.lod > 0) {
    seam(c, SP_RIDGE, inkR(4), 0.45);
    streak(c, SP_HI, inkR(3), 0.7);
  }
  paint(c, SOCKET, M.brass, inkR(4), true);
  c.restore();
  // The side colour: a swallow pennon streaming behind the head.
  flag(
    c,
    f.acc.as('cloth'),
    SP_PENNON,
    1.26,
    0.04,
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
}

// ── Boatswain's club and maul ────────────────────────────────

const CL_HAFT = Shape.d('M -17 -60 L 17 -60 L 15 280 L -15 280 Z');
const CL_HEAD = Shape.d(
  'M -22 250 C -60 270 -70 330 -48 370 C -30 395 30 395 48 370 C 70 330 60 270 22 250 Z',
);
const CL_HI = mkPath('M -42 275 C -52 310 -46 350 -30 372');
const CL_BANDS = Shape.d(
  'M -50 292 C -20 302 20 302 50 292 L 52 308 C 20 318 -20 318 -52 308 Z M -46 344 C -20 354 20 354 46 344 L 44 360 C 20 370 -20 370 -44 360 Z',
  true,
);
const CL_STUDS = (() => {
  const p = mkPath();
  for (const [x, y] of [
    [-36, 326],
    [0, 332],
    [36, 326],
    [-18, 378],
    [18, 378],
  ] as const) {
    p.moveTo(x - 9, y + 9);
    p.lineTo(x, y - 14);
    p.lineTo(x + 9, y + 9);
    p.closePath();
  }
  return p;
})();
const CL_CAP = Shape.circle(0, 392, 14);
const CL_STRAP = (() => {
  const p = mkPath('M -16 -10 C -60 -6 -70 60 -30 110');
  return p;
})();
const MAUL_HEAD = Shape.d('M -64 270 L 64 270 L 66 380 L -66 380 Z', false);
const MAUL_BANDS = Shape.d(
  'M -68 262 L 68 262 L 68 284 L -68 284 Z M -68 366 L 68 366 L 68 388 L -68 388 Z',
  true,
);

function club(f: F, maul: boolean): void {
  const c = f.ctx;
  weaponIn(c);
  paint(c, CL_HAFT, M.wood, inkR(5));
  if (K.lod > 0) {
    c.lineWidth = inkR(3);
    c.strokeStyle = '#0e1118';
    c.lineCap = 'round';
    c.stroke(GRIP_WRAP);
  }
  // Wrist loop.
  c.lineWidth = inkR(8);
  c.strokeStyle = '#0e1118';
  c.stroke(CL_STRAP);
  c.lineWidth = inkR(4);
  c.strokeStyle = M.leather.at(0);
  c.stroke(CL_STRAP);
  paint(c, POMMEL, M.brass, inkR(5), true);
  if (maul) {
    paint(c, MAUL_HEAD, M.iron, inkR(5.5));
    paint(c, MAUL_BANDS, M.brass, inkR(4), true);
    if (K.lod > 0) streak(c, MAUL_HI, inkR(4), 0.5);
  } else {
    paint(c, CL_HEAD, M.wood, inkR(5.5));
    if (K.lod > 0) streak(c, CL_HI, inkR(5), 0.35);
    paint(c, CL_BANDS, M.iron, inkR(4), true);
    c.fillStyle = M.brass.at(0);
    c.fill(CL_STUDS);
    c.lineWidth = inkR(3.5);
    c.strokeStyle = '#0e1118';
    c.stroke(CL_STUDS);
    paint(c, CL_CAP, M.brass, inkR(4));
  }
  c.restore();
}
const MAUL_HI = mkPath('M -52 284 L -54 362');

// ── Blunderbuss and arquebus ─────────────────────────────────

const STOCK = Shape.d(
  'M -230 -30 C -236 -80 -200 -96 -150 -80 L -20 -34 L 60 -22 L 60 22 L -10 28 C -80 40 -150 60 -200 70 C -228 56 -232 20 -230 -30 Z',
);
const STOCK_HI = mkPath('M -214 -52 C -196 -80 -170 -84 -140 -68');
const STOCK_BAND = Shape.d('M -226 -40 L -216 -40 L -212 66 L -224 62 Z', true);
const LOCK = Shape.d('M 4 -44 L 74 -44 L 78 -12 L 6 -8 Z', true);
const COCK = mkPath('M 40 -44 C 36 -78 58 -92 82 -84 C 66 -76 60 -64 66 -44');
const COCK_FR = new Frame(36, -44, 80, -80);
const BARREL = Shape.d('M 40 -22 L 380 -18 L 380 18 L 40 22 Z');
const BARREL_HI = mkPath('M 50 -12 L 372 -10');
const BELL = Shape.d('M 372 -20 C 410 -30 436 -52 450 -66 L 452 66 C 436 52 410 30 372 20 Z');
const BELL_HI = mkPath('M 384 -22 C 410 -34 430 -50 442 -58');
const BELL_RIM = Shape.d('M 444 -70 L 458 -70 L 458 70 L 444 70 Z', true);
const BANDS = Shape.d(
  'M 98 -26 L 116 -26 L 116 26 L 98 26 Z M 200 -26 L 218 -26 L 218 26 L 200 26 Z M 300 -26 L 318 -26 L 318 26 L 300 26 Z',
  true,
);
const BAND_RIVETS = rivetPath([107, -14, 107, 14, 209, -14, 209, 14, 309, -14, 309, 14], 3.4);
const GUN_TANK = Shape.d(
  'M 110 24 L 300 24 C 312 24 316 44 304 52 L 120 52 C 106 50 100 34 110 24 Z',
);
const GUN_TANK_HI = mkPath('M 124 32 L 292 32');
const GUN_PIPE = mkPath('M 300 38 C 330 38 340 24 342 12');
const GUN_PIPE_FR = new Frame(300, 0, 342, 0);

const LONG_BARREL = Shape.d('M 40 -20 L 546 -16 L 546 16 L 40 20 Z');
const LONG_HI = mkPath('M 50 -10 L 538 -8');
const LONG_MUZZLE = Shape.d('M 530 -24 L 556 -24 L 556 24 L 530 24 Z', true);
const LONG_BANDS = Shape.d(
  'M 120 -24 L 138 -24 L 138 24 L 120 24 Z M 260 -24 L 278 -24 L 278 24 L 260 24 Z M 400 -24 L 418 -24 L 418 24 L 400 24 Z',
  true,
);
const LONG_RIVETS = rivetPath([129, -12, 129, 12, 269, -12, 269, 12, 409, -12, 409, 12], 3.4);

function gun(f: F, long: boolean): void {
  const c = f.ctx;
  alongIn(c);
  paint(c, STOCK, M.wood, inkR(5));
  if (K.lod > 0) streak(c, STOCK_HI, inkR(4), 0.4);
  paint(c, STOCK_BAND, M.brass, inkR(3.5), true);
  if (long) {
    paint(c, LONG_BARREL, M.steel, inkR(5));
    if (K.lod > 0) streak(c, LONG_HI, inkR(3.5), 0.7);
    paint(c, LONG_BANDS, M.brass, inkR(4), true);
    rivets(c, LONG_RIVETS, inkR(1.5));
    paint(c, LONG_MUZZLE, M.brass, inkR(4), true);
  } else {
    // A small steam tank slung under the barrel with a feed pipe.
    paint(c, GUN_TANK, M.brass, inkR(5), true);
    if (K.lod > 0) streak(c, GUN_TANK_HI, inkR(3), 0.5);
    c.lineWidth = inkR(11);
    c.strokeStyle = '#0e1118';
    c.stroke(GUN_PIPE);
    c.lineWidth = inkR(6);
    c.strokeStyle = M.brass.grad(c, GUN_PIPE_FR, true);
    c.stroke(GUN_PIPE);
    paint(c, BARREL, M.steel, inkR(5));
    if (K.lod > 0) streak(c, BARREL_HI, inkR(3.5), 0.7);
    paint(c, BANDS, M.brass, inkR(4), true);
    rivets(c, BAND_RIVETS, inkR(1.5));
    paint(c, BELL, M.brass, inkR(5.5), true);
    if (K.lod > 0) streak(c, BELL_HI, inkR(4), 0.6);
    paint(c, BELL_RIM, M.iron, inkR(4), true);
  }
  paint(c, LOCK, M.brass, inkR(4.5), true);
  c.lineCap = 'round';
  c.lineWidth = inkR(14);
  c.strokeStyle = '#0e1118';
  c.stroke(COCK);
  c.lineWidth = inkR(8);
  c.strokeStyle = M.iron.grad(c, COCK_FR, true);
  c.stroke(COCK);
  // Wisp of steam from the muzzle.
  const mx = long ? 556 : 458;
  const n = K.lod === 0 ? 1 : 3;
  for (let i = 0; i < n; i++) {
    const ph = (f.t * 0.7 + i / n) % 1;
    const r = 18 + ph * 40;
    glow(
      c,
      'steam',
      mx + 10 + ph * 40,
      -6 - Math.sin(f.t * 3 + i * 2) * 8 - ph * 40,
      r,
      r,
      (1 - ph) * 0.8,
    );
  }
  glow(c, 'ember', mx - 8, 0, 18, 18, 0.55 + 0.25 * Math.sin(f.t * 15));
  c.restore();
}

// ── Fire-pot ─────────────────────────────────────────────────

const POT = Shape.d(
  'M -60 -20 C -100 20 -96 110 -40 150 C -10 170 60 170 90 140 C 130 100 120 30 60 -20 C 40 -30 -30 -30 -60 -20 Z',
);
const POT_HI = mkPath('M -78 20 C -84 70 -66 120 -34 142');
const POT_NECK = Shape.d('M -34 -50 L 38 -50 L 44 -14 L -40 -14 Z', true);
const POT_NET = (() => {
  const p = mkPath();
  for (let i = 0; i < 5; i++) {
    p.moveTo(-84 + i * 36, -10);
    p.quadraticCurveTo(-60 + i * 36, 70, -20 + i * 32, 158);
    p.moveTo(-96 + i * 40, 150);
    p.quadraticCurveTo(-10, 40 + i * 12, 100, 10 + i * 34);
  }
  return p;
})();
const POT_GRIP = Shape.d('M -190 -18 L -40 -18 L -40 18 L -190 18 Z', false);

function firepot(f: F): void {
  const c = f.ctx;
  alongIn(c);
  // The pot sits ahead of the fist.
  c.translate(150, 20);
  paint(c, POT_GRIP, M.leather, inkR(4.5));
  paint(c, POT, M.clay, inkR(5.5));
  if (K.lod > 0) {
    c.lineWidth = inkR(5);
    c.strokeStyle = '#0e1118';
    c.lineCap = 'round';
    c.stroke(POT_NET);
    c.lineWidth = inkR(2.8);
    c.strokeStyle = M.rope.at(0);
    c.stroke(POT_NET);
    streak(c, POT_HI, inkR(5), 0.4);
  }
  paint(c, POT_NECK, M.iron, inkR(4.5), true);
  // The fuse burns and the flame points up in the world.
  const r = f.wAng - Math.PI / 2;
  const upAlong = Math.sin(r);
  const upAcross = Math.cos(r);
  const bx = 0;
  const by = -50;
  const n = K.lod === 0 ? 2 : 4;
  for (let i = 0; i < n; i++) {
    const k = (f.t * 1.8 + i / n) % 1;
    // along = py, across = px in this space
    const px = bx + upAlong * k * 150 + Math.sin(f.t * 9 + i * 2) * 8;
    const py = by - upAcross * k * 150;
    const rr = 36 * (1 - k * 0.7);
    glow(c, 'ember', px, py, rr * 1.6, rr * 1.6, 0.9 * (1 - k * 0.4));
    c.fillStyle = i % 2 ? '#ffb43a' : '#ff7a1f';
    c.beginPath();
    c.ellipse(px, py, rr * 0.7, rr, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// ── Dispatch ─────────────────────────────────────────────────

/**
 * Draws a corsair or barge-crew weapon in the wrist frame (already rotated like the old weapons:
 * the caller applied `rotate(-π/2)`). Returns false for a style this file does not draw.
 */
export function corsairWeapon(f: F, style: WeaponStyle, crew: boolean): boolean {
  switch (style) {
    case 'sabre':
      sabre(f, false);
      return true;
    case 'sword':
      sabre(f, crew);
      return true;
    case 'boarding':
    case 'spear':
      boarding(f);
      return true;
    case 'club':
      club(f, false);
      return true;
    case 'maul':
      club(f, true);
      return true;
    case 'blunderbuss':
      gun(f, false);
      return true;
    case 'arquebus':
      gun(f, true);
      return true;
    case 'firepot':
    case 'grenade':
      firepot(f);
      return true;
    default:
      return false;
  }
}

void disc;
void flat;
