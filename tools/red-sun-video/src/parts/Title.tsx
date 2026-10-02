import React from "react";
import { CUES } from "../timeline";
import { Layout } from "../layout";
import { Song } from "../useSong";
import { prog, easeOut, lerp } from "../lib";
import { TITLE_FONT, CAPTION_FONT } from "./Text";
import { Medallion } from "./Medallion";
import { sunGeom } from "./Sky";

/** RED SUN slams in centred on the sun disc, then ARMATURA and the medallion appear beneath. */
export const TitleSlam: React.FC<{ s: Song; L: Layout }> = ({ s, L }) => {
  const T = CUES.titleSlam;
  if (s.t < T || s.t > CUES.titleOut[1]) return null;
  const { cy } = sunGeom(s, L);
  const slam = prog(s.t, T, T + 0.3, easeOut);
  const out = prog(s.t, CUES.titleOut[0], CUES.titleOut[1]);
  const aIn = prog(s.t, CUES.armaturaIn, CUES.armaturaIn + 1.2, easeOut);
  const fs = L.tall ? L.w * 0.17 : L.h * 0.2;
  const sc = lerp(2.8, 1, slam) * (1 + 0.012 * s.pulse);
  const titleY = Math.min(cy, L.horizon - fs * 0.2);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
      <div
        style={{
          position: "absolute", left: 0, right: 0, top: titleY - fs * 0.55, textAlign: "center", fontFamily: TITLE_FONT, fontWeight: 600,
          fontSize: fs, letterSpacing: "0.08em", color: "#fff3d2", opacity: Math.min(1, slam * 3), transform: `scale(${sc})`,
          filter: `blur(${(1 - slam) * 10}px)`, textShadow: "0 0 40px rgba(255,120,40,0.95), 0 0 90px rgba(255,200,100,0.6), 0 6px 18px rgba(60,0,0,0.8)",
          whiteSpace: "nowrap",
        }}
      >
        RED SUN
      </div>
      <div
        style={{
          position: "absolute", left: 0, right: 0, top: titleY + fs * 0.62, display: "flex", justifyContent: "center", alignItems: "center",
          gap: L.w * 0.02, opacity: aIn, transform: `translateY(${(1 - aIn) * 14}px)`,
        }}
      >
        <div style={{ position: "relative", width: L.w * 0.07, height: L.w * 0.07 }}>
          <Medallion size={L.w * 0.07} glow={0.8 + 0.4 * s.pulse} x={L.w * 0.035} y={L.w * 0.035} />
        </div>
        <div style={{ fontFamily: CAPTION_FONT, fontWeight: 700, color: "#f2b84b", fontSize: L.tall ? L.w * 0.065 : L.h * 0.07, letterSpacing: "0.34em", textShadow: "0 2px 14px rgba(0,0,0,0.85)" }}>
          ARMATURA
        </div>
      </div>
    </div>
  );
};

export const FlashRing: React.FC<{ s: Song; L: Layout }> = ({ s, L }) => {
  const age = s.t - CUES.titleSlam;
  if (age < 0 || age > 1.2) return null;
  return <div style={{ position: "absolute", inset: 0, background: "#fff1c8", opacity: Math.exp(-age * 7) * 0.8, mixBlendMode: "screen", pointerEvents: "none" }} />;
};

/** Small centred date card, used for "7 SEPTEMBER 1565". */
export const DateCard: React.FC<{ s: Song; L: Layout }> = ({ s, L }) => {
  const [a, b] = CUES.septemberDate;
  const inP = prog(s.t, a, a + 1.6, easeOut), outP = prog(s.t, b - 1.4, b);
  const op = inP * (1 - outP);
  if (op < 0.01) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: L.h * (L.tall ? 0.2 : 0.17), textAlign: "center", fontFamily: TITLE_FONT, fontWeight: 600, color: "#f6dca0", opacity: op, fontSize: L.tall ? L.w * 0.075 : L.h * 0.062, letterSpacing: `${0.3 - inP * 0.06}em`, textShadow: "0 0 24px rgba(242,184,75,0.4), 0 2px 8px rgba(0,0,0,0.7)" }}>
      7 SEPTEMBER 1565
    </div>
  );
};
