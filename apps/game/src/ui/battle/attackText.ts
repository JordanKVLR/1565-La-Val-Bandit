import type { Attack, PilotStats, StatName, Weapon } from '@m1565/core';
import { attackRange, RANGED_STYLES } from '@m1565/core';
import { t } from '../../i18n';
import { statLabel } from './statInfo';

const STATS: readonly StatName[] = ['bas', 'pow', 'dex', 'agl', 'def', 'wep'];

/** Short tags for an attack's special properties, e.g. "×2 hits", "pierce 30%". */
export function attackTags(a: Attack): string[] {
  const tags: string[] = [];
  if ((a.hits ?? 1) > 1) tags.push(t('attack.tagHits', { n: a.hits! }));
  if (a.pierce) tags.push(t('attack.tagPierce', { n: Math.round(a.pierce * 100) }));
  if (a.fatigue) tags.push(t('attack.tagFatigue', { n: a.fatigue }));
  if (a.apDamage) tags.push(t('attack.tagApDamage', { n: a.apDamage }));
  if (a.noCounter) tags.push(t('attack.tagNoCounter'));
  return tags;
}

/** What a technique does, in plain words (e.g. "Strikes twice", "Ignores half of DEF"). */
export function techniqueEffects(a: Attack): string[] {
  const out: string[] = [];
  const hits = a.hits ?? 1;
  if (hits > 1) out.push(hits === 2 ? t('tech.strikesTwice') : t('tech.strikesTimes', { n: hits }));
  if (a.pierce)
    out.push(
      a.pierce >= 0.99
        ? t('tech.ignoresDef')
        : a.pierce === 0.5
          ? t('tech.ignoresHalfDef')
          : t('tech.ignoresSomeDef', { n: Math.round(a.pierce * 100) }),
    );
  if (a.fatigue) out.push(t('tech.tires', { n: a.fatigue }));
  if (a.apDamage) out.push(t('tech.shakes', { n: a.apDamage }));
  if (a.noCounter) out.push(t('tech.noCounter'));
  if (RANGED_STYLES.has(a.style)) out.push(t('tech.ranged'));
  if ((a.maxRange ?? 1) >= 2 && !RANGED_STYLES.has(a.style)) out.push(t('tech.reach'));
  if (a.power >= 1.3) out.push(t('tech.heavy'));
  if (a.accuracy >= 10) out.push(t('tech.accurate'));
  else if (a.accuracy <= -25) out.push(t('tech.wild'));
  return out;
}

/** "2" or "2–4": a range of tiles. */
export const rangeText = (min: number, max: number): string =>
  min === max ? `${max}` : `${min}–${max}`;

/** AP, FP, power, accuracy and range of a technique, e.g. "POW 100% · AP 30 · FP 5 · range 1". */
export function attackStats(a: Attack, weapon: Weapon, fpCost: number = a.fpCost): string {
  const r = attackRange(a, weapon);
  return [
    t('attack.pow', { n: Math.round(a.power * 100) }),
    a.accuracy ? t('attack.acc', { n: `${a.accuracy > 0 ? '+' : ''}${a.accuracy}` }) : null,
    t('attack.ap', { n: a.apCost }),
    t('attack.fp', { n: fpCost }),
    t('attack.range', { range: rangeText(r.min, r.max) }),
  ]
    .filter((p) => p !== null)
    .join(t('common.sep'));
}

/** "POW 12 · DEX 9" with the pilot's shortfalls, or '' when there are no requirements. */
export function requirementText(a: Attack, stats?: PilotStats): string {
  return STATS.filter((k) => a.requires[k])
    .map((k) => {
      const need = a.requires[k]!;
      const have = stats?.[k];
      const stat = statLabel(k);
      return have !== undefined && have < need
        ? t('attack.requiresShort', { stat, need, have })
        : t('attack.requires', { stat, need });
    })
    .join(t('common.sep'));
}
