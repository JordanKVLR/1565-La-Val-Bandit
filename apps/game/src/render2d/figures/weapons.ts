import type { WeaponType } from '@m1565/core';
import type { Ctx } from './kit';
import { corsairWeapon } from './corsairArms';
import { knightMace, knightSpear, knightSword } from './knightArms';
import { machineWeapon } from './machineArms';
import { militiaWeapon } from './militiaArms';
import type { ArmaturaModel, F } from './types';
import { janissaryWeapon, ottomanGrenade, ottomanGun } from './janissaryArms';
import { sipahiWeapon } from './sipahiArms';

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

/** Draw the weapon of `style` in the wrist frame. Origin is the hand; the pose angle is applied by the caller. */
export function drawWeapon(f: F, style: WeaponStyle): void {
  const c: Ctx = f.ctx;
  c.save();
  c.rotate(-Math.PI / 2);
  switch (f.spec.model) {
    case 'knight':
      knightWeapon(f, style);
      break;
    case 'militia':
    case 'gunner':
      militiaWeapon(f, style);
      break;
    case 'corsair':
    case 'barge':
      corsairWeapon(f, style, f.spec.model === 'barge');
      break;
    case 'janissary':
      janissaryWeapon(f, style);
      break;
    case 'sipahi':
      sipahiWeapon(f, style);
      break;
    case 'machine':
    case 'tower':
      machineWeapon(f, style);
      break;
  }
  c.restore();
}

/** The knight carries the blade, spear and mace of his own kit and borrows the Ottoman gun and grenade. */
function knightWeapon(f: F, style: WeaponStyle): void {
  switch (style) {
    case 'sword':
      knightSword(f);
      break;
    case 'spear':
      knightSpear(f);
      break;
    case 'mace':
      knightMace(f);
      break;
    case 'arquebus':
      ottomanGun(f, false);
      break;
    case 'grenade':
      ottomanGrenade(f);
      break;
  }
}
