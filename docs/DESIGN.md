# Design language: dark glass and gold hairlines

The UI of Armatura 1565 is drawn with one small design system: tokens in
`apps/game/src/ui/design/tokens.css`, Preact components in `apps/game/src/ui/design/`, and their
styles in `apps/game/src/ui/design/components.css`. ADR 0013 records why. The battle unit card,
action bar, step prompt and unit details sheet (`ui/battle/UnitPanels.tsx`,
`ui/battle/ActionMenu.tsx`, `ui/battle/hud.css`) are the reference implementation: read them
before converting a screen.

## Principles

1. **Map first, calm always.** The battle map is the picture. Panels are translucent dark
   glass that let it show through, sit at the edges, and stay out of the way. No full-width
   bars or boxes that are not needed right now.
2. **Hierarchy before decoration.** One thing is most important on each surface (the unit's
   name, the main action, the number that changes). It gets the size, the weight or the
   accent; everything else steps back in size and colour (`--ds-text-2`, `--ds-text-3`).
3. **One accent colour.** Gold (`--ds-gold`) marks what is selected, current, primary or
   new. Nothing else is gold. Side colours (blue, orange) mean sides, and only that.
4. **Hairlines over boxes.** Separate with space first, a 1 px gold or neutral hairline second,
   and a surface third. No double borders, inner frames, bevels, lace strips, painted shutters
   or thick red buttons.
5. **Essentials by default, details on demand.** A card shows name, level and HP/AP/FP. The
   rest (attributes, equipment, techniques, skills) is one tap away in a `Sheet`.
6. **Period flavour through restraint.** Cinzel inscriptional capitals for names and headings,
   a small Maltese cross or crescent on a divider, warm ink and gold. Never clutter.
7. **Never colour alone.** The owner is colour-blind. Every state that has a colour also has a
   shape, a pattern, a label or a position (see _Colour-blind rules_).

## Tokens

All tokens are custom properties named `--ds-*` on `:root`. Use them, never raw values; the
design test (`ui/design/design.test.ts`) fails if a stylesheet uses a `--ds-*` token that
`tokens.css` does not define, and if the converted screen styles contain a hex colour.

### Colour

| Token                                                | Value                                        | Use                                                      |
| ---------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------- |
| `--ds-ink-0` / `-1` / `-2`                           | `#0b0a0e` `#14121a` `#1d1a24`                | Solid grounds (full-screen pages, focus halo)            |
| `--ds-glass-1`                                       | ink at 58% (86% without blur)                | Chips, HUD readouts, slim bars, secondary buttons        |
| `--ds-glass-2`                                       | ink at 70% (92%)                             | Cards, panels, action bars                               |
| `--ds-glass-3`                                       | ink at 84% (97%)                             | Sheets, dialogs, tooltips                                |
| `--ds-sheen`                                         | 6% warm-white top gradient                   | Laid over glass so it reads as a surface                 |
| `--ds-wash-hover` / `--ds-wash-press`                | 7% / 12% warm white                          | Hover and pressed states                                 |
| `--ds-scrim`                                         | ink at 56%                                   | Modal backdrop                                           |
| `--ds-gold` / `--ds-gold-bright` / `--ds-gold-deep`  | `#d4b26a` `#f0d48e` `#9c7d3c`                | The accent; bright for selected text; deep for fills     |
| `--ds-hairline` / `--ds-hairline-strong`             | gold at 42% / 75%                            | Panel outlines, dividers                                 |
| `--ds-hairline-soft`                                 | warm white at 12%                            | Rows, tracks, neutral separators                         |
| `--ds-gold-wash`                                     | gold at 16%                                  | Selected and pressed backgrounds (with a non-colour cue) |
| `--ds-text` / `--ds-text-2` / `--ds-text-3`          | `#f4eedf` at 100 / 80 / 62%                  | Primary / secondary / muted text (all ≥ 4.5:1 on glass)  |
| `--ds-text-on-gold`                                  | `#1a140a`                                    | Text on primary buttons and badges                       |
| `--ds-side-player` / `--ds-side-enemy`               | `#1f6fb5` / `#d0700a`                        | Sides (Okabe-Ito, same as `render/palette.ts`)           |
| `--ds-side-player-text` / `--ds-side-enemy-text`     | `#8cc2f0` / `#f2aa58`                        | Side colour for text and rings on dark glass             |
| `--ds-meter-hp` / `-ap` / `-fp` / `-xp` / `-neutral` | `#3eb489` `#5ab4e8` `#e9c94e` `#e8dcbc` gold | Meter fills (always with label and pattern)              |
| `--ds-meter-track` / `--ds-meter-preview`            | black at 45% / `#fff3cf`                     | Meter track; cost/gain preview outline and hatch         |
| `--ds-danger` / `--ds-danger-wash`                   | `#e27a62` / 16%                              | Destructive actions (always with a glyph and confirm)    |
| `--ds-focus`                                         | `#ffd76a`                                    | Focus ring                                               |

### Type

| Token                                  | Value                                                         |
| -------------------------------------- | ------------------------------------------------------------- |
| `--ds-font-display`                    | Cinzel: headings, names, button and tab labels                |
| `--ds-font-body`                       | Alegreya Sans (400/500/700): body text, numbers, small labels |
| `--ds-text-2xs` … `--ds-text-display`  | Fluid sizes, see below                                        |
| `--ds-text-scale`                      | 1; 1.15 with Large text; 1.06 in TV mode (1.2 with both)      |
| `--ds-leading-tight` / `--ds-leading`  | 1.15 / 1.4                                                    |
| `--ds-track-caps` / `--ds-track-label` | 0.06em (Cinzel) / 0.08em (small uppercase labels)             |
| `--ds-weight-regular/medium/bold`      | 400 / 500 / 700                                               |

Sizes are `clamp(min, rem + k × --vh, max) × --ds-text-scale`, on the zoom-safe `--vh` unit (ADR
0010), so a 360 px-tall phone gets the minimum, the Deck the maximum and TV mode lands between
them before its zoom:

| Token               | Phone 360–393 px | Deck 800 px | TV 1080p (on screen) |
| ------------------- | ---------------- | ----------- | -------------------- |
| `--ds-text-2xs`     | 11 px            | 11 px       | ≈ 21 px              |
| `--ds-text-xs`      | 12 px            | 12 px       | ≈ 23 px              |
| `--ds-text-sm`      | 13 px            | 13.3 px     | ≈ 25 px              |
| `--ds-text-md`      | 15 px            | 15.5 px     | ≈ 29 px              |
| `--ds-text-lg`      | 17 px            | 18 px       | ≈ 32 px              |
| `--ds-text-xl`      | 20 px            | 21.6 px     | ≈ 38 px              |
| `--ds-text-2xl`     | 24 px            | 27 px       | ≈ 46 px              |
| `--ds-text-display` | 32 px            | 43 px       | ≈ 68 px              |

The maxima are reached on taller desktop windows (1080 px and up).

Alegreya Sans draws old-style figures by default; the components set `lining-nums` (and
`tabular-nums` where numbers line up, as in meters and stats).

### Space, shape, depth

| Token                            | Value                                                            |
| -------------------------------- | ---------------------------------------------------------------- |
| `--ds-space-0/1/2/3/4/5/6/8/10`  | 2 4 8 12 16 20 24 32 40 px                                       |
| `--ds-edge`                      | 12 px: HUD distance from the screen edge (plus safe-area insets) |
| `--ds-hit` / `--ds-hit-lg`       | 44 / 52 px: minimum hit areas                                    |
| `--ds-radius-xs/sm/md/lg/pill`   | 2 / 4 / 6 / 10 px / 999 px (pills for chips only)                |
| `--ds-border`                    | 1 px                                                             |
| `--ds-shadow-1/2/3`              | Soft, layered: chips / panels / sheets                           |
| `--ds-inner-light`               | 1 px warm top highlight on raised glass                          |
| `--ds-blur` / `--ds-blur-strong` | 14 / 22 px backdrop blur                                         |
| `--ds-text-shadow`               | Only for text straight over the scene                            |

### Motion, layers, focus

| Token                                                           | Value                                               |
| --------------------------------------------------------------- | --------------------------------------------------- |
| `--ds-dur-press` / `-fast` / `-base` / `-slow`                  | 90 / 140 / 220 / 320 ms (all 0 with reduced motion) |
| `--ds-ease-out` / `--ds-ease-in-out`                            | `cubic-bezier(.2,.8,.2,1)` / `(.4,0,.2,1)`          |
| `--ds-rise`                                                     | 6 px entrance travel (0 with reduced motion)        |
| `--ds-z-hud/actionbar/popover/toast/modal/sheet/tooltip/system` | 10 / 20 / 30 / 40 / 50 / 60 / 70 / 120              |
| `--ds-focus-width` / `--ds-focus-offset` / `--ds-focus-halo`    | 2 px / 2 px / dark halo around the ring             |

## Components

Import from `ui/design` (`import { Button, Panel } from '../design'`). Every visible string is a
prop taken from the string table (`t('…')`); the lint guard already catches literals in `label`
and `title` props. Components never use the legacy classes, and legacy styles never reach the
`ds-` classes.

### Panel

`<Panel elevation={1|2|3} as="div|section|aside|nav|header|footer" title? titleLevel={2|3}
ornament?="cross|crescent|…" outlined={true} compact={false} class? testId? role? aria-label?>`

A glass surface with a gold hairline, soft shadow and a gold catch-light along the top edge.
`title` adds a centred Cinzel heading over a hairline (with `ornament` on it).

- Do: one panel per idea; nest content with space and `Divider`, not more panels.
- Don't: panels inside panels, coloured panel backgrounds, `outlined` and a second border.

### Button

`<Button label variant="primary|secondary|ghost|danger" size="sm|md|lg" icon? iconOnly?
keyHint?="move|attack|confirm|back|…" keyContext?="battle|menu|armoury" disabled? reason?
detail? pressed? confirmLabel? onClick block? navBack? navDefault? type? class? testId? id?
title? aria-describedby? aria-controls? aria-expanded?>`

- `primary`: the single main action on a surface (gold fill, dark text). At most one per surface.
- `secondary` (default): glass with a gold hairline. Inside an `ActionBar` it is flat.
- `ghost`: text only, for Back, Close and repeated quiet actions.
- `danger`: danger-tone hairline plus a warning glyph; with `confirmLabel` the first press arms
  it (the label changes, the button fills) and the second press acts. It disarms after 3.5 s or
  on blur.
- `iconOnly`: `label` becomes the `aria-label` and the tooltip.
- `disabled` + `reason`: the reason shows under the label and is read with it. Prefer this to
  a greyed-out button with no explanation.
- `pressed`: a toggle (aria-pressed), drawn with a gold wash, gold text and a 2 px gold rule.
- `keyHint` shows the keyboard key or pad glyph (`KeyHint`, ADR 0009); it hides on touch.
- `navBack` / `navDefault` set `data-nav-back` / `data-nav-default` for Esc/Ⓑ and Ⓐ.
- Every size keeps a ≥ 44 px hit area (`sm` draws 32 px and extends its hit area invisibly).

### ActionBar

`<ActionBar label orientation="horizontal|vertical" as="toolbar|nav" class? testId? barRef?>`
with `Button`s and `<ActionBarSeparator />` before the commit action (End Turn, Confirm).

To pin a bar beside a point on the map, put it in a layer that covers the map exactly and use
`useAnchor(ref, source, enabled, insets, { gap, lift, prefer, avoid })` with an `AnchorSource`
(`point()`, `subscribe(onChange)`, optional `avoid()`); see `ActionMenu.tsx`. The placement
(`placeBeside` in `logic.ts`) takes the side towards the nearer screen edge, avoids covering
other units and stays inside the HUD and title-safe insets.

### Meter

`<Meter label value max kind="hp|ap|fp|xp|neutral" delta? showMax? valueText? stacked? thin?
title? class? testId?>`

A labelled bar with its number; the track is `role="meter"` with `aria-valuetext`. `delta`
previews a change: negative is a cost (the segment is cut out: outlined and nearly empty),
positive a gain (hatched); the number reads `100→44` and turns gold. HP at a quarter or less gets
a ▼ and the danger tone. Order is always HP, AP, FP.

### Chip, Badge, SideMark

`<Chip tone="neutral|gold|player|enemy|danger" icon?|null label? title? class? testId>` — a small
non-interactive pill (status, tag, terrain readout). Side tones add the side's shape; danger adds
a warning glyph.
`<Badge value label>` — a gold count with an accessible meaning ("2 points to spend").
`<SideMark side="player|enemy" label?>` — circle (player) or diamond (enemy) in the side colour.

### Tabs and TabPanel

`<Tabs label tabs={[{ id, label, testId?, disabled?, count? }]} value onChange idPrefix class?>`
and `<TabPanel id idPrefix class? testId?>`. The current tab has gold text, bold weight and a
gold underline. Every tab is a tab stop, so the D-pad reaches them, and `[ ]`/LB RB switch tabs
(ui/input.ts).

### Sheet

`<Sheet label title?|null onClose closeLabel placement="side|bottom|center" size="sm|md|lg"
ornament? footer? dismissible? class? testId?>` — render it only while open.

A modal dialog on a dimmed backdrop: `side` slides in from the right at full height (details on
demand, the map stays visible on the left), `bottom` rises from the bottom edge (short choices on
phones), `center` is a classic dialog. Focus moves in (to `[data-nav-default]` if present) and
back on close, Tab is trapped, and Esc/Ⓑ press its close button through `data-nav-back`, so the
screen decides what closing means. In TV mode its backdrop bleeds to the screen edge like
`.modal` (tv.css), and the pad uses the menu control table inside it.

### Tooltip and Hint

`<Hint text icon? class? testId?>` — visible muted helper text. Prefer it: it works on touch
and on a TV.
`<Tooltip text placement="top|bottom|left|right">{(p) => <Button {...p} … />}</Tooltip>` — for
pointer and keyboard only (hover or focus), and it describes its trigger. Never the only place
a fact lives.

### Divider, Stat, StatGrid, Icon

`<Divider glyph? vertical? class?>` — a gold hairline that fades at both ends, optionally with a
small glyph in the middle (`cross`, `crescent`).
`<StatGrid columns={1–4}><Stat label value note? title? emphasis? /></StatGrid>` — label in small
spaced capitals over a tabular value; `emphasis` for the one number that matters.
`<Icon name size? label? class?>` — see _Iconography_.

## Layout per viewport

| Viewport                  | CSS size (before zoom)     | Layout                                                                                                                                                                                                |
| ------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phone landscape (Pixel 5) | 851×393                    | `@media (max-height: 520px)` (`PHONE_QUERY`). Bars dock to the bottom edge, horizontal; cards shrink (avatar 40 px); sheets use 6–8 px edges. Content inside `env(safe-area-inset-*)`.                |
| Small phone               | 800×360                    | As above; check nothing wraps to two lines in a bar and the card fits 36% of the width.                                                                                                               |
| Steam Deck / desktop      | 1280×800                   | Action bar anchored beside the unit (vertical); step prompt bottom centre; cards bottom left; sheets 520–820 px wide. Key prompts show with a mouse or keyboard.                                      |
| TV 1080p / 4K (ADR 0010)  | ≈ 960×540 then ×1.8 / ×3.6 | Same as Deck (media queries see the real screen, so phone rules never apply). Everything inside the 5% title-safe area; pictures and backdrops bleed. Pad glyphs always. No `.pointer-only` controls. |

Rules for all of them:

- Use `calc(n * var(--vh))` / `var(--vw)` / `var(--dvh)`, never raw viewport units (a test
  enforces it).
- HUD pieces sit `max(var(--ds-edge), env(safe-area-inset-*))` from the edge.
- Anything with a backdrop that should reach the screen edge in TV mode joins the bleed list in
  `tv.css`; anything positioned against the map joins the canvas rule (like `.bhud-layer`).
- Landscape only; touch first; no text under `--ds-text-2xs`.

## Iconography

- Inline SVG from `ui/design/Icon.tsx`: a 24-unit grid, 1.75 stroke, round caps and joins,
  `currentColor`, 1 em by default. Ornaments and side marks (`cross`, `crescent`, `circle`,
  `diamond`) are filled.
- Draw new glyphs into the same file; no emoji, icon fonts or bitmap icons in the UI.
- Icons sit before labels in buttons. Icon-only buttons are for universally understood actions
  (menu, close, rotate, info) and always have a `label`.
- Decorative by default (`aria-hidden`); pass `label` only when the glyph carries meaning alone.

## Motion

- Things fade and rise into place (`--ds-rise`, `--ds-dur-base`); sheets slide in from their
  side (`--ds-dur-slow`). Presses move 1 px (`--ds-dur-press`).
- Nothing loops except the cost/gain preview pulse on a meter, which stops with reduced motion.
- Elements that follow the camera (the anchored action bar) move instantly, never eased.
- With `prefers-reduced-motion`, every duration token is 0 and travel is 0; `input.css` also
  stops CSS animations globally.

## Colour-blind rules

- Never rely on red/green or blue/purple alone; pair every colour with a shape, pattern, label or
  position.
- Sides: blue **circle** (player), orange **diamond** (enemy), everywhere: turn queue, side marks,
  chips, avatar rings.
- Meters: always labelled (HP/AP/FP), always in that order, and patterned: HP solid, AP notched
  every 10%, FP hatched. A cost preview is an outline, a gain is a hatch, not a hue.
- Selected/pressed: gold plus a rule, an underline or bold weight.
- Danger: a warning glyph and a confirm step, never just the danger tone.
- Low HP: ▼ and bold, as well as the danger tone.

## Migrating a screen

Convert a whole surface at a time, keep every `data-testid`, role and accessible name the e2e
tests use, and delete the legacy CSS your screen no longer renders (search the `.tsx` files for
the class first; other screens may share it).

| Old                                                                                          | New                                                                                                   |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `<button class="btn">` (red shutter)                                                         | `<Button variant="primary">` for the main action, `secondary` otherwise                               |
| `.btn.ghost`, `.btn.tab` (green shutter)                                                     | `<Button variant="ghost">` or `secondary`; tabs → `<Tabs>`                                            |
| `.btn.icon` (☰ ⟲ ⟳ glyph text)                                                              | `<Button iconOnly icon="menu" label={t('common.menu')}>`                                              |
| `.btn.go`                                                                                    | `<Button variant="primary" size="lg">`                                                                |
| `.btn` that quits or deletes                                                                 | `<Button variant="danger" confirmLabel={t('…confirm')}>`                                              |
| `.modal` + `.modal-box` + `<h2>` + close `.btn data-nav-back`                                | `<Sheet placement="center" label title closeLabel onClose>`; its close button carries `data-nav-back` |
| Detail popups (`.vbd`, item details)                                                         | `<Sheet placement="side" size="lg">`                                                                  |
| `.vb-panel`, `.vb-forecast`, `.panel`, `.map-name`, `.turn-banner`                           | `<Panel elevation={2}>` (`compact` for HUD pieces); readouts → `<Chip>`                               |
| `.gallarija`, `.title-menu`, `.vb-commands` (balcony frames)                                 | `<ActionBar orientation="vertical">` or a plain column of `<Button block>`                            |
| `.vb-cmd` command rows                                                                       | `<Button block variant="secondary">` inside an `ActionBar`; `.on` → `pressed`; `small.why` → `reason` |
| `VbBar`, `Bar`, `.bar-*`, `.vb-track`                                                        | `<Meter kind="hp" delta>` (or `ap`, `fp`, `neutral`)                                                  |
| `AttributeBars`, `.vb-ticks`                                                                 | `<Meter kind="neutral" showMax={false} valueText>` per attribute                                      |
| `.vbd-list` `<dl>` / label–value rows                                                        | `<StatGrid><Stat label value /></StatGrid>`                                                           |
| Lace (`--mt-lace`), luzzu bands, cornice/corbel `::before/::after`, `--mt-badge` before `h2` | `<Divider glyph="cross">` under a heading, or nothing                                                 |
| `.help-tabs` / `.seg` segmented buttons                                                      | `<Tabs>`; a binary setting stays a pressed `Button` pair                                              |
| `title="…"` explanations on touch screens                                                    | `<Hint>` (visible) or the help/sheet; `<Tooltip>` only as an extra                                    |
| `.terrain-label`, `.objective`, `.notice`                                                    | `<Chip>` / `<Panel elevation={1} compact>`                                                            |
| Raw colours (`#c23b35`, `var(--mt-*)`, `var(--vb-*)`)                                        | `--ds-*` tokens                                                                                       |

Checklist for each screen:

1. Wrap the screen's surfaces in `Panel`/`Sheet`/`ActionBar`; replace buttons with `Button`.
2. Move strings into `en.ts` (keys stay; new ones for new labels) and pass them as props.
3. Keep or add `data-testid`s; run the screen's e2e spec on phone, Deck and (if it has one) TV.
4. Check 851×393, 800×360, 1280×800 and TV 1080p for overflow, the 44 px hit areas, focus
   rings with a pad, and that nothing depends on colour alone.
5. Remove the legacy rules for classes no component renders any more (`styles.css`,
   `maltese.css`, `input.css`), and anything in `tv.css` that only served them.

The Maltese motifs in `maltese.generated.css` stay available for full-screen backgrounds (a
madum tile behind the title, faint, under a scrim) if a screen wants them; never as frames.
