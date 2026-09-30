# ADR 0002: Music generated live, in a Maltese folk style

## Status

Accepted

## Context

The game shipped with a placeholder drone-and-arpeggio loop. The owner asked for music that is
far more melodic and uses the sounds of traditional Maltese music. We have no licensed
recordings, the web build must stay small, and everything must be original.

## Decision

Music is synthesised live with Web Audio by a small look-ahead sequencer (`platform/audio.ts`).
Tunes are data (`platform/musicThemes.ts`): original melodies written as scale degrees, per-bar
chord roots, and drum patterns. The voices imitate the Maltese instruments: żaqq (bagpipe) drone
and chanter, flejguta (reed flute), tanbur (frame drum), żafżafa (friction drum) and a
għana-style guitar. There are four moods: title, story, battle and boss (battles with a
"defeat the leader" objective).

The audio context is suspended as soon as the page is hidden (`visibilitychange`, `pagehide`)
and resumed when it returns, so phones never keep playing in the background.

## Consequences

- No audio files: zero download cost, works offline, nothing to license.
- Timbres are approximations. Recorded tracks can replace any mood later behind the same
  `music(mood)` call.
- A unit test checks that every phrase is exactly four bars long so the melody and the
  accompaniment never drift apart.
