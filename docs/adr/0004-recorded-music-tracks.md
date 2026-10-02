# ADR 0004: Recorded music tracks, streamed and looped

## Status

Accepted. Supersedes the music part of ADR 0002 (the generated themes remain as a fallback).

## Context

The owner supplied two recorded tracks to replace the generated music: _Gentle Piano_ for
everything outside battle and _Thunderous Charge_ for battles. Each is a ~4.7 MB, 9–10 minute
MP3. The game is a mobile-first PWA and also ships as a single-file page.

## Decision

- `platform/musicTracks.ts` maps moods to tracks: title and story (which also covers
  preparation, results and the ending) play the piano; battle and boss play the charge.
- Tracks play through looping `<audio>` elements routed into Web Audio, so the 1.5 s crossfades
  and the music volume work everywhere, including iOS. They are not decoded in full: a decoded
  10-minute stereo track would take about 230 MB of memory on a phone. The cost is a brief gap
  at the loop point, once every 9–10 minutes.
- The piano pauses (rather than resets) while a battle plays and resumes where it left off;
  battle music starts from the top in each battle. Everything pauses when the page is hidden.
- The files are not precached. Each is fetched in full the first time it plays and kept by a
  service-worker `CacheFirst` route with range-request support, so it then works offline.
- If a track fails to load, the generated Maltese-folk theme for that mood plays instead.
- The single-file build embeds both tracks as data URIs (about 14 MB in all).

## Consequences

- The first visit streams music instead of downloading it up front; offline play needs one
  online play of each track.
- Licensing: the tracks were made on a paid Suno plan (commercial use); see assets/CREDITS.md.
