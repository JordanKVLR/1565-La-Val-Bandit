import React from "react";
import { AbsoluteFill } from "remotion";
import { CUES, LEAD_IN, LEAD_OUT, SHAKE, SONG_SECONDS, ZOOM } from "./timeline";
import { useLayout } from "./layout";
import { useSong } from "./useSong";
import { keyed, prog, easeOut } from "./lib";
import { Sky, Sun } from "./parts/Sky";
import { Sea } from "./parts/Sea";
import { FarLand, NearWall } from "./parts/Land";
import { Ships } from "./parts/Ships";
import { Embers, Smoke } from "./parts/Particles";
import { Captions, MaltaCard } from "./parts/Text";
import { drumTimes } from "./useSong";

/** Thin red line of light that becomes the horizon. */
const HorizonLine: React.FC<{ t: number; w: number; y: number }> = ({ t, w, y }) => {
  const grow = prog(t, CUES.horizonLineStart, CUES.horizonLineEnd, easeOut);
  const fade = 1 - prog(t, CUES.worldReveal[0] + 1.5, CUES.worldReveal[1] + 1);
  return (
    <div
      style={{
        position: "absolute", left: w / 2 - (w * grow) / 2, width: w * grow, top: y - 1, height: 2,
        background: "linear-gradient(90deg, transparent, #ff3b2a 25%, #ff8a2a 50%, #ff3b2a 75%, transparent)",
        boxShadow: "0 0 18px 4px rgba(255,60,40,0.55)", opacity: fade,
      }}
    />
  );
};

export const World: React.FC = () => {
  const L = useLayout();
  const s = useSong();
  const shake = keyed(s.t, SHAKE) * (0.35 + s.pulse * 0.65 + s.kick * 0.5);
  const sx = Math.sin(s.t * 71) * shake * L.w * 0.004, sy = Math.cos(s.t * 63) * shake * L.w * 0.004;
  const zoom = keyed(s.t, ZOOM);
  const hazeScale = 6 + s.heat * 14;
  const fadeIn = 1 - prog(s.t, -LEAD_IN + 0.4, 0.2);
  const fadeOut = prog(s.t, SONG_SECONDS - 1.0, SONG_SECONDS + LEAD_OUT - 0.3);
  const black = Math.max(fadeIn * 0, fadeOut);
  const bursts = drumTimes.filter((d) => d.v > 0.55 && ((d.t > 41.3 && d.t < 69.3) || (d.t > 97.7 && d.t < 127.7) || (d.t > 160.8 && d.t < 198)));
  return (
    <AbsoluteFill style={{ background: "#050203", overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="haze" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency={`0.006 ${0.04 + 0.01 * Math.sin(s.t * 0.7)}`} numOctaves="2" seed={Math.floor(s.t * 6) % 40} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={hazeScale} yChannelSelector="G" xChannelSelector="R" />
        </filter>
      </svg>
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) scale(${zoom})`, transformOrigin: `50% ${(L.horizon / L.h) * 100}%` }}>
        <AbsoluteFill style={{ filter: "url(#haze)" }}>
          <Sky s={s} L={L} />
          <Sun s={s} L={L} />
          <Sea s={s} L={L} />
          <FarLand s={s} L={L} />
          <Ships s={s} L={L} />
        </AbsoluteFill>
        <Smoke s={s} L={L} />
        <NearWall s={s} L={L} />
        <Embers s={s} L={L} density={0.25 + s.energy * 0.6} bursts={bursts} />
        <HorizonLine t={s.t} w={L.w} y={L.horizon} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.65) 100%)" }} />
      <MaltaCard s={s} L={L} />
      <Captions s={s} L={L} />
      <AbsoluteFill style={{ background: "#000", opacity: black, pointerEvents: "none" }} />
      {s.t < 0 ? <AbsoluteFill style={{ background: "#000" }} /> : null}
    </AbsoluteFill>
  );
};
