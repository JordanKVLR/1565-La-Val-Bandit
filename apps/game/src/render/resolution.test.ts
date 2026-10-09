import { loadDisplayConfig } from '@m1565/content';
import { describe, expect, it } from 'vitest';
import { renderPixelRatio } from './resolution';

const cfg = loadDisplayConfig().render;
const buffer = (w: number, h: number, ratio: number) =>
  Math.round(w * ratio) * Math.round(h * ratio);

describe('render pixel ratio', () => {
  it('leaves phones, the Steam Deck and 1080p as before (density capped at 2)', () => {
    // Pixel 6a landscape: 2.625 density, capped at 2 as the renderer always did.
    expect(
      renderPixelRatio(
        { cssWidth: 915, cssHeight: 412, cssScale: 1, devicePixelRatio: 2.625 },
        cfg,
      ),
    ).toBe(2);
    expect(
      renderPixelRatio({ cssWidth: 1280, cssHeight: 800, cssScale: 1, devicePixelRatio: 1 }, cfg),
    ).toBe(1);
    expect(
      renderPixelRatio({ cssWidth: 1920, cssHeight: 1080, cssScale: 1, devicePixelRatio: 1 }, cfg),
    ).toBe(1);
  });

  it('caps a 4K canvas at 2560×1440 internal pixels', () => {
    const r = renderPixelRatio(
      { cssWidth: 3840, cssHeight: 2160, cssScale: 1, devicePixelRatio: 1 },
      cfg,
    );
    expect(r).toBeCloseTo(2 / 3);
    expect(buffer(3840, 2160, r)).toBeLessThanOrEqual(cfg.maxRenderPixels + 4000);
    // The same 4K screen at 200% OS scaling (1920×1080 CSS px at density 2).
    const hiDpi = renderPixelRatio(
      { cssWidth: 1920, cssHeight: 1080, cssScale: 1, devicePixelRatio: 2 },
      cfg,
    );
    expect(buffer(1920, 1080, hiDpi)).toBeLessThanOrEqual(cfg.maxRenderPixels + 4000);
  });

  it('renders the zoomed TV layout at the screen resolution, within the cap', () => {
    // 1080p TV: the canvas is laid out at 1067×600 and zoomed 1.8× onto 1920×1080 pixels.
    const tv1080 = renderPixelRatio(
      { cssWidth: 1067, cssHeight: 600, cssScale: 1.8, devicePixelRatio: 1 },
      cfg,
    );
    expect(tv1080).toBeCloseTo(1.8);
    // 4K TV: zoomed 3.6×, so the cap applies just as without TV mode.
    const tv4k = renderPixelRatio(
      { cssWidth: 1067, cssHeight: 600, cssScale: 3.6, devicePixelRatio: 1 },
      cfg,
    );
    expect(buffer(1067, 600, tv4k)).toBeLessThanOrEqual(cfg.maxRenderPixels + 4000);
    expect(buffer(1067, 600, tv4k)).toBeGreaterThan(cfg.maxRenderPixels * 0.95);
  });

  it('copes with odd measurements', () => {
    expect(
      renderPixelRatio({ cssWidth: 0, cssHeight: 0, cssScale: 0, devicePixelRatio: 0 }, cfg),
    ).toBe(1);
    expect(
      renderPixelRatio({ cssWidth: 800, cssHeight: 400, cssScale: NaN, devicePixelRatio: 3 }, cfg),
    ).toBe(2);
  });
});
