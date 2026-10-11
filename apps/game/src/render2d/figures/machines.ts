import {
  BASE,
  HI,
  OW,
  SHADE,
  blob,
  ell,
  fillEll,
  gear,
  limb,
  line,
  poly,
  puff,
  ribbon,
  sw,
} from './kit';
import type { Ctx } from './kit';
import { militia } from './humans';
import type { F, Look } from './types';

const STEAM = sw('#ece8e0');
const GLOW = sw('#ffb040');
const GLOW2 = sw('#ffe8a0');
const EYE = sw('#ffd070');

const BOILER = [
  -0.17, 0.02, 0.14, 0.02, 0.2, 0.2, 0.22, 0.42, 0.14, 0.6, 0.02, 0.68, -0.1, 0.66, -0.2, 0.52,
  -0.22, 0.3,
];

function steam(c: Ctx, f: F, x: number, y: number, n: number, speed: number, size: number): void {
  for (let i = 0; i < n; i++) {
    const ph = (f.t * speed + i / n) % 1;
    puff(
      c,
      STEAM,
      x - ph * 0.14 - f.drag * ph * 0.08 + Math.sin(f.t * 2 + i * 2) * 0.02,
      y + ph * 0.55,
      size * (0.5 + ph),
      (1 - ph) * 0.8,
    );
  }
}

function machineBack(f: F): void {
  const c = f.ctx;
  // Back tank with a pressure gauge, and the chimney that puffs steam.
  ell(c, f.p.armour, -0.27, 0.32, 0.12, 0.27, 0.0, 0.04);
  for (const y of [0.15, 0.32, 0.49]) line(c, f.p.dark, BASE, 0.026, -0.38, y, -0.16, y);
  for (const y of [0.15, 0.32, 0.49]) fillEll(c, f.p.trim, BASE, -0.18, y, 0.012, 0.012);
  limb(c, f.p.dark, -0.2, 0.55, -0.3, 1.08 + f.cls * 0.04, 0.05, 0.055, 0.02);
  poly(c, f.p.trim, [-0.4, 1.08, -0.2, 1.08, -0.22, 1.15, -0.38, 1.15], 0.02, OW * 0.9);
  steam(c, f, -0.3, 1.14, 4, 0.55, 0.06);
  // Gauge
  fillEll(c, f.p.trim, BASE, -0.2, 0.62, 0.05, 0.05);
  fillEll(c, f.p.dark, BASE, -0.2, 0.62, 0.036, 0.036);
  line(
    c,
    f.p.trim,
    BASE,
    0.01,
    -0.2,
    0.62,
    -0.2 + Math.cos(f.t * 2.5) * 0.028,
    0.62 + Math.abs(Math.sin(f.t * 2.5)) * 0.028,
  );
}

const machineLook: Look = {
  model: 'machine',
  limbs: () => ({
    upper: 'armour',
    fore: 'armour',
    thigh: 'armour',
    shin: 'armour',
    arm: 1.2,
    leg: 1.2,
  }),
  back: machineBack,
  torso(f) {
    const c = f.ctx;
    c.save();
    c.scale(f.g, 1);
    blob(c, f.p.armour, BOILER, 0.06);
    // Riveted bands and a dark belt plate.
    for (const y of [0.12, 0.62]) line(c, f.p.dark, BASE, 0.03, -0.18, y, 0.18, y + 0.02);
    for (const [x, y] of [
      [0.19, 0.12],
      [0.14, 0.12],
      [-0.14, 0.12],
      [0.14, 0.62],
      [-0.1, 0.62],
    ] as const)
      fillEll(c, f.p.trim, BASE, x, y, 0.014, 0.014);
    poly(c, f.p.dark, [-0.18, 0.0, 0.16, 0.0, 0.18, 0.1, -0.2, 0.1], 0.02);
    // Furnace grille: glows and flickers.
    poly(c, f.p.dark, [0.0, 0.2, 0.2, 0.22, 0.2, 0.46, 0.0, 0.46], 0.02, OW);
    const fl = 0.7 + Math.sin(f.t * 11) * 0.12 + Math.sin(f.t * 5.3) * 0.1;
    c.globalAlpha = Math.min(1, fl);
    for (let i = 0; i < 3; i++)
      poly(
        c,
        GLOW,
        [
          0.03,
          0.24 + i * 0.07,
          0.17,
          0.25 + i * 0.07,
          0.17,
          0.285 + i * 0.07,
          0.03,
          0.275 + i * 0.07,
        ],
        0.0,
        0,
      );
    c.globalAlpha = 0.5 * fl;
    fillEll(c, GLOW2, BASE, 0.1, 0.34, 0.05, 0.08);
    c.globalAlpha = 1;
    // Pennant in the side colour on a brass staff.
    c.restore();
    // plate over the chest (heavy gets a second)
    ell(c, f.p.trim, 0.05, 0.54, 0.05, 0.05, 0, 0.015, OW * 0.8);
    if (f.cls === 2)
      poly(c, f.p.dark, [-0.12, 0.58, 0.16, 0.58, 0.16, 0.64, -0.12, 0.64], 0.01, OW * 0.8);
  },
  front(f) {
    const c = f.ctx;
    // Side-colour band painted across the belly.
    c.save();
    c.scale(f.g, 1);
    poly(c, f.acc, [-0.185, 0.1, 0.18, 0.1, 0.185, 0.16, -0.19, 0.16], 0.01, OW * 0.8);
    c.restore();
  },
  skirt(f) {
    const c = f.ctx;
    c.save();
    c.scale(f.g, 1);
    poly(c, f.p.dark, [-0.16, 0.06, 0.17, 0.06, 0.22, -0.18, -0.2, -0.18], 0.03);
    for (let i = 0; i < 4; i++)
      line(c, f.p.armour, BASE, 0.026, -0.14 + i * 0.1, 0.0, -0.16 + i * 0.11, -0.16);
    c.restore();
  },
  head(f) {
    const c = f.ctx;
    // Boxy brass head: a visor with a glowing slit, rivets and an antenna.
    line(c, f.p.dark, BASE, 0.12, 0.0, -0.1, 0.0, -0.18);
    poly(
      c,
      f.p.armour,
      [-0.16, -0.1, 0.16, -0.1, 0.19, 0.04, 0.15, 0.16, -0.13, 0.17, -0.18, 0.04],
      0.045,
    );
    poly(c, f.p.dark, [0.0, 0.0, 0.18, 0.02, 0.17, 0.07, 0.0, 0.065], 0.01, OW * 0.8);
    c.globalAlpha = 0.65 + Math.sin(f.t * 4) * 0.2;
    poly(c, EYE, [0.04, 0.02, 0.17, 0.03, 0.16, 0.055, 0.04, 0.05], 0.0, 0);
    c.globalAlpha = 1;
    line(c, f.p.trim, BASE, 0.02, -0.1, 0.16, 0.12, 0.16);
    for (const [x, y] of [
      [-0.12, -0.05],
      [-0.12, 0.1],
      [0.1, 0.12],
    ] as const)
      fillEll(c, f.p.trim, BASE, x, y, 0.013, 0.013);
    // grille mouth
    for (let i = 0; i < 3; i++)
      line(c, f.p.dark, BASE, 0.01, 0.08 + i * 0.03, -0.07, 0.08 + i * 0.03, -0.02);
    limb(c, f.p.trim, -0.06, 0.17, -0.08, 0.42, 0.011, 0.011, 0.0, OW * 0.5);
    ribbon(
      c,
      f.acc,
      -0.08,
      0.4,
      Math.PI * 0.98,
      0.34,
      0.12,
      0.03,
      0.3,
      f.t,
      0.3,
      f.drag,
      0.02,
      OW * 0.8,
      5,
    );
    fillEll(c, f.p.trim, BASE, -0.08, 0.43, 0.02, 0.02);
  },
  pad(f, far) {
    const c = f.ctx;
    const k = [0.85, 1, 1.25][f.cls] as number;
    ell(c, f.p.armour, 0, 0, 0.13 * k, 0.11 * k, 0, 0.04);
    gear(c, f.p.trim, f.p.dark, 0.0, 0.0, 0.075 * k, 8, f.t * (far ? -1.1 : 1.3));
  },
  fore(f) {
    const c = f.ctx;
    // Hydraulic piston along the forearm.
    limb(c, f.p.trim, 0.06, -0.06, 0.06, -0.24, 0.018, 0.018, 0.006, OW * 0.7);
    poly(c, f.p.dark, [-0.065, -0.14, 0.065, -0.14, 0.07, -0.2, -0.07, -0.2], 0.012, OW * 0.8);
    fillEll(c, f.p.dark, BASE, 0, 0, 0.06, 0.06);
    fillEll(c, f.p.trim, BASE, 0, 0, 0.03, 0.03);
  },
  hand(f, far) {
    const c = f.ctx;
    // Clamp claw: two plates around the grip.
    ell(c, f.p.dark, 0, -0.01, 0.07 * (far ? 0.95 : 1), 0.075, 0, 0.02, OW);
    poly(c, f.p.armour, [-0.05, -0.03, 0.06, -0.03, 0.08, -0.11, -0.02, -0.12], 0.015, OW * 0.9);
    fillEll(c, f.p.trim, BASE, 0.0, -0.01, 0.02, 0.02);
  },
  thigh(f, far) {
    const c = f.ctx;
    gear(c, f.p.trim, f.p.dark, 0, 0, 0.085, 9, f.t * (far ? 0.9 : -1.0));
    // thigh piston
    limb(c, f.p.trim, 0.1, -0.1, 0.1, -0.36, 0.016, 0.016, 0.005, OW * 0.6);
  },
  shin(f) {
    const c = f.ctx;
    // Knee cop and a piston rod that slides with time (pumping).
    ell(c, f.p.dark, 0.02, 0, 0.1, 0.09, 0, 0.03);
    fillEll(c, f.p.trim, BASE, 0.05, 0, 0.026, 0.026);
    const slide = Math.sin(f.t * 5) * 0.03;
    limb(c, f.p.trim, 0.09, -0.12 + slide, 0.09, -0.34 + slide, 0.015, 0.015, 0.005, OW * 0.6);
  },
  boot(f) {
    const c = f.ctx;
    c.save();
    c.scale(f.g, 1);
    poly(
      c,
      f.p.dark,
      [-0.1, 0.08, 0.06, 0.08, 0.12, 0.0, 0.3, -0.02, 0.32, -0.07, -0.1, -0.07],
      0.025,
    );
    poly(
      c,
      f.p.armour,
      [-0.09, 0.04, 0.05, 0.04, 0.09, -0.02, 0.22, -0.03, 0.22, -0.01, -0.09, -0.01],
      0.012,
      OW * 0.8,
    );
    c.restore();
    line(c, f.p.dark, BASE, 0.016, -0.08, -0.07, 0.32 * f.g, -0.07);
  },
};

export const machine = machineLook;

// ── Siege tower ───────────────────────────────────────────────

function towerBack(f: F): void {
  const c = f.ctx;
  machineBack(f);
  // Timber siege tower strapped to the back (drawn first, behind the tank).
  c.save();
  c.translate(-0.55, 0.12);
  c.scale(0.86, 0.86);
  const wood = f.p.wood;
  // posts
  for (const x of [-0.26, 0.26]) limb(c, wood, x, 0, x * 0.82, 1.5, 0.045, 0.04, 0.02, OW);
  // body with hides
  poly(c, f.p.leather, [-0.25, 0.22, 0.25, 0.22, 0.21, 1.2, -0.21, 1.2], 0.04, OW);
  // planks
  for (const y of [0.45, 0.7, 0.95]) line(c, f.p.dark, BASE, 0.02, -0.24, y, 0.24, y);
  poly(c, wood, [-0.32, 0.16, 0.32, 0.16, 0.32, 0.24, -0.32, 0.24], 0.02, OW * 0.9);
  // loopholes
  for (const y of [0.5, 0.78])
    poly(c, f.p.dark, [-0.05, y, 0.05, y, 0.05, y + 0.12, -0.05, y + 0.12], 0.0, OW * 0.7);
  // crossbraces
  limb(c, wood, -0.2, 0.25, 0.2, 0.7, 0.025, 0.025, 0.01, OW * 0.8);
  limb(c, wood, 0.2, 0.25, -0.2, 0.7, 0.025, 0.025, 0.01, OW * 0.8);
  // fighting platform with crenels
  poly(c, wood, [-0.34, 1.18, 0.34, 1.18, 0.36, 1.26, -0.36, 1.26], 0.02, OW);
  // crewman peeking out (side-colour helm)
  const bob = Math.sin(f.t * 2.2) * 0.012;
  ell(c, f.p.skin, 0.02, 1.36 + bob, 0.075, 0.08, 0, 0.02, OW * 0.9);
  blob(
    c,
    f.acc,
    [
      -0.1,
      1.36 + bob,
      -0.08,
      1.46 + bob,
      0.02,
      1.5 + bob,
      0.1,
      1.44 + bob,
      0.1,
      1.38 + bob,
      -0.02,
      1.39 + bob,
    ],
    0.02,
    OW * 0.9,
  );
  fillEll(c, f.p.dark, BASE, 0.06, 1.36 + bob, 0.01, 0.014);
  for (const x of [-0.3, -0.1, 0.1, 0.3])
    poly(
      c,
      f.p.leather,
      [x - 0.07, 1.26, x + 0.07, 1.26, x + 0.07, 1.4, x - 0.07, 1.4],
      0.02,
      OW * 0.9,
    );
  // mast and pennant
  limb(c, f.p.dark, 0, 1.4, 0, 1.78, 0.012, 0.012, 0.003, OW * 0.5);
  ribbon(
    c,
    f.acc,
    0.0,
    1.74,
    Math.PI * 0.98,
    0.42,
    0.18,
    0.03,
    0.3,
    f.t,
    0.8,
    f.drag,
    0.02,
    OW * 0.8,
    5,
  );
  // ropes to the body
  line(c, f.p.leather, BASE, 0.016, 0.3, 0.45, 0.6, 0.55);
  line(c, f.p.leather, BASE, 0.016, 0.3, 0.8, 0.6, 0.7);
  c.restore();
}

export const tower: Look = {
  ...machineLook,
  model: 'tower',
  back: towerBack,
};

// ── Barge ─────────────────────────────────────────────────────

const HULL = [
  -0.72, 0.64, -0.66, 0.3, -0.5, 0.08, 0.0, 0.0, 0.5, 0.06, 0.78, 0.3, 0.98, 0.62, 0.98, 0.78, 0.86,
  0.66, 0.0, 0.62,
];
const DECK = [-0.72, 0.6, 0.86, 0.6, 0.9, 0.67, -0.74, 0.67];
const WAVE: number[] = new Array<number>(40).fill(0);

export const barge: Look = {
  ...militia,
  model: 'barge',
  hull(f) {
    const c = f.ctx;
    const t = f.t;
    // Stern post with a lantern.
    limb(c, f.p.wood, -0.68, 0.5, -0.7, 1.05, 0.03, 0.025, 0.012, OW);
    ell(c, f.p.trim, -0.7, 1.1, 0.05, 0.065, 0, 0.015, OW * 0.8);
    c.globalAlpha = 0.45 + Math.sin(t * 6) * 0.15;
    fillEll(c, GLOW2, BASE, -0.7, 1.1, 0.04, 0.05);
    c.globalAlpha = 1;
    // Cargo: barrel and rope coil.
    ell(c, f.p.wood, -0.45, 0.82, 0.12, 0.15, 0, 0.03);
    for (const y of [0.74, 0.9]) line(c, f.p.metal, BASE, 0.016, -0.56, y, -0.34, y);
    ell(c, f.p.leather, -0.2, 0.7, 0.1, 0.07, 0, 0.02, OW * 0.8);
    // Hull planks.
    blob(c, f.p.wood, HULL, 0.06);
    for (const y of [0.22, 0.38, 0.52])
      line(c, f.p.dark, BASE, 0.016, -0.6 + y * 0.1, y, 0.7 + y * 0.35 - 0.2, y);
    poly(c, f.p.trim, DECK, 0.015, OW);
    // Side-colour stripe and bow ornament.
    poly(c, f.acc, [-0.68, 0.45, 0.82, 0.45, 0.88, 0.5, 0.9, 0.57, -0.7, 0.57], 0.012, OW * 0.8);
    ell(c, f.p.trim, 0.94, 0.72, 0.06, 0.06, 0, 0.015, OW * 0.9);
    for (let i = 0; i < 4; i++) fillEll(c, f.p.dark, BASE, -0.5 + i * 0.35, 0.5, 0.014, 0.014);
    // Rippling water over the bottom of the hull.
    let n = 0;
    for (let i = 0; i <= 8; i++) {
      WAVE[n++] = -0.95 + i * 0.28;
      WAVE[n++] = 0.2 + Math.sin(t * 2.6 + i * 1.3) * 0.035;
    }
    for (let i = 8; i >= 0; i--) {
      WAVE[n++] = -0.95 + i * 0.28;
      WAVE[n++] = -0.05;
    }
    c.globalAlpha = 0.8;
    blob(c, sw('#4a8fa0'), WAVE, 0.03, OW * 0.6, n >> 1);
    c.globalAlpha = 1;
    for (let i = 0; i < 4; i++) {
      const ph = (t * 0.5 + i / 4) % 1;
      puff(
        c,
        STEAM,
        -0.6 + i * 0.5,
        0.2 + Math.sin(t * 2.6 + i * 1.3) * 0.035,
        0.03 + ph * 0.02,
        0.5 * (1 - ph),
      );
    }
  },
};
void HI;
void SHADE;
