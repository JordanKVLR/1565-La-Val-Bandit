import type { DisplayConfig } from '@m1565/content';
import { loadDisplayConfig } from '@m1565/content';

export interface CanvasMetrics {
  /** The canvas's layout size (`clientWidth`/`clientHeight`), in its own CSS pixels. */
  readonly cssWidth: number;
  readonly cssHeight: number;
  /** On-screen CSS pixels per layout pixel: above 1 when the TV layout zooms the page. */
  readonly cssScale: number;
  readonly devicePixelRatio: number;
}

/**
 * The pixel ratio a 3D view renders at (ADR 0010): the screen's own density, capped at
 * `maxPixelRatio`, times any CSS zoom so the TV layout stays sharp, then lowered if the
 * drawing buffer would exceed `maxRenderPixels` (a 4K canvas renders at 2560×1440 and is
 * scaled up by the browser). Phones, the Steam Deck and 1080p screens are under the cap.
 */
export function renderPixelRatio(
  m: CanvasMetrics,
  cfg: DisplayConfig['render'] = loadDisplayConfig().render,
): number {
  const density = Math.min(Math.max(m.devicePixelRatio, 0) || 1, cfg.maxPixelRatio);
  const ratio = density * (m.cssScale > 0 && Number.isFinite(m.cssScale) ? m.cssScale : 1);
  const area = m.cssWidth * m.cssHeight;
  if (area <= 0) return ratio;
  return Math.min(ratio, Math.sqrt(cfg.maxRenderPixels / area));
}

/** Measures a canvas for `renderPixelRatio` (the CSS zoom shows as rect size ÷ layout size). */
export function measureCanvas(canvas: HTMLCanvasElement): CanvasMetrics {
  const rect = canvas.getBoundingClientRect();
  const cssWidth = canvas.clientWidth;
  return {
    cssWidth,
    cssHeight: canvas.clientHeight,
    cssScale: cssWidth > 0 ? rect.width / cssWidth : 1,
    devicePixelRatio: window.devicePixelRatio,
  };
}
