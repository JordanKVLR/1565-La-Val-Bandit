import { describe, expect, it, vi } from 'vitest';
import {
  checkTable,
  createTranslator,
  fillParts,
  interpolate,
  parseRich,
  pickPlural,
  placeholdersOf,
} from './format';

const source = {
  'a.hello': 'Hello, {name}!',
  'a.points': { one: '{n} point', other: '{n} points' },
  'a.plain': 'Plain',
} as const;

describe('interpolate', () => {
  it('fills placeholders, leaving unknown ones as written', () => {
    expect(interpolate('Hi {name}, {n} left', { name: 'Ana', n: 3 })).toBe('Hi Ana, 3 left');
    expect(interpolate('Hi {who}', { name: 'Ana' })).toBe('Hi {who}');
    expect(interpolate('No params', undefined)).toBe('No params');
  });

  it('repeats a placeholder and inserts numbers as written', () => {
    expect(interpolate('{x}+{x}', { x: 1500 })).toBe('1500+1500');
  });
});

describe('fillParts', () => {
  it('splits around placeholders so values can be elements', () => {
    const el = { tag: 'strong' };
    expect(fillParts('Difficulty: {name}', { name: el })).toEqual(['Difficulty: ', el]);
    expect(fillParts('{a} and {b}.', { a: 1, b: el })).toEqual([1, ' and ', el, '.']);
    expect(fillParts('Keep {missing} as is', {})).toEqual(['Keep {missing} as is']);
  });
});

describe('plurals', () => {
  it('picks the CLDR form for n, falling back to other', () => {
    const en = new Intl.PluralRules('en');
    expect(pickPlural({ one: 'one', other: 'many' }, 1, en)).toBe('one');
    expect(pickPlural({ one: 'one', other: 'many' }, 0, en)).toBe('many');
    expect(pickPlural({ other: 'only' }, 1, en)).toBe('only');
    // Languages with more forms get them from the same table shape.
    const pl = new Intl.PluralRules('pl');
    const forms = { one: 'punkt', few: 'punkty', many: 'punktów', other: 'punktu' };
    expect([1, 3, 5].map((n) => pickPlural(forms, n, pl))).toEqual(['punkt', 'punkty', 'punktów']);
  });
});

describe('parseRich', () => {
  it('turns <b>, <strong> and <em> runs into tagged parts', () => {
    expect(parseRich('Tap <b>Add</b> then <em>go</em>.')).toEqual([
      'Tap ',
      { tag: 'b', text: 'Add' },
      ' then ',
      { tag: 'em', text: 'go' },
      '.',
    ]);
    expect(parseRich('No tags')).toEqual(['No tags']);
    expect(parseRich('<u>not allowed</u>')).toEqual(['<u>not allowed</u>']);
  });
});

describe('createTranslator', () => {
  it('formats text, plurals and parts', () => {
    const tr = createTranslator({ locale: 'en', messages: source, fallback: source, dev: false });
    expect(tr.text('a.hello', { name: 'Ana' })).toBe('Hello, Ana!');
    expect(tr.text('a.points', { n: 1 })).toBe('1 point');
    expect(tr.text('a.points', { n: 4 })).toBe('4 points');
    expect(tr.parts('a.hello', { name: 7 })).toEqual(['Hello, ', 7, '!']);
    expect(tr.has('a.plain')).toBe(true);
  });

  it('shows a missing key as ⟦key⟧ in development, and warns once', () => {
    const onMissing = vi.fn();
    const tr = createTranslator({
      locale: 'mt',
      messages: { 'a.plain': 'Sempliċi' },
      fallback: source,
      dev: true,
      onMissing,
    });
    expect(tr.text('a.plain')).toBe('Sempliċi');
    expect(tr.text('a.hello', { name: 'Ana' })).toBe('⟦a.hello⟧');
    expect(tr.text('a.hello', { name: 'Ana' })).toBe('⟦a.hello⟧');
    expect(tr.parts('nope', {})).toEqual(['⟦nope⟧']);
    expect(onMissing).toHaveBeenCalledTimes(2);
    expect(onMissing).toHaveBeenCalledWith('a.hello', 'mt');
    expect(tr.has('a.hello')).toBe(false);
  });

  it('falls back to English, then to the key, in production', () => {
    const tr = createTranslator({
      locale: 'mt',
      messages: { 'a.plain': 'Sempliċi' },
      fallback: source,
      dev: false,
      onMissing: () => {},
    });
    expect(tr.text('a.hello', { name: 'Ana' })).toBe('Hello, Ana!');
    expect(tr.text('no.such.key')).toBe('no.such.key');
    expect(tr.has('a.hello')).toBe(true);
  });

  it('warns on the console by default in development only', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    createTranslator({ locale: 'en', messages: {}, fallback: {}, dev: true }).text('x.y');
    createTranslator({ locale: 'en', messages: {}, fallback: {}, dev: false }).text('x.z');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain('x.y');
    warn.mockRestore();
  });
});

describe('checkTable', () => {
  it('accepts a faithful translation', () => {
    expect(
      checkTable(source, {
        'a.hello': 'Merħba, {name}!',
        'a.points': { one: 'punt wieħed', other: '{n} punti' },
      }),
    ).toEqual([]);
  });

  it('reports unknown keys, changed placeholders, wrong shapes and empty text', () => {
    expect(
      checkTable(source, {
        'a.hello': 'Merħba, {isem}!',
        'a.points': '{n} punti',
        'a.plain': { other: 'x' },
        'b.extra': 'x',
      }),
    ).toEqual([
      'a.hello: placeholders {isem} should be {name}',
      'a.points: plain text for a plural message',
      'a.plain: plural forms for a plain message',
      'a.plain: placeholders {n} should be {}',
      'b.extra: not in the source table',
    ]);
    expect(checkTable(source, { 'a.plain': ' ' })).toEqual(['a.plain: empty text']);
  });

  it('lists placeholders across plural forms, with n for plurals', () => {
    expect(placeholdersOf('{b} {a} {b}')).toEqual(['a', 'b']);
    expect(placeholdersOf({ one: 'one {x}', other: '{n} {x}' })).toEqual(['n', 'x']);
  });
});
