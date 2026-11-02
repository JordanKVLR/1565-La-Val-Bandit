import {
  Frame,
  K,
  RS,
  Shape,
  flag,
  glint,
  inkR,
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
import type { F } from './types';

/**
 * The Order's weapons in the knight's style (steel with a bright band, brass fittings, leather
 * grips), drawn in WEAPON SPACE like the rest of weapons.ts: the origin is the gripping hand, +x
 * runs along the weapon. Authored in the reference's own pixels where the hand is at py = -24 and
 * the blade runs along +py, then mapped by `weaponIn`.
 */

interface ArmMats {
  steel: Swatch;
  brass: Swatch;
  leather: Swatch;
  wood: Swatch;
}
const MAT = new WeakMap<object, ArmMats>();
function mats(f: F): ArmMats {
  let m = MAT.get(f.p);
  if (!m) {
    m = {
      steel: f.p.armour.as('metal'),
      brass: sw(f.hero ? (f.p.trim.c[0] as string) : '#d9a443', 'metal'),
      leather: sw('#7a4a22', 'matte'),
      wood: sw('#6b4a2b', 'matte'),
    };
    MAT.set(f.p, m);
  }
  return m;
}

/** Maps reference pixels (px across, py along the weapon, hand at py = -24) to weapon space. */
function weaponIn(ctx: F['ctx']): void {
  ctx.save();
  ctx.transform(0, RS, RS, 0, 24 * RS, 0);
}

const GRIP = Shape.d(
  'M -16 -70 L 16 -70 Q 18 -70 18 -62 L 18 18 Q 18 26 10 26 L -10 26 Q -18 26 -18 18 L -18 -62 Q -18 -70 -16 -70 Z',
);
const GRIP_WRAP = (() => {
  const p = mkPath();
  for (let i = 0; i < 5; i++) {
    p.moveTo(-9, -62 + i * 18);
    p.lineTo(9, -52 + i * 18);
  }
  return p;
})();
const POMMEL = Shape.circle(0, -82, 17);
const POMMEL_IN = Shape.circle(0, -82, 7, true);
const GUARD = Shape.d(
  'M -80 30 C -52 18, -22 34, 0 30 C 22 34, 52 18, 80 30 L 80 48 C 52 38, 22 54, 0 50 C -22 54, -52 38, -80 48 Z',
  true,
);
const GUARD_L = Shape.circle(-80, 39, 10);
const GUARD_R = Shape.circle(80, 39, 10);
const BLADE = Shape.d('M -22 48 L -22 470 L 0 520 L 22 470 L 22 48 Z');
const BLADE_RIDGE = mkPath('M 0 54 L 0 500');
const BLADE_HI = mkPath('M -13 58 L -13 470');
const BLADE_HI2 = mkPath('M 17 62 L 17 462');
const BLADE_EDGE = mkPath('M -22 48 L -22 470 L 0 520');

/** The arming sword: leather grip, brass pommel and quillons, a long steel blade with a ridge. */
export function knightSword(f: F): void {
  const c = f.ctx;
  const m = mats(f);
  weaponIn(c);
  paint(c, GRIP, m.leather, inkR(5));
  if (K.lod > 0) {
    c.lineWidth = inkR(2.5);
    c.strokeStyle = m.brass.at(0);
    c.stroke(GRIP_WRAP);
  }
  paint(c, POMMEL, m.brass, inkR(5));
  paint(c, POMMEL_IN, m.steel, inkR(3), true);
  paint(c, GUARD, m.brass, inkR(5), true);
  paint(c, GUARD_L, m.brass, inkR(4));
  paint(c, GUARD_R, m.brass, inkR(4));
  paint(c, BLADE, m.steel, inkR(5));
  if (K.lod > 0) {
    seam(c, BLADE_RIDGE, inkR(5), 0.45);
    streak(c, BLADE_HI, inkR(3.5), 0.75);
    if (K.lod === 2) {
      streak(c, BLADE_HI2, inkR(2), 0.28);
      streak(c, BLADE_EDGE, inkR(2.5), 0.4, '#ffd9a0');
      glint(c, 0, 494, 20, 0.6 + 0.35 * Math.sin(f.t * 3.3));
    }
  }
  c.restore();
}

// ── Mace ──────────────────────────────────────────────────────

const HAFT = Shape.d('M -14 -40 L 14 -40 L 12 300 L -12 300 Z');
const MACE_HEAD = (() => {
  const p = mkPath();
  const n = 8;
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? 74 : 46;
    const x = Math.cos(a) * r * 0.82;
    const y = 340 + Math.sin(a) * r;
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  p.closePath();
  return new Shape(p, new Frame(-62, 0, 62, 0));
})();
const COLLAR = Shape.d('M -24 262 L 24 262 L 22 286 L -22 286 Z', true);
const MACE_RING = Shape.circle(0, 340, 22);
const MACE_RIVETS = rivetPath([-12, 270, 12, 270], 3.4);

/** The flanged mace: leather grip, brass pommel and collar, a steel head of eight flanges. */
export function knightMace(f: F): void {
  const c = f.ctx;
  const m = mats(f);
  weaponIn(c);
  paint(c, HAFT, m.wood, inkR(5));
  paint(c, GRIP, m.leather, inkR(5));
  if (K.lod > 0) {
    c.lineWidth = inkR(2.5);
    c.strokeStyle = m.brass.at(0);
    c.stroke(GRIP_WRAP);
  }
  paint(c, POMMEL, m.brass, inkR(5));
  paint(c, COLLAR, m.brass, inkR(4), true);
  rivets(c, MACE_RIVETS, inkR(1.5));
  paint(c, MACE_HEAD, m.steel, inkR(5.5));
  paint(c, MACE_RING, m.brass, inkR(4));
  c.restore();
}

// ── Spear ─────────────────────────────────────────────────────

const SP_HEAD = new Shape(
  mkPath('M 1.3 -0.03 L 1.4 -0.1 L 1.52 -0.12 L 1.7 0 L 1.52 0.12 L 1.4 0.1 L 1.3 0.03 Z'),
  new Frame(0, -0.12, 0, 0.12),
);
const SP_COLLAR = new Shape(
  mkPath('M 1.24 -0.05 L 1.34 -0.05 L 1.34 0.05 L 1.24 0.05 Z'),
  new Frame(0, -0.05, 0, 0.05),
);
const SP_SHAFT = new Shape(
  mkPath('M -0.5 -0.032 L 1.3 -0.03 L 1.3 0.03 L -0.5 0.032 Z'),
  new Frame(0, -0.032, 0, 0.032),
);
const SP_HI = mkPath('M 1.34 0.01 L 1.6 0.01');
const SP_PENNON = new Frame(0, 0.12, 0, -0.12);

/** The spear: a long haft, brass socket, a steel leaf head and a pennon in the side colour. */
export function knightSpear(f: F): void {
  const c = f.ctx;
  const m = mats(f);
  paint(c, SP_SHAFT, m.wood, inkU(5));
  paint(c, SP_HEAD, m.steel, inkU(5));
  paint(c, SP_COLLAR, m.brass, inkU(4));
  if (K.lod > 0) streak(c, SP_HI, inkU(2.5), 0.6);
  flag(
    c,
    f.acc.as('cloth'),
    SP_PENNON,
    1.26,
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
}
