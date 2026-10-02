import type { Mood } from './musicThemes';
import chargeUrl from '../assets/music/thunderous-charge.mp3?url';
import pianoUrl from '../assets/music/gentle-piano.mp3?url';

/** The two recorded tracks (credits in assets/CREDITS.md). */
export const TRACKS = { piano: pianoUrl, charge: chargeUrl } as const;

/** Seconds for one track to fade out while the next fades in. */
export const CROSSFADE_S = 1.5;

/** Track loudness at full music volume (recordings are mastered louder than the synth). */
export const TRACK_VOLUME = 0.7;

/** Gentle Piano everywhere outside battle; Thunderous Charge in every battle. */
export function trackFor(mood: Mood): string | null {
  switch (mood) {
    case 'battle':
    case 'boss':
      return TRACKS.charge;
    case 'title':
    case 'story':
      return TRACKS.piano;
    case 'none':
      return null;
  }
}

/** Battle music starts from the top in each battle; the piano picks up where it left off. */
export function restartsOnEntry(from: Mood, to: Mood): boolean {
  return trackFor(to) === TRACKS.charge && trackFor(from) !== TRACKS.charge;
}
