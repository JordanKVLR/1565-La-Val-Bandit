/**
 * The UI string table machinery (ADR 0012). Pure and DOM-free, so plain TS modules, Preact
 * components and tests share it. `index.ts` builds the app's translator from these pieces.
 *
 * A message is a string with `{name}` placeholders, or a set of CLDR plural forms
 * (`one`, `other`, …) chosen by the number passed as `{n}`.
 */

/** CLDR plural categories, as `Intl.PluralRules` names them. */
export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

/** A plural message: `other` is required, the rest depend on the language. */
export type PluralForms = { readonly other: string } & {
  readonly [C in Exclude<PluralCategory, 'other'>]?: string;
};

export type Message = string | PluralForms;

export type MessageTable = { readonly [key: string]: Message };

/** Values a placeholder accepts. Numbers are inserted as `String(n)`, unformatted. */
export type ParamValue = string | number;

/** The `{name}` placeholders in one template, as a union of names. */
export type Placeholders<S extends string> = S extends `${string}{${infer P}}${infer Rest}`
  ? P | Placeholders<Rest>
  : never;

/** The parameters a message needs: its placeholders, plus `n` for a plural. */
export type MessageParams<M> = M extends string
  ? Placeholders<M>
  : M extends PluralForms
    ? 'n' | { [C in keyof M]: M[C] extends string ? Placeholders<M[C]> : never }[keyof M]
    : never;

/** `t(key)` when a message has no placeholders, `t(key, { … })` when it has. */
export type ArgsFor<M> = [MessageParams<M>] extends [never]
  ? []
  : [params: Readonly<Record<MessageParams<M>, ParamValue>>];

const PLACEHOLDER = /\{(\w+)\}/g;

/** Every placeholder name in a message (all plural forms), sorted and de-duplicated. */
export function placeholdersOf(message: Message): string[] {
  const forms = typeof message === 'string' ? [message] : Object.values(message);
  const names = new Set<string>();
  for (const form of forms) for (const m of form.matchAll(PLACEHOLDER)) names.add(m[1]!);
  if (typeof message !== 'string') names.add('n');
  return [...names].sort();
}

/**
 * Splits a template at its placeholders and fills each one. Values may be anything (strings,
 * numbers, or JSX elements for `tParts`); an unknown placeholder is left as written so the
 * mistake shows.
 */
export function fillParts<V>(
  template: string,
  params: Readonly<Record<string, V>> | undefined,
): (string | V)[] {
  if (!params) return [template];
  const out: (string | V)[] = [];
  let last = 0;
  for (const m of template.matchAll(PLACEHOLDER)) {
    const name = m[1]!;
    if (!(name in params)) continue;
    if (m.index > last) out.push(template.slice(last, m.index));
    out.push(params[name] as V);
    last = m.index + m[0].length;
  }
  if (last < template.length) out.push(template.slice(last));
  return out;
}

/** A template with every placeholder replaced by its value as text. */
export function interpolate(
  template: string,
  params: Readonly<Record<string, ParamValue>> | undefined,
): string {
  if (!params) return template;
  return template.replace(PLACEHOLDER, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  );
}

/** The plural form for `n` in this language, falling back to `other`. */
export function pickPlural(forms: PluralForms, n: number, rules: Intl.PluralRules): string {
  const category = rules.select(n) as PluralCategory;
  return forms[category] ?? forms.other;
}

export interface TranslatorOptions {
  /** BCP 47 code of the active language, e.g. `en`. */
  readonly locale: string;
  /** The active language's table; may be partial. */
  readonly messages: MessageTable;
  /** The source table (English), used in production when `messages` lacks a key. */
  readonly fallback: MessageTable;
  /**
   * Development build: a missing key shows as `⟦key⟧` (and warns once) so it stands out on
   * screen. In production it falls back to English, then to the key itself.
   */
  readonly dev: boolean;
  /** Called once per missing key (defaults to `console.warn` in dev, nothing in production). */
  readonly onMissing?: (key: string, locale: string) => void;
}

export interface Translator {
  readonly locale: string;
  /** The message for `key` as text, with placeholders filled. */
  text(key: string, params?: Readonly<Record<string, ParamValue>>): string;
  /** The message for `key` split around placeholders, so values can be elements. */
  parts<V>(key: string, params: Readonly<Record<string, V | ParamValue>>): (ParamValue | V)[];
  /** Whether the active table (or the fallback, in production) has `key`. */
  has(key: string): boolean;
}

/** Builds a translator over one language table, with fallback and missing-key handling. */
export function createTranslator(options: TranslatorOptions): Translator {
  const { locale, messages, fallback, dev } = options;
  const rules = new Intl.PluralRules(locale);
  const warned = new Set<string>();
  const onMissing =
    options.onMissing ??
    ((key: string, loc: string) => {
      if (dev) console.warn(`[i18n] missing "${key}" for "${loc}"`);
    });

  const lookup = (key: string): Message | undefined => {
    if (Object.hasOwn(messages, key)) return messages[key];
    if (!warned.has(key)) {
      warned.add(key);
      onMissing(key, locale);
    }
    if (dev) return undefined;
    return Object.hasOwn(fallback, key) ? fallback[key] : undefined;
  };

  const template = (key: string, n: unknown): string | undefined => {
    const message = lookup(key);
    if (message === undefined) return undefined;
    if (typeof message === 'string') return message;
    return pickPlural(message, typeof n === 'number' ? n : Number(n) || 0, rules);
  };

  const missing = (key: string) => (dev ? `⟦${key}⟧` : key);

  return {
    locale,
    text(key, params) {
      const tpl = template(key, params?.n);
      return tpl === undefined ? missing(key) : interpolate(tpl, params);
    },
    parts(key, params) {
      const tpl = template(key, params.n);
      return tpl === undefined ? [missing(key)] : fillParts(tpl, params);
    },
    has(key) {
      return Object.hasOwn(messages, key) || (!dev && Object.hasOwn(fallback, key));
    },
  };
}

/** Problems with a translation table measured against the source table (for tests). */
export function checkTable(source: MessageTable, table: MessageTable): string[] {
  const problems: string[] = [];
  for (const [key, message] of Object.entries(table)) {
    const original = source[key];
    if (original === undefined) {
      problems.push(`${key}: not in the source table`);
      continue;
    }
    if (typeof original === 'string' && typeof message !== 'string')
      problems.push(`${key}: plural forms for a plain message`);
    if (typeof original !== 'string' && typeof message === 'string')
      problems.push(`${key}: plain text for a plural message`);
    const want = placeholdersOf(original).join(',');
    const got = placeholdersOf(message).join(',');
    if (want !== got) problems.push(`${key}: placeholders {${got}} should be {${want}}`);
    const forms = typeof message === 'string' ? [message] : Object.values(message);
    if (forms.some((f) => f.trim() === '')) problems.push(`${key}: empty text`);
  }
  return problems;
}

/** Emphasis tags allowed inside messages read with `tRich()`. */
export type RichTag = 'b' | 'strong' | 'em';

const RICH = /<(b|strong|em)>(.*?)<\/\1>/g;

/** Splits `a <b>bold</b> c` into text and tagged runs (tags do not nest). */
export function parseRich(text: string): (string | { tag: RichTag; text: string })[] {
  const out: (string | { tag: RichTag; text: string })[] = [];
  let last = 0;
  for (const m of text.matchAll(RICH)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push({ tag: m[1] as RichTag, text: m[2]! });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
