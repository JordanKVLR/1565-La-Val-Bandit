# ADR 0013: A small in-house design system (dark glass and gold hairlines)

## Status

Accepted.

## Context

The owner found the UI, the battle screen above all, "very messy and boxy": the Maltese theme
(ADR-less, PLAN §12) framed every list as a green balcony with a cornice and corbels, every panel
with lace and a double border, and every button as a red or green painted shutter. Each screen
had grown its own classes (`.btn`, `.vb-panel`, `.vb-cmd`, `.modal-box`, `.ar-panel`…) with raw
colours and sizes, so there was no shared vocabulary to restyle with. Every screen is about to be
overhauled in parallel by several agents, so they need one foundation first.

The owner chose: dark translucent glass panels that let the map show through, thin gold rules
instead of borders, Cinzel for headings and names with a refined body font, generous spacing;
a compact action bar beside the selected unit (a slim bar along the bottom on phones) instead of
the big command box; and essentials by default with details on demand.

## Decision

- **Tokens** (`ui/design/tokens.css`, loaded before every other stylesheet): colour (ink,
  three glass elevations with solid fallbacks without `backdrop-filter`, one gold accent with
  hairline strengths, three text levels, Okabe-Ito side colours, patterned meter colours,
  danger, focus), a fluid type scale on the zoom-safe `--vh` unit with a text-scale multiplier
  for Large text and TV, a 4 px spacing scale, small radii, layered shadows, blur, motion
  durations that drop to 0 with reduced motion, z-index layers and the focus ring. All are
  `--ds-*` custom properties, so they never collide with the legacy `--mt-*`/`--vb-*` ones.
- **Components** (`ui/design/`): `Panel`, `Button` (primary/secondary/ghost/danger with a
  two-step confirm, icon-only, sizes with ≥ 44 px hit areas, disabled reasons, KeyHint slot),
  `ActionBar`, `Meter` (label + pattern + value, cost/gain preview), `Chip`/`Badge`/`SideMark`,
  `Tabs`, `Sheet` (modal with focus trap, using the existing `data-nav-back` convention for
  Esc/Ⓑ), `Tooltip`/`Hint`, `Divider`, `Stat`/`StatGrid`, `Icon` (inline SVG, one stroke
  weight) and `useAnchor`. Their styles (`components.css`) use only `ds-` classes, so legacy
  rules cannot reach them and they cannot reach legacy markup; screens convert one at a time.
  The logic (meter geometry, confirm step, anchoring, focus trap) is pure and unit tested.
- **Body font: Alegreya Sans** (SIL OFL, `@fontsource/alegreya-sans`, 400/500/700, latin and
  latin-ext subsets for ħ ġ ż). A calligraphic humanist sans: legible at 11–13 px on phones,
  with lining and tabular figures for numbers, and it sits well beside Cinzel's Roman capitals.
  Palatino, the old body face, stays the fallback for unconverted screens.
- **The action bar is anchored to the active unit** on wide screens: a layer covering the map
  (extended like the canvas in TV mode) holds the bar, `BattleView.onFrame` reports every
  rendered frame, and `placeBeside` puts the bar on the side towards the nearer screen edge,
  avoiding other units and keeping inside the HUD and title-safe insets. Phones (`max-height:
520px`) dock it to the bottom edge, where a thumb reaches it and it never covers the range.
- **Reference implementation:** the battle unit card, action bar, step prompt, map controls,
  terrain readout and unit details sheet were converted end to end; their dead legacy rules
  were removed. `docs/DESIGN.md` is the design language and the migration guide.

Alternatives considered: a CSS framework or component library (Tailwind, Radix, Open Props) —
heavier than the handful of components needed, unfamiliar to the existing CSS, and the
single-file build inlines everything; restyling the legacy classes in place — every screen would
change at once, with the parallel agents fighting over the same selectors.

## Consequences

- New UI uses `ui/design` components and `--ds-*` tokens; `design.test.ts` fails on an
  undefined token or a hex colour in the converted battle HUD styles, and keeps the side colours
  in step with `render/palette.ts`.
- The legacy Maltese frames (`.gallarija`, lace, cornices, shutters) remain for unconverted
  screens and are deleted as screens move over. PLAN §12's motifs survive only as restraint
  (a cross on a divider, a madum ground behind a full-screen page).
- `backdrop-filter` over the WebGL canvas costs GPU time on phones; the battle renders on
  demand, the blur radius is a token, and without support the glass goes nearly solid.
- An anchored bar can still cover some of the movement range on wide screens; the map pans,
  keyboard and pad players never click under it, and the side choice avoids units. If players
  struggle, dock it on the Deck too (one media query).
