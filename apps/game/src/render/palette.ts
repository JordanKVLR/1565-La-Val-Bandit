/**
 * Colourblind-safe colours (the Okabe–Ito set), shared by the map, figures and HUD. Nothing
 * relies on hue alone: sides also differ by badge shape, and highlights by pattern and outline.
 */
export const OKABE = {
  blue: '#0072B2',
  sky: '#56B4E9',
  orange: '#E69F00',
  vermilion: '#D55E00',
  yellow: '#F0E442',
  green: '#009E73',
  purple: '#CC79A7',
  black: '#000000',
  white: '#FFFFFF',
} as const;

/** Each side's colour: blue for the player, orange for the enemy. */
export const SIDE_COLORS = { player: '#1f6fb5', enemy: '#d0700a' } as const;
/** Lighter tints for the facing arrows on the map. */
export const ARROW_COLORS = { player: '#7cc4f5', enemy: '#ffb340' } as const;
