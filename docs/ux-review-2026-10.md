# UX and visual design review, October 2026

A review of the whole game after the dark-glass overhaul (ADR 0013, `docs/DESIGN.md`), done by
five parallel workstreams: the design system, the battle HUD chrome and map, the battle overlays,
the front-end screens and the Armoury. The question was whether the game now reads as **one**
calm, polished product, and what still breaks that.

## Method

A Playwright tour (dev server, debug entry points `?battle=`, `?armoury`, `?results`, `?end`,
and the dev module graph to raise states such as the controller notice, a reaction, a level-up
or the end of a battle) captured every screen at the five target viewports:

| Folder        | Viewport              | Notes                                  |
| ------------- | --------------------- | -------------------------------------- |
| `phone`       | 851×393, touch        | Pixel 5 landscape, the primary target  |
| `phone-small` | 800×360, touch        | Shortest supported phone               |
| `deck`        | 1280×800              | Steam Deck, mouse and keyboard prompts |
| `tv-1080`     | 1920×1080, TV display | ADR 0010 layout, pad prompts           |
| `tv-4k`       | 3840×2160, TV display | Same layout at ×3.6 zoom               |

Screens captured (file prefixes): `01` title, `02` settings, `03` codex, `04` difficulty,
`05` intro, `06` chapter card, `07` dialogue, `08` choices, `09` story menu, `10`–`12` title with
saves, load, New Game+, `13` controller notice, `14` rotate overlay (phones), `20`–`22` battle
start, idle, move preview, `23` objectives, `24` unit details (both tabs), `25` tap an enemy
(forecast), `26`–`28` techniques, target, forecast, `29` close-up, `30`–`31` experience,
`32` level-up, `33`–`34` reaction and strike-back list, `35` facing, `36`–`39` battle menu, log,
help, `40`–`41` victory, defeat, `50`–`51` results and Raise attributes, `52` end screen,
`60`–`66` Armoury shelf, detail, confirm, blocked, sell, training. "Before" and "after" sets were
kept outside the repository (see the hand-off report for their paths).

## Overall verdict

The overhaul worked. The battle screen is calm: the map is the picture, the chrome sits on one
12 px edge line, the turn queue reads by shape as well as colour, and essentials-first cards
with details in a side sheet are the right model. The front end (title, settings, codex, load,
New Game+) and the Armoury share the glass, the hairlines, Cinzel and the single gold accent.
What remained were seams between the workstreams and a few real usability faults, listed below
in priority order with what was done.

## Findings and fixes

### High

1. **Legacy chrome on the Results screen's Raise attributes sheet** (`*/51-results-raise`).
   It still drew `RosterStats`: old `.bar` rows, a boot icon, and green painted "+" buttons with
   a red outline, the only shutter-style buttons left in the game, next to the gold Done.
   **Fixed:** a shared `PilotAttributes` / `PilotSkills` block (`ui/PilotAttributes.tsx`,
   `ui/pilot.css`) now draws a pilot between battles, so the Results sheet and the Armoury's
   training sheet are the same component: attribute meters with gear's share, 44 px design
   raise buttons, MOV/HP, techniques, skills. `RosterStats` is deleted.

2. **The anchored action bar covered the movement range on the Deck and TV**
   (`deck/21-battle-idle`, `deck/22-move-preview`, `tv-1080/21-battle-idle`). It took the side
   towards the nearer screen edge, which on the opening map is exactly where the range lies, so
   five or six reachable tiles sat under it. **Fixed:** `placeBeside` takes `keepClear` points
   (the range's tiles, from the anchor source while Move is active) and also tries the spots just
   past the range's edge, level with the unit; units still weigh more than tiles; with
   `dockAbove: 2` the bar docks in the bottom-right corner when every spot beside the unit would
   still hide more than two tiles. Unit tests in `ui/design/logic.test.ts`. The bar now stands
   just left of the range (`after/deck/21-battle-idle`).

3. **The round banner drew over dialogs** (`deck/33-reaction`, `deck/35-facing`). A reaction can
   open the instant a round begins (an enemy acts first), and "ROUND 2" then sat on top of the
   forecast's numbers. **Fixed:** the banner is suppressed while any decision dialog or the menu
   is open (`BUSY_MODES` in `BattleScreen.tsx`).

4. **Truncated buttons in the Armoury's purchase confirm** (`deck/63-confirm`,
   `phone/63-confirm`): "Buy & equi…" and "Confirm B…" side by side, a gold fill and a danger
   fill competing. **Fixed:** while one action waits for its second tap it stands alone at full
   width; the warning line above it says why.

### Medium

5. **Item names cut to one line on phones and TV** (`phone/62-detail`, `tv-1080/60-armoury`):
   "Bastard Sword" showed as "Bastard", "Birgu Flanged Mace" as "Birgu", with no ellipsis. The
   name is a two-line clamp, but `overflow: hidden` made it a scroll container whose grid row
   could shrink to one line. **Fixed:** `overflow: clip`.

6. **Three different skill lists.** Boxed rows with a legacy border (battle unit details),
   hairline rows (training sheet, via scoped overrides) and the legacy boxes again (Results).
   **Fixed:** one style in `pilot.css` (hairline rows; star and "Active", or padlock, dashed rule
   and "Unlocks at Lv N"), and the bespoke SVG star and padlock replaced by `Icon` glyphs (a new
   `lock` glyph also serves the Armoury's blocked cards and reasons).

7. **Two sheet header styles with no rule** (`deck/09-game-menu` vs `deck/36-battle-menu`). The
   story menu drew a ✕ _and_ a Resume button, the battle menu only Resume; side sheets mixed the
   cross ornament with plain hairlines; Training had ✕ plus Keep training. **Fixed:** a
   `closeButton` prop on `Sheet` (replacing a battle-only `ov-sheet--noclose` class that hid the
   ✕ with CSS) and one rule, documented in DESIGN.md: side sheets have a left title, plain
   hairline and ✕; centre dialogs have the cross ornament, and those closed by their own main
   action (story and battle Menu, Level up, Experience, Training) draw no ✕, centre their title,
   and give that action `navBack` so Esc / Ⓑ press it (Experience's Continue now answers Ⓑ too).
   Settings keeps its ✕ because on phones its footer gives way to the settings. Help and
   Experience gained the ornament; the Results side sheet lost its redundant Done.

8. **Close-up "+152 XP" over the HP meter on phones** (`phone/29-closeup`). The pops were placed
   by percentages tuned for tall screens. **Fixed:** on phones damage, experience and level-up
   pops sit below the name plates.

9. **Leftover legacy CSS and components.** `maltese.css` (shutters, balconies, lace, `.modal-box`),
   most of `styles.css` (`.btn`, `.bar`, `.portrait` gradients, `.seg`, `.roster-stats`,
   `.skill-*`, `.xp-track`, legacy colour variables), stale rules in `input.css` and a `.modal`
   in `tv.css`; `StatBars.tsx` (`Bar`, `UnitBars`, `AttributeBars`, `StatIcon`, `MovIcon`) and
   `SkillList`'s unused `NewSkills` and `Padlock`. **Fixed:** all removed after checking each
   class had no remaining reference; what was still needed moved to its owner (`Portrait` to
   `battle/Portrait.tsx` with its styles in `hud.css`, the constants to `battle/stats.ts`, the
   key-prompt display rules to `input.css`). `styles.css`, `input.css` and `pilot.css` joined the
   design test's "tokens only, no hex colours" list.

### Low (noted, not changed)

- **Reaction dialog height.** The attacker and defender columns leave empty space under them
  because the answers column sets the height (`deck/33-reaction`). It reads fine; a denser
  layout would need the forecast model rearranged.
- **Results page balance.** On tall screens the two panels sit high with an empty middle
  (`deck/50-results`). Intentional (title, spoils, Continue on one reading line); revisit if
  the company grows past four pilots.
- **Armoury gold.** Positive stat deltas on cards are gold (`▲DMG +3`). That is "new / better",
  within the one-accent rule, and always carries the ▲, so it is kept.
- **Placeholder initials** in the Armoury's pilot rail and close-up avatars appear until the
  art manifest loads; a one-frame artefact of the tour, not a layout problem.

## Checks that passed without change

- Touch targets: every converted control keeps a ≥ 44 px hit area (`sm` buttons extend theirs).
- Colour-blind encodings: sides are circle/diamond everywhere, meters are labelled and patterned,
  blocked items carry a padlock and a hatched card, danger always has the warning glyph.
- TV: chrome, sheets and the Armoury stay inside the 5% title-safe area; prompts show pad glyphs;
  text sizes hold at 1080p and 4K.
- The rotate overlay and the controller-disconnected notice are on the design system.
