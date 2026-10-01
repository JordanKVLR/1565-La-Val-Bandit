import { SAVE_VERSION } from './battle';
import type { BattleState } from './state';

/**
 * Oldest battle save this build can read. Version 7 moved to the six classic attributes, gear
 * bonuses and a new XP scale; older mid-battle saves can't be converted meaningfully, so the
 * campaign restarts that battle from its beginning instead (the story save itself is kept).
 */
export const OLDEST_BATTLE_SAVE = 7;

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

/** migrations[n] upgrades a version-n save to version n+1 (none yet since the v7 reset). */
const migrations: Record<number, Migration> = {};

export class OutdatedSaveError extends Error {
  constructor(version: number) {
    super(`Battle save version ${version} is from older rules and can't be resumed`);
    this.name = 'OutdatedSaveError';
  }
}

export function serializeBattle(state: BattleState): string {
  return JSON.stringify(state);
}

export function deserializeBattle(json: string): BattleState {
  let raw = JSON.parse(json) as Record<string, unknown>;
  let version = raw.saveVersion;
  if (typeof version !== 'number' || version < 1) throw new Error('Not a battle save');
  if (version > SAVE_VERSION) throw new Error(`Save is from a newer version (${version})`);
  if (version < OLDEST_BATTLE_SAVE) throw new OutdatedSaveError(version);
  while (version < SAVE_VERSION) {
    const migrate = migrations[version];
    if (!migrate) throw new Error(`No migration from save version ${version}`);
    raw = migrate(raw);
    version += 1;
    raw.saveVersion = version;
  }
  return raw as unknown as BattleState;
}
