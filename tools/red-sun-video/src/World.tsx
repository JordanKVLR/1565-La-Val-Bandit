import React from "react";
import { AbsoluteFill } from "remotion";
import { CUES, DARK, DYN, LEAD_OUT, SECTIONS, SHAKE, SONG_SECONDS, ZOOM } from "./timeline";
import { useLayout } from "./layout";
import { useSong, drumTimes, beatTimes } from "./useSong";
import { clamp, keyed, lerp, prog, easeOut, rng } from "./lib";
import { Sky, Sun } from "./parts/Sky";
import { Sea } from "./parts/Sea";
import { FarLand, NearWall } from "./parts/Land";
import { Ships } from "./parts/Ships";
import { Embers, Smoke } from "./parts/Particles";
import { Captions, MaltaCard } from "./parts/Text";
import { CannonFlash, Defenders, WallDetail } from "./parts/Rampart";
import { FortFx, Grade, Rays, Seabed, Shock, Torches } from "./parts/Fx";
import { Banners, Heroes } from "./parts/Heroes";
import { DateCard, FlashRing, TitleSlam } from "./parts/Title";

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

const inAny = (t: number, ws: [number, number][]) => ws.some(([a, b]) => t >= a && t <= b);
const CHORUS_WINDOWS: [number, number][] = [SECTIONS.chorus1, SECTIONS.chorus2, SECTIONS.final];
const HIT_WINDOWS: [number, number][] = [...CHORUS_WINDOWS, SECTIONS.bridge.map((v, i) => (i ? v : 145.5)) as [number, number]];
const bursts = drumTimes.filter((d) => d.v > 0.5 && inAny(d.t, CHORUS_WINDOWS));
const hits = drumTimes.filter((d) => d.v > 0.6 && inAny(d.t, HIT_WINDOWS));

/** Camera that re-aims on every bar (eased), punches on every beat and shakes on cue. */
function useCamera(t: number, pulse: number, kick: number, w: number, h: number) {
  const dyn = keyed(t, DYN);
  let bi = -1;
  for (let lo = 0, hi = beatTimes.length - 1; lo <= hi; ) { const m = (lo + hi) >> 1; if (beatTimes[m] <= t) { bi = m; lo = m + 1; } else hi = m - 1; }
  const bar = Math.max(0, Math.floor(bi / 4));
  const target = (b: number) => { const r = rng(b * 977 + 3); return { x: (r() - 0.5) * w * 0.035, y: (r() - 0.5) * h * 0.022, roll: (r() - 0.5) * 1.1, z: r() * 0.03 }; };
  const a = target(bar - 1), b = target(bar);
  const k = easeOut(clamp((t - (beatTimes[bar * 4] ?? 0)) / 1.1));
  const shake = keyed(t, SHAKE) * (0.35 + pulse * 0.65 + kick * 0.5);
  const slam = Math.max(0, Math.exp(-(t - CUES.titleSlam) * 5)) * (t >= CUES.titleSlam ? 1.6 : 0);
  const sh = shake + slam;
  return {
    x: lerp(a.x, b.x, k) * dyn + Math.sin(t * 71) * sh * w * 0.004,
    y: lerp(a.y, b.y, k) * dyn + Math.cos(t * 63) * sh * w * 0.004,
    roll: lerp(a.roll, b.roll, k) * dyn,
    zoom: keyed(t, ZOOM) * (1 + lerp(a.z, b.z, k) * dyn + pulse * 0.012 * dyn + kick * 0.012 * dyn),
    dyn,
  };
}

export const World: React.FC = () => {
  const L = useLayout();
  const s = useSong();
  const cam = useCamera(s.t, s.pulse, s.kick, L.w, L.h);
  const hazeScale = 6 + s.heat * 14;
  const fadeOut = prog(s.t, SONG_SECONDS - 1.0, SONG_SECONDS + LEAD_OUT - 0.3);
  const dark = keyed(s.t, DARK);
  const embers = s.t > 160.8 && s.t < 198 ? 1 : 0.25 + s.energy * 0.6;
  return (
    <AbsoluteFill style={{ background: "#050203", overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="haze" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency={`0.006 ${0.04 + 0.01 * Math.sin(s.t * 0.7)}`} numOctaves="2" seed={Math.floor(s.t * 6) % 40} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={hazeScale} yChannelSelector="G" xChannelSelector="R" />
        </filter>
      </svg>
      <AbsoluteFill
        style={{
          transform: `translate(${cam.x}px, ${cam.y}px) rotate(${cam.roll}deg) scale(${cam.zoom})`,
          transformOrigin: `50% ${(L.horizon / L.h) * 100}%`,
          filter: cam.dyn > 0.05 ? `saturate(${1 + 0.18 * s.pulse * cam.dyn}) contrast(${1 + 0.06 * s.kick * cam.dyn})` : undefined,
        }}
      >
        <AbsoluteFill style={{ filter: "url(#haze)", transform: "scale(1.03)", transformOrigin: `50% ${(L.horizon / L.h) * 100}%` }}>
          <Sky s={s} L={L} />
          <Sun s={s} L={L} />
          <Rays s={s} L={L} />
          <Sea s={s} L={L} />
          <FarLand s={s} L={L} />
          <Ships s={s} L={L} />
        </AbsoluteFill>
        <FortFx s={s} L={L} />
        <Torches s={s} L={L} />
        <Seabed s={s} L={L} />
        <Smoke s={s} L={L} />
        <Shock s={s} L={L} hits={hits} />
        <Defenders s={s} L={L} />
        <Banners s={s} L={L} />
        <NearWall s={s} L={L} />
        <WallDetail s={s} L={L} />
        <Heroes s={s} L={L} />
        <CannonFlash s={s} L={L} />
        <Embers s={s} L={L} density={embers} bursts={bursts} />
        <HorizonLine t={s.t} w={L.w} y={L.horizon} />
      </AbsoluteFill>
      <Grade s={s} dark={dark} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.65) 100%)" }} />
      <MaltaCard s={s} L={L} />
      <DateCard s={s} L={L} />
      <TitleSlam s={s} L={L} />
      <FlashRing s={s} L={L} />
      <Captions s={s} L={L} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeOut, pointerEvents: "none" }} />
      {s.t < 0 ? <AbsoluteFill style={{ background: "#000" }} /> : null}
    </AbsoluteFill>
  );
};
