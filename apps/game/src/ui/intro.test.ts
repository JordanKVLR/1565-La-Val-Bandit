import { describe, expect, it } from 'vitest';
import { TRACK_VOLUME } from '../platform/musicTracks';
import { INTRO_DURATION_S, introFinished, introScale, introTime, introVolume } from './intro';

describe('opening cinematic helpers', () => {
  it('draws at full 1080p on a large screen and never above it', () => {
    expect(introScale(1920, 1080, 1)).toBe(1);
    expect(introScale(2560, 1440, 2)).toBe(1);
  });

  it('lowers the backing resolution to fit a phone, within a floor', () => {
    expect(introScale(844, 390, 3)).toBe(1);
    expect(introScale(844, 390, 1)).toBeCloseTo(0.4);
    expect(introScale(1280, 800, 1)).toBeCloseTo(0.7);
    expect(introScale(200, 100, 1)).toBe(0.4);
  });

  it('follows the music volume like the other recorded tracks', () => {
    expect(introVolume(1)).toBeCloseTo(TRACK_VOLUME);
    expect(introVolume(0)).toBe(0);
    expect(introVolume(5)).toBe(1);
  });

  it('takes its clock from the song when it plays, else from the wall clock', () => {
    expect(introTime(12.5, 3)).toBe(12.5);
    expect(introTime(null, 3)).toBe(3);
    expect(introTime(null, 999)).toBe(INTRO_DURATION_S);
    expect(introTime(-1, 0)).toBe(0);
  });

  it('ends with the song', () => {
    expect(introFinished(100)).toBe(false);
    expect(introFinished(INTRO_DURATION_S)).toBe(true);
  });
});
