import { loadLibrary } from '@m1565/content';
import { describe, expect, it } from 'vitest';
import { migrateCampaign } from './migrate';
import { CAMPAIGN_SAVE_VERSION } from './types';

const lib = loadLibrary();

/** A version 2 save as builds before difficulty wrote it. */
const v2 = {
  version: 2,
  ink: '{}',
  roster: [
    {
      characterId: 'ninu',
      level: 4,
      xp: 120,
      statPoints: 1,
      stats: { bas: 7, pow: 9, dex: 8, agl: 7, def: 5, wep: 7 },
      frame: 'haddiem',
      weapon: 'arming-sword',
      charm: null,
      amulet: null,
    },
  ],
  scudi: 900,
  stores: { 'weapon:pike': 1 },
  veterans: {},
  completedBattles: ['b1-marsaxlokk', 'b2-marsa-wells'],
  stage: { map: null, actors: {} },
  chapter: { title: 'Act I', subtitle: '' },
  lastStep: null,
  battle: null,
  savedAt: 1,
  playMs: 2,
};

describe('campaign save migration', () => {
  it('is at version 3', () => {
    expect(CAMPAIGN_SAVE_VERSION).toBe(3);
  });

  it('upgrades a version 2 save to Knight, first cycle, keeping everything else', () => {
    const save = migrateCampaign(lib, v2)!;
    expect(save).toEqual({
      ...v2,
      version: 3,
      difficulty: 'knight',
      ngPlus: 0,
      ending: null,
    });
  });

  it('marks a version 2 save past a route finale as having reached that ending', () => {
    const done = { ...v2, completedBattles: [...v2.completedBattles, 'i5-naxxar-ridge'] };
    expect(migrateCampaign(lib, done)?.ending).toBe('island');
    const cross = { ...v2, completedBattles: ['a5-scala-engine'] };
    expect(migrateCampaign(lib, cross)?.ending).toBe('cross');
  });

  it('upgrades a version 1 save all the way', () => {
    const v1 = {
      ...v2,
      version: 1,
      roster: [
        {
          characterId: 'ninu',
          level: 3,
          xp: 40,
          stats: { str: 8, skl: 7, agi: 6, def: 4, vit: 6 },
          frame: 'haddiem',
          weapon: 'arming-sword',
        },
      ],
      armory: ['pike'],
      stores: undefined,
    };
    const save = migrateCampaign(lib, v1)!;
    expect(save).toMatchObject({ version: 3, difficulty: 'knight', ngPlus: 0, ending: null });
    expect(save.roster[0]).toMatchObject({ characterId: 'ninu', level: 3 });
    expect(save.stores).toEqual({ 'weapon:pike': 1 });
  });

  it('keeps version 3 fields and repairs damaged ones', () => {
    const v3 = { ...v2, version: 3, difficulty: 'squire', ngPlus: 2, ending: 'crescent' };
    expect(migrateCampaign(lib, v3)).toMatchObject({
      difficulty: 'squire',
      ngPlus: 2,
      ending: 'crescent',
    });
    const broken = { ...v3, difficulty: 'nightmare', ngPlus: -4.5, ending: 7 };
    expect(migrateCampaign(lib, broken)).toMatchObject({
      difficulty: 'knight',
      ngPlus: 0,
      ending: null,
    });
  });

  it('refuses saves from unknown versions', () => {
    expect(migrateCampaign(lib, { ...v2, version: 99 })).toBeNull();
    expect(migrateCampaign(lib, {})).toBeNull();
  });
});
