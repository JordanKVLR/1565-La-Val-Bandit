import type { UnavailableReason } from '@m1565/core';
import { t } from '../../i18n';

/** Why a reaction or strike-back technique is greyed out, in the player's language. */
export function reasonText(reason: UnavailableReason): string {
  switch (reason.code) {
    case 'tooTired':
      return t('reason.tooTired', { fp: reason.fpCost });
    case 'unanswerable':
      return t('reason.unanswerable', { attack: reason.attackName });
    default:
      return t(`reason.${reason.code}`);
  }
}
