import type { WeaponType } from '@m1565/core';
import {
  BASE,
  HI,
  LINE,
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
  puff,
  ribbon,
  sw,
  trace,
} from './kit';
import type { Ctx } from './kit';
import type { ArmaturaModel, F } from './types';

/**
 * Weapons are drawn in WEAPON SPACE: the origin is the gripping hand, +x runs along the weapon
 * toward its business end and +y is its back/top edge. When the weapon points straight ahead
 * (angle π/2) weapon space coincides with the figure's own space, so a firearm's stock sits
 * underneath and the lock on top. `drawWeapon` applies the rotation from the wrist frame.
 */

export type WeaponStyle =
  | 'sword'
  | 'sabre'
  | 'spear'
  | 'pike'
  | 'lance'
  | 'boarding'
  | 'mace'
  | 'maul'
  | 'club'
  | 'piston'
  | 'arquebus'
  | 'musket'
  | 'blunderbuss'
  | 'steamgun'
  | 'grenade'
  | 'firepot'
  | 'bomb';

export function styleFor(model: ArmaturaModel, type: WeaponType): WeaponStyle {
  switch (type) {
    case 'blade':
      return model === 'janissary' || model === 'sipahi' || model === 'corsair' ? 'sabre' : 'sword';
    case 'polearm':
      return model === 'janissary'
        ? 'pike'
        : model === 'sipahi'
          ? 'lance'
          : model === 'corsair'
            ? 'boarding'
            : 'spear';
    case 'blunt':
      return model === 'militia' || model === 'barge' || model === 'gunner'
        ? 'maul'
        : model === 'corsair'
          ? 'club'
          : model === 'machine' || model === 'tower'
            ? 'piston'
            : 'mace';
    case 'firearm':
      return model === 'janissary'
        ? 'musket'
        : model === 'corsair'
          ? 'blunderbuss'
          : model === 'machine' || model === 'tower'
            ? 'steamgun'
            : 'arquebus';
    case 'explosive':
      return model === 'militia' || model === 'barge' || model === 'corsair'
        ? 'firepot'
        : model === 'machine' || model === 'tower'
          ? 'bomb'
          : 'grenade';
  }
}

/** Weapon-space (u along, v up) position of the business end, for the anchors. */
export function tipUV(style: WeaponStyle, out: { u: number; v: number }): void {
  switch (style) {
    case 'sword':
      out.u = 0.96;
      out.v = 0;
      return;
    case 'sabre':
      out.u = 0.93;
      out.v = 0.23;
      return;
    case 'spear':
    case 'boarding':
      out.u = 1.66;
      out.v = 0;
      return;
    case 'pike':
      out.u = 1.72;
      out.v = 0;
      return;
    case 'lance':
      out.u = 1.7;
      out.v = 0;
      return;
    case 'mace':
      out.u = 0.74;
      out.v = 0;
      return;
    case 'maul':
      out.u = 0.66;
      out.v = 0;
      return;
    case 'club':
      out.u = 0.72;
      out.v = 0;
      return;
    case 'piston':
      out.u = 0.8;
      out.v = 0;
      return;
    case 'arquebus':
      out.u = 1.0;
      out.v = 0.02;
      return;
    case 'musket':
      out.u = 1.16;
      out.v = 0.02;
      return;
    case 'blunderbuss':
      out.u = 0.82;
      out.v = 0.02;
      return;
    case 'steamgun':
      out.u = 1.0;
      out.v = 0.03;
      return;
    case 'grenade':
    case 'firepot':
    case 'bomb':
      out.u = 0.2;
      out.v = 0.04;
      return;
  }
}

// ── Static shapes ──────────────────────────────────────────────

const SWORD_BLADE = [0.07, -0.034, 0.74, -0.036, 0.97, 0, 0.74, 0.036, 0.07, 0.034];
const SWORD_FULLER = [0.12, 0.0, 0.78, 0.0];
const SABRE_BLADE = [
  0.07, 0.034, 0.3, 0.06, 0.55, 0.11, 0.77, 0.185, 0.94, 0.25, 0.8, 0.095, 0.55, 0.02, 0.27, -0.025,
  0.07, -0.032,
];
const GUARD = [0.045, -0.13, 0.085, -0.13, 0.085, 0.13, 0.045, 0.13];
const SABRE_GUARD = [0.04, -0.1, 0.075, -0.1, 0.075, 0.1, 0.04, 0.1];

const SPEAR_HEAD = [1.32, -0.02, 1.38, -0.075, 1.5, -0.09, 1.68, 0, 1.5, 0.09, 1.38, 0.075, 1.32, 0.02];
const PIKE_HEAD = [1.4, -0.02, 1.46, -0.05, 1.62, -0.055, 1.76, 0, 1.62, 0.055, 1.46, 0.05, 1.4, 0.02];
const LANCE_HEAD = [1.44, -0.035, 1.55, -0.04, 1.74, 0, 1.55, 0.04, 1.44, 0.035];
const VAMPLATE = [0.16, -0.02, 0.27, -0.13, 0.31, -0.11, 0.31, 0.11, 0.27, 0.13, 0.16, 0.02];
const BOARD_HEAD = [1.34, -0.02, 1.4, -0.06, 1.52, -0.07, 1.68, 0, 1.52, 0.07, 1.4, 0.06, 1.34, 0.02];
const BOARD_HOOK = [1.38, 0.05, 1.3, 0.16, 1.36, 0.26, 1.44, 0.21, 1.42, 0.12, 1.46, 0.06];
const PENNON = [0, 0];

const MACE_HEAD = [
  0.5, 0.0, 0.54, 0.1, 0.6, 0.13, 0.66, 0.08, 0.7, 0.13, 0.76, 0.1, 0.74, 0.0, 0.76, -0.1, 0.7, -0.13,
  0.66, -0.08, 0.6, -0.13, 0.54, -0.1,
];
const MAUL_HEAD = [0.38, -0.11, 0.66, -0.13, 0.66, 0.13, 0.38, 0.11];
const CLUB_HEAD = [0.2, -0.04, 0.4, -0.08, 0.62, -0.12, 0.72, 0, 0.62, 0.12, 0.4, 0.08, 0.2, 0.04];
const PISTON_HEAD = [0.48, -0.14, 0.78, -0.15, 0.8, 0.15, 0.48, 0.14];

const STOCK = [
  -0.34, 0.07, -0.28, -0.06, -0.12, -0.05, 0.06, -0.07, 0.38, -0.05, 0.5, -0.03, 0.5, 0.025, 0.1, 0.045,
  -0.06, 0.09, -0.2, 0.1,
];
const MUSKET_STOCK = [
  -0.36, 0.08, -0.3, -0.07, -0.12, -0.05, 0.06, -0.075, 0.5, -0.05, 0.7, -0.03, 0.7, 0.025, 0.1, 0.05,
  -0.06, 0.1, -0.22, 0.11,
];
const BLUNDER_STOCK = [-0.3, 0.06, -0.25, -0.08, -0.08, -0.06, 0.1, -0.06, 0.36, -0.03, 0.4, 0.03, 0.05, 0.05, -0.1, 0.1];
const FLARE = [0.62, -0.035, 0.86, -0.1, 0.86, 0.1, 0.62, 0.035];

// ── Helpers ───────────────────────────────────────────────────

function haft(f: F, x0: number, x1: number, w: number): void {
  const c = f.ctx;
  limb(c, f.p.wood, x0, 0, x1, 0, w, w, 0.012, OW * 0.8);
}

function metalBar(f: F, x0: number, x1: number, w: number): void {
  limb(f.ctx, f.p.metal, x0, 0, x1, 0, w, w, 0.014, OW * 0.8);
}

function pommel(f: F, x: number, r: number): void {
  ell(f.ctx, f.p.trim, x, 0, r, r * 0.9, 0, 0.012, OW * 0.8);
}

/** Upward direction (world) expressed in weapon space, for flames and smoke. */
function upDir(f: F, out: { x: number; y: number }): void {
  const r = f.wAng - Math.PI / 2;
  out.x = Math.sin(r);
  out.y = Math.cos(r);
}
const UP = { x: 0, y: 1 };

const GLOW = sw('#ffb347');
const FLAME = sw('#ff7a1f');
const FLAME2 = sw('#ffd25a');
const SMOKE = sw('#d9d4cc');

function ember(f: F, x: number, y: number, r: number, phase: number): void {
  const c = f.ctx;
  const k = 0.75 + 0.25 * Math.sin(f.t * 17 + phase);
  c.globalAlpha = 0.28;
  fillEll(c, GLOW, BASE, x, y, r * 2.6 * k, r * 2.6 * k);
  c.globalAlpha = 1;
  fillEll(c, FLAME, BASE, x, y, r * 1.3 * k, r * 1.3 * k);
  fillEll(c, FLAME2, BASE, x, y, r * 0.65, r * 0.65);
  upDir(f, UP);
  for (let i = 0; i < 3; i++) {
    const ph = (f.t * 0.9 + i / 3 + phase * 0.1) % 1;
    puff(c, SMOKE, x + UP.x * (0.05 + ph * 0.32) + Math.sin(f.t * 3 + i) * 0.02, y + UP.y * (0.05 + ph * 0.32), 0.016 + ph * 0.03, (1 - ph) * 0.5);
  }
}

// ── Weapons ───────────────────────────────────────────────────

function sword(f: F, sabre: boolean): void {
  const c = f.ctx;
  const hero = f.hero;
  // Grip, pommel, guard, blade.
  haft(f, -0.1, 0.06, 0.034);
  line(c, f.p.leather, BASE, 0.034, -0.08, 0, 0.05, 0);
  for (let i = 0; i < 3; i++) line(c, f.p.dark, BASE, 0.01, -0.05 + i * 0.04, -0.03, -0.035 + i * 0.04, 0.03);
  pommel(f, -0.13, sabre ? 0.035 : 0.045);
  if (sabre) {
    poly(c, f.p.metal, SABRE_BLADE, 0.02, OW * 0.9);
    trace(c, f.p.metal, HI, 0.012, [0.12, 0.02, 0.4, 0.045, 0.7, 0.12, 0.88, 0.2]);
    poly(c, f.p.trim, SABRE_GUARD, 0.012, OW * 0.8);
    ell(c, f.p.trim, 0.06, 0, 0.03, 0.03, 0, 0.01, OW * 0.8);
  } else {
    poly(c, f.p.metal, SWORD_BLADE, 0.02, OW * 0.9);
    line(c, f.p.metal, SHADE, 0.014, SWORD_FULLER[0] as number, 0, SWORD_FULLER[2] as number, 0);
    line(c, f.p.metal, HI, 0.008, 0.2, 0.008, 0.7, 0.008);
    poly(c, hero ? f.p.trim : f.p.trim, GUARD, 0.012, OW * 0.8);
    ell(c, f.p.trim, 0.065, 0, 0.026, 0.026, 0, 0.01, OW * 0.7);
  }
}

function spear(f: F, style: 'spear' | 'pike' | 'lance' | 'boarding'): void {
  const c = f.ctx;
  const end = style === 'lance' ? 1.56 : 1.38;
  haft(f, -0.5, end, style === 'lance' ? 0.036 : 0.03);
  line(c, f.p.wood, HI, 0.009, -0.45, 0.01, end, 0.01);
  if (style === 'lance') {
    poly(c, f.p.metal, LANCE_HEAD, 0.016, OW * 0.9);
    poly(c, f.p.cloth, VAMPLATE, 0.02, OW * 0.9);
    ell(c, f.p.trim, 0.2, 0, 0.018, 0.04, 0, 0.01, OW * 0.6);
    // Pennon in the side colour, snapping behind the head.
    ribbon(c, f.acc, 1.42, 0.0, Math.PI * 0.98, 0.5, 0.2, 0.02, 0.28, f.t, 0.5, f.drag, 0.02, OW * 0.8);
    ribbon(c, f.p.trim, 1.42, -0.02, Math.PI * 1.03, 0.36, 0.05, 0.02, 0.2, f.t, 1.4, f.drag, 0.01, OW * 0.7);
    return;
  }
  if (style === 'pike') {
    // Long steel langets down the haft, a red tassel.
    limb(c, f.p.metal, 1.12, 0, 1.4, 0, 0.026, 0.026, 0.01, OW * 0.8);
    poly(c, f.p.metal, PIKE_HEAD, 0.016, OW * 0.9);
    ribbon(c, f.acc, 1.15, 0, Math.PI * 1.0, 0.24, 0.1, 0.05, 0.3, f.t, 0.9, f.drag, 0.01, OW * 0.7, 5);
    return;
  }
  if (style === 'boarding') {
    poly(c, f.p.metal, BOARD_HEAD, 0.016, OW * 0.9);
    blob(c, f.p.metal, BOARD_HOOK, 0.012, OW * 0.9);
    ribbon(c, f.acc, 1.3, 0, Math.PI * 1.02, 0.22, 0.08, 0.04, 0.35, f.t, 2.1, f.drag, 0.01, OW * 0.7, 5);
    return;
  }
  poly(c, f.p.metal, SPEAR_HEAD, 0.016, OW * 0.9);
  line(c, f.p.metal, HI, 0.01, 1.4, 0, 1.62, 0);
  // Winged lugs and a binding.
  limb(c, f.p.metal, 1.3, -0.1, 1.3, 0.1, 0.014, 0.014, 0.008, OW * 0.7);
  fillEll(c, f.p.leather, BASE, 1.28, 0, 0.03, 0.04);
  ribbon(c, f.acc, 1.22, 0.02, Math.PI * 1.02, 0.26, 0.1, 0.04, 0.3, f.t, 0.4, f.drag, 0.01, OW * 0.7, 5);
}

function mace(f: F, style: 'mace' | 'maul' | 'club' | 'piston'): void {
  const c = f.ctx;
  if (style === 'club') {
    haft(f, -0.1, 0.22, 0.034);
    blob(c, f.p.wood, CLUB_HEAD, 0.025, OW);
    for (const [x, y] of [
      [0.42, 0.04],
      [0.5, -0.04],
      [0.58, 0.05],
      [0.62, -0.03],
      [0.34, -0.03],
    ] as const)
      fillEll(c, f.p.metal, BASE, x, y, 0.017, 0.017);
    return;
  }
  if (style === 'maul') {
    haft(f, -0.12, 0.55, 0.034);
    poly(c, f.p.metal, MAUL_HEAD, 0.02, OW);
    limb(c, f.p.dark, 0.44, -0.12, 0.44, 0.12, 0.018, 0.018, 0.006, 0);
    limb(c, f.p.dark, 0.6, -0.12, 0.6, 0.12, 0.018, 0.018, 0.006, 0);
    line(c, f.p.metal, HI, 0.01, 0.4, 0.09, 0.64, 0.1);
    return;
  }
  if (style === 'piston') {
    limb(c, f.p.dark, -0.14, 0, 0.5, 0, 0.045, 0.05, 0.012, OW);
    limb(c, f.p.armour, 0.1, 0.0, 0.5, 0.0, 0.07, 0.07, 0.02, OW);
    // Steam piston: a brass cylinder with rivets and a vent that hisses.
    poly(c, f.p.metal, PISTON_HEAD, 0.025, OW);
    for (const y of [-0.1, 0, 0.1]) fillEll(c, f.p.trim, BASE, 0.54, y, 0.014, 0.014);
    limb(c, f.p.trim, 0.14, 0.07, 0.4, 0.14, 0.026, 0.026, 0.01, OW * 0.8);
    upDir(f, UP);
    for (let i = 0; i < 3; i++) {
      const ph = (f.t * 1.2 + i / 3) % 1;
      puff(c, SMOKE, 0.28 + UP.x * ph * 0.3 - ph * 0.04, 0.18 + UP.y * ph * 0.3, 0.025 + ph * 0.05, (1 - ph) * 0.7);
    }
    return;
  }
  haft(f, -0.12, 0.52, 0.034);
  line(c, f.p.leather, BASE, 0.036, -0.08, 0, 0.12, 0);
  pommel(f, -0.14, 0.04);
  poly(c, f.p.metal, MACE_HEAD, 0.025, OW);
  ell(c, f.p.trim, 0.63, 0, 0.045, 0.06, 0, 0.012, OW * 0.7);
  line(c, f.p.metal, HI, 0.01, 0.55, 0.07, 0.68, 0.1);
  ell(c, f.p.trim, 0.48, 0, 0.03, 0.045, 0, 0.01, OW * 0.8);
}

function gun(f: F, style: 'arquebus' | 'musket' | 'blunderbuss' | 'steamgun'): void {
  const c = f.ctx;
  if (style === 'steamgun') {
    blob(c, f.p.dark, STOCK, 0.025, OW);
    limb(c, f.p.armour, 0.05, 0.02, 1.0, 0.02, 0.05, 0.04, 0.018, OW);
    for (const x of [0.3, 0.6, 0.88]) limb(c, f.p.trim, x, -0.03, x, 0.07, 0.014, 0.014, 0.006, OW * 0.6);
    // Pressure tank under the barrel with a little gauge.
    ell(c, f.p.armour, 0.38, -0.12, 0.17, 0.065, 0, 0.02, OW);
    fillEll(c, f.p.trim, BASE, 0.42, -0.12, 0.03, 0.03);
    fillEll(c, f.p.dark, BASE, 0.42, -0.12, 0.018, 0.018);
    line(c, f.p.trim, BASE, 0.01, 0.42, -0.12, 0.42 + Math.cos(f.t * 2) * 0.012, -0.12 + 0.016);
    fillEll(c, f.p.dark, BASE, 1.0, 0.02, 0.03, 0.03);
    upDir(f, UP);
    for (let i = 0; i < 3; i++) {
      const ph = (f.t * 1.4 + i / 3) % 1;
      puff(c, SMOKE, 1.0 + 0.08 + ph * 0.12 + UP.x * ph * 0.1, 0.03 + UP.y * ph * 0.12 + ph * 0.02, 0.02 + ph * 0.045, (1 - ph) * 0.55);
    }
    return;
  }
  const musket = style === 'musket';
  const blunder = style === 'blunderbuss';
  blob(c, f.p.wood, musket ? MUSKET_STOCK : blunder ? BLUNDER_STOCK : STOCK, 0.025, OW);
  line(c, f.p.wood, HI, 0.01, -0.28, 0.03, 0.3, -0.005);
  if (musket) {
    // Inlaid trim on the stock and a red tassel.
    for (const x of [0.2, 0.4, 0.6]) fillEll(c, f.p.trim, BASE, x, -0.01, 0.014, 0.014);
    ribbon(c, f.acc, -0.3, -0.04, Math.PI * 1.05, 0.2, 0.06, 0.03, 0.3, f.t, 0.3, f.drag, 0.01, OW * 0.7, 4);
  }
  // Barrel with brass bands.
  const end = musket ? 1.16 : blunder ? 0.66 : 1.0;
  limb(c, f.p.metal, 0.08, 0.025, end, 0.03, 0.036, 0.03, 0.016, OW);
  for (const x of musket ? [0.3, 0.6, 0.9] : blunder ? [0.25, 0.45] : [0.35, 0.7]) limb(c, f.p.trim, x, -0.012, x, 0.075, 0.012, 0.012, 0.005, OW * 0.5);
  if (blunder) poly(c, f.p.metal, FLARE, 0.02, OW);
  // Rear sight and lock.
  ell(c, f.p.trim, 0.08, 0.02, 0.035, 0.045, 0, 0.01, OW * 0.7);
  line(c, f.p.dark, BASE, 0.022, 0.06, 0.07, 0.03, 0.12);
  // Smouldering match: the cord hangs from the serpentine and glows at the tip.
  const sx = 0.05;
  const sy = 0.12;
  line(c, f.p.dark, BASE, 0.026, 0.05, 0.05, sx, sy);
  const sway = Math.sin(f.t * 3) * 0.01;
  trace(c, f.p.leather, BASE, 0.014, [sx, sy, sx - 0.06, sy + 0.04 + sway, sx - 0.1, sy - 0.04, sx - 0.18, sy - 0.1 + sway, sx - 0.28, sy - 0.08]);
  ember(f, sx + 0.02, sy + 0.015, 0.022, 0);
}

function explosive(f: F, style: 'grenade' | 'firepot' | 'bomb'): void {
  const c = f.ctx;
  if (style === 'grenade') {
    ell(c, f.p.metal, 0.14, 0.02, 0.12, 0.115, 0, 0.04, OW);
    line(c, f.p.dark, BASE, 0.014, 0.04, 0.02, 0.24, 0.02);
    line(c, f.p.dark, BASE, 0.014, 0.14, -0.08, 0.14, 0.12);
    fillEll(c, f.p.dark, BASE, 0.2, 0.1, 0.028, 0.02, 0.5);
    line(c, f.p.leather, BASE, 0.016, 0.2, 0.12, 0.23, 0.18);
    ember(f, 0.235, 0.19, 0.03, 1);
    return;
  }
  if (style === 'bomb') {
    ell(c, f.p.armour, 0.14, 0.02, 0.13, 0.12, 0, 0.04, OW);
    ell(c, f.p.trim, 0.14, 0.02, 0.05, 0.12, 0, 0.012, OW * 0.6);
    fillEll(c, f.p.trim, BASE, 0.14, 0.15, 0.035, 0.025);
    fillEll(c, f.p.dark, BASE, 0.1, 0.0, 0.032, 0.032);
    line(c, f.p.trim, BASE, 0.01, 0.1, 0.0, 0.1 + Math.cos(f.t * 3) * 0.015, 0.02);
    ember(f, 0.14, 0.2, 0.026, 2);
    return;
  }
  // Fire-pot: a clay pot, wrapped in rope, with a rag blazing in the neck.
  blob(c, f.p.wood, [0.02, 0.0, 0.06, -0.08, 0.2, -0.1, 0.3, 0.0, 0.28, 0.1, 0.2, 0.16, 0.1, 0.14, 0.04, 0.08], 0.03, OW);
  fillEll(c, f.p.dark, BASE, 0.2, 0.14, 0.07, 0.025);
  line(c, f.p.leather, BASE, 0.02, 0.06, -0.06, 0.28, 0.06);
  line(c, f.p.leather, BASE, 0.02, 0.1, 0.06, 0.28, -0.04);
  upDir(f, UP);
  const base = { x: 0.2, y: 0.16 };
  for (let i = 0; i < 4; i++) {
    const k = (f.t * 1.8 + i / 4) % 1;
    const fx = base.x + UP.x * k * 0.34 + Math.sin(f.t * 9 + i * 2) * 0.02;
    const fy = base.y + UP.y * k * 0.34;
    const r = 0.075 * (1 - k * 0.7);
    fillEll(f.ctx, i % 2 ? FLAME2 : FLAME, BASE, fx, fy, r, r * 1.2);
  }
}

/** Draw the weapon of `style` in the wrist frame. Origin is the hand; the pose angle is applied by the caller. */
export function drawWeapon(f: F, style: WeaponStyle): void {
  const c: Ctx = f.ctx;
  c.save();
  c.rotate(-Math.PI / 2);
  switch (style) {
    case 'sword':
      sword(f, false);
      break;
    case 'sabre':
      sword(f, true);
      break;
    case 'spear':
    case 'pike':
    case 'lance':
    case 'boarding':
      spear(f, style);
      break;
    case 'mace':
    case 'maul':
    case 'club':
    case 'piston':
      mace(f, style);
      break;
    case 'arquebus':
    case 'musket':
    case 'blunderbuss':
    case 'steamgun':
      gun(f, style);
      break;
    case 'grenade':
    case 'firepot':
    case 'bomb':
      explosive(f, style);
      break;
  }
  c.restore();
  // keep unused statics referenced for the bundler
  void PENNON;
  void fillBlob;
  void fillPoly;
  void metalBar;
}
