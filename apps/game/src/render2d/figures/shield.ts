import { knightShield } from './knight';
import { militiaShield } from './militia';
import { corsairBuckler } from './corsair';
import { ottomanShield } from './sipahi';
import type { F } from './types';

/**
 * The off-hand round shield, drawn at the off hand (forearm end). Each model paints its own; the
 * rig only asks for one when the look says it carries one for the weapon (`Look.shield`).
 */
export function drawShield(f: F): void {
  switch (f.spec.model) {
    case 'janissary':
    case 'sipahi':
      ottomanShield(f);
      return;
    case 'militia':
      militiaShield(f);
      return;
    case 'corsair':
      corsairBuckler(f);
      return;
    default:
      knightShield(f);
  }
}
