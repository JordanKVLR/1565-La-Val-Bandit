import { readJson, writeJson } from '../platform/storage';
import { Store } from './store';

export interface Settings {
  /** Animation speed multiplier for moves, AI pacing and close-ups. */
  battleSpeed: 1 | 2 | 4;
  closeUps: boolean;
  textSize: 'normal' | 'large';
  musicVolume: number;
  sfxVolume: number;
  /** Hide the browser's bars. Leaving full screen on purpose is done by switching this off. */
  fullscreen: boolean;
  /** Bolder map highlights and outlines, with the map dimmed behind them. */
  highContrast: boolean;
}

const KEY = 'armatura.settings.v1';

const DEFAULTS: Settings = {
  battleSpeed: 1,
  closeUps: true,
  textSize: 'normal',
  musicVolume: 0.6,
  sfxVolume: 0.8,
  fullscreen: true,
  highContrast: false,
};

function load(): Settings {
  return { ...DEFAULTS, ...readJson<Partial<Settings>>(KEY) };
}

export const settings = new Store<Settings>(load());

// Saved at once and crash-safely (platform/storage). If storage is unavailable (private mode)
// the settings last for the session only.
settings.subscribe(() => void writeJson(KEY, settings.get()));
