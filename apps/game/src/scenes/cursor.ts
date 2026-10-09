import type { Coord, Facing } from '@m1565/core';
import { DIRECTIONS } from '@m1565/core';

/**
 * The keyboard/gamepad tile cursor: screen directions to grid steps on the rotated isometric
 * map, and jumping between units. Pure, so it is tested without a renderer.
 */

export type CursorDir = 'up' | 'down' | 'left' | 'right';

/** Which world facing points to each screen corner (BattleView.screenFacings). */
export type ScreenCorners = Readonly<
  Record<'upLeft' | 'upRight' | 'downLeft' | 'downRight', Facing>
>;

/** The camera's starting view, for when no renderer is attached. */
export const DEFAULT_CORNERS: ScreenCorners = {
  upLeft: 'north',
  upRight: 'east',
  downLeft: 'west',
  downRight: 'south',
};

/**
 * Grid rows run diagonally on screen, so each arrow takes the diagonal a quarter turn
 * clockwise from it: ↑ goes up-right, → down-right, ↓ down-left, ← up-left. The four arrows
 * stay opposite pairs and follow the camera as it rotates.
 */
const CORNER_FOR: Readonly<Record<CursorDir, keyof ScreenCorners>> = {
  up: 'upRight',
  right: 'downRight',
  down: 'downLeft',
  left: 'upLeft',
};

/** The tile one step from `from` in a screen direction, kept on the map. */
export function stepCursor(
  from: Coord,
  dir: CursorDir,
  corners: ScreenCorners,
  map: { readonly width: number; readonly depth: number },
): Coord {
  const d = DIRECTIONS[corners[CORNER_FOR[dir]]];
  return {
    x: Math.min(map.width - 1, Math.max(0, from.x + d.x)),
    y: Math.min(map.depth - 1, Math.max(0, from.y + d.y)),
  };
}

/**
 * The next (step 1) or previous (step −1) unit after the one under the cursor, in list order,
 * wrapping around. With the cursor on no unit, starts from the first (or last).
 */
export function cycleUnit(
  units: readonly { readonly pos: Coord }[],
  cursor: Coord | undefined,
  step: 1 | -1,
): Coord | undefined {
  if (!units.length) return undefined;
  const i = cursor ? units.findIndex((u) => u.pos.x === cursor.x && u.pos.y === cursor.y) : -1;
  const next = i < 0 ? (step > 0 ? 0 : units.length - 1) : (i + step + units.length) % units.length;
  return units[next]!.pos;
}
