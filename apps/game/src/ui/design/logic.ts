/**
 * The design system's logic, kept free of the DOM so it is unit tested (logic.test.ts):
 * class names, meter geometry, the two-step danger confirm, anchoring a bar beside a point on
 * the map, and the focus trap's next stop.
 */

/** Joins class names, skipping empty ones: `cx('ds-btn', on && 'is-on')`. */
export function cx(...names: ReadonlyArray<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ');
}

// ── Meter ─────────────────────────────────────────────────────────────────

export interface MeterModel {
  /** The value after the previewed change, clamped to 0..max. */
  readonly after: number;
  /** Width of the solid fill, 0–100 (%). */
  readonly fill: number;
  /** Where the preview segment starts and how wide it is, 0–100 (%); width 0 = no preview. */
  readonly previewFrom: number;
  readonly previewWidth: number;
  /** A cost (the segment is about to empty) or a gain (about to fill). */
  readonly preview: 'cost' | 'gain' | null;
  /** The text after the label: "93/93", "100→44", or just "14" without a max. */
  readonly text: string;
  /** At or under a quarter (used for a low-HP cue that is not colour alone). */
  readonly low: boolean;
}

const pct = (v: number, max: number) => (max > 0 ? Math.max(0, Math.min(100, (v / max) * 100)) : 0);

/**
 * Geometry and text of a meter. `delta` previews a change: negative for a cost (AP about to be
 * spent, HP about to be lost), positive for a gain (FP about to be added).
 */
export function meterModel(
  value: number,
  max: number,
  delta = 0,
  opts: { showMax?: boolean } = {},
): MeterModel {
  const showMax = opts.showMax ?? true;
  const after = Math.max(0, Math.min(max, value + delta));
  const solid = Math.min(value, after);
  const previewFrom = pct(solid, max);
  const previewWidth = pct(Math.max(value, after), max) - previewFrom;
  const changing = after !== value;
  return {
    after,
    fill: pct(solid, max),
    previewFrom,
    previewWidth,
    preview: !changing ? null : after < value ? 'cost' : 'gain',
    text: changing ? `${value}→${after}` : showMax ? `${value}/${max}` : `${value}`,
    low: max > 0 && value / max <= 0.25,
  };
}

// ── Danger confirm ────────────────────────────────────────────────────────

/** A danger button needs two presses: the first arms it, the second acts. */
export type ConfirmState = 'idle' | 'armed';
export type ConfirmEvent = 'press' | 'timeout' | 'blur';

/** The next state and whether the action fires. Without a confirm step every press fires. */
export function confirmStep(
  state: ConfirmState,
  event: ConfirmEvent,
  needsConfirm: boolean,
): { state: ConfirmState; fire: boolean } {
  if (event !== 'press') return { state: 'idle', fire: false };
  if (!needsConfirm || state === 'armed') return { state: 'idle', fire: true };
  return { state: 'armed', fire: false };
}

/** How long an armed danger button waits for its second press. */
export const CONFIRM_TIMEOUT_MS = 3500;

// ── Anchoring beside a point ──────────────────────────────────────────────

export interface Size {
  readonly width: number;
  readonly height: number;
}
export interface Point {
  readonly x: number;
  readonly y: number;
}
export interface Insets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export interface AnchorOptions {
  /** Horizontal gap between the point and the bar. */
  readonly gap?: number;
  /** Moves the bar's vertical centre up from the point (a unit stands above its tile). */
  readonly lift?: number;
  /**
   * Which side to try first; `outward` (the default) takes the side towards the nearer screen
   * edge, so the bar covers less of the middle of the map.
   */
  readonly prefer?: 'right' | 'left' | 'outward';
  /** Points the bar should not cover (other units); the spot covering fewer wins. */
  readonly avoid?: readonly Point[] | undefined;
  /** How close to the bar an avoided point may be (default 16 px). */
  readonly avoidMargin?: number;
  /**
   * Points the bar should keep clear where it can, weighed below `avoid` (the tiles of the
   * movement range). With them the bar may also stand just past the range's edge, level with
   * the point, instead of right beside it.
   */
  readonly keepClear?: readonly Point[] | undefined;
  /** How close to the bar a kept-clear point may be (default 12 px, about half a tile). */
  readonly clearMargin?: number;
  /**
   * When even the best spot beside the point covers more than this many `keepClear` points,
   * the bar docks in the bottom-right corner if that covers less. Unset: it never docks.
   */
  readonly dockAbove?: number;
}

export interface AnchorPlacement {
  readonly x: number;
  readonly y: number;
  /** Beside the point (`right`/`left`), or docked in the bottom-right corner. */
  readonly side: 'right' | 'left' | 'dock';
}

/** A unit covered costs as much as this many kept-clear tiles. */
const AVOID_WEIGHT = 4;

/**
 * Where to put a bar of `bar` size beside `point` inside an area of `area` size, keeping
 * `insets` clear (HUD, title-safe margins). Returns its top-left corner.
 *
 * Candidates are the two sides right beside the point and, when there are points to keep
 * clear, the two spots just past the outermost of them level with the bar. A spot that fits
 * (is not pushed back over the point by the screen edge) beats one that does not; then the
 * one covering less wins (units weigh more than kept-clear tiles), then the nearer one, then
 * the preferred side. If the winner still covers more than `dockAbove` kept-clear points, the
 * bottom-right corner is taken instead when it covers less.
 */
export function placeBeside(
  point: Point,
  bar: Size,
  area: Size,
  insets: Insets,
  opts: AnchorOptions = {},
): AnchorPlacement {
  const gap = opts.gap ?? 40;
  const lift = opts.lift ?? 0;
  const prefer =
    (opts.prefer ?? 'outward') === 'outward'
      ? point.x >= area.width / 2
        ? 'right'
        : 'left'
      : (opts.prefer as 'right' | 'left');
  const minX = insets.left;
  const maxX = area.width - insets.right - bar.width;
  const minY = insets.top;
  const maxY = area.height - insets.bottom - bar.height;
  const clamp = (v: number, lo: number, hi: number) =>
    hi < lo ? lo : Math.min(Math.max(v, lo), hi);
  const y = Math.round(clamp(point.y - lift - bar.height / 2, minY, maxY));
  const avoidMargin = opts.avoidMargin ?? 16;
  const clearMargin = opts.clearMargin ?? 12;
  const keepClear = opts.keepClear ?? [];
  const count = (pts: readonly Point[], x: number, top: number, m: number) =>
    pts.filter(
      (p) =>
        p.x >= x - m && p.x <= x + bar.width + m && p.y >= top - m && p.y <= top + bar.height + m,
    ).length;
  const measure = (x: number, top: number) => {
    const units = count(opts.avoid ?? [], x, top, avoidMargin);
    const tiles = count(keepClear, x, top, clearMargin);
    return { tiles, cost: units * AVOID_WEIGHT + tiles };
  };
  const candidate = (side: 'right' | 'left', raw: number, rank: number) => {
    const x = Math.round(clamp(raw, minX, maxX));
    // Pushed back over the point by the screen edge: the bar would cover what it serves.
    const fits = side === 'right' ? raw <= maxX : raw >= minX;
    const distance = Math.abs(x + bar.width / 2 - point.x);
    return { x, y, side, fits, rank, distance, ...measure(x, y) };
  };
  const other = prefer === 'right' ? 'left' : 'right';
  const near = (side: 'right' | 'left') =>
    side === 'right' ? point.x + gap : point.x - gap - bar.width;
  const candidates = [candidate(prefer, near(prefer), 0), candidate(other, near(other), 1)];
  // Just past the range's edge, level with the bar (only the tiles in its band matter).
  const band = keepClear.filter(
    (p) => p.y >= y - clearMargin && p.y <= y + bar.height + clearMargin,
  );
  if (band.length) {
    const right = Math.max(...band.map((p) => p.x)) + clearMargin + 1;
    const left = Math.min(...band.map((p) => p.x)) - clearMargin - 1 - bar.width;
    const rank = (side: 'right' | 'left') => (side === prefer ? 2 : 3);
    if (right > near('right')) candidates.push(candidate('right', right, rank('right')));
    if (left < near('left')) candidates.push(candidate('left', left, rank('left')));
  }
  const best = candidates.reduce((a, b) => {
    if (a.fits !== b.fits) return a.fits ? a : b;
    if (a.cost !== b.cost) return a.cost < b.cost ? a : b;
    if (Math.abs(a.distance - b.distance) > 1) return a.distance < b.distance ? a : b;
    return a.rank <= b.rank ? a : b;
  });
  if (opts.dockAbove !== undefined && best.tiles > opts.dockAbove) {
    const dock = { x: Math.round(Math.max(minX, maxX)), y: Math.round(Math.max(minY, maxY)) };
    if (measure(dock.x, dock.y).cost < best.cost) return { ...dock, side: 'dock' };
  }
  return { x: best.x, y: best.y, side: best.side };
}

// ── Focus trap ────────────────────────────────────────────────────────────

/**
 * The index Tab (or Shift+Tab) moves to among `count` focusable controls, wrapping at the
 * ends. `current` is -1 when focus is outside the list (then Tab goes to the first control and
 * Shift+Tab to the last). Returns -1 when there is nothing to focus.
 */
export function nextTrapIndex(current: number, count: number, backwards: boolean): number {
  if (count <= 0) return -1;
  if (current < 0 || current >= count) return backwards ? count - 1 : 0;
  return (current + (backwards ? count - 1 : 1)) % count;
}
