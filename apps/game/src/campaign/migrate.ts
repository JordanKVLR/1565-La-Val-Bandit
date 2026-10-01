import type { Library, RosterEntry } from '@m1565/content';
import type { CampaignSave } from './types';
import { CAMPAIGN_SAVE_VERSION } from './types';
import type { Stores } from './inventory';
import { addItem } from './inventory';

type Raw = Record<string, unknown>;

/**
 * Upgrades an older campaign save. Version 1 had seven attributes and owned "designs" any pilot
 * could use; version 2 has the six classic attributes and real items. Pilots keep their
 * equipment, and each owned design becomes one spare item in the stores.
 */
export function migrateCampaign(lib: Library, raw: Raw): CampaignSave | null {
  let save = raw;
  if (save.version === 1) save = v1to2(lib, save);
  return save.version === CAMPAIGN_SAVE_VERSION ? (save as unknown as CampaignSave) : null;
}

function v1to2(lib: Library, raw: Raw): Raw {
  const roster = ((raw.roster as Raw[] | undefined) ?? []).map((r): RosterEntry => {
    const s = (r.stats ?? {}) as Record<string, number>;
    const base = lib.characters.get(String(r.characterId))?.stats;
    const str = s.str ?? base?.pow ?? 6;
    const skl = s.skl ?? base?.dex ?? 6;
    return {
      characterId: String(r.characterId),
      level: Number(r.level ?? 1),
      // The new scale levels every 500 XP; carry over progress as a share of a level.
      xp: Math.min(499, Math.round(Number(r.xp ?? 0) * 5)),
      statPoints: Number(r.statPoints ?? 0),
      stats: {
        bas: s.vit ?? base?.bas ?? 5,
        pow: str,
        dex: skl,
        agl: s.agi ?? base?.agl ?? 6,
        def: s.def ?? base?.def ?? 3,
        wep: Math.max(3, Math.round((str + skl) / 2) - 1),
      },
      frame: String(r.frame),
      weapon: String(r.weapon),
      charm: null,
      amulet: null,
    };
  });
  const inUse = new Set(roster.flatMap((r) => [r.frame, r.weapon]));
  let stores: Stores = {};
  for (const id of (raw.armory as string[] | undefined) ?? []) {
    if (inUse.has(id)) continue;
    if (lib.frames.has(id)) stores = addItem(stores, 'frame', id);
    else if (lib.weapons.has(id)) stores = addItem(stores, 'weapon', id);
  }
  const rest: Raw = { ...raw };
  delete rest.armory;
  // A mid-battle snapshot from the old rules can't resume; restart that battle instead.
  const battle = raw.battle as { id: string } | null;
  return { ...rest, version: 2, roster, stores, battle: battle ? { id: battle.id } : null };
}
