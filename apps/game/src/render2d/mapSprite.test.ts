import { describe, expect, it } from 'vitest';
import { POSE_KEYS, guardFor } from '../render/Armatura';
import type { Pose } from '../render/Armatura';
import { settings } from '../state/settings';
import { cameraFacing, mapFlash, mapPose, storyFigureSpec } from './mapSprite';
import { createDuelStage, currentMode } from './stageFactory';

const base = (): Pose => ({ ...guardFor('blade') });

describe('map sprite poses', () => {
  it('keeps every pose value finite through each animation', () => {
    for (const anim of [
      { walk: 1.3, lunge: -1, hurt: -1, ko: -1 },
      { walk: null, lunge: 0.2, hurt: -1, ko: -1 },
      { walk: null, lunge: -1, hurt: 0.1, ko: -1 },
      { walk: null, lunge: -1, hurt: -1, ko: 0.9 },
    ]) {
      const p = mapPose(base(), base(), anim);
      for (const k of POSE_KEYS) expect(Number.isFinite(p[k])).toBe(true);
    }
  });

  it('lies the unit down when knocked out and flashes when hurt', () => {
    const p = mapPose(base(), base(), { walk: null, lunge: -1, hurt: -1, ko: 5 });
    expect(p.fall).toBeGreaterThan(1.4);
    expect(mapFlash({ walk: null, lunge: -1, hurt: 0, ko: -1 })).toBe(1);
    expect(mapFlash({ walk: null, lunge: -1, hurt: -1, ko: -1 })).toBe(0);
  });
});

describe('camera-relative facing', () => {
  it('mirrors by screen side and flags units facing away', () => {
    const a = Math.PI / 4;
    // Camera at +x/+z looking at the map: south (+z) faces the camera, north faces away.
    expect(cameraFacing('south', a).away).toBe(false);
    expect(cameraFacing('north', a).away).toBe(true);
    expect(cameraFacing('east', a).mirror).toBe(false);
    expect(cameraFacing('west', a).mirror).toBe(true);
    // Rotating a quarter turn changes which side units show.
    expect(cameraFacing('east', a + Math.PI / 2).mirror).toBe(true);
  });
});

describe('story figures', () => {
  it('builds a rig spec from the cast and falls back to a generic one', () => {
    expect(storyFigureSpec('ninu', '#2f5fa8').hero).toBe(true);
    expect(storyFigureSpec('kateri', '#3f8a6a').weaponType).toBe('firearm');
    expect(storyFigureSpec('nobody', '#777777').model).toBe('militia');
  });
});

describe('stage factory', () => {
  it('follows the render mode setting', () => {
    const prev = settings.get();
    settings.set({ ...prev, renderMode: '2d' });
    expect(currentMode()).toBe('2d');
    settings.set({ ...prev, renderMode: '3d' });
    expect(currentMode()).toBe('3d');
    settings.set(prev);
    expect(typeof createDuelStage).toBe('function');
  });
});
