/**
 * ALL timings live here. Times are in SONG seconds (0 = first sample of public/red-sun.mp3).
 * The video adds LEAD_IN of black before the song and LEAD_OUT after it.
 */
export const FPS = 30;
export const LEAD_IN = 2;
export const LEAD_OUT = 2;
export const SONG_SECONDS = 214.4;
export const TOTAL_FRAMES = Math.round((LEAD_IN + SONG_SECONDS + LEAD_OUT) * FPS);
export const AUDIO_FILE = "red-sun.mp3"; // in /public

/** Flip to false to hide all lyric captions. */
export const SHOW_LYRICS = true;

export type SectionId =
  | "intro" | "verse1" | "pre1" | "chorus1" | "verse2"
  | "pre2" | "chorus2" | "bridge" | "final" | "outro";

export const SECTIONS: Record<SectionId, [start: number, end: number]> = {
  intro: [0, 13.56],
  verse1: [13.56, 29.52],
  pre1: [29.52, 41.33],
  chorus1: [41.33, 69.34],
  verse2: [69.34, 86.33],
  pre2: [86.33, 97.66],
  chorus2: [97.66, 127.66],
  bridge: [127.66, 160.85],
  final: [160.85, 198.11],
  outro: [198.11, 214.4],
};

/** Named cues other scenes hang off. */
export const CUES = {
  maltaTitle: [2.5, 9.5] as [number, number], // "MALTA, 1565" fade in..out
  horizonLineStart: 0.2, // thin red line of light appears (song time)
  horizonLineEnd: 2.6,
  worldReveal: [2.0, 6.0] as [number, number], // line becomes sky + sea
  sunRiseStart: 3.0,
  sunRiseEnd: 13.0,
  holdTheLine: [145.77, 160.85] as [number, number],
  titleSlam: 192.21, // final chorus "Under the red sun" -> RED SUN slams in
  armaturaIn: 194.9,
  titleOut: [199.5, 202.5] as [number, number],
  fleetSinks: [199, 211] as [number, number],
  septemberDate: [204.5, 210.5] as [number, number],
};

/** How hot/big the sun is over time: [songSeconds, heat 0..1]. Eased between keys. */
export const HEAT: [number, number][] = [
  [0, 0.05], [13, 0.2], [29.5, 0.4], [41.3, 0.75], [69.3, 0.5],
  [86.3, 0.65], [97.7, 0.85], [127.7, 0.4], [145.8, 0.5], [149.1, 0.58], [152.8, 0.7], [155.8, 0.85],
  [160.9, 1], [198, 0.9], [214.4, 0.2],
];

/** Sails on the horizon: [songSeconds, count]. */
export const FLEET: [number, number][] = [
  [13.56, 0], [17.6, 3], [21.5, 8], [25.8, 16], [29.5, 22], [100, 30], [214.4, 30],
];

/** Sun size multiplier. Verse 2 hangs heavy; final chorus flares to nearly full screen. */
export const SUN_SCALE: [number, number][] = [
  [0, 1], [69.3, 1], [73, 1.3], [86, 1.35], [97.6, 1.05], [127, 1.05], [145, 1.15],
  [160.8, 1.1], [161.5, 2.9], [165, 2.3], [192, 2.4], [198, 1.7], [205, 1.2], [214.4, 1],
];
/** Overall darkening 0..1 (verse 2, bridge). */
export const DARK: [number, number][] = [
  [0, 0], [69, 0], [72, 0.4], [85, 0.4], [86.5, 0.1], [127, 0.1], [129, 0.5], [145, 0.45], [152, 0.25], [160.8, 0], [214.4, 0],
];
/** "Dynamic" amount: how hard the camera, grade and sun punch on the beat. */
export const DYN: [number, number][] = [
  [0, 0], [12, 0.1], [29, 0.3], [41.3, 1], [69, 0.7], [72, 0.25], [86, 0.5], [97.7, 1.1], [127, 0.8], [128, 0.15],
  [145.8, 0.6], [155, 1], [160.9, 1.4], [198, 0.5], [205, 0],
];
/** Torches and fires across the island: [song seconds, amount 0..1]. */
export const TORCHES: [number, number][] = [
  [0, 0], [69, 0], [76, 0.6], [86, 0.85], [97, 0.5], [127, 1], [214, 1],
];
/** Fort St Elmo fire/smoke. */
export const FORT: [number, number][] = [[0, 0], [60, 0], [69.3, 1], [80, 0.7], [97, 0.4], [214.4, 0.25]];
/** Water level dropping (exposed seabed). */
export const WATER: [number, number][] = [[0, 0], [69.3, 0], [86, 0.7], [127, 0.85], [198, 0.85], [214.4, 0.85]];
/** Maltese cross banners rising on the walls. */
export const BANNERS: [number, number][] = [
  [0, 0], [97.66, 0], [104, 1], [127, 1], [129, 0], [160.85, 0], [166, 1], [199, 1], [205, 0],
];
/** Gold light flooding the island: [song seconds, amount]. */
export const FLOOD: [number, number][] = [[0, 0], [160.85, 0], [162, 0.45], [198, 0.3], [210, 0], [214.4, 0]];
/** Bridge vignettes: when each figure steps in; `row` is when they join in a line for "Hold the line". */
export const BRIDGE = { boy: 127.8, knight: 129.9, mother: 131.5, sailor: 133.1, row: 145.5, rowDone: 148.5, out: 160.85 };

/** Smoke amount 0..1. */
export const SMOKE: [number, number][] = [
  [0, 0], [14, 0], [29.5, 0.35], [41, 0.5], [69, 0.8], [97, 0.8], [127, 0.45], [160, 0.7], [198, 0.5], [214, 0.2],
];

/** Slow camera zoom (1 = none): [songSeconds, scale]. Pushes in on the bastion in pre-choruses. */
export const ZOOM: [number, number][] = [
  [0, 1], [13.5, 1.02], [29.5, 1.06], [41.3, 1.14], [41.4, 1.04], [69, 1.06],
  [86, 1.08], [97.6, 1.16], [97.7, 1.05], [127, 1.08], [160.8, 1.1], [198, 1.0], [214.4, 1.0],
];

/** Camera shake strength 0..1 (multiplied by the beat pulse). */
export const SHAKE: [number, number][] = [
  [0, 0], [29, 0], [30, 0.25], [41, 0.3], [41.4, 0.6], [69, 0.55], [86, 0.15], [97.6, 0.9],
  [127, 0.8], [128, 0], [145, 0.1], [160.8, 0.2], [161, 1], [198, 0.5], [199, 0],
];

/** Parallax pan along the harbour, in layer widths (0..1). */
export const PAN: [number, number][] = [[0, 0], [13.5, 0.04], [29.5, 0.22], [41.3, 0.3], [214.4, 0.3]];

export type LyricLine = { t: number; text: string; end?: number };
export const LYRICS: LyricLine[] = [
  { t: 13.56, text: "Salt on my skin and smoke in the sky" },
  { t: 17.63, text: "Sails on the water as far as the eye" },
  { t: 21.46, text: "They said we would scatter, they said we would run" },
  { t: 25.77, text: "But we were born underneath this sun" },
  { t: 29.52, text: "So let the cannons roar" },
  { t: 31.44, text: "Let the old walls shake and crack" },
  { t: 33.27, text: "We've got nowhere left to go" },
  { t: 35.19, text: "And we're never turning back" },
  { t: 41.33, text: "Red sun, rise up, burn on high" },
  { t: 44.52, text: "We won't bow and we won't hide" },
  { t: 48.99, text: "Every stone in these walls has a name" },
  { t: 52.74, text: "Every heart here is a flame" },
  { t: 56.73, text: "Red sun, red sun, do your worst" },
  { t: 60.16, text: "This is our home, we were here first" },
  { t: 63.75, text: "Oh-oh-oh, we're still standing" },
  { t: 67.82, text: "Under the red sun" },
  // Verse 2: the embedded timestamps were misaligned, line 2 re-timed by hand.
  { t: 69.34, text: "Saint Elmo fell but the story did not" },
  { t: 74.0, text: "Every brother we lost is a fire we've got" },
  { t: 79.39, text: "The water runs low and the summer runs long" },
  { t: 82.58, text: "But the island keeps singing its oldest song" },
  { t: 86.33, text: "So let the banners burn" },
  { t: 88.09, text: "Let the harbour run with red" },
  { t: 89.92, text: "We will carry what is left" },
  { t: 91.75, text: "And we'll carry all our dead" },
  { t: 97.66, text: "Red sun, rise up, burn on high" },
  { t: 101.09, text: "We won't bow and we won't hide" },
  { t: 103.48, text: "Every stone in these walls has a name" },
  { t: 108.67, text: "Every heart here is a flame" },
  { t: 112.58, text: "Red sun, red sun, do your worst" },
  { t: 115.93, text: "This is our home, we were here first" },
  { t: 119.52, text: "Oh-oh-oh, we're still standing" },
  { t: 123.51, text: "Under the red sun" },
  { t: 127.66, text: "A boy on the harbour, a knight on the wall" },
  { t: 131.33, text: "A mother, a sailor, we answer the call" },
  { t: 134.12, text: "They can take the shoreline, they can take the air" },
  { t: 138.67, text: "But they'll never take the courage that we carry everywhere", end: 145.5 },
  { t: 145.77, text: "Hold the line, hold the line" },
  { t: 149.12, text: "Hold the line, hold the line" },
  { t: 152.79, text: "Hold the line, hold the line" },
  { t: 155.82, text: "Hold the line, hold the line" },
  { t: 160.85, text: "Red sun, rise up, burn on high" },
  { t: 164.28, text: "We won't bow and we won't hide" },
  { t: 168.11, text: "Every stone in these walls has a name" },
  { t: 171.78, text: "Every heart here is a flame" },
  { t: 175.69, text: "Red sun, red sun, do your worst" },
  { t: 179.04, text: "This is our home, we were here first" },
  { t: 182.63, text: "Oh-oh-oh, we're still standing" },
  { t: 186.3, text: "Oh-oh-oh, we're still standing" },
  { t: 192.21, text: "Under the red sun", end: 198.0 },
  { t: 198.11, text: "September wind is blowing home" },
  { t: 203.3, text: "And we're still here" },
  { t: 208.32, text: "Under the red sun", end: 213.5 },
];

/** Windows where stone names glow ("Every stone in these walls has a name"). */
export const NAME_GLOWS: [number, number][] = [[48.99, 52.74], [103.48, 108.67], [168.11, 171.78]];
/** Windows where defenders raise arms and banners ("Oh-oh-oh, we're still standing"). */
export const ARMS_UP: [number, number][] = [[63.75, 69.3], [119.52, 127.66], [182.63, 198.11]];
/** Cannon flashes light the walls in time with the beat. */
export const FLASH_WINDOWS: [number, number][] = [[29.52, 41.33], [86.33, 97.66]];
/** Cracks spreading over the limestone: [song seconds, amount 0..1]. They stay once opened. */
export const CRACKS: [number, number][] = [[29.52, 0], [41, 1], [86.33, 0.6], [97, 1], [214.4, 1]];
/** How many defenders stand on the ramparts, 0..1. */
export const DEFENDERS: [number, number][] = [
  [0, 0], [41.3, 0], [46, 0.4], [56, 0.75], [69, 0.5], [86, 0.5], [97.7, 0.8], [110, 1],
  [127, 0.4], [145, 0.4], [160.9, 0.7], [168, 1], [198, 1], [205, 0.3], [214, 0],
];

export const PALETTE = {
  crimson: "#9b1217", deepRed: "#5a0a10", orange: "#d9561c", ember: "#ff8a2a",
  gold: "#f2b84b", limestone: "#d9b06a", limestoneDark: "#8a6a3c",
  sea: "#0c2a4a", seaDeep: "#06182c", smoke: "#4a4448", night: "#0a0507",
};
