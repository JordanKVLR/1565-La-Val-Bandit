import {
  Frame,
  K,
  Shape,
  Tube,
  band,
  disc,
  flag,
  flat,
  glint,
  glow,
  inkR,
  inkU,
  joint,
  mkPath,
  paint,
  paintTube,
  refIn,
  refOut,
  rivetPath,
  rivets,
  seam,
  streak,
  sw,
} from './kit';
import type { Ctx, Swatch } from './kit';
import type { F, LimbStyle, Look, Palette } from './types';

/**
 * The Scala's steam armaturas (frames prototipo and colossus): riveted gunmetal hulls, a copper
 * boiler on the back with two exhaust stacks, a furnace window in the chest, a lantern head with a
 * glowing slit, cogs and pistons at every joint and heavy clamp hands. Static plates are authored
 * in reference pixels (570 px = 1 world unit, y down) with the origin at the hip, built with the
 * kit in kit.ts (docs/art/FIGURE_STYLE.md). The colossus is the same machine built much bigger:
 * broader hull, thicker limbs, a hunched head, a bigger boiler and a third stack.
 */

// ── Materials ─────────────────────────────────────────────────

export interface Mats {
  iron: Swatch;
  ironFar: Swatch;
  copper: Swatch;
  copperFar: Swatch;
  brass: Swatch;
  dark: Swatch;
  leather: Swatch;
  white: Swatch;
}
const MATS = new WeakMap<Palette, Mats>();

function darker(hex: string, k = 0.6): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number): string =>
    Math.round(v * k + 22 * (1 - k))
      .toString(16)
      .padStart(2, '0');
  return '#' + ch((n >> 16) & 255) + ch((n >> 8) & 255) + ch(n & 255);
}

export function mats(f: F): Mats {
  let m = MATS.get(f.p);
  if (!m) {
    const iron = f.hero ? '#dfe3ec' : '#7a808f';
    const copper = f.hero ? '#e6e9f0' : '#bf6d3a';
    const kind = f.hero ? 'enamel' : 'metal';
    m = {
      iron: sw(iron, kind),
      ironFar: sw(darker(iron), kind),
      copper: sw(copper, kind),
      copperFar: sw(darker(copper), kind),
      brass: sw(f.hero ? (f.p.trim.c[0] as string) : '#d9a443', 'metal'),
      dark: sw('#2a2c36', 'metal'),
      leather: sw('#5b3b20', 'matte'),
      white: sw('#f1ead8', 'soft'),
    };
    MATS.set(f.p, m);
  }
  return m;
}

// ── Class sizes ───────────────────────────────────────────────

/** The rig's own girth per class (rig.ts GIRTH) and our extra hull size, limb and head factors. */
const GI = [0.88, 1, 1.22] as const;
const SZ = [1, 1, 1.12] as const;
const ARM_K = [1.1, 1.2, 1.5] as const;
const LEG_K = [1.05, 1.2, 1.38] as const;
const HEAD_K = [1.0, 1.1, 1.24] as const;

/** Radii of limb segments in reference px for a class (from rig.ts: 0.078, 0.066, 0.11, 0.084). */
const armPx = (cls: number, seg: 0 | 1): number =>
  (seg === 0 ? 0.078 : 0.066) * (GI[cls] as number) * (ARM_K[cls] as number) * 570;
const legPx = (cls: number, seg: 2 | 3): number =>
  (seg === 2 ? 0.11 : 0.084) * (GI[cls] as number) * (LEG_K[cls] as number) * 570;

// ── Path helpers ──────────────────────────────────────────────

function rr(x: number, y: number, w: number, h: number, r: number): string {
  return (
    `M ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} ` +
    `L ${x + w} ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} ` +
    `L ${x + r} ${y + h} Q ${x} ${y + h} ${x} ${y + h - r} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} Z`
  );
}

const COGS = new Map<number, Shape>();
/** A unit-radius cog of `n` teeth (scaled by the caller). */
function cogShape(n: number): Shape {
  let s = COGS.get(n);
  if (!s) {
    const p = mkPath();
    const step = (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) {
      const a = i * step;
      const pts: readonly [number, number][] = [
        [a - step * 0.32, 0.8],
        [a - step * 0.2, 1],
        [a + step * 0.2, 1],
        [a + step * 0.32, 0.8],
      ];
      for (let k = 0; k < 4; k++) {
        const [aa, r] = pts[k] as readonly [number, number];
        const x = Math.cos(aa) * r;
        const y = Math.sin(aa) * r;
        if (i === 0 && k === 0) p.moveTo(x, y);
        else p.lineTo(x, y);
      }
    }
    p.closePath();
    s = new Shape(p, new Frame(-1, 0, 1, 0));
    COGS.set(n, s);
  }
  return s;
}

/** A toothed brass cog of radius `r` spun to `rot` with an iron hub (any space). */
export function cog(
  c: Ctx,
  mat: Swatch,
  hub: Swatch,
  x: number,
  y: number,
  r: number,
  n: number,
  rot: number,
  lw: number,
): void {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(r, r);
  paint(c, cogShape(K.lod === 0 ? 8 : n), mat, lw / r);
  c.restore();
  if (K.lod > 0) disc(c, hub, x, y, r * 0.38, lw * 0.8);
}

// ── Torso (reference origin: the hip) ─────────────────────────

const CHEST = Shape.d(
  'M -88 -90 C -118 -170, -124 -270, -96 -336 C -70 -378, 70 -384, 104 -342 C 130 -280, 124 -170, 96 -90 C 40 -66, -32 -66, -88 -90 Z',
);
const CHEST_HI = mkPath('M -92 -130 C -108 -190, -108 -270, -86 -322');
const CHEST_RIM = mkPath('M 118 -180 C 126 -236, 118 -290, 100 -334');
const CHEST_SEAM = mkPath('M -20 -92 C -26 -170, -26 -270, -10 -366');
const BAND_UP = mkPath('M -104 -300 C -30 -274, 60 -276, 114 -304');
const BAND_UP_FR = new Frame(0, -304, 0, -274);
const BAND_LO = mkPath('M -96 -126 C -20 -102, 50 -104, 104 -128');
const BAND_LO_FR = new Frame(0, -128, 0, -102);
const BAND_RIVETS = rivetPath(
  [-78, -292, -34, -284, 20, -283, 66, -288, 100, -299, -70, -116, -26, -108, 24, -107, 70, -112],
  4.2,
);
const COLLAR = Shape.d(
  'M -58 -372 C -40 -420, 60 -424, 84 -372 L 94 -330 C 30 -306, -36 -308, -72 -334 Z',
  true,
);
const COLLAR_LINES = mkPath('M -64 -352 C -10 -332, 40 -332, 86 -352');
const FURN_RING = Shape.circle(10, -192, 54);
const FURN_PIT = Shape.circle(10, -192, 40, true);
const FURN_RIVETS = rivetPath(
  Array.from({ length: 8 }, (_, i) => [
    10 + Math.cos((i / 8) * Math.PI * 2) * 47,
    -192 + Math.sin((i / 8) * Math.PI * 2) * 47,
  ]).flat(),
  3.6,
);
const GRATE = (() => {
  const p = mkPath();
  for (let i = -3; i <= 3; i++) {
    const dx = i * 12;
    const h = Math.sqrt(Math.max(0, 38 * 38 - dx * dx));
    p.moveTo(10 + dx, -192 - h);
    p.lineTo(10 + dx, -192 + h);
  }
  return p;
})();
const SUN_RAYS = (() => {
  const p = mkPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    p.moveTo(10 + Math.cos(a) * 58, -192 + Math.sin(a) * 58);
    p.lineTo(10 + Math.cos(a) * 76, -192 + Math.sin(a) * 76);
  }
  return p;
})();
const GAUGE_FACE = Shape.circle(0, 0, 19);
const WAIST = Shape.d('M -78 -96 L 92 -96 L 86 -22 L -72 -22 Z', true);
const WAIST_RIBS = mkPath(
  'M -76 -80 L 90 -80 M -75 -64 L 89 -64 M -74 -48 L 88 -48 M -73 -34 L 87 -34',
);
const WAIST_ACC = Shape.d('M -77 -84 L 91 -84 L 90 -58 L -75 -58 Z', true);

// ── Back: boiler, stacks, pipes ───────────────────────────────

const TANK = Shape.d(rr(-208, -418, 142, 330, 58));
const TANK_BANDS = Shape.d(
  [-380, -310, -240, -170, -110].map((y) => rr(-214, y, 154, 14, 6)).join(' '),
);
const TANK_RIVETS = rivetPath(
  [-380, -310, -240, -170, -110].flatMap((y) => [-200, y + 7, -137, y + 7, -74, y + 7]),
  3.4,
);
const TANK_HI = mkPath('M -190 -380 C -196 -300, -196 -190, -186 -112');
const DOME = Shape.d(rr(-172, -452, 70, 40, 16), true);
const STACK_A = Shape.d(rr(-184, -578, 36, 140, 6));
const STACK_B = Shape.d(rr(-122, -532, 30, 100, 6));
const STACK_C = Shape.d(rr(-86, -490, 24, 70, 5));
const RIM_A = Shape.d(rr(-192, -590, 52, 18, 6), true);
const RIM_B = Shape.d(rr(-128, -544, 42, 16, 6), true);
const RIM_C = Shape.d(rr(-90, -500, 32, 14, 5), true);
const STACK_BANDS = Shape.d(rr(-188, -520, 44, 12, 4) + ' ' + rr(-126, -486, 38, 10, 4), true);
const DRUM = Shape.d(rr(-262, -170, 150, 96, 40));
const DRUM_BAND = Shape.d(rr(-210, -176, 14, 108, 5), true);
const DOOR = Shape.circle(-190, -122, 30);
const DOOR_RIVETS = rivetPath(
  Array.from({ length: 6 }, (_, i) => [
    -190 + Math.cos((i / 6) * Math.PI * 2) * 25,
    -122 + Math.sin((i / 6) * Math.PI * 2) * 25,
  ]).flat(),
  3,
);
const PIPE_TOP = mkPath('M -76 -392 C -30 -430, 14 -426, 38 -384');
const PIPE_TOP_FR = new Frame(0, -428, 0, -384);
const PIPE_LOW = mkPath('M -112 -112 C -90 -80, -60 -70, -20 -78');
const PIPE_LOW_FR = new Frame(0, -112, 0, -70);
/** Stack tops in reference px (hip origin), used for the steam, sparks and the pennant. */
const STACKS = [
  [-166, -592],
  [-107, -546],
  [-74, -502],
] as const;

// ── Head (reference origin: the head centre) ──────────────────

const NECK = Shape.d('M -40 40 L 62 40 L 74 100 L -48 100 Z', true);
const HEAD = Shape.d(
  'M -62 -64 C -62 -86, -40 -92, -14 -92 L 56 -92 C 82 -92, 94 -78, 94 -54 L 98 34 C 98 62, 80 76, 50 76 L -28 76 C -52 76, -64 62, -64 36 Z',
);
const HEAD_HI = mkPath('M -52 -60 C -54 -30, -54 20, -48 52');
const HEAD_CAP = Shape.d('M -56 -84 C -46 -134, 66 -138, 88 -84 Z', true);
const HEAD_RIM = Shape.d('M -68 -90 L 100 -90 L 98 -68 L -66 -68 Z', true);
const HEAD_BAND = Shape.d('M -64 -62 L 96 -62 L 96 -44 L -64 -44 Z', true);
const FINIAL = Shape.d('M 6 -126 L 34 -126 L 30 -158 L 10 -158 Z', true);
const FINIAL_TOP = Shape.d(rr(2, -170, 36, 14, 5), true);
const VISOR_WELL = Shape.d(
  'M 18 -34 L 90 -30 C 98 -30, 98 14, 90 16 L 18 12 C 10 12, 10 -34, 18 -34 Z',
);
const SLIT = Shape.d('M 26 -20 L 92 -17 L 92 -3 L 26 -6 Z');
const SLIT_LIGHT = mkPath('M 40 -13 L 88 -11');
const LENS = Shape.circle(-18, -4, 22);
const LENS_IN = Shape.circle(-18, -4, 11, true);
const VENTS = (() => {
  const p = mkPath();
  for (let i = 0; i < 5; i++) {
    p.moveTo(40 + i * 11, 26);
    p.lineTo(40 + i * 11, 56);
  }
  return p;
})();
const HEAD_RIVETS = rivetPath([-48, -78, -48, 60, 60, 62, 86, -78, -46, 20], 4);
const ANT = mkPath('M -44 -86 C -60 -130, -70 -150, -66 -170');

// ── Shoulder, elbow, hand, hip ────────────────────────────────

function dome(r: number, off: number): Shape {
  return new Shape(
    mkPath(
      `M ${-r} ${off} A ${r} ${r * 0.9} 0 0 1 ${r * 0.92} ${off - 10} L ${r * 0.84} ${off + 26} ` +
        `Q 0 ${off + 40} ${-r} ${off + 14} Z`,
    ),
    new Frame(-r, 0, r, 0),
  );
}
const DOMES = [dome(72, 36), dome(66, 18), dome(58, 0)];
const DOME_HI = mkPath('M -52 -6 A 54 48 0 0 1 40 -28');
const VALVE = Shape.d('M -50 -34 L -28 -40 L -26 -64 L -52 -58 Z', true);
const VALVE_CAP = Shape.d(rr(-62, -76, 40, 14, 6), true);
const DOME_RIVETS = rivetPath([-48, 12, -16, -14, 22, -14, 54, 8], 4.6);
const ARMBAND = Shape.d('M -44 78 Q 0 92 44 78 L 45 112 Q 0 126 -45 112 Z', true);
const COUTER = Shape.d('M -34 -8 L -70 22 L -30 32 Z', true);
const PISTON_FORE = Shape.d(rr(34, 20, 26, 92, 8));
const PISTON_FORE_ROD = Shape.d(rr(41, 100, 12, 56, 5));
const PISTON_FORE_RING = Shape.d(rr(30, 40, 34, 8, 4) + ' ' + rr(30, 76, 34, 8, 4), true);
const CUFF = Shape.d(rr(-44, -44, 88, 20, 7), true);
const PALM = Shape.d(rr(-40, -32, 80, 60, 14));
const PALM_HI = mkPath('M -30 -24 C -34 -6, -32 10, -26 20');
const JAW_F = Shape.d('M 20 -4 C 62 4, 66 38, 40 56 L 12 50 L 4 14 Z', true);
const JAW_B = Shape.d('M -20 -4 C -62 4, -66 38, -40 56 L -12 50 L -4 14 Z', true);
const HAND_BOLTS = rivetPath([-30, -14, 30, -14, -26, 32, 26, 32], 4);
const HYDRO = Shape.d(rr(-14, -48, 28, 36, 8), true);

const THIGH_PISTON = Shape.d(rr(0, 70, 30, 150, 9));
const THIGH_PISTON_ROD = Shape.d(rr(8, 206, 14, 70, 5));
const THIGH_PISTON_RING = Shape.d(rr(-4, 100, 38, 9, 4) + ' ' + rr(-4, 170, 38, 9, 4), true);
const POLEYN = Shape.d('M -40 -26 L 62 -12 L 46 30 L -36 20 Z', true);
const SHIN_STRUT = Shape.d(rr(0, 30, 24, 120, 8));
const SHIN_STRUT_ROD = Shape.d(rr(6, 140, 12, 70, 5));

const PELVIS = Shape.d('M -96 -34 L 108 -34 L 120 44 C 108 96, -84 96, -108 44 Z', true);
const PELVIS_BELT = Shape.d('M -100 -26 L 112 -26 L 114 12 L -102 12 Z', true);
const PELVIS_RIVETS = rivetPath([-82, -7, -40, -7, 40, -7, 82, -7], 4);
const TASSETS: Shape[] = [];
const TASSET_RIVETS: Path2D[] = [];
for (const [dx, dy, w, h] of [
  [-12, 14, 128, 84],
  [0, 54, 120, 80],
  [14, 92, 104, 72],
] as const) {
  const x = -52 + dx;
  TASSETS.push(
    Shape.d(
      `M ${x} ${dy} L ${x + w} ${dy} L ${x + w - 8} ${dy + h * 0.7} L ${x + w * 0.5} ${dy + h} L ${x + 8} ${dy + h * 0.7} Z`,
    ),
  );
  TASSET_RIVETS.push(rivetPath([x + 16, dy + 14, x + w - 16, dy + 14], 3.6));
}
const FR_APRON = new Frame(0, 0.15, 0, -0.35);

const FOOT = Shape.d('M -64 -14 L 56 -20 C 110 -6, 160 14, 206 40 L 204 66 L -68 66 Z', true);
const FOOT_TOE = Shape.d('M 138 6 C 170 16, 196 30, 208 42 L 206 66 L 138 66 Z');
const FOOT_SOLE = Shape.d('M -68 52 L 206 52 L 204 70 L -70 70 Z', true);
const FOOT_SEAM = mkPath('M -20 14 C 30 14, 80 22, 134 40');
const FOOT_TREAD = (() => {
  const p = mkPath();
  for (let i = 0; i < 7; i++) {
    p.moveTo(-50 + i * 36, 54);
    p.lineTo(-50 + i * 36, 68);
  }
  return p;
})();
const ANKLE = Shape.d(rr(-60, -28, 120, 22, 8), true);

// ── Limb tubes (built once per class and segment) ─────────────

const TUBES: (Tube | undefined)[] = [];
const RINGS = new WeakMap<Tube, Shape>();
function tube(seg: number, cls: number, len: number, r0: number, r1: number): Tube {
  const i = seg * 3 + cls;
  let t = TUBES[i];
  if (!t || t.r0 !== r0 || t.len !== len) {
    t = new Tube(len, r0, r1, 1, seg === 2 ? 0.02 : seg === 3 ? 0.012 : 0.008);
    TUBES[i] = t;
  }
  return t;
}
function ringOf(t: Tube): Shape {
  let s = RINGS.get(t);
  if (!s) {
    const w = (t.r0 + t.r1) / 2 + 0.014;
    const y = -t.len * 0.5;
    const p = mkPath();
    p.rect(-w, y - 0.018, w * 2, 0.036);
    s = new Shape(p, new Frame(-w, 0, w, 0));
    RINGS.set(t, s);
  }
  return s;
}

function limbs(f: F): LimbStyle {
  void f;
  return { upper: 'armour', fore: 'armour', thigh: 'armour', shin: 'armour', arm: 1.2, leg: 1.2 };
}

// ── Steam ─────────────────────────────────────────────────────

function exhaust(f: F): number {
  return Math.min(1, Math.abs(f.drag) * 1.6);
}

export const machine: Look = {
  model: 'machine',
  headScale: 1,
  shieldWith: () => false,

  limbs(f) {
    return {
      ...limbs(f),
      arm: ARM_K[f.cls] as number,
      leg: LEG_K[f.cls] as number,
    };
  },

  segment(f, seg, far, len, r0, r1) {
    const c = f.ctx;
    const m = mats(f);
    const t = tube(seg, f.cls, len, r0, r1);
    paintTube(c, t, far ? m.ironFar : m.iron, !far);
    if (K.lod > 0) paint(c, ringOf(t), far ? m.brass.as('matte') : m.brass, inkU(3.5));
  },

  back(f) {
    const c = f.ctx;
    const m = mats(f);
    const t = f.t;
    const lod = K.lod;
    const ex = exhaust(f);
    c.save();
    c.scale(f.g * (SZ[f.cls] as number), 1);
    refIn(c, 0, 0);
    // Stacks first (behind the tank).
    paint(c, STACK_A, m.iron, inkR(5));
    paint(c, STACK_B, m.iron, inkR(5));
    if (f.cls === 2) paint(c, STACK_C, m.iron, inkR(5));
    if (lod > 0) paint(c, STACK_BANDS, m.brass, inkR(3.5), true);
    paint(c, RIM_A, m.brass, inkR(4), true);
    paint(c, RIM_B, m.brass, inkR(4), true);
    if (f.cls === 2) paint(c, RIM_C, m.brass, inkR(4), true);
    // The boiler: a copper cylinder with iron hoops.
    paint(c, TANK, m.copper, inkR(6));
    if (lod > 0) {
      streak(c, TANK_HI, inkR(5), 0.4);
      paint(c, TANK_BANDS, m.iron, inkR(4));
    }
    rivets(c, TANK_RIVETS, inkR(1.5));
    paint(c, DOME, m.brass, inkR(5), true);
    // Low drum with a furnace door, in front of the boiler foot.
    paint(c, DRUM, m.iron, inkR(6));
    if (lod > 0) paint(c, DRUM_BAND, m.brass, inkR(4), true);
    flat(c, DOOR.p, '#1b1d25');
    glow(c, 'ember', -190, -122, 32, 32, 0.8 + 0.2 * Math.sin(t * 3.4) + ex * 0.3);
    c.lineWidth = inkR(5);
    c.strokeStyle = m.brass.grad(c, DOOR.fr, false);
    c.stroke(DOOR.p);
    rivets(c, DOOR_RIVETS, inkR(1.5));
    // Pipes to the collar and the waist.
    band(c, PIPE_TOP, PIPE_TOP_FR, m.brass, inkR(24), 15);
    if (lod > 0) band(c, PIPE_LOW, PIPE_LOW_FR, m.iron, inkR(22), 13);
    refOut(c);
    c.restore();
  },

  torso(f) {
    const c = f.ctx;
    const m = mats(f);
    const lod = K.lod;
    const ex = exhaust(f);
    c.save();
    c.scale(f.g * (SZ[f.cls] as number), 1);
    refIn(c, 0, 0);
    // Ribbed waist under the chest, with the side colour painted across it.
    paint(c, WAIST, m.dark, inkR(5), true);
    if (lod > 0) seam(c, WAIST_RIBS, inkR(3), 0.7);
    paint(c, WAIST_ACC, f.acc.as('cloth'), inkR(4), true);
    // Chest hull.
    paint(c, CHEST, m.iron, inkR(6));
    if (lod > 0) {
      seam(c, CHEST_SEAM, inkR(3), 0.4);
      streak(c, CHEST_HI, inkR(5), 0.55);
      if (lod === 2) streak(c, CHEST_RIM, inkR(3), 0.5, '#ffb866');
      band(c, BAND_UP, BAND_UP_FR, m.brass, inkR(13), 8);
      band(c, BAND_LO, BAND_LO_FR, m.brass, inkR(13), 8);
    }
    rivets(c, BAND_RIVETS, inkR(1.5));
    // Furnace window: a brass ring around a glowing pit with a grate.
    if (f.hero && lod > 0) {
      c.lineWidth = inkR(6);
      c.lineCap = 'round';
      c.strokeStyle = m.brass.at(2);
      c.stroke(SUN_RAYS);
    }
    paint(c, FURN_RING, m.brass, inkR(6));
    flat(c, FURN_PIT.p, '#1a0e08');
    const pulse = 0.78 + 0.2 * Math.sin(f.t * 3.1 + 0.6) + 0.05 * Math.sin(f.t * 12) + ex * 0.3;
    glow(c, 'ember', 10, -192, 42, 42, Math.min(1, pulse));
    if (lod > 0) {
      c.lineWidth = inkR(5);
      c.strokeStyle = '#0e1118';
      c.stroke(GRATE);
    }
    c.lineWidth = inkR(4);
    c.strokeStyle = '#0e1118';
    c.stroke(FURN_PIT.p);
    rivets(c, FURN_RIVETS, inkR(1.5));
    // Pressure gauge.
    if (lod > 0) {
      c.save();
      c.translate(66, -140);
      paint(c, GAUGE_FACE, m.white, inkR(4));
      c.lineWidth = inkR(4);
      c.strokeStyle = m.brass.grad(c, GAUGE_FACE.fr, false);
      c.stroke(GAUGE_FACE.p);
      const a = -0.6 + Math.sin(f.t * 1.9) * 0.3 + Math.sin(f.t * 8) * 0.05 + ex * 0.5;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.sin(a) * 14, -Math.cos(a) * 14);
      c.lineWidth = inkR(3.5);
      c.strokeStyle = '#b01c24';
      c.stroke();
      c.restore();
    }
    paint(c, COLLAR, m.iron, inkR(5), true);
    if (lod > 0) seam(c, COLLAR_LINES, inkR(3));
    refOut(c);
    c.restore();
  },

  skirt(f) {
    const c = f.ctx;
    const m = mats(f);
    const lod = K.lod;
    c.save();
    c.scale(f.g * (SZ[f.cls] as number), 1);
    refIn(c, 0, 0);
    paint(c, PELVIS, m.dark, inkR(6), true);
    const n = f.cls === 0 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      paint(c, TASSETS[i] as Shape, m.iron, inkR(5));
      rivets(c, TASSET_RIVETS[i] as Path2D, inkR(1.5));
    }
    paint(c, PELVIS_BELT, m.brass, inkR(5), true);
    rivets(c, PELVIS_RIVETS, inkR(1.5));
    refOut(c);
    // A buckle cog turning on the belt.
    cog(c, m.brass.as('matte'), m.dark, 0.02, 0.03, 0.062, 10, f.t * 1.4, inkU(4));
    c.restore();
    // The side colour: a pennant apron hanging from the belt, lagging behind the stride.
    c.save();
    c.scale(f.g * (SZ[f.cls] as number), 1);
    flag(
      c,
      f.acc.as('cloth'),
      FR_APRON,
      0.14,
      0.0,
      -Math.PI / 2 - 0.06,
      -0.2,
      0.3,
      0.15,
      0.1,
      0.1,
      f.t,
      1.1,
      -f.drag * 0.8,
      inkU(4),
      6,
    );
    if (lod > 0) disc(c, m.brass, 0.14, 0.0, 0.03, inkU(3.5));
    c.restore();
  },

  head(f) {
    const c = f.ctx;
    const m = mats(f);
    const lod = K.lod;
    const s = HEAD_K[f.cls] as number;
    c.save();
    c.translate(f.cls === 2 ? 0.02 : 0.0, f.cls === 2 ? 0.0 : 0.0);
    c.scale(s, s);
    refIn(c, 0, 0);
    paint(c, NECK, m.dark, inkR(5), true);
    // Antenna whip with a tip that sways.
    if (lod > 0) {
      c.lineWidth = inkR(5);
      c.lineCap = 'round';
      c.strokeStyle = '#0e1118';
      c.stroke(ANT);
    }
    paint(c, HEAD, m.iron, inkR(6));
    paint(c, HEAD_CAP, m.copper, inkR(5), true);
    paint(c, HEAD_RIM, m.brass, inkR(4.5), true);
    paint(c, HEAD_BAND, f.acc.as('cloth'), inkR(4), true);
    paint(c, FINIAL, m.brass, inkR(4.5), true);
    paint(c, FINIAL_TOP, m.iron, inkR(4), true);
    // The glowing slit in a recessed brass well.
    flat(c, VISOR_WELL.p, '#150a06');
    c.lineWidth = inkR(5);
    c.strokeStyle = m.brass.at(0);
    c.stroke(VISOR_WELL.p);
    c.lineWidth = inkR(2.4);
    c.strokeStyle = '#0e1118';
    c.stroke(VISOR_WELL.p);
    flat(c, SLIT.p, '#150a06');
    glow(c, 'eye', 62, -11, 44, 14, 0.85 + 0.15 * Math.sin(f.t * 2.6) + exhaust(f) * 0.15);
    c.lineWidth = inkR(5);
    c.lineCap = 'round';
    c.strokeStyle = '#ffe29a';
    c.stroke(SLIT_LIGHT);
    // A round sensing lens beside the slit.
    paint(c, LENS, m.brass, inkR(4.5));
    flat(c, LENS_IN.p, '#1a0e08');
    glow(c, 'eye', -18, -4, 11, 11, 0.55 + 0.35 * Math.sin(f.t * 3.3 + 1.2));
    if (lod > 0) {
      c.lineWidth = inkR(4);
      c.strokeStyle = '#0e1118';
      c.stroke(VENTS);
      streak(c, HEAD_HI, inkR(5), 0.5);
      rivets(c, HEAD_RIVETS, inkR(1.5));
      glint(c, 20, -66, 14, 0.5 + 0.45 * Math.sin(f.t * 2.9 + 1));
    }
    refOut(c);
    c.restore();
  },

  pad(f, far) {
    const c = f.ctx;
    const m = mats(f);
    const lod = K.lod;
    const kk = ([0.95, 1.08, 1.32][f.cls] as number) * (far ? 0.92 : 1);
    const swing = far ? f.pose.sL : f.pose.sR;
    if (!far) {
      // Side-colour armband on the upper arm (turns with the arm).
      c.save();
      c.scale(armPx(f.cls, 0) / 52, 1);
      refIn(c, 0, 0);
      paint(c, ARMBAND, f.acc.as('cloth'), inkR(4), true);
      refOut(c);
      c.restore();
    }
    c.save();
    c.rotate(-swing * 0.7);
    c.scale(kk, kk);
    refIn(c, 0, 0);
    if (far) {
      paint(c, DOMES[1] as Shape, m.ironFar, inkR(5));
      refOut(c);
      c.restore();
      return;
    }
    if (lod === 0) {
      paint(c, DOMES[0] as Shape, m.iron, inkR(5));
      paint(c, DOMES[2] as Shape, m.iron, inkR(5));
    } else {
      for (let i = 0; i < 3; i++) paint(c, DOMES[i] as Shape, m.iron, inkR(5));
      streak(c, DOME_HI, inkR(5), 0.6);
    }
    refOut(c);
    // A brass cog housing on the shoulder, turning with time.
    cog(c, m.brass.as('matte'), m.dark, 0.0, -0.005, 0.04 * kk, 9, f.t * 1.3, inkU(4.5));
    refIn(c, 0, 0);
    paint(c, VALVE, m.brass, inkR(4), true);
    paint(c, VALVE_CAP, m.iron, inkR(4), true);
    rivets(c, DOME_RIVETS, inkR(1.5));
    glint(c, 2, -28, 24, 0.55 + 0.4 * Math.sin(f.t * 2.4));
    refOut(c);
    c.restore();
  },

  fore(f, far) {
    const c = f.ctx;
    const m = mats(f);
    const r = (armPx(f.cls, 1) / 570) * 1.08;
    const bend = Math.abs(far ? f.pose.eL : f.pose.eR);
    const sk = armPx(f.cls, 1) / 46;
    if (!far) {
      c.save();
      c.scale(sk, sk);
      refIn(c, 0, 0);
      paint(c, COUTER, m.iron, inkR(5), true);
      if (K.lod > 0) {
        // Hydraulic ram along the forearm: the rod slides out as the elbow opens.
        const slide = Math.min(1, bend / 1.6) * 36 + Math.sin(f.t * 6) * 1.6;
        c.save();
        c.translate(0, -slide * 0.2);
        paint(c, PISTON_FORE_ROD, m.iron, inkR(4));
        c.restore();
        paint(c, PISTON_FORE, m.brass, inkR(4.5));
        paint(c, PISTON_FORE_RING, m.ironFar, inkR(3.5), true);
      }
      refOut(c);
      c.restore();
    }
    joint(c, far ? m.ironFar : m.iron, m.brass, 0, 0, r, inkU(5));
    if (K.lod > 0)
      cog(c, m.brass.as('matte'), m.dark, 0, 0, r * 0.62, 8, f.t * (far ? -1.1 : 1.3), inkU(3));
  },

  hand(f, far) {
    const c = f.ctx;
    const m = mats(f);
    const hk = armPx(f.cls, 1) / 38;
    const mat = far ? m.ironFar : m.iron;
    c.save();
    c.scale(hk, hk);
    refIn(c, 0, 2);
    paint(c, JAW_B, m.ironFar, inkR(5), true);
    paint(c, PALM, mat, inkR(5));
    if (K.lod > 0) streak(c, PALM_HI, inkR(3), 0.5);
    paint(c, JAW_F, mat, inkR(5), true);
    paint(c, CUFF, m.brass, inkR(4), true);
    if (K.lod > 0) paint(c, HYDRO, m.brass, inkR(4), true);
    rivets(c, HAND_BOLTS, inkR(1.5));
    refOut(c);
    c.restore();
  },

  thigh(f, far) {
    const c = f.ctx;
    const m = mats(f);
    const rt = legPx(f.cls, 2);
    const k = rt / 78;
    const knee = Math.abs(far ? f.pose.kL : f.pose.kR);
    if (!far && K.lod > 0) {
      // A hydraulic piston strapped down the front of the thigh, its rod following the knee.
      c.save();
      c.translate(rt * 0.62 * (1 / 570), 0);
      c.scale(k, k);
      refIn(c, 0, 0);
      const slide = Math.min(1, knee / 1.6) * 54 + Math.sin(f.t * 5.2) * 2;
      c.save();
      c.translate(0, -slide * 0.15);
      paint(c, THIGH_PISTON_ROD, m.iron, inkR(4));
      c.restore();
      paint(c, THIGH_PISTON, m.brass, inkR(5));
      paint(c, THIGH_PISTON_RING, m.ironFar, inkR(3.5), true);
      refOut(c);
      c.restore();
    }
    // The hip joint: iron cap, brass boss and a turning cog.
    const r = (rt / 570) * 0.85;
    joint(c, far ? m.ironFar : m.iron, m.brass, 0, 0, r, inkU(5));
    if (K.lod > 0)
      cog(c, m.brass.as('matte'), m.dark, 0, 0, r * 0.66, 9, f.t * (far ? 0.9 : -1.0), inkU(3));
  },

  shin(f, far) {
    const c = f.ctx;
    const m = mats(f);
    const rs = legPx(f.cls, 3);
    const k = rs / 60;
    if (!far && K.lod > 0) {
      c.save();
      c.scale(k, k);
      refIn(c, 0, 0);
      paint(c, POLEYN, m.iron, inkR(5), true);
      // A rear strut with a sliding rod pumping with the stride.
      const slide = Math.sin(f.t * 5) * 6;
      c.save();
      c.translate(-rs * 0.95, slide * 0.5);
      paint(c, SHIN_STRUT_ROD, m.iron, inkR(4));
      paint(c, SHIN_STRUT, m.brass, inkR(4.5));
      c.restore();
      refOut(c);
      c.restore();
    }
    const r = (rs / 570) * 1.15;
    joint(c, far ? m.ironFar : m.iron, m.brass, 0, 0, r, inkU(5));
    if (K.lod > 0)
      cog(c, m.brass.as('matte'), m.dark, 0, 0, r * 0.62, 8, f.t * (far ? -0.8 : 0.9), inkU(3));
  },

  boot(f, far) {
    const c = f.ctx;
    const m = mats(f);
    const mat = far ? m.ironFar : m.iron;
    const bk = legPx(f.cls, 3) / 60;
    c.save();
    c.scale(bk, bk);
    refIn(c, 0, 0);
    paint(c, FOOT, mat, inkR(5.5), true);
    paint(c, FOOT_TOE, far ? m.copperFar : m.copper, inkR(4.5));
    paint(c, FOOT_SOLE, m.dark, inkR(4), true);
    if (K.lod > 0) {
      seam(c, FOOT_SEAM, inkR(3), 0.55);
      seam(c, FOOT_TREAD, inkR(3), 0.7);
    }
    paint(c, ANKLE, m.brass, inkR(4), true);
    refOut(c);
    c.restore();
  },

  over(f) {
    // Exhaust: puffs rise from the stacks, widen and drift back; they thicken and stream with
    // the stride. Sparks flick off the tops while the machine moves.
    const c = f.ctx;
    const lod = K.lod;
    const ex = exhaust(f);
    const n = (lod === 0 ? 2 : lod === 1 ? 3 : 4) + (ex > 0.4 ? 1 : 0);
    const stacks = f.cls === 2 ? 3 : 2;
    const sc = f.g * (SZ[f.cls] as number);
    const speed = 0.6 + ex * 1.1;
    c.save();
    c.translate(0, 0.96);
    c.rotate(f.pose.lean);
    c.scale(sc, 1);
    for (let s = 0; s < stacks; s++) {
      const sx = (STACKS[s] as readonly [number, number])[0] / 570;
      const sy = -(STACKS[s] as readonly [number, number])[1] / 570;
      for (let i = 0; i < n; i++) {
        const ph = (f.t * speed + i / n + s * 0.37) % 1;
        const x =
          sx - ph * (0.18 + ex * 0.14) - f.drag * 0.28 * ph + Math.sin(f.t * 2 + i * 2 + s) * 0.012;
        const y = sy + 0.02 + ph * (0.46 + ex * 0.1);
        const r = 0.04 + ph * (0.12 + ex * 0.04);
        glow(c, 'steam', x, y, r, r, Math.min(1, (1 - ph) * 1.4) * (0.8 + ex * 0.2));
      }
      if (lod > 0) {
        const ns = lod === 2 ? 3 : 2;
        for (let i = 0; i < ns; i++) {
          const ph = (f.t * 2.6 + i / ns + s * 0.5) % 1;
          const a = (1 - ph) * (0.3 + ex * 0.7);
          if (a < 0.05) continue;
          glow(
            c,
            'ember',
            sx - ph * 0.12 - f.drag * 0.12 * ph + Math.sin(f.t * 9 + i * 5 + s) * 0.015,
            sy + 0.03 + ph * 0.2,
            0.016,
            0.016,
            a,
          );
        }
      }
    }
    // The pennant on the tallest stack carries the side colour, on a brass pole.
    const px = (STACKS[0][0] as number) / 570;
    const py = -(STACKS[0][1] as number) / 570;
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(px, py + 0.2);
    c.lineWidth = inkU(7);
    c.lineCap = 'round';
    c.strokeStyle = '#0e1118';
    c.stroke();
    c.lineWidth = inkU(3.4);
    c.strokeStyle = '#d9a443';
    c.stroke();
    flag(
      c,
      f.acc.as('cloth'),
      FR_PENNANT,
      px - 0.004,
      py + 0.17,
      Math.PI * 0.98,
      -0.2,
      0.34,
      0.13,
      0.03,
      0.25,
      f.t,
      0.8,
      f.drag * 0.9,
      inkU(4),
      6,
    );
    c.restore();
  },
};

const FR_PENNANT = new Frame(0, 0.1, 0, -0.1);
