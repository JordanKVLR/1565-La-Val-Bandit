import type { PadButton, PadInput } from './controls';

/**
 * Pure gamepad logic: which inputs a pad is holding, and which of them fire this frame (with
 * key-style auto-repeat for directions). No browser APIs, so it is tested with mock pads.
 */

/** The parts of the browser's `Gamepad` this module reads. */
export interface PadLike {
  readonly buttons: readonly { readonly pressed: boolean; readonly value: number }[];
  readonly axes: readonly number[];
  readonly mapping?: string;
  readonly connected?: boolean;
}

/** Button order of the W3C "standard" mapping (what the Steam Deck and Xbox pads report). */
export const STANDARD_BUTTONS: readonly PadButton[] = [
  'a',
  'b',
  'x',
  'y',
  'lb',
  'rb',
  'lt',
  'rt',
  'view',
  'start',
  'ls',
  'rs',
  'up',
  'down',
  'left',
  'right',
  'home',
];

/** How far a stick or analogue trigger must go before it counts as pressed. */
export const STICK_THRESHOLD = 0.5;
export const TRIGGER_THRESHOLD = 0.5;

/** The stick's direction along its stronger axis, so a diagonal never moves two ways at once. */
function stickDirection(
  x: number,
  y: number,
  threshold: number,
): 'up' | 'down' | 'left' | 'right' | null {
  if (Math.max(Math.abs(x), Math.abs(y)) < threshold) return null;
  if (Math.abs(x) > Math.abs(y)) return x > 0 ? 'right' : 'left';
  return y > 0 ? 'down' : 'up';
}

/** Every input the pad is holding. The left stick counts as the D-pad. */
export function heldInputs(pad: PadLike, threshold = STICK_THRESHOLD): Set<PadInput> {
  const held = new Set<PadInput>();
  if (pad.connected === false) return held;
  STANDARD_BUTTONS.forEach((name, i) => {
    const b = pad.buttons[i];
    if (!b) return;
    const analogue = name === 'lt' || name === 'rt';
    if (b.pressed || (analogue && b.value > TRIGGER_THRESHOLD)) held.add(name);
  });
  const left = stickDirection(pad.axes[0] ?? 0, pad.axes[1] ?? 0, threshold);
  if (left) held.add(left);
  const right = stickDirection(pad.axes[2] ?? 0, pad.axes[3] ?? 0, threshold);
  if (right) {
    held.add(({ up: 'rsUp', down: 'rsDown', left: 'rsLeft', right: 'rsRight' } as const)[right]);
  }
  return held;
}

/** Inputs held on any of the pads (two pads, or a Deck with a pad plugged in, both work). */
export function heldOnAny(pads: readonly (PadLike | null | undefined)[]): Set<PadInput> {
  const held = new Set<PadInput>();
  for (const p of pads) if (p) for (const i of heldInputs(p)) held.add(i);
  return held;
}

export interface Repeat {
  /** Time before the first repeat, ms. */
  readonly delay: number;
  /** Time between repeats after that, ms. */
  readonly interval: number;
}

/** Directions repeat like held arrow keys; the right stick zooms smoothly and rotates slowly. */
export const REPEATS: Readonly<Partial<Record<PadInput, Repeat>>> = {
  up: { delay: 320, interval: 110 },
  down: { delay: 320, interval: 110 },
  left: { delay: 320, interval: 110 },
  right: { delay: 320, interval: 110 },
  rsUp: { delay: 120, interval: 80 },
  rsDown: { delay: 120, interval: 80 },
  rsLeft: { delay: 450, interval: 450 },
  rsRight: { delay: 450, interval: 450 },
};

/**
 * Turns "held this frame" into "fired this frame": an input fires when first pressed and,
 * if it repeats, again while held. Feed it the held set and the time each frame.
 */
export class PadTracker {
  private readonly held = new Map<PadInput, number>();

  constructor(private readonly repeats: Readonly<Partial<Record<PadInput, Repeat>>> = REPEATS) {}

  update(now: ReadonlySet<PadInput>, time: number): PadInput[] {
    const fired: PadInput[] = [];
    for (const input of this.held.keys()) if (!now.has(input)) this.held.delete(input);
    for (const input of now) {
      const repeat = this.repeats[input];
      const next = this.held.get(input);
      if (next === undefined) {
        fired.push(input);
        this.held.set(input, repeat ? time + repeat.delay : Infinity);
      } else if (repeat && time >= next) {
        fired.push(input);
        this.held.set(input, time + repeat.interval);
      }
    }
    return fired;
  }

  /** Forget what was held (e.g. the window lost focus). */
  reset(): void {
    this.held.clear();
  }
}
