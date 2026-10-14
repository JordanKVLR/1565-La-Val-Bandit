# ADR 0014: The opening cinematic is a 43-second video

## Status

Accepted. Supersedes [ADR 0006](0006-opening-cinematic.md).

## Context

ADR 0006 played a four-minute canvas cinematic in-engine, drawn frame by frame from
`docs/trailer/src`. The project owner replaced it with a 43.2 s painted-ink animation cut to the
_Under the Red Sun_ remix: eight shots, in the style of the character portraits, ending on the
ARMATURA title. It was made with Higgsfield (see `assets/CREDITS.md`) and edited with ffmpeg. It
is a finished video, not something the game can render, so the game has to ship the file.

## Decision

- **`IntroScreen` plays a `<video>`**, full screen and letterboxed (`object-fit: contain`). The
  soundtrack is mixed into the video, so there is no separate audio element and no clock to keep
  in step. Volume follows the Music setting like the recorded tracks (`introVolume`).
- **Two encodings of the same video**, under `apps/game/public/cinematic/` and listed in
  `INTRO_SOURCES`; the browser takes the first it can decode:
  - `armatura-intro.mp4`: H.264 High and AAC, 1080p, 24 fps, about 3.5 Mb/s (19 MB). Plays on every
    phone, Safari, and the Android, iOS and Electron shells.
  - `armatura-intro.webm`: VP9 and Opus, 1080p, 24 fps, about 2.6 Mb/s (15 MB). For Chromium and
    Firefox builds without H.264, including the Playwright browser the e2e tests run in.

  A player downloads one of them. The native apps carry both (34 MB). 1080p is the floor for a TV
  (see ADR 0010): 720p stretched across a 4K set looks soft.

- **When it plays** is unchanged from ADR 0006: on every New Game before the Prologue, and from
  Settings on the title screen ("Watch intro"). Skip (44 px or larger, inside the safe area) or
  Escape ends it at any time, as does the video ending. Game music stops while it plays.
- **It never blocks the player.** `play()` is called at once (iOS Safari only loads a video then).
  If autoplay is refused, a "Tap to begin" overlay waits for a tap. If no source can be loaded or
  decoded, or nothing plays within 15 s, the screen ends and the Prologue starts. The single-file
  preview build has no video and takes this path.
- **The PWA caches the video the first time it plays** (`cinematic` runtime cache, with range
  requests), like the music. It is not precached: 15 to 19 MB would otherwise be added to every
  install, including players who never start a new game.
- **The renderer wiring is gone:** `vite-plugin-intro.ts`, the generated `public/intro/` folder,
  the iframe host, and the render-scale and clock helpers. `docs/trailer` stays for the trailer
  and for the old cinematic's renderer; the game no longer reads it.

## Consequences

- Changing the intro means re-editing and re-encoding the video, not editing code. The editing
  recipe (shot timings, flashes at 21.9 s and 38.1 s, the Cinzel title, one grade, 1080p H.264) is
  kept in the intro project notes; the two shipped files must always be encodings of the same cut.
- About 34 MB is added to the repository and to each native build (about 19 MB or 15 MB to a web
  player on first New Game). The files are binary, so replacing them grows the git history again;
  prefer replacing them rarely.
- The cinematic's backstory scenes (the four-minute version) are no longer shown. The Prologue and
  the Codex carry the setting.
- The video was made with generative AI. Some festivals and stores require disclosing that;
  `assets/CREDITS.md` records the tools.
- e2e tests play the VP9 file in Chromium. The H.264 file cannot be decoded there, so it is checked
  for presence and size by a unit test, and by hand in a browser that supports it.
