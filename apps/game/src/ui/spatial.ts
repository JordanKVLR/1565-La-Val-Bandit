/**
 * Spatial focus: which control lies next in a direction, judged by where controls sit on
 * screen. Lets the D-pad and arrow keys move through any menu without per-screen code.
 * Pure geometry, so it is unit-tested without a DOM.
 */

export interface Box {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export type NavDir = 'up' | 'down' | 'left' | 'right';

/** How much more a sideways offset counts than distance straight ahead. */
const SIDEWAYS_WEIGHT = 2;

/**
 * Index of the best candidate in `dir` from `from`, or -1 if there is none. A candidate must lie
 * beyond `from` in that direction (overlapping by at most half the smaller box); among those,
 * the nearest wins, with boxes in line beating ones off to the side.
 */
export function pickInDirection(from: Box, candidates: readonly Box[], dir: NavDir): number {
  const horizontal = dir === 'left' || dir === 'right';
  const sign = dir === 'right' || dir === 'down' ? 1 : -1;
  let best = -1;
  let bestScore = Infinity;
  candidates.forEach((c, i) => {
    const [fStart, fSize, cStart, cSize] = horizontal
      ? [from.left, from.width, c.left, c.width]
      : [from.top, from.height, c.top, c.height];
    const [fCross, fCrossSize, cCross, cCrossSize] = horizontal
      ? [from.top, from.height, c.top, c.height]
      : [from.left, from.width, c.left, c.width];
    // Distance from from's leading edge to the candidate's near edge.
    const gap = sign > 0 ? cStart - (fStart + fSize) : fStart - (cStart + cSize);
    const centreAhead = sign * (cStart + cSize / 2 - (fStart + fSize / 2));
    if (centreAhead <= 0 || gap < -Math.min(fSize, cSize) / 2) return;
    const crossGap = Math.max(0, cCross - (fCross + fCrossSize), fCross - (cCross + cCrossSize));
    const crossCentre = Math.abs(cCross + cCrossSize / 2 - (fCross + fCrossSize / 2));
    const score = Math.max(0, gap) + SIDEWAYS_WEIGHT * crossGap + 0.1 * crossCentre;
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}
