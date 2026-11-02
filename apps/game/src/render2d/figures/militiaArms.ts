import type { WeaponStyle } from './weapons';
import {
  Frame,
  K,
  Shape,
  flag,
  flat,
  glint,
  glow,
  inkU,
  mkPath,
  paint,
  rivetPath,
  rivets,
  seam,
  streak,
  sw,
} from './kit';
import type { Swatch } from './kit';
import { gunnerArquebus, gunnerGrenade } from './gunnerArms';
import { milMats } from './militia';
import type { MilMats } from './militia';
import type { F } from './types';

/**
 * Weapons of the militia and the gunners (shared, in the Cavaliere's style): drawn in WEAPON
 * SPACE like the rest of weapons.ts: the origin is the gripping hand, +x runs along the weapon,
 * +y is its back edge. Lengths match `tipUV` in weapons.ts. Every shape is built once at module
 * load; the arquebus and grenade live in gunnerArms.ts.
 */

/** A bar along +x with a cylinder gradient across it (shafts, barrels, grips). */
export function bar(x0: number, x1: number, hw: number): Shape {
  return new Shape(
    mkPath(`M ${x0} ${-hw} L ${x1} ${-hw} L ${x1} ${hw} L ${x0} ${hw} Z`),
    new Frame(0, -hw, 0, hw),
  );
}

/** A rounded bar (a capsule along x), for grips and bindings. */
export function capsule(x0: number, x1: number, hw: number): Shape {
  const r = hw * 0.9;
  return new Shape(
    mkPath(
      `M ${x0 + r} ${-hw} L ${x1 - r} ${-hw} Q ${x1} ${-hw} ${x1} ${-hw + r} L ${x1} ${hw - r} ` +
        `Q ${x1} ${hw} ${x1 - r} ${hw} L ${x0 + r} ${hw} Q ${x0} ${hw} ${x0} ${hw - r} ` +
        `L ${x0} ${-hw + r} Q ${x0} ${-hw} ${x0 + r} ${-hw} Z`,
    ),
    new Frame(0, -hw, 0, hw),
  );
}

/** A path of short diagonal wraps along a grip from x0 to x1. */
export function wraps(x0: number, x1: number, hw: number, n: number): Path2D {
  const p = mkPath();
  const step = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    p.moveTo(x0 + i * step, -hw);
    p.lineTo(x0 + (i + 1) * step, hw);
  }
  return p;
}

const UP = { x: 0, y: 1 };
/** World "up" expressed in weapon space, for flames and smoke. */
export function upDir(f: F): { x: number; y: number } {
  const r = f.wAng - Math.PI / 2;
  UP.x = Math.sin(r);
  UP.y = Math.cos(r);
  return UP;
}

const CORD = sw('#6b4a2b', 'matte');
export function cord(): Swatch {
  return CORD;
}

// ── Sword: a falchion forged from a salvaged blade ────────────

const GRIP = capsule(-0.12, 0.07, 0.03);
const GRIP_WRAPS = wraps(-0.1, 0.05, 0.028, 5);
const POMMEL = Shape.circle(-0.145, 0, 0.042);
const GUARD = Shape.d('M 0.055 -0.12 L 0.09 -0.12 L 0.09 0.12 L 0.055 0.12 Z', true);
const GUARD_L = Shape.circle(0.072, -0.12, 0.022);
const GUARD_R = Shape.circle(0.072, 0.12, 0.022);
const FALCHION = new Shape(
  mkPath(
    'M 0.09 0.036 L 0.88 0.042 L 0.975 0.03 C 0.92 -0.03, 0.82 -0.07, 0.62 -0.068 L 0.09 -0.036 Z',
  ),
  new Frame(0, -0.07, 0, 0.044),
);
const FULLER = mkPath('M 0.13 0.004 L 0.78 0.012');
const BLADE_HI = mkPath('M 0.14 0.028 L 0.86 0.034');
const BLADE_EDGE = mkPath('M 0.62 -0.066 C 0.82 -0.066, 0.92 -0.03, 0.972 0.03');
const FALCHION_RIVETS = rivetPath([0.12, 0.0, 0.18, 0.0], 0.008);

function sword(f: F, m: MilMats, fine: boolean): void {
  const c = f.ctx;
  paint(c, GRIP, m.leather, inkU(5));
  if (K.lod > 0) {
    c.lineWidth = inkU(2.4);
    c.strokeStyle = m.leatherDark.at(0);
    c.lineCap = 'round';
    c.stroke(GRIP_WRAPS);
  }
  paint(c, POMMEL, m.brass, inkU(5));
  paint(c, GUARD, fine ? m.steel : m.brass, inkU(5), true);
  paint(c, GUARD_L, m.brass, inkU(4));
  paint(c, GUARD_R, m.brass, inkU(4));
  paint(c, FALCHION, m.steel, inkU(5));
  if (K.lod > 0) {
    seam(c, FULLER, inkU(5), 0.4);
    streak(c, BLADE_HI, inkU(3), 0.7);
    if (K.lod === 2) {
      streak(c, BLADE_EDGE, inkU(2.4), 0.5, '#ffd9a0');
      glint(c, 0.92, 0.0, 0.034, 0.55 + 0.35 * Math.sin(f.t * 3.3));
    }
  }
  rivets(c, FALCHION_RIVETS, inkU(1.4));
}

// ── Spear: an ash pole with a salvaged leaf head and bill lugs ─

const SP_SHAFT = bar(-0.5, 1.32, 0.03);
const SP_WRAP = capsule(-0.12, 0.1, 0.036);
const SP_WRAPS = wraps(-0.1, 0.08, 0.034, 5);
const SP_HEAD = new Shape(
  mkPath('M 1.33 -0.034 C 1.4 -0.11, 1.52 -0.12, 1.66 0 C 1.52 0.12, 1.4 0.11, 1.33 0.034 Z'),
  new Frame(0, -0.12, 0, 0.12),
);
const SP_RIDGE = mkPath('M 1.36 0 L 1.62 0');
const SP_HI = mkPath('M 1.4 0.05 C 1.46 0.08, 1.52 0.07, 1.58 0.03');
const SP_LUG_A = Shape.d('M 1.3 0.03 L 1.25 0.15 L 1.36 0.1 Z', true);
const SP_LUG_B = Shape.d('M 1.3 -0.03 L 1.25 -0.15 L 1.36 -0.1 Z', true);
const SP_COLLAR = bar(1.26, 1.37, 0.05);
const SP_BIND = bar(0.96, 1.04, 0.038);
const SP_FR = new Frame(0, 0.12, 0, -0.12);
const SP_RIVETS = rivetPath([1.31, 0.03, 1.31, -0.03], 0.008);

function spear(f: F, m: MilMats): void {
  const c = f.ctx;
  paint(c, SP_SHAFT, m.wood, inkU(5));
  paint(c, SP_WRAP, m.leather, inkU(4.5));
  if (K.lod > 0) {
    c.lineWidth = inkU(2.2);
    c.strokeStyle = m.leatherDark.at(0);
    c.lineCap = 'round';
    c.stroke(SP_WRAPS);
  }
  paint(c, SP_BIND, m.red, inkU(3.5));
  paint(c, SP_LUG_A, m.steel, inkU(4), true);
  paint(c, SP_LUG_B, m.steel, inkU(4), true);
  paint(c, SP_HEAD, m.steel, inkU(5));
  if (K.lod > 0) {
    seam(c, SP_RIDGE, inkU(3.5), 0.45);
    streak(c, SP_HI, inkU(2.4), 0.65);
  }
  paint(c, SP_COLLAR, m.brass, inkU(4), false);
  rivets(c, SP_RIVETS, inkU(1.2));
  // Pennon in the side colour, snapping behind the head.
  flag(
    c,
    f.acc.as('cloth'),
    SP_FR,
    1.22,
    0.0,
    Math.PI * 0.98,
    0.1,
    0.44,
    0.2,
    0.03,
    0.26,
    f.t,
    0.5,
    f.drag,
    inkU(4),
    7,
  );
  if (K.lod > 0)
    flag(
      c,
      m.red,
      SP_FR,
      1.22,
      -0.02,
      Math.PI * 1.04,
      0.2,
      0.26,
      0.06,
      0.02,
      0.2,
      f.t,
      1.6,
      f.drag,
      inkU(3),
      5,
    );
}

// ── Maul: a smith's sledgehammer ──────────────────────────────

const MA_HAFT = bar(-0.14, 0.56, 0.032);
const MA_HEAD = new Shape(
  mkPath(
    'M 0.4 -0.1 L 0.45 -0.16 L 0.64 -0.17 L 0.68 -0.14 L 0.68 0.14 L 0.64 0.17 L 0.45 0.16 L 0.4 0.1 Z',
  ),
  new Frame(0, -0.17, 0, 0.17),
);
const MA_BANDS = mkPath('M 0.46 -0.155 L 0.46 0.155 M 0.62 -0.165 L 0.62 0.165');
const MA_FACE = mkPath('M 0.66 -0.12 L 0.66 0.12');
const MA_HI = mkPath('M 0.48 0.12 L 0.62 0.13');
const MA_COLLAR = bar(0.36, 0.42, 0.05);
const MA_RIVETS = rivetPath([0.52, 0, 0.58, 0], 0.012);

function maul(f: F, m: MilMats): void {
  const c = f.ctx;
  paint(c, MA_HAFT, m.wood, inkU(5));
  paint(c, GRIP, m.leather, inkU(4.5));
  if (K.lod > 0) {
    c.lineWidth = inkU(2.4);
    c.strokeStyle = m.leatherDark.at(0);
    c.lineCap = 'round';
    c.stroke(GRIP_WRAPS);
  }
  paint(c, POMMEL, m.brass, inkU(5));
  paint(c, MA_COLLAR, m.brass, inkU(4));
  paint(c, MA_HEAD, m.patch, inkU(5.5));
  if (K.lod > 0) {
    seam(c, MA_BANDS, inkU(3.5), 0.5);
    seam(c, MA_FACE, inkU(3), 0.4);
    streak(c, MA_HI, inkU(3), 0.55);
  }
  rivets(c, MA_RIVETS, inkU(1.4));
  void f;
}

// ── Fire-pot: clay, rope and a blazing rag ────────────────────

const POT = new Shape(
  mkPath(
    'M 0.03 0.0 C 0.04 -0.1, 0.2 -0.14, 0.31 -0.02 C 0.33 0.08, 0.26 0.17, 0.15 0.17 C 0.06 0.15, 0.03 0.08, 0.03 0.0 Z',
  ),
  new Frame(0.03, 0, 0.33, 0),
);
const POT_NECK = Shape.d('M 0.12 0.14 L 0.28 0.14 L 0.27 0.2 L 0.13 0.2 Z', true);
const POT_MOUTH = mkPath('M 0.13 0.2 L 0.27 0.2');
const POT_ROPE = mkPath('M 0.05 -0.05 L 0.3 0.08 M 0.12 -0.1 L 0.31 0.02 M 0.04 0.06 L 0.22 0.15');
const POT_BAND = mkPath('M 0.05 0.03 C 0.14 0.05, 0.24 0.02, 0.32 -0.02');
const FLAME = (() => {
  const p = mkPath();
  p.moveTo(0, 0.5);
  p.bezierCurveTo(0.55, 0.15, 0.35, -0.5, 0, -1);
  p.bezierCurveTo(-0.35, -0.5, -0.55, 0.15, 0, 0.5);
  p.closePath();
  return p;
})();

export function flame(
  f: F,
  x: number,
  y: number,
  r: number,
  ph: number,
  col: string,
  sway: number,
): void {
  const c = f.ctx;
  const u = upDir(f);
  c.save();
  c.translate(x, y);
  c.rotate(Math.atan2(u.y, u.x) - Math.PI / 2 + sway);
  c.scale(r, r * 1.5);
  c.globalAlpha = 0.9;
  flat(c, FLAME, col);
  c.globalAlpha = 1;
  void ph;
  c.restore();
}

function firepot(f: F, m: MilMats): void {
  const c = f.ctx;
  paint(c, POT, sw('#b86a3d', 'matte'), inkU(5));
  if (K.lod > 0) {
    c.lineWidth = inkU(7);
    c.lineCap = 'round';
    c.strokeStyle = '#0e1118';
    c.stroke(POT_ROPE);
    c.lineWidth = inkU(4);
    c.strokeStyle = cord().at(0);
    c.stroke(POT_ROPE);
    c.strokeStyle = cord().at(2);
    c.lineWidth = inkU(1.5);
    c.stroke(POT_BAND);
  }
  paint(c, POT_NECK, sw('#a35a31', 'matte'), inkU(4.5), true);
  flat(c, POT_MOUTH, '#000');
  void m;
  // The wick rag blazes: layered flames, a hot core, smoke drifting up.
  const t = f.t;
  glow(c, 'ember', 0.2, 0.26, 0.2, 0.2, 0.55 + 0.2 * Math.sin(t * 13));
  const u = upDir(f);
  for (let i = 0; i < 4; i++) {
    const k = (t * 1.8 + i / 4) % 1;
    const r = 0.085 * (1 - k * 0.6);
    flame(
      f,
      0.2 + u.x * k * 0.26 + Math.sin(t * 9 + i * 2) * 0.02,
      0.22 + u.y * k * 0.26,
      r,
      i,
      i % 2 ? '#ffc23a' : '#ff6a1a',
      Math.sin(t * 8 + i) * 0.2,
    );
  }
  flame(f, 0.2, 0.23, 0.06, 0, '#fff3b0', Math.sin(t * 11) * 0.12);
  for (let i = 0; i < 3; i++) {
    const ph = (t * 0.8 + i / 3) % 1;
    glow(
      c,
      'steam',
      0.2 + u.x * (0.3 + ph * 0.3) + Math.sin(t * 3 + i) * 0.02,
      0.24 + u.y * (0.3 + ph * 0.3),
      0.03 + ph * 0.05,
      0.03 + ph * 0.05,
      (1 - ph) * 0.7,
    );
  }
}

const CARRIED = new Set<WeaponStyle>(['sword', 'spear', 'maul', 'arquebus', 'firepot', 'grenade']);

/**
 * Draws a militia or gunner weapon in weapon space (the caller has rotated to the weapon axis).
 * Returns false for a style this pair does not carry (the caller then draws the default).
 */
export function militiaWeapon(f: F, style: WeaponStyle): boolean {
  if (!CARRIED.has(style)) return false;
  const m = milMats(f);
  const gunner = f.spec.model === 'gunner';
  switch (style) {
    case 'sword':
      sword(f, m, gunner);
      return true;
    case 'spear':
      spear(f, m);
      return true;
    case 'maul':
      maul(f, m);
      return true;
    case 'arquebus':
      gunnerArquebus(f, !gunner);
      return true;
    case 'firepot':
      firepot(f, m);
      return true;
    case 'grenade':
      gunnerGrenade(f);
      return true;
    default:
      return false;
  }
}
