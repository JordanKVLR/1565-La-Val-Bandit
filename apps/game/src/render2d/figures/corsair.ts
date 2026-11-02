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
import type { F, LimbStyle, Look, Palette } from './types';

/**
 * The Barbary corsairs' armatura (frames levend and reis), drawn in the Cavaliere's style but
 * lighter and more nimble: a headscarf or turban in crimson with a plume in the side colour, an
 * open teal vest over a riveted steel breastplate, a wide sash in the side colour, baggy crimson
 * trousers gathered at the knee, leather boots with curled toes, a cutlass or kilij, a grapple
 * hook and rope at the hip and a small brass steam pack with a whistle. Static plates are
 * authored in reference pixels (570 px = 1 world unit, y down) with the origin at the hook's own
 * origin, exactly like knight.ts. See docs/art/FIGURE_STYLE.md.
 */

// ── Materials ─────────────────────────────────────────────────

interface Mats {
  steel: Swatch;
  steelFar: Swatch;
  brass: Swatch;
  teal: Swatch;
  tealFar: Swatch;
  crimson: Swatch;
  crimsonFar: Swatch;
  skin: Swatch;
  skinFar: Swatch;
  leather: Swatch;
  leatherFar: Swatch;
  beard: Swatch;
  white: Swatch;
  rope: Swatch;
}
const MATS = new WeakMap<Palette, Mats>();

export function darker(hex: string, k = 0.66): string {
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
    const teal = f.p.cloth.c[0] as string;
    const crimson = f.p.hat.c[0] as string;
    const skin = f.p.skin.c[0] as string;
    m = {
      steel: sw('#a4adbd', 'metal'),
      steelFar: sw('#6f7787', 'metal'),
      brass: sw('#d9a443', 'metal'),
      teal: sw(teal, 'cloth'),
      tealFar: sw(darker(teal), 'cloth'),
      crimson: sw(crimson, 'cloth'),
      crimsonFar: sw(darker(crimson), 'cloth'),
      skin: sw(skin, 'matte'),
      skinFar: sw(darker(skin), 'matte'),
      leather: sw('#6b4226', 'matte'),
      leatherFar: sw('#46301f', 'matte'),
      beard: sw('#2a2420', 'matte'),
      white: sw('#f3ecd6', 'soft'),
      rope: sw('#d8c690', 'matte'),
    };
    MATS.set(f.p, m);
  }
  return m;
}

// ── Path helpers ──────────────────────────────────────────────

function rr(x: number, y: number, w: number, h: number, r: number): string {
  return (
    `M ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} ` +
    `L ${x + w} ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} ` +
    `L ${x + r} ${y + h} Q ${x} ${y + h} ${x} ${y + h - r} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} Z`
  );
}

/** The corsair's torso is a touch broader than the plates are drawn. */
const TW = 1.16;

// ── Torso (reference origin: the hip) ─────────────────────────

const PLATE = Shape.d(
  'M -58 -334 C -74 -270 -64 -180 -54 -66 L 56 -62 C 70 -150 72 -262 56 -334 C 20 -352 -26 -352 -58 -334 Z',
);
const PLATE_HI = mkPath('M 22 -322 C 18 -250 20 -170 28 -100');
const PLATE_SEAM = mkPath('M 36 -326 C 42 -250 42 -160 38 -92');
const PLATE_RIVETS = rivetPath([50, -306, 52, -268, 52, -150, 48, -112, 12, -312, 14, -112], 4.2);
const VEST = Shape.d(
  'M -62 -332 C -78 -270 -68 -180 -58 -66 L 18 -62 C 4 -130 -14 -200 -12 -250 C -10 -290 -6 -318 0 -344 C -22 -354 -42 -350 -62 -332 Z',
);
const VEST_EDGE = mkPath('M 0 -344 C -6 -318 -10 -290 -12 -250 C -14 -200 4 -130 18 -62');
const VEST_EDGE_FR = new Frame(0, -342, 0, -62);
const VEST_FOLDS = mkPath(
  'M -34 -300 C -46 -230 -40 -150 -30 -80 M -12 -280 C -16 -220 -8 -150 0 -90',
);
const VENT_RING = Shape.circle(40, -214, 19);
const VENT_DARK = mkPath();
VENT_DARK.arc(40, -214, 13, 0, Math.PI * 2);
const COLLAR = Shape.d(
  'M -16 -352 C -2 -380 42 -380 56 -352 L 58 -326 C 30 -312 0 -314 -18 -328 Z',
  true,
);
const SASH = Shape.d(
  'M -66 -128 C -20 -102 30 -102 68 -128 L 70 -62 C 30 -34 -22 -34 -64 -62 Z',
  true,
);
const SASH_FOLDS = mkPath('M -50 -112 C -20 -88 20 -88 54 -112 M -52 -86 C -20 -62 20 -62 56 -86');
const BELT = Shape.d('M -62 -74 C -20 -50 30 -50 66 -74 L 66 -58 C 30 -34 -22 -34 -62 -58 Z', true);
const BUCKLE = Shape.d(rr(46, -92, 26, 36, 6));
const STRAP = Shape.d('M -56 -330 L -30 -338 L 66 -112 L 40 -96 Z', true);
const CARTS = (() => {
  const p = mkPath();
  const ax = -42;
  const ay = -318;
  const bx = 54;
  const by = -108;
  const l = Math.hypot(bx - ax, by - ay);
  const dx = (bx - ax) / l;
  const dy = (by - ay) / l;
  const nx = -dy;
  const ny = dx;
  for (let i = 0; i < 5; i++) {
    const t = 0.16 + i * 0.17;
    const cx = ax + (bx - ax) * t;
    const cy = ay + (by - ay) * t;
    const hl = 26;
    const hw = 8;
    p.moveTo(cx - dx * hl + nx * hw, cy - dy * hl + ny * hw);
    p.lineTo(cx + dx * hl + nx * hw, cy + dy * hl + ny * hw);
    p.lineTo(cx + dx * hl - nx * hw, cy + dy * hl - ny * hw);
    p.lineTo(cx - dx * hl - nx * hw, cy - dy * hl - ny * hw);
    p.closePath();
  }
  return p;
})();

// ── Back: steam pack with a whistle ───────────────────────────

const PACK = Shape.d(rr(-46, 0, 92, 178, 38));
const PACK_BANDS = Shape.d([36, 94, 148].map((y) => rr(-50, y, 100, 13, 6)).join(' '), false);
const PACK_RIVETS = rivetPath(
  [36, 94, 148].flatMap((y) => [-40, y + 6, 40, y + 6, 0, y + 6]),
  3.4,
);
const PACK_CAP = Shape.d(rr(-22, -26, 44, 30, 10), true);
const PACK_HI = mkPath('M -32 16 C -36 70 -36 140 -28 166');
const WHISTLE_PIPE = Shape.d(rr(-8, -62, 16, 40, 5), true);
const WHISTLE = Shape.d(rr(-34, -92, 68, 32, 14), true);
const WHISTLE_SLOT = mkPath('M 6 -86 L 6 -66');
const PORT = Shape.circle(0, 98, 24);
const PIPE_SHOULDER = mkPath('M -70 -300 C -62 -352 -30 -356 2 -338');
const PIPE_SHOULDER_FR = new Frame(0, -356, 0, -300);
const PACK_LEAN = (10 * Math.PI) / 180;
const VENT_X = -112 / 570;
const VENT_Y = 410 / 570;

// ── Kilt, rope and grapple (hip frame) ────────────────────────

const KILT = Shape.d(
  'M -68 -70 L 74 -64 L 84 124 C 62 144 44 118 24 138 C 4 158 -18 126 -40 144 C -58 154 -72 138 -82 128 Z',
  true,
);
const KILT_FOLDS = mkPath('M -34 -60 C -40 20 -42 80 -38 130 M 12 -60 C 14 20 18 80 20 130');
const KILT_HEM = Shape.d(
  'M -82 120 L 84 114 L 84 130 C 62 148 44 124 24 144 C 4 164 -18 132 -40 150 C -58 160 -72 144 -82 134 Z',
  true,
);
const COIL = (() => {
  const p = mkPath();
  for (let i = 0; i < 3; i++) {
    p.moveTo(-42 + i * 3 + 34, 70);
    p.ellipse(-42 + i * 3, 70, 34 - i * 4, 40 - i * 4, 0, 0, Math.PI * 2);
  }
  return p;
})();
const COIL_OUT = Shape.circle(-42, 70, 40);
const HOOK = (() => {
  const p = mkPath('M -42 108 L -42 150 C -42 190 -88 190 -90 150');
  return p;
})();
const HOOK_FR = new Frame(-90, 0, -42, 0);
const HOOK_TIP = Shape.d('M -98 148 L -82 148 L -90 130 Z', true);

// ── Head (reference origin: the head centre) ──────────────────

const NECK = Shape.d('M -28 40 L 32 44 L 46 130 L -36 130 Z', true);
const FACE = Shape.d(
  'M -46 0 C -52 -44 -18 -66 22 -60 C 52 -54 62 -34 64 -16 C 74 -8 84 8 78 20 C 74 24 68 24 64 28 C 66 46 56 64 36 70 C 6 80 -32 64 -46 32 Z',
);
const BEARD = Shape.d(
  'M 66 30 C 72 58 46 92 8 88 C -28 84 -52 58 -46 30 C -30 46 10 52 40 40 C 52 36 60 32 66 30 Z',
);
const STACHE = mkPath('M 68 26 C 54 32 38 34 22 28');
const EYE_WHITE = (() => {
  const p = mkPath();
  p.ellipse(48, 2, 11, 7, -0.1, 0, Math.PI * 2);
  return p;
})();
const EYE_IRIS = (() => {
  const p = mkPath();
  p.arc(52, 2, 5.2, 0, Math.PI * 2);
  return p;
})();
const BROW = mkPath('M 28 -14 C 44 -22 58 -22 70 -16');
const EAR = Shape.d('M -12 2 C -24 0 -26 22 -12 28 C -4 30 4 22 2 10 C 0 2 -4 2 -12 2 Z', true);
const EARRING = (() => {
  const p = mkPath();
  p.arc(-10, 38, 9, 0, Math.PI * 2);
  return p;
})();
const TURBAN = Shape.d(
  'M -72 6 C -92 -70 -32 -132 28 -124 C 88 -114 96 -58 90 -20 C 64 -38 30 -46 -2 -44 C -34 -42 -60 -28 -72 6 Z',
  true,
);
const PUFF = Shape.d(
  'M -44 -76 C -38 -124 8 -152 52 -128 C 82 -112 84 -86 70 -76 C 44 -90 0 -92 -44 -76 Z',
  true,
);
const WRAP1 = mkPath('M -70 -4 C -64 -52 -20 -84 40 -84 C 70 -84 84 -66 88 -48');
const WRAP2 = mkPath('M -80 -34 C -62 -84 -10 -108 50 -100 C 76 -96 84 -84 86 -70');
const WRAP3 = mkPath('M -36 -86 C -14 -122 30 -138 62 -120');
const WRAP_HI = mkPath('M -56 -40 C -44 -80 -6 -100 32 -100');
const HAT_BAND = mkPath('M -68 -6 C -34 -30 40 -42 86 -22');
const HAT_BAND_FR = new Frame(0, -42, 0, -4);
const JEWEL = Shape.circle(70, -40, 11);
const FINIAL = Shape.d('M 4 -134 L 18 -180 L 32 -134 Z', true);
const FR_PLUME = new Frame(0, 0.25, 0, -0.25);
const PLUME_W = [0.9, 1, 1.1] as const;
const KNOT = Shape.circle(-68, -34, 15);

// ── Pauldron, bracer, glove ───────────────────────────────────

function lame(r: number, off: number): Shape {
  return new Shape(
    mkPath(
      `M ${-r} ${off} A ${r} ${r * 0.86} 0 0 1 ${r * 0.9} ${off - 6} L ${r * 0.8} ${off + 18} ` +
        `Q 0 ${off + 28} ${-r} ${off + 10} Z`,
    ),
    new Frame(-r, 0, r, 0),
  );
}
const LAMES = [lame(50, 28), lame(46, 12), lame(42, -2)];
const PAULDRON_HI = mkPath('M -38 -6 A 42 36 0 0 1 32 -20');
const PAULDRON_STUD = Shape.circle(2, -18, 9, true);
const ARMBAND = Shape.d('M -34 66 Q 0 78 34 66 L 35 98 Q 0 110 -35 98 Z', true);
const BRACER = Shape.d('M -33 52 C -37 96 -34 136 -28 164 L 28 164 C 34 136 37 96 33 52 Z');
const BRACER_BANDS = Shape.d(
  'M -36 52 L 36 52 L 35 68 L -35 68 Z M -30 150 L 30 150 L 29 166 L -29 166 Z',
  true,
);
const BRACER_HI = mkPath('M -22 74 C -26 104 -24 130 -18 146');
const BRACER_RIVETS = rivetPath([-20, 60, 0, 61, 20, 60], 3.6);
const GLOVE = Shape.d('M -22 -22 C -26 -4 -22 16 -8 26 L 12 26 C 24 16 26 -4 22 -22 Z');
const GLOVE_LINES = mkPath('M -22 -8 Q 0 -2 22 -8 M -22 6 Q 0 12 22 6');
const GLOVE_HI = mkPath('M -16 -18 C -20 -4 -16 12 -6 22');
const CUFF = Shape.d(rr(-28, -34, 56, 14, 6), true);

// ── Legs and feet ─────────────────────────────────────────────

const KNEE_BAND = Shape.d('M -50 -4 L 50 -4 L 46 24 L -46 24 Z', true);
const KNEE_RIVETS = rivetPath([-30, 10, 0, 11, 30, 10], 3.6);
const GREAVE = Shape.d('M 8 34 C 32 32 52 38 50 52 L 40 214 L 6 224 Z');
const GREAVE_HI = mkPath('M 22 50 C 24 100 22 160 20 204');
const SHIN_BAND = mkPath('M -40 120 L 44 124 M -38 176 L 40 180');
const BOOT = Shape.d(
  'M -36 -22 L 32 -24 C 62 -10 96 2 128 6 C 154 8 174 -4 188 -28 C 198 -6 192 22 166 36 L -36 38 Z',
  true,
);
const BOOT_SEAM = mkPath('M 4 14 C 50 14 96 20 138 28');
const BOOT_TIP = Shape.d('M 176 -12 C 190 -34 188 -30 194 -36 C 200 -10 194 18 172 30 Z', true);
const ANKLE = Shape.d(rr(-34, -34, 70, 16, 6), true);

// ── Limb tubes ────────────────────────────────────────────────

const TUBES: (Tube | undefined)[] = [];
function tube(seg: number, cls: number, len: number, r0: number, r1: number): Tube {
  const i = seg * 3 + cls;
  let t = TUBES[i];
  if (!t || t.r0 !== r0 || t.len !== len) {
    const bulge = seg === 0 ? 0.022 : seg === 1 ? 0.004 : seg === 2 ? 0.07 : 0.012;
    t = new Tube(len, r0, r1, seg === 3 ? 2 : seg === 0 ? 1 : 0, bulge);
    TUBES[i] = t;
  }
  return t;
}

function corsairLimbs(): LimbStyle {
  return { upper: 'cloth', fore: 'skin', thigh: 'cloth', shin: 'leather', arm: 0.86, leg: 0.88 };
}

// ── The look ──────────────────────────────────────────────────

/** Drawing helpers shared with the barge crew (same anatomy, other clothes). */
function bareHead(
  c: Ctx,
  m: Pick<Mats, 'skin' | 'skinFar' | 'beard' | 'white'>,
  lod: number,
  t: number,
): void {
  paint(c, NECK, m.skin.as('matte'), inkR(5), true);
  paint(c, FACE, m.skin, inkR(5.5));
  paint(c, EAR, m.skin, inkR(3.5), true);
  paint(c, BEARD, m.beard, inkR(4.5));
  c.lineCap = 'round';
  c.lineWidth = inkR(11);
  c.strokeStyle = '#0e1118';
  c.stroke(STACHE);
  c.lineWidth = inkR(6);
  c.strokeStyle = m.beard.at(2);
  c.stroke(STACHE);
  flat(c, EYE_WHITE, m.white.at(0));
  c.lineWidth = inkR(3);
  c.strokeStyle = '#0e1118';
  c.stroke(EYE_WHITE);
  flat(c, EYE_IRIS, '#1a0f0a');
  c.lineWidth = inkR(7);
  c.stroke(BROW);
  void lod;
  void t;
}

// ── Buckler (small round leather shield with a spiked steel boss) ──

const BK_RIM = Shape.circle(0, 0, 156);
const BK_FIELD = Shape.circle(0, 0, 144);
const BK_RING = Shape.circle(0, 0, 118);
const BK_BOSS = Shape.circle(0, 0, 44);
const BK_SPIKE = Shape.d('M -11 -38 L 0 -86 L 11 -38 Z', true);
const BK_STUDS = rivetPath(
  Array.from({ length: 6 }, (_, i) => [
    Math.cos((i / 6) * Math.PI * 2 + 0.3) * 88,
    Math.sin((i / 6) * Math.PI * 2 + 0.3) * 88,
  ]).flat(),
  9,
);
const BK_GLINT = mkPath('M -104 -40 A 112 112 0 0 1 -40 -104');

/** The corsair's buckler, drawn at the off hand: leather, a crimson ring, side-colour band, steel boss. */
export function corsairBuckler(f: F): void {
  const c = f.ctx;
  const m = mats(f);
  const k = RS * (1 + (f.cls - 1) * 0.08) * 0.8;
  c.save();
  c.translate(0.12, 0.08);
  c.scale(k, -k);
  c.rotate(-0.2);
  paint(c, BK_RIM, f.hero ? m.brass : m.steel, inkR(7));
  paint(c, BK_FIELD, m.leather, inkR(5));
  c.lineWidth = inkR(18);
  c.strokeStyle = '#0e1118';
  c.stroke(BK_RING.p);
  c.lineWidth = inkR(12);
  c.strokeStyle = f.acc.as('cloth').grad(c, BK_RING.fr, false);
  c.stroke(BK_RING.p);
  c.lineWidth = inkR(4);
  c.strokeStyle = m.crimson.at(0);
  c.stroke(BK_FIELD.p);
  paint(c, BK_BOSS, m.steel, inkR(6));
  if (K.lod > 0) paint(c, BK_SPIKE, m.steel, inkR(4));
  rivets(c, BK_STUDS, inkR(1.5));
  if (K.lod > 0) streak(c, BK_GLINT, inkR(7), 0.4);
  c.restore();
}

export const corsair: Look = {
  model: 'corsair',
  sabre: true,
  shield: () => true,
  shieldWith: (w) => w === 'blunt',
  headScale: 1.24,
  limbs: corsairLimbs,

  segment(f, seg, far, len, r0, r1) {
    const m = mats(f);
    const mat =
      seg === 0
        ? far
          ? m.tealFar
          : m.teal
        : seg === 1
          ? far
            ? m.skinFar
            : m.skin
          : seg === 2
            ? far
              ? m.crimsonFar
              : m.crimson
            : far
              ? m.leatherFar
              : m.leather;
    paintTube(f.ctx, tube(seg, f.cls, len, r0, r1), mat, !far);
  },

  back(f) {
    const c = f.ctx;
    const m = mats(f);
    const t = f.t;
    const lod = K.lod;
    c.save();
    c.scale(f.g * TW, 1);
    refIn(c, 0, 0);
    // Steam pack: a small brass boiler with steel hoops, a glowing port and a whistle.
    c.save();
    c.translate(-96, -332);
    c.rotate(PACK_LEAN);
    paint(c, WHISTLE_PIPE, m.brass, inkR(4), true);
    paint(c, WHISTLE, m.brass, inkR(4.5), true);
    if (lod > 0) seam(c, WHISTLE_SLOT, inkR(3.5));
    paint(c, PACK, m.brass, inkR(6));
    if (lod > 0) {
      streak(c, PACK_HI, inkR(5), 0.4);
      paint(c, PACK_BANDS, m.steelFar, inkR(4));
    }
    rivets(c, PACK_RIVETS, inkR(1.5));
    paint(c, PACK_CAP, m.steel, inkR(5), true);
    flat(c, PORT.p, '#1b1d25');
    glow(c, 'ember', 0, 98, 24, 24, 0.78 + 0.2 * Math.sin(t * 3.4) + 0.05 * Math.sin(t * 12));
    c.lineWidth = inkR(5);
    c.strokeStyle = m.brass.grad(c, PORT.fr, false);
    c.stroke(PORT.p);
    c.restore();
    band(c, PIPE_SHOULDER, PIPE_SHOULDER_FR, m.brass, inkR(20), 12);
    refOut(c);
    c.restore();
  },

  torso(f) {
    const c = f.ctx;
    const m = mats(f);
    const lod = K.lod;
    c.save();
    c.scale(f.g * TW, 1);
    refIn(c, 0, 0);
    // Steel breastplate seen at the front, the open vest over the back half.
    paint(c, PLATE, m.steel, inkR(6));
    if (lod > 0) {
      streak(c, PLATE_HI, inkR(4), 0.5);
      seam(c, PLATE_SEAM, inkR(3), 0.5);
    }
    rivets(c, PLATE_RIVETS, inkR(1.5));
    paint(c, VEST, m.teal, inkR(5.5));
    if (lod > 0) seam(c, VEST_FOLDS, inkR(3), 0.35);
    band(c, VEST_EDGE, VEST_EDGE_FR, m.brass, inkR(14), 9);
    // A small furnace port in the chest plate, breathing.
    flat(c, VENT_DARK, '#1a0e08');
    glow(c, 'ember', 40, -214, 22, 22, 0.7 + 0.25 * Math.sin(f.t * 3.4 + 0.7));
    c.lineWidth = inkR(5);
    c.strokeStyle = m.brass.grad(c, VENT_RING.fr, false);
    c.stroke(VENT_RING.p);
    c.lineWidth = inkR(2.5);
    c.strokeStyle = '#0e1118';
    c.stroke(VENT_DARK);
    paint(c, COLLAR, m.steel, inkR(5), true);
    refOut(c);
    c.restore();
  },

  front(f) {
    const c = f.ctx;
    const m = mats(f);
    const lod = K.lod;
    c.save();
    c.scale(f.g * TW, 1);
    refIn(c, 0, 0);
    // Bandolier with brass powder tubes.
    paint(c, STRAP, m.leather, inkR(4.5), true);
    if (lod > 0) {
      c.fillStyle = m.brass.at(0);
      c.fill(CARTS);
      c.lineWidth = inkR(3);
      c.strokeStyle = '#0e1118';
      c.stroke(CARTS);
    }
    // Wide sash in the side colour, belt and buckle.
    const acc = f.acc.as('cloth');
    paint(c, SASH, acc, inkR(5), true);
    if (lod > 0) seam(c, SASH_FOLDS, inkR(3), 0.35);
    paint(c, BELT, m.leather, inkR(4.5), true);
    paint(c, BUCKLE, m.brass, inkR(4), true);
    refOut(c);
    c.restore();
  },

  skirt(f) {
    const c = f.ctx;
    const m = mats(f);
    const lod = K.lod;
    c.save();
    c.scale(f.g * TW * (f.cls === 2 ? 1.06 : 1), 1);
    refIn(c, 0, 0);
    // Kilt of the kaftan swinging with the stride.
    c.save();
    const k = -0.05 - f.drag * 0.4 + Math.sin(f.t * 2.3) * 0.03;
    c.transform(1, 0, k, 1, k * 70, 0);
    paint(c, KILT, m.teal, inkR(5), true);
    if (lod > 0) seam(c, KILT_FOLDS, inkR(3), 0.35);
    paint(c, KILT_HEM, m.brass, inkR(4), true);
    c.restore();
    // Rope coil and grapple hook hanging from the belt.
    paint(c, COIL_OUT, m.rope, inkR(5));
    if (lod > 0) {
      c.lineWidth = inkR(4.5);
      c.strokeStyle = '#2c2418';
      c.stroke(COIL);
    }
    c.lineCap = 'round';
    c.lineWidth = inkR(18);
    c.strokeStyle = '#0e1118';
    c.stroke(HOOK);
    c.lineWidth = inkR(10);
    c.strokeStyle = m.steel.grad(c, HOOK_FR, false);
    c.stroke(HOOK);
    paint(c, HOOK_TIP, m.steel, inkR(4), true);
    refOut(c);
    c.restore();
    // The sash knot with two tails in the side colour.
    const acc = f.acc.as('cloth');
    for (let i = 0; i < 2; i++) {
      flag(
        c,
        acc,
        FR_TAIL,
        0.1 - i * 0.02,
        0.13,
        -Math.PI / 2 - 0.1 + i * 0.5,
        -0.25 - i * 0.2,
        0.3 - i * 0.07,
        0.085,
        0.06,
        0.16,
        f.t,
        1.1 + i * 1.7,
        -f.drag * 0.8,
        inkU(4),
        6,
      );
    }
    disc(c, acc, 0.1, 0.14, 0.034, inkU(3.5));
  },

  head(f) {
    const c = f.ctx;
    const m = mats(f);
    const lod = K.lod;
    const s = [0.96, 1, 1.04][f.cls] as number;
    c.save();
    c.translate(0, 0.02);
    c.scale(s, s);
    const pw = PLUME_W[f.cls] as number;
    // Plume in the side colour from the finial, and the turban tail streaming behind.
    const pm = f.acc.as('cloth');
    flag(
      c,
      pm,
      FR_PLUME,
      0.03,
      0.3,
      2.6,
      1.1,
      0.46 * pw,
      0.13 * pw,
      0.02,
      0.2,
      f.t,
      0.3,
      f.drag * 0.9,
      inkU(4.5),
      8,
    );
    flag(
      c,
      pm,
      FR_PLUME,
      0.03,
      0.3,
      3.2,
      0.8,
      0.32 * pw,
      0.1 * pw,
      0.02,
      0.18,
      f.t,
      1.4,
      f.drag * 0.9,
      inkU(4),
      7,
    );
    const tail = m.crimson;
    flag(
      c,
      tail,
      FR_PLUME,
      -0.12,
      0.06,
      3.7,
      0.5,
      0.36,
      0.09,
      0.03,
      0.22,
      f.t,
      0.7,
      f.drag,
      inkU(4),
      7,
    );
    refIn(c, 0, 0);
    bareHead(c, m, lod, f.t);
    if (lod > 0) {
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(54, 0, 2, 0, Math.PI * 2);
      c.fill();
    }
    // Gold hoop in the ear.
    c.lineWidth = inkR(5.5);
    c.strokeStyle = '#0e1118';
    c.stroke(EARRING);
    c.lineWidth = inkR(3);
    c.strokeStyle = m.brass.at(0);
    c.stroke(EARRING);
    // Turban: crimson wraps, a teal band, a jewel and a brass finial for the plume.
    paint(c, FINIAL, m.brass, inkR(4), true);
    paint(c, TURBAN, m.crimson, inkR(6), true);
    paint(c, PUFF, m.crimson, inkR(5), true);
    if (lod > 0) {
      seam(c, WRAP1, inkR(4.5), 0.75);
      seam(c, WRAP2, inkR(4.5), 0.65);
      seam(c, WRAP3, inkR(4), 0.6);
      streak(c, WRAP_HI, inkR(5), 0.4);
    }
    band(c, HAT_BAND, HAT_BAND_FR, m.teal, inkR(20), 13);
    if (lod > 0) {
      band(c, HAT_BAND, HAT_BAND_FR, m.brass, inkR(5), 3);
    }
    paint(c, KNOT, m.crimson, inkR(4.5));
    paint(c, JEWEL, m.brass, inkR(4));
    if (lod > 0) {
      c.fillStyle = f.acc.at(0);
      c.beginPath();
      c.arc(70, -40, 5, 0, Math.PI * 2);
      c.fill();
    }
    if (lod > 0) glint(c, 62, -88, 12, 0.5 + 0.4 * Math.sin(f.t * 2.9));
    refOut(c);
    c.restore();
  },

  pad(f, far) {
    const c = f.ctx;
    const m = mats(f);
    const lod = K.lod;
    const kk = [1.02, 1.2, 1.36][f.cls] as number;
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
    c.rotate(-swing * 0.6);
    c.scale(kk, kk);
    refIn(c, 0, 0);
    if (far) {
      paint(c, LAMES[1] as Shape, m.steelFar, inkR(5));
    } else {
      if (lod === 0) {
        paint(c, LAMES[0] as Shape, m.steel, inkR(5));
        paint(c, LAMES[2] as Shape, m.steel, inkR(5));
      } else {
        for (let i = 0; i < 3; i++) paint(c, LAMES[i] as Shape, m.steel, inkR(5));
        streak(c, PAULDRON_HI, inkR(4.5), 0.6);
      }
      paint(c, PAULDRON_STUD, m.brass, inkR(3.5), true);
    }
    refOut(c);
    c.restore();
  },

  fore(f, far) {
    const c = f.ctx;
    const m = mats(f);
    const r = 0.048 * (f.g > 1 ? 1.1 : f.g < 1 ? 0.92 : 1);
    refIn(c, 0, 0);
    paint(c, BRACER, far ? m.steelFar : m.steel, inkR(5));
    if (K.lod > 0) streak(c, BRACER_HI, inkR(3.5), 0.5);
    paint(c, BRACER_BANDS, m.brass, inkR(4), true);
    rivets(c, BRACER_RIVETS, inkR(1.5));
    refOut(c);
    joint(c, far ? m.steelFar : m.steel, m.brass, 0, 0, r, inkU(5));
  },

  hand(f, far) {
    const c = f.ctx;
    const m = mats(f);
    c.save();
    c.scale(0.55 + f.g * 0.45, 1);
    refIn(c, 0, 2);
    paint(c, GLOVE, far ? m.leatherFar : m.leather, inkR(5));
    if (K.lod > 0) {
      seam(c, GLOVE_LINES, inkR(3), 0.7);
      streak(c, GLOVE_HI, inkR(3), 0.35);
    }
    paint(c, CUFF, m.brass, inkR(4), true);
    refOut(c);
    c.restore();
  },

  shin(f, far) {
    const c = f.ctx;
    const m = mats(f);
    const r = 0.066 * f.g;
    c.save();
    c.scale(f.g, 1);
    refIn(c, 0, 0);
    // Gathered trouser cuff and a greave on the front of the shin.
    if (!far && K.lod > 0) {
      paint(c, GREAVE, m.steel, inkR(5));
      streak(c, GREAVE_HI, inkR(3.5), 0.5);
      c.lineWidth = inkR(5);
      c.strokeStyle = '#0e1118';
      c.stroke(SHIN_BAND);
      c.lineWidth = inkR(2.8);
      c.strokeStyle = m.brass.at(0);
      c.stroke(SHIN_BAND);
    }
    paint(c, KNEE_BAND, m.brass, inkR(4.5), true);
    rivets(c, KNEE_RIVETS, inkR(1.5));
    refOut(c);
    c.restore();
    joint(c, far ? m.steelFar : m.steel, m.brass, 0.02, 0, r * 0.9, inkU(5));
  },

  boot(f, far) {
    const c = f.ctx;
    const m = mats(f);
    c.save();
    c.scale(f.g, 1);
    refIn(c, 0, 0);
    paint(c, BOOT, far ? m.leatherFar : m.leather, inkR(5.5), true);
    paint(c, BOOT_TIP, m.brass, inkR(3.5), true);
    if (K.lod > 0) seam(c, BOOT_SEAM, inkR(3), 0.55);
    paint(c, ANKLE, m.brass, inkR(4), true);
    refOut(c);
    c.restore();
  },

  over(f) {
    // Steam from the whistle on the pack, drifting back with the stride.
    const c = f.ctx;
    const n = K.lod === 0 ? 2 : K.lod === 1 ? 3 : 4;
    c.save();
    c.translate(0, 0.96);
    c.rotate(f.pose.lean);
    c.scale(f.g, 1);
    for (let i = 0; i < n; i++) {
      const ph = (f.t * 0.6 + i / n) % 1;
      const x = VENT_X - ph * 0.22 - f.drag * 0.18 * ph + Math.sin(f.t * 2 + i * 2) * 0.012;
      const y = VENT_Y + ph * 0.42;
      const r = 0.04 + ph * 0.12;
      glow(c, 'steam', x, y, r, r, Math.min(1, (1 - ph) * 1.4) * 0.9);
    }
    c.restore();
  },
};

const FR_TAIL = new Frame(0, 0.15, 0, -0.3);
