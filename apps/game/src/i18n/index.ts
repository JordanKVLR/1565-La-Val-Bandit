/**
 * The game's UI strings (ADR 0012, docs/I18N.md). Every player-facing string in apps/game goes
 * through `t()` (text) or `tParts()` (text with elements in it). English is the source table
 * (`en.ts`); its keys and placeholders are type-checked at each call.
 *
 *   t('common.menu')                          → "Menu"
 *   t('menu.savedToSlot', { n: 2 })          → "Saved to slot 2."
 *   t('roster.pointsToSpend', { n: 1 })      → "1 point to spend"
 *   tParts('menu.difficulty', { name: <strong>Knight</strong> })
 *   tRich('settings.iosHint')               → ["On iPhone, tap Share, then ", <b>…</b>, …]
 *
 * Story text lives in Ink and content names and descriptions in the content JSON; neither is
 * here.
 */
import type { VNode } from 'preact';
import { h } from 'preact';
import type { ArgsFor, MessageTable, ParamValue, Translator } from './format';
import { createTranslator, parseRich } from './format';
import { en } from './en';

export type Messages = typeof en;
export type MessageKey = keyof Messages;

/** Languages the game ships. Add a table here to add a language (docs/I18N.md). */
export const LOCALES: Readonly<Record<string, MessageTable>> = { en };

export const DEFAULT_LOCALE = 'en';

const DEV = import.meta.env?.DEV ?? false;

let active: Translator = createTranslator({
  locale: DEFAULT_LOCALE,
  messages: en,
  fallback: en,
  dev: DEV,
});

/** The first shipped language among the player's preferred ones, else English. */
export function pickLocale(preferred: readonly string[], available = Object.keys(LOCALES)) {
  for (const tag of preferred) {
    const lower = tag.toLowerCase();
    const exact = available.find((l) => l.toLowerCase() === lower);
    if (exact) return exact;
    const base = available.find((l) => l.toLowerCase() === lower.split('-')[0]);
    if (base) return base;
  }
  return DEFAULT_LOCALE;
}

/**
 * Switches language. Call before the first render: screens read strings as they render, so a
 * later switch shows on the next render of each screen.
 */
export function setLocale(locale: string): void {
  const messages = LOCALES[locale] ?? en;
  active = createTranslator({
    locale: LOCALES[locale] ? locale : DEFAULT_LOCALE,
    messages,
    fallback: en,
    dev: DEV,
  });
  if (typeof document !== 'undefined') document.documentElement.lang = active.locale;
}

export function currentLocale(): string {
  return active.locale;
}

/** The text for a UI string, with `{placeholders}` filled (plurals pick their form from `n`). */
export function t<K extends MessageKey>(key: K, ...args: ArgsFor<Messages[K]>): string {
  return active.text(key, args[0] as Readonly<Record<string, ParamValue>> | undefined);
}

/**
 * A UI string split around its placeholders, for values that are elements:
 * `<p>{tParts('menu.difficulty', { name: <strong>{n}</strong> })}</p>`.
 */
export function tParts<K extends MessageKey, V>(
  key: K,
  params: Readonly<Record<keyof ArgsFor<Messages[K]>[0] & string, V | ParamValue>>,
): (ParamValue | V)[] {
  return active.parts(key, params);
}

/** For keys built at run time (e.g. from an id); prefer `t()` with a literal key. */
export function tDynamic(key: string, params?: Readonly<Record<string, ParamValue>>): string {
  return active.text(key, params);
}

/**
 * A UI string with its `<b>`, `<strong>` and `<em>` runs turned into elements, for help text
 * with emphasis in the middle of a sentence.
 */
export function tRich<K extends MessageKey>(
  key: K,
  ...args: ArgsFor<Messages[K]>
): (string | VNode)[] {
  return parseRich(t(key, ...args)).map((part, i) =>
    typeof part === 'string' ? part : (h(part.tag, { key: i }, part.text) as VNode),
  );
}
