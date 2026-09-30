import type { Attack, PilotStats, Weapon } from '@m1565/core';
import { attackRange } from '@m1565/core';

const STAT_LABEL = { str: 'STR', skl: 'SKL', agi: 'AGI' } as const;

/** Short tags for an attack's special properties, e.g. "×2 hits", "pierce 30%". */
export function attackTags(a: Attack): string[] {
  const tags: string[] = [];
  if ((a.hits ?? 1) > 1) tags.push(`×${a.hits} hits`);
  if (a.pierce) tags.push(`pierce ${Math.round(a.pierce * 100)}%`);
  if (a.fatigue) tags.push(`+${a.fatigue} FP to target`);
  if (a.apDamage) tags.push(`−${a.apDamage} AP to target`);
  if (a.noCounter) tags.push('no counter');
  return tags;
}

/** `fpCost` is what the attack really costs this pilot (after SPI). */
export function attackStats(a: Attack, weapon: Weapon, fpCost: number = a.fpCost): string {
  const r = attackRange(a, weapon);
  const range = r.min === r.max ? `${r.min}` : `${r.min}–${r.max}`;
  const acc = a.accuracy ? ` · ACC ${a.accuracy > 0 ? '+' : ''}${a.accuracy}` : '';
  return `POW ${Math.round(a.power * 100)}%${acc} · AP ${a.apCost} · FP ${fpCost} · range ${range}`;
}

/** "STR 12 · SKL 9" with the pilot's shortfalls, or '' when there are no requirements. */
export function requirementText(a: Attack, stats?: PilotStats): string {
  return (Object.keys(STAT_LABEL) as Array<keyof typeof STAT_LABEL>)
    .filter((k) => a.requires[k])
    .map((k) => {
      const need = a.requires[k]!;
      const have = stats?.[k];
      return have !== undefined && have < need
        ? `${STAT_LABEL[k]} ${need} (have ${have})`
        : `${STAT_LABEL[k]} ${need}`;
    })
    .join(' · ');
}
