import type { DisplayConfig } from '@m1565/content';
import type { InputDevice } from './input/controls';

/** The player's choice in Settings. */
export type DisplaySetting = 'auto' | 'handheld' | 'tv';
/** The layout in use: the phone/Deck/desktop UI, or the TV (10-foot) UI (ADR 0010). */
export type DisplayMode = 'handheld' | 'tv';

export interface DisplayEnvironment {
  /** The input used last (gamepad, keyboard or pointer). */
  readonly lastInput: InputDevice;
  /** Viewport size in CSS pixels (unaffected by the TV zoom). */
  readonly width: number;
  readonly height: number;
}

/**
 * Which layout to use. Auto picks TV when a gamepad was the last input and the viewport is
 * big (a 1080p or 4K screen at normal scaling): a pad on a big screen is someone on a sofa.
 * The Steam Deck (1280×800), phones and a desktop played with mouse or keyboard stay handheld.
 */
export function resolveDisplayMode(
  setting: DisplaySetting,
  env: DisplayEnvironment,
  cfg: Pick<DisplayConfig, 'tvAuto'>,
): DisplayMode {
  if (setting === 'tv' || setting === 'handheld') return setting;
  const big = env.width >= cfg.tvAuto.minWidth && env.height >= cfg.tvAuto.minHeight;
  return big && env.lastInput === 'gamepad' ? 'tv' : 'handheld';
}

/**
 * How much the TV layout scales the whole UI: it is laid out as if the screen were
 * `layoutWidth × layoutHeight` CSS px (or smaller), then zoomed to fill it. Never below 1, so
 * TV mode chosen by hand on a small window does not shrink anything.
 */
export function tvZoom(width: number, height: number, cfg: Pick<DisplayConfig, 'tv'>): number {
  const fit = Math.min(width / cfg.tv.layoutWidth, height / cfg.tv.layoutHeight);
  if (!Number.isFinite(fit)) return 1;
  return Math.min(cfg.tv.maxZoom, Math.max(1, fit));
}
