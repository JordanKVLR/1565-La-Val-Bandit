/**
 * The game's controls, as one table per screen context. Each row is an abstract action: the
 * keyboard key the screen already listens for (`KeyboardEvent.key`), and the gamepad inputs
 * that send that same key. The gamepad never needs its own code paths in the screens, the
 * Controls help page is drawn from these rows, and prompts next to buttons read them too.
 */

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
  /** What it does, in the player's words (rows with the same text are one line in Help). */
  readonly label: string;
  /** The key the screen listens for; the gamepad sends this key too. */
  readonly key: string;
  /** How the keyboard side is written for people. */
  readonly keyLabel: string;
  /** Gamepad inputs that trigger it, the first one shown in prompts. */
  readonly pad: readonly PadInput[];
  /** How the gamepad side is written in Help, when the glyphs alone would not say it. */
  readonly padLabel?: string;
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

const arrows = (label: string, padLabel = 'D-pad / left stick'): ControlBinding[] =>
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
    keyLabel: 'Arrow keys',
    pad: [action],
    padLabel,
  }));

const CONFIRM = (label: string): ControlBinding => ({
  action: 'confirm',
  label,
  key: 'Enter',
  keyLabel: 'Enter / Space',
  pad: ['a'],
});

const BACK = (label: string, keyLabel = 'Esc'): ControlBinding => ({
  action: 'back',
  label,
  key: 'Escape',
  keyLabel,
  pad: ['b'],
});

export const CONTROLS: Readonly<Record<ControlContext, readonly ControlBinding[]>> = {
  battle: [
    ...arrows('Move the tile cursor'),
    CONFIRM('Select the tile under the cursor · confirm'),
    BACK('Back / cancel', 'Esc / right-click'),
    {
      action: 'menu',
      label: 'Battle menu',
      key: 'ContextMenu',
      keyLabel: 'Esc (with nothing to cancel)',
      pad: ['start'],
      padLabel: '☰ Menu',
    },
    {
      action: 'move',
      label: 'Move',
      key: 'm',
      keyLabel: 'M',
      pad: ['ls'],
      padLabel: 'L3 (or Ⓐ on your unit)',
    },
    { action: 'attack', label: 'Attack', key: 'a', keyLabel: 'A', pad: ['x'] },
    { action: 'endTurn', label: 'End turn', key: 'e', keyLabel: 'E', pad: ['y'] },
    {
      action: 'undo',
      label: 'Undo the move',
      key: 'u',
      keyLabel: 'U',
      pad: ['view'],
      padLabel: '⧉ View',
    },
    {
      action: 'prevUnit',
      label: 'Previous / next unit',
      key: '[',
      keyLabel: '[ ]',
      pad: ['lb'],
      padLabel: 'LB / RB',
    },
    {
      action: 'nextUnit',
      label: 'Previous / next unit',
      key: ']',
      keyLabel: '[ ]',
      pad: ['rb'],
      padLabel: 'LB / RB',
    },
    {
      action: 'rotateLeft',
      label: 'Rotate the camera',
      key: ',',
      keyLabel: ', .',
      pad: ['lt', 'rsLeft'],
      padLabel: 'LT / RT or right stick ←→',
    },
    {
      action: 'rotateRight',
      label: 'Rotate the camera',
      key: '.',
      keyLabel: ', .',
      pad: ['rt', 'rsRight'],
      padLabel: 'LT / RT or right stick ←→',
    },
    {
      action: 'zoomIn',
      label: 'Zoom',
      key: '=',
      keyLabel: '+ −  (or mouse wheel)',
      pad: ['rsUp'],
      padLabel: 'Right stick ↑↓',
    },
    {
      action: 'zoomOut',
      label: 'Zoom',
      key: '-',
      keyLabel: '+ −  (or mouse wheel)',
      pad: ['rsDown'],
      padLabel: 'Right stick ↑↓',
    },
  ],
  armoury: [
    ...arrows('Move between pilots, shelves and items'),
    CONFIRM('Choose'),
    BACK('Back / close'),
    {
      action: 'prevTab',
      label: 'Previous / next shelf',
      key: 'q',
      keyLabel: 'Q E',
      pad: ['lb'],
      padLabel: 'LB / RB',
    },
    {
      action: 'nextTab',
      label: 'Previous / next shelf',
      key: 'e',
      keyLabel: 'Q E',
      pad: ['rb'],
      padLabel: 'LB / RB',
    },
    {
      action: 'prevPilot',
      label: 'Previous / next pilot',
      key: '[',
      keyLabel: '[ ]',
      pad: ['lt'],
      padLabel: 'LT / RT',
    },
    {
      action: 'nextPilot',
      label: 'Previous / next pilot',
      key: ']',
      keyLabel: '[ ]',
      pad: ['rt'],
      padLabel: 'LT / RT',
    },
  ],
  menu: [
    ...arrows('Move between buttons'),
    CONFIRM('Press the button · next line of dialogue'),
    BACK('Back / close'),
    {
      action: 'menu',
      label: 'Open the menu (story)',
      key: 'ContextMenu',
      keyLabel: 'Esc',
      pad: ['start'],
      padLabel: '☰ Menu',
    },
    {
      action: 'prevTab',
      label: 'Previous / next tab',
      key: '[',
      keyLabel: '[ ]',
      pad: ['lb'],
      padLabel: 'LB / RB',
    },
    {
      action: 'nextTab',
      label: 'Previous / next tab',
      key: ']',
      keyLabel: '[ ]',
      pad: ['rb'],
      padLabel: 'LB / RB',
    },
    {
      action: 'scrollUp',
      label: 'Scroll',
      key: 'PageUp',
      keyLabel: 'Page Up / Down',
      pad: ['rsUp'],
      padLabel: 'Right stick ↑↓',
    },
    {
      action: 'scrollDown',
      label: 'Scroll',
      key: 'PageDown',
      keyLabel: 'Page Up / Down',
      pad: ['rsDown'],
      padLabel: 'Right stick ↑↓',
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
  return { Enter: 'Enter', Escape: 'Esc', ContextMenu: 'Esc' }[b.key] ?? b.keyLabel;
}

/** One line per distinct label, for the Controls help page. */
export function helpRows(context: ControlContext): { label: string; keys: string; pad: string }[] {
  const rows: { label: string; keys: string; pad: string }[] = [];
  for (const b of CONTROLS[context]) {
    if (rows.some((r) => r.label === b.label)) continue;
    rows.push({
      label: b.label,
      keys: b.keyLabel,
      pad: b.padLabel ?? b.pad.map((p) => PAD_GLYPHS[p]).join(' / '),
    });
  }
  return rows;
}
