import { MELEE_GUARD } from '../../render/Armatura';
import type { Pose } from '../contract';
import {
  BASE,
  HI,
  OW,
  SHADE,
  blob,
  ell,
  fillBlob,
  fillEll,
  fillPoly,
  limb,
  line,
  poly,
  ribbon,
  sw,
  trace,
} from './kit';
import type { Ctx, Swatch } from './kit';
import type { Build, F, LimbStyle, Look, Palette, PersonLook, PropKind } from './types';

/**
 * Plain people for the story diorama: the same side-view rig and `Pose` joints as the armaturas,
 * but drawn as civilians (no plates, no weapons). A `PersonLook` (skin, hair, build, outfit,
 * headwear, a small prop) is turned into a `Look`, so the rig needs no special cases beyond a
 * scale and skipping the weapon. Figure-local space as in kit.ts: feet at the origin, +x forward.
 */

/** People are a little smaller than an armatura. */
export const PERSON_SCALE = 0.93;
/** Leg length relative to an armatura's. */
export const PERSON_LEGS = 0.86;
export const PERSON_GIRTH: Record<Build, number> = {
  slim: 0.92,
  average: 1,
  broad: 1.12,
  stout: 1.08,
};
const BELLY: Record<Build, number> = { slim: 0, average: 0, broad: 0.012, stout: 0.07 };
const HEAD_SCALE = 1.6;
const ARM = 0.95;
const LEG = 0.98;
/** Side-view body depth: people read better a little chunkier than the armatura frames. */
const DEPTH = 1.3;

/** The relaxed standing pose (arms hang loose, a hint of weight on one leg). */
export function personPose(p: PersonLook): Pose {
  const base: Pose = {
    ...MELEE_GUARD,
    lean: 0.02,
    sR: 0.1,
    eR: 0.22,
    wR: 0,
    sL: -0.1,
    eL: 0.2,
    hR: 0.05,
    kR: -0.04,
    hL: -0.07,
    kL: -0.05,
  };
  if (p.outfit.emblem) return { ...base, sR: -0.14, eR: 0.3, sL: -0.2, eL: 0.2 };
  switch (p.prop) {
    case 'book':
      return { ...base, sR: 0.4, eR: 1.25, sL: 0.3, eL: 1.0 };
    case 'lantern':
      return { ...base, sR: 0.45, eR: 0.7 };
    case 'wrench':
      return { ...base, sR: 0.4, eR: 1.1, wR: -0.2 };
    case 'quill':
      return { ...base, sR: 0.5, eR: 1.1 };
    case 'banner':
      return { ...base, sR: 0.4, eR: 0.7 };
    case 'scroll':
      return { ...base, sR: 0.4, eR: 1.0 };
    case 'tool':
      return { ...base, sR: 0.25, eR: 0.55 };
    default:
      return base;
  }
}

// ── Shapes ────────────────────────────────────────────────────

const SKULL = [
  -0.12, 0.02, -0.1, 0.11, 0.0, 0.145, 0.09, 0.11, 0.125, 0.0, 0.12, -0.07, 0.08, -0.12, 0.0,
  -0.135, -0.09, -0.09,
];
const NOSE = [0.11, 0.015, 0.165, -0.035, 0.12, -0.05];
const FOOT = [-0.07, 0.07, 0.06, 0.07, 0.1, 0.0, 0.2, -0.015, 0.235, -0.065, -0.06, -0.065];
const HAIR_CAP = [
  -0.14, -0.07, -0.145, 0.06, -0.09, 0.15, 0.0, 0.178, 0.09, 0.155, 0.13, 0.09, 0.118, 0.055, 0.07,
  0.1, 0.0, 0.085, -0.06, 0.03, -0.08, -0.04,
];

/** Hip-frame skirt lengths and flare by garment. */
const SKIRTS: Record<string, { len: number; flare: number }> = {
  tunic: { len: 0.26, flare: 0.03 },
  doublet: { len: 0.12, flare: 0.015 },
  vest: { len: 0.16, flare: 0.02 },
  apron: { len: 0.28, flare: 0.03 },
  coat: { len: 0.5, flare: 0.06 },
  robe: { len: 0.8, flare: 0.1 },
  dress: { len: 0.78, flare: 0.09 },
  skirt: { len: 0.74, flare: 0.08 },
};

/** The eight-pointed cross of the Order (original vector): four arms with notched ends. */
function crossPts(cx: number, cy: number, R: number): number[] {
  const out: number[] = [];
  const w = 0.44 * R;
  const n = 0.72 * R;
  const r = 0.27 * R;
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + Math.PI / 2;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const lx = -dy;
    const ly = dx;
    const ia = a - Math.PI / 4;
    out.push(cx + Math.cos(ia) * r, cy + Math.sin(ia) * r);
    out.push(cx + dx * R - lx * w, cy + dy * R - ly * w);
    out.push(cx + dx * n, cy + dy * n);
    out.push(cx + dx * R + lx * w, cy + dy * R + ly * w);
  }
  return out;
}

const alpha = (c: Ctx, a: number, fn: () => void): void => {
  c.globalAlpha = a;
  fn();
  c.globalAlpha = 1;
};

// ── Look factory ──────────────────────────────────────────────

const CACHE = new WeakMap<PersonLook, Look>();

/** The painter set for a person (cached per look). */
export function personLookFor(p: PersonLook): Look {
  let l = CACHE.get(p);
  if (!l) {
    l = buildLook(p);
    CACHE.set(p, l);
  }
  return l;
}

function buildLook(p: PersonLook): Look {
  const o = p.outfit;
  const sleeveColor = o.sleeve ?? (o.kind === 'vest' ? o.under : o.main);
  const pal: Palette = {
    cloth: sw(o.main),
    armour: sw(sleeveColor),
    trim: sw(o.trim),
    skin: sw(p.skin),
    dark: sw(p.hair),
    hat: sw(p.headwear?.color ?? p.hair),
    leather: sw(p.shoes.color),
    metal: sw('#c9ccd4'),
    wood: sw(o.legs),
  };
  const sleeves = o.sleeves ?? 'long';
  const hairSw = pal.dark;
  const facial = p.facial ? sw(p.facial) : hairSw;
  const under = sw(o.under);
  const belt = sw(p.belt);
  const skirtSw = sw(o.kind === 'skirt' || o.kind === 'apron' ? (o.skirt ?? o.legs) : o.main);
  const fur = o.fur ? sw(o.fur) : null;
  const sash = p.sash ? sw(p.sash) : null;
  const cloak = p.cloak ? sw(p.cloak) : null;
  const hatTrim = sw(p.headwear?.trim ?? o.trim);
  const ink = sw('#2a1a1a');
  const white = sw('#fbf6e8');
  const lips = sw(p.lips ?? '#8a4a3a');
  const charm = p.charm ? sw(p.charm) : null;
  const collar = o.collar ? sw(o.collar) : null;
  const belly = BELLY[p.build];
  const skirtInfo = SKIRTS[o.kind] ?? { len: 0.2, flare: 0.02 };
  const long = o.kind === 'robe' || o.kind === 'dress' || o.kind === 'skirt';
  const beard = p.beard ?? 'none';

  const torsoPts = (): number[] => [
    -0.09,
    0.0,
    0.1,
    0.0,
    0.12 + belly,
    0.14,
    0.15 + belly * 0.8,
    0.34,
    0.11,
    0.55,
    0.04,
    0.62,
    -0.05,
    0.62,
    -0.13,
    0.54,
    -0.15,
    0.36,
    -0.11,
    0.1,
  ];
  const TORSO = torsoPts();
  const EMBLEM = o.emblem ? crossPts(0, 0, 0.115) : [];

  const limbs = (): LimbStyle => ({
    upper: sleeves === 'bare' ? 'skin' : 'armour',
    fore: sleeves === 'long' ? 'armour' : 'skin',
    thigh: 'wood',
    shin: 'wood',
    arm: ARM,
    leg: LEG,
  });

  // ── back: cloak and the folded hood ──
  const back = (f: F): void => {
    const c = f.ctx;
    if (cloak)
      ribbon(
        c,
        cloak,
        -0.1,
        0.56,
        Math.PI * 1.46,
        0.78,
        0.2,
        0.3,
        0.05,
        f.t * 0.5,
        0.4,
        f.drag,
        0.04,
      );
    if (p.headwear?.kind === 'hood') {
      // A hood folded down on the shoulders behind the neck.
      c.save();
      c.translate(0.0, 0.62);
      blob(
        c,
        f.p.cloth,
        [-0.02, 0.05, -0.12, 0.03, -0.2, -0.06, -0.15, -0.16, -0.04, -0.13, 0.04, -0.04],
        0.03,
      );
      c.restore();
    }
  };

  // ── torso ──
  const torso = (f: F): void => {
    const c = f.ctx;
    const g = f.g * DEPTH;
    c.save();
    c.scale(g, 1);
    blob(c, f.p.cloth, TORSO, 0.05);
    if (o.kind === 'vest' || o.kind === 'doublet') {
      // The shirt shows at the open front.
      fillPoly(c, under, BASE, [
        0.06,
        0.6,
        0.09,
        0.52,
        0.12 + belly,
        0.34,
        0.1 + belly * 0.7,
        0.14,
        0.078,
        0.14,
        0.09,
        0.34,
        0.07,
        0.5,
      ]);
    }
    if (o.band) {
      fillPoly(c, f.p.trim, BASE, [0.07, 0.6, 0.095, 0.6, 0.12 + belly, 0.14, 0.098 + belly, 0.14]);
    }
    if (EMBLEM.length) {
      c.save();
      c.translate(0.07, 0.36);
      poly(c, f.p.trim, EMBLEM, 0.012, OW * 0.45);
      c.restore();
    }
    c.restore();
    // Shoulder cloth line and collars sit round the neck.
    if (fur) {
      c.save();
      c.translate(0.0, 0.6);
      blob(
        c,
        fur,
        [
          -0.17 * g,
          0.0,
          -0.1 * g,
          0.1,
          0.06 * g,
          0.12,
          0.17 * g,
          0.03,
          0.2 * g,
          -0.1,
          0.1 * g,
          -0.12,
          -0.08 * g,
          -0.1,
        ],
        0.04,
      );
      c.restore();
    } else if (collar) {
      c.save();
      c.translate(0.0, 0.6);
      blob(
        c,
        collar,
        [
          -0.13 * g,
          0.0,
          -0.06 * g,
          0.075,
          0.07 * g,
          0.075,
          0.14 * g,
          0.0,
          0.1 * g,
          -0.06,
          -0.08 * g,
          -0.06,
        ],
        0.03,
      );
      c.restore();
    }
    if (!fur && beard !== 'long' && beard !== 'full') {
      // The side colour as a neckerchief.
      c.save();
      c.translate(0.0, 0.6);
      blob(
        c,
        f.acc,
        [
          -0.1 * g,
          0.0,
          -0.04 * g,
          0.05,
          0.07 * g,
          0.05,
          0.12 * g,
          0.0,
          0.09 * g,
          -0.09,
          0.02,
          -0.12,
          -0.06 * g,
          -0.07,
        ],
        0.03,
        OW * 0.8,
      );
      c.restore();
    }
    if (charm) {
      c.save();
      c.translate(0.1 * g, 0.4);
      line(c, charm, SHADE, 0.012, -0.03, 0.2, 0.0, 0.0);
      ell(c, charm, 0.0, -0.02, 0.026, 0.034, 0, 0.012, OW * 0.6);
      c.restore();
    }
  };

  // ── skirt (hip frame): hem, belt, sash and the side-colour tail ──
  const skirt = (f: F): void => {
    const c = f.ctx;
    const g = f.g * DEPTH;
    const { len, flare } = skirtInfo;
    const fl = flare + len * 0.1;
    const swing = (f.pose.hR - f.pose.hL) * 0.09 + f.drag * 0.05;
    const front = 0.14 * g + belly;
    const bk = 0.115 * g;
    const sway = Math.sin(f.t * 1.7) * 0.004;
    const hemFront = front + fl + swing + sway;
    const hemBack = bk + fl - swing * 0.6;
    const bottom = -len;
    const sk = long ? skirtSw : o.kind === 'apron' ? f.p.cloth : f.p.cloth;
    const body = o.kind === 'skirt' ? skirtSw : sk;
    poly(
      c,
      body,
      [
        -bk,
        0.1,
        front,
        0.1,
        hemFront,
        bottom,
        hemFront * 0.4,
        bottom - 0.03,
        -hemBack * 0.4,
        bottom - 0.03,
        -hemBack,
        bottom,
      ],
      0.045,
    );
    if (o.kind === 'coat') {
      // Open front of a long coat: the shirt colour and the skirts' split.
      fillPoly(c, under, BASE, [
        front - 0.05,
        0.1,
        front - 0.025,
        0.1,
        hemFront - 0.01,
        bottom,
        hemFront - 0.07,
        bottom,
      ]);
    }
    if (o.band && len > 0.3) {
      fillPoly(c, f.p.trim, BASE, [
        front - 0.075,
        0.1,
        front - 0.045,
        0.1,
        hemFront - 0.045,
        bottom,
        hemFront - 0.085,
        bottom,
      ]);
    }
    if (fur && len > 0.3) {
      // Shaggy fur hem.
      const z: number[] = [];
      const n = 9;
      const x0 = -hemBack;
      const x1 = hemFront;
      for (let i = 0; i <= n; i++)
        z.push(x0 + ((x1 - x0) * i) / n, bottom + (i % 2 ? -0.04 : 0.025));
      for (let i = n; i >= 0; i--)
        z.push(x0 + ((x1 - x0) * i) / n, bottom + 0.1 + (i % 2 ? 0 : 0.02));
      poly(c, fur, z, 0.025, OW * 0.8);
    } else if (len > 0.3) {
      line(
        c,
        f.p.trim,
        BASE,
        0.022,
        -hemBack * 0.9,
        bottom + 0.035,
        hemFront * 0.9,
        bottom + 0.035,
      );
    }
    if (o.kind === 'apron') {
      const a = sw(o.skirt ?? '#6a4a30');
      poly(
        c,
        a,
        [
          0.03 * g,
          0.56,
          front + 0.02,
          0.5,
          front + 0.04,
          0.2,
          front + 0.07 + fl,
          -0.46,
          0.04 * g,
          -0.48,
        ],
        0.04,
      );
      // chest pocket
      fillPoly(c, a, SHADE, [0.07, 0.36, 0.15 * g, 0.34, 0.15 * g, 0.24, 0.07, 0.25]);
      line(c, a, HI, 0.01, 0.07, 0.36, 0.15 * g, 0.34);
    }
    // belt
    poly(c, belt, [-bk, 0.03, front, 0.03, front, 0.1, -bk, 0.1], 0.015, OW * 0.8);
    if (sash) {
      // A wide wrapped sash with a loose end.
      poly(
        c,
        sash,
        [-bk - 0.01, -0.03, front + 0.015, -0.03, front + 0.01, 0.15, -bk - 0.01, 0.15],
        0.03,
        OW * 0.85,
      );
      line(c, sash, SHADE, 0.012, -bk, 0.0, front, 0.06);
      line(c, sash, SHADE, 0.012, -bk, 0.06, front, 0.12);
      ribbon(
        c,
        sash,
        front - 0.03,
        0.04,
        Math.PI * 1.56,
        0.34,
        0.1,
        0.12,
        0.08,
        f.t * 0.6,
        1.1,
        f.drag,
        0.03,
        OW * 0.8,
        4,
      );
    } else {
      // No sash of their own: the side colour is the sash.
      poly(
        c,
        f.acc,
        [-bk - 0.01, -0.01, front + 0.012, -0.01, front + 0.008, 0.14, -bk - 0.01, 0.14],
        0.03,
        OW * 0.85,
      );
      line(c, f.acc, SHADE, 0.011, -bk, 0.03, front, 0.1);
    }
    // The side colour: a knotted swallow-tail on the back hip.
    const sw3 = Math.sin(f.t * 1.9) * 0.012 - f.drag * 0.05 - swing * 0.4;
    const x0 = -bk + 0.01;
    poly(
      c,
      f.acc,
      [
        x0,
        0.1,
        x0 + 0.12,
        0.1,
        x0 + 0.13 + sw3,
        -0.22,
        x0 + 0.075 + sw3,
        -0.17,
        x0 + 0.01 + sw3,
        -0.25,
      ],
      0.03,
      OW * 0.8,
    );
  };

  // ── head ──
  const hw = p.headwear;
  const head = (f: F): void => {
    const c = f.ctx;
    const t = f.t;
    const kind = hw?.kind ?? 'none';

    // behind the skull
    if (kind === 'veil') {
      blob(
        c,
        f.p.hat,
        [
          0.02, 0.2, -0.13, 0.15, -0.21, -0.02, -0.27, -0.32, -0.12, -0.46, 0.08, -0.4, 0.12, -0.24,
          0.07, -0.1,
        ],
        0.04,
      );
    }
    if (p.hairStyle === 'long' || p.hairStyle === 'bob') {
      const bottom = p.hairStyle === 'long' ? -0.34 : -0.14;
      blob(
        c,
        hairSw,
        [
          0.0,
          0.17,
          -0.11,
          0.14,
          -0.17,
          0.02,
          -0.2,
          bottom * 0.6,
          -0.19,
          bottom,
          -0.08,
          bottom + 0.03,
          -0.03,
          bottom * 0.5,
          0.02,
          -0.04,
        ],
        0.04,
      );
    }
    if (p.hairStyle === 'tied') {
      const sw2 = Math.sin(t * 2 - 1) * 0.015 + f.drag * -0.04;
      blob(
        c,
        hairSw,
        [
          -0.1,
          0.03,
          -0.2,
          0.01,
          -0.26 + sw2,
          -0.14,
          -0.22 + sw2,
          -0.27,
          -0.16 + sw2,
          -0.15,
          -0.12,
          -0.04,
        ],
        0.035,
      );
      fillEll(c, hairSw, SHADE, -0.19, 0.0, 0.035, 0.03, 0.3);
    }
    if (kind === 'bork') {
      // The long felt flap that hangs behind the neck.
      blob(
        c,
        f.p.hat,
        [-0.1, 0.2, -0.18, 0.14, -0.22, -0.1, -0.19, -0.3, -0.09, -0.28, -0.06, -0.1],
        0.04,
      );
    }
    if (kind === 'scarf') {
      // knot and tails
      ribbon(
        c,
        f.p.hat,
        -0.14,
        -0.02,
        Math.PI * 1.32,
        0.15,
        0.06,
        0.08,
        0.15,
        t * 0.6,
        0.2,
        f.drag,
        0.03,
        OW * 0.8,
        4,
      );
    }

    // neck, skull, ear
    line(c, f.p.skin, SHADE, 0.1, 0, -0.1, 0, -0.2);
    blob(c, f.p.skin, SKULL, 0.035);
    ell(c, f.p.skin, -0.035, -0.015, 0.022, 0.032, 0, 0.01, OW * 0.5);
    if (p.earring) fillEll(c, sw(p.earring), BASE, -0.03, -0.065, 0.014, 0.014);
    if (p.blush) alpha(c, 0.45, () => fillEll(c, sw('#e0705a'), BASE, 0.07, -0.04, 0.03, 0.022));

    // beard
    const bs = beard;
    if (bs === 'stubble') {
      alpha(c, 0.4, () =>
        fillBlob(
          c,
          facial,
          BASE,
          [
            -0.1, -0.02, -0.09, -0.09, -0.02, -0.14, 0.06, -0.14, 0.12, -0.09, 0.123, -0.04, 0.08,
            -0.05, 0.0, -0.09, -0.06, -0.06,
          ],
        ),
      );
    } else if (bs === 'short') {
      blob(
        c,
        facial,
        [
          -0.11, 0.0, -0.1, -0.1, -0.03, -0.17, 0.06, -0.17, 0.125, -0.11, 0.135, -0.04, 0.09,
          -0.055, 0.03, -0.1, -0.03, -0.09, -0.08, -0.04,
        ],
        0.025,
        OW * 0.8,
      );
    } else if (bs === 'full' || bs === 'long') {
      const d = bs === 'long' ? -0.38 : -0.27;
      blob(
        c,
        facial,
        [
          -0.115,
          0.0,
          -0.11,
          -0.1,
          -0.06,
          d + 0.1,
          0.02,
          d,
          0.1,
          d + 0.08,
          0.14,
          -0.1,
          0.14,
          -0.04,
          0.095,
          -0.05,
          0.03,
          -0.11,
          -0.03,
          -0.1,
          -0.08,
          -0.04,
        ],
        0.03,
        OW * 0.8,
      );
    }
    blob(c, f.p.skin, NOSE, 0.01, OW * 0.8);

    // moustache
    const m = p.moustache;
    if (m === 'thin') trace(c, facial, BASE, 0.022, [0.06, -0.045, 0.11, -0.04, 0.145, -0.055]);
    else if (m === 'full')
      blob(
        c,
        facial,
        [0.04, -0.04, 0.09, -0.025, 0.15, -0.045, 0.16, -0.085, 0.11, -0.07, 0.05, -0.07],
        0.012,
        OW * 0.7,
      );
    else if (m === 'handlebar')
      blob(
        c,
        facial,
        [0.02, -0.035, 0.1, -0.02, 0.17, -0.045, 0.2, -0.1, 0.16, -0.12, 0.13, -0.075, 0.07, -0.07],
        0.012,
        OW * 0.7,
      );

    // eye, brow, mouth
    fillEll(c, ink, BASE, 0.078, 0.02, 0.014, 0.023);
    fillEll(c, white, BASE, 0.083, 0.03, 0.005, 0.007);
    line(c, hairSw, 3, 0.017, 0.05, 0.066, 0.115, 0.054);
    if (!m) line(c, p.lips ? lips : ink, BASE, 0.011, 0.075, -0.082, 0.118, -0.074);
    else line(c, ink, BASE, 0.01, 0.08, -0.092, 0.115, -0.086);

    // hair cap in front of the skull
    switch (p.hairStyle) {
      case 'bald':
        break;
      case 'curly': {
        const pts: number[] = [];
        const N = 11;
        for (let i = 0; i < N; i++) {
          const a = (200 - (i * 190) / (N - 1)) * (Math.PI / 180);
          const r = i % 2 ? 0.18 : 0.15;
          pts.push(Math.cos(a) * r * 0.95 - 0.005, 0.03 + Math.sin(a) * r);
        }
        pts.push(0.07, 0.1, 0.0, 0.09, -0.06, 0.04, -0.075, -0.03);
        blob(c, hairSw, pts, 0.04, OW * 0.7);
        break;
      }
      case 'messy': {
        poly(
          c,
          hairSw,
          [
            -0.14, -0.07, -0.15, 0.07, -0.13, 0.16, -0.07, 0.15, -0.05, 0.22, 0.0, 0.17, 0.05, 0.23,
            0.08, 0.16, 0.13, 0.17, 0.125, 0.09, 0.118, 0.055, 0.07, 0.1, 0.0, 0.085, -0.06, 0.03,
            -0.08, -0.04,
          ],
          0.035,
          OW * 0.7,
        );
        break;
      }
      case 'bun':
        ell(c, hairSw, -0.13, 0.12, 0.06, 0.06, 0, 0.025, OW);
        blob(c, hairSw, HAIR_CAP, 0.04, OW * 0.6);
        break;
      default:
        blob(c, hairSw, HAIR_CAP, 0.04, OW * 0.6);
    }

    // headwear
    const col = f.p.hat;
    switch (kind) {
      case 'cap':
        blob(
          c,
          col,
          [
            -0.145, -0.02, -0.15, 0.1, -0.07, 0.2, 0.05, 0.21, 0.13, 0.14, 0.14, 0.08, 0.0, 0.1,
            -0.1, 0.03,
          ],
          0.04,
        );
        line(c, hatTrim, BASE, 0.03, -0.14, 0.04, 0.13, 0.085);
        break;
      case 'flatcap': {
        ell(c, col, -0.01, 0.17, 0.17, 0.065, -0.12, 0.035);
        line(c, hatTrim, BASE, 0.02, -0.15, 0.13, 0.12, 0.15);
        if (hw?.plume) {
          hw.plume.forEach((pc, i) =>
            ribbon(
              c,
              sw(pc),
              -0.06,
              0.2,
              Math.PI * (0.66 + i * 0.12),
              0.2,
              0.05,
              0.08,
              0.12,
              t * 0.7,
              i,
              f.drag,
              0.03,
              OW * 0.8,
              4,
            ),
          );
        }
        break;
      }
      case 'straw': {
        ell(c, col, 0.01, 0.1, 0.3, 0.06, -0.06, 0.04);
        blob(
          c,
          col,
          [-0.13, 0.1, -0.12, 0.2, -0.04, 0.27, 0.06, 0.27, 0.13, 0.2, 0.14, 0.1, 0.0, 0.07],
          0.04,
        );
        line(c, hatTrim, BASE, 0.04, -0.125, 0.125, 0.135, 0.125);
        break;
      }
      case 'scarf': {
        blob(
          c,
          col,
          [
            -0.155, -0.12, -0.17, 0.05, -0.1, 0.17, 0.02, 0.2, 0.11, 0.15, 0.135, 0.07, 0.125, 0.0,
            0.07, 0.07, -0.0, 0.07, -0.07, -0.02, -0.075, -0.1,
          ],
          0.04,
          OW * 0.7,
        );
        fillEll(c, col, SHADE, -0.15, -0.01, 0.04, 0.035);
        break;
      }
      case 'veil': {
        blob(
          c,
          col,
          [
            -0.155, -0.05, -0.17, 0.07, -0.1, 0.18, 0.02, 0.215, 0.11, 0.16, 0.14, 0.08, 0.12, 0.02,
            0.07, 0.08, 0.0, 0.09, -0.07, 0.0, -0.09, -0.06,
          ],
          0.045,
        );
        break;
      }
      case 'turban': {
        const tall = hw?.tall ? 0.02 : 0;
        if (hw?.trim) ell(c, hatTrim, 0.0, 0.15 + tall, 0.14, 0.1 + tall, 0, 0.03);
        ell(c, col, 0.005, 0.1, 0.205, 0.08, 0, 0.04);
        ell(c, col, 0.0, 0.165 + tall, 0.172, 0.105 + tall, -0.08, 0.04);
        trace(c, col, SHADE, 0.013, [-0.15, 0.12, -0.03, 0.22 + tall, 0.1, 0.2 + tall, 0.16, 0.13]);
        trace(c, col, SHADE, 0.012, [-0.19, 0.09, -0.04, 0.16, 0.12, 0.14, 0.19, 0.09]);
        if (hw?.trim) line(c, hatTrim, BASE, 0.02, -0.16, 0.06, 0.18, 0.09);
        if (hw?.gem) ell(c, sw(hw.gem), 0.1, 0.19 + tall, 0.032, 0.032, 0, 0.012, OW * 0.7);
        if (hw?.plume) {
          hw.plume.forEach((pc, i, a) =>
            ribbon(
              c,
              sw(pc),
              0.06,
              0.24 + tall,
              Math.PI * (0.62 + (i / Math.max(1, a.length - 1)) * 0.3),
              0.17,
              0.045,
              0.08,
              0.1,
              t * 0.7,
              i * 1.3,
              f.drag,
              0.03,
              OW * 0.8,
              4,
            ),
          );
        }
        break;
      }
      case 'bork': {
        poly(c, col, [-0.14, 0.08, 0.15, 0.1, 0.13, 0.2, 0.1, 0.31, -0.1, 0.31, -0.12, 0.2], 0.045);
        line(c, hatTrim, BASE, 0.03, -0.14, 0.095, 0.15, 0.115);
        ell(c, sw(hw?.gem ?? '#d8b24a'), 0.12, 0.16, 0.03, 0.045, 0.1, 0.012, OW * 0.7);
        break;
      }
      case 'hood':
        // folded behind the neck (drawn in `back`)
        break;
      case 'band':
      case 'goggles': {
        trace(
          c,
          col,
          BASE,
          0.045,
          [-0.135, 0.01, -0.13, 0.1, -0.02, 0.135, 0.07, 0.125, 0.122, 0.08],
        );
        trace(
          c,
          col,
          SHADE,
          0.012,
          [-0.135, 0.03, -0.12, 0.1, -0.02, 0.135, 0.07, 0.125, 0.122, 0.08],
        );
        if (kind === 'goggles') {
          ell(c, sw('#d2a64e'), 0.06, 0.13, 0.065, 0.065, 0, 0.02, OW);
          ell(c, sw('#8fe0ee'), 0.064, 0.134, 0.042, 0.042, 0, 0.03, OW * 0.5);
          fillEll(c, white, BASE, 0.05, 0.15, 0.012, 0.012);
        } else {
          ribbon(
            c,
            col,
            -0.13,
            0.04,
            Math.PI * 1.3,
            0.14,
            0.045,
            0.055,
            0.15,
            t * 0.6,
            0.6,
            f.drag,
            0.03,
            OW * 0.7,
            4,
          );
        }
        break;
      }
      default:
        break;
    }
  };

  // ── arms and hands ──
  const pad = (f: F, far: boolean): void => {
    void far;
    const r = 0.078 * f.g * ARM + 0.012;
    poly(f.ctx, f.acc, [-r, -0.12, r, -0.12, r, -0.19, -r, -0.19], 0.02, OW * 0.8);
  };
  const fore = (f: F, far: boolean): void => {
    void far;
    const c = f.ctx;
    const r = 0.066 * f.g * ARM;
    if (sleeves === 'rolled') ell(c, pal.armour, 0, -0.035, r * 1.25, 0.045, 0, 0.02, OW * 0.9);
    else if (sleeves === 'long' && (o.band || o.kind === 'robe' || o.kind === 'coat'))
      poly(
        c,
        f.p.trim,
        [-r - 0.008, -0.23, r + 0.008, -0.23, r + 0.008, -0.275, -r - 0.008, -0.275],
        0.015,
        OW * 0.7,
      );
  };
  const hand = (f: F, far: boolean): void => {
    const c = f.ctx;
    const r = 0.052 * f.g;
    ell(c, f.p.skin, 0.0, -0.025, r, r * 1.1, 0, 0.02, OW * 0.9);
    if (!far && p.prop) drawProp(f, p.prop, belt);
  };
  const shin = (f: F): void => {
    if (p.shoes.kind !== 'boots') return;
    const c = f.ctx;
    const rs = 0.084 * f.g * LEG;
    const L = 0.48 * PERSON_LEGS;
    limb(c, f.p.leather, 0, -L * 0.34, 0, -L * 0.98, rs * 1.16, rs * 1.02, 0.025, OW * 0.9);
    line(c, f.p.leather, HI, 0.016, -rs, -L * 0.36, rs, -L * 0.36);
  };
  const boot = (f: F): void => {
    const c = f.ctx;
    c.save();
    c.scale(0.92 * f.g, 0.95);
    if (p.shoes.kind === 'sandals') {
      poly(c, f.p.skin, FOOT, 0.02);
      line(c, f.p.leather, BASE, 0.02, 0.0, 0.03, 0.12, -0.02);
    } else poly(c, f.p.leather, FOOT, 0.02);
    c.restore();
  };

  return {
    model: 'militia',
    limbs,
    back,
    torso,
    skirt,
    head,
    pad,
    fore,
    hand,
    shin,
    boot,
    palette: pal,
    headScale: HEAD_SCALE,
  };
}

// ── Props ─────────────────────────────────────────────────────

/**
 * A small thing in the hand. Drawn in the wrist frame; `wAng` turns it back to world axes so a
 * lantern hangs and a banner stands whatever the arm does.
 */
function drawProp(f: F, kind: PropKind, belt: Swatch): void {
  const c = f.ctx;
  const t = f.t;
  const wood = f.p.wood;
  const metal = f.p.metal;
  c.save();
  // wAng is the arm angle from straight down; counter-rotate to world axes.
  c.rotate(-f.wAng);
  switch (kind) {
    case 'lantern': {
      line(c, metal, BASE, 0.012, 0.0, 0.0, 0.0, -0.1);
      c.translate(0, -0.1);
      poly(c, metal, [-0.05, 0.0, 0.05, 0.0, 0.045, -0.03, -0.045, -0.03], 0.01, OW * 0.7);
      poly(
        c,
        sw('#f4c96a'),
        [-0.042, -0.03, 0.042, -0.03, 0.05, -0.14, -0.05, -0.14],
        0.05,
        OW * 0.8,
      );
      poly(c, metal, [-0.055, -0.14, 0.055, -0.14, 0.04, -0.17, -0.04, -0.17], 0.01, OW * 0.7);
      break;
    }
    case 'book': {
      c.rotate(0.35);
      poly(c, f.p.leather, [-0.02, -0.02, 0.2, -0.02, 0.2, 0.2, -0.02, 0.2], 0.03, OW);
      fillPoly(c, sw('#efe4c4'), BASE, [0.19, -0.015, 0.21, -0.015, 0.21, 0.195, 0.19, 0.195]);
      line(c, f.p.trim, BASE, 0.012, 0.02, 0.09, 0.15, 0.09);
      break;
    }
    case 'wrench': {
      c.rotate(0.55);
      limb(c, metal, 0, 0.02, 0, 0.3, 0.022, 0.024, 0.01, OW * 0.8);
      ell(c, metal, 0, 0.33, 0.055, 0.05, 0, 0.02, OW * 0.8);
      fillEll(c, f.p.wood, SHADE, 0.0, 0.355, 0.026, 0.03);
      break;
    }
    case 'tool': {
      c.rotate(0.4);
      limb(c, wood, 0, 0.02, 0, 0.3, 0.02, 0.02, 0.01, OW * 0.8);
      poly(c, metal, [-0.07, 0.3, 0.07, 0.3, 0.07, 0.38, -0.07, 0.38], 0.02, OW * 0.8);
      break;
    }
    case 'quill': {
      c.rotate(0.6);
      line(c, f.p.trim, BASE, 0.012, 0, -0.02, 0, 0.18);
      blob(c, f.p.trim, [0.0, 0.1, 0.05, 0.16, 0.07, 0.3, 0.0, 0.34, -0.03, 0.24], 0.02, OW * 0.7);
      break;
    }
    case 'scroll': {
      c.rotate(0.9);
      poly(
        c,
        sw('#efe4c4'),
        [-0.045, -0.02, 0.045, -0.02, 0.045, 0.26, -0.045, 0.26],
        0.02,
        OW * 0.9,
      );
      ell(c, sw('#efe4c4'), 0, 0.26, 0.045, 0.02, 0, 0.01, OW * 0.8);
      line(c, belt, BASE, 0.014, -0.045, 0.1, 0.045, 0.1);
      break;
    }
    case 'banner': {
      limb(c, wood, 0, -0.3, 0, 0.85, 0.014, 0.014, 0.01, OW * 0.8);
      ribbon(
        c,
        f.acc,
        0.0,
        0.8,
        Math.PI * 0.96,
        0.34,
        0.2,
        0.15,
        0.2,
        t * 0.8,
        0.5,
        f.drag,
        0.03,
        OW * 0.8,
        5,
      );
      break;
    }
  }
  c.restore();
}
