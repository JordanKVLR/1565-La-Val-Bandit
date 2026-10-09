import type { ResultLine } from '../campaign/progression';
import { t } from '../i18n';

/** One line of the victory summary in the player's language. */
export function resultLineText(line: ResultLine): string {
  switch (line.kind) {
    case 'scudi':
      return t('results.scudi', { n: line.amount });
    case 'salvage':
      return t('results.salvaged', { name: line.frame });
    case 'pilot': {
      const { name, level, xp, xpPerLevel: max } = line;
      return line.levels > 0
        ? t('results.levelsGained', { n: line.levels, name, level, xp, max })
        : t('results.progress', { name, level, xp, max });
    }
  }
}
