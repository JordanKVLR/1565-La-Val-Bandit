# ADR 0006: The opening cinematic plays in-engine from the trailer renderer

## Status

Accepted.

## Context

The game needs an opening cinematic before the Prologue: about four minutes long, cut to the
full length of _Under the Red Sun_ (227.08 s), skippable, and replayable. It was built as a
deterministic canvas renderer in `docs/trailer/src` (`renderFrame(t)` draws any frame), which
also renders the 1080p video master (not committed; render it with `docs/trailer/render.mjs`).

Shipping the MP4 would add about 85 MB to every build (web, PWA, Android, iOS and Steam). It
would also be blurry on large screens and need re-encoding for every text fix. The renderer
code is about 200 KB.

## Decision

- **The game runs the renderer itself.** `vite-plugin-intro.ts` copies the renderer scripts and
  fonts from `docs/trailer` into `apps/game/public/intro/` at the start of every dev or build
  run. That folder is generated and git-ignored, so `docs/trailer/src` stays the single source.
  The generated `index.html` points portraits at `art/portraits/`, which holds the same files
  the master used.
- **`IntroScreen` hosts the page in a same-origin iframe** and calls its `renderFrame(t)` once
  per animation frame, skipping a frame while the previous one is still drawing.
- **The song is the clock.** `t` is the song's `currentTime`, so picture and music cannot drift
  apart. If the song fails to load, a wall clock takes over. If the browser blocks autoplay, a
  "Tap to begin" overlay waits for a tap.
- **Phones draw fewer pixels.** The backing store is sized to the screen (`introScale`): between
  40% and 100% of 1080p, never above it. The canvas is letterboxed with `object-fit: contain`.
- **When it plays:**
  - It plays on every New Game, then the Prologue starts.
  - Skip (44 px or larger, inside the safe area) or Escape ends it at any time.
  - Settings on the title screen offers "Watch intro", which returns to the title afterwards.
  - Game music stops while it plays, and it follows the Music volume setting.
- **The song ships as a static file** (`public/music/under-the-red-sun.mp3`, 160 kbps), not as a
  bundled asset. The PWA caches it on first play like the other tracks, and the single-file
  preview build leaves it out. That build also has no `intro/` folder, so the screen gives up
  after 15 s without the page and goes straight to the Prologue.

## Consequences

- A text or timing fix in `docs/trailer/src` reaches the game on the next build, with no video
  re-render. The MP4 master is only for sharing outside the game.
- The renderer is plain browser scripts that share globals. ESLint treats `docs/trailer/src` as
  scripts and turns off `no-undef` and unused-variable checks there. The generated
  `malta_geo.js` is excluded from Prettier and ESLint.
- Every e2e test that starts a new game first presses Skip. `e2e/intro.spec.ts` covers the
  cinematic, the song request, Skip, Escape and the Settings replay.
- The cinematic must keep `window.renderFrame` and `window.ready` as its contract with the game.
