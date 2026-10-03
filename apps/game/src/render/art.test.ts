import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadLibrary } from '@m1565/content';
import { describe, expect, it } from 'vitest';
import castData from '../../../../packages/content/data/cast.json';
import { genericPortraitId } from './art';

describe('portraits', () => {
  const artDir = resolve(__dirname, '../../public/art');
  const manifest = JSON.parse(readFileSync(resolve(artDir, 'manifest.json'), 'utf8')) as {
    portraits: Record<string, string>;
  };

  it('only lists cast members, and every file exists', () => {
    const cast = new Set(castData.map((c) => c.id));
    for (const [id, path] of Object.entries(manifest.portraits)) {
      expect(cast.has(id), id).toBe(true);
      expect(existsSync(resolve(artDir, path)), path).toBe(true);
    }
  });

  it('gives generic units the soldier or janissary, and machines nothing', () => {
    expect(genericPortraitId('militia', 'militia')).toBe('soldier');
    expect(genericPortraitId('order', 'knight')).toBe('soldier');
    expect(genericPortraitId('ottoman', 'janissary')).toBe('janissary');
    expect(genericPortraitId('corsair', 'corsair')).toBe('janissary');
    expect(genericPortraitId('militia', 'barge')).toBeNull();
    expect(genericPortraitId('scala', 'machine')).toBeNull();
  });

  it('has a stand-in portrait for every soldier frame in the game', () => {
    const lib = loadLibrary();
    for (const f of lib.frames.values()) {
      const id = genericPortraitId(
        lib.frameFactions.get(f.id) ?? '',
        lib.frameModels.get(f.id) ?? '',
      );
      if (id) expect(manifest.portraits[id], f.id).toBeDefined();
    }
  });
});
