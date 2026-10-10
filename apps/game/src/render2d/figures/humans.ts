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
  gear as _gear,
  line,
  poly,
  ribbon,
  trace,
} from './kit';
import type { Ctx } from './kit';
import type { F, Look, LimbStyle } from './types';

void _gear;

// ── Shared anatomy ────────────────────────────────────────────

const TORSO = [
  -0.1, 0.0, 0.11, 0.0, 0.13, 0.15, 0.17, 0.38, 0.12, 0.58, 0.05, 0.66, -0.06, 0.66, -0.14, 0.56,
  -0.16, 0.36, -0.12, 0.1,
];
const SKULL = [
  -0.12, 0.02, -0.1, 0.11, 0.0, 0.145, 0.09, 0.11, 0.125, 0.0, 0.12, -0.07, 0.08, -0.12, 0.0,
  -0.135, -0.09, -0.09,
];
const NOSE = [0.11, 0.015, 0.165, -0.035, 0.12, -0.05];
const FOOT = [-0.07, 0.07, 0.06, 0.07, 0.1, 0.0, 0.2, -0.015, 0.235, -0.065, -0.06, -0.065];
const FOOT_SOFT = [-0.07, 0.07, 0.05, 0.07, 0.1, -0.01, 0.2, -0.04, 0.2, -0.065, -0.06, -0.065];

function withG(f: F, fn: () => void): void {
  f.ctx.save();
  f.ctx.scale(f.g, 1);
  fn();
  f.ctx.restore();
}

function torsoBase(f: F, s: 'armour' | 'cloth' | 'skin' | 'leather' | 'trim'): void {
  withG(f, () => blob(f.ctx, f.p[s], TORSO, 0.05));
  // belt
  const c = f.ctx;
  c.save();
  c.scale(f.g, 1);
  poly(c, f.p.leather, [-0.11, 0.04, 0.115, 0.04, 0.115, 0.115, -0.11, 0.115], 0.015, OW * 0.8);
  fillEll(c, f.p.trim, BASE, 0.11, 0.078, 0.022, 0.026);
  c.restore();
}

/** A neck, a skull and the face. The head frame has its origin at the head centre. */
function skin(f: F): void {
  const c = f.ctx;
  line(c, f.p.skin, SHADE, 0.1, 0, -0.1, 0, -0.2);
  blob(c, f.p.skin, SKULL, 0.035);
  blob(c, f.p.skin, NOSE, 0.01, OW * 0.8);
  ell(c, f.p.skin, -0.02, -0.01, 0.025, 0.035, 0, 0.01, OW * 0.7);
}

function eyes(f: F, scowl = 0.5): void {
  const c = f.ctx;
  fillEll(c, f.p.dark, BASE, 0.078, 0.02, 0.013, 0.021);
  fillEll(c, f.p.trim, BASE, 0.082, 0.03, 0.005, 0.006);
  line(c, f.p.dark, BASE, 0.016, 0.05, 0.062 + scowl * 0.012, 0.115, 0.045 - scowl * 0.015);
  line(c, f.p.dark, BASE, 0.011, 0.088, -0.078, 0.118, -0.072);
}

function fist(f: F, far: boolean, key: 'armour' | 'leather' | 'skin'): void {
  const c = f.ctx;
  ell(c, f.p[key], 0.0, -0.02, 0.06 * (far ? 0.95 : 1), 0.066, 0, 0.022, OW);
  if (key === 'skin') line(c, f.p.skin, SHADE, 0.01, 0.01, -0.03, 0.04, -0.05);
}

function bootShape(f: F, s: 'armour' | 'leather' | 'cloth' | 'dark', soft = false, sc = 1): void {
  const c = f.ctx;
  c.save();
  c.scale(f.g * sc, 1);
  poly(c, f.p[s], soft ? FOOT_SOFT : FOOT, 0.02);
  c.restore();
  line(c, f.p.dark, BASE, 0.014, 0.0, -0.058, 0.2 * f.g * sc, -0.06);
}

function cross(f: F, x: number, y: number, k: number, key: 'trim' | 'cloth' = 'trim'): void {
  const c = f.ctx;
  const s = f.p[key];
  fillPoly(c, s, BASE, [
    x - 0.02 * k,
    y + 0.09 * k,
    x + 0.02 * k,
    y + 0.09 * k,
    x + 0.02 * k,
    y + 0.03 * k,
    x + 0.065 * k,
    y + 0.03 * k,
    x + 0.065 * k,
    y - 0.01 * k,
    x + 0.02 * k,
    y - 0.01 * k,
    x + 0.02 * k,
    y - 0.09 * k,
    x - 0.02 * k,
    y - 0.09 * k,
    x - 0.02 * k,
    y - 0.01 * k,
    x - 0.065 * k,
    y - 0.01 * k,
    x - 0.065 * k,
    y + 0.03 * k,
    x - 0.02 * k,
    y + 0.03 * k,
  ]);
}

const PLUME: { x: number; y: number } = { x: 0, y: 0 };
void PLUME;

// ── Round shield ─────────────────────────────────────────────

/** A round shield facing the camera, drawn at the off hand (forearm end). */
export function drawShield(f: F): void {
  const c: Ctx = f.ctx;
  const m = f.spec.model;
  const r = 0.28 + f.cls * 0.02;
  const face =
    m === 'sipahi' ? f.p.cloth : f.hero ? f.p.cloth : m === 'knight' ? f.p.cloth : f.p.leather;
  c.save();
  c.translate(0.1, 0.02);
  ell(c, f.p.wood, 0, 0, r + 0.03, r + 0.03, 0, 0.03, OW * 1.1);
  ell(c, face, 0, 0, r - 0.02, r - 0.02, 0, 0.05, OW);
  c.globalAlpha = 0.0;
  c.globalAlpha = 1;
  if (m === 'knight') cross(f, 0, 0, 2.1, 'trim');
  else if (m === 'sipahi') {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      fillEll(c, f.p.trim, BASE, Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, 0.018, 0.018);
    }
  } else {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      fillEll(c, f.p.metal, BASE, Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78, 0.016, 0.016);
    }
  }
  ell(c, f.p.metal, 0, 0, 0.055, 0.055, 0, 0.02, OW);
  fillEll(c, f.p.metal, HI, -0.012, 0.015, 0.02, 0.016);
  // side-colour rim wedge
  c.beginPath();
  c.arc(0, 0, r + 0.005, Math.PI * 0.62, Math.PI * 0.98);
  c.lineWidth = 0.04;
  c.strokeStyle = f.acc.at(BASE);
  c.stroke();
  c.restore();
}

// ── Knight ────────────────────────────────────────────────────

const CAPE = [0, 0];
void CAPE;

const knightLimbs = (): LimbStyle => ({
  upper: 'armour',
  fore: 'armour',
  thigh: 'armour',
  shin: 'armour',
  arm: 1.0,
  leg: 1.0,
});

export const knight: Look = {
  model: 'knight',
  limbs: knightLimbs,
  back(f) {
    const c = f.ctx;
    // Short mantle streaming behind the shoulders.
    ribbon(
      c,
      f.p.cloth,
      -0.12,
      0.58,
      Math.PI * 1.32,
      0.5 + f.cls * 0.05,
      0.16,
      0.24,
      0.2,
      f.t,
      0.0,
      f.drag,
      0.035,
    );
    if (f.hero)
      ribbon(
        c,
        f.p.trim,
        -0.1,
        0.5,
        Math.PI * 1.32,
        0.5,
        0.03,
        0.05,
        0.14,
        f.t,
        0.2,
        f.drag,
        0.0,
        OW * 0.6,
      );
  },
  torso(f) {
    const c = f.ctx;
    torsoBase(f, 'armour');
    withG(f, () => {
      // Surcoat panel down the front with the Order's cross.
      poly(
        c,
        f.p.cloth,
        [-0.1, 0.5, 0.15, 0.5, 0.165, 0.3, 0.14, 0.0, 0.1, -0.14, -0.1, -0.14],
        0.035,
      );
      if (f.hero) {
        poly(
          c,
          f.p.trim,
          [0.1, 0.5, 0.15, 0.5, 0.165, 0.3, 0.14, 0.0, 0.1, -0.14, 0.1, -0.1],
          0.0,
          0,
        );
        // half-sun medallion
        c.beginPath();
        c.arc(0.12, 0.43, 0.07, -Math.PI / 2, Math.PI / 2);
        c.closePath();
        c.fillStyle = f.p.trim.at(BASE);
        c.fill();
        c.lineWidth = OW * 0.7;
        c.strokeStyle = f.p.dark.at(BASE);
        c.stroke();
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + (i + 0.5) * (Math.PI / 5);
          line(
            c,
            f.p.trim,
            BASE,
            0.016,
            0.12 + Math.cos(a) * 0.09,
            0.43 + Math.sin(a) * 0.09,
            0.12 + Math.cos(a) * 0.12,
            0.43 + Math.sin(a) * 0.12,
          );
        }
      } else cross(f, 0.04, 0.3, 1.25);
      // gorget
      poly(c, f.p.armour, [-0.09, 0.6, 0.08, 0.6, 0.1, 0.7, -0.09, 0.7], 0.025, OW * 0.9);
      if (f.cls === 2) {
        // heavy: breastplate ridge and extra lames
        line(c, f.p.armour, HI, 0.02, 0.15, 0.46, 0.15, 0.56);
        for (const y of [0.54, 0.6]) line(c, f.p.metal, HI, 0.016, -0.08, y, 0.1, y);
      }
    });
  },
  front(f) {
    if (!f.hero) return;
    // Gold sash across the chest.
    const c = f.ctx;
    c.save();
    c.scale(f.g, 1);
    poly(c, f.p.trim, [-0.13, 0.55, -0.08, 0.6, 0.15, 0.2, 0.1, 0.16], 0.02, OW * 0.7);
    c.restore();
  },
  skirt(f) {
    const c = f.ctx;
    c.save();
    c.scale(f.g, 1);
    // Tassets: armoured plates over the thighs, cloth below.
    poly(c, f.p.cloth, [-0.13, 0.04, 0.15, 0.04, 0.18, -0.2, 0.0, -0.26, -0.16, -0.2], 0.035);
    poly(c, f.p.armour, [-0.14, 0.06, 0.15, 0.06, 0.17, -0.04, 0.0, -0.08, -0.15, -0.04], 0.025);
    if (f.cls > 0)
      poly(
        c,
        f.p.armour,
        [-0.13, -0.05, 0.16, -0.05, 0.14, -0.15, -0.01, -0.17, -0.14, -0.14],
        0.025,
      );
    c.restore();
  },
  head(f) {
    const c = f.ctx;
    skin(f);
    if (f.cls === 0) {
      // Light: open sallet, the face shows.
      eyes(f);
      blob(
        c,
        f.p.armour,
        [
          -0.15, -0.04, -0.17, 0.08, -0.06, 0.18, 0.08, 0.17, 0.14, 0.09, 0.07, 0.07, -0.02, 0.0,
          -0.07, -0.1,
        ],
        0.035,
      );
      poly(c, f.p.armour, [-0.15, -0.04, -0.07, -0.1, -0.06, -0.19, -0.17, -0.12], 0.02, OW * 0.8);
    } else {
      // Close helm with a visor slit.
      blob(
        c,
        f.p.armour,
        [
          -0.17, -0.05, -0.18, 0.08, -0.08, 0.19, 0.06, 0.2, 0.16, 0.1, 0.19, -0.02, 0.17, -0.12,
          0.08, -0.18, -0.04, -0.17, -0.14, -0.15,
        ],
        0.04,
      );
      poly(
        c,
        f.p.armour,
        [0.05, 0.07, 0.18, 0.04, 0.215, -0.04, 0.19, -0.13, 0.08, -0.17, 0.04, -0.08],
        0.03,
      );
      line(c, f.p.dark, BASE, 0.026, 0.07, 0.0, 0.2, 0.0);
      fillEll(c, f.p.trim, BASE, 0.12, 0.0, 0.012, 0.008);
      for (const y of [-0.06, -0.09, -0.12]) fillEll(c, f.p.dark, BASE, 0.15, y, 0.008, 0.008);
      line(c, f.p.metal, HI, 0.014, -0.1, 0.17, 0.06, 0.2);
    }
    // Crest ridge and plume in the side colour.
    line(c, f.p.trim, BASE, 0.026, -0.12, 0.17, 0.08, 0.2);
    const big = f.hero ? 1.3 : 1 + f.cls * 0.15;
    ribbon(
      c,
      f.hero ? f.p.cloth : f.acc,
      -0.04,
      0.2,
      Math.PI * 0.8,
      0.32 * big,
      0.12 * big,
      0.03,
      0.22,
      f.t,
      0.6,
      f.drag * 0.5,
      0.03,
    );
    if (f.hero)
      ribbon(
        c,
        f.p.trim,
        -0.1,
        0.2,
        Math.PI * 1.02,
        0.34,
        0.05,
        0.02,
        0.3,
        f.t,
        1.5,
        f.drag,
        0.0,
        OW * 0.6,
      );
  },
  pad(f, far) {
    const c = f.ctx;
    const k = [0.8, 1, 1.3][f.cls] as number;
    ell(c, f.p.armour, 0, 0.0, 0.11 * k, 0.1 * k, 0, 0.04);
    if (!far) {
      ell(c, f.p.armour, 0.01, -0.07 * k, 0.1 * k, 0.045 * k, 0, 0.025);
      if (f.cls === 2) ell(c, f.p.armour, 0.01, -0.13 * k, 0.095 * k, 0.04 * k, 0, 0.02);
      cross(f, 0, 0, 0.5);
    }
  },
  fore(f, far) {
    const c = f.ctx;
    ell(c, f.p.metal, 0, 0, 0.062, 0.062, 0, 0.02, OW * 0.8);
    line(c, f.p.trim, BASE, 0.022, -0.06, -0.18, 0.06, -0.18);
    void far;
  },
  hand(f, far) {
    fist(f, far, 'armour');
  },
  thigh(f) {
    ell(f.ctx, f.p.dark, 0, 0, 0.075, 0.075, 0, 0.015, OW * 0.7);
  },
  shin(f) {
    const c = f.ctx;
    ell(c, f.p.armour, 0.015, 0, 0.1, 0.085, 0, 0.03);
    fillEll(c, f.p.trim, BASE, 0.045, 0.0, 0.02, 0.02);
  },
  boot(f) {
    bootShape(f, 'armour');
  },
  shield: () => true,
};

// ── Militia ───────────────────────────────────────────────────

export const militia: Look = {
  model: 'militia',
  limbs: () => ({
    upper: 'trim',
    fore: 'skin',
    thigh: 'cloth',
    shin: 'trim',
    arm: 0.92,
    leg: 0.95,
  }),
  back(f) {
    // A knapsack and a rolled blanket.
    const c = f.ctx;
    ell(c, f.p.leather, -0.2, 0.34, 0.1, 0.15, 0.2, 0.03);
    ell(c, f.p.cloth, -0.17, 0.52, 0.12, 0.05, 0.3, 0.02);
  },
  torso(f) {
    const c = f.ctx;
    torsoBase(f, 'trim');
    withG(f, () => {
      // Leather jerkin over the linen shirt.
      poly(
        c,
        f.p.armour,
        [
          -0.11, 0.0, 0.12, 0.0, 0.145, 0.2, 0.15, 0.42, 0.06, 0.5, -0.06, 0.5, -0.14, 0.38, -0.13,
          0.15,
        ],
        0.04,
      );
      for (const y of [0.18, 0.28, 0.38]) line(c, f.p.leather, BASE, 0.014, 0.1, y, 0.14, y - 0.01);
      line(c, f.p.dark, BASE, 0.016, 0.11, 0.1, 0.11, 0.45);
      // neck scarf
      ell(c, f.p.cloth, 0.02, 0.6, 0.09, 0.05, 0, 0.02, OW * 0.8);
    });
    // armband
    poly(c, f.acc, [0.0, 0.5, 0.1, 0.5, 0.1, 0.4, 0.0, 0.4], 0.0, 0);
  },
  skirt(f) {
    const c = f.ctx;
    c.save();
    c.scale(f.g, 1);
    poly(c, f.p.cloth, [-0.12, 0.05, 0.13, 0.05, 0.15, -0.1, -0.14, -0.1], 0.03);
    // side-colour rope belt
    poly(c, f.acc, [-0.12, 0.05, 0.13, 0.05, 0.13, 0.0, -0.12, 0.0], 0.0, OW * 0.8);
    c.restore();
  },
  head(f) {
    const c = f.ctx;
    skin(f);
    eyes(f, 0.2);
    // tousled hair and stubble
    blob(
      c,
      f.p.dark,
      [-0.13, -0.02, -0.12, 0.1, 0.0, 0.15, 0.07, 0.11, 0.0, 0.07, -0.08, 0.04, -0.1, -0.08],
      0.02,
      OW * 0.8,
    );
    // wide straw hat with a band in the side colour
    ell(c, f.p.hat, 0.0, 0.12, 0.27, 0.05, -0.05, 0.03);
    blob(c, f.p.hat, [-0.12, 0.12, -0.1, 0.22, 0.0, 0.27, 0.1, 0.22, 0.12, 0.12], 0.035);
    poly(c, f.acc, [-0.115, 0.13, 0.115, 0.13, 0.11, 0.18, -0.11, 0.18], 0.0, OW * 0.7);
    line(c, f.p.hat, SHADE, 0.012, -0.2, 0.1, 0.2, 0.12);
  },
  pad(f) {
    ell(f.ctx, f.p.trim, 0, -0.01, 0.075, 0.075, 0, 0.025, OW * 0.9);
  },
  fore(f) {
    // rolled sleeve
    ell(f.ctx, f.p.trim, 0, -0.03, 0.062, 0.05, 0, 0.02, OW * 0.9);
  },
  hand(f, far) {
    fist(f, far, 'skin');
  },
  boot(f) {
    bootShape(f, 'leather', true);
  },
  shield: () => true,
};

// ── Gunner ────────────────────────────────────────────────────

export const gunner: Look = {
  model: 'gunner',
  limbs: () => ({
    upper: 'cloth',
    fore: 'cloth',
    thigh: 'cloth',
    shin: 'leather',
    arm: 0.95,
    leg: 0.95,
  }),
  back(f) {
    // Powder bag.
    ell(f.ctx, f.p.leather, -0.2, 0.2, 0.1, 0.12, 0.2, 0.03);
    ell(f.ctx, f.p.trim, -0.2, 0.3, 0.05, 0.03, 0.2, 0.0, OW * 0.7);
  },
  torso(f) {
    const c = f.ctx;
    torsoBase(f, 'cloth');
    withG(f, () => {
      poly(c, f.p.leather, [-0.14, 0.58, -0.08, 0.62, 0.16, 0.2, 0.1, 0.12], 0.02, OW * 0.9);
      // bandolier charges
      for (let i = 0; i < 6; i++) {
        const k = i / 5;
        ell(c, f.p.trim, -0.07 + k * 0.19, 0.55 - k * 0.38, 0.016, 0.04, -0.6, 0.0, OW * 0.6);
      }
      // lapel
      poly(c, f.p.trim, [0.04, 0.62, 0.11, 0.52, 0.09, 0.3, 0.07, 0.3, 0.07, 0.52], 0.0, OW * 0.5);
    });
    // side-colour sash at the waist
    c.save();
    c.scale(f.g, 1);
    poly(c, f.acc, [-0.115, 0.1, 0.12, 0.1, 0.12, 0.17, -0.115, 0.17], 0.015, OW * 0.8);
    c.restore();
  },
  skirt(f) {
    const c = f.ctx;
    c.save();
    c.scale(f.g, 1);
    poly(c, f.p.cloth, [-0.13, 0.05, 0.14, 0.05, 0.17, -0.18, -0.15, -0.18], 0.035);
    line(c, f.p.trim, BASE, 0.018, -0.15, -0.17, 0.17, -0.17);
    c.restore();
  },
  head(f) {
    const c = f.ctx;
    skin(f);
    eyes(f, 0.6);
    // beard
    blob(
      c,
      f.p.dark,
      [0.0, -0.08, 0.1, -0.06, 0.13, -0.12, 0.06, -0.19, -0.03, -0.14],
      0.02,
      OW * 0.7,
    );
    // Morion: dome, comb and a boat brim.
    blob(
      c,
      f.p.hat,
      [-0.15, 0.04, -0.14, 0.15, -0.02, 0.22, 0.1, 0.17, 0.16, 0.07, 0.1, 0.03, -0.06, 0.05],
      0.04,
    );
    poly(c, f.p.hat, [-0.17, 0.2, 0.0, 0.3, 0.14, 0.2, 0.0, 0.17], 0.025);
    poly(
      c,
      f.p.hat,
      [-0.2, 0.09, -0.12, 0.03, 0.2, 0.07, 0.27, 0.15, 0.19, 0.1, -0.12, 0.08],
      0.03,
    );
    for (const x of [-0.08, 0.0, 0.08]) fillEll(c, f.p.trim, BASE, x, 0.15, 0.011, 0.011);
  },
  pad(f) {
    ell(f.ctx, f.p.leather, 0, 0, 0.085, 0.075, 0, 0.025, OW * 0.9);
  },
  fore(f) {
    // leather bracer with a side-colour armband
    poly(
      f.ctx,
      f.p.leather,
      [-0.055, -0.1, 0.055, -0.1, 0.05, -0.27, -0.05, -0.27],
      0.015,
      OW * 0.8,
    );
    poly(f.ctx, f.acc, [-0.06, -0.01, 0.06, -0.01, 0.06, -0.07, -0.06, -0.07], 0.0, OW * 0.7);
  },
  hand(f, far) {
    fist(f, far, 'leather');
  },
  shin(f) {
    ell(f.ctx, f.p.leather, 0.03, 0.0, 0.09, 0.07, 0, 0.02, OW * 0.9);
  },
  boot(f) {
    bootShape(f, 'leather');
  },
};

// ── Janissary ─────────────────────────────────────────────────

export const janissary: Look = {
  model: 'janissary',
  sabre: true,
  limbs: () => ({
    upper: 'cloth',
    fore: 'trim',
    thigh: 'cloth',
    shin: 'leather',
    arm: 0.95,
    leg: 0.9,
  }),
  back(f) {
    // Long sash ends trailing from the waist.
    ribbon(f.ctx, f.acc, -0.1, 0.08, Math.PI * 1.2, 0.42, 0.11, 0.07, 0.25, f.t, 0.9, f.drag, 0.03);
  },
  torso(f) {
    const c = f.ctx;
    torsoBase(f, 'cloth');
    withG(f, () => {
      // Open kaftan front with gold frogging.
      poly(c, f.p.dark, [0.08, 0.64, 0.12, 0.5, 0.1, 0.1, 0.07, 0.1, 0.06, 0.5], 0.0, OW * 0.6);
      for (const y of [0.2, 0.3, 0.4, 0.5]) line(c, f.p.trim, BASE, 0.016, 0.0, y, 0.13, y);
      for (const y of [0.2, 0.3, 0.4, 0.5]) fillEll(c, f.p.trim, BASE, 0.08, y, 0.014, 0.014);
    });
    // wide sash
    c.save();
    c.scale(f.g, 1);
    poly(c, f.acc, [-0.115, 0.06, 0.12, 0.06, 0.12, 0.16, -0.115, 0.16], 0.02, OW * 0.9);
    c.restore();
  },
  skirt(f) {
    const c = f.ctx;
    c.save();
    c.scale(f.g, 1);
    // Kaftan skirts nearly to the boots, with a split and a gold hem.
    poly(c, f.p.cloth, [-0.13, 0.05, 0.14, 0.05, 0.22, -0.52, -0.2, -0.5], 0.05);
    poly(c, f.p.dark, [0.06, 0.03, 0.12, 0.03, 0.2, -0.5, 0.1, -0.5], 0.0, 0);
    line(c, f.p.trim, BASE, 0.026, -0.2, -0.5, 0.22, -0.52);
    line(c, f.p.trim, BASE, 0.02, 0.12, 0.04, 0.22, -0.5);
    c.restore();
  },
  head(f) {
    const c = f.ctx;
    skin(f);
    eyes(f, 0.4);
    // The famous moustache.
    blob(
      c,
      f.p.dark,
      [0.07, -0.05, 0.14, -0.04, 0.18, -0.075, 0.12, -0.085, 0.07, -0.075],
      0.015,
      OW * 0.7,
    );
    blob(c, f.p.dark, [-0.1, 0.01, -0.12, 0.11, -0.02, 0.1, -0.07, -0.05], 0.01, OW * 0.7);
    // Börk: tall white felt cap with the sleeve folded down the back.
    blob(c, f.p.hat, [-0.12, 0.06, -0.1, 0.14, 0.08, 0.14, 0.1, 0.07, 0.02, 0.05], 0.03);
    blob(c, f.p.hat, [-0.1, 0.12, -0.04, 0.38, 0.06, 0.36, 0.1, 0.12], 0.04);
    ribbon(
      c,
      f.p.hat,
      -0.1,
      0.3,
      Math.PI * 1.35 + f.drag * 0.4,
      0.34,
      0.12,
      0.1,
      0.25,
      f.t,
      0.3,
      f.drag,
      0.035,
    );
    poly(c, f.p.trim, [-0.125, 0.07, 0.11, 0.08, 0.12, 0.14, -0.12, 0.14], 0.015, OW * 0.9);
    // gold spoon holder in the front and a plume in the side colour
    blob(c, f.p.trim, [0.1, 0.12, 0.13, 0.22, 0.17, 0.2, 0.15, 0.12], 0.01, OW * 0.7);
    ribbon(
      c,
      f.acc,
      0.02,
      0.36,
      Math.PI * 0.55 + f.drag * 0.5,
      0.2,
      0.06,
      0.02,
      0.3,
      f.t,
      0.4,
      f.drag,
      0.02,
      OW * 0.8,
      4,
    );
  },
  pad(f) {
    ell(f.ctx, f.p.cloth, 0, 0, 0.085, 0.08, 0, 0.025, OW * 0.9);
  },
  fore(f) {
    // gold-braided vambrace
    poly(
      f.ctx,
      f.p.trim,
      [-0.058, -0.04, 0.058, -0.04, 0.05, -0.28, -0.05, -0.28],
      0.015,
      OW * 0.8,
    );
    for (const y of [-0.1, -0.17, -0.24]) line(f.ctx, f.p.dark, BASE, 0.012, -0.05, y, 0.05, y);
  },
  hand(f, far) {
    fist(f, far, 'skin');
  },
  shin(f) {
    ell(f.ctx, f.p.leather, 0.02, 0.0, 0.085, 0.065, 0, 0.02, OW * 0.9);
  },
  boot(f) {
    bootShape(f, 'leather');
  },
};

// ── Sipahi ────────────────────────────────────────────────────

export const sipahi: Look = {
  model: 'sipahi',
  sabre: true,
  limbs: () => ({
    upper: 'armour',
    fore: 'armour',
    thigh: 'cloth',
    shin: 'armour',
    arm: 1.0,
    leg: 0.98,
  }),
  back(f) {
    // Short cape in the side colour, flaring behind.
    ribbon(f.ctx, f.acc, -0.12, 0.58, Math.PI * 1.3, 0.5, 0.15, 0.24, 0.2, f.t, 1.0, f.drag, 0.035);
  },
  torso(f) {
    const c = f.ctx;
    torsoBase(f, 'armour');
    withG(f, () => {
      // Crimson tunic skirt over mail with gold lames.
      poly(
        c,
        f.p.cloth,
        [-0.12, 0.0, 0.12, 0.0, 0.15, 0.3, 0.13, 0.4, -0.12, 0.4, -0.14, 0.2],
        0.04,
      );
      for (const y of [0.46, 0.53]) line(c, f.p.trim, BASE, 0.022, -0.1, y, 0.14, y - 0.01);
      // mail shimmer
      c.save();
      c.setLineDash([0.018, 0.026]);
      line(c, f.p.metal, HI, 0.016, -0.12, 0.58, 0.12, 0.6);
      line(c, f.p.metal, HI, 0.016, -0.13, 0.5, 0.14, 0.52);
      c.restore();
    });
  },
  front(f) {
    const c = f.ctx;
    c.save();
    c.scale(f.g, 1);
    poly(c, f.acc, [-0.115, 0.1, 0.12, 0.1, 0.12, 0.17, -0.115, 0.17], 0.015, OW * 0.8);
    c.restore();
  },
  skirt(f) {
    const c = f.ctx;
    c.save();
    c.scale(f.g, 1);
    poly(c, f.p.armour, [-0.13, 0.05, 0.14, 0.05, 0.19, -0.26, -0.17, -0.26], 0.04);
    for (let i = 0; i < 6; i++) fillEll(c, f.p.metal, HI, -0.12 + i * 0.05, -0.2, 0.012, 0.012);
    line(c, f.p.trim, BASE, 0.022, -0.17, -0.25, 0.19, -0.25);
    c.restore();
  },
  head(f) {
    const c = f.ctx;
    skin(f);
    eyes(f, 0.7);
    blob(
      c,
      f.p.dark,
      [0.0, -0.1, 0.1, -0.08, 0.12, -0.14, 0.05, -0.19, -0.03, -0.15],
      0.015,
      OW * 0.7,
    );
    // Mail aventail over the neck.
    poly(c, f.p.armour, [-0.15, 0.0, -0.05, -0.03, 0.02, -0.2, -0.17, -0.2], 0.02, OW * 0.9);
    // Spiked helm with a turban wrap, nasal bar.
    blob(
      c,
      f.p.hat,
      [-0.15, 0.06, -0.13, 0.16, 0.0, 0.2, 0.13, 0.16, 0.15, 0.06, 0.05, 0.06],
      0.04,
    );
    poly(c, f.p.hat, [-0.05, 0.19, 0.0, 0.42, 0.05, 0.19], 0.025);
    poly(c, f.p.cloth, [-0.16, 0.06, 0.15, 0.06, 0.14, 0.12, -0.15, 0.12], 0.02, OW * 0.9);
    line(c, f.p.hat, BASE, 0.024, 0.13, 0.08, 0.13, -0.04);
    fillEll(c, f.p.trim, BASE, 0.0, 0.205, 0.022, 0.016);
    ribbon(
      c,
      f.acc,
      0.0,
      0.4,
      Math.PI * 0.55 + f.drag * 0.5,
      0.2,
      0.05,
      0.02,
      0.3,
      f.t,
      0.7,
      f.drag,
      0.02,
      OW * 0.8,
      4,
    );
  },
  pad(f) {
    ell(f.ctx, f.p.trim, 0, -0.005, 0.1, 0.09, 0, 0.03);
    ell(f.ctx, f.p.armour, 0, 0.0, 0.075, 0.065, 0, 0.02, OW * 0.7);
  },
  fore(f) {
    poly(
      f.ctx,
      f.p.trim,
      [-0.06, -0.12, 0.06, -0.12, 0.052, -0.26, -0.052, -0.26],
      0.012,
      OW * 0.8,
    );
  },
  hand(f, far) {
    fist(f, far, 'armour');
  },
  shin(f) {
    ell(f.ctx, f.p.trim, 0.02, 0.0, 0.085, 0.065, 0, 0.02, OW * 0.9);
  },
  boot(f) {
    bootShape(f, 'leather');
  },
  shield: () => true,
};

// ── Corsair ───────────────────────────────────────────────────

export const corsair: Look = {
  model: 'corsair',
  sabre: true,
  limbs: () => ({ upper: 'skin', fore: 'skin', thigh: 'trim', shin: 'skin', arm: 1.0, leg: 0.92 }),
  back(f) {
    // Long coat tail / sash trailing behind.
    ribbon(f.ctx, f.acc, -0.08, 0.1, Math.PI * 1.22, 0.46, 0.09, 0.06, 0.3, f.t, 0.4, f.drag, 0.03);
  },
  torso(f) {
    const c = f.ctx;
    torsoBase(f, 'skin');
    withG(f, () => {
      // Open teal vest, bare chest, wide sash.
      poly(
        c,
        f.p.cloth,
        [-0.12, 0.0, -0.1, 0.1, -0.15, 0.4, -0.1, 0.62, -0.02, 0.64, 0.02, 0.4, 0.0, 0.1],
        0.04,
      );
      poly(c, f.p.cloth, [0.1, 0.5, 0.13, 0.44, 0.1, 0.2, 0.08, 0.3], 0.02, OW * 0.8);
      line(c, f.p.skin, SHADE, 0.014, 0.12, 0.4, 0.09, 0.47);
      line(c, f.p.trim, BASE, 0.016, -0.14, 0.58, -0.02, 0.62);
    });
    c.save();
    c.scale(f.g, 1);
    poly(c, f.acc, [-0.12, 0.04, 0.125, 0.04, 0.125, 0.19, -0.12, 0.19], 0.025, OW * 0.9);
    // cutlass belt buckle
    fillEll(c, f.p.trim, BASE, 0.12, 0.115, 0.02, 0.028);
    c.restore();
  },
  skirt(f) {
    const c = f.ctx;
    c.save();
    c.scale(f.g, 1);
    // Baggy trousers gather at the knee.
    poly(c, f.p.trim, [-0.13, 0.05, 0.14, 0.05, 0.17, -0.2, -0.15, -0.2], 0.035);
    c.restore();
  },
  head(f) {
    const c = f.ctx;
    skin(f);
    eyes(f, 0.9);
    // stubble beard + gold earring
    blob(
      c,
      f.p.dark,
      [0.0, -0.08, 0.1, -0.07, 0.125, -0.12, 0.07, -0.18, -0.02, -0.14],
      0.015,
      OW * 0.7,
    );
    ell(c, f.p.trim, -0.03, -0.06, 0.016, 0.022, 0, 0.0, OW * 0.6);
    // Knotted headscarf with trailing ends.
    blob(
      c,
      f.p.hat,
      [
        -0.15, 0.02, -0.14, 0.14, -0.02, 0.2, 0.1, 0.15, 0.14, 0.07, 0.12, 0.07, 0.0, 0.1, -0.1,
        0.05,
      ],
      0.04,
    );
    line(c, f.p.hat, SHADE, 0.014, -0.1, 0.12, 0.12, 0.1);
    ribbon(
      c,
      f.p.hat,
      -0.14,
      0.06,
      Math.PI * 1.05 + 0.1,
      0.34,
      0.07,
      0.04,
      0.4,
      f.t,
      0.0,
      f.drag,
      0.02,
      OW * 0.8,
      5,
    );
    ribbon(
      c,
      f.p.hat,
      -0.14,
      0.04,
      Math.PI * 1.12 + 0.2,
      0.28,
      0.06,
      0.03,
      0.45,
      f.t,
      1.1,
      f.drag,
      0.02,
      OW * 0.8,
      5,
    );
    fillEll(c, f.p.trim, BASE, 0.0, 0.17, 0.018, 0.016);
  },
  pad(f) {
    if (f.cls === 2) ell(f.ctx, f.p.leather, 0, 0, 0.09, 0.08, 0, 0.025, OW * 0.9);
  },
  fore(f) {
    poly(
      f.ctx,
      f.p.leather,
      [-0.058, -0.14, 0.058, -0.14, 0.05, -0.26, -0.05, -0.26],
      0.012,
      OW * 0.8,
    );
    poly(f.ctx, f.acc, [-0.06, -0.04, 0.06, -0.04, 0.06, -0.09, -0.06, -0.09], 0.0, OW * 0.7);
  },
  hand(f, far) {
    fist(f, far, 'skin');
  },
  shin(f) {
    poly(f.ctx, f.p.trim, [-0.08, 0.0, 0.1, 0.0, 0.08, -0.1, -0.06, -0.1], 0.015, OW * 0.8);
  },
  boot(f) {
    bootShape(f, 'dark', true);
  },
};

void fillBlob;
void trace;
