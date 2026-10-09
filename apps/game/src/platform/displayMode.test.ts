import { loadDisplayConfig } from '@m1565/content';
import { describe, expect, it } from 'vitest';
import type { DisplayEnvironment } from './displayMode';
import { resolveDisplayMode, tvZoom } from './displayMode';

const cfg = loadDisplayConfig();
const env = (
  lastInput: DisplayEnvironment['lastInput'],
  width: number,
  height: number,
): DisplayEnvironment => ({ lastInput, width, height });

describe('display mode', () => {
  it('Auto picks TV for a gamepad on a 1080p or 4K screen', () => {
    expect(resolveDisplayMode('auto', env('gamepad', 1920, 1080), cfg)).toBe('tv');
    expect(resolveDisplayMode('auto', env('gamepad', 3840, 2160), cfg)).toBe('tv');
    // A 4K TV at 200% OS scaling is 1920×1080 CSS px.
    expect(resolveDisplayMode('auto', env('gamepad', 1920, 1080), cfg)).toBe('tv');
  });

  it('Auto stays handheld on the Steam Deck, phones and small windows, even with a pad', () => {
    expect(resolveDisplayMode('auto', env('gamepad', 1280, 800), cfg)).toBe('handheld');
    expect(resolveDisplayMode('auto', env('gamepad', 851, 393), cfg)).toBe('handheld');
    expect(resolveDisplayMode('auto', env('gamepad', 1920, 800), cfg)).toBe('handheld');
    expect(resolveDisplayMode('auto', env('gamepad', 1500, 1000), cfg)).toBe('handheld');
  });

  it('Auto stays handheld on a big screen played with mouse, touch or keyboard', () => {
    expect(resolveDisplayMode('auto', env('pointer', 3840, 2160), cfg)).toBe('handheld');
    expect(resolveDisplayMode('auto', env('keyboard', 1920, 1080), cfg)).toBe('handheld');
  });

  it('honours a forced choice whatever the screen and input', () => {
    expect(resolveDisplayMode('tv', env('pointer', 851, 393), cfg)).toBe('tv');
    expect(resolveDisplayMode('handheld', env('gamepad', 3840, 2160), cfg)).toBe('handheld');
  });

  it('thresholds come from the data', () => {
    const lowBar = { tvAuto: { minWidth: 1200, minHeight: 700 } };
    expect(resolveDisplayMode('auto', env('gamepad', 1280, 800), lowBar)).toBe('tv');
  });
});

describe('TV zoom', () => {
  it('lays a 16:9 screen out at 600 CSS px tall: 1.8× at 1080p, 3.6× at 4K', () => {
    expect(tvZoom(1920, 1080, cfg)).toBeCloseTo(1.8);
    expect(tvZoom(3840, 2160, cfg)).toBeCloseTo(3.6);
    // Body text (16 px) is at least 28 px on a 1080p TV.
    expect(16 * tvZoom(1920, 1080, cfg)).toBeGreaterThanOrEqual(28);
  });

  it('fits narrow screens by width and never shrinks or passes the cap', () => {
    expect(tvZoom(1600, 1200, cfg)).toBeCloseTo(1.6);
    expect(tvZoom(851, 393, cfg)).toBe(1);
    expect(tvZoom(7680, 4320, cfg)).toBe(cfg.tv.maxZoom);
    expect(tvZoom(0, 0, cfg)).toBe(1);
  });
});
