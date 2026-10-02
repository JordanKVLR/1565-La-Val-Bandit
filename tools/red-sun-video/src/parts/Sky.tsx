import React from "react";
import { PALETTE, CUES, SUN_SCALE, DYN } from "../timeline";
import { Layout } from "../layout";
import { Song } from "../useSong";
import { keyed, lerp, mix, prog } from "../lib";

const GOLD_MIX: [number, number][] = [
  [0, 0], [160, 0], [161, 0.35], [190, 0.55], [198, 0.5], [212, 1], [214.4, 1],
];

export const goldMix = (t: number) => keyed(t, GOLD_MIX);

export const Sky: React.FC<{ s: Song; L: Layout }> = ({ s, L }) => {
  const g = goldMix(s.t);
  const h = s.heat;
  const top = mix([6, 3, 6], [70, 8, 14], h);
  const mid = mix([22, 8, 14], [190, 40, 24], h);
  const low = mix([60, 14, 18], [248, 120, 40], h);
  const topG = mix([70, 8, 14], [120, 52, 28], g);
  const midG = mix([190, 40, 24], [236, 150, 60], g);
  const lowG = mix([248, 120, 40], [255, 205, 120], g);
  const reveal = prog(s.t, CUES.worldReveal[0], CUES.worldReveal[1]);
  const useG = g > 0;
  return (
    <div
      style={{
        position: "absolute", inset: 0, opacity: reveal,
        background: `linear-gradient(to bottom, ${useG ? topG : top} 0%, ${useG ? midG : mid} ${L.horizon * 0.62}px, ${useG ? lowG : low} ${L.horizon}px, ${PALETTE.night} 100%)`,
      }}
    />
  );
};

export const sunGeom = (s: Song, L: Layout) => {
  const rise = prog(s.t, CUES.sunRiseStart, CUES.sunRiseEnd);
  const setting = prog(s.t, 205, 213);
  const R = L.sunR * (0.78 + s.heat * 0.95) * keyed(s.t, SUN_SCALE);
  return { R, cy: L.horizon + R * 1.15 - rise * R * 1.45 + setting * R * 1.6 };
};

/** The red sun disc. Pulses with the beat, grows and heats up with the song. */
export const Sun: React.FC<{ s: Song; L: Layout }> = ({ s, L }) => {
  const g = goldMix(s.t);
  const dyn = keyed(s.t, DYN);
  const geo = sunGeom(s, L);
  const R = geo.R * (1 + (0.02 + 0.05 * dyn) * s.pulse + 0.05 * dyn * s.kick + 0.02 * s.bass);
  const cy = geo.cy;
  const glowR = R * (2.2 + s.heat * 1.6 + s.kick * 0.6);
  const core = mix([255, 214, 120], [255, 240, 190], g);
  const mid = mix([232, 86, 28], [255, 190, 80], g);
  const rim = mix([150, 18, 24], [235, 130, 40], g);
  const glowOp = (0.35 + s.heat * 0.55) * prog(s.t, 3, 9);
  return (
    <svg width={L.w} height={L.h} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="sunGlow">
          <stop offset="0" stopColor={mid} stopOpacity="0.85" />
          <stop offset="0.25" stopColor={rim} stopOpacity="0.45" />
          <stop offset="1" stopColor={rim} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sunDisc" cx="0.5" cy="0.45" r="0.55">
          <stop offset="0" stopColor={core} />
          <stop offset="0.45" stopColor={mid} />
          <stop offset="1" stopColor={rim} />
        </radialGradient>
      </defs>
      <circle cx={L.cx} cy={cy} r={glowR} fill="url(#sunGlow)" opacity={glowOp} style={{ mixBlendMode: "screen" }} />
      <circle cx={L.cx} cy={cy} r={R} fill="url(#sunDisc)" />
      {[0.86, 0.7, 0.52].map((k, i) => (
        <circle key={i} cx={L.cx} cy={cy} r={R * k} fill="none" stroke={core} strokeOpacity={0.07 + 0.05 * s.pulse} strokeWidth={R * 0.012} />
      ))}
    </svg>
  );
};

export const lerpN = lerp;
