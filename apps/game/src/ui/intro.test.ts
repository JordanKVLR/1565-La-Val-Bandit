import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TRACK_VOLUME } from '../platform/musicTracks';
import { INTRO_SOURCES, introVolume } from './intro';

describe('opening cinematic', () => {
  it('follows the music volume like the other recorded tracks', () => {
    expect(introVolume(1)).toBeCloseTo(TRACK_VOLUME);
    expect(introVolume(0)).toBe(0);
    expect(introVolume(5)).toBe(1);
    expect(introVolume(-1)).toBe(0);
  });

  it('offers H.264 first and VP9 as the fallback', () => {
    expect(INTRO_SOURCES.map((s) => s.type.split(';')[0])).toEqual(['video/mp4', 'video/webm']);
  });

  it('ships every source it lists, and none is empty', () => {
    for (const s of INTRO_SOURCES) {
      const path = resolve(__dirname, '../../public', s.file);
      expect(existsSync(path), s.file).toBe(true);
      expect(statSync(path).size, s.file).toBeGreaterThan(1_000_000);
    }
  });
});
