import { loadDisplayConfig } from '@m1565/content';
import { settings } from '../state/settings';
import { Store } from '../state/store';
import type { DisplayMode } from './displayMode';
import { resolveDisplayMode, tvZoom } from './displayMode';
import type { InputDevice } from './input/controls';
import { inputDevice } from './input/device';

/**
 * Applies the display mode to the page (ADR 0010): `<html data-display="tv|handheld">`, the
 * TV zoom as `--ui-zoom` and the title-safe zone as `--tv-safe`, which tv.css turns into the
 * 10-foot layout. Screens read `displayMode` only to swap touch words for button prompts.
 */
export const displayMode = new Store<DisplayMode>('handheld');

const cfg = loadDisplayConfig();
/** Remembers a gamepad player between launches, so a TV game opens in the TV layout. */
const LAST_INPUT_KEY = 'armatura.display.lastInput';

function rememberedInput(): InputDevice {
  try {
    return localStorage.getItem(LAST_INPUT_KEY) === 'gamepad' ? 'gamepad' : 'pointer';
  } catch {
    return 'pointer';
  }
}

export function installDisplay(): () => void {
  const root = document.documentElement;
  let lastInput = rememberedInput();

  const apply = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const mode = resolveDisplayMode(settings.get().display, { lastInput, width, height }, cfg);
    const zoom = mode === 'tv' ? tvZoom(width, height, cfg) : 1;
    root.dataset.display = mode;
    root.style.setProperty('--ui-zoom', String(Math.round(zoom * 1000) / 1000));
    root.style.setProperty('--tv-safe', String(mode === 'tv' ? cfg.tv.safeZone : 0));
    if (displayMode.get() !== mode) displayMode.set(mode);
  };

  const onInput = () => {
    const device = inputDevice.get();
    if (device === lastInput) return;
    lastInput = device;
    try {
      localStorage.setItem(LAST_INPUT_KEY, device);
    } catch {
      // Storage unavailable: Auto then starts handheld until the pad is used.
    }
    apply();
  };

  apply();
  const stopSettings = settings.subscribe(apply);
  const stopInput = inputDevice.subscribe(onInput);
  window.addEventListener('resize', apply);
  return () => {
    stopSettings();
    stopInput();
    window.removeEventListener('resize', apply);
  };
}
