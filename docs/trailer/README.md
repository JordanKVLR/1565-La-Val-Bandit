# Armatura 1565 trailer

A 1920x1080, 30 fps motion-graphics trailer, 227.08 s long, cut to the song _Under the Red Sun_
(129.25 BPM). Everything is drawn on a canvas as a pure function of time (`src/`), mixed with real
gameplay captures (`footage/`), then rendered frame by frame.

| Path                                  | What it is                                                                                                                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `armatura-1565-trailer.mp4`           | The trailer                                                                                                                                                                                |
| `armatura-1565-intro.mp4`             | The opening cinematic (story intro, ends at dawn on 18 May 1565); storyboard in `INTRO_STORYBOARD.md`                                                                                      |
| `under-the-red-sun.m4a`               | The soundtrack                                                                                                                                                                             |
| `src/`                                | Renderer: `engine.js` (helpers), `scenes_a/b/c.js` (trailer), `intro/` (opening cinematic shots and art kit), `malta_geo.js` (coastlines traced from reference maps), `main.js` (timeline) |
| `footage/stills`, `footage/portraits` | Gameplay screenshots and portraits used by the scenes                                                                                                                                      |
| `render.mjs`                          | Headless Chromium frame renderer (parallel workers piped into ffmpeg)                                                                                                                      |
| `assemble.sh`                         | Joins the segments, adds the song, encodes the final MP4                                                                                                                                   |

## In the game

The game plays the opening cinematic live from `src/`, not from the MP4. On every dev or build
run, `apps/game/vite-plugin-intro.ts` copies the scripts and fonts into
`apps/game/public/intro/`. Edits here reach the game on the next build. Keep
`window.renderFrame(t)` and `window.ready` working, since the game relies on them. See
`docs/adr/0006-opening-cinematic.md`.

## Rebuild

Needs Node 22, pnpm, ffmpeg, and the game's Playwright install (`pnpm install` at the repo root).
Gameplay clips are not committed (they are large). Scenes that use them (`CLIP(...)` in
`src/scenes_b.js`) read JPEG frames from `footage/frames/<clip>/NNNN.jpg`; extract those from the
MP4 clips in `footage/clips/` with `ffmpeg -i clip.mp4 -r 30 -q:v 4 footage/frames/<name>/%04d.jpg`.

```sh
cd docs/trailer && ln -sfn ../../apps/game/node_modules node_modules
node render.mjs --out build            # trailer, ~5 min on 4 cores
node render.mjs --page intro.html --out build-intro   # opening cinematic
./assemble.sh build armatura-1565-trailer.mp4
open src/index.html?t=41.5             # preview any single frame in a browser
```

## Structure (bars at 129.25 BPM)

Intro (sun over Malta) · siege map · Armatura reveal · Ninu and the broken medallion · title drop at
41.3 s · how it plays · the battle (attacks, reactions, facing, close-ups) · routes and endings ·
play both sides · cast · hold the line · campaign montage · build your Armatura · by the numbers ·
calm outro · finale.
