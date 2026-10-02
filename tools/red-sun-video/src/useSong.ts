import { staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import data from "./audioData.json";
import { AUDIO_FILE, HEAT, LEAD_IN } from "./timeline";
import { clamp, keyed } from "./lib";

const beats: number[] = data.beats;
const drums: number[][] = data.drums;
const beatLen = 60 / data.bpm;

function lastBefore(arr: number[], t: number) {
  let lo = 0, hi = arr.length - 1, r = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (arr[m] <= t) { r = m; lo = m + 1; } else hi = m - 1;
  }
  return r;
}

export type Song = {
  /** song seconds (negative during lead-in) */
  t: number;
  /** 1 on each beat, decays quickly */
  pulse: number;
  /** 1 on strong drum hits, decays */
  kick: number;
  /** live low-frequency level from @remotion/media-utils, 0..1 */
  bass: number;
  /** smoothed loudness 0..1 (pre-analysed) */
  energy: number;
  /** sun heat 0..1 from timeline.HEAT */
  heat: number;
};

export function useSong(): Song {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audio = useAudioData(staticFile(AUDIO_FILE));
  const t = frame / fps - LEAD_IN;

  const bi = lastBefore(beats, t);
  const pulse = bi < 0 ? 0 : Math.exp(-((t - beats[bi]) / beatLen) * 4.5);

  const times = drums.map((d) => d[0]);
  const di = lastBefore(times, t);
  const kick = di < 0 ? 0 : drums[di][1] * Math.exp(-(t - drums[di][0]) * 7);

  let bass = 0;
  if (audio) {
    const f = Math.max(0, Math.round(t * fps));
    const v = visualizeAudio({ fps, frame: f, audioData: audio, numberOfSamples: 16 });
    bass = clamp(((v[0] + v[1] + v[2] + v[3]) / 4) * 3.2);
  }
  const ei = clamp(Math.round(t * data.fps), 0, data.energy.length - 1);
  return { t, pulse, kick, bass, energy: data.energy[ei], heat: keyed(t, HEAT) };
}

export const beatTimes = beats;
export const beatSeconds = beatLen;
export const drumTimes = times0();
function times0() { return drums.map((d) => ({ t: d[0], v: d[1] })); }
