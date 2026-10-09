# ADR 0012: One typed UI string table, built in house

## Status

Accepted.

## Context

PLAN §0 (decision 8) ships the game in English only, but says every UI string goes through one
i18n table so the game can be translated later. Console certification also expects system text
(menus, saves, controller notices) to be localisable. Until now none of it was: the Preact
components alone had English written straight in at 335 places (the new lint guard counts
them), more sat in the battle log, the Armoury model and the controls table, and many strings
were glued from pieces (`${pressWord} to continue`, `point${n === 1 ? '' : 's'}`). PLAN §5.1
lists i18next for this.

What the game needs from a string table:

- One English source table with stable, namespaced keys.
- `{name}` interpolation and plurals ("1 point" / "3 points"), correct for languages with more
  plural forms than English.
- A `t()` usable in TSX and plain TS (the battle controller, the Armoury model, the controls
  table), with type-safe keys.
- A missing key that stands out in development and degrades quietly in production.
- Small: the single-file build (`build:single`) inlines everything, and phones download it.

## Decision

### A small in-house table instead of i18next

`apps/game/src/i18n/` holds about 300 lines of code and the table:

- **`en.ts`**: the English source table, `as const satisfies MessageTable`: 557 keys such as
  `menu.saveToSlot`, `battle.turnBanner`, `armoury.did.buyEquip`. A message is a string with
  `{placeholders}`, or an object of CLDR plural forms (`{ one, other }`) chosen by `{n}`.
- **`format.ts`** (pure, unit tested): interpolation, plural choice through the built-in
  `Intl.PluralRules` (so Polish or Arabic get their `few` / `many` forms from the same table
  shape), splitting a message around placeholders so values can be elements, the `<b>` /
  `<strong>` / `<em>` emphasis markup, the translator with its missing-key rule, and
  `checkTable()`, which checks a translation against English.
- **`index.ts`**: the app's translator. `t(key, params)` returns text; `tParts(key, params)`
  returns parts for messages with an element inside (`Difficulty: <strong>Knight</strong>`);
  `tRich(key)` turns emphasis tags into elements for the help text; `setLocale()` and
  `pickLocale()` choose a language (`main.tsx` runs them before the first render, from
  `navigator.languages`).

**Type safety.** `MessageKey` is `keyof typeof en`, and the placeholders of each message are
read from its text with template-literal types: `t('menu.savedToSlot')` without `{ n }` fails
to compile, and so does a misspelt key. Keys built from ids
(``t(`difficulty.name.${d}`)``) are checked too, as long as every id has its key.

**Missing keys.** In a development build a key the active table lacks shows as `⟦key⟧` and
warns once in the console. In production it falls back to the English text, then to the key
itself. With English as the only table this happens only for a key built at run time from an
unexpected id.

**Why not i18next.** i18next would add roughly 40 KB minified (about 13 KB gzipped) plus a
Preact binding, for features the game does not use: namespaces loaded over the network,
language detection plugins, nesting, context, formatting hooks. Its keys are untyped unless
the resources are declared to TypeScript, and its `count`-based plurals need suffixed keys
(`key_one`, `key_other`). Plurals and number rules come from the browser's `Intl` either way.
The in-house module is about 2.6 KB minified (1.2 KB gzipped), has no dependency, and the table format (a flat
object of strings and plural objects) converts to and from i18next JSON or a translator's
spreadsheet in a few lines if the game ever needs more.

### What goes in the table, and what does not

In the table: every string a player reads in `apps/game/src`. That covers buttons, headings,
`aria-label`, `title` and `alt` text, toasts and notices, settings, the title, save, New Game+
and difficulty screens, codex screen chrome, the controller notice, the battle HUD, forecast,
log, results and help, the Armoury, the controls help table, the TV prompts ("Press Ⓐ to
continue") and the `KeyHint` key names.

Not in the table:

- **Story text** stays in the Ink script. Ink has its own route to translation (string tables
  per language, or one script per language).
- **Content data** already in JSON stays there: names and descriptions of characters,
  battles, maps, terrain, weapons, frames, gear, skills, codex entries, achievements and the
  armourers' and barks' lines. These are data, and can get their own per-language tables keyed
  by id later.
- **The starting techniques' names and descriptions** (Slash, Thrust, Fire…) are written in
  `packages/core/src/attacks.ts`. They belong with the other techniques (content data, keyed by
  attack id), not with the UI.
- **Developer messages**: thrown `Error`s and core's `CommandError` text, which the UI never
  shows unless it has a bug (it only offers legal commands and checks purchases first), test
  ids, CSS classes and console logs. If the controller ever logs a rejected command, the core
  message appears after `⚠` in the battle log; that is a bug report, not player text.
- **OS-level names**: `<title>` in `index.html`, the PWA manifest and the Electron window title
  say "Armatura 1565", the game's name. `main.tsx` also sets `document.title` from the table.

### Core stays free of text

The rules engine already emitted structured battle events, and the battle log was worded in the
game (`BattleController`); those lines now come from `log.*` keys. Two places in core still
produced English for the UI and were changed:

- The reasons a reaction or strike-back technique is greyed out (`ReactionChoice.reason`,
  `BackAttackOption.reason`) were strings such as `"Can't defend from behind"`. They are now
  codes with their numbers, `UnavailableReason` (`{ code: 'tooTired', fpCost: 35 }`), worded by
  `ui/battle/reasons.ts`. The core tests check the codes.
- `formatTerrainLabel` ("1H 10% Field") moved to the game as `terrainLabel` in
  `ui/battle/objectives.ts`.

The victory summary (`applyBattleResults`, `GameSession.finishBattle`) likewise returns
structured `ResultLine`s, worded by `ui/results.ts`.

### Whole sentences, never glued fragments

Hints that name the input in use have one full sentence per device
(`prompt.continue.pointer` "Tap to continue", `.keyboard` "Press Enter to continue",
`.gamepad` "Press {button} to continue"), instead of "Tap" + " to continue". Lists and separators
(`common.listSep`, `common.sep`, `objective.or`) are in the table too. The English output is
byte-identical to before, except where the old code got a plural wrong ("1 points to spend" in
the roster and the unit sheet, "1 stat points" on a pilot chip), which plural forms now fix.

### A lint guard against new hard-coded text

`eslint.config.js` adds `no-restricted-syntax` selectors for `apps/game/src/**/*.tsx`: JSX text
with a Latin letter, string and template-literal children (`{'Text'}`, `{ok ? 'Yes' : 'No'}`,
``{`Lv ${n}`}``), and literals in `aria-label`, `aria-description`, `aria-valuetext`,
`aria-roledescription`, `title`, `placeholder`, `alt` and `label`. Glyphs and numbers (×, ▲,
◆, ·, ☰, Ⓐ, 1565) pass because they have no letters; strings passed to a call (`t('…')`) are
never matched. `pnpm lint` fails on a violation. `i18n/guard.test.ts` runs ESLint on samples so
the guard itself is tested, and `i18n/en.test.ts` checks the table (key format, plural forms,
tags, no unused keys) and every shipped translation against English.

The guard does not see text passed through other props of our own components, or text built in
plain `.ts` files; code review and the unused-key test cover those.

## Consequences

- Adding a language is a new table plus one line in `LOCALES` (docs/I18N.md). The tests check
  its keys and placeholders against English.
- Changing English wording means editing `en.ts`; when the meaning changes, the key should be
  renamed so translators see it as new.
- Screens read strings as they render, so a language switch at run time shows on each screen's
  next render. There is no in-game language picker yet; a remount (or a reload) applies one.
- Numbers are inserted as written. Locale-aware number and date formatting
  (`Intl.NumberFormat`, the save card's date, which already uses the browser locale) is a
  later step if a translation needs it.
- PLAN §5.1's i18n row now points here.
