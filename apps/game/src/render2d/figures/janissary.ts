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
import type { Swatch } from './kit';
import type { F, LimbStyle, Look, Palette } from './types';

/**
 * The Ottoman janissary armatura (frames yeniceri, humbaraci), drawn in the Cavaliere style:
 * cylinder-shaded plates, brass and cloth from kit.ts, authored in reference pixels (570 px = 1
 * world unit, y down) with the hip, the head centre or the joint as the origin. Original vector
 * art: a tall white borK cap with a cloth tail and brass spoon holder, a blue kaftan over a round
 * steel chest mirror with a glowing crescent window, a crimson-lined bell skirt, a copper boiler
 * pack with a crescent-horn steam vent, curled soft boots. The side colour is the plume, the wide
 * sash and its tails, the upper-arm band and the shield ring. The humbaraci (explosive weapon)
 * wears a grenade satchel and a bandolier of iron grenados instead of powder cases.
 */

// ── Materials ─────────────────────────────────────────────────

interface Mats {
  steel: Swatch;
  steelFar: Swatch;
  brass: Swatch;
  copper: Swatch;
  robe: Swatch;
  robeFar: Swatch;
  lining: Swatch;
  felt: Swatch;
  boot: Swatch;
  bootFar: Swatch;
  leather: Swatch;
  iron: Swatch;
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
    const robe = f.p.cloth.c[0] as string;
    m = {
      steel: f.p.armour.as(f.hero ? 'enamel' : 'metal'),
      steelFar: sw(darker(armour), f.hero ? 'enamel' : 'metal'),
      brass: sw(f.hero ? (f.p.trim.c[0] as string) : '#d9a443', 'metal'),
      copper: sw('#b9652f', 'metal'),
      robe: f.p.cloth.as('cloth'),
      robeFar: sw(darker(robe), 'cloth'),
      lining: sw(f.hero ? '#f4efe2' : '#a8232f', 'cloth'),
      felt: sw(f.hero ? '#fbf8ef' : '#f2ecdf', 'soft'),
      boot: sw(f.hero ? '#7c1016' : '#8a3426', 'matte'),
      bootFar: sw(darker(f.hero ? '#7c1016' : '#8a3426'), 'matte'),
      leather: sw('#6b4423', 'matte'),
      iron: sw('#4a4f5c', 'metal'),
    };
    MATS.set(f.p, m);
  }
  return m;
}

// ── Path helpers ──────────────────────────────────────────────

/** SVG path data of a rounded rectangle. */
function rr(x: number, y: number, w: number, h: number, r: number): string {
  return (
    `M ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} ` +
    `L ${x + w} ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} ` +
    `L ${x + r} ${y + h} Q ${x} ${y + h} ${x} ${y + h - r} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} Z`
  );
}

/** A crescent: outer circle (cx,cy,R) minus a circle of radius r offset by d to +x (opens forward). */
export function crescentPath(cx: number, cy: number, R: number, r: number, d: number): Path2D {
  const xs = (d * d + R * R - r * r) / (2 * d);
  const ys = Math.sqrt(Math.max(0, R * R - xs * xs));
  const a = Math.atan2(ys, xs);
  const p = mkPath();
  p.arc(cx, cy, R, a, Math.PI * 2 - a, false);
  p.arc(cx + d, cy, r, Math.atan2(-ys, xs - d), Math.atan2(ys, xs - d), true);
  p.closePath();
  return p;
}
export function crescentShape(cx: number, cy: number, R: number, r: number, d: number): Shape {
  return new Shape(crescentPath(cx, cy, R, r, d), new Frame(cx - R, 0, cx + R * 0.4, 0));
}

// ── Torso (origin: the hip, y down; the figure is ~ -380 at the neck) ──

const ROBE = Shape.d(
  'M -74 -362 C -112 -300, -92 -170, -58 -76 L 56 -72 C 106 -170, 114 -292, 70 -358 C 30 -384, -30 -384, -74 -362 Z',
);
const ROBE_HI = mkPath('M -66 -338 C -84 -290, -74 -190, -52 -112');
const ROBE_SEAM = mkPath('M -34 -340 C -52 -250, -42 -150, -26 -84');
const LAPEL = Shape.d(
  'M 42 -376 C 82 -336, 100 -250, 82 -150 C 76 -118, 70 -96, 66 -74 L 40 -76 C 52 -112, 60 -150, 62 -204 C 66 -270, 54 -330, 30 -372 Z',
  true,
);
const COLLAR = Shape.d(
  'M -40 -372 C -20 -406, 42 -404, 62 -372 L 58 -344 C 32 -328, -22 -330, -42 -346 Z',
  true,
);
const COLLAR_EDGE = mkPath('M -40 -347 C -22 -330, 32 -328, 58 -346');
const COLLAR_FR = new Frame(0, -346, 0, -330);
const MIRROR = Shape.circle(34, -246, 62);
const MIRROR_RING = mkPath('M 96 -246 A 62 62 0 1 1 -28 -246 A 62 62 0 1 1 96 -246');
const MIRROR_FR = new Frame(-28, 0, 96, 0);
const MIRROR_RIVETS = rivetPath(
  Array.from({ length: 10 }, (_, i) => [
    34 + Math.cos((i / 10) * Math.PI * 2 + 0.3) * 51,
    -246 + Math.sin((i / 10) * Math.PI * 2 + 0.3) * 51,
  ]).flat(),
  3.8,
);
const WINDOW = crescentPath(34, -246, 36, 29, 13);
const BUTTONS = (() => {
  const p = mkPath();
  for (let i = 0; i < 5; i++) {
    const y = -318 + i * 44;
    const x = 78 - i * 3 - Math.sin(i * 0.8) * 4;
    p.moveTo(x + 7, y);
    p.arc(x, y, 7, 0, Math.PI * 2);
  }
  return p;
})();
const PLATE_A = Shape.d(
  'M -72 -198 C -20 -178, 40 -180, 100 -208 L 96 -166 C 40 -144, -16 -144, -68 -162 Z',
  true,
);
const PLATE_B = Shape.d(
  'M -68 -162 C -16 -144, 40 -144, 96 -166 L 92 -126 C 40 -106, -14 -106, -64 -124 Z',
  true,
);
const PLATE_RIVETS = rivetPath(
  [-56, -176, -6, -160, 44, -164, 84, -184, -52, -140, 0, -124, 46, -126, 82, -146],
  3.8,
);
const SHOULDER_SEAM = mkPath('M -60 -340 C -40 -356, 20 -358, 58 -344');

// ── Back: copper boiler pack, crescent-horn vent, pipes ──────

const PACK = Shape.d(rr(-56, 0, 112, 236, 44));
const PACK_BANDS = Shape.d([40, 108, 176].map((y) => rr(-60, y, 120, 14, 6)).join(' '));
const PACK_RIVETS = rivetPath(
  [40, 108, 176].flatMap((y) => [-46, y + 7, 46, y + 7, 0, y + 7]),
  3.4,
);
const PACK_HI = mkPath('M -34 22 C -40 80, -40 160, -30 200');
const PACK_COLLAR = Shape.d(rr(-22, -12, 44, 26, 8), true);
/** Crescent horns pointing up from the pack top (circle centre at (0, 6), opening upward). */
const HORNS = (() => {
  const p = crescentPath(0, 0, 50, 39, 19);
  return new Shape(p, new Frame(-50, 0, 24, 0));
})();
const PORT = Shape.circle(0, 120, 30);
const PIPE_TOP = mkPath('M -62 -318 C -52 -352, -34 -354, -14 -364');
const PIPE_TOP_FR = new Frame(0, -354, 0, -318);
const PACK_X = -118;
const PACK_Y = -330;
const PACK_LEAN = (-7 * Math.PI) / 180;
/** Steam horn tips in spine-frame world units (above the hip). */
const HORN_X0 = -0.24;
const HORN_X1 = -0.125;
const HORN_Y = 0.71;

// ── Skirt (hip origin) ────────────────────────────────────────

const FLARE_BACK = Shape.d(
  'M -66 -74 C -96 40, -126 170, -122 250 C -76 270, -16 274, 34 260 C 24 160, 30 40, 42 -74 Z',
  true,
);
const SKIRT = Shape.d(
  'M -58 -74 C -76 50, -84 160, -88 252 C -34 276, 40 276, 90 250 C 86 160, 82 50, 72 -74 Z',
  true,
);
const FLAP = Shape.d(
  'M 28 -74 C 46 60, 62 160, 88 250 C 106 248, 124 240, 134 230 C 116 140, 98 40, 72 -74 Z',
  true,
);
const SKIRT_FOLDS = mkPath('M -36 -50 C -44 60, -46 160, -48 258 M 4 -50 C 6 60, 8 160, 10 266');
const HEM = mkPath('M -88 248 C -34 272, 40 272, 90 246 L 132 228');
const HEM_FR = new Frame(0, 228, 0, 272);
const SKIRT_MOON = crescentShape(-4, 120, 30, 23, 11);
const SASH = Shape.d(
  'M -66 -122 C -20 -100, 34 -100, 70 -122 L 72 -52 C 34 -32, -20 -32, -68 -54 Z',
  true,
);
const SASH_FOLDS = mkPath('M -50 -112 L -52 -50 M -14 -104 L -16 -42 M 22 -104 L 22 -42');
const BELT = Shape.d('M -66 -66 C -20 -44, 34 -44, 72 -66 L 72 -52 C 34 -30, -20 -30, -68 -52 Z');
const BUCKLE = crescentShape(76, -84, 26, 19, 9);
const SATCHEL = Shape.d('M 40 -30 L 126 -22 L 134 90 C 100 106, 64 104, 38 94 Z');
const SATCHEL_FLAP = Shape.d('M 38 -34 L 128 -26 L 130 30 C 100 44, 66 42, 38 32 Z', true);
const SATCHEL_BUCKLE = Shape.d(rr(76, 24, 22, 26, 5), true);
const FR_SASH = new Frame(0, 0.15, 0, -0.3);

// ── Pauldron, elbow, fist ─────────────────────────────────────

function lame(r: number, off: number): Shape {
  return new Shape(
    mkPath(
      `M ${-r} ${off} A ${r} ${r * 0.58} 0 0 1 ${r * 0.9} ${off - 8} L ${r * 0.8} ${off + 22} ` +
        `Q 0 ${off + 34} ${-r} ${off + 12} Z`,
    ),
    new Frame(-r, 0, r, 0),
  );
}
const LAMES = [lame(62, 30), lame(56, 12), lame(50, -4)];
const PAULDRON_HI = mkPath('M -46 -12 A 50 44 0 0 1 36 -26');
const PAULDRON_RIM = mkPath('M -50 -4 A 50 44 0 0 1 44 -22');
const PAULDRON_MOON = crescentShape(2, -28, 21, 16, 8);
const PAULDRON_RIVETS = rivetPath([-24, 6, 10, -4, 38, 4], 4.2);
const ARMBAND = Shape.d('M -40 76 Q 0 90 40 76 L 41 108 Q 0 122 -41 108 Z', true);
const COUTER = Shape.d('M -28 -6 L -58 20 L -26 28 Z', true);
const FIST = Shape.d('M -25 -26 C -30 -6, -26 20, -10 30 L 14 30 C 28 20, 30 -6, 25 -26 Z');
const FIST_LAMES = mkPath('M -26 -12 Q 0 -5 26 -12 M -26 2 Q 0 9 26 2 M -26 16 Q 0 23 26 16');
const FIST_HI = mkPath('M -20 -22 C -24 -4, -20 16, -8 26');
const CUFF = Shape.d('M -36 -44 L 36 -44 L 30 -16 Q 0 -8 -30 -16 Z', true);
const CUFF_EDGE = mkPath('M -33 -16 Q 0 -8 33 -16');
const CUFF_FR = new Frame(0, -16, 0, -8);

// ── Knee, boot ────────────────────────────────────────────────

const POLEYN = Shape.d('M 18 -20 C 56 -26, 72 6, 54 30 C 40 40, 16 24, 18 -20 Z', true);
const KNEE_BAND = Shape.d(rr(-46, -8, 92, 18, 7), true);
const BOOT = Shape.d(
  'M -38 -14 L 32 -18 C 74 -14, 108 0, 136 14 C 154 8, 168 -8, 178 -22 C 184 0, 178 28, 154 40 L -40 40 Z',
  true,
);
const BOOT_SEAM = mkPath('M 6 14 C 50 14, 96 20, 140 32');
const HEEL = Shape.d('M -40 22 L -4 22 L -6 40 L -42 40 Z');
const ANKLE = Shape.d(rr(-36, -26, 74, 16, 6), true);
const TOE_CAP = Shape.d(
  'M 112 4 C 130 12, 152 6, 170 -12 C 176 6, 170 28, 152 38 C 134 30, 118 18, 112 4 Z',
);

// ── Helm, mask, borK (origin: the head centre) ────────────────

const HELM = Shape.d(
  'M -52 10 C -66 -62, -24 -98, 22 -92 C 64 -86, 92 -44, 90 6 L 88 44 C 80 76, 44 92, 4 88 C -36 82, -56 50, -52 10 Z',
);
const MASK = Shape.d(
  'M 14 -34 C 56 -34, 92 -14, 94 10 L 90 46 C 76 74, 40 82, 8 72 C 8 30, 10 -10, 14 -34 Z',
  true,
);
const SLIT = Shape.d('M 24 -18 L 88 -12 L 88 0 L 24 -6 Z');
const SLIT_LIGHT = mkPath('M 46 -11 L 82 -7');
const BROW = mkPath('M -54 -46 C -10 -66, 52 -62, 94 -34');
const BROW_FR = new Frame(0, -66, 0, -34);
const NASAL = mkPath('M 68 -50 L 72 30');
const NASAL_FR = new Frame(60, 0, 82, 0);
const MOUSTACHE = Shape.d(
  'M 22 44 C 50 34, 86 40, 104 22 C 114 20, 118 30, 110 40 C 96 66, 56 66, 22 56 Z',
  true,
);
const MASK_HI = mkPath('M 24 -22 C 20 10, 20 40, 28 62');
const BORK = Shape.d(
  'M -54 -52 C -70 -120, -62 -196, -38 -244 C -8 -262, 44 -250, 70 -222 C 78 -164, 88 -100, 90 -54 Z',
);
const BORK_SEAMS = mkPath('M 0 -246 C -2 -170, 0 -110, 6 -60 M 40 -240 C 44 -170, 50 -110, 56 -60');
const BORK_HI = mkPath('M -52 -96 C -60 -150, -48 -204, -30 -236');
const BORK_FOLD = mkPath('M -42 -226 C 0 -250, 46 -242, 68 -214');
const WRAP = Shape.d(
  'M -60 -40 C -10 -28, 52 -32, 94 -46 L 94 -80 C 52 -68, -10 -64, -60 -76 Z',
  true,
);
const WRAP_EDGE = mkPath('M -60 -42 C -10 -30, 52 -34, 94 -48');
const WRAP_FR = new Frame(0, -80, 0, -30);
const SPOON = Shape.d(
  'M 62 -66 L 108 -80 C 118 -112, 116 -150, 106 -182 L 76 -176 C 72 -146, 66 -104, 62 -66 Z',
);
const SPOON_BANDS = mkPath('M 66 -100 L 112 -112 M 72 -138 L 114 -148');
const HELM_RIVETS = rivetPath([-34, -34, -14, -40, 78, -42, 80, 28], 4);
const FR_PLUME = new Frame(0, 0.25, 0, -0.25);
const FR_TAIL = new Frame(0, 0.2, 0, -0.2);

// ── Limb tubes (built once per class and segment) ─────────────

const TUBES: (Tube | undefined)[] = [];
function tube(seg: number, cls: number, len: number, r0: number, r1: number): Tube {
  const i = seg * 3 + cls;
  let t = TUBES[i];
  if (!t || t.r0 !== r0 || t.len !== len) {
    // upper arm: baggy sleeve; forearm: vambrace; thigh: trouser; shin: boot shaft
    const lames = seg === 0 ? 1 : seg === 1 ? 2 : seg === 2 ? 1 : 1;
    const bulge = seg === 0 ? 0.016 : seg === 2 ? 0.02 : seg === 3 ? 0.008 : 0.004;
    t = new Tube(len, r0, r1, lames, bulge);
    TUBES[i] = t;
  }
  return t;
}

const limbs = (): LimbStyle => ({
  upper: 'cloth',
  fore: 'armour',
  thigh: 'cloth',
  shin: 'leather',
  arm: 0.86,
  leg: 0.95,
});

const FEATHER_W = [0.9, 1, 1.1] as const;

export const janissary: Look = {
  model: 'janissary',
  sabre: true,
  headScale: 1.08,
  limbs,
  shieldWith: (w) => w === 'blunt',

  segment(f, seg, far, len, r0, r1) {
    const m = mats(f);
    const mat =
      seg === 0
        ? far
          ? m.robeFar
          : m.robe
        : seg === 1
          ? far
            ? m.steelFar
            : m.steel
          : seg === 2
            ? far
              ? m.robeFar
              : m.lining
            : far
              ? m.bootFar
              : m.boot;
    paintTube(f.ctx, tube(seg, f.cls, len, r0, r1), mat, !far);
  },

  back(f) {
    const c = f.ctx;
    const m = mats(f);
    const t = f.t;
    const lod = K.lod;
    c.save();
    c.scale(f.g, 1);
    refIn(c, 0, 0);
    c.save();
    c.translate(PACK_X, PACK_Y);
    c.rotate(PACK_LEAN);
    paint(c, PACK, m.copper, inkR(6));
    if (lod > 0) {
      streak(c, PACK_HI, inkR(5), 0.4);
      paint(c, PACK_BANDS, m.brass, inkR(4));
    }
    rivets(c, PACK_RIVETS, inkR(1.5));
    paint(c, PACK_COLLAR, m.steel, inkR(5), true);
    // Crescent horns: the steam vent.
    c.save();
    c.translate(0, -26);
    c.rotate(-Math.PI / 2);
    paint(c, HORNS, m.brass, inkR(5.5));
    c.restore();
    flat(c, PORT.p, '#1b1d25');
    glow(c, 'ember', 0, 120, 30, 30, 0.8 + 0.2 * Math.sin(t * 3.1 + 1) + 0.06 * Math.sin(t * 11));
    c.lineWidth = inkR(5);
    c.strokeStyle = m.brass.grad(c, PORT.fr, false);
    c.stroke(PORT.p);
    c.restore();
    band(c, PIPE_TOP, PIPE_TOP_FR, m.brass, inkR(20), 12);
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
    paint(c, ROBE, m.robe, inkR(6));
    if (lod > 0) {
      streak(c, ROBE_HI, inkR(4), 0.4);
      seam(c, ROBE_SEAM, inkR(3), 0.4);
    }
    paint(c, LAPEL, m.lining, inkR(5), true);
    if (lod > 0) {
      c.fillStyle = m.brass.at(0);
      c.fill(BUTTONS);
      c.lineWidth = inkR(2.5);
      c.strokeStyle = '#0e1118';
      c.stroke(BUTTONS);
    }
    paint(c, COLLAR, m.lining, inkR(5), true);
    if (lod > 0) {
      band(c, COLLAR_EDGE, COLLAR_FR, m.brass, inkR(11), 6);
      seam(c, SHOULDER_SEAM, inkR(3), 0.45);
    }
    // The chest mirror: a round steel plate in a brass ring, a glowing crescent window.
    paint(c, PLATE_B, m.steel, inkR(5), true);
    paint(c, PLATE_A, m.steel, inkR(5), true);
    rivets(c, PLATE_RIVETS, inkR(1.5));
    paint(c, MIRROR, m.steel, inkR(6));
    c.lineWidth = inkR(11);
    c.lineCap = 'round';
    c.strokeStyle = '#0e1118';
    c.stroke(MIRROR_RING);
    c.lineWidth = inkR(6.5);
    c.strokeStyle = m.brass.grad(c, MIRROR_FR, false);
    c.stroke(MIRROR_RING);
    rivets(c, MIRROR_RIVETS, inkR(1.5));
    flat(c, WINDOW, '#1a0e08');
    c.save();
    c.clip(WINDOW);
    glow(c, 'ember', 22, -246, 44, 36, 0.78 + 0.22 * Math.sin(f.t * 3.1 + 0.6));
    c.restore();
    c.lineWidth = inkR(4);
    c.strokeStyle = '#0e1118';
    c.stroke(WINDOW);
    if (lod > 0) streak(c, MIRROR_HI, inkR(5), 0.5);
    refOut(c);
    c.restore();
  },

  front(f) {
    // A bandolier across the chest: powder cases, or iron grenados for the bombardier.
    const c = f.ctx;
    const m = mats(f);
    const bomb = f.spec.weaponType === 'explosive';
    c.save();
    c.scale(f.g, 1);
    refIn(c, 0, 0);
    c.lineCap = 'round';
    c.lineWidth = inkR(26);
    c.strokeStyle = '#0e1118';
    c.beginPath();
    c.moveTo(-44, -344);
    c.quadraticCurveTo(30, -250, 90, -110);
    c.stroke();
    c.lineWidth = inkR(17);
    c.strokeStyle = m.leather.grad(c, STRAP_FR, true);
    c.stroke();
    if (K.lod > 0) {
      for (let i = 0; i < 6; i++) {
        const k = 0.14 + i * 0.145;
        const x = (1 - k) * (1 - k) * -44 + 2 * k * (1 - k) * 30 + k * k * 90;
        const y = (1 - k) * (1 - k) * -344 + 2 * k * (1 - k) * -250 + k * k * -110;
        if (bomb) {
          disc(c, m.iron, x + 8, y + 12, 17, inkR(4.5));
          c.fillStyle = m.brass.at(0);
          c.fillRect(x + 3, y - 8, 10, 8);
        } else {
          c.save();
          c.translate(x + 6, y + 10);
          c.rotate(-0.55);
          paint(c, CASE, m.leather, inkR(4.5));
          paint(c, CASE_CAP, m.brass, inkR(3.5), true);
          c.restore();
        }
      }
    }
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
    // Kaftan skirt: lags behind the stride; crimson lining flares behind, an open flap in front.
    c.save();
    const k = -0.05 - f.drag * 0.4 + Math.sin(f.t * 2.1) * 0.03;
    c.transform(1, 0, k, 1, k * 74, 0);
    paint(c, FLARE_BACK, m.lining, inkR(5), true);
    paint(c, SKIRT, m.robe, inkR(5.5), true);
    paint(c, FLAP, m.lining, inkR(5), true);
    if (lod > 0) {
      seam(c, SKIRT_FOLDS, inkR(3), 0.4);
      c.save();
      c.translate(0, 0);
      paint(c, SKIRT_MOON, m.brass, inkR(3.5));
      c.restore();
    }
    band(c, HEM, HEM_FR, m.brass, inkR(15), 9);
    c.restore();
    // Wide side-colour sash, belt and crescent buckle.
    paint(c, SASH, f.acc.as('cloth'), inkR(5), true);
    if (lod > 0) seam(c, SASH_FOLDS, inkR(2.5), 0.35);
    paint(c, BELT, m.leather, inkR(4));
    paint(c, BUCKLE, m.brass, inkR(4));
    if (f.spec.weaponType === 'explosive') {
      // The bombardier's grenade satchel.
      c.save();
      c.translate(0, 0);
      paint(c, SATCHEL, m.leather, inkR(5));
      paint(c, SATCHEL_FLAP, m.leather, inkR(4.5), true);
      paint(c, SATCHEL_BUCKLE, m.brass, inkR(3.5), true);
      c.restore();
    }
    refOut(c);
    c.restore();
    // Sash tails knotted at the hip, streaming behind the stride.
    const acc = f.acc.as('cloth');
    flag(
      c,
      acc,
      FR_SASH,
      0.1,
      0.12,
      -Math.PI / 2 - 0.1,
      -0.3,
      0.34,
      0.1,
      0.06,
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
      0.1,
      0.12,
      -Math.PI / 2 - 0.65,
      -0.4,
      0.28,
      0.09,
      0.05,
      0.18,
      f.t,
      2.2,
      -f.drag * 0.8,
      inkU(4),
      6,
    );
    disc(c, acc, 0.1, 0.125, 0.034, inkU(3.5));
  },

  head(f) {
    const c = f.ctx;
    const m = mats(f);
    const lod = K.lod;
    const s = [0.96, 1, 1.05][f.cls] as number;
    const pw = FEATHER_W[f.cls] as number;
    c.save();
    c.translate(0, 0.04);
    c.scale(s, s);
    // The borK tail: a long felt sleeve falling from the cap to the shoulders.
    flag(
      c,
      m.felt,
      FR_TAIL,
      -0.07,
      0.3,
      4.3,
      0.3,
      0.42,
      0.17,
      0.11,
      0.08,
      f.t,
      0.3,
      -f.drag * 0.9,
      inkU(4.5),
      7,
    );
    // Plume in the side colour from the spoon holder.
    const pm = f.acc.as('cloth');
    flag(
      c,
      pm,
      FR_PLUME,
      0.17,
      0.27,
      1.5,
      1.15,
      0.36 * pw,
      0.12 * pw,
      0.02,
      0.22,
      f.t,
      0.7,
      f.drag * 0.5,
      inkU(4.5),
      7,
    );
    flag(
      c,
      pm,
      FR_PLUME,
      0.17,
      0.27,
      1.95,
      0.9,
      0.28 * pw,
      0.09 * pw,
      0.02,
      0.2,
      f.t,
      1.8,
      f.drag * 0.5,
      inkU(4),
      6,
    );
    if (f.hero)
      flag(
        c,
        m.brass,
        FR_PLUME,
        0.17,
        0.27,
        1.7,
        1.0,
        0.3,
        0.03,
        0.01,
        0.2,
        f.t,
        0.4,
        f.drag * 0.5,
        inkU(3),
        6,
      );
    refIn(c, 0, 0);
    paint(c, HELM, m.steel, inkR(6));
    paint(c, MASK, m.iron, inkR(5), true);
    flat(c, SLIT.p, '#150a06');
    c.lineWidth = inkR(3);
    c.strokeStyle = '#0e1118';
    c.stroke(SLIT.p);
    glow(c, 'eye', 64, -9, 27, 9, 0.8 + 0.2 * Math.sin(f.t * 2.6));
    c.lineWidth = inkR(4);
    c.lineCap = 'round';
    c.strokeStyle = '#ffe29a';
    c.stroke(SLIT_LIGHT);
    paint(c, MOUSTACHE, m.brass, inkR(4), true);
    if (lod > 0) {
      band(c, NASAL, NASAL_FR, m.brass, inkR(12), 7);
      streak(c, MASK_HI, inkR(4), 0.45);
    }
    // The cap: felt borK over a crimson wrap and a brass brow band.
    paint(c, BORK, m.felt, inkR(6));
    if (lod > 0) {
      seam(c, BORK_SEAMS, inkR(3), 0.35);
      seam(c, BORK_FOLD, inkR(3), 0.4);
      streak(c, BORK_HI, inkR(5), 0.55);
    }
    paint(c, WRAP, m.lining, inkR(5), true);
    band(c, WRAP_EDGE, WRAP_FR, m.brass, inkR(12), 7);
    band(c, BROW, BROW_FR, m.brass, inkR(12), 7);
    paint(c, SPOON, m.brass, inkR(5));
    if (lod > 0) {
      seam(c, SPOON_BANDS, inkR(3), 0.7);
      rivets(c, HELM_RIVETS, inkR(1.5));
      glint(c, 90, -120, 14, 0.5 + 0.45 * Math.sin(f.t * 2.9 + 1));
    }
    refOut(c);
    c.restore();
  },

  pad(f, far) {
    const c = f.ctx;
    const m = mats(f);
    const lod = K.lod;
    const kk = [0.95, 1.1, 1.26][f.cls] as number;
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
      band(c, PAULDRON_RIM, PAULDRON_RIM_FR, m.brass, inkR(10), 6);
    }
    paint(c, PAULDRON_MOON, m.brass, inkR(4));
    rivets(c, PAULDRON_RIVETS, inkR(1.5));
    glint(c, 0, -20, 20, 0.55 + 0.4 * Math.sin(f.t * 2.4));
    refOut(c);
    c.restore();
  },

  fore(f, far) {
    const c = f.ctx;
    const m = mats(f);
    const r = 0.05 * (f.g > 1 ? 1.1 : f.g < 1 ? 0.92 : 1);
    if (!far) {
      refIn(c, 0, 0);
      paint(c, COUTER, m.steel, inkR(5), true);
      refOut(c);
    }
    joint(c, far ? m.steelFar : m.steel, m.brass, 0, 0, r, inkU(5));
  },

  hand(f, far) {
    const c = f.ctx;
    const m = mats(f);
    c.save();
    c.scale(0.5 + f.g * 0.5, 1);
    refIn(c, 0, 2);
    paint(c, FIST, far ? m.steelFar : m.steel, inkR(5));
    if (K.lod > 0) {
      seam(c, FIST_LAMES, inkR(3));
      streak(c, FIST_HI, inkR(3), 0.5);
    }
    paint(c, CUFF, far ? m.robeFar : m.robe, inkR(4.5), true);
    if (K.lod > 0) band(c, CUFF_EDGE, CUFF_FR, m.brass, inkR(9), 5);
    refOut(c);
    c.restore();
  },

  shin(f, far) {
    const c = f.ctx;
    const m = mats(f);
    const r = 0.07 * f.g;
    if (!far) {
      c.save();
      c.scale(f.g, 1);
      refIn(c, 0, 0);
      paint(c, KNEE_BAND, m.brass, inkR(4.5), true);
      if (K.lod > 0) paint(c, POLEYN, m.steel, inkR(5), true);
      refOut(c);
      c.restore();
    }
    joint(c, far ? m.steelFar : m.steel, m.brass, 0, 0, r, inkU(5));
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
      paint(c, TOE_CAP, m.brass, inkR(3.5));
    }
    paint(c, HEEL, m.leather, inkR(4));
    paint(c, ANKLE, m.brass, inkR(4), true);
    refOut(c);
    c.restore();
  },

  shield: () => true,

  over(f) {
    // Steam jetting from the two horns of the crescent vent, drifting back with the stride.
    const c = f.ctx;
    const n = K.lod === 0 ? 2 : K.lod === 1 ? 3 : 4;
    c.save();
    c.translate(0, 0.96);
    c.rotate(f.pose.lean);
    c.scale(f.g, 1);
    for (let h = 0; h < 2; h++) {
      const x0 = h === 0 ? HORN_X0 : HORN_X1;
      for (let i = 0; i < n; i++) {
        const ph = (f.t * 0.6 + i / n + h * 0.37) % 1;
        const x =
          x0 -
          ph * 0.34 +
          (h === 0 ? -1 : 1) * ph * 0.03 -
          f.drag * 0.16 * ph +
          Math.sin(f.t * 2 + i + h * 3) * 0.012;
        const y = HORN_Y + ph * 0.46;
        const r = 0.035 + ph * 0.11;
        glow(c, 'steam', x, y, r, r, Math.min(1, (1 - ph) * 1.4) * 0.85);
      }
    }
    c.restore();
  },
};

// ── Small details referenced above ────────────────────────────

const PAULDRON_RIM_FR = new Frame(0, -30, 0, 0);
const MIRROR_HI = mkPath('M -14 -280 A 56 56 0 0 0 -22 -226');
const STRAP_FR = new Frame(0, -344, 0, -110);
const CASE = Shape.d(rr(-10, -26, 20, 52, 6));
const CASE_CAP = Shape.d(rr(-12, -34, 24, 14, 5), true);
