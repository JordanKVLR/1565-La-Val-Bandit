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
  mkPath,
  paint,
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
 * The Maltese militia armatura (frames haddiem and artigjan): farmers and townsfolk turned
 * fighters, in a patchwork harness riveted from salvaged Order plates onto a padded homespun
 * tunic. Earth, limestone and Maltese red; a small copper still instead of brass machinery. Same
 * kit and conventions as the Cavaliere (knight.ts): static plates in reference pixels (570 px = 1
 * world unit, y down, hip at (500,752)), cylinder-shaded materials, bold ink, LOD by on-screen
 * scale. Headgear varies with the weapon: straw hat, red kerchief or open sallet.
 */

// ── Materials ─────────────────────────────────────────────────

export interface MilMats {
  /** Salvaged Order plate: dull warm steel (white enamel for the hero). */
  steel: Swatch;
  steelFar: Swatch;
  /** A patch plate of a different iron. */
  patch: Swatch;
  copper: Swatch;
  brass: Swatch;
  tunic: Swatch;
  tunicFar: Swatch;
  trousers: Swatch;
  trousersFar: Swatch;
  puttee: Swatch;
  puttDeep: Swatch;
  red: Swatch;
  leather: Swatch;
  leatherDark: Swatch;
  straw: Swatch;
  skin: Swatch;
  skinFar: Swatch;
  hair: Swatch;
  wood: Swatch;
}
const MATS = new WeakMap<Palette, MilMats>();

export function darker(hex: string, k = 0.62): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number): string =>
    Math.round(v * k + 22 * (1 - k))
      .toString(16)
      .padStart(2, '0');
  return '#' + ch((n >> 16) & 255) + ch((n >> 8) & 255) + ch(n & 255);
}

export function milMats(f: F): MilMats {
  let m = MATS.get(f.p);
  if (!m) {
    const hero = f.hero;
    const steel = hero ? '#eef0f5' : '#a39e92';
    const tunic = hero ? '#f4eedc' : '#dccca2';
    const trousers = hero ? '#8c1a1f' : '#6e5136';
    const skin = f.p.skin.c[0] as string;
    m = {
      steel: sw(steel, hero ? 'enamel' : 'metal'),
      steelFar: sw(darker(steel), hero ? 'enamel' : 'metal'),
      patch: sw(hero ? '#d9dde6' : '#7b6b58', hero ? 'enamel' : 'metal'),
      copper: sw(hero ? '#e0b445' : '#cc7440', 'metal'),
      brass: sw(hero ? '#e0b445' : '#d6a548', 'metal'),
      tunic: sw(tunic, 'cloth'),
      tunicFar: sw(darker(tunic, 0.74), 'cloth'),
      trousers: sw(trousers, 'cloth'),
      trousersFar: sw(darker(trousers, 0.72), 'cloth'),
      puttee: sw(hero ? '#f4eedc' : '#cdbf98', 'cloth'),
      puttDeep: sw(hero ? '#c9c4b4' : '#a69a76', 'cloth'),
      red: sw(hero ? '#c0161f' : '#a8312a', 'cloth'),
      leather: sw('#7a4c27', 'matte'),
      leatherDark: sw('#4e2f19', 'matte'),
      straw: sw('#dcbf6c', 'cloth'),
      skin: sw(skin, 'soft'),
      skinFar: sw(darker(skin, 0.8), 'soft'),
      hair: sw('#3a281a', 'matte'),
      wood: sw('#8a5d33', 'matte'),
    };
    MATS.set(f.p, m);
  }
  return m;
}

// ── Path helpers ──────────────────────────────────────────────

/** SVG path data of a rounded rectangle. */
export function rr(x: number, y: number, w: number, h: number, r: number): string {
  return (
    `M ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} ` +
    `L ${x + w} ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} ` +
    `L ${x + r} ${y + h} Q ${x} ${y + h} ${x} ${y + h - r} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} Z`
  );
}

// ── Torso (reference origin: the hip, 500,752) ────────────────

const TUNIC = Shape.d(
  'M 430 396 C 392 462, 406 596, 436 700 L 560 704 C 606 604, 614 472, 572 404 C 534 376, 470 376, 430 396 Z',
);
const TUNIC_QUILT = mkPath(
  'M 462 410 C 452 500, 458 600, 470 692 M 500 400 C 496 500, 498 600, 504 698 ' +
    'M 540 402 C 548 500, 550 600, 540 698 M 426 520 C 480 536, 540 530, 604 512 ' +
    'M 434 606 C 490 622, 544 616, 598 598',
);
const TUNIC_HI = mkPath('M 442 428 C 430 490, 442 600, 458 676');
const TUNIC_RIM = mkPath('M 598 474 C 604 546, 588 640, 558 700');
const COLLAR = Shape.d(
  'M 450 394 C 448 354, 548 348, 558 388 L 562 416 C 520 432, 462 428, 450 412 Z',
  true,
);
const BREAST = Shape.d(
  'M 478 430 C 468 482, 480 558, 506 614 L 592 608 C 610 550, 608 480, 572 432 C 544 414, 504 414, 478 430 Z',
);
const BREAST_RIDGE = mkPath('M 536 422 C 542 484, 546 562, 548 608');
const BREAST_HI = mkPath('M 490 448 C 484 492, 492 552, 510 592');
const BREAST_RIM = mkPath('M 604 484 C 606 540, 600 580, 592 608');
const BREAST_RIVETS = rivetPath([494, 450, 568, 446, 504, 592, 584, 588], 4.2);
const PATCH = Shape.d(rr(514, 480, 56, 48, 7));
const PATCH_RIVETS = rivetPath([523, 489, 561, 489, 523, 519, 561, 519], 3.6);
const SCRATCH = mkPath('M 520 560 L 548 560 M 534 546 L 534 576');
const STRAP = mkPath('M 446 402 C 486 470, 544 562, 594 650');
const STRAP_FR = new Frame(446, 0, 594, 0);
const STRAP_BUCKLE = Shape.circle(520, 524, 17);
const BELT = Shape.d(
  'M 440 664 C 500 686, 548 684, 560 664 L 562 710 C 520 728, 470 726, 442 710 Z',
);
const BUCKLE = Shape.d(rr(498, 670, 30, 44, 7));
const MEDAL = new Shape(
  (() => {
    const p = mkPath();
    p.moveTo(544, 470);
    p.arc(544, 502, 30, -Math.PI / 2, Math.PI / 2, false);
    p.closePath();
    return p;
  })(),
  new Frame(544, 0, 574, 0),
);
const MEDAL_RAYS = (() => {
  const p = mkPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i + 0.5) * (Math.PI / 5);
    p.moveTo(544 + Math.cos(a) * 36, 502 + Math.sin(a) * 36);
    p.lineTo(544 + Math.cos(a) * 50, 502 + Math.sin(a) * 50);
  }
  return p;
})();
const SASH = Shape.d('M 440 410 L 480 400 L 604 636 L 566 668 Z');

// ── Back: the copper still, bedroll, pipes ────────────────────

const POT = Shape.d('M -48 -52 C -92 -30, -92 54, -42 76 L 44 76 C 92 54, 92 -30, 48 -52 Z');
const POT_BANDS = mkPath('M -78 -18 C -30 -4, 30 -4, 78 -18 M -76 40 C -30 54, 30 54, 76 40');
const POT_BAND_FR = new Frame(0, -20, 0, 54);
const POT_HI = mkPath('M -64 -26 C -76 4, -66 40, -40 62');
const POT_RIVETS = rivetPath([-62, -12, -26, -2, 26, -2, 62, -12, -60, 46, 0, 54, 60, 46], 3.8);
const POT_NECK = Shape.d('M -26 -50 L 26 -50 L 18 -88 L -18 -88 Z', true);
const POT_CAP = Shape.d('M -32 -86 C -34 -132, 34 -132, 32 -86 Z');
const POT_FINIAL = Shape.circle(0, -134, 11);
const POT_DOOR = Shape.d('M -26 76 L -26 50 C -26 32, 26 32, 26 50 L 26 76 Z', true);
const POT_GAUGE = Shape.circle(0, 0, 17);
const PIPE_A = mkPath('M 396 446 C 410 396, 442 378, 480 398');
const PIPE_A_FR = new Frame(0, 378, 0, 446);
const BEDROLL = Shape.d(rr(-70, -26, 140, 52, 24));
const BEDROLL_STRIPES = mkPath('M -34 -24 L -34 24 M 8 -26 L 8 26 M 44 -22 L 44 22');
const BEDROLL_ROPE = mkPath('M -52 -24 L -52 24 M 54 -22 L 54 22');
const PACK_LEAN = (6 * Math.PI) / 180;
/** Steam vent of the still, in spine-frame world units (reference (386,440) relative to the hip). */
const VENT_X = (388 - 500) / 570;
const VENT_Y = (752 - 436) / 570;

// ── Skirt: tunic skirts, pouch, tassets ───────────────────────

const PEPLUM = Shape.d(
  'M 440 700 C 432 770, 426 850, 434 900 C 470 912, 520 914, 564 904 C 570 840, 570 770, 558 700 Z',
  true,
);
const PEPLUM_FOLDS = mkPath(
  'M 478 704 C 472 780, 472 850, 476 908 M 520 706 C 522 780, 526 850, 530 910',
);
const PEPLUM_HEM = Shape.d(
  'M 434 884 C 470 896, 520 898, 564 888 L 565 912 C 520 924, 470 922, 433 908 Z',
  true,
);
const PEPLUM_PATCH = Shape.d(rr(466, 770, 46, 40, 5));
const PATCH_STITCH = mkPath('M 470 774 L 508 774 L 508 806 L 470 806 Z');
const POUCH = Shape.d('M 546 704 L 606 700 L 602 764 C 582 778, 558 774, 548 760 Z');
const POUCH_FLAP = Shape.d('M 546 704 L 606 700 L 604 730 C 582 742, 560 740, 547 730 Z', true);
const TASSETS: Shape[] = [];
const TASSET_RIVETS: Path2D[] = [];
for (const [dx, dy, w, h] of [
  [8, 700, 108, 72],
  [18, 744, 98, 64],
] as const) {
  const x = 442 + dx;
  TASSETS.push(
    Shape.d(
      `M ${x} ${dy} L ${x + w} ${dy} C ${x + w + 4} ${dy + h * 0.6}, ${x + w - 14} ${dy + h}, ${x + w * 0.5} ${dy + h + 6} ` +
        `C ${x + 14} ${dy + h}, ${x - 4} ${dy + h * 0.6}, ${x} ${dy} Z`,
    ),
  );
  TASSET_RIVETS.push(rivetPath([x + 16, dy + 14, x + w - 16, dy + 14], 3.6));
}
const FR_SASH = new Frame(0, 0.15, 0, -0.3);

// ── Pauldron, elbow, fist ─────────────────────────────────────

export function lame(r: number, off: number, h: number): Shape {
  return new Shape(
    mkPath(
      `M ${-r} ${off} A ${r} ${r * h} 0 0 1 ${r * 0.9} ${off - 8} L ${r * 0.8} ${off + 24} ` +
        `Q 0 ${off + 38} ${-r} ${off + 14} Z`,
    ),
    new Frame(-r, 0, r, 0),
  );
}
/** Three overlapping plates of different metals: salvaged steel over patch iron over leather. */
const PAULD = [lame(72, 40, 0.7), lame(66, 20, 0.74), lame(60, 0, 0.8)];
const PAULD_HI = mkPath('M -52 -4 A 58 40 0 0 1 40 -24');
const PAULD_RIVETS = rivetPath([-30, 10, 14, 0, 44, 8], 4.4);
const PAULD_BUCKLE = Shape.circle(34, 14, 9);
const ARMBAND = Shape.d('M -40 84 Q 0 98 40 84 L 41 118 Q 0 132 -41 118 Z', true);
const CAP_FAR = Shape.d('M -50 -2 C -52 -48, 40 -52, 52 -2 C 20 24, -20 24, -50 -2 Z', true);
const CUFF_ELBOW = Shape.d(rr(-38, -10, 76, 34, 14), true);
const CUFF_FOLD = mkPath('M -30 4 C -10 12, 10 12, 30 4');
const BRACER = Shape.d('M -32 54 L 34 56 L 30 144 C 10 150, -12 150, -32 142 Z');
const BRACER_STRAPS = mkPath('M -33 80 L 34 82 M -32 112 L 32 114');
const BRACER_RIVETS = rivetPath([-18, 68, 22, 68, -18, 128, 20, 128], 3.2);
const FIST = Shape.d('M -25 -26 C -30 -6, -26 20, -10 30 L 14 30 C 28 20, 30 -6, 25 -26 Z');
const FIST_LINES = mkPath('M -24 -8 Q 0 -2 24 -8 M -22 6 Q 0 12 22 6 M -18 18 Q 0 24 18 18');
const FIST_HI = mkPath('M -18 -22 C -22 -4, -18 16, -6 26');
const WRIST = Shape.d(rr(-31, -40, 62, 22, 8), true);
const WRIST_STUD = Shape.circle(0, -29, 5);

// ── Legs ──────────────────────────────────────────────────────

const KNEE_PATCH = Shape.d('M -6 -30 C 40 -40, 78 -14, 70 22 C 50 36, 14 36, -6 20 Z');
const KNEE_RIVETS = rivetPath([8, -12, 44, -10, 26, 16], 3.8);
const GREAVE = Shape.d('M 8 52 C 54 46, 88 66, 78 200 L 18 214 C 0 150, 0 96, 8 52 Z');
const GREAVE_HI = mkPath('M 18 66 C 10 110, 12 160, 24 196');
const GREAVE_STRAPS = mkPath('M 4 104 L 80 100 M 8 156 L 80 152');
const GREAVE_RIVETS = rivetPath([24, 84, 24, 182], 3.8);
const FOOT = Shape.d(
  'M -36 -14 L 30 -16 C 66 -10, 98 6, 126 24 C 138 30, 136 42, 122 42 L -36 42 Z',
  true,
);
const FOOT_SOLE = Shape.d('M -36 32 L 124 32 C 136 32, 138 44, 122 44 L -36 44 Z', true);
const FOOT_SEAM = mkPath('M 6 10 C 46 10, 84 16, 112 28');
const BOOT_CUFF = Shape.d(rr(-38, -30, 76, 26, 10), true);

// ── Head (reference origin: the head centre) ──────────────────

export const HEAD = Shape.d(
  'M -58 6 C -64 -52, -26 -88, 16 -86 C 58 -84, 84 -52, 82 -18 C 84 -8, 88 -2, 100 14 ' +
    'C 104 20, 98 26, 88 28 C 90 36, 88 42, 80 44 C 84 52, 82 62, 70 72 C 56 86, 20 92, -4 88 ' +
    'C -36 82, -56 50, -58 6 Z',
);
export const NECK = Shape.d('M -34 56 L 40 56 L 44 130 L -30 130 Z', true);
export const EAR = Shape.d('M -14 -2 C -2 -14, 16 -8, 14 12 C 12 28, -4 30, -14 20 Z');
export const EYE = mkPath('M 44 -12 C 54 -20, 70 -18, 74 -8 C 64 -4, 52 -4, 44 -12 Z');
export const BROW = mkPath('M 36 -24 C 52 -34, 72 -30, 80 -22');
const MOUTH = mkPath('M 66 50 C 74 52, 80 50, 84 46');
export const MOUSTACHE = Shape.d('M 66 32 C 80 28, 98 34, 104 44 C 90 52, 74 50, 62 44 Z', true);
const STUBBLE = Shape.d(
  'M 10 52 C 30 60, 60 58, 76 50 C 84 60, 76 76, 60 80 C 40 90, 6 90, -10 80 C -30 66, -22 54, 10 52 Z',
);
const HAIR = Shape.d(
  'M -62 4 C -70 -50, -34 -84, 6 -80 C -4 -60, -30 -40, -40 -4 C -44 24, -52 34, -62 4 Z',
);
// straw hat
const BRIM = Shape.d(
  'M -190 -50 C -146 -84, -58 -92, 14 -90 C 94 -92, 164 -80, 202 -48 C 158 -30, 80 -22, 10 -22 C -70 -22, -146 -28, -190 -50 Z',
  true,
);
const BRIM_WEAVE = mkPath(
  'M -150 -52 C -100 -70, 60 -74, 160 -52 M -112 -44 C -60 -56, 50 -58, 120 -44 M -60 -36 C -20 -42, 40 -42, 80 -36',
);
const CROWN = Shape.d('M -72 -66 C -80 -158, 74 -166, 82 -70 C 40 -58, -30 -58, -72 -66 Z');
const CROWN_WEAVE = mkPath(
  'M -60 -110 C -20 -124, 30 -124, 68 -108 M -66 -88 C -20 -100, 30 -100, 76 -88',
);
const HAT_BAND = Shape.d(
  'M -73 -72 C -30 -60, 40 -60, 82 -76 L 84 -100 C 40 -86, -30 -86, -74 -100 Z',
  true,
);
// kerchief
const WRAP = Shape.d(
  'M -64 -4 C -72 -70, -30 -100, 18 -98 C 66 -96, 90 -62, 86 -30 C 52 -44, 0 -50, -64 -4 Z',
);
const WRAP_FOLD = mkPath('M -50 -30 C -10 -52, 40 -56, 80 -44');
const WRAP_BAND = mkPath('M -62 -14 C -20 -42, 36 -50, 86 -36');
const WRAP_BAND_FR = new Frame(0, -50, 0, -14);
const WRAP_KNOT = Shape.circle(-66, -24, 15);
// open sallet
const SALLET = Shape.d(
  'M -72 -4 C -82 -82, -20 -114, 30 -106 C 82 -98, 102 -58, 98 -34 L 62 -36 C 22 -46, -8 -42, -38 -22 ' +
    'L -102 40 C -110 16, -88 4, -72 -4 Z',
);
const SALLET_RIDGE = mkPath('M -64 -30 C -30 -102, 40 -112, 92 -50');
const SALLET_RIDGE_FR = new Frame(0, -112, 0, -30);
const SALLET_HI = mkPath('M -58 -22 C -54 -66, -24 -92, 14 -92');
const SALLET_BROW = mkPath('M -60 -12 C -10 -36, 40 -42, 98 -34');
const SALLET_BROW_FR = new Frame(0, -42, 0, -12);
const SALLET_RIVETS = rivetPath([-44, -36, -10, -78, 30, -92, 70, -64, -78, 16], 4.2);
const KERCHIEF = Shape.d(
  'M -36 54 C -20 80, 42 84, 58 54 L 64 100 C 34 124, -22 120, -42 100 Z',
  true,
);

// ── Limb tubes ────────────────────────────────────────────────

const TUBES: (Tube | undefined)[] = [];
export function tube(seg: number, cls: number, len: number, r0: number, r1: number): Tube {
  const i = seg * 3 + cls;
  let t = TUBES[i];
  if (!t || t.r0 !== r0 || t.len !== len) {
    t = new Tube(
      len,
      r0,
      r1,
      seg === 0 ? 1 : seg === 1 ? 0 : seg === 2 ? 0 : 3,
      seg === 2 ? 0.026 : seg === 0 ? 0.012 : seg === 3 ? 0.008 : 0.004,
    );
    TUBES[i] = t;
  }
  return t;
}

/** A soft (cloth, skin) tube: shaded body and ink, fold lines and a warm rim, no steel gloss. */
export function softTube(c: Ctx, t: Tube, mat: Swatch, rim: boolean): void {
  paint(c, t.body, mat, inkU(5.5));
  if (K.lod === 0) return;
  seam(c, t.lames, inkU(3), 0.55);
  if (K.lod === 2 && rim) streak(c, K.mir ? t.rimL : t.rimR, inkU(2), 0.4, '#ffb866');
}

const militiaLimbs = (): LimbStyle => ({
  upper: 'cloth',
  fore: 'skin',
  thigh: 'cloth',
  shin: 'leather',
  arm: 0.8,
  leg: 0.86,
});

type Headgear = 0 | 1 | 2;
/** 0 straw hat, 1 red kerchief, 2 open sallet. Varies with the weapon so a squad is not uniform. */
function headgear(f: F): Headgear {
  if (f.hero || f.cls === 2) return 2;
  switch (f.spec.weaponType) {
    case 'blunt':
      return 2;
    case 'polearm':
    case 'explosive':
      return 1;
    default:
      return 0;
  }
}

const FLAG_TAIL = new Frame(0, 0.1, 0, -0.1);

export const militia: Look = {
  model: 'militia',
  headScale: 1.2,
  limbs: militiaLimbs,
  shieldWith: (w) => w === 'blunt' || w === 'blade',

  segment(f, seg, far, len, r0, r1) {
    const m = milMats(f);
    const t = tube(seg, f.cls, len, r0, r1);
    if (seg === 0) softTube(f.ctx, t, far ? m.tunicFar : m.tunic, !far);
    else if (seg === 1) softTube(f.ctx, t, far ? m.skinFar : m.skin, !far);
    else if (seg === 2) softTube(f.ctx, t, far ? m.trousersFar : m.trousers, !far);
    else {
      // Linen puttees wound round the shin.
      softTube(f.ctx, t, far ? m.puttDeep : m.puttee, !far);
    }
  },

  back(f) {
    const c = f.ctx;
    const m = milMats(f);
    const t = f.t;
    const lod = K.lod;
    c.save();
    c.scale(f.g, 1);
    refIn(c, 500, 752);
    // Bedroll across the top of the back.
    c.save();
    c.translate(402, 404);
    c.rotate(-0.42);
    paint(c, BEDROLL, m.tunicFar, inkR(5.5));
    if (lod > 0) {
      c.lineWidth = inkR(7);
      c.strokeStyle = m.red.at(0);
      c.lineCap = 'butt';
      c.stroke(BEDROLL_STRIPES);
      seam(c, BEDROLL_ROPE, inkR(5), 0.9);
    }
    c.restore();
    // The still: a copper pot with a riveted neck, a dome and a furnace glowing at its foot.
    c.save();
    c.translate(386, 586);
    c.rotate(PACK_LEAN);
    paint(c, POT, m.copper, inkR(6));
    if (lod > 0) {
      streak(c, POT_HI, inkR(5), 0.4);
      band(c, POT_BANDS, POT_BAND_FR, m.brass, inkR(12), 7);
    }
    rivets(c, POT_RIVETS, inkR(1.5));
    paint(c, POT_NECK, m.copper, inkR(5), true);
    paint(c, POT_CAP, m.copper, inkR(5.5));
    paint(c, POT_FINIAL, m.brass, inkR(4));
    const pulse = 0.8 + 0.2 * Math.sin(t * 3.4) + 0.06 * Math.sin(t * 12);
    flat(c, POT_DOOR.p, '#1b1410');
    glow(c, 'ember', 0, 58, 30, 26, pulse);
    c.lineWidth = inkR(5);
    c.strokeStyle = m.brass.grad(c, POT_DOOR.fr, false);
    c.stroke(POT_DOOR.p);
    if (lod > 0) {
      c.save();
      c.translate(-36, 12);
      paint(c, POT_GAUGE, sw('#f6f1e4', 'soft'), inkR(4));
      c.lineWidth = inkR(4);
      c.strokeStyle = m.brass.grad(c, POT_GAUGE.fr, false);
      c.stroke(POT_GAUGE.p);
      const a = -0.7 + Math.sin(t * 1.9) * 0.4 + Math.sin(t * 8) * 0.04;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.sin(a) * 13, -Math.cos(a) * 13);
      c.lineWidth = inkR(3.4);
      c.strokeStyle = '#a8231c';
      c.stroke();
      c.restore();
    }
    c.restore();
    // Copper pipe from the dome over the shoulder.
    band(c, PIPE_A, PIPE_A_FR, m.copper, inkR(20), 12);
    refOut(c);
    c.restore();
  },

  torso(f) {
    const c = f.ctx;
    const m = milMats(f);
    const lod = K.lod;
    c.save();
    c.scale(f.g, 1);
    refIn(c, 500, 752);
    paint(c, TUNIC, m.tunic, inkR(6));
    if (lod > 0) {
      seam(c, TUNIC_QUILT, inkR(3), 0.3);
      streak(c, TUNIC_HI, inkR(4), 0.5);
      if (lod === 2) streak(c, TUNIC_RIM, inkR(3), 0.5, '#ffb866');
    }
    paint(c, COLLAR, m.tunic, inkR(5), true);
    // Salvaged Order breastplate, patched and riveted on.
    paint(c, BREAST, m.steel, inkR(5.5));
    if (lod > 0) {
      seam(c, BREAST_RIDGE, inkR(3.5), 0.45);
      streak(c, BREAST_HI, inkR(4), 0.6);
      if (lod === 2) streak(c, BREAST_RIM, inkR(3), 0.5, '#ffb866');
      seam(c, SCRATCH, inkR(3), 0.35);
    }
    rivets(c, BREAST_RIVETS, inkR(1.5));
    if (f.hero) {
      if (lod > 0) {
        paint(c, MEDAL, m.brass, inkR(4));
        c.lineWidth = inkR(5);
        c.lineCap = 'round';
        c.strokeStyle = m.brass.at(2);
        c.stroke(MEDAL_RAYS);
      }
    } else {
      paint(c, PATCH, m.patch, inkR(4.5));
      rivets(c, PATCH_RIVETS, inkR(1.4));
    }
    // Leather strap over the chest with a brass buckle.
    band(c, STRAP, STRAP_FR, m.leather, inkR(26), 17);
    if (lod > 0) paint(c, STRAP_BUCKLE, m.brass, inkR(4));
    paint(c, BELT, m.leather, inkR(5));
    paint(c, BUCKLE, m.brass, inkR(4), true);
    refOut(c);
    c.restore();
  },

  front(f) {
    if (!f.hero) return;
    const c = f.ctx;
    c.save();
    c.scale(f.g, 1);
    refIn(c, 500, 752);
    paint(c, SASH, milMats(f).brass, inkR(4.5), true);
    refOut(c);
    c.restore();
  },

  skirt(f) {
    const c = f.ctx;
    const m = milMats(f);
    const lod = K.lod;
    c.save();
    c.scale(f.g, 1);
    refIn(c, 500, 752);
    // Tunic skirts hanging from the belt, lagging behind the stride.
    c.save();
    const k = -0.05 - f.drag * 0.42 + Math.sin(f.t * 2.3) * 0.035;
    c.transform(1, 0, k, 1, -k * 650, 0);
    paint(c, PEPLUM, m.tunic, inkR(5), true);
    if (lod > 0) {
      seam(c, PEPLUM_FOLDS, inkR(3), 0.4);
      paint(c, PEPLUM_PATCH, m.trousers, inkR(3.5), true);
      seam(c, PATCH_STITCH, inkR(2), 0.55);
    }
    paint(c, PEPLUM_HEM, m.red, inkR(4), true);
    c.restore();
    // Salvaged tasset plates, more on the heavier frames.
    const n = f.cls;
    for (let i = 0; i < n; i++) {
      paint(c, TASSETS[i] as Shape, m.steel, inkR(5));
      rivets(c, TASSET_RIVETS[i] as Path2D, inkR(1.4));
    }
    paint(c, POUCH, m.leather, inkR(4.5));
    paint(c, POUCH_FLAP, m.leatherDark, inkR(4), true);
    refOut(c);
    c.restore();
    // The side colour: a sash knotted at the belt, its tail lagging behind the stride.
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
    const m = milMats(f);
    const lod = K.lod;
    const kind = headgear(f);
    const s = [0.96, 1, 1.05][f.cls] as number;
    c.save();
    c.translate(0, -0.012);
    c.scale(s, s);
    // Kerchief tails stream back from the neck knot, and from the head wrap.
    if (kind === 1) {
      flag(
        c,
        m.red,
        FLAG_TAIL,
        -0.12,
        -0.04,
        3.45,
        0.5,
        0.3,
        0.1,
        0.03,
        0.2,
        f.t,
        0.6,
        f.drag * 0.9,
        inkU(4),
        7,
      );
      flag(
        c,
        m.red,
        FLAG_TAIL,
        -0.12,
        -0.06,
        3.0,
        1.0,
        0.24,
        0.09,
        0.03,
        0.22,
        f.t,
        1.4,
        f.drag * 0.9,
        inkU(4),
        6,
      );
    }
    refIn(c, 0, 0);
    // Neck and the red neckerchief.
    paint(c, NECK, m.skinFar, inkR(4.5), true);
    paint(c, HAIR, m.hair, inkR(4));
    paint(c, HEAD, m.skin, inkR(5.5));
    paint(c, EAR, m.skinFar, inkR(3.5));
    if (lod > 0) {
      c.globalAlpha = 0.28;
      c.fillStyle = m.hair.at(0);
      c.fill(STUBBLE.p);
      c.globalAlpha = 1;
    }
    paint(c, MOUSTACHE, m.hair, inkR(3.5), true);
    flat(c, EYE, '#f7f1e3');
    c.lineWidth = inkR(4.5);
    c.lineCap = 'round';
    c.strokeStyle = '#1a120c';
    c.stroke(EYE);
    c.beginPath();
    c.arc(62, -12, 6, 0, Math.PI * 2);
    c.fillStyle = '#1a120c';
    c.fill();
    c.lineWidth = inkR(4.5);
    c.strokeStyle = m.hair.at(1);
    c.stroke(BROW);
    if (lod > 0) seam(c, MOUTH, inkR(3.5), 0.8);
    paint(c, KERCHIEF, m.red, inkR(4.5), true);
    if (kind === 0) {
      // Wide straw hat with a band in the side colour.
      paint(c, BRIM, m.straw, inkR(6), true);
      if (lod > 0) seam(c, BRIM_WEAVE, inkR(3), 0.35);
      paint(c, CROWN, m.straw, inkR(6));
      if (lod > 0) seam(c, CROWN_WEAVE, inkR(3), 0.3);
      paint(c, HAT_BAND, f.acc.as('cloth'), inkR(4.5), true);
    } else if (kind === 1) {
      paint(c, WRAP, m.red, inkR(5.5));
      if (lod > 0) seam(c, WRAP_FOLD, inkR(3), 0.4);
      band(c, WRAP_BAND, WRAP_BAND_FR, f.acc.as('cloth'), inkR(15), 9);
      paint(c, WRAP_KNOT, m.red, inkR(4.5));
    } else {
      paint(c, SALLET, m.steel, inkR(6));
      band(c, SALLET_RIDGE, SALLET_RIDGE_FR, m.brass, inkR(14), 9);
      band(c, SALLET_BROW, SALLET_BROW_FR, f.acc.as('cloth'), inkR(15), 9);
      if (lod > 0) streak(c, SALLET_HI, inkR(5), 0.6);
      rivets(c, SALLET_RIVETS, inkR(1.5));
      glint(c, 20, -78, 14, 0.5 + 0.45 * Math.sin(f.t * 2.9 + 1));
    }
    refOut(c);
    c.restore();
  },

  pad(f, far) {
    const c = f.ctx;
    const m = milMats(f);
    const lod = K.lod;
    const kk = [0.95, 1.12, 1.28][f.cls] as number;
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
      paint(c, CAP_FAR, m.tunicFar, inkR(5), true);
      refOut(c);
      c.restore();
      return;
    }
    paint(c, PAULD[0] as Shape, m.leather, inkR(5));
    paint(c, PAULD[1] as Shape, m.patch, inkR(5));
    paint(c, PAULD[2] as Shape, m.steel, inkR(5.5));
    if (lod > 0) {
      streak(c, PAULD_HI, inkR(5), 0.6);
      paint(c, PAULD_BUCKLE, m.brass, inkR(3.5));
    }
    rivets(c, PAULD_RIVETS, inkR(1.4));
    glint(c, 6, -22, 20, 0.55 + 0.4 * Math.sin(f.t * 2.4));
    refOut(c);
    c.restore();
  },

  fore(f, far) {
    const c = f.ctx;
    const m = milMats(f);
    refIn(c, 0, 0);
    paint(c, CUFF_ELBOW, far ? m.tunicFar : m.tunic, inkR(4.5), true);
    if (K.lod > 0) seam(c, CUFF_FOLD, inkR(3), 0.45);
    if (!far) {
      paint(c, BRACER, m.leather, inkR(4.5));
      if (K.lod > 0) seam(c, BRACER_STRAPS, inkR(3), 0.6);
      rivets(c, BRACER_RIVETS, inkR(1.3));
    }
    refOut(c);
  },

  hand(f, far) {
    const c = f.ctx;
    const m = milMats(f);
    c.save();
    c.scale(0.5 + f.g * 0.5, 1);
    refIn(c, 0, 2);
    paint(c, FIST, far ? m.skinFar : m.skin, inkR(5));
    if (K.lod > 0) {
      seam(c, FIST_LINES, inkR(2.6), 0.5);
      streak(c, FIST_HI, inkR(3), 0.35);
    }
    paint(c, WRIST, m.leather, inkR(4), true);
    if (K.lod === 2) {
      paint(c, WRIST_STUD, m.brass, inkR(2.5));
    }
    refOut(c);
    c.restore();
  },

  shin(f, far) {
    const c = f.ctx;
    const m = milMats(f);
    c.save();
    c.scale(f.g, 1);
    refIn(c, 0, 0);
    paint(c, KNEE_PATCH, far ? m.leatherDark : m.leather, inkR(4.5));
    if (!far) {
      rivets(c, KNEE_RIVETS, inkR(1.3));
      // Half greave strapped over the shin: a mismatched salvaged plate.
      paint(c, GREAVE, m.steel, inkR(5));
      if (K.lod > 0) {
        streak(c, GREAVE_HI, inkR(4), 0.55);
        c.lineWidth = inkR(7);
        c.lineCap = 'round';
        c.strokeStyle = m.leatherDark.at(0);
        c.stroke(GREAVE_STRAPS);
      }
      rivets(c, GREAVE_RIVETS, inkR(1.3));
    }
    refOut(c);
    c.restore();
  },

  boot(f, far) {
    const c = f.ctx;
    const m = milMats(f);
    c.save();
    c.scale(f.g, 1);
    refIn(c, 0, 0);
    paint(c, FOOT, far ? m.leatherDark : m.leather, inkR(5.5), true);
    paint(c, FOOT_SOLE, m.leatherDark, inkR(4), true);
    if (K.lod > 0) seam(c, FOOT_SEAM, inkR(3), 0.5);
    paint(c, BOOT_CUFF, far ? m.tunicFar : m.tunic, inkR(4), true);
    refOut(c);
    c.restore();
  },

  shield: () => true,

  over(f) {
    // Steam leaking from the dome of the still, thinner and lazier than the knight's.
    const c = f.ctx;
    const n = K.lod === 0 ? 2 : K.lod === 1 ? 3 : 4;
    c.save();
    c.translate(0, 0.96);
    c.rotate(f.pose.lean);
    c.scale(f.g, 1);
    for (let i = 0; i < n; i++) {
      const ph = (f.t * 0.45 + i / n) % 1;
      const x = VENT_X - ph * 0.22 - f.drag * 0.2 * ph + Math.sin(f.t * 2 + i * 2) * 0.012;
      const y = VENT_Y + ph * 0.46;
      const r = 0.04 + ph * 0.12;
      glow(c, 'steam', x, y, r, r, Math.min(1, (1 - ph) * 1.4) * 0.85);
    }
    c.restore();
  },
};

// ── The round wooden shield ───────────────────────────────────

const SH_RIM = Shape.circle(0, 0, 150);
const SH_FIELD = Shape.circle(0, 0, 140);
const SH_RING = Shape.circle(0, 0, 118);
const SH_BOSS = Shape.circle(0, 0, 32);
const SH_BOSS_IN = Shape.circle(0, 0, 12, true);
const SH_PLANKS = mkPath('M -70 -128 L -70 128 M 0 -140 L 0 140 M 70 -128 L 70 128');
const SH_RIVETS = rivetPath(
  Array.from({ length: 10 }, (_, i) => [
    Math.cos((i / 10) * Math.PI * 2) * 132,
    Math.sin((i / 10) * Math.PI * 2) * 132,
  ]).flat(),
  4.2,
);
const SH_PATCH = Shape.d('M 40 -96 L 96 -70 L 78 -24 L 30 -50 Z');
const SH_PATCH_RIVETS = rivetPath([48, -84, 84, -62, 72, -34, 40, -52], 3.4);
const SH_GLINT = mkPath('M -112 -38 A 140 140 0 0 1 -38 -112');

/** The round shield of planks banded with salvaged iron, drawn at the off hand. */
export function militiaShield(f: F): void {
  const c: Ctx = f.ctx;
  const m = milMats(f);
  const k = RS * (1 + (f.cls - 1) * 0.08) * 0.94;
  c.save();
  c.translate(0.14, 0.1);
  c.scale(k, -k);
  c.rotate(-0.244);
  paint(c, SH_RIM, m.steel, inkR(6));
  paint(c, SH_FIELD, m.wood, inkR(5));
  if (K.lod > 0) seam(c, SH_PLANKS, inkR(3.5), 0.45);
  const acc = f.acc.as('cloth');
  c.lineWidth = inkR(17);
  c.strokeStyle = '#0e1118';
  c.stroke(SH_RING.p);
  c.lineWidth = inkR(11);
  c.strokeStyle = acc.grad(c, SH_RING.fr, false);
  c.stroke(SH_RING.p);
  paint(c, SH_PATCH, m.red, inkR(4));
  rivets(c, SH_PATCH_RIVETS, inkR(1.3));
  paint(c, SH_BOSS, m.steel, inkR(5));
  paint(c, SH_BOSS_IN, m.brass, inkR(3), true);
  rivets(c, SH_RIVETS, inkR(1.5));
  if (K.lod > 0) streak(c, SH_GLINT, inkR(7), 0.38);
  c.restore();
}
