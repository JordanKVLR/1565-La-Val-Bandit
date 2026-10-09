import type { PilotStats } from '@m1565/core';
import { DEFAULT_DIFFICULTY, isDifficulty, STAT_NAMES } from '@m1565/core';
import type { Library, RosterEntry } from '@m1565/content';
import type { CampaignSave } from './types';
import { CAMPAIGN_SAVE_VERSION } from './types';
import type { Stores } from './inventory';
import { addItem } from './inventory';

type Raw = Record<string, unknown>;

/**
 * Upgrades an older campaign save. Version 1 had seven attributes and owned "designs" any pilot
 * could use; version 2 has the six classic attributes and real items. Pilots keep their
 * equipment, and each owned design becomes one spare item in the stores. Version 3 adds the
 * difficulty (older saves play on Knight, the balance they were made with), the New Game+
 * cycle and the ending reached.
 */
export function migrateCampaign(lib: Library, raw: Raw): CampaignSave | null {
  let save = raw;
  if (save.version === 1) save = v1to2(lib, save);
  if (save.version === 2) save = v2to3(save);
  if (save.version !== CAMPAIGN_SAVE_VERSION) return null;
  // Guard against hand-edited or damaged fields rather than refusing the save.
  return {
    ...save,
    difficulty: isDifficulty(save.difficulty) ? save.difficulty : DEFAULT_DIFFICULTY,
    ngPlus: Math.max(0, Math.floor(Number(save.ngPlus) || 0)),
    ending: typeof save.ending === 'string' ? save.ending : null,
  } as unknown as CampaignSave;
}

/**
 * Each route's last battle when v2 saves were made (routes had five battles then); only the
 * epilogue followed, so a v2 save past it has seen the ending. Later finales don't matter here:
 * v3 saves record the ending directly.
 */
const FINALE_ROUTES: Readonly<Record<string, string>> = {
  'a5-scala-engine': 'cross',
  'i5-naxxar-ridge': 'island',
  'c5-broken-medallion': 'crescent',
};

function v2to3(raw: Raw): Raw {
  const done = (raw.completedBattles as string[] | undefined) ?? [];
  const finale = done.find((id) => id in FINALE_ROUTES);
  return {
    ...raw,
    version: 3,
    difficulty: DEFAULT_DIFFICULTY,
    ngPlus: 0,
    ending: finale ? FINALE_ROUTES[finale]! : null,
  };
}

/** Old builds could pile points into one stat; the classic scale stops at the cap. */
function capStats(stats: PilotStats, max: number): PilotStats {
  const out = { ...stats };
  for (const k of STAT_NAMES) out[k] = Math.max(0, Math.min(max, out[k]));
  return out;
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
      stats: capStats(
        {
          bas: s.vit ?? base?.bas ?? 5,
          pow: str,
          dex: skl,
          agl: s.agi ?? base?.agl ?? 6,
          def: s.def ?? base?.def ?? 3,
          wep: Math.max(3, Math.round((str + skl) / 2) - 1),
        },
        lib.balance.statMax,
      ),
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
