import type { AttackStyle } from '@m1565/core';
import type { AttackScript, AttackScripts } from '../contract';
import { CORSAIR_SCRIPTS } from './corsair';
import { MILITIA_SCRIPTS } from './militia';
import { ORDER_SCRIPTS } from './order';
import { OTTOMAN_SCRIPTS } from './ottoman';
import { SCALA_SCRIPTS } from './scala';
import { DEFAULT_PALETTE, defaultsFor } from './styleDefaults';

/** Every authored attack script by attack id (assembled from the per-faction files). */
export const ATTACK_SCRIPTS: AttackScripts = {
  ...ORDER_SCRIPTS,
  ...MILITIA_SCRIPTS,
  ...OTTOMAN_SCRIPTS,
  ...CORSAIR_SCRIPTS,
  ...SCALA_SCRIPTS,
};

const cache = new Map<string, AttackScript>();

/**
 * The full script to play: the authored script for `attackId` (if any) with every hook it
 * leaves out filled from the style default, built with the script's own palette. Unknown ids
 * play the plain style default.
 */
export function scriptFor(attackId: string | undefined, style: AttackStyle): AttackScript {
  const key = `${attackId ?? ''}|${style}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const own = attackId ? ATTACK_SCRIPTS[attackId] : undefined;
  const palette = own?.palette ?? DEFAULT_PALETTE;
  const base = defaultsFor(style, palette);
  const out: AttackScript = {
    palette,
    ...((own?.choreograph ?? base.choreograph)
      ? { choreograph: own?.choreograph ?? base.choreograph! }
      : {}),
    ...((own?.start ?? base.start) ? { start: (own?.start ?? base.start)! } : {}),
    ...((own?.windup ?? base.windup) ? { windup: (own?.windup ?? base.windup)! } : {}),
    ...((own?.follow ?? base.follow) ? { follow: (own?.follow ?? base.follow)! } : {}),
    impactFx: own?.impactFx ?? base.impactFx!,
    ...((own?.finish ?? base.finish) ? { finish: (own?.finish ?? base.finish)! } : {}),
  };
  cache.set(key, out);
  return out;
}
