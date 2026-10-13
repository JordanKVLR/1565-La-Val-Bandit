import type { ArmaturaModel } from '@m1565/content';
import { corsair, gunner, janissary, knight, militia, sipahi } from './humans';
import { barge, machine, tower } from './machines';
import type { Look } from './types';

export { paletteFor } from './palette';
export { styleFor, tipUV, drawWeapon } from './weapons';
export type { WeaponStyle } from './weapons';
export { drawShield } from './humans';
export type { F, Look, LimbStyle, Palette, Part, PersonLook } from './types';

const LOOKS: Record<ArmaturaModel, Look> = {
  knight,
  militia,
  gunner,
  janissary,
  sipahi,
  corsair,
  machine,
  barge,
  tower,
};

export function lookFor(model: ArmaturaModel): Look {
  return LOOKS[model];
}
