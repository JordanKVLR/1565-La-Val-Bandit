# Red Sun video: audio analysis and proposed timeline

Source: `Under_the_Red_Sun.m4a` (Opus, 48 kHz stereo). Section times come from the lyric track
embedded in the file, cross-checked against loudness. Not yet beat-snapped.

## Findings that differ from the brief

| Brief | Measured |
|---|---|
| ~3:00 long | **3:47 (227.1 s)** |
| 120 BPM | **~130 BPM** (low-band onset autocorrelation, stable across the whole song) |
| `red-sun.mp3` | Only an `.m4a` was uploaded; no `red-sun.mp3` exists in the repo |
| Song ends with outro | Outro piano fades to near-silence by ~3:26, then **loud material returns 3:34 to 3:46** (not in the lyric track). Possibly an unwanted extra tail |
| Verse 2, line 1 | Embedded timestamp gives it 1.2 s, then line 2 gets 9 s. Clearly misaligned; I will re-time by ear/energy |

## Proposed sections (seconds)

| # | Section | Start | End | Notes |
|---|---|---|---|---|
| 0 | Black lead-in | 0:00 | 0:02 | per brief (inside the audio's soft piano intro) |
| 1 | Intro (piano) | 0:02 | 0:13.6 | horizon line, sun rises, "MALTA, 1565" |
| 2 | Verse 1 | 0:13.6 | 0:29.5 | 4 lines, ~4 s each |
| 3 | Pre-chorus 1 | 0:29.5 | 0:41.3 | loudness ramps 0:30 to 0:38 |
| 4 | Chorus 1 | 0:41.3 | 1:09.3 | "Every stone" 0:52.7, "Oh-oh-oh" 1:07.8 |
| 5 | Verse 2 | 1:09.3 | 1:26.3 | needs re-timing |
| 6 | Pre-chorus 2 | 1:26.3 | 1:37.7 | |
| 7 | Chorus 2 | 1:37.7 | 2:07.7 | |
| 8 | Bridge | 2:07.7 | 2:40.9 | "Hold the line" 2:25.8 to 2:40.9 |
| 9 | Final chorus (key change) | 2:40.9 | 3:18.1 | loudness peaks 2:20 to 2:24 and from 2:34 on, so drums likely build earlier than the lyric track says |
| 10 | Outro | 3:18.1 | 3:34.4 | "7 SEPTEMBER 1565" ~3:28 |
| 11 | Tail | 3:34.4 | 3:47 | **decision needed** (see questions) |

## Lyric timestamps

The full per-line list is in the embedded track; I will copy it into `src/timeline.ts`
once confirmed, with Verse 2 re-timed.
