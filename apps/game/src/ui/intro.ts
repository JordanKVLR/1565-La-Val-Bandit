import { TRACK_VOLUME } from '../platform/musicTracks';

/** Length of the opening cinematic, cut to the full length of Under the Red Sun. */
export const INTRO_DURATION_S = 227.08;

/** The cinematic is authored at 1920×1080. */
const AUTHORED_W = 1920;
const AUTHORED_H = 1080;
/** Never draw the cinematic below this fraction of its authored size. */
const MIN_SCALE = 0.4;

/**
 * Backing-store scale for the cinematic canvas: just enough pixels for the screen it is shown on
 * (phones draw far fewer pixels per frame), never more than the authored 1080p.
 */
export function introScale(cssWidth: number, cssHeight: number, dpr: number): number {
  const fit = Math.min((cssWidth * dpr) / AUTHORED_W, (cssHeight * dpr) / AUTHORED_H);
  const s = Math.ceil(fit * 20) / 20;
  return Math.min(1, Math.max(MIN_SCALE, s));
}

/** The song plays at the same loudness as the game's other recorded tracks. */
export function introVolume(musicVolume: number): number {
  return Math.min(1, Math.max(0, musicVolume * TRACK_VOLUME));
}

/** Cinematic time: follow the song while it plays, else a wall clock started on first frame. */
export function introTime(audioTime: number | null, wallSeconds: number): number {
  return Math.min(INTRO_DURATION_S, Math.max(0, audioTime ?? wallSeconds));
}

export function introFinished(t: number): boolean {
  return t >= INTRO_DURATION_S - 0.05;
}
