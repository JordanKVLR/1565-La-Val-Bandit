import { TRACK_VOLUME } from '../platform/musicTracks';

/**
 * The opening cinematic: one 43.2 s video in two encodings of the same picture and mix. The
 * browser plays the first source it can decode, so H.264 comes first (every phone, Safari and the
 * native shells) and VP9 second (Chromium and Firefox builds without H.264). Paths are relative
 * to the app's base URL, under `public/`.
 */
export const INTRO_SOURCES = [
  { file: 'cinematic/armatura-intro.mp4', type: 'video/mp4; codecs="avc1.640029, mp4a.40.2"' },
  { file: 'cinematic/armatura-intro.webm', type: 'video/webm; codecs="vp9, opus"' },
] as const;

/** The soundtrack is mixed into the video, so it follows the Music volume like recorded tracks. */
export function introVolume(musicVolume: number): number {
  return Math.min(1, Math.max(0, musicVolume * TRACK_VOLUME));
}
