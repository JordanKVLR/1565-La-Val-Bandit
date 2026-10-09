import type { MessageKey } from '../i18n';
import { tDynamic } from '../i18n';
import type { ParamValue } from '../i18n/format';
import type { InputDevice } from '../platform/input/controls';
import { promptFor } from '../platform/input/controls';

/**
 * Hints that name the input in use. Each has one whole sentence per device in the string table
 * (`prompt.<hint>.<device>`), so a translation never has to glue "Tap" onto a phrase.
 */
export type PromptHint =
  'continue' | 'begin' | 'skip' | 'moveAgain' | 'pickEnemy' | 'confirmPurchase';

/** "Tap to continue", "Press Enter to continue" or "Press Ⓐ to continue". */
export function promptText(
  hint: PromptHint,
  device: InputDevice,
  params: Readonly<Record<string, ParamValue>> = {},
): string {
  const key = `prompt.${hint}.${device}` as const;
  return tDynamic(key satisfies MessageKey, {
    button: promptFor('confirm', device, 'menu'),
    ...params,
  });
}
