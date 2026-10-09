# ADR 0010: TV mode (10-foot layout) and a resolution cap for 4K

## Status

Accepted.

## Context

The owner wants the game ready for Xbox and PlayStation before choosing how to port it. On a
console the game is played on a TV from about 3 m away, with only a controller. The DOM UI was
designed for a landscape phone and the Steam Deck: on a 1080p TV, 16 px body text is tiny, and
TVs can crop the picture edge (overscan), so platform guidelines ask for a title-safe area. A
4K TV also has 4× the pixels of 1080p for the battle renderer to fill.

## Decision

### TV mode

- **Settings → Display: Auto / Handheld / TV** (`settings.display`, default Auto).
  `platform/displayMode.ts` (pure, unit tested) decides: Auto picks **TV** when the last input
  was a gamepad **and** the viewport is at least 1600×900 CSS px (`data/display.json`
  `tvAuto`). So a 1080p or 4K TV (also a 4K TV at 200% scaling, 1920×1080 CSS px) with a pad is
  TV; the Steam Deck (1280×800), phones, small windows and any big screen played with mouse,
  touch or keyboard stay handheld. There is no reliable "TV" media query (`@media tv` matches
  nothing in browsers), so size + input is the signal. The last input is remembered between
  launches (`armatura.display.lastInput`), so a TV game opens in the TV layout; a mouse click or
  key press switches Auto back to handheld.
- **One root switch.** `platform/display.ts` sets `<html data-display="tv">` and two custom
  properties: `--ui-zoom` and `--tv-safe`. `ui/tv.css` applies `zoom: var(--ui-zoom)` to the root,
  so every screen scales — px, rem and em alike — without per-screen TV rules. The page is laid
  out at about 1000×600 CSS px (`tv.layoutWidth/Height`) and zoomed to fill the screen: 1.8× at
  1080p, 3.6× at 4K (capped at `maxZoom` 4). Body text (16 px) is 28.8 px at 1080p; buttons are
  31.7 px. Small labels (11–14 px) land at 20–25 px; the very smallest (the facing picker's
  "now", the reaction reasons) get a TV floor of 0.75 rem.
- **Title-safe area.** `#app` is inset by `safeZone` (5% per side, data-driven) on top of the
  `env(safe-area-inset-*)` paddings the screens already use, and `contain: layout` makes it the
  containing block of full-screen (`position: fixed`) screens and dialogs, so all text and
  controls stay inside. Pictures still reach the screen edge: each screen root and each
  full-screen overlay (close-up, end of battle, chapter card) grows into the margin behind a
  transparent border as wide as the margin, so its background bleeds while its padding box (where
  content goes) is the safe area; the battle, story-stage and duel canvases and the modal
  backdrops are extended the same way.
- **Viewport units.** Under CSS zoom, `100vh` is zoom × the screen. Stylesheets therefore use
  `--vw`, `--vh` and `--dvh` (defined in `tv.css`: 1% of the area the UI may use — the viewport
  normally, the safe area in TV mode), e.g. `calc(55 * var(--vh))`. The 22 existing uses were
  converted mechanically; `ui/styles.test.ts` fails on any new raw viewport unit.
- **Media queries still see the real screen.** CSS zoom does not change what media queries and
  `matchMedia` measure. At zoom 1.8 the TV layout's safe area (≈960×540) stays in the same
  bands as a 1080p screen for every breakpoint the game uses (none of the `max-height: 520px`
  phone rules apply), except the Armoury's desktop layout (`min-width: 1100px`), which `tv.css`
  narrows: tighter fixed columns, and only the open shelf tab is labelled (the others show their
  icon; LB/RB switch). This is why the zoom is not larger: at ~1.93 the safe area drops under
  520 px tall, where the phone layouts would be needed but would not apply. The title screen
  uses its two-column (name | menu) layout in TV mode so a full menu fits.
- **No touch or mouse affordances.** `.pointer-only` elements are hidden in TV mode: the ⟲ ⟳
  rotate buttons (LT/RT rotate), the Touch section and the mouse tip on the Controls page.
  Prompts show pad glyphs in TV mode until a keyboard is used (`usePromptDevice` in KeyHint), and
  sentences that said "tap" now follow the input ("Press Ⓐ to begin", "press Ⓐ again to move",
  "pick a marked enemy").

Alternative considered: browser/page zoom (Electron `webFrame.setZoomFactor`, WebView2
`ZoomFactor`), which changes the CSS viewport and device pixel ratio so media queries and
viewport units just work. It only exists inside a native shell, not on the web build or in
Playwright, so CSS zoom is the baseline. A host adapter could switch to page zoom later
(Playwright's equivalent is viewport ÷ zoom with `deviceScaleFactor` = zoom). Steam's Big
Picture sets `SteamTenfoot=1`; the Electron shell could pass that as a TV hint (not done: the
preload is being changed in parallel).

### 4K rendering

Profiled the battle renderer (`?battle=b1-marsaxlokk`, headless Chromium with SwiftShader):

- No shadow maps; render-on-demand was already in place; terrain atlas 1024×(rows·128), unit
  badges 96×96, pattern textures 64×64 (8 textures in all, well under the 2048² budget); MSAA 4×
  (`antialias: true`); 12 786 triangles.
- **Draw calls: 153**, over the 100 budget of PLAN §5.5. 132 were highlight meshes (one per
  tile, plus two per outline piece). `render/highlights.ts` now merges each layer's fills and
  outlines (and each target frame's bars) into one mesh per material: **30 draw calls**,
  geometries 107 → 25. Unit arrows, badges and figures (≈4 per unit) are the rest.
- **Pixel ratio cap.** `render/resolution.ts` (pure, unit tested) gives every 3D view
  (battle, duel close-up, Armoury viewer) its pixel ratio: the screen density capped at
  `maxPixelRatio` (2, as before), times the CSS zoom so the TV layout renders at native
  resolution, then lowered so the drawing buffer stays under `maxRenderPixels` (2560×1440 =
  3 686 400, `data/display.json`). The browser scales the canvas up. Phones (e.g. Pixel 6a: 2×
  on 915×412 = 1.5 MP), the Steam Deck (1 MP) and 1080p (2.1 MP) are under the cap and render
  exactly as before; a 4K canvas renders 2560×1440 instead of 3840×2160 (2.25× fewer pixels).
  High-density laptops and tablets above 3.7 MP (e.g. a 2880×1800 MacBook) render slightly
  under their native density.

Measurements (ms per rendered frame incl. `readPixels` sync, 10-frame mean, SwiftShader on a
shared 4-CPU container, two runs; only the ratios mean anything — a real GPU is far faster and
less fill-bound):

| Screen / buffer           | Draw calls before → after | Frame time |
| ------------------------- | ------------------------- | ---------- |
| Deck 1280×800             | 153 → 30                  | 63–131 ms  |
| 1080p 1920×1080           | 153 → 30                  | 112–126 ms |
| 4K native 3840×2160 (old) | 153 → 30                  | 386–625 ms |
| 4K capped 2560×1440 (new) | 153 → 30                  | 178–319 ms |

Rendering cost here scales with pixels, so the cap cuts 4K fill work by about 2.25×. The
headless numbers cannot show GPU frame time, vsync or thermal limits; profile on target
hardware (Deck docked to a 4K TV, an Xbox Series S-class GPU) before tuning the cap. Lowering
`maxRenderPixels` (e.g. to 1920×1080 on weak hardware) is a data change; a "Render quality"
setting could expose it later.

## Consequences

- New CSS must use `var(--vh)`/`var(--vw)`/`var(--dvh)`, not raw viewport units (a test
  enforces it). New full-screen overlays with a background should join the bleed list in
  `tv.css`; new breakpoints should be checked at a TV zoom (the `tv-1080` and `tv-4k` Playwright
  projects run `e2e/tv.spec.ts`: no page scroll, title/battle/Armoury elements inside the safe
  area, full-bleed map, pad prompts, capped buffer, Auto switching).
- On-screen controls that only duplicate a pad button should carry `pointer-only`.
- Tuning lives in `packages/content/data/display.json` (validated by `DisplayConfigSchema`).
