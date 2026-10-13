import { describe, expect, it } from 'vitest';
import { loadLibrary } from '@m1565/content';
import { POSE_KEYS, figureSpec, guardFor } from '../render/Armatura';
import type { Pose } from '../render/Armatura';
import { settings } from '../state/settings';
import { personPose } from './figures/people';
import { FALLBACK_PERSON, PEOPLE } from './figures/peopleCast';
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
  it('draws every cast member as a plain person, never an armatura', () => {
    const ids = [...loadLibrary().cast.keys()];
    expect(ids.length).toBeGreaterThanOrEqual(20);
    for (const id of ids) {
      const spec = storyFigureSpec(id, '#336699');
      expect(spec.person).toBe(PEOPLE[id]);
      expect(spec.person).toBeDefined();
      expect(spec.accent).toBe('#336699');
    }
    // distinct looks for distinct people
    expect(new Set(ids.map((id) => JSON.stringify(PEOPLE[id]))).size).toBe(ids.length);
  });

  it('falls back to an average villager for unknown ids', () => {
    const spec = storyFigureSpec('nobody', '#777777');
    expect(spec.person).toBe(FALLBACK_PERSON);
    expect(spec.person.build).toBe('average');
  });

  it('keeps the people free of weapons, armour and helmets', () => {
    const allowedProps = ['book', 'tool', 'lantern', 'wrench', 'quill', 'banner', 'scroll'];
    for (const p of Object.values(PEOPLE)) {
      if (p.prop) expect(allowedProps).toContain(p.prop);
      expect([
        'none',
        'cap',
        'flatcap',
        'straw',
        'scarf',
        'veil',
        'turban',
        'bork',
        'hood',
        'band',
        'goggles',
      ]).toContain(p.headwear?.kind ?? 'none');
    }
  });

  it('leaves battle figures unchanged', () => {
    const lib = loadLibrary();
    const ninu = lib.characters.get('ninu');
    expect(ninu).toBeDefined();
    const unit = {
      frameId: ninu?.frame ?? '',
      frameClass: lib.frames.get(ninu?.frame ?? '')?.class ?? 'medium',
      weapon: lib.weapons.get(ninu?.weapon ?? '') as never,
      characterId: 'ninu',
    };
    const spec = figureSpec(lib, unit, '#2f5fa8');
    expect(spec).toMatchObject({ hero: true, accent: '#2f5fa8' });
    expect('person' in spec).toBe(false);
  });

  it('stands people on a relaxed pose and swings their arms when walking', () => {
    const spec = storyFigureSpec('ninu', '#2f5fa8');
    const base = personPose(spec.person);
    expect(base.sR).toBeLessThan(0.5);
    const walk = mapPose({ ...base }, base, { walk: 1.2, lunge: -1, hurt: -1, ko: -1 }, true);
    expect(walk.sR).not.toBe(base.sR);
    for (const k of POSE_KEYS) expect(Number.isFinite(walk[k])).toBe(true);
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
