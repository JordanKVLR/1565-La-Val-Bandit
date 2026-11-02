import {
  Frame,
  K,
  RS,
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
import { crescentPath, crescentShape } from './janissary';
import type { F, LimbStyle, Look, Palette } from './types';

/**
 * The Ottoman sipahi armatura (frame sipahi), drawn in the Cavaliere style: a lighter, taller,
 * faster silhouette than the janissary. Lamellar steel over a crimson tunic with gold trim, a
 * pointed helm with a spike and a turban roll over a mail aventail (a dark visor gap with
 * glowing eyes), splint greaves, long pointed boots, a streaming cape, a slim steam tank with a
 * vertical vent, and the round domed kalkan. Authored in reference pixels (570 px = 1 world unit,
 * y down) like the Cavaliere. The side colour is the cape, the plume, the sash and its tails, the
 * upper-arm band, the lance pennon and the kalkan ring.
 */

// ── Materials ─────────────────────────────────────────────────

interface Mats {
  steel: Swatch;
  steelFar: Swatch;
  mail: Swatch;
  gold: Swatch;
  crimson: Swatch;
  crimsonFar: Swatch;
  boot: Swatch;
  bootFar: Swatch;
  leather: Swatch;
  wood: Swatch;
}
const MATS = new WeakMap<Palette, Mats>();

function darker(hex: string, k = 0.62): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number): string =>
    Math.round(v * k + 22 * (1 - k))
      .toString(16)
      .padStart(2, '0');
  return '#' + ch((n >> 16) & 255) + ch((n >> 8) & 255) + ch(n & 255);
}

function mats(f: F): Mats {
  let m = MATS.get(f.p);
  if (!m) {
    const armour = f.p.armour.c[0] as string;
    const cloth = f.p.cloth.c[0] as string;
    const kind = f.hero ? 'enamel' : 'metal';
    m = {
      steel: f.p.armour.as(kind),
      steelFar: sw(darker(armour), kind),
      mail: sw(darker(armour, 0.8), 'metal'),
      gold: sw(f.p.trim.c[0] as string, 'metal'),
      crimson: f.p.cloth.as('cloth'),
      crimsonFar: sw(darker(cloth), 'cloth'),
      boot: sw(f.hero ? '#7c1016' : '#4e2f22', 'matte'),
      bootFar: sw(darker(f.hero ? '#7c1016' : '#4e2f22'), 'matte'),
      leather: sw('#6b4423', 'matte'),
      wood: sw('#7a5230', 'matte'),
    };
    MATS.set(f.p, m);
  }
  return m;
}

function rr(x: number, y: number, w: number, h: number, r: number): string {
  return (
    `M ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} ` +
    `L ${x + w} ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} ` +
    `L ${x + r} ${y + h} Q ${x} ${y + h} ${x} ${y + h - r} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} Z`
  );
}

// ── Torso (hip origin, y down) ────────────────────────────────

const CUIRASS = Shape.d(
  'M -64 -352 C -96 -296, -78 -176, -48 -80 L 46 -76 C 92 -176, 98 -292, 62 -350 C 28 -374, -28 -374, -64 -352 Z',
);
const CUI_HI = mkPath('M -58 -330 C -76 -280, -66 -190, -42 -108');
const CUI_RIM = mkPath('M 90 -280 C 92 -220, 78 -150, 46 -84');
/** Lamellar rows: curved row lines with staggered plate ticks. */
const LAMELLAR = (() => {
  const p = mkPath();
  for (let r = 0; r < 9; r++) {
    const y = -318 + r * 27;
    p.moveTo(-100, y);
    p.quadraticCurveTo(0, y + 18, 120, y - 4);
    for (let x = -84 + (r % 2) * 11; x < 110; x += 22) {
      const k = (x + 100) / 220;
      const yy = y + 18 * 2 * k * (1 - k) - 4 * k * k + 2;
      p.moveTo(x, yy);
      p.lineTo(x, yy + 27);
    }
  }
  return p;
})();
const COLLAR = Shape.d(
  'M -36 -368 C -16 -396, 40 -394, 56 -366 L 52 -340 C 30 -326, -20 -328, -40 -342 Z',
  true,
);
const COLLAR_EDGE = mkPath('M -38 -343 C -20 -328, 30 -326, 54 -342');
const COLLAR_FR = new Frame(0, -344, 0, -326);
const GOLD_UP = mkPath('M -60 -196 C -4 -172, 52 -176, 94 -204');
const GOLD_LO = mkPath('M -52 -122 C 0 -102, 44 -104, 74 -124');
const GOLD_FR_UP = new Frame(0, -204, 0, -172);
const GOLD_FR_LO = new Frame(0, -124, 0, -102);
const FURNACE = Shape.d(rr(-6, -268, 84, 36, 9));
const FURN_LOUVRES = Shape.d(
  'M -6 -258 L 78 -258 L 78 -254 L -6 -254 Z M -6 -248 L 78 -248 L 78 -244 L -6 -244 Z M -6 -238 L 78 -238 L 78 -234 L -6 -234 Z',
  true,
);
const TORSO_RIVETS = rivetPath(
  [-48, -190, 0, -170, 50, -174, 84, -198, -40, -116, 0, -102, 36, -104],
  4.2,
);

// ── Back: cape, tank, slung kalkan ────────────────────────────

const TANK = Shape.d(rr(-40, 0, 80, 236, 36));
const TANK_BANDS = Shape.d([36, 102, 168].map((y) => rr(-44, y, 88, 14, 6)).join(' '));
const TANK_RIVETS = rivetPath(
  [36, 102, 168].flatMap((y) => [-33, y + 7, 33, y + 7, 0, y + 7]),
  3.2,
);
const TANK_HI = mkPath('M -22 20 C -26 80, -26 160, -18 206');
const PIPE = Shape.d(rr(-11, -70, 22, 76, 7));
const PIPE_CAP = Shape.d('M -26 -84 L 26 -84 L 15 -64 L -15 -64 Z', true);
const TANK_PORT = Shape.circle(0, 180, 21);
const TANK_X = -118;
const TANK_Y = -318;
const TANK_LEAN = (16 * Math.PI) / 180;
const VENT_X = -0.255;
const VENT_Y = 0.66;
const FR_CAPE = new Frame(0, 0.3, 0, -0.3);
const FR_PLUME = new Frame(0, 0.25, 0, -0.25);
const FR_SASH = new Frame(0, 0.15, 0, -0.3);

// ── Skirt (hip origin) ────────────────────────────────────────

const TUNIC = Shape.d(
  'M -56 -74 C -72 40, -80 150, -86 236 C -30 254, 36 254, 88 234 C 84 150, 78 40, 66 -74 Z',
  true,
);
const TUNIC_FOLDS = mkPath('M -30 -50 C -38 60, -40 150, -44 244 M 14 -50 C 16 60, 20 150, 22 250');
const TUNIC_HEM = mkPath('M -86 230 C -30 250, 36 250, 88 228');
const TUNIC_HEM_FR = new Frame(0, 228, 0, 250);
const SASH = Shape.d(
  'M -60 -120 C -16 -100, 30 -100, 66 -118 L 68 -60 C 30 -42, -16 -42, -62 -60 Z',
  true,
);
const SASH_FOLDS = mkPath('M -44 -110 L -46 -54 M -8 -104 L -10 -48 M 28 -104 L 28 -48');
const BELT = Shape.d('M -62 -68 C -16 -48, 30 -48, 68 -66 L 68 -54 C 30 -34, -16 -34, -62 -54 Z');
const BUCKLE = crescentShape(72, -80, 22, 16, 8);
const TASSETS: Shape[] = [];
const TASSET_RIVETS: Path2D[] = [];
for (const [dx, dy, w, h] of [
  [-6, -64, 130, 96],
  [4, -20, 122, 92],
  [12, 22, 114, 86],
] as const) {
  const x = -58 + dx;
  TASSETS.push(
    Shape.d(
      `M ${x} ${dy} L ${x + w} ${dy} C ${x + w + 6} ${dy + h * 0.5}, ${x + w - 8} ${dy + h * 0.9}, ${x + w * 0.52} ${dy + h + 12} ` +
        `C ${x + 10} ${dy + h * 0.9}, ${x - 6} ${dy + h * 0.5}, ${x} ${dy} Z`,
    ),
  );
  TASSET_RIVETS.push(rivetPath([x + 18, dy + 16, x + w - 18, dy + 16], 3.8));
}

// ── Pauldron, elbow, fist ─────────────────────────────────────

function lame(r: number, off: number): Shape {
  return new Shape(
    mkPath(
      `M ${-r} ${off} A ${r} ${r * 0.55} 0 0 1 ${r * 0.9} ${off - 8} L ${r * 0.82} ${off + 26} ` +
        `Q 0 ${off + 38} ${-r} ${off + 14} Z`,
    ),
    new Frame(-r, 0, r, 0),
  );
}
const LAMES = [lame(62, 34), lame(58, 14), lame(52, -4)];
const PAULDRON_HI = mkPath('M -46 -10 A 50 40 0 0 1 36 -22');
const PAULDRON_RIM = mkPath('M -52 -2 A 52 42 0 0 1 46 -18');
const PAULDRON_RIM_FR = new Frame(0, -30, 0, 0);
const PAULDRON_RIVETS = rivetPath([-26, 8, 10, -2, 40, 6], 4.2);
const ARMBAND = Shape.d('M -38 76 Q 0 90 38 76 L 39 108 Q 0 122 -39 108 Z', true);
const COUTER = Shape.d('M -26 -6 L -58 20 L -24 28 Z', true);
const FIST = Shape.d('M -24 -26 C -28 -6, -24 20, -10 30 L 14 30 C 26 20, 28 -6, 24 -26 Z');
const FIST_LAMES = mkPath('M -25 -12 Q 0 -5 25 -12 M -25 2 Q 0 9 25 2 M -25 16 Q 0 23 25 16');
const FIST_HI = mkPath('M -19 -22 C -23 -4, -19 16, -8 26');
const CUFF = Shape.d('M -34 -42 L 34 -42 L 28 -14 Q 0 -6 -28 -14 Z', true);
const CUFF_EDGE = mkPath('M -31 -14 Q 0 -6 31 -14');
const CUFF_FR = new Frame(0, -14, 0, -6);

// ── Knee, boot ────────────────────────────────────────────────

const POLEYN = Shape.d('M 16 -20 C 54 -26, 70 4, 54 30 C 38 38, 14 24, 16 -20 Z', true);
const BOOT = Shape.d(
  'M -36 -14 L 30 -18 C 80 -12, 128 4, 176 26 C 188 32, 186 40, 172 40 L -40 40 Z',
  true,
);
const BOOT_SEAM = mkPath('M 8 14 C 60 14, 110 22, 160 34');
const BOOT_TOE = Shape.d(
  'M 122 4 C 144 12, 166 20, 182 30 C 190 36, 186 40, 172 40 L 128 40 Z',
  true,
);
const SPUR = Shape.d('M -40 8 L -70 20 L -44 24 Z');
const HEEL = Shape.d('M -40 22 L -4 22 L -6 40 L -42 40 Z');
const ANKLE = Shape.d(rr(-34, -26, 70, 15, 6), true);

// ── Helm, mail, turban (origin: the head centre) ──────────────

const BOWL = Shape.d(
  'M -64 -8 C -78 -44, -52 -92, -14 -122 C 2 -146, 8 -170, 14 -204 C 26 -170, 38 -144, 56 -116 C 90 -84, 104 -56, 98 -26 L 96 -22 C 60 -32, 12 -38, -16 -34 C -40 -30, -56 -20, -64 -8 Z',
);
const BOWL_HI = mkPath('M -52 -20 C -48 -56, -30 -90, 0 -118');
const BOWL_RIDGE = mkPath('M 14 -178 C 18 -130, 30 -70, 42 -30');
const SPIKE = Shape.d('M 4 -200 L 16 -272 L 26 -200 Z', true);
const SPIKE_BALL = Shape.circle(15, -196, 12);
const FACE_GAP = Shape.d('M 10 -36 C 54 -30, 92 -16, 96 8 L 96 40 C 60 30, 30 26, 8 28 Z');
const COIF = Shape.d(
  'M -64 -2 C -76 40, -72 92, -54 126 C -14 148, 46 132, 72 96 C 88 76, 98 52, 100 32 C 68 24, 28 22, 8 26 C -22 24, -50 12, -64 -2 Z',
);
/** Diamond mesh over the aventail. */
const MESH = (() => {
  const p = mkPath();
  for (let i = -8; i < 12; i++) {
    p.moveTo(-90 + i * 14, 8);
    p.lineTo(40 + i * 14, 160);
    p.moveTo(-90 + i * 14 + 150, 8);
    p.lineTo(-100 + i * 14 + 10, 160);
  }
  return p;
})();
const COIF_EDGE = mkPath('M -52 122 C -10 146, 46 130, 70 98');
const COIF_FR = new Frame(0, 100, 0, 150);
const NASAL = Shape.d('M 66 -44 L 80 -44 L 82 26 L 70 26 Z', true);
const TURBAN = Shape.d(
  'M -62 -28 C -14 -48, 52 -44, 96 -20 L 96 -54 C 52 -78, -14 -78, -62 -58 Z',
  true,
);
const TURBAN2 = Shape.d(
  'M -58 -54 C -14 -72, 50 -70, 92 -50 L 90 -72 C 50 -92, -10 -94, -56 -76 Z',
  true,
);
const TURBAN_TWIST = mkPath('M -30 -60 L -18 -36 M 4 -66 L 16 -40 M 38 -64 L 48 -38');
const TURBAN_EDGE = mkPath('M -62 -30 C -14 -50, 52 -46, 96 -22');
const TURBAN_FR = new Frame(0, -78, 0, -20);
const HELM_RIVETS = rivetPath([-44, -20, 88, -6, 70, -52, 0, -100], 3.8);

// ── Limb tubes ────────────────────────────────────────────────

const TUBES: (Tube | undefined)[] = [];
function tube(seg: number, cls: number, len: number, r0: number, r1: number): Tube {
  const i = seg * 3 + cls;
  let t = TUBES[i];
  if (!t || t.r0 !== r0 || t.len !== len) {
    const lames = seg === 3 ? 3 : seg === 1 ? 2 : 1;
    const bulge = seg === 0 ? 0.012 : seg === 2 ? 0.016 : 0.004;
    t = new Tube(len, r0, r1, lames, bulge);
    TUBES[i] = t;
  }
  return t;
}

const limbs = (): LimbStyle => ({
  upper: 'cloth',
  fore: 'armour',
  thigh: 'cloth',
  shin: 'armour',
  arm: 0.8,
  leg: 0.86,
});

// ── Kalkan (round domed shield) ───────────────────────────────

const KK_RIM = Shape.circle(0, 0, 156);
const KK_FIELD = Shape.circle(0, 0, 146);
const KK_RING = Shape.circle(0, 0, 124);
const KK_BAND = Shape.circle(0, 0, 92);
const KK_BOSS = Shape.circle(0, 0, 40);
const KK_SPIKE = Shape.d('M -9 -34 L 0 -66 L 9 -34 Z', true);
const KK_STUDS = rivetPath(
  Array.from({ length: 8 }, (_, i) => [
    Math.cos((i / 8) * Math.PI * 2) * 108,
    Math.sin((i / 8) * Math.PI * 2) * 108,
  ]).flat(),
  8,
);
const KK_RIM_RIVETS = rivetPath(
  Array.from({ length: 16 }, (_, i) => [
    Math.cos((i / 16) * Math.PI * 2) * 136,
    Math.sin((i / 16) * Math.PI * 2) * 136,
  ]).flat(),
  4,
);
const KK_MOONS = (() => {
  const p = mkPath();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const cx = Math.cos(a) * 66;
    const cy = Math.sin(a) * 66;
    const cr = Math.cos(a);
    const sr = Math.sin(a);
    // a small crescent opening outward, built from two arcs rotated into place
    const R = 17;
    const r = 13;
    const d = 8;
    const xs = (d * d + R * R - r * r) / (2 * d);
    const ys = Math.sqrt(R * R - xs * xs);
    const at = (x: number, y: number): [number, number] => [
      cx + x * cr - y * sr,
      cy + x * sr + y * cr,
    ];
    const [x0, y0] = at(xs, ys);
    p.moveTo(x0, y0);
    // outer arc as a polyline (keeps the path static and simple)
    const a0 = Math.atan2(ys, xs);
    for (let k = 1; k <= 14; k++) {
      const q = a0 + ((Math.PI * 2 - 2 * a0) * k) / 14;
      const [px, py] = at(Math.cos(q) * R, Math.sin(q) * R);
      p.lineTo(px, py);
    }
    const b2 = Math.atan2(-ys, xs - d);
    const b1 = Math.atan2(ys, xs - d);
    let span = b2 - b1;
    if (span < 0) span += Math.PI * 2;
    for (let k = 1; k <= 10; k++) {
      const q = b2 - (span * k) / 10;
      const [px, py] = at(d + Math.cos(q) * r, Math.sin(q) * r);
      p.lineTo(px, py);
    }
    p.closePath();
  }
  return p;
})();
const KK_GLINT = mkPath('M -112 -44 A 120 120 0 0 1 -44 -112');

/** Paints the kalkan at the origin of the current (reference px, y down) space. */
function kalkan(c: Ctx, f: F, m: Mats, acc: Swatch): void {
  paint(c, KK_RIM, m.gold, inkR(6));
  paint(c, KK_FIELD, m.crimson, inkR(5));
  c.lineWidth = inkR(17);
  c.strokeStyle = '#0e1118';
  c.stroke(KK_RING.p);
  c.lineWidth = inkR(11);
  c.strokeStyle = acc.grad(c, KK_RING.fr, false);
  c.stroke(KK_RING.p);
  c.lineWidth = inkR(8);
  c.strokeStyle = m.gold.grad(c, KK_BAND.fr, false);
  c.stroke(KK_BAND.p);
  if (K.lod > 0) {
    c.fillStyle = m.gold.at(0);
    c.fill(KK_MOONS);
    c.lineWidth = inkR(2.5);
    c.strokeStyle = '#0e1118';
    c.stroke(KK_MOONS);
  }
  c.fillStyle = m.gold.at(0);
  c.fill(KK_STUDS);
  c.lineWidth = inkR(3);
  c.strokeStyle = '#0e1118';
  c.stroke(KK_STUDS);
  rivets(c, KK_RIM_RIVETS, inkR(1.5));
  paint(c, KK_BOSS, m.steel, inkR(5));
  paint(c, KK_SPIKE, m.gold, inkR(4), true);
  if (K.lod > 0) streak(c, KK_GLINT, inkR(7), 0.38);
  void f;
}

/** The janissary's smaller round buckler. */
function buckler(c: Ctx, f: F, acc: Swatch): void {
  const robe = f.p.cloth.as('cloth');
  const brass = sw(f.hero ? (f.p.trim.c[0] as string) : '#d9a443', 'metal');
  const steel = f.p.armour.as('metal');
  paint(c, KK_RIM, brass, inkR(6));
  paint(c, KK_FIELD, robe, inkR(5));
  c.lineWidth = inkR(17);
  c.strokeStyle = '#0e1118';
  c.stroke(KK_RING.p);
  c.lineWidth = inkR(11);
  c.strokeStyle = acc.grad(c, KK_RING.fr, false);
  c.stroke(KK_RING.p);
  c.save();
  c.translate(-12, 0);
  paint(c, MOON_BIG, brass, inkR(5));
  c.restore();
  paint(c, KK_BOSS, steel, inkR(5));
  rivets(c, KK_RIM_RIVETS, inkR(1.5));
  if (K.lod > 0) streak(c, KK_GLINT, inkR(7), 0.38);
}
const MOON_BIG = new Shape(crescentPath(0, 0, 76, 60, 28), new Frame(-76, 0, 36, 0));

/** The round shield for the Ottoman models, drawn at the off hand (its centre floats ahead of the fist). */
export function ottomanShield(f: F): void {
  const c: Ctx = f.ctx;
  const jan = f.spec.model === 'janissary';
  const k = RS * (1 + (f.cls - 1) * 0.08) * (jan ? 0.85 : 0.94);
  c.save();
  c.translate(0.13, 0.1);
  c.scale(k, -k);
  c.rotate(-0.244);
  const acc = f.acc.as('cloth');
  if (jan) buckler(c, f, acc);
  else kalkan(c, f, mats(f), acc);
  c.restore();
}

// ── The look ──────────────────────────────────────────────────

export const sipahi: Look = {
  model: 'sipahi',
  sabre: true,
  headScale: 1.1,
  limbs,
  shieldWith: (w) => w === 'blade' || w === 'blunt' || w === 'explosive',

  segment(f, seg, far, len, r0, r1) {
    const m = mats(f);
    const mat =
      seg === 0
        ? far
          ? m.crimsonFar
          : m.crimson
        : seg === 1
          ? far
            ? m.steelFar
            : m.steel
          : seg === 2
            ? far
              ? m.crimsonFar
              : m.crimson
            : far
              ? m.steelFar
              : m.steel;
    paintTube(f.ctx, tube(seg, f.cls, len, r0, r1), mat, !far);
  },

  back(f) {
    const c = f.ctx;
    const m = mats(f);
    const t = f.t;
    const lod = K.lod;
    const acc = f.acc.as('cloth');
    // Cape in the side colour, streaming behind the shoulders.
    flag(
      c,
      acc,
      FR_CAPE,
      -0.07,
      0.56,
      3.9,
      0.6,
      0.6,
      0.14,
      0.3,
      0.16,
      t,
      0.2,
      -f.drag * 0.9,
      inkU(4.5),
      8,
    );
    // The kalkan slung on the back when the hands carry something else.
    const w = f.spec.weaponType;
    if (w === 'polearm' || w === 'firearm') {
      c.save();
      c.scale(f.g, 1);
      refIn(c, 0, 0);
      c.save();
      c.translate(-112, -214);
      c.scale(0.62, 0.62);
      kalkan(c, f, m, acc);
      c.restore();
      refOut(c);
      c.restore();
    }
    c.save();
    c.scale(f.g, 1);
    refIn(c, 0, 0);
    c.save();
    c.translate(TANK_X, TANK_Y);
    c.rotate(TANK_LEAN);
    paint(c, TANK, m.steel, inkR(6));
    if (lod > 0) {
      streak(c, TANK_HI, inkR(5), 0.45);
      paint(c, TANK_BANDS, m.gold, inkR(4));
    }
    rivets(c, TANK_RIVETS, inkR(1.5));
    paint(c, PIPE, m.gold, inkR(5));
    paint(c, PIPE_CAP, m.steel, inkR(4.5), true);
    flat(c, TANK_PORT.p, '#1b1d25');
    glow(c, 'ember', 0, 180, 21, 21, 0.8 + 0.2 * Math.sin(t * 3.4) + 0.06 * Math.sin(t * 12));
    c.lineWidth = inkR(4.5);
    c.strokeStyle = m.gold.grad(c, TANK_PORT.fr, false);
    c.stroke(TANK_PORT.p);
    c.restore();
    refOut(c);
    c.restore();
  },

  torso(f) {
    const c = f.ctx;
    const m = mats(f);
    const lod = K.lod;
    c.save();
    c.scale(f.g, 1);
    refIn(c, 0, 0);
    paint(c, CUIRASS, m.steel, inkR(6));
    if (lod > 0) {
      c.save();
      c.clip(CUIRASS.p);
      seam(c, LAMELLAR, inkR(2.6), 0.5);
      c.restore();
      streak(c, CUI_HI, inkR(4), 0.5);
      if (lod === 2) streak(c, CUI_RIM, inkR(3), 0.5, '#ffb866');
      band(c, GOLD_UP, GOLD_FR_UP, m.gold, inkR(12), 7);
      band(c, GOLD_LO, GOLD_FR_LO, m.gold, inkR(12), 7);
    }
    rivets(c, TORSO_RIVETS, inkR(1.5));
    flat(c, FURNACE.p, '#1a0e08');
    glow(c, 'ember', 36, -250, 40, 20, 0.72 + 0.28 * Math.sin(f.t * 3.3 + 0.6));
    c.lineWidth = inkR(4.5);
    c.strokeStyle = m.gold.grad(c, FURNACE.fr, true);
    c.stroke(FURNACE.p);
    if (lod > 0) paint(c, FURN_LOUVRES, m.steel, inkR(2.2), true);
    paint(c, COLLAR, m.crimson, inkR(5), true);
    if (lod > 0) band(c, COLLAR_EDGE, COLLAR_FR, m.gold, inkR(11), 6);
    refOut(c);
    c.restore();
  },

  skirt(f) {
    const c = f.ctx;
    const m = mats(f);
    const lod = K.lod;
    c.save();
    c.scale(f.g * (f.cls === 2 ? 1.08 : 1), 1);
    refIn(c, 0, 0);
    c.save();
    const k = -0.05 - f.drag * 0.4 + Math.sin(f.t * 2.1) * 0.03;
    c.transform(1, 0, k, 1, k * 74, 0);
    paint(c, TUNIC, m.crimson, inkR(5), true);
    if (lod > 0) seam(c, TUNIC_FOLDS, inkR(3), 0.4);
    band(c, TUNIC_HEM, TUNIC_HEM_FR, m.gold, inkR(15), 9);
    c.restore();
    const n = f.cls === 0 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      paint(c, TASSETS[i] as Shape, m.steel, inkR(5));
      rivets(c, TASSET_RIVETS[i] as Path2D, inkR(1.5));
    }
    paint(c, SASH, f.acc.as('cloth'), inkR(5), true);
    if (lod > 0) seam(c, SASH_FOLDS, inkR(2.5), 0.35);
    paint(c, BELT, m.leather, inkR(4));
    paint(c, BUCKLE, m.gold, inkR(4));
    refOut(c);
    c.restore();
    const acc = f.acc.as('cloth');
    flag(
      c,
      acc,
      FR_SASH,
      0.09,
      0.12,
      -Math.PI / 2 - 0.1,
      -0.3,
      0.38,
      0.09,
      0.05,
      0.16,
      f.t,
      1.1,
      -f.drag * 0.8,
      inkU(4),
      6,
    );
    flag(
      c,
      acc,
      FR_SASH,
      0.09,
      0.12,
      -Math.PI / 2 - 0.7,
      -0.4,
      0.3,
      0.08,
      0.04,
      0.18,
      f.t,
      2.2,
      -f.drag * 0.8,
      inkU(4),
      6,
    );
    disc(c, acc, 0.09, 0.125, 0.032, inkU(3.5));
  },

  head(f) {
    const c = f.ctx;
    const m = mats(f);
    const lod = K.lod;
    const s = [0.96, 1, 1.05][f.cls] as number;
    c.save();
    c.translate(0, 0.04);
    c.scale(s, s);
    const pm = f.acc.as('cloth');
    // Plume (a horsetail in the side colour) streaming from the base of the spike.
    flag(
      c,
      pm,
      FR_PLUME,
      0.03,
      0.3,
      2.1,
      1.4,
      0.36,
      0.1,
      0.02,
      0.24,
      f.t,
      0.5,
      f.drag * 0.7,
      inkU(4.5),
      8,
    );
    flag(
      c,
      pm,
      FR_PLUME,
      0.03,
      0.28,
      2.5,
      1.2,
      0.3,
      0.08,
      0.02,
      0.26,
      f.t,
      1.7,
      f.drag * 0.7,
      inkU(4),
      7,
    );
    if (f.hero)
      flag(
        c,
        m.gold,
        FR_PLUME,
        0.03,
        0.29,
        2.65,
        0.65,
        0.4,
        0.03,
        0.01,
        0.22,
        f.t,
        0.9,
        f.drag * 0.7,
        inkU(3),
        6,
      );
    refIn(c, 0, 0);
    flat(c, FACE_GAP.p, '#150a06');
    paint(c, COIF, m.mail, inkR(5.5));
    if (lod > 0) {
      c.save();
      c.clip(COIF.p);
      seam(c, MESH, inkR(2), 0.35);
      c.restore();
      band(c, COIF_EDGE, COIF_FR, m.gold, inkR(8), 4);
    }
    glow(c, 'eye', 58, -6, 28, 10, 0.8 + 0.2 * Math.sin(f.t * 2.6));
    c.lineWidth = inkR(4);
    c.lineCap = 'round';
    c.strokeStyle = '#ffe29a';
    c.beginPath();
    c.moveTo(44, -6);
    c.lineTo(82, -2);
    c.stroke();
    paint(c, BOWL, m.steel, inkR(6));
    if (lod > 0) {
      streak(c, BOWL_HI, inkR(5), 0.6);
      seam(c, BOWL_RIDGE, inkR(3), 0.4);
    }
    paint(c, NASAL, m.gold, inkR(4), true);
    paint(c, TURBAN, m.crimson, inkR(5), true);
    paint(c, TURBAN2, m.crimson, inkR(5), true);
    if (lod > 0) {
      seam(c, TURBAN_TWIST, inkR(3), 0.45);
      band(c, TURBAN_EDGE, TURBAN_FR, m.gold, inkR(10), 5);
    }
    paint(c, SPIKE, m.gold, inkR(4), true);
    paint(c, SPIKE_BALL, m.gold, inkR(4));
    if (lod > 0) {
      rivets(c, HELM_RIVETS, inkR(1.5));
      glint(c, 30, -110, 13, 0.5 + 0.45 * Math.sin(f.t * 2.9 + 1));
    }
    refOut(c);
    c.restore();
  },

  pad(f, far) {
    const c = f.ctx;
    const m = mats(f);
    const lod = K.lod;
    const kk = [0.92, 1.05, 1.2][f.cls] as number;
    const swing = far ? f.pose.sL : f.pose.sR;
    if (!far) {
      c.save();
      c.scale(kk, 1);
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
      paint(c, LAMES[1] as Shape, m.steelFar, inkR(5));
      refOut(c);
      c.restore();
      return;
    }
    if (lod === 0) {
      paint(c, LAMES[0] as Shape, m.steel, inkR(5));
      paint(c, LAMES[2] as Shape, m.steel, inkR(5));
    } else {
      for (let i = 0; i < 3; i++) paint(c, LAMES[i] as Shape, m.steel, inkR(5));
      streak(c, PAULDRON_HI, inkR(5), 0.55);
      band(c, PAULDRON_RIM, PAULDRON_RIM_FR, m.gold, inkR(10), 6);
    }
    rivets(c, PAULDRON_RIVETS, inkR(1.5));
    glint(c, 0, -18, 20, 0.55 + 0.4 * Math.sin(f.t * 2.4));
    refOut(c);
    c.restore();
  },

  fore(f, far) {
    const c = f.ctx;
    const m = mats(f);
    const r = 0.048 * (f.g > 1 ? 1.1 : f.g < 1 ? 0.92 : 1);
    if (!far) {
      refIn(c, 0, 0);
      paint(c, COUTER, m.gold, inkR(5), true);
      refOut(c);
    }
    joint(c, far ? m.steelFar : m.steel, m.gold, 0, 0, r, inkU(5));
  },

  hand(f, far) {
    const c = f.ctx;
    const m = mats(f);
    c.save();
    c.scale(0.5 + f.g * 0.5, 1);
    refIn(c, 0, 2);
    paint(c, FIST, far ? m.steelFar : m.mail, inkR(5));
    if (K.lod > 0) {
      seam(c, FIST_LAMES, inkR(3));
      streak(c, FIST_HI, inkR(3), 0.5);
    }
    paint(c, CUFF, far ? m.crimsonFar : m.crimson, inkR(4.5), true);
    if (K.lod > 0) band(c, CUFF_EDGE, CUFF_FR, m.gold, inkR(9), 5);
    refOut(c);
    c.restore();
  },

  shin(f, far) {
    const c = f.ctx;
    const m = mats(f);
    const r = 0.068 * f.g;
    if (!far && K.lod > 0) {
      c.save();
      c.scale(f.g, 1);
      refIn(c, 0, 0);
      paint(c, POLEYN, m.steel, inkR(5), true);
      refOut(c);
      c.restore();
    }
    joint(c, far ? m.steelFar : m.steel, m.gold, 0, 0, r, inkU(5));
  },

  boot(f, far) {
    const c = f.ctx;
    const m = mats(f);
    c.save();
    c.scale(f.g, 1);
    refIn(c, 0, 0);
    paint(c, BOOT, far ? m.bootFar : m.boot, inkR(5.5), true);
    if (K.lod > 0) {
      seam(c, BOOT_SEAM, inkR(3), 0.5);
      paint(c, BOOT_TOE, m.gold, inkR(3.5), true);
      if (!far) paint(c, SPUR, m.gold, inkR(3.5));
    }
    paint(c, HEEL, m.leather, inkR(4));
    paint(c, ANKLE, m.gold, inkR(4), true);
    refOut(c);
    c.restore();
  },

  shield: () => true,

  over(f) {
    // A thin jet of steam from the vent pipe, drifting back with the stride.
    const c = f.ctx;
    const n = K.lod === 0 ? 2 : K.lod === 1 ? 3 : 4;
    c.save();
    c.translate(0, 0.96);
    c.rotate(f.pose.lean);
    c.scale(f.g, 1);
    for (let i = 0; i < n; i++) {
      const ph = (f.t * 0.7 + i / n) % 1;
      const x = VENT_X - ph * 0.22 - f.drag * 0.18 * ph + Math.sin(f.t * 2.4 + i * 2) * 0.012;
      const y = VENT_Y + ph * 0.5;
      const r = 0.035 + ph * 0.11;
      glow(c, 'steam', x, y, r, r, Math.min(1, (1 - ph) * 1.4) * 0.85);
    }
    c.restore();
  },
};
