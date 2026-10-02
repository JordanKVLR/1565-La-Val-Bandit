# Red Sun video

Motion-graphics video for "Red Sun" (Armatura, Great Siege anthem). Remotion + React, everything drawn in code.
Outputs 1920x1080 and 1080x1920 H.264 MP4 with the song embedded.

## Run

```sh
npm install
npm run studio        # live preview: pick RedSunWide or RedSunTall
npm run render        # both formats into ./out
npm run render:wide   # out/red-sun-1920x1080.mp4
npm run render:tall   # out/red-sun-1080x1920.mp4
```

A full render takes a while (roughly an hour per format on 4 cores). To check a short range first:
`npx remotion render src/index.ts RedSunWide out/test.mp4 --frames=0-600 --scale=0.5`
(frame = (song seconds + 2) x 30, because of the 2 s black lead-in).

If Remotion cannot download its own browser, point it at any Chrome/Chromium:
`--browser-executable=/path/to/chrome --chrome-mode=chrome-for-testing`.

## Adjust timings

Everything is in `src/timeline.ts`, in **song seconds** (0 = first sample of the audio):

- `SECTIONS`: where each song section starts and ends.
- `CUES`: one-off moments (MALTA, 1565 card, title slam, ARMATURA, date card, fleet sinking).
- `LYRICS`: one line per entry with its start time (`end` optional). Some times came from the lyric track
  embedded in the audio file and are uneven (chorus 2 especially). Edit them freely.
- Keyframe tables, eased between points: `HEAT` (sun heat/size), `SUN_SCALE`, `DARK`, `DYN` (how hard the camera and
  grade punch on the beat), `SMOKE`, `ZOOM`, `SHAKE`, `PAN`, `FLEET`, `TORCHES`, `FORT`, `WATER`, `BANNERS`, `FLOOD`,
  `DEFENDERS`, `CRACKS`.
- Windows: `NAME_GLOWS`, `ARMS_UP`, `FLASH_WINDOWS`. Bridge figures: `BRIDGE`.
- `LEAD_IN` / `LEAD_OUT` (black seconds) and `SONG_SECONDS`.

## Toggle lyrics

`SHOW_LYRICS` in `src/timeline.ts`. Captions sit in the bottom safe area and hide while the RED SUN title is up.

## Beat sync

`scripts/analyse.py` reads `public/red-sun.mp3` and writes `src/audioData.json` (beat grid, drum hits, loudness).
Run `npm run analyse` after changing the audio (needs ffmpeg, python3, numpy). The beat grid is fitted to the audio,
about 128.8 BPM, not 120. If the pulse feels early or late, change the first-beat offset by editing `beats` in the JSON
or tune the search in the script. Live bass level also comes from `@remotion/media-utils` (`useSong.ts`).

## Swap in your own art

Put images in `assets/` (copy or symlink them into `public/` so Remotion can serve them) and reference them with
`staticFile("name.png")`. Good swap points, each a small self-contained component:

- Bridge characters: `Figure` in `src/parts/Heroes.tsx` (replace the SVG with an `<Img>` per hero).
- Medallion: `src/parts/Medallion.tsx`.
- Defenders: `Defenders` in `src/parts/Rampart.tsx`.
- Skyline and walls: `skyline()` in `src/parts/Land.tsx`.

## Vertical version

`RedSunTall` runs the same scenes through `useLayout()` (`src/layout.ts`), which sets the horizon, sun size, wall
height and caption size for 9:16. Tweak those numbers to reframe.

## Layout

```
src/timeline.ts   all timings, lyrics, palette
src/useSong.ts    beat, drum and loudness signals
src/World.tsx     scene stack, camera, grading
src/parts/        Sky/Sun, Sea, Land, Ships, Particles, Rampart, Fx, Heroes, Title, Text, Medallion
public/           red-sun.mp3 (trimmed at 3:34), fonts
```
