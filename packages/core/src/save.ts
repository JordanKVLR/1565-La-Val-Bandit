import type { Attack } from './attacks';
import { BASIC_ATTACK_ID, basicAttack, starterAttacks } from './attacks';
import { DEFAULT_BALANCE } from './balance';
import { SAVE_VERSION } from './battle';
import type { BattleState } from './state';
import type { Weapon, WeaponType } from './units';

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

const WEAPON_TYPES: Record<string, WeaponType> = {
  pike: 'polearm',
  'boat-hook': 'polearm',
  'sipahi-lance': 'polearm',
  'mace-shield': 'blunt',
  'ram-arm': 'blunt',
  arquebus: 'firearm',
  tufek: 'firearm',
  'swivel-gun': 'firearm',
  'tower-guns': 'firearm',
  'colossus-cannon': 'firearm',
  grenado: 'explosive',
};

/** migrations[n] upgrades a version-n save to version n+1. */
const migrations: Record<number, Migration> = {
  // v2: attacks, XP levelling and stat points.
  1: (raw) => {
    const balance = { ...DEFAULT_BALANCE, ...(raw.balance as object) };
    const units = (raw.units as Array<Record<string, unknown>>).map((u) => {
      const w = u.weapon as Weapon & { type?: WeaponType };
      const weapon: Weapon = { ...w, type: w.type ?? WEAPON_TYPES[w.id] ?? 'blade' };
      return {
        ...u,
        weapon,
        frameClass: 'medium',
        frameAgility: 0,
        attacks: [basicAttack(weapon)],
        statPoints: 0,
        xp: Math.min(Number(u.xp ?? 0), balance.xpPerLevel - 1),
      };
    });
    return { ...raw, balance, units };
  },
  // v3: DEF, INT, SPI and VIT; max HP now derives from base HP and VIT.
  2: (raw) => {
    const balance = { ...DEFAULT_BALANCE, ...(raw.balance as object) };
    const units = (raw.units as Array<Record<string, unknown>>).map((u) => ({
      def: 3,
      int: 5,
      spi: 5,
      vit: 0,
      ...u,
      baseHp: u.baseHp ?? u.maxHp,
    }));
    return { ...raw, balance, units };
  },
  // v4: reactions cost FP instead of AP, and every attack carries an FP surcharge.
  3: (raw) => {
    const old = { ...(raw.balance as Record<string, unknown>) };
    delete old.avoidApCost;
    const balance = {
      ...DEFAULT_BALANCE,
      ...old,
      defendFpCost: DEFAULT_BALANCE.defendFpCost,
      avoidFpCost: DEFAULT_BALANCE.avoidFpCost,
      counterFpCost: DEFAULT_BALANCE.counterFpCost,
    };
    return { ...raw, balance };
  },
  // v5: AP refills each turn, unused AP is the only FP recovery, every pilot has two starter
  // attacks, and the flat attack FP surcharge is gone.
  4: (raw) => {
    const old = { ...(raw.balance as Record<string, unknown>) };
    for (const k of ['fpRecovery', 'fpRestRecovery', 'attackFpSurcharge']) delete old[k];
    const balance = {
      ...DEFAULT_BALANCE,
      ...old,
      apStart: DEFAULT_BALANCE.apStart,
      apRegen: DEFAULT_BALANCE.apRegen,
      apPerFpRecovered: DEFAULT_BALANCE.apPerFpRecovered,
    };
    const units = (raw.units as Array<Record<string, unknown>>).map((u) => {
      const learned = (u.attacks as Attack[]).filter((a) => a.id !== BASIC_ATTACK_ID);
      return { ...u, attacks: [...starterAttacks(u.weapon as Weapon), ...learned] };
    });
    return { ...raw, balance, units };
  },
};

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
