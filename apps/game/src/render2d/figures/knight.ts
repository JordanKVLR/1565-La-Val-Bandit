import {
  Frame,
  K,
  RS,
  Shape,
  Tube,
  band,
  disc,
  flag,
  glint,
  flat,
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
 * The Order's knightly armatura (frames cavaliere, bastiun, lanza, kaptan), after the approved
 * hand-drawn reference docs/art/cavaliere/ (still-generator.mjs). Static plates are authored in
 * reference pixels (570 px = 1 world unit, y down) exactly as in the reference, so a shape here can
 * be compared to its source line by line. Everything is cylinder-shaded steel, brass and cloth
 * built with the kit in kit.ts; see docs/art/FIGURE_STYLE.md.
 */

// ── Materials ─────────────────────────────────────────────────

interface Mats {
  steel: Swatch;
  /** Far-side limbs: the same steel, a step darker. */
  steelFar: Swatch;
  brass: Swatch;
  cloth: Swatch;
  white: Swatch;
  leather: Swatch;
}
const MATS = new WeakMap<Palette, Mats>();

function mats(f: F): Mats {
  let m = MATS.get(f.p);
  if (!m) {
    const armour = f.p.armour.c[0] as string;
    m = {
      steel: f.p.armour.as(f.hero ? 'enamel' : 'metal'),
      steelFar: sw(darker(armour), f.hero ? 'enamel' : 'metal'),
      brass: sw(f.hero ? (f.p.trim.c[0] as string) : '#d9a443', 'metal'),
      cloth: f.p.cloth.as('cloth'),
      white: sw('#f6f1e4', 'soft'),
      leather: sw('#7a4a22', 'matte'),
    };
    MATS.set(f.p, m);
  }
  return m;
}

function darker(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const k = 0.62;
  const ch = (v: number): string =>
    Math.round(v * k + 22 * (1 - k))
      .toString(16)
      .padStart(2, '0');
  return '#' + ch((n >> 16) & 255) + ch((n >> 8) & 255) + ch(n & 255);
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

/** The eight-pointed cross of the Order (four swallow-tailed arms), original vector, scale `k`. */
function crossShape(k: number): Shape {
  const p = mkPath();
  const arm: readonly number[] = [-11, -16, -38, -92, 0, -72, 38, -92, 11, -16];
  for (let a = 0; a < 4; a++) {
    const c = Math.cos((a * Math.PI) / 2);
    const s = Math.sin((a * Math.PI) / 2);
    for (let i = 0; i < arm.length; i += 2) {
      const x = (arm[i] as number) * k;
      const y = (arm[i + 1] as number) * k;
      const px = x * c - y * s;
      const py = x * s + y * c;
      if (i === 0) p.moveTo(px, py);
      else p.lineTo(px, py);
    }
    p.closePath();
  }
  return new Shape(p, new Frame(-92 * k, 0, 92 * k, 0));
}
const CROSS_BREAST = crossShape(0.36);
const CROSS_TABARD = crossShape(0.5);
const CROSS_SHIELD = crossShape(1.28);

// ── Torso (reference origin: the hip, 500,752) ────────────────

const CUIRASS = Shape.d(
  'M 428 392 C 392 452, 412 584, 446 664 L 552 668 C 600 580, 610 460, 568 396 C 530 372, 470 372, 428 392 Z',
);
const CUI_RIDGE = mkPath('M 506 384 C 520 470, 520 580, 514 664');
const CUI_HI = mkPath('M 436 420 C 424 482, 436 588, 456 650');
const CUI_RIM = mkPath('M 600 470 C 604 540, 584 620, 552 664');
const BAND_UP = mkPath('M 432 470 C 500 512, 560 494, 594 456');
const BAND_LO = mkPath('M 448 608 C 500 632, 548 624, 578 604');
const BAND_FR_UP = new Frame(0, 456, 0, 512);
const BAND_FR_LO = new Frame(0, 604, 0, 632);
const TORSO_RIVETS = rivetPath(
  [452, 474, 492, 492, 532, 492, 570, 466, 462, 616, 504, 630, 544, 624],
  4.4,
);
const FURNACE = Shape.d(rr(470, 548, 78, 40, 8));
const LOUVRES = Shape.d(
  'M 470 556 L 548 556 L 548 561 L 470 561 Z M 470 565 L 548 565 L 548 570 L 470 570 Z ' +
    'M 470 574 L 548 574 L 548 579 L 470 579 Z',
  true,
);
const GORGET = Shape.d(
  'M 462 372 C 470 340, 546 338, 556 372 L 566 404 C 520 424, 466 420, 452 404 Z',
  true,
);
const GORGET_LINES = mkPath(
  'M 458 392 C 500 410, 530 410, 564 392 M 456 380 C 500 396, 530 396, 562 380',
);
const BELT = Shape.d(
  'M 440 650 C 500 672, 548 670, 560 650 L 562 690 C 520 710, 470 708, 442 692 Z',
);
const BUCKLE = Shape.d(rr(494, 654, 30, 40, 6));
const MEDAL = new Shape(
  (() => {
    const p = mkPath();
    p.moveTo(540, 466);
    p.arc(540, 500, 34, -Math.PI / 2, Math.PI / 2, false);
    p.closePath();
    return p;
  })(),
  new Frame(540, 0, 574, 0),
);
const MEDAL_RAYS = (() => {
  const p = mkPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i + 0.5) * (Math.PI / 5);
    p.moveTo(540 + Math.cos(a) * 40, 500 + Math.sin(a) * 40);
    p.lineTo(540 + Math.cos(a) * 54, 500 + Math.sin(a) * 54);
  }
  return p;
})();
const SASH = Shape.d('M 436 404 L 478 396 L 604 636 L 566 668 Z');

// ── Back: boiler pack, pipes and tabard ───────────────────────

const PACK = Shape.d(rr(-62, -6, 124, 268, 46));
const PACK_BANDS = Shape.d([34, 96, 158, 220].map((y) => rr(-66, y, 132, 14, 6)).join(' '), false);
const PACK_RIVETS = rivetPath(
  [34, 96, 158, 220].flatMap((y) => [-52, y + 7, 52, y + 7, 0, y + 7]),
  3.6,
);
const PACK_CAP = Shape.d(rr(-26, -34, 52, 40, 12), true);
const PACK_VENT = Shape.d(rr(-14, -56, 28, 28, 8), true);
const PACK_FURNACE = Shape.circle(0, 124, 30);
const PACK_HI = mkPath('M -46 18 C -52 80, -52 190, -42 240');
const GAUGE = Shape.circle(0, 0, 19);
const PIPE_TOP = mkPath('M 420 372 C 440 342, 452 350, 470 386');
const PIPE_TOP_FR = new Frame(0, 342, 0, 386);
const PIPE_LOW = mkPath('M 392 560 C 372 620, 400 668, 458 690');
const PIPE_LOW_FR = new Frame(0, 560, 0, 690);
const TABARD = Shape.d(
  'M 442 690 C 436 780, 430 870, 438 966 L 560 990 C 566 890, 566 790, 556 690 Z',
  true,
);
const TABARD_FOLDS = mkPath(
  'M 488 668 C 480 770, 480 880, 486 980 M 524 664 C 522 780, 526 890, 534 988',
);
const TABARD_HEM = Shape.d('M 438 966 L 560 990 L 556 1004 L 436 980 Z', true);
/** Pack-local to reference: the pack hangs from (404,392), leaning back 8 degrees. */
const PACK_LEAN = (8 * Math.PI) / 180;
/** Steam vent in spine-frame world units (reference (412,332) relative to the hip). */
const VENT_X = (412 - 500) / 570;
const VENT_Y = (752 - 332) / 570;
const FR_PLUME = new Frame(0, 0.25, 0, -0.25);
const FR_SASH = new Frame(0, 0.15, 0, -0.3);

// ── Pauldron, elbow, fist (own origins) ───────────────────────

function lame(r: number, off: number): Shape {
  return new Shape(
    mkPath(
      `M ${-r} ${off} A ${r} ${r * 0.86} 0 0 1 ${r * 0.9} ${off - 8} L ${r * 0.8} ${off + 22} ` +
        `Q 0 ${off + 34} ${-r} ${off + 12} Z`,
    ),
    new Frame(-r, 0, r, 0),
  );
}
const LAMES = [lame(70, 36), lame(64, 18), lame(58, 0)];
const PAULDRON_HI = mkPath('M -54 -8 A 58 50 0 0 1 44 -26');
const PAULDRON_SPIKE = Shape.d('M -4 -52 L 6 -86 L 22 -48 Z', true);
const PAULDRON_RIVETS = rivetPath([-28, 8, 14, -2, 46, 6], 4.6);
const ARMBAND = Shape.d('M -40 76 Q 0 90 40 76 L 41 108 Q 0 122 -41 108 Z', true);
const COUTER = Shape.d('M -30 -6 L -62 22 L -28 28 Z', true);
const FIST = Shape.d('M -25 -26 C -30 -6, -26 20, -10 30 L 14 30 C 28 20, 30 -6, 25 -26 Z');
const FIST_LAMES = mkPath(
  'M -26 -14 Q 0 -7 26 -14 M -26 -2 Q 0 5 26 -2 M -26 10 Q 0 17 26 10 M -26 22 Q 0 29 26 22',
);
const FIST_HI = mkPath('M -20 -22 C -24 -4, -20 16, -8 26');
const CUFF = Shape.d(rr(-30, -36, 60, 14, 6), true);

// ── Legs and feet ─────────────────────────────────────────────

const PISTON = Shape.d(rr(24, 100, 28, 135, 8));
const PISTON_RING = Shape.d(rr(20, 140, 36, 9, 4) + ' ' + rr(20, 186, 36, 9, 4), true);
const PISTON_ROD = Shape.d(rr(31, 232, 14, 52, 5), false);
const PISTON_RIVETS = rivetPath([38, 112, 38, 282], 5);
const POLEYN = Shape.d('M 22 -16 L 66 -6 L 24 14 Z', true);
const FOOT = Shape.d('M -34 -10 L 32 -14 C 70 -4, 110 8, 152 26 L 144 38 L -36 38 Z', true);
const FOOT_SEAM = mkPath('M 8 12 C 50 12, 90 18, 126 30');
const ANKLE = Shape.d(rr(-32, -22, 68, 16, 6), true);

// ── Helm (reference origin: the helm centre) ──────────────────

const HELM = Shape.d(
  'M -52 10 C -66 -62, -24 -98, 22 -92 C 64 -86, 92 -44, 90 6 L 88 44 C 80 76, 44 92, 4 88 C -36 82, -56 50, -52 10 Z',
);
const VISOR = Shape.d('M 6 -62 C 52 -58, 90 -22, 92 4 L 90 30 C 52 22, 26 18, 4 20 Z', true);
const SLIT = Shape.d('M 16 -22 L 84 -14 L 84 -2 L 16 -8 Z');
const SLIT_LIGHT = mkPath('M 44 -13 L 80 -9');
const VENTS = (() => {
  const p = mkPath();
  for (let i = 0; i < 5; i++) {
    p.moveTo(50 + i * 8, 40 - i * 1.5);
    p.lineTo(52 + i * 8, 60);
  }
  return p;
})();
const CREST = mkPath('M -40 -62 C -4 -104, 44 -98, 84 -46');
const CREST_FR = new Frame(0, -104, 0, -46);
const CHIN_BAND = mkPath('M -46 18 L 6 22');
const CHIN_FR = new Frame(0, 18, 0, 22);
const HELM_RIVETS = rivetPath([-30, -28, -14, -44, -8, 30, -34, 4, 18, -58], 4.4);
const HELM_HI = mkPath('M -44 -20 C -38 -62, -6 -86, 22 -82');
const PIVOT = Shape.circle(-20, 22, 14);

// ── Limb tubes (built once per class and segment) ─────────────

const TUBES: (Tube | undefined)[] = [];
function tube(seg: number, cls: number, len: number, r0: number, r1: number): Tube {
  const i = seg * 3 + cls;
  let t = TUBES[i];
  if (!t || t.r0 !== r0 || t.len !== len) {
    t = new Tube(len, r0, r1, 2, seg === 2 ? 0.014 : seg === 3 ? 0.01 : 0.005);
    TUBES[i] = t;
  }
  return t;
}

const knightLimbs = (): LimbStyle => ({
  upper: 'armour',
  fore: 'armour',
  thigh: 'armour',
  shin: 'armour',
  arm: 0.82,
  leg: 0.9,
});

const PLUME_W = [0.9, 1, 1.12] as const;

export const knight: Look = {
  model: 'knight',
  headScale: 1.12,
  limbs: knightLimbs,
  shieldWith: (w) => w === 'blunt' || w === 'blade',

  segment(f, seg, far, len, r0, r1) {
    const m = mats(f);
    paintTube(f.ctx, tube(seg, f.cls, len, r0, r1), far ? m.steelFar : m.steel, !far);
  },

  back(f) {
    const c = f.ctx;
    const m = mats(f);
    const t = f.t;
    const lod = K.lod;
    c.save();
    c.scale(f.g, 1);
    refIn(c, 500, 752);
    // Boiler pack: brass cylinder with steel hoops, gauge and a glowing furnace.
    c.save();
    c.translate(404, 392);
    c.rotate(PACK_LEAN);
    paint(c, PACK, m.brass, inkR(6));
    if (lod > 0) {
      streak(c, PACK_HI, inkR(5), 0.4);
      paint(c, PACK_BANDS, m.steelFar, inkR(4));
    }
    rivets(c, PACK_RIVETS, inkR(1.5));
    paint(c, PACK_CAP, m.steel, inkR(5), true);
    paint(c, PACK_VENT, m.brass, inkR(5), true);
    const pulse = 0.8 + 0.2 * Math.sin(t * 3.1) + 0.06 * Math.sin(t * 11);
    flat(c, PACK_FURNACE.p, '#1b1d25');
    glow(c, 'ember', 0, 124, 30, 30, pulse);
    c.lineWidth = inkR(5);
    c.strokeStyle = m.brass.grad(c, PACK_FURNACE.fr, false);
    c.stroke(PACK_FURNACE.p);
    if (lod > 0) {
      c.save();
      c.translate(-34, 52);
      paint(c, GAUGE, m.white, inkR(4));
      c.lineWidth = inkR(4);
      c.strokeStyle = m.brass.grad(c, GAUGE.fr, false);
      c.stroke(GAUGE.p);
      const a = -0.8 + Math.sin(t * 1.7) * 0.35 + Math.sin(t * 7) * 0.04;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.sin(a) * 15, -Math.cos(a) * 15);
      c.lineWidth = inkR(3.5);
      c.strokeStyle = '#b01c24';
      c.stroke();
      c.restore();
    }
    c.restore();
    // Pipes from the pack to the gorget and the hip.
    band(c, PIPE_TOP, PIPE_TOP_FR, m.brass, inkR(22), 14);
    if (lod > 0) band(c, PIPE_LOW, PIPE_LOW_FR, m.steel, inkR(20), 12);
    refOut(c);
    c.restore();
  },

  torso(f) {
    const c = f.ctx;
    const m = mats(f);
    const lod = K.lod;
    c.save();
    c.scale(f.g, 1);
    refIn(c, 500, 752);
    paint(c, CUIRASS, m.steel, inkR(6));
    if (lod > 0) {
      seam(c, CUI_RIDGE, inkR(3), 0.5);
      streak(c, CUI_HI, inkR(4), 0.55);
      if (lod === 2) streak(c, CUI_RIM, inkR(3), 0.5, '#ffb866');
      band(c, BAND_UP, BAND_FR_UP, m.brass, inkR(11), 7);
      band(c, BAND_LO, BAND_FR_LO, m.brass, inkR(11), 7);
    }
    rivets(c, TORSO_RIVETS, inkR(1.5));
    if (f.hero) {
      // Half-sun medallion on the breast.
      if (lod > 0) {
        paint(c, MEDAL, m.brass, inkR(4));
        c.lineWidth = inkR(5);
        c.lineCap = 'round';
        c.strokeStyle = m.brass.at(2);
        c.stroke(MEDAL_RAYS);
      }
    } else if (lod > 0) {
      c.save();
      c.translate(520, 508);
      paint(c, CROSS_BREAST, m.white, inkR(4));
      c.restore();
    }
    // Furnace vent in the chest, breathing with time.
    flat(c, FURNACE.p, '#1a0e08');
    glow(c, 'ember', 509, 568, 40, 21, 0.72 + 0.28 * Math.sin(f.t * 3.1 + 0.6));
    c.lineWidth = inkR(4);
    c.strokeStyle = '#0e1118';
    c.stroke(FURNACE.p);
    if (lod > 0) paint(c, LOUVRES, m.steel, inkR(2.5), true);
    paint(c, GORGET, m.steel, inkR(5), true);
    if (lod > 0) seam(c, GORGET_LINES, inkR(3));
    paint(c, BELT, m.leather, inkR(5));
    paint(c, BUCKLE, m.brass, inkR(4), true);
    refOut(c);
    c.restore();
  },

  front(f) {
    if (!f.hero) return;
    // Gold sash across the chest.
    const c = f.ctx;
    c.save();
    c.scale(f.g, 1);
    refIn(c, 500, 752);
    paint(c, SASH, mats(f).brass, inkR(4.5), true);
    refOut(c);
    c.restore();
  },

  skirt(f) {
    const c = f.ctx;
    const m = mats(f);
    const lod = K.lod;
    c.save();
    c.scale(f.g * (f.cls === 2 ? 1.1 : 1), 1);
    refIn(c, 500, 752);
    // Tabard hanging from the belt, lagging behind the stride.
    c.save();
    const k = -0.06 - f.drag * 0.42 + Math.sin(f.t * 2.1) * 0.035;
    c.transform(1, 0, k, 1, -k * 650, 0);
    paint(c, TABARD, m.cloth, inkR(5), true);
    if (lod > 0) seam(c, TABARD_FOLDS, inkR(3), 0.4);
    c.save();
    c.translate(498, 906);
    paint(c, CROSS_TABARD, m.white, inkR(4));
    c.restore();
    paint(c, TABARD_HEM, m.brass, inkR(4), true);
    c.restore();
    // Tassets: overlapping steel plates below the belt.
    const n = f.cls === 0 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      paint(c, TASSETS[i] as Shape, m.steel, inkR(5));
      rivets(c, TASSET_RIVETS[i] as Path2D, inkR(1.5));
    }
    refOut(c);
    c.restore();
    // A brass piston strapped to the outside of the near thigh.
    if (lod > 0) {
      c.save();
      c.translate(0, 0);
      c.rotate(f.pose.hR);
      c.scale(f.g * 0.9, 1);
      c.rotate(0.1);
      refIn(c, 0, 0);
      paint(c, PISTON_ROD, m.steel, inkR(4));
      paint(c, PISTON, m.brass, inkR(5));
      paint(c, PISTON_RING, m.steelFar, inkR(3.5), true);
      rivets(c, PISTON_RIVETS, inkR(1.5));
      refOut(c);
      c.restore();
    }
    // The side colour: a sash knotted at the belt with a tail that lags behind the stride.
    const acc = f.acc.as('cloth');
    flag(
      c,
      acc,
      FR_SASH,
      0.1,
      0.12,
      -Math.PI / 2 - 0.12,
      -0.3,
      0.3,
      0.085,
      0.06,
      0.16,
      f.t,
      1.1,
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
    c.save();
    c.translate(0, 0.04);
    c.scale(s, s);
    // Plume streaming back from the crest: the side colour (the hero wears the Order's red).
    const pm = f.hero ? m.cloth : f.acc.as('cloth');
    const pw = PLUME_W[f.cls] as number;
    flag(
      c,
      pm,
      FR_PLUME,
      -0.07,
      0.03,
      3.4,
      0.7,
      0.32 * pw,
      0.11 * pw,
      0.02,
      0.2,
      f.t,
      0.9,
      f.drag * 0.9,
      inkU(4.5),
      7,
    );
    flag(
      c,
      pm,
      FR_PLUME,
      -0.02,
      0.13,
      2.55,
      1.4,
      0.56 * pw,
      0.15 * pw,
      0.02,
      0.22,
      f.t,
      0,
      f.drag * 0.9,
      inkU(5),
      8,
    );
    if (f.hero)
      flag(
        c,
        m.brass,
        FR_PLUME,
        -0.03,
        0.12,
        2.75,
        1.1,
        0.3,
        0.03,
        0.01,
        0.2,
        f.t,
        0.4,
        f.drag * 0.9,
        inkU(3),
        6,
      );
    refIn(c, 0, 0);
    paint(c, HELM, m.steel, inkR(6));
    paint(c, VISOR, m.steel, inkR(5), true);
    // Eye slit with an ember glow.
    flat(c, SLIT.p, '#150a06');
    c.lineWidth = inkR(3);
    c.strokeStyle = '#0e1118';
    c.stroke(SLIT.p);
    glow(c, 'eye', 62, -10, 26, 9, 0.8 + 0.2 * Math.sin(f.t * 2.6));
    c.lineWidth = inkR(4);
    c.lineCap = 'round';
    c.strokeStyle = '#ffe29a';
    c.stroke(SLIT_LIGHT);
    if (lod > 0) {
      c.lineWidth = inkR(4);
      c.strokeStyle = '#0e1118';
      c.stroke(VENTS);
      band(c, CREST, CREST_FR, m.brass, inkR(14), 10);
      band(c, CHIN_BAND, CHIN_FR, m.brass, inkR(13), 9);
      streak(c, HELM_HI, inkR(5), 0.6);
      rivets(c, HELM_RIVETS, inkR(1.5));
      paint(c, PIVOT, m.brass, inkR(4), true);
      glint(c, 34, -14, 14, 0.5 + 0.45 * Math.sin(f.t * 2.9 + 1));
    } else {
      band(c, CREST, CREST_FR, m.brass, inkR(12), 8);
    }
    refOut(c);
    c.restore();
  },

  pad(f, far) {
    const c = f.ctx;
    const m = mats(f);
    const lod = K.lod;
    const kk = [0.95, 1.15, 1.32][f.cls] as number;
    const swing = far ? f.pose.sL : f.pose.sR;
    if (!far) {
      // Side-colour armband on the upper arm (turns with the arm).
      c.save();
      c.scale(kk, 1);
      refIn(c, 0, 0);
      paint(c, ARMBAND, f.acc.as('cloth'), inkR(4), true);
      refOut(c);
      c.restore();
    }
    // The pauldron stays on the shoulder: it follows the arm only a little.
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
      streak(c, PAULDRON_HI, inkR(5), 0.6);
    }
    paint(c, PAULDRON_SPIKE, m.brass, inkR(4), true);
    rivets(c, PAULDRON_RIVETS, inkR(1.5));
    glint(c, 2, -22, 22, 0.55 + 0.4 * Math.sin(f.t * 2.4));
    refOut(c);
    c.restore();
  },

  fore(f, far) {
    const c = f.ctx;
    const m = mats(f);
    const r = 0.052 * (f.g > 1 ? 1.1 : f.g < 1 ? 0.92 : 1);
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
    paint(c, CUFF, m.brass, inkR(4), true);
    refOut(c);
    c.restore();
  },

  shin(f, far) {
    const c = f.ctx;
    const m = mats(f);
    const r = 0.075 * f.g;
    if (!far && K.lod > 0) {
      c.save();
      c.scale(f.g, 1);
      refIn(c, 0, 0);
      paint(c, POLEYN, m.steel, inkR(5), true);
      refOut(c);
      c.restore();
    }
    joint(c, far ? m.steelFar : m.steel, m.brass, 0, 0, r, inkU(5));
  },

  boot(f, far) {
    const c = f.ctx;
    const m = mats(f);
    const mat = far ? m.steelFar : m.steel;
    c.save();
    c.scale(f.g, 1);
    refIn(c, 0, 0);
    paint(c, FOOT, mat, inkR(5.5), true);
    if (K.lod > 0) seam(c, FOOT_SEAM, inkR(3), 0.55);
    paint(c, ANKLE, m.brass, inkR(4), true);
    refOut(c);
    c.restore();
  },

  shield: () => true,

  over(f) {
    // Steam from the vent on the pack: puffs rise, widen and drift back with the stride.
    const c = f.ctx;
    const n = K.lod === 0 ? 2 : K.lod === 1 ? 3 : 4;
    c.save();
    c.translate(0, 0.96);
    c.rotate(f.pose.lean);
    c.scale(f.g, 1);
    for (let i = 0; i < n; i++) {
      const ph = (f.t * 0.55 + i / n) % 1;
      const x = VENT_X - ph * 0.26 - f.drag * 0.2 * ph + Math.sin(f.t * 2 + i * 2) * 0.012;
      const y = VENT_Y + ph * 0.5;
      const r = 0.05 + ph * 0.14;
      glow(c, 'steam', x, y, r, r, Math.min(1, (1 - ph) * 1.4) * 0.9);
    }
    c.restore();
  },
};

// ── Tassets (three overlapping plates below the belt) ─────────

const TASSETS: Shape[] = [];
const TASSET_RIVETS: Path2D[] = [];
for (const [dx, dy, w, h] of [
  [-4, 692, 124, 70],
  [6, 728, 118, 66],
  [16, 762, 108, 60],
] as const) {
  const x = 442 + dx;
  TASSETS.push(
    Shape.d(
      `M ${x} ${dy} L ${x + w} ${dy} C ${x + w + 4} ${dy + h * 0.6}, ${x + w - 14} ${dy + h}, ${x + w * 0.5} ${dy + h + 6} ` +
        `C ${x + 14} ${dy + h}, ${x - 4} ${dy + h * 0.6}, ${x} ${dy} Z`,
    ),
  );
  TASSET_RIVETS.push(rivetPath([x + 16, dy + 14, x + w - 16, dy + 14], 3.8));
}

// ── Round shield with the cross ───────────────────────────────

const SH_RIM = Shape.circle(0, 0, 160);
const SH_FIELD = Shape.circle(0, 0, 150);
const SH_RING = Shape.circle(0, 0, 128);
const SH_BOSS = Shape.circle(0, 0, 30);
const SH_BOSS_IN = Shape.circle(0, 0, 12, true);
const SH_RIVETS = rivetPath(
  Array.from({ length: 12 }, (_, i) => [
    Math.cos((i / 12) * Math.PI * 2) * 142,
    Math.sin((i / 12) * Math.PI * 2) * 142,
  ]).flat(),
  4.2,
);
const SH_GLINT = mkPath('M -120 -40 A 150 150 0 0 1 -40 -120');

/** The round shield, drawn at the off hand (its centre floats ahead of the fist). */
export function knightShield(f: F): void {
  const c: Ctx = f.ctx;
  const m = mats(f);
  const k = RS * (1 + (f.cls - 1) * 0.08);
  c.save();
  c.translate(0.15, 0.1);
  c.scale(k, -k);
  c.rotate(-0.244);
  paint(c, SH_RIM, m.brass, inkR(6));
  paint(c, SH_FIELD, m.cloth, inkR(5));
  // The side colour rings the field.
  const acc = f.acc.as('cloth');
  c.lineWidth = inkR(17);
  c.strokeStyle = '#0e1118';
  c.stroke(SH_RING.p);
  c.lineWidth = inkR(11);
  c.strokeStyle = acc.grad(c, SH_RING.fr, false);
  c.stroke(SH_RING.p);
  paint(c, CROSS_SHIELD, m.white, inkR(4));
  paint(c, SH_BOSS, m.brass, inkR(5));
  paint(c, SH_BOSS_IN, m.steel, inkR(3), true);
  rivets(c, SH_RIVETS, inkR(1.5));
  if (K.lod > 0) streak(c, SH_GLINT, inkR(7), 0.38);
  c.restore();
}
