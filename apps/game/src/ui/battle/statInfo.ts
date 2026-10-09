import type { StatName } from '@m1565/core';
import { t } from '../../i18n';

const STATS: readonly StatName[] = ['bas', 'pow', 'dex', 'agl', 'def', 'wep'];

/**
 * Labels and one-line explanations for the six pilot attributes (the classic framework). The
 * text is read from the string table each time, so it follows the active language.
 */
export const STAT_INFO: ReadonlyArray<{
  readonly key: StatName;
  readonly label: string;
  readonly help: string;
}> = STATS.map((key) => ({
  key,
  get label() {
    return t(`stat.${key}`);
  },
  get help() {
    return t(`stat.${key}.help`);
  },
}));

/** The short label of one attribute, e.g. "POW". */
export const statLabel = (key: StatName): string => t(`stat.${key}`);

/** "WEP+4 · DEX+1" for a gear bonus (negative values shown with a minus). */
export function bonusText(bonus: Partial<Record<StatName, number>>): string {
  return bonusParts(bonus)
    .map((p) => p.text)
    .join(t('common.sep'));
}

/** Each nonzero bonus as text with its value, e.g. { text: "WEP+4", value: 4 }. */
export function bonusParts(
  bonus: Partial<Record<StatName, number>>,
): { readonly text: string; readonly value: number }[] {
  return STATS.filter((k) => bonus[k]).map((k) => {
    const value = bonus[k]!;
    return { text: `${statLabel(k)}${value > 0 ? '+' : ''}${value}`, value };
  });
}
