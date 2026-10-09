/**
 * The game's controls, as one table per screen context. Each row is an abstract action: the
 * keyboard key the screen already listens for (`KeyboardEvent.key`), and the gamepad inputs
 * that send that same key. The gamepad never needs its own code paths in the screens, the
 * Controls help page is drawn from these rows, and prompts next to buttons read them too.
 */

import type { MessageKey } from '../../i18n';
import { tDynamic } from '../../i18n';

/** A key into the UI string table (ADR 0012), or text that never changes, like "[ ]" or "M". */
export type ControlText = MessageKey | { readonly literal: string };

const lit = (literal: string): ControlText => ({ literal });

/** The words for a binding's label or key, in the player's language. */
export function controlText(text: ControlText): string {
  return typeof text === 'string' ? tDynamic(text) : text.literal;
}

/** Inputs of the W3C "standard" gamepad layout, named as on an Xbox pad or the Steam Deck. */
export type PadButton =
  | 'a'
  | 'b'
  | 'x'
  | 'y'
  | 'lb'
  | 'rb'
  | 'lt'
  | 'rt'
  | 'view'
  | 'start'
  | 'ls'
  | 'rs'
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'home';

/** A button, or the right stick pushed one way (the left stick doubles as the D-pad). */
export type PadInput = PadButton | 'rsUp' | 'rsDown' | 'rsLeft' | 'rsRight';

/** Which table applies: decided by what is on screen. */
export type ControlContext = 'battle' | 'armoury' | 'menu';

export type ControlAction =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'confirm'
  | 'back'
  | 'menu'
  | 'move'
  | 'attack'
  | 'endTurn'
  | 'undo'
  | 'prevUnit'
  | 'nextUnit'
  | 'rotateLeft'
  | 'rotateRight'
  | 'zoomIn'
  | 'zoomOut'
  | 'prevTab'
  | 'nextTab'
  | 'prevPilot'
  | 'nextPilot'
  | 'scrollUp'
  | 'scrollDown';

export interface ControlBinding {
  readonly action: ControlAction;
  /** What it does, in the player's words (rows with the same label are one line in Help). */
  readonly label: MessageKey;
  /** The key the screen listens for; the gamepad sends this key too. */
  readonly key: string;
  /** How the keyboard side is written for people. */
  readonly keyLabel: ControlText;
  /** Gamepad inputs that trigger it, the first one shown in prompts. */
  readonly pad: readonly PadInput[];
  /** How the gamepad side is written in Help, when the glyphs alone would not say it. */
  readonly padLabel?: ControlText;
}

/** Short glyphs for prompts next to buttons. Letters inside shapes, never colour alone. */
export const PAD_GLYPHS: Readonly<Record<PadInput, string>> = {
  a: 'Ⓐ',
  b: 'Ⓑ',
  x: 'Ⓧ',
  y: 'Ⓨ',
  lb: 'LB',
  rb: 'RB',
  lt: 'LT',
  rt: 'RT',
  view: '⧉',
  start: '☰',
  ls: 'L3',
  rs: 'R3',
  up: '✚↑',
  down: '✚↓',
  left: '✚←',
  right: '✚→',
  home: '⌂',
  rsUp: 'R↑',
  rsDown: 'R↓',
  rsLeft: 'R←',
  rsRight: 'R→',
};

const arrows = (label: MessageKey, padLabel: ControlText = 'controls.pad.dpad'): ControlBinding[] =>
  (
    [
      ['up', 'ArrowUp'],
      ['down', 'ArrowDown'],
      ['left', 'ArrowLeft'],
      ['right', 'ArrowRight'],
    ] as const
  ).map(([action, key]) => ({
    action,
    label,
    key,
    keyLabel: 'controls.key.arrows',
    pad: [action],
    padLabel,
  }));

const CONFIRM = (label: MessageKey): ControlBinding => ({
  action: 'confirm',
  label,
  key: 'Enter',
  keyLabel: 'controls.key.confirm',
  pad: ['a'],
});

const BACK = (label: MessageKey, keyLabel: ControlText = 'controls.key.esc'): ControlBinding => ({
  action: 'back',
  label,
  key: 'Escape',
  keyLabel,
  pad: ['b'],
});

export const CONTROLS: Readonly<Record<ControlContext, readonly ControlBinding[]>> = {
  battle: [
    ...arrows('controls.moveCursor'),
    CONFIRM('controls.selectTile'),
    BACK('controls.backCancel', 'controls.key.escRightClick'),
    {
      action: 'menu',
      label: 'controls.battleMenu',
      key: 'ContextMenu',
      keyLabel: 'controls.key.escNothingToCancel',
      pad: ['start'],
      padLabel: 'controls.pad.menu',
    },
    {
      action: 'move',
      label: 'controls.move',
      key: 'm',
      keyLabel: lit('M'),
      pad: ['ls'],
      padLabel: 'controls.pad.move',
    },
    { action: 'attack', label: 'controls.attack', key: 'a', keyLabel: lit('A'), pad: ['x'] },
    { action: 'endTurn', label: 'controls.endTurn', key: 'e', keyLabel: lit('E'), pad: ['y'] },
    {
      action: 'undo',
      label: 'controls.undo',
      key: 'u',
      keyLabel: lit('U'),
      pad: ['view'],
      padLabel: 'controls.pad.view',
    },
    {
      action: 'prevUnit',
      label: 'controls.cycleUnit',
      key: '[',
      keyLabel: lit('[ ]'),
      pad: ['lb'],
      padLabel: lit('LB / RB'),
    },
    {
      action: 'nextUnit',
      label: 'controls.cycleUnit',
      key: ']',
      keyLabel: lit('[ ]'),
      pad: ['rb'],
      padLabel: lit('LB / RB'),
    },
    {
      action: 'rotateLeft',
      label: 'controls.rotate',
      key: ',',
      keyLabel: lit(', .'),
      pad: ['lt', 'rsLeft'],
      padLabel: 'controls.pad.rotate',
    },
    {
      action: 'rotateRight',
      label: 'controls.rotate',
      key: '.',
      keyLabel: lit(', .'),
      pad: ['rt', 'rsRight'],
      padLabel: 'controls.pad.rotate',
    },
    {
      action: 'zoomIn',
      label: 'controls.zoom',
      key: '=',
      keyLabel: 'controls.key.zoom',
      pad: ['rsUp'],
      padLabel: 'controls.pad.rightStick',
    },
    {
      action: 'zoomOut',
      label: 'controls.zoom',
      key: '-',
      keyLabel: 'controls.key.zoom',
      pad: ['rsDown'],
      padLabel: 'controls.pad.rightStick',
    },
  ],
  armoury: [
    ...arrows('controls.moveArmoury'),
    CONFIRM('controls.choose'),
    BACK('controls.backClose'),
    {
      action: 'prevTab',
      label: 'controls.cycleShelf',
      key: 'q',
      keyLabel: lit('Q E'),
      pad: ['lb'],
      padLabel: lit('LB / RB'),
    },
    {
      action: 'nextTab',
      label: 'controls.cycleShelf',
      key: 'e',
      keyLabel: lit('Q E'),
      pad: ['rb'],
      padLabel: lit('LB / RB'),
    },
    {
      action: 'prevPilot',
      label: 'controls.cyclePilot',
      key: '[',
      keyLabel: lit('[ ]'),
      pad: ['lt'],
      padLabel: lit('LT / RT'),
    },
    {
      action: 'nextPilot',
      label: 'controls.cyclePilot',
      key: ']',
      keyLabel: lit('[ ]'),
      pad: ['rt'],
      padLabel: lit('LT / RT'),
    },
  ],
  menu: [
    ...arrows('controls.moveButtons'),
    CONFIRM('controls.pressButton'),
    BACK('controls.backClose'),
    {
      action: 'menu',
      label: 'controls.openMenu',
      key: 'ContextMenu',
      keyLabel: 'controls.key.esc',
      pad: ['start'],
      padLabel: 'controls.pad.menu',
    },
    {
      action: 'prevTab',
      label: 'controls.cycleTab',
      key: '[',
      keyLabel: lit('[ ]'),
      pad: ['lb'],
      padLabel: lit('LB / RB'),
    },
    {
      action: 'nextTab',
      label: 'controls.cycleTab',
      key: ']',
      keyLabel: lit('[ ]'),
      pad: ['rb'],
      padLabel: lit('LB / RB'),
    },
    {
      action: 'scrollUp',
      label: 'controls.scroll',
      key: 'PageUp',
      keyLabel: 'controls.key.page',
      pad: ['rsUp'],
      padLabel: 'controls.pad.rightStick',
    },
    {
      action: 'scrollDown',
      label: 'controls.scroll',
      key: 'PageDown',
      keyLabel: 'controls.key.page',
      pad: ['rsDown'],
      padLabel: 'controls.pad.rightStick',
    },
  ],
};

/** The key a gamepad input sends in this context, if it does anything there. */
export function keyForPad(context: ControlContext, input: PadInput): string | undefined {
  return CONTROLS[context].find((b) => b.pad.includes(input))?.key;
}

export type InputDevice = 'pointer' | 'keyboard' | 'gamepad';

/**
 * The prompt shown next to an action: the gamepad glyph when a pad was used last, the key
 * otherwise (touch players see neither; the CSS hides `.key` on touch screens).
 */
export function promptFor(
  action: ControlAction,
  device: InputDevice,
  context: ControlContext = 'battle',
): string {
  const b = CONTROLS[context].find((r) => r.action === action);
  if (!b) return '';
  if (device === 'gamepad') return PAD_GLYPHS[b.pad[0]!];
  // Single-letter keys read best as the letter; the rest use their short name.
  if (b.key.length === 1) return b.key.toUpperCase();
  const short: Readonly<Record<string, MessageKey>> = {
    Enter: 'controls.key.enter',
    Escape: 'controls.key.esc',
    ContextMenu: 'controls.key.esc',
  };
  return controlText(short[b.key] ?? b.keyLabel);
}

/** One line per distinct label, for the Controls help page. */
export function helpRows(context: ControlContext): { label: string; keys: string; pad: string }[] {
  const rows: { label: string; keys: string; pad: string }[] = [];
  const seen = new Set<MessageKey>();
  for (const b of CONTROLS[context]) {
    if (seen.has(b.label)) continue;
    seen.add(b.label);
    rows.push({
      label: controlText(b.label),
      keys: controlText(b.keyLabel),
      pad: b.padLabel ? controlText(b.padLabel) : b.pad.map((p) => PAD_GLYPHS[p]).join(' / '),
    });
  }
  return rows;
}
