import type { DisplaySetting } from '../platform/displayMode';
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
  /** Handheld or TV (10-foot) layout; Auto picks TV for a gamepad on a big screen (ADR 0010). */
  display: DisplaySetting;
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
  display: 'auto',
};

function load(): Settings {
  return { ...DEFAULTS, ...readJson<Partial<Settings>>(KEY) };
}

export const settings = new Store<Settings>(load());

// Saved at once and crash-safely (platform/storage). If storage is unavailable (private mode)
// the settings last for the session only.
settings.subscribe(() => void writeJson(KEY, settings.get()));
