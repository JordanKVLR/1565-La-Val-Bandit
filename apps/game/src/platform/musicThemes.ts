/**
 * Original tunes in the spirit of Maltese folk music: a żaqq (bagpipe) drone, a flejguta (reed
 * flute) or żaqq chanter melody, tanbur (frame drum) and żafżafa (friction drum) rhythms, and a
 * għana-style guitar. Every melody here was written for this game; none is a real folk tune.
 *
 * Melodies are scale degrees (0 = the key's root, 7 = an octave up, negative = below) with a
 * length in beats; `null` is a rest. Every phrase lasts 16 beats (4 bars of 4).
 */
export type Note = readonly [degree: number | null, beats: number];

export type Mood = 'none' | 'title' | 'story' | 'battle' | 'boss';

export interface Theme {
  readonly bpm: number;
  /** MIDI note of the melody's root. */
  readonly root: number;
  readonly scale: readonly number[];
  readonly melodyVoice: 'flute' | 'chanter';
  readonly phrases: readonly (readonly Note[])[];
  /** Order the phrases play in, looped. */
  readonly order: readonly number[];
  /** Chord root (scale degree) for each bar, looped. */
  readonly chords: readonly number[];
  /** Guitar: flowing arpeggio, or strums on the 3+3+2 Mediterranean pulse. */
  readonly guitar: 'arp' | 'strum';
  /** Tanbur pattern over 8 eighth notes: D = dum (low), t = tek (rim), . = rest. */
  readonly drums: string | null;
  /** Żafżafa growl on these eighth-note positions. */
  readonly friction: readonly number[];
  /** Żaqq drone loudness (0 to 1). */
  readonly drone: number;
}

const AEOLIAN = [0, 2, 3, 5, 7, 8, 10];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];
/** The raised third over a flat second gives the Levantine colour heard across Maltese song. */
const PHRYGIAN_DOMINANT = [0, 1, 4, 5, 7, 8, 10];

export const THEMES: Record<Exclude<Mood, 'none'>, Theme> = {
  // "Il-Fanal": a slow, open melody over a harbour; strummed guitar and a soft drum.
  title: {
    bpm: 80,
    root: 69,
    scale: AEOLIAN,
    melodyVoice: 'flute',
    phrases: [
      [
        [4, 1],
        [3, 0.5],
        [2, 0.5],
        [1, 1],
        [2, 1],
        [0, 2],
        [null, 1],
        [-1, 1],
        [0, 1],
        [2, 1],
        [4, 1],
        [5, 1],
        [4, 3],
        [null, 1],
      ],
      [
        [7, 1.5],
        [6, 0.5],
        [5, 1],
        [4, 1],
        [5, 1],
        [4, 0.5],
        [3, 0.5],
        [2, 2],
        [3, 1],
        [4, 1],
        [2, 1],
        [1, 1],
        [0, 3],
        [null, 1],
      ],
      [
        [2, 1],
        [4, 1],
        [5, 1.5],
        [4, 0.5],
        [3, 1],
        [2, 1],
        [1, 2],
        [-1, 1],
        [0, 1],
        [1, 1],
        [2, 1],
        [0, 4],
      ],
    ],
    order: [0, 1, 0, 2],
    chords: [0, 5, 3, 4, 0, 3, 6, 0],
    guitar: 'strum',
    drums: 'D...t.t.',
    friction: [],
    drone: 0.5,
  },
  // "Għanja tal-Għalqa": a field song; flute over a gentle guitar arpeggio, no drums.
  story: {
    bpm: 66,
    root: 62,
    scale: DORIAN,
    melodyVoice: 'flute',
    phrases: [
      [
        [0, 1],
        [2, 1],
        [4, 2],
        [5, 1],
        [4, 0.5],
        [5, 0.5],
        [6, 2],
        [4, 1],
        [3, 1],
        [2, 1],
        [3, 1],
        [1, 4],
      ],
      [
        [4, 1.5],
        [5, 0.5],
        [4, 1],
        [2, 1],
        [3, 2],
        [1, 2],
        [2, 1],
        [1, 0.5],
        [0, 0.5],
        [-1, 1],
        [1, 1],
        [0, 4],
      ],
      [
        [7, 2],
        [6, 1],
        [5, 1],
        [6, 1],
        [5, 1],
        [4, 2],
        [5, 1],
        [4, 1],
        [3, 1],
        [1, 1],
        [2, 2],
        [null, 2],
      ],
    ],
    order: [0, 1, 2, 1],
    chords: [0, 3, 0, 4, 2, 3, 1, 0],
    guitar: 'arp',
    drums: null,
    friction: [],
    drone: 0.3,
  },
  // "Is-Sur": the walls under siege; żaqq chanter, driving tanbur and a growling żafżafa.
  battle: {
    bpm: 128,
    root: 64,
    scale: PHRYGIAN_DOMINANT,
    melodyVoice: 'chanter',
    phrases: [
      [
        [0, 0.5],
        [1, 0.5],
        [2, 1],
        [1, 0.5],
        [0, 0.5],
        [1, 1],
        [2, 0.5],
        [3, 0.5],
        [4, 1],
        [3, 0.5],
        [2, 0.5],
        [1, 1],
        [0, 0.5],
        [1, 0.5],
        [2, 0.5],
        [3, 0.5],
        [4, 1],
        [5, 1],
        [4, 2],
        [null, 2],
      ],
      [
        [4, 1],
        [5, 0.5],
        [4, 0.5],
        [3, 1],
        [2, 1],
        [3, 0.5],
        [2, 0.5],
        [1, 1],
        [0, 2],
        [7, 1],
        [6, 0.5],
        [5, 0.5],
        [4, 1],
        [5, 1],
        [4, 1],
        [2, 1],
        [1, 2],
      ],
      [
        [0, 1],
        [0, 0.5],
        [1, 0.5],
        [2, 1],
        [2, 0.5],
        [3, 0.5],
        [4, 1],
        [4, 0.5],
        [3, 0.5],
        [2, 2],
        [1, 1],
        [2, 0.5],
        [1, 0.5],
        [0, 1],
        [-1, 1],
        [0, 3],
        [null, 1],
      ],
    ],
    order: [0, 0, 1, 2],
    chords: [0, 0, 1, 0, 6, 5, 1, 0],
    guitar: 'strum',
    drums: 'D.tD.tt.',
    friction: [0, 4],
    drone: 0.8,
  },
  // "Il-Kmandant": a heavier, lower tune for battles against a commander.
  boss: {
    bpm: 140,
    root: 62,
    scale: PHRYGIAN_DOMINANT,
    melodyVoice: 'chanter',
    phrases: [
      [
        [0, 1],
        [0, 0.5],
        [1, 0.5],
        [0, 1],
        [-1, 1],
        [0, 0.5],
        [1, 0.5],
        [2, 0.5],
        [1, 0.5],
        [0, 2],
        [4, 1],
        [3, 0.5],
        [2, 0.5],
        [1, 1],
        [2, 1],
        [1, 0.5],
        [0, 0.5],
        [-1, 1],
        [0, 2],
      ],
      [
        [4, 0.5],
        [5, 0.5],
        [4, 0.5],
        [3, 0.5],
        [4, 2],
        [5, 0.5],
        [6, 0.5],
        [5, 0.5],
        [4, 0.5],
        [3, 2],
        [2, 1],
        [3, 1],
        [4, 1],
        [1, 1],
        [0, 4],
      ],
    ],
    order: [0, 1, 0, 1],
    chords: [0, 1, 0, 1, 6, 5, 1, 0],
    guitar: 'strum',
    drums: 'D.tDD.tt',
    friction: [0, 2, 4, 6],
    drone: 1,
  },
};

/** Guitar strum positions (eighth notes) for the 3+3+2 pulse. */
export const STRUM_STEPS = [0, 3, 6];

export function midiToHz(m: number): number {
  return 440 * 2 ** ((m - 69) / 12);
}

/** MIDI note for a scale degree above `root`. */
export function degreeToMidi(root: number, scale: readonly number[], degree: number): number {
  const octave = Math.floor(degree / scale.length);
  const idx = ((degree % scale.length) + scale.length) % scale.length;
  return root + octave * 12 + scale[idx]!;
}
