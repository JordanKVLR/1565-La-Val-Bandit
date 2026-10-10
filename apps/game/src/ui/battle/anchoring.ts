import type { Insets } from '../design';

/**
 * Margins a panel anchored beside a unit keeps inside the anchor layer (`.bhud-layer`): the HUD
 * along the top, the screen edge, and in TV mode the title-safe area (the layer reaches past it,
 * like the canvas). The same margins as the action bar's, so a technique list or the facing
 * picker opens where the bar stood.
 */
export function anchorInsets(layer: HTMLElement): Insets {
  const safeX = Math.max(0, -layer.offsetLeft);
  const safeY = Math.max(0, -layer.offsetTop);
  const edge = 12;
  return { top: safeY + 64, right: safeX + edge, bottom: safeY + edge, left: safeX + edge };
}
