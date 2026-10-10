import type { JSX } from 'preact';

/**
 * Inline SVG glyphs, drawn for this game on a 24-unit grid with one stroke weight (1.75,
 * round caps and joins) so they sit together. They take the text colour (`currentColor`) and
 * size (1em, or `size`). Decorative by default: the control they sit in carries the name.
 *
 * Add new glyphs here rather than using emoji or font icons (docs/DESIGN.md, Iconography).
 */
const PATHS = {
  // Commands
  move: 'M4.5 19c4 0 5-3 7-6.5S15.5 7 19.5 7M16 3.5 19.5 7 16 10.5',
  attack: 'M4 4l10.5 10.5M12.5 16.5l4-4M14.5 14.5l5 5M20 4 9.5 14.5M11.5 16.5l-4-4M9.5 14.5l-5 5',
  undo: 'M9 14 4.5 9.5 9 5M4.5 9.5H14a5.5 5.5 0 0 1 0 11h-3',
  endTurn:
    'M6.5 3.5h11M6.5 20.5h11M8 3.5c0 4.5 4 5.5 4 8.5s-4 4-4 8.5M16 3.5c0 4.5-4 5.5-4 8.5s4 4 4 8.5M10 18h4',
  confirm: 'M4.5 12.5l5 5 10-11',
  back: 'M14.5 5.5 8 12l6.5 6.5',
  close: 'M6 6l12 12M18 6 6 18',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5.5M12 7.75h.01',
  menu: 'M4.5 7h15M4.5 12h15M4.5 17h15',
  rotateLeft: 'M5 9.5A7.5 7.5 0 1 1 6.2 16.8M4.5 4.5v5h5',
  rotateRight: 'M19 9.5A7.5 7.5 0 1 0 17.8 16.8M19.5 4.5v5h-5',
  warning: 'M12 4 2.8 19.5h18.4ZM12 10v4.5M12 17.25h.01',
  chevronRight: 'M9.5 5.5 16 12l-6.5 6.5',
  plus: 'M12 5v14M5 12h14',
  // Ornaments (period flavour through restraint)
  cross:
    'M12 12 8.3 3.5 12 5.6l3.7-2.1ZM12 12l8.5-3.7-2.1 3.7 2.1 3.7ZM12 12l3.7 8.5-3.7-2.1-3.7 2.1ZM12 12 3.5 15.7 5.6 12 3.5 8.3Z',
  crescent: 'M15.5 4.2a8.2 8.2 0 1 0 0 15.6 6.6 6.6 0 1 1 0-15.6Z',
  diamond: 'M12 4.5 19.5 12 12 19.5 4.5 12Z',
  circle: 'M12 19.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z',
} as const;

export type IconName = keyof typeof PATHS;

/** Glyphs drawn filled rather than stroked (the ornaments and side marks). */
const FILLED: ReadonlySet<IconName> = new Set(['cross', 'crescent', 'diamond', 'circle']);

export function Icon({
  name,
  size,
  class: className,
  label,
}: {
  name: IconName;
  /** CSS size; defaults to 1em so the glyph follows the text. */
  size?: string;
  class?: string;
  /** Only for a glyph that means something on its own; otherwise it stays hidden. */
  label?: string;
}): JSX.Element {
  const filled = FILLED.has(name);
  return (
    <svg
      class={`ds-icon${className ? ` ${className}` : ''}`}
      viewBox="0 0 24 24"
      width={size ?? '1em'}
      height={size ?? '1em'}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      focusable="false"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' })}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

export const ICON_NAMES = Object.keys(PATHS) as IconName[];
