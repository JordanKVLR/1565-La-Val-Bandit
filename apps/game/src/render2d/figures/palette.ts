import type { FigureSpec } from '../contract';
import { sw } from './kit';
import type { ArmaturaModel, Palette, Part } from './types';

const BASE: Record<Part, string> = {
  armour: '#b8bdc6',
  cloth: '#6b5a44',
  trim: '#e8e0c8',
  skin: '#c4946c',
  dark: '#2e2a28',
  hat: '#3a3e46',
  leather: '#5e4026',
  metal: '#c9ccd4',
  wood: '#6b4a2b',
};

/** Same liveries as the 3D rig (render/Armatura.ts), brightened a touch for flat shading. */
const PALETTES: Record<ArmaturaModel | 'hero', Partial<Record<Part, string>>> = {
  knight: { cloth: '#b02230', trim: '#f3efe4', dark: '#3a3e46', skin: '#dcaa80' },
  hero: {
    armour: '#f2f1ec',
    cloth: '#c0161f',
    trim: '#e0b445',
    dark: '#7c1016',
    hat: '#f2f1ec',
    skin: '#e0b088',
  },
  militia: {
    armour: '#8a6a44',
    cloth: '#8d7552',
    trim: '#e0d3ac',
    dark: '#4a3a28',
    hat: '#d2b366',
    skin: '#cf9a6c',
  },
  gunner: { cloth: '#8c4f36', trim: '#d1aa50', dark: '#2f2a26', hat: '#a7adb6', skin: '#c98f66' },
  janissary: {
    armour: '#a39a82',
    cloth: '#2c5f9c',
    trim: '#d1aa50',
    dark: '#3e1a22',
    hat: '#f2ecdf',
    skin: '#c58c62',
  },
  sipahi: {
    armour: '#a8acb4',
    cloth: '#9a2a2a',
    trim: '#dcb048',
    dark: '#3c3236',
    hat: '#a8acb4',
    skin: '#b97f58',
  },
  corsair: {
    armour: '#6a4528',
    cloth: '#2f7d76',
    trim: '#e6d18a',
    dark: '#2a2420',
    hat: '#b0342d',
    skin: '#a8683f',
  },
  machine: {
    armour: '#a8794a',
    cloth: '#3b3530',
    trim: '#e0b455',
    dark: '#2c2622',
    hat: '#5a4a38',
    metal: '#d0c8b8',
  },
  tower: {
    armour: '#a8794a',
    cloth: '#3b3530',
    trim: '#e0b455',
    dark: '#2c2622',
    hat: '#5a4a38',
    metal: '#d0c8b8',
  },
  barge: {
    armour: '#7f6040',
    cloth: '#8d7552',
    trim: '#e0d3ac',
    dark: '#4a3a28',
    hat: '#d2b366',
    skin: '#cf9a6c',
  },
};

const CACHE = new Map<string, Palette>();

/** Swatches for a figure (cached per model and livery). */
export function paletteFor(spec: Pick<FigureSpec, 'model' | 'hero'>): Palette {
  const key = spec.hero ? 'hero' : spec.model;
  let p = CACHE.get(key);
  if (!p) {
    const raw = { ...BASE, ...PALETTES[key] };
    // The hero keeps the knight's cloth/skin where the livery does not override it.
    p = {} as Palette;
    for (const k of Object.keys(raw) as Part[]) p[k] = sw(raw[k]);
    CACHE.set(key, p);
  }
  return p;
}
