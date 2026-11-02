import type { ArmaturaModel } from '@m1565/content';
import { corsair } from './corsair';
import {  } from './humans';
import { gunner } from './gunner';
import { janissary } from './janissary';
import { knight } from './knight';
import { sipahi } from './sipahi';
import { machine } from './machine';
import { barge } from './barge';
import { tower } from './tower';
import { militia } from './militia';
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
