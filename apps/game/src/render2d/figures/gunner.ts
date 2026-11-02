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
import { BROW, EAR, EYE, HEAD, MOUSTACHE, NECK, darker, lame, rr, softTube } from './militia';
import type { F, LimbStyle, Look, Palette } from './types';

/**
 * The Maltese arquebusier's armatura (frame moschetta): a rust leather coat under light steel, a
 * bandolier of powder flasks, a wide-brimmed morion or hat with a plume in the side colour, and a
 * small brass steam pack that keeps the match lit. Cooler steel and rust red against the
 * militia's limestone and earth. Same kit as the Cavaliere (see docs/art/FIGURE_STYLE.md): plates
 * in reference pixels (570 px = 1 unit, y down, hip at (500,752)).
 */

// ── Materials ─────────────────────────────────────────────────

interface GunMats {
  steel: Swatch;
  steelFar: Swatch;
  brass: Swatch;
  coat: Swatch;
  coatFar: Swatch;
  lining: Swatch;
  breeches: Swatch;
  breechesFar: Swatch;
  leather: Swatch;
  leatherDark: Swatch;
  boot: Swatch;
  bootFar: Swatch;
  flask: Swatch;
  linen: Swatch;
  felt: Swatch;
  skin: Swatch;
  skinFar: Swatch;
  hair: Swatch;
  cord: Swatch;
}
const MATS = new WeakMap<Palette, GunMats>();
function mats(f: F): GunMats {
  let m = MATS.get(f.p);
  if (!m) {
    const hero = f.hero;
    const steel = hero ? '#eef0f5' : '#9ba5b6';
    const coat = hero ? '#c0161f' : '#a85b38';
    const breeches = hero ? '#f0ebdd' : '#54443a';
    const boot = '#6a4526';
    const skin = f.p.skin.c[0] as string;
    m = {
      steel: sw(steel, hero ? 'enamel' : 'metal'),
      steelFar: sw(darker(steel), hero ? 'enamel' : 'metal'),
      brass: sw(hero ? '#e0b445' : '#d6a548', 'metal'),
      coat: sw(coat, 'cloth'),
      coatFar: sw(darker(coat, 0.7), 'cloth'),
      lining: sw(hero ? '#f4eedc' : '#d9c79a', 'cloth'),
      breeches: sw(breeches, 'cloth'),
      breechesFar: sw(darker(breeches, 0.72), 'cloth'),
      leather: sw('#7a4c27', 'matte'),
      leatherDark: sw('#43281a', 'matte'),
      boot: sw(boot, 'matte'),
      bootFar: sw(darker(boot, 0.72), 'matte'),
      flask: sw('#d3b27a', 'matte'),
      linen: sw('#f2ecdc', 'soft'),
      felt: sw(hero ? '#f2f1ec' : '#3d3b41', 'cloth'),
      skin: sw(skin, 'soft'),
      skinFar: sw(darker(skin, 0.8), 'soft'),
      hair: sw('#2b211a', 'matte'),
      cord: sw('#8a7550', 'matte'),
    };
    MATS.set(f.p, m);
  }
  return m;
}

/** Brass buttons: filled dots with an ink ring, no gradient (skipped at map scale). */
function dots(c: Ctx, p: Path2D, m: GunMats, lw: number): void {
  if (K.lod === 0) return;
  c.fillStyle = m.brass.at(0);
  c.fill(p);
  c.lineWidth = lw;
  c.strokeStyle = '#0e1118';
  c.stroke(p);
}

// ── Torso (reference origin: the hip, 500,752) ────────────────

const COAT = Shape.d(
  'M 434 396 C 400 460, 410 590, 440 700 L 558 704 C 604 600, 610 470, 568 404 C 530 380, 474 380, 434 396 Z',
);
const COAT_QUILT = mkPath('M 430 540 C 480 556, 540 550, 604 532');
const COAT_HI = mkPath('M 444 428 C 432 490, 444 600, 460 676');
const COAT_RIM = mkPath('M 600 476 C 606 546, 590 640, 558 700');
const COAT_COLLAR = Shape.d(
  'M 450 392 C 448 350, 548 344, 560 386 L 564 416 C 520 432, 462 428, 450 412 Z',
  true,
);
const CUIRASS = Shape.d(
  'M 468 424 C 452 480, 466 560, 492 626 C 524 646, 568 644, 600 622 C 614 556, 614 480, 576 428 C 548 410, 498 408, 468 424 Z',
);
const CUI_RIDGE = mkPath('M 532 416 C 542 490, 552 570, 556 640');
const CUI_HI = mkPath('M 480 446 C 472 496, 482 560, 502 606');
const CUI_RIM = mkPath('M 606 490 C 610 540, 606 590, 598 622');
const CUI_BAND = mkPath('M 476 432 C 520 416, 556 418, 580 438');
const CUI_BAND_FR = new Frame(0, 416, 0, 440);
const CUI_RIVETS = rivetPath([494, 452, 566, 450, 504, 596, 584, 590, 538, 624], 4.2);
const BUTTONS = rivetPath([568, 454, 574, 494, 576, 534, 575, 574, 572, 614, 566, 652], 6);
const BELT = Shape.d(
  'M 440 662 C 500 686, 548 684, 562 662 L 564 712 C 520 730, 470 728, 442 712 Z',
);
const BUCKLE = Shape.d(rr(496, 668, 34, 46, 8));
const BUCKLE_IN = Shape.d(rr(504, 678, 18, 26, 4), true);
const MEDAL = new Shape(
  (() => {
    const p = mkPath();
    p.moveTo(552, 470);
    p.arc(552, 502, 28, -Math.PI / 2, Math.PI / 2, false);
    p.closePath();
    return p;
  })(),
  new Frame(552, 0, 580, 0),
);
const MEDAL_RAYS = (() => {
  const p = mkPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i + 0.5) * (Math.PI / 5);
    p.moveTo(552 + Math.cos(a) * 34, 502 + Math.sin(a) * 34);
    p.lineTo(552 + Math.cos(a) * 48, 502 + Math.sin(a) * 48);
  }
  return p;
})();
const SASH = Shape.d('M 440 410 L 480 400 L 606 636 L 568 668 Z');

// Bandolier: a strap across the chest with a row of powder flasks hanging from it.
const BAND_P = [450, 404, 490, 480, 540, 570, 592, 660] as const;
const BANDOLIER = mkPath(
  `M ${BAND_P[0]} ${BAND_P[1]} C ${BAND_P[2]} ${BAND_P[3]}, ${BAND_P[4]} ${BAND_P[5]}, ${BAND_P[6]} ${BAND_P[7]}`,
);
const BANDOLIER_FR = new Frame(450, 0, 592, 0);
const FLASK_AT: number[] = [];
for (let i = 0; i < 8; i++) {
  const t = 0.1 + (i / 7) * 0.8;
  const u = 1 - t;
  FLASK_AT.push(
    u * u * u * BAND_P[0] +
      3 * u * u * t * BAND_P[2] +
      3 * u * t * t * BAND_P[4] +
      t * t * t * BAND_P[6],
    u * u * u * BAND_P[1] +
      3 * u * u * t * BAND_P[3] +
      3 * u * t * t * BAND_P[5] +
      t * t * t * BAND_P[7],
  );
}
const FLASK = Shape.d(rr(-10, 8, 20, 54, 8));
const FLASK_CAP = Shape.d(rr(-12, 2, 24, 14, 5), true);

// ── Back: steam pack ──────────────────────────────────────────

const PACK = Shape.d(rr(-46, -4, 92, 206, 36));
const PACK_BANDS = Shape.d([30, 100, 170].map((y) => rr(-50, y, 100, 13, 6)).join(' '), false);
const PACK_RIVETS = rivetPath(
  [30, 100, 170].flatMap((y) => [-38, y + 6, 38, y + 6]),
  3.4,
);
const PACK_HI = mkPath('M -34 22 C -40 80, -40 160, -30 186');
const PACK_CAP = Shape.d(rr(-22, -28, 44, 30, 10), true);
const PACK_VENT = Shape.d(rr(-11, -48, 22, 24, 7), true);
const PACK_WINDOW = Shape.circle(0, 138, 22);
const GAUGE = Shape.circle(0, 0, 15);
const COIL = Shape.circle(-52, 120, 36);
const COIL_IN = Shape.circle(-52, 120, 17, true);
const PIPE = mkPath('M 418 428 C 432 388, 452 376, 476 398');
const PIPE_FR = new Frame(0, 376, 0, 428);
const PACK_LEAN = (7 * Math.PI) / 180;
const VENT_X = (400 - 500) / 570;
const VENT_Y = (752 - 346) / 570;

// ── Skirt ─────────────────────────────────────────────────────

const SKIRT = Shape.d(
  'M 438 700 C 426 790, 416 880, 420 964 C 468 986, 532 988, 572 968 C 576 880, 572 780, 560 700 Z',
  true,
);
const SKIRT_LINING = Shape.d(
  'M 546 704 L 564 700 C 572 800, 576 900, 572 968 L 540 978 C 548 884, 552 790, 546 704 Z',
  true,
);
const SKIRT_FOLDS = mkPath(
  'M 470 704 C 462 790, 462 880, 466 976 M 506 706 C 504 800, 506 890, 510 982',
);
const SKIRT_HEM = Shape.d(
  'M 420 944 C 468 966, 532 968, 572 948 L 573 972 C 532 992, 468 990, 419 968 Z',
  true,
);
const HEM_BUTTONS = rivetPath([446, 966, 486, 974, 526, 976, 556, 970], 5);
const PAULD_TASSET = [
  [0, 706, 100, 70],
  [10, 750, 90, 60],
] as const;
const TASSETS: Shape[] = [];
const TASSET_RIVETS: Path2D[] = [];
for (const [dx, dy, w, h] of PAULD_TASSET) {
  const x = 470 + dx;
  TASSETS.push(
    Shape.d(
      `M ${x} ${dy} L ${x + w} ${dy} C ${x + w + 4} ${dy + h * 0.6}, ${x + w - 14} ${dy + h}, ${x + w * 0.5} ${dy + h + 6} ` +
        `C ${x + 14} ${dy + h}, ${x - 4} ${dy + h * 0.6}, ${x} ${dy} Z`,
    ),
  );
  TASSET_RIVETS.push(rivetPath([x + 16, dy + 14, x + w - 16, dy + 14], 3.6));
}
const POUCH = Shape.d('M 410 716 L 462 716 L 462 776 C 440 786, 420 782, 410 770 Z');
const POUCH_FLAP = Shape.d('M 410 716 L 462 716 L 462 742 C 440 752, 422 750, 410 742 Z', true);
const HORN = Shape.d(
  'M 520 712 C 560 716, 596 744, 600 800 C 596 794, 590 790, 584 788 C 580 750, 556 736, 520 730 Z',
);
const HORN_CAP = Shape.d(rr(508, 710, 22, 26, 6), true);
const FR_SASH = new Frame(0, 0.15, 0, -0.3);

// ── Pauldron, sleeves, glove ──────────────────────────────────

const PAULD = [lame(62, 30, 0.72), lame(56, 10, 0.78)];
const PAULD_HI = mkPath('M -46 -2 A 50 36 0 0 1 36 -18');
const PAULD_RIVETS = rivetPath([-24, 8, 22, 0], 4.2);
const PAULD_EDGE = mkPath('M -58 28 Q 0 52 52 40');
const PAULD_EDGE_FR = new Frame(0, 28, 0, 52);
const ARMBAND = Shape.d('M -40 84 Q 0 98 40 84 L 41 118 Q 0 132 -41 118 Z', true);
const CAP_FAR = Shape.d('M -50 -2 C -52 -48, 40 -52, 52 -2 C 20 24, -20 24, -50 -2 Z', true);
const SLASH = Shape.d(rr(-8, 36, 16, 96, 7), true);
const SLEEVE_BTNS = rivetPath([0, 150, 0, 138, 0, 126], 4.5);
const GLOVE = Shape.d('M -25 -26 C -30 -6, -26 20, -10 30 L 14 30 C 28 20, 30 -6, 25 -26 Z');
const GLOVE_LINES = mkPath('M -24 -8 Q 0 -2 24 -8 M -22 6 Q 0 12 22 6');
const GLOVE_HI = mkPath('M -18 -22 C -22 -4, -18 16, -6 26');
const GAUNTLET = Shape.d('M -30 -26 L 30 -26 L 40 -58 L -40 -58 Z', true);
const GAUNTLET_BAND = Shape.d(rr(-31, -58, 62, 14, 5), true);

// ── Legs ──────────────────────────────────────────────────────

const THIGH_SLASH = Shape.d(rr(-11, 60, 22, 130, 9), true);
const GARTER = Shape.d(rr(-46, 232, 92, 24, 8), true);
const GARTER_BUCKLE = Shape.d(rr(-6, 233, 14, 22, 3), true);
const BOOT_CUFF = Shape.d('M -50 -30 L 52 -34 L 58 22 C 30 34, -28 32, -54 22 Z', true);
const BOOT_CUFF_FOLD = mkPath('M -46 -8 C -18 2, 22 2, 52 -10');
const BOOT_STRAP = Shape.d(rr(-52, 56, 104, 14, 6), true);
const FOOT = Shape.d(
  'M -36 -14 L 30 -16 C 66 -10, 100 4, 128 22 C 138 28, 136 42, 122 42 L -36 42 Z',
  true,
);
const HEEL = Shape.d('M -38 36 L -4 36 L -6 60 L -38 60 Z', true);
const FOOT_SEAM = mkPath('M 6 10 C 46 10, 84 16, 112 28');
const SOLE = Shape.d('M -38 40 L 124 40 C 136 40, 138 48, 122 48 L -38 48 Z', true);

// ── Head ──────────────────────────────────────────────────────

const BEARD = Shape.d(
  'M 40 50 C 60 54, 78 48, 90 40 C 96 52, 90 70, 74 82 C 56 94, 26 92, 12 80 C 26 74, 32 62, 40 50 Z',
);
const BEARD_LOCK = mkPath('M 36 66 C 48 74, 64 72, 78 60');
const HAIR = Shape.d(
  'M -62 4 C -72 -52, -34 -84, 6 -80 C -4 -60, -30 -40, -40 -4 C -46 28, -54 36, -62 4 Z',
);
const COLLAR = Shape.d('M -40 60 C -20 84, 44 88, 62 58 L 72 98 C 40 120, -24 116, -50 98 Z', true);
const COLLAR_LINE = mkPath('M -34 78 C -8 96, 34 98, 62 78');
// morion
const MOR_BOWL = Shape.d('M -84 -26 C -86 -98, -34 -124, 12 -122 C 62 -120, 98 -90, 100 -26 Z');
const MOR_BRIM = Shape.d(
  'M -156 -60 C -122 -26, -62 -12, 10 -12 C 84 -12, 146 -26, 176 -68 C 134 -46, 62 -36, 10 -36 C -62 -36, -118 -46, -156 -60 Z',
  true,
);
const MOR_COMB = Shape.d(
  'M -78 -112 C -44 -176, 52 -176, 94 -108 L 82 -96 C 52 -142, -38 -142, -68 -96 Z',
);
const MOR_BAND = mkPath('M -84 -34 C -30 -20, 40 -20, 100 -36');
const MOR_BAND_FR = new Frame(0, -36, 0, -18);
const MOR_HI = mkPath('M -70 -42 C -64 -86, -30 -110, 12 -110');
const MOR_RIVETS = rivetPath([-60, -30, -20, -22, 24, -22, 66, -28], 4.2);
// felt hat
const HAT_BRIM = Shape.d(
  'M -204 -48 C -158 -86, -62 -94, 14 -92 C 96 -94, 168 -82, 206 -46 C 160 -26, 82 -16, 10 -16 C -70 -16, -150 -22, -204 -48 Z',
  true,
);
const HAT_CROWN = Shape.d('M -72 -64 C -80 -170, 76 -178, 84 -68 C 40 -54, -30 -54, -72 -64 Z');
const HAT_BAND = Shape.d(
  'M -73 -70 C -30 -58, 40 -58, 84 -74 L 86 -100 C 40 -86, -30 -86, -74 -102 Z',
  true,
);
const HAT_BUCKLE = Shape.d(rr(6, -100, 30, 36, 6), true);
const HAT_FOLD = mkPath('M -150 -50 C -100 -66, 60 -70, 160 -48');

// ── Limb tubes ────────────────────────────────────────────────

const TUBES: (Tube | undefined)[] = [];
function tube(seg: number, cls: number, len: number, r0: number, r1: number): Tube {
  const i = seg * 3 + cls;
  let t = TUBES[i];
  if (!t || t.r0 !== r0 || t.len !== len) {
    t = new Tube(
      len,
      r0,
      r1,
      seg === 0 ? 1 : seg === 1 ? 0 : seg === 2 ? 0 : 2,
      seg === 2 ? 0.034 : seg === 0 ? 0.016 : seg === 1 ? 0.008 : 0.004,
    );
    TUBES[i] = t;
  }
  return t;
}

const gunnerLimbs = (): LimbStyle => ({
  upper: 'cloth',
  fore: 'cloth',
  thigh: 'cloth',
  shin: 'leather',
  arm: 0.82,
  leg: 0.88,
});

/** The felt hat (with a feather) for grenadiers and spear-bearers, the morion for the rest. */
function feltHat(f: F): boolean {
  if (f.hero) return false;
  const w = f.spec.weaponType;
  return w === 'polearm' || w === 'explosive';
}

const PLUME_W = [0.9, 1, 1.1] as const;
const FLAG_FR = new Frame(0, 0.25, 0, -0.25);

export const gunner: Look = {
  model: 'gunner',
  headScale: 1.2,
  limbs: gunnerLimbs,

  segment(f, seg, far, len, r0, r1) {
    const m = mats(f);
    const t = tube(seg, f.cls, len, r0, r1);
    if (seg === 0 || seg === 1) softTube(f.ctx, t, far ? m.coatFar : m.coat, !far);
    else if (seg === 2) softTube(f.ctx, t, far ? m.breechesFar : m.breeches, !far);
    else paintTube(f.ctx, t, far ? m.bootFar : m.boot, false);
  },

  back(f) {
    const c = f.ctx;
    const m = mats(f);
    const lod = K.lod;
    c.save();
    c.scale(f.g, 1);
    refIn(c, 500, 752);
    // The match coil hangs off the back of the pack.
    c.save();
    c.translate(406, 400);
    c.rotate(PACK_LEAN);
    paint(c, COIL, m.cord, inkR(5.5));
    if (lod > 0) {
      c.lineWidth = inkR(5);
      c.strokeStyle = m.leatherDark.at(0);
      c.globalAlpha = 0.6;
      c.stroke(COIL_IN.p);
      c.globalAlpha = 1;
    }
    paint(c, COIL_IN, m.leatherDark, inkR(4), true);
    // Steam pack: a slim brass tank with steel hoops, a gauge and a glowing furnace window.
    paint(c, PACK, m.brass, inkR(6));
    if (lod > 0) {
      streak(c, PACK_HI, inkR(5), 0.4);
      paint(c, PACK_BANDS, m.steelFar, inkR(4));
    }
    rivets(c, PACK_RIVETS, inkR(1.5));
    paint(c, PACK_CAP, m.steel, inkR(5), true);
    paint(c, PACK_VENT, m.brass, inkR(5), true);
    flat(c, PACK_WINDOW.p, '#1b1d25');
    glow(c, 'ember', 0, 138, 24, 24, 0.8 + 0.2 * Math.sin(f.t * 3.1) + 0.06 * Math.sin(f.t * 11));
    c.lineWidth = inkR(5);
    c.strokeStyle = m.brass.grad(c, PACK_WINDOW.fr, false);
    c.stroke(PACK_WINDOW.p);
    if (lod > 0) {
      c.save();
      c.translate(-24, 62);
      paint(c, GAUGE, m.linen, inkR(4));
      c.lineWidth = inkR(4);
      c.strokeStyle = m.brass.grad(c, GAUGE.fr, false);
      c.stroke(GAUGE.p);
      const a = -0.6 + Math.sin(f.t * 1.7) * 0.35 + Math.sin(f.t * 7) * 0.04;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.sin(a) * 11, -Math.cos(a) * 11);
      c.lineWidth = inkR(3.2);
      c.strokeStyle = '#b01c24';
      c.stroke();
      c.restore();
    }
    c.restore();
    band(c, PIPE, PIPE_FR, m.brass, inkR(20), 12);
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
    paint(c, COAT, m.coat, inkR(6));
    if (lod > 0) {
      seam(c, COAT_QUILT, inkR(3), 0.3);
      streak(c, COAT_HI, inkR(4), 0.5);
      if (lod === 2) streak(c, COAT_RIM, inkR(3), 0.5, '#ffb866');
    }
    paint(c, COAT_COLLAR, m.coat, inkR(5), true);
    // Light steel breast and back plate, ridged.
    paint(c, CUIRASS, m.steel, inkR(5.5));
    if (lod > 0) {
      seam(c, CUI_RIDGE, inkR(3.5), 0.45);
      streak(c, CUI_HI, inkR(4), 0.6);
      if (lod === 2) streak(c, CUI_RIM, inkR(3), 0.5, '#ffb866');
      band(c, CUI_BAND, CUI_BAND_FR, m.brass, inkR(12), 7);
    }
    rivets(c, CUI_RIVETS, inkR(1.5));
    if (f.hero && lod > 0) {
      paint(c, MEDAL, m.brass, inkR(4));
      c.lineWidth = inkR(5);
      c.lineCap = 'round';
      c.strokeStyle = m.brass.at(2);
      c.stroke(MEDAL_RAYS);
    }
    // Bandolier with its row of wooden powder flasks.
    band(c, BANDOLIER, BANDOLIER_FR, m.leather, inkR(24), 16);
    const nf = lod === 0 ? 5 : 8;
    for (let i = 0; i < nf; i++) {
      const k = lod === 0 ? i + 1 + (i > 2 ? 2 : 0) : i;
      const x = FLASK_AT[k * 2] as number;
      const y = FLASK_AT[k * 2 + 1] as number;
      c.save();
      c.translate(x, y);
      c.rotate(-0.2);
      paint(c, FLASK, m.flask, inkR(4));
      paint(c, FLASK_CAP, m.brass, inkR(3.4), true);
      c.restore();
    }
    dots(c, BUTTONS, m, inkR(1.6));
    paint(c, BELT, m.leather, inkR(5));
    paint(c, BUCKLE, m.brass, inkR(4), true);
    if (lod > 0) paint(c, BUCKLE_IN, m.leatherDark, inkR(2.4), true);
    refOut(c);
    c.restore();
  },

  front(f) {
    if (!f.hero) return;
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
    c.scale(f.g, 1);
    refIn(c, 500, 752);
    // Coat skirts, open at the front, lagging behind the stride.
    c.save();
    const k = -0.06 - f.drag * 0.46 + Math.sin(f.t * 2.1) * 0.04;
    c.transform(1, 0, k, 1, -k * 650, 0);
    paint(c, SKIRT, m.coat, inkR(5), true);
    paint(c, SKIRT_LINING, m.lining, inkR(4), true);
    if (lod > 0) seam(c, SKIRT_FOLDS, inkR(3), 0.4);
    paint(c, SKIRT_HEM, m.leatherDark, inkR(4), true);
    dots(c, HEM_BUTTONS, m, inkR(1.5));
    c.restore();
    const n = f.cls;
    for (let i = 0; i < n; i++) {
      paint(c, TASSETS[i] as Shape, m.steel, inkR(5));
      rivets(c, TASSET_RIVETS[i] as Path2D, inkR(1.4));
    }
    paint(c, POUCH, m.leather, inkR(4.5));
    paint(c, POUCH_FLAP, m.leatherDark, inkR(4), true);
    if (lod > 0) {
      paint(c, HORN, m.flask, inkR(4.5));
      paint(c, HORN_CAP, m.brass, inkR(3.5), true);
    }
    refOut(c);
    c.restore();
    const acc = f.acc.as('cloth');
    flag(
      c,
      acc,
      FR_SASH,
      0.1,
      0.12,
      -Math.PI / 2 - 0.12,
      -0.3,
      0.32,
      0.09,
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
    const felt = feltHat(f);
    const s = [0.96, 1, 1.05][f.cls] as number;
    const pw = PLUME_W[f.cls] as number;
    c.save();
    c.translate(0, -0.012);
    c.scale(s, s);
    // The plume (morion) or feather (hat) in the side colour, streaming back.
    const pm = f.hero ? m.coat : f.acc.as('cloth');
    if (felt) {
      flag(
        c,
        pm,
        FLAG_FR,
        -0.06,
        0.2,
        2.75,
        1.5,
        0.5 * pw,
        0.13 * pw,
        0.02,
        0.22,
        f.t,
        0.4,
        f.drag * 0.9,
        inkU(4.5),
        8,
      );
    } else {
      flag(
        c,
        pm,
        FLAG_FR,
        -0.02,
        0.22,
        3.1,
        0.7,
        0.36 * pw,
        0.1 * pw,
        0.02,
        0.2,
        f.t,
        0.8,
        f.drag * 0.9,
        inkU(4.5),
        7,
      );
      if (f.hero)
        flag(
          c,
          m.brass,
          FLAG_FR,
          -0.02,
          0.22,
          2.8,
          1.1,
          0.3,
          0.03,
          0.01,
          0.2,
          f.t,
          0.2,
          f.drag * 0.9,
          inkU(3),
          6,
        );
    }
    refIn(c, 0, 0);
    paint(c, NECK, m.skinFar, inkR(4.5), true);
    paint(c, HAIR, m.hair, inkR(4));
    paint(c, HEAD, m.skin, inkR(5.5));
    paint(c, EAR, m.skinFar, inkR(3.5));
    paint(c, BEARD, m.hair, inkR(4.5));
    if (lod > 0) seam(c, BEARD_LOCK, inkR(3), 0.35);
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
    c.lineWidth = inkR(5);
    c.strokeStyle = m.hair.at(1);
    c.stroke(BROW);
    paint(c, COLLAR, m.linen, inkR(4.5), true);
    if (lod > 0) seam(c, COLLAR_LINE, inkR(3), 0.35);
    if (felt) {
      paint(c, HAT_CROWN, m.felt, inkR(6));
      paint(c, HAT_BRIM, m.felt, inkR(6), true);
      if (lod > 0) seam(c, HAT_FOLD, inkR(3), 0.3);
      paint(c, HAT_BAND, m.leatherDark, inkR(4.5), true);
      paint(c, HAT_BUCKLE, m.brass, inkR(4), true);
    } else {
      paint(c, MOR_COMB, m.steel, inkR(5.5));
      paint(c, MOR_BOWL, m.steel, inkR(6));
      paint(c, MOR_BRIM, m.steel, inkR(5.5), true);
      band(c, MOR_BAND, MOR_BAND_FR, m.brass, inkR(14), 9);
      if (lod > 0) streak(c, MOR_HI, inkR(5), 0.6);
      rivets(c, MOR_RIVETS, inkR(1.5));
      glint(c, 24, -92, 14, 0.5 + 0.45 * Math.sin(f.t * 2.9 + 1));
    }
    refOut(c);
    c.restore();
  },

  pad(f, far) {
    const c = f.ctx;
    const m = mats(f);
    const lod = K.lod;
    const kk = [0.95, 1.1, 1.24][f.cls] as number;
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
      paint(c, CAP_FAR, m.coatFar, inkR(5), true);
      refOut(c);
      c.restore();
      return;
    }
    paint(c, PAULD[0] as Shape, m.steel, inkR(5));
    paint(c, PAULD[1] as Shape, m.steel, inkR(5.5));
    if (lod > 0) {
      band(c, PAULD_EDGE, PAULD_EDGE_FR, m.brass, inkR(11), 6);
      streak(c, PAULD_HI, inkR(5), 0.6);
    }
    rivets(c, PAULD_RIVETS, inkR(1.4));
    glint(c, 4, -18, 18, 0.55 + 0.4 * Math.sin(f.t * 2.4));
    refOut(c);
    c.restore();
  },

  fore(f, far) {
    const c = f.ctx;
    const m = mats(f);
    if (K.lod === 0) return;
    refIn(c, 0, 0);
    // A slash in the sleeve showing the linen lining, and cuff buttons.
    paint(c, SLASH, m.lining, inkR(3.5), true);
    if (!far) dots(c, SLEEVE_BTNS, m, inkR(1.4));
    refOut(c);
  },

  hand(f, far) {
    const c = f.ctx;
    const m = mats(f);
    c.save();
    c.scale(0.5 + f.g * 0.5, 1);
    refIn(c, 0, 2);
    paint(c, GLOVE, far ? m.leatherDark : m.leather, inkR(5));
    if (K.lod > 0) {
      seam(c, GLOVE_LINES, inkR(2.6), 0.5);
      streak(c, GLOVE_HI, inkR(3), 0.3);
    }
    paint(c, GAUNTLET, far ? m.leatherDark : m.leather, inkR(4.5), true);
    paint(c, GAUNTLET_BAND, m.brass, inkR(3.5), true);
    refOut(c);
    c.restore();
  },

  thigh(f, far) {
    if (K.lod === 0) return;
    const c = f.ctx;
    const m = mats(f);
    c.save();
    c.scale(f.g, 1);
    refIn(c, 0, 0);
    paint(c, THIGH_SLASH, far ? m.coatFar : m.lining, inkR(3.5), true);
    paint(c, GARTER, m.leather, inkR(4), true);
    paint(c, GARTER_BUCKLE, m.brass, inkR(3), true);
    refOut(c);
    c.restore();
  },

  shin(f, far) {
    const c = f.ctx;
    const m = mats(f);
    c.save();
    c.scale(f.g, 1);
    refIn(c, 0, 0);
    // The turned-down cuff of the tall boot.
    paint(c, BOOT_CUFF, far ? m.leatherDark : m.leather, inkR(5), true);
    if (K.lod > 0) {
      seam(c, BOOT_CUFF_FOLD, inkR(3), 0.5);
      if (!far) paint(c, BOOT_STRAP, m.leatherDark, inkR(3.5), true);
    }
    refOut(c);
    c.restore();
  },

  boot(f, far) {
    const c = f.ctx;
    const m = mats(f);
    c.save();
    c.scale(f.g, 1);
    refIn(c, 0, 0);
    const mat = far ? m.bootFar : m.boot;
    paint(c, HEEL, m.leatherDark, inkR(4), true);
    paint(c, FOOT, mat, inkR(5.5), true);
    paint(c, SOLE, m.leatherDark, inkR(3.5), true);
    if (K.lod > 0) seam(c, FOOT_SEAM, inkR(3), 0.5);
    refOut(c);
    c.restore();
  },

  over(f) {
    // Steam leaking from the vent of the pack.
    const c = f.ctx;
    const n = K.lod === 0 ? 2 : K.lod === 1 ? 3 : 4;
    c.save();
    c.translate(0, 0.96);
    c.rotate(f.pose.lean);
    c.scale(f.g, 1);
    for (let i = 0; i < n; i++) {
      const ph = (f.t * 0.5 + i / n) % 1;
      const x = VENT_X - ph * 0.24 - f.drag * 0.2 * ph + Math.sin(f.t * 2 + i * 2) * 0.012;
      const y = VENT_Y + ph * 0.46;
      const r = 0.04 + ph * 0.12;
      glow(c, 'steam', x, y, r, r, Math.min(1, (1 - ph) * 1.4) * 0.85);
    }
    c.restore();
  },
};
