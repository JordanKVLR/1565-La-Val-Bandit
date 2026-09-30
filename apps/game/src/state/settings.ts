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
}

const KEY = 'armatura.settings.v1';

const DEFAULTS: Settings = {
  battleSpeed: 1,
  closeUps: true,
  textSize: 'normal',
  musicVolume: 0.6,
  sfxVolume: 0.8,
  fullscreen: true,
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export const settings = new Store<Settings>(load());

settings.subscribe(() => {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings.get()));
  } catch {
    // Storage can be unavailable (private mode); settings then last for the session only.
  }
});
