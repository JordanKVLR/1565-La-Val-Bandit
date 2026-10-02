import React from "react";
import { CUES, LYRICS, SHOW_LYRICS, PALETTE } from "../timeline";
import { Layout } from "../layout";
import { Song } from "../useSong";
import { clamp, prog, easeOut } from "../lib";
import { continueRender, delayRender, staticFile } from "remotion";

const FONTS: [string, string, string][] = [
  ["Cinzel", "500", "fonts/cinzel-latin-500-normal.woff2"],
  ["Cinzel", "700", "fonts/cinzel-latin-700-normal.woff2"],
  ["Cormorant Garamond", "600", "fonts/cormorant-garamond-latin-600-normal.woff2"],
];
if (typeof document !== "undefined") {
  const h = delayRender("fonts");
  Promise.all(
    FONTS.map(([family, weight, file]) =>
      new FontFace(family, `url(${staticFile(file)})`, { weight }).load().then((f) => document.fonts.add(f)),
    ),
  ).then(() => continueRender(h), () => continueRender(h));
}
export const TITLE_FONT = `"Cormorant Garamond", Georgia, serif`;
export const CAPTION_FONT = `"Cinzel", Georgia, serif`;

export const MaltaCard: React.FC<{ s: Song; L: Layout }> = ({ s, L }) => {
  const [a, b] = CUES.maltaTitle;
  const inP = prog(s.t, a, a + 2, easeOut), outP = prog(s.t, b - 1.6, b);
  const op = inP * (1 - outP);
  if (op <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute", left: 0, right: 0, top: L.h * (L.tall ? 0.16 : 0.14), textAlign: "center",
        fontFamily: TITLE_FONT, fontWeight: 600, color: PALETTE.gold, opacity: op,
        fontSize: L.tall ? L.w * 0.085 : L.h * 0.07, letterSpacing: `${0.28 - inP * 0.06}em`,
        textShadow: "0 0 24px rgba(242,184,75,0.35), 0 2px 8px rgba(0,0,0,0.6)", transform: `translateY(${(1 - inP) * 10}px)`,
      }}
    >
      MALTA, 1565
    </div>
  );
};

/** Lyric captions: fade in word by word, bottom safe area, never over the sun. */
export const Captions: React.FC<{ s: Song; L: Layout }> = ({ s, L }) => {
  if (!SHOW_LYRICS) return null;
  let idx = -1;
  for (let i = 0; i < LYRICS.length; i++) if (LYRICS[i].t <= s.t) idx = i;
  if (idx < 0) return null;
  const line = LYRICS[idx];
  const next = LYRICS[idx + 1];
  const end = line.end ?? Math.min(next ? next.t : line.t + 6, line.t + 7);
  if (s.t > end + 0.5) return null;
  const words = line.text.toUpperCase().split(" ");
  const span = Math.min(2.2, Math.max(0.9, (end - line.t) * 0.55));
  const fadeOut = 1 - prog(s.t, end - 0.35, end + 0.4);
  return (
    <div
      style={{
        position: "absolute", left: L.w * 0.08, right: L.w * 0.08, bottom: L.h * (L.tall ? 0.08 : 0.065),
        textAlign: "center", fontFamily: CAPTION_FONT, fontWeight: 500, color: "#f6e6c4",
        fontSize: L.captionSize, letterSpacing: "0.12em", lineHeight: 1.35, opacity: fadeOut,
        textShadow: "0 2px 10px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.8)",
      }}
    >
      {words.map((w, i) => {
        const ws = line.t + (i / words.length) * span;
        const o = clamp(prog(s.t, ws, ws + 0.45, easeOut));
        return (
          <span key={i} style={{ opacity: o, display: "inline-block", marginRight: "0.4em", transform: `translateY(${(1 - o) * 6}px)` }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};
