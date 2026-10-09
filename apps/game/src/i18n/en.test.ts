import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from './en';
import { checkTable } from './format';
import { LOCALES, pickLocale, t, tParts, tRich } from './index';

const SRC = join(import.meta.dirname, '..');

/** Every source file of the game except tests and the table itself. */
function sources(dir = SRC): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) && !name.endsWith('.test.ts') && !path.includes('i18n/en.ts')
      ? [path]
      : [];
  });
}

describe('the English string table', () => {
  it('uses stable, namespaced keys', () => {
    for (const key of Object.keys(en)) expect(key).toMatch(/^[a-z][a-zA-Z]*(\.[a-zA-Z0-9]+)+$/);
  });

  it('has no empty messages, and every plural has its English one and other forms', () => {
    for (const [key, message] of Object.entries(en)) {
      if (typeof message === 'string') expect(message.trim(), key).not.toBe('');
      else expect(Object.keys(message).sort(), key).toEqual(['one', 'other']);
    }
  });

  it('only uses the emphasis tags tRich() understands', () => {
    for (const [key, message] of Object.entries(en)) {
      const forms = typeof message === 'string' ? [message] : Object.values(message);
      for (const form of forms) {
        const tags = [...form.matchAll(/<\/?([a-z]+)>/g)].map((m) => m[1]);
        for (const tag of tags) expect(['b', 'strong', 'em'], key).toContain(tag);
      }
    }
  });

  it('has no unused keys (literal keys, or prefixes of keys built from ids)', () => {
    const code = sources()
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    const literals = new Set([...code.matchAll(/'([a-z][\w]*(?:\.[\w]+)+)'/g)].map((m) => m[1]));
    const prefixes = [...code.matchAll(/`([a-z][\w]*(?:\.[\w]+)*\.)\$\{/g)].map((m) => m[1]!);
    const unused = Object.keys(en).filter(
      (key) => !literals.has(key) && !prefixes.some((p) => key.startsWith(p)),
    );
    expect(unused).toEqual([]);
  });
});

describe('shipped languages', () => {
  it('match the English keys and placeholders', () => {
    for (const [locale, table] of Object.entries(LOCALES))
      expect(checkTable(en, table), locale).toEqual([]);
  });

  it('picks the first shipped language the player prefers, else English', () => {
    expect(pickLocale(['en-GB', 'fr'])).toBe('en');
    expect(pickLocale(['fr-FR', 'mt'], ['en', 'mt'])).toBe('mt');
    expect(pickLocale(['MT-mt'], ['en', 'mt'])).toBe('mt');
    expect(pickLocale(['de'])).toBe('en');
    expect(pickLocale([])).toBe('en');
  });
});

describe('t()', () => {
  it('formats the English table', () => {
    expect(t('common.menu')).toBe('Menu');
    expect(t('menu.savedToSlot', { n: 2 })).toBe('Saved to slot 2.');
    expect(t('roster.pointsToSpend', { n: 1 })).toBe('1 point to spend');
    expect(t('roster.pointsToSpend', { n: 3 })).toBe('3 points to spend');
    expect(t('codex.locked', { n: 1 })).toBe('1 more entry unlocks as the story reaches it.');
    expect(t('codex.locked', { n: 2 })).toBe('2 more entries unlock as the story reaches them.');
  });

  it('splits around element placeholders and emphasis tags', () => {
    const name = { el: 'strong' };
    expect(tParts('menu.difficulty', { name })).toEqual(['Difficulty: ', name]);
    const rich = tRich('settings.iosHint');
    expect(rich[0]).toBe('On iPhone, tap Share, then ');
    expect(rich[1]).toMatchObject({ type: 'b', props: { children: 'Add to Home Screen' } });
    expect(rich[2]).toBe(' to play full screen.');
  });
});
