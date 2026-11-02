import {
  Frame,
  K,
  Shape,
  disc,
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
import type { F, Palette } from './types';

/**
 * The arquebus and the grenade (frames moschetta, and the militia's rougher guns), in the
 * Cavaliere's style. Weapon space: origin at the gripping hand, +x along the barrel, +y up (the
 * lock side). The match is lit and smoulders; a smoke wisp curls off it.
 */

interface GunMats {
  steel: Swatch;
  iron: Swatch;
  brass: Swatch;
  wood: Swatch;
  woodRough: Swatch;
  leather: Swatch;
  cord: Swatch;
  grenade: Swatch;
}
const MATS = new WeakMap<Palette, GunMats>();
function mats(f: F): GunMats {
  let m = MATS.get(f.p);
  if (!m) {
    m = {
      steel: sw(f.hero ? '#eef0f5' : '#a9b0bd', f.hero ? 'enamel' : 'metal'),
      iron: sw('#5d6068', 'metal'),
      brass: sw(f.hero ? '#e0b445' : '#d6a548', 'metal'),
      wood: sw('#7c4a26', 'matte'),
      woodRough: sw('#8d6a40', 'matte'),
      leather: sw('#6b4425', 'matte'),
      cord: sw('#6e5a3e', 'matte'),
      grenade: sw('#3c3f47', 'metal'),
    };
    MATS.set(f.p, m);
  }
  return m;
}

/** A horizontal bar centred on v with a cylinder gradient across it. */
function barV(x0: number, x1: number, v: number, hw: number): Shape {
  return new Shape(
    mkPath(`M ${x0} ${v - hw} L ${x1} ${v - hw} L ${x1} ${v + hw} L ${x0} ${v + hw} Z`),
    new Frame(0, v - hw, 0, v + hw),
  );
}

// ── Arquebus ──────────────────────────────────────────────────

const STOCK = new Shape(
  mkPath(
    'M -0.36 0.07 C -0.35 -0.01, -0.3 -0.075, -0.2 -0.085 L 0.06 -0.078 L 0.5 -0.04 L 0.52 0.0 L 0.1 0.03 ' +
      'C 0.0 0.06, -0.08 0.1, -0.2 0.115 C -0.3 0.125, -0.355 0.105, -0.36 0.07 Z',
  ),
  new Frame(0, -0.09, 0, 0.12),
);
const STOCK_HI = mkPath('M -0.3 0.07 C -0.24 0.0, -0.1 -0.02, 0.4 -0.012');
const BUTT = Shape.d('M -0.368 0.0 L -0.34 -0.01 L -0.335 0.13 L -0.37 0.12 Z', true);
const BARREL = barV(0.06, 1.0, 0.03, 0.034);
const BARREL_HI = mkPath('M 0.1 0.045 L 0.96 0.045');
const MUZZLE = barV(0.95, 1.0, 0.03, 0.05);
const BANDS = [0.3, 0.55, 0.78].map((x) => barV(x - 0.014, x + 0.014, 0.03, 0.046));
const LOCK = Shape.d('M 0.02 -0.02 L 0.2 -0.02 L 0.22 0.06 L 0.04 0.09 Z');
const PAN = Shape.d('M 0.12 0.06 L 0.19 0.06 L 0.18 0.1 L 0.13 0.1 Z', true);
const SERPENT = mkPath(
  'M 0.07 0.04 C 0.03 0.1, 0.02 0.15, 0.05 0.2 C 0.07 0.16, 0.08 0.14, 0.1 0.12',
);
const RAMROD = mkPath('M 0.12 -0.005 L 0.94 0.0');
const LASH = (() => {
  const p = mkPath();
  for (const x of [0.2, 0.28, 0.4, 0.48]) {
    p.moveTo(x, -0.04);
    p.lineTo(x + 0.02, 0.07);
  }
  return p;
})();
const LOCK_RIVETS = rivetPath([0.05, 0.0, 0.17, 0.0], 0.009);
const SX = 0.07;
const SY = 0.2;

function matchGlow(f: F, x: number, y: number): void {
  const c = f.ctx;
  const t = f.t;
  glow(c, 'ember', x, y, 0.07, 0.07, 0.6 + 0.3 * Math.sin(t * 17));
  c.beginPath();
  c.arc(x, y, 0.014, 0, Math.PI * 2);
  c.fillStyle = '#fff3b0';
  c.fill();
  // A smoke wisp curling up from the tip (up is world up, whatever the weapon's angle).
  const r = f.wAng - Math.PI / 2;
  const ux = Math.sin(r);
  const uy = Math.cos(r);
  const n = K.lod === 0 ? 2 : 4;
  for (let i = 0; i < n; i++) {
    const ph = (t * 0.7 + i / n) % 1;
    const sway = Math.sin(t * 3 + i * 1.7) * 0.03 * ph;
    glow(
      c,
      'steam',
      x + ux * ph * 0.34 + uy * sway,
      y + uy * ph * 0.34 - ux * sway,
      0.016 + ph * 0.04,
      0.016 + ph * 0.04,
      (1 - ph) * 0.65,
    );
  }
}

/** The matchlock arquebus. `rough` is the militia's: a plain stock lashed with cord, rusty iron. */
export function gunnerArquebus(f: F, rough: boolean): void {
  const c = f.ctx;
  const m = mats(f);
  const lod = K.lod;
  paint(c, STOCK, rough ? m.woodRough : m.wood, inkU(5));
  if (lod > 0) streak(c, STOCK_HI, inkU(3), 0.4);
  paint(c, BUTT, rough ? m.leather : m.brass, inkU(4), true);
  if (lod > 0) {
    c.lineWidth = inkU(2.2);
    c.strokeStyle = '#0e1118';
    c.lineCap = 'round';
    c.globalAlpha = 0.5;
    c.stroke(RAMROD);
    c.globalAlpha = 1;
  }
  paint(c, BARREL, rough ? m.iron : m.steel, inkU(5));
  if (lod > 0) streak(c, BARREL_HI, inkU(2.4), rough ? 0.35 : 0.7);
  if (rough) {
    c.lineWidth = inkU(5);
    c.lineCap = 'round';
    c.strokeStyle = m.cord.at(0);
    c.stroke(LASH);
  } else {
    for (const b of BANDS) paint(c, b, m.brass, inkU(3.5));
  }
  paint(c, MUZZLE, m.brass, inkU(4));
  paint(c, LOCK, m.brass, inkU(4));
  rivets(c, LOCK_RIVETS, inkU(1.2));
  paint(c, PAN, m.iron, inkU(3.5), true);
  // Serpentine arm with the match clamped in it.
  c.lineWidth = inkU(9);
  c.strokeStyle = '#0e1118';
  c.stroke(SERPENT);
  c.lineWidth = inkU(5);
  c.strokeStyle = m.iron.at(0);
  c.stroke(SERPENT);
  const sway = Math.sin(f.t * 3) * 0.012;
  c.beginPath();
  c.moveTo(SX, SY);
  c.quadraticCurveTo(SX - 0.07, SY + 0.05 + sway, SX - 0.1, SY - 0.04);
  c.quadraticCurveTo(SX - 0.15, SY - 0.12 + sway, SX - 0.26, SY - 0.1);
  c.lineWidth = inkU(5);
  c.strokeStyle = '#0e1118';
  c.stroke();
  c.lineWidth = inkU(2.8);
  c.strokeStyle = m.cord.at(2);
  c.stroke();
  matchGlow(f, SX + 0.015, SY + 0.012);
}

// ── Grenade ───────────────────────────────────────────────────

const G_MERIDIAN = (() => {
  const p = mkPath();
  p.ellipse(0.14, 0.02, 0.05, 0.12, 0, 0, Math.PI * 2);
  return p;
})();
const G_EQUATOR = (() => {
  const p = mkPath();
  p.ellipse(0.14, 0.02, 0.12, 0.04, 0, 0, Math.PI * 2);
  return p;
})();
const G_NECK = Shape.d('M 0.1 0.12 L 0.18 0.12 L 0.17 0.16 L 0.11 0.16 Z', true);
const G_STRAP = Shape.d('M 0.02 -0.01 L 0.26 -0.01 L 0.26 0.03 L 0.02 0.03 Z', true);
const G_HI = mkPath('M 0.07 0.07 C 0.08 0.1, 0.1 0.11, 0.12 0.11');

/** A cast-iron hand grenade with a burning fuse. */
export function gunnerGrenade(f: F): void {
  const c = f.ctx;
  const m = mats(f);
  const lod = K.lod;
  disc(c, m.grenade, 0.14, 0.02, 0.12, inkU(5));
  if (lod > 0) {
    seam(c, G_MERIDIAN, inkU(3), 0.6);
    seam(c, G_EQUATOR, inkU(3), 0.6);
    streak(c, G_HI, inkU(3), 0.5);
  }
  paint(c, G_STRAP, m.brass, inkU(4), true);
  paint(c, G_NECK, m.brass, inkU(4), true);
  // Fuse: a short cord with a spark and a trail of smoke.
  const t = f.t;
  const sway = Math.sin(t * 7) * 0.012;
  c.beginPath();
  c.moveTo(0.14, 0.16);
  c.quadraticCurveTo(0.17, 0.22 + sway, 0.22, 0.2);
  c.lineWidth = inkU(5);
  c.strokeStyle = '#0e1118';
  c.stroke();
  c.lineWidth = inkU(2.6);
  c.strokeStyle = m.cord.at(2);
  c.stroke();
  matchGlow(f, 0.225, 0.2);
}
