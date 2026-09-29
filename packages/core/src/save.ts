import { SAVE_VERSION } from './battle';
import type { BattleState } from './state';

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

/** migrations[n] upgrades a version-n save to version n+1. */
const migrations: Record<number, Migration> = {};

export function serializeBattle(state: BattleState): string {
  return JSON.stringify(state);
}

export function deserializeBattle(json: string): BattleState {
  let raw = JSON.parse(json) as Record<string, unknown>;
  let version = raw.saveVersion;
  if (typeof version !== 'number' || version < 1) throw new Error('Not a battle save');
  if (version > SAVE_VERSION) throw new Error(`Save is from a newer version (${version})`);
  while (version < SAVE_VERSION) {
    const migrate = migrations[version];
    if (!migrate) throw new Error(`No migration from save version ${version}`);
    raw = migrate(raw);
    version += 1;
    raw.saveVersion = version;
  }
  return raw as unknown as BattleState;
}
