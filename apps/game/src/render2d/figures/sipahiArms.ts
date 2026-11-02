import { Frame, K, Shape, flag, inkR, mkPath, paint, rivetPath, rivets, seam, streak } from './kit';
import {
  armMats,
  ottomanGrenade,
  ottomanGun,
  ottomanKilij,
  ottomanMace,
  pxIn,
  wShape,
} from './janissaryArms';
import type { F } from './types';
import type { WeaponStyle } from './weapons';

/**
 * The sipahi's weapons: the slim kilij, the lance with a streaming pennon, a gold flanged mace,
 * the short arquebus and the grenado (the shared ones live in janissaryArms.ts). Weapon space,
 * authored in reference pixels like the rest of the Ottoman arms.
 */

const LN_SHAFT = wShape('M -280 -12 L 900 -11 L 900 11 L -280 12 Z', 12);
const LN_BUTT = wShape('M -296 -15 L -274 -15 L -274 15 L -296 15 Z', 15);
const LN_HEAD = wShape('M 884 -12 L 920 -30 L 969 0 L 920 30 L 884 12 Z', 30);
const LN_RIDGE = mkPath('M 890 0 L 960 0');
const LN_COLLAR = wShape('M 868 -17 L 892 -17 L 892 17 L 868 17 Z', 17);
const LN_PLATE = wShape('M 150 -66 C 196 -44, 196 44, 150 66 C 116 44, 116 -44, 150 -66 Z', 66);
const LN_PLATE_RIVETS = rivetPath([146, -34, 146, 0, 146, 34], 4.4);
const LN_GRIP = wShape('M -70 -16 L 120 -15 L 120 15 L -70 16 Z', 16);
const LN_WRAP = (() => {
  const p = mkPath();
  for (let i = 0; i < 8; i++) {
    p.moveTo(-62 + i * 24, -14);
    p.lineTo(-44 + i * 24, 14);
  }
  return p;
})();
const FR_PENNON = new Frame(0, 90, 0, -90);

/** The sipahi lance: a long haft, a hand plate, a diamond head and a swallow pennon in the side colour. */
export function sipahiLance(f: F): void {
  const c = f.ctx;
  const m = armMats(f);
  pxIn(c);
  const acc = f.acc.as('cloth');
  // The pennon streams behind the head (drawn first so the head sits on its root).
  flag(
    c,
    acc,
    FR_PENNON,
    872,
    6,
    Math.PI - 0.22,
    -0.25,
    320,
    130,
    26,
    0.2,
    f.t,
    0.5,
    f.drag,
    inkR(4.5),
    8,
  );
  flag(
    c,
    m.brass,
    FR_PENNON,
    872,
    -26,
    Math.PI - 0.5,
    -0.2,
    240,
    60,
    14,
    0.26,
    f.t,
    1.8,
    f.drag,
    inkR(4),
    7,
  );
  paint(c, LN_SHAFT, m.wood, inkR(5));
  paint(c, LN_GRIP, m.leather, inkR(4.5));
  if (K.lod > 0) {
    c.lineWidth = inkR(2.5);
    c.strokeStyle = m.brass.at(0);
    c.stroke(LN_WRAP);
  }
  paint(c, LN_BUTT, m.brass, inkR(4));
  paint(c, LN_PLATE, m.steel, inkR(5));
  rivets(c, LN_PLATE_RIVETS, inkR(1.5));
  paint(c, LN_HEAD, m.steel, inkR(5));
  if (K.lod > 0) {
    seam(c, LN_RIDGE, inkR(3.5), 0.5);
    streak(c, LN_HI, inkR(3), 0.6);
  }
  paint(c, LN_COLLAR, m.brass, inkR(4));
  c.restore();
}
const LN_HI = mkPath('M 900 -9 L 940 -2');
void Shape;

/** Dispatch for the sipahi: returns true when it drew the weapon. */
export function sipahiWeapon(f: F, style: WeaponStyle): boolean {
  switch (style) {
    case 'sabre':
      ottomanKilij(f, true);
      return true;
    case 'lance':
      sipahiLance(f);
      return true;
    case 'mace':
      ottomanMace(f, true);
      return true;
    case 'arquebus':
      ottomanGun(f, false);
      return true;
    case 'grenade':
      ottomanGrenade(f);
      return true;
    default:
      return false;
  }
}
