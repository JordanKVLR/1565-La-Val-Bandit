import { describe, expect, it } from 'vitest';
import { loadDisplayConfig } from '../src';

describe('display tuning', () => {
  const cfg = loadDisplayConfig();

  it('loads with a 5% title-safe zone and a TV layout that scales 1080p text to ≥28 px', () => {
    expect(cfg.tv.safeZone).toBeCloseTo(0.05);
    // 16 px body text at the TV scale on a 1920×1080 screen.
    const zoom = Math.min(1080 / cfg.tv.layoutHeight, 1920 / cfg.tv.layoutWidth);
    expect(16 * zoom).toBeGreaterThanOrEqual(28);
  });

  it('keeps phones, the Steam Deck and 1080p under the render cap, and caps 4K', () => {
    const pixels = (w: number, h: number, dpr: number) =>
      w * h * Math.min(dpr, cfg.render.maxPixelRatio) ** 2;
    expect(pixels(915, 412, 2.625)).toBeLessThanOrEqual(cfg.render.maxRenderPixels); // Pixel 6a
    expect(pixels(1280, 800, 1)).toBeLessThanOrEqual(cfg.render.maxRenderPixels); // Steam Deck
    expect(pixels(1920, 1080, 1)).toBeLessThanOrEqual(cfg.render.maxRenderPixels);
    expect(pixels(3840, 2160, 1)).toBeGreaterThan(cfg.render.maxRenderPixels);
  });

  it('rejects unknown keys and out-of-range values', () => {
    expect(() => loadDisplayConfig({ ...cfg, extra: 1 })).toThrow();
    expect(() => loadDisplayConfig({ ...cfg, tv: { ...cfg.tv, maxZoom: 0.5 } })).toThrow();
    expect(() => loadDisplayConfig({ ...cfg, tv: { ...cfg.tv, safeZone: 0.4 } })).toThrow();
  });
});
