import React, { useMemo } from "react";
import { ARMS_UP, CRACKS, DEFENDERS, FLASH_WINDOWS, NAME_GLOWS, PALETTE } from "../timeline";
import { Layout } from "../layout";
import { Song, beatTimes } from "../useSong";
import { clamp, keyed, prog, rng, easeOut } from "../lib";
import { panOffset } from "./Land";
import { goldMix } from "./Sky";
import { CAPTION_FONT } from "./Text";

const armsUp = (t: number) => ARMS_UP.reduce((m, [a, b]) => Math.max(m, prog(t, a, a + 0.5) * (1 - prog(t, b, b + 0.8))), 0);

/** Soldiers on the walls: rise behind the parapet, bob on the beat, raise arms and banners on cue. */
export const Defenders: React.FC<{ s: Song; L: Layout }> = ({ s, L }) => {
  const amt = keyed(s.t, DEFENDERS);
  const up = armsUp(s.t);
  const size = L.tall ? L.w * 0.115 : L.h * 0.11;
  const list = useMemo(() => {
    const r = rng(99);
    const n = Math.round((L.stripW * 0.72) / (size * 0.62));
    return Array.from({ length: n }, (_, i) => ({
      x: i * size * 0.62 + (r() - 0.5) * size * 0.3,
      th: r(), k: 0.88 + r() * 0.24, ph: r() * 6.28, banner: i % 5 === 2, pole: i % 7 === 3,
    }));
  }, [L.stripW, size]);
  if (amt < 0.01) return null;
  const g = goldMix(s.t);
  const body = g > 0.3 ? "#1a0d08" : "#0d0507";
  const ox = panOffset(s, L, 0.9);
  return (
    <svg width={L.w} height={L.h} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(${ox} ${L.wallTop + 6})`}>
        {list.map((d, i) => {
          const sx = d.x + ox;
          if (sx < -size * 2 || sx > L.w + size * 2) return null;
          const rise = prog(amt, d.th * 0.85, d.th * 0.85 + 0.15, easeOut);
          if (rise <= 0) return null;
          const k = size * d.k;
          const lift = up * (0.8 + 0.2 * Math.sin(s.t * 8 + d.ph) * 0.0 + 0.2 * s.pulse);
          const bob = -s.pulse * k * 0.04 * (0.5 + up);
          const y = (1 - rise) * k * 1.2 + bob;
          const armY = -0.52 * k, handY = armY - lift * 0.55 * k;
          const hand = (sgn: number) => `M${sgn * 0.12 * k} ${armY} L${sgn * (0.2 + lift * 0.14) * k} ${handY}`;
          return (
            <g key={i} transform={`translate(${d.x} ${y})`} fill={body} stroke={body}>
              <path d={`M${-0.16 * k} 0 L${-0.14 * k} ${-0.62 * k} Q0 ${-0.7 * k} ${0.14 * k} ${-0.62 * k} L${0.16 * k} 0 Z`} />
              <circle cx={0} cy={-0.74 * k} r={0.1 * k} />
              <path d={`M${-0.13 * k} ${-0.76 * k} Q0 ${-0.98 * k} ${0.13 * k} ${-0.76 * k} L${0.17 * k} ${-0.74 * k} L${-0.17 * k} ${-0.74 * k} Z`} />
              <path d={hand(-1) + hand(1)} strokeWidth={0.07 * k} strokeLinecap="round" fill="none" />
              {d.pole && up < 0.3 ? <path d={`M${0.2 * k} 0 L${0.2 * k} ${-1.5 * k}`} strokeWidth={0.03 * k} fill="none" /> : null}
              {d.banner && up > 0.05 ? (
                <g opacity={up}>
                  <path d={`M${0.2 * k} ${handY} L${0.2 * k} ${handY - 0.8 * k}`} strokeWidth={0.035 * k} fill="none" />
                  <path
                    d={`M${0.2 * k} ${handY - 0.8 * k} q${0.3 * k} ${0.04 * k * Math.sin(s.t * 6 + d.ph)} ${0.5 * k} ${0.02 * k} l0 ${0.34 * k} q${-0.2 * k} ${0.05 * k * Math.sin(s.t * 6 + d.ph)} ${-0.5 * k} ${-0.02 * k} Z`}
                    fill={PALETTE.crimson} stroke="none"
                  />
                </g>
              ) : null}
            </g>
          );
        })}
      </g>
    </svg>
  );
};

/** Masonry courses, cracks and engraved names on the near bastion. */
export const WallDetail: React.FC<{ s: Song; L: Layout }> = ({ s, L }) => {
  const ox = panOffset(s, L, 0.9);
  const faceH = L.h - L.wallTop;
  const course = Math.max(24, faceH / 6);
  const { joints, cracks, names } = useMemo(() => {
    const r = rng(314);
    const W = L.stripW * 0.8;
    let jd = "";
    for (let row = 0; row * course < faceH + course; row++) {
      const y = L.wallTop + row * course;
      jd += `M0 ${y} H${W} `;
      const bw = course * 2.4;
      for (let x = (row % 2) * bw * 0.5; x < W; x += bw) jd += `M${x} ${y} V${y + course} `;
    }
    const cracks = Array.from({ length: 22 }, () => {
      let x = r() * W, y = L.wallTop + 4;
      let d = `M${x} ${y}`;
      const n = 6 + Math.floor(r() * 4);
      for (let i = 0; i < n; i++) { x += (r() - 0.5) * course * 1.1; y += course * (0.25 + r() * 0.35); d += ` L${x} ${y}`; }
      return { d, th: r() };
    });
    const surnames = ["BORG", "CAMILLERI", "VELLA", "GRECH", "ZAMMIT", "AZZOPARDI", "FARRUGIA", "ATTARD", "CASSAR", "DEBONO", "SPITERI", "MICALLEF", "SCICLUNA", "CACHIA", "BUGEJA", "MIFSUD"];
    const names = Array.from({ length: 34 }, (_, i) => ({
      x: 80 + i * (W / 34) + r() * 40, row: 1 + Math.floor(r() * 2), text: surnames[Math.floor(r() * surnames.length)], th: r(),
    }));
    return { joints: jd, cracks, names };
  }, [L.stripW, L.wallTop, course, faceH]);

  const crack = keyed(s.t, CRACKS);
  const nameGlow = (th: number) => {
    let m = 0;
    for (const [a, b] of NAME_GLOWS) {
      const st = a + th * (b - a) * 0.7;
      m = Math.max(m, prog(s.t, st, st + 0.3, easeOut) * (1 - prog(s.t, b, b + 1.6)));
    }
    return m;
  };
  const fs = course * 0.52;
  return (
    <svg width={L.w} height={L.h} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(${ox} 0)`}>
        <path d={joints} stroke="rgba(0,0,0,0.38)" strokeWidth={1.4} fill="none" />
        {names.map((n, i) => {
          const g = nameGlow(n.th);
          return (
            <text
              key={i} x={n.x} y={L.wallTop + n.row * course + course * 0.65} fontFamily={CAPTION_FONT} fontSize={fs}
              letterSpacing={fs * 0.15} fill={g > 0.01 ? PALETTE.gold : "rgba(0,0,0,0.45)"} opacity={0.5 + 0.5 * g}
              style={g > 0.01 ? { filter: `drop-shadow(0 0 ${4 + g * 10}px rgba(242,184,75,${g}))` } : undefined}
            >
              {n.text}
            </text>
          );
        })}
        {cracks.map((c, i) => {
          const p = prog(crack, c.th * 0.6, c.th * 0.6 + 0.4);
          if (p <= 0) return null;
          return (
            <g key={i}>
              <path d={c.d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} stroke="rgba(255,150,60,0.35)" strokeWidth={4} fill="none" transform="translate(1 1)" />
              <path d={c.d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} stroke="#080304" strokeWidth={2.4} fill="none" />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

/** Muzzle flashes on the beat that throw warm light across the walls. */
export const CannonFlash: React.FC<{ s: Song; L: Layout }> = ({ s, L }) => {
  const win = FLASH_WINDOWS.find(([a, b]) => s.t >= a - 0.1 && s.t <= b + 0.6);
  if (!win) return null;
  const els: React.ReactNode[] = [];
  for (let i = 0; i < beatTimes.length; i++) {
    const bt = beatTimes[i];
    if (bt < win[0] || bt > win[1]) continue;
    const age = s.t - bt;
    if (age < 0 || age > 0.5) continue;
    const r = rng(i * 131 + 7);
    const power = 0.45 + 0.55 * prog(bt, win[0], win[1]);
    const a = Math.min(1, Math.exp(-age * 9) * power * 1.5);
    const x = L.w * (0.08 + 0.84 * r());
    const y = L.wallTop - L.h * 0.012;
    const R = L.w * (0.42 + 0.2 * power);
    els.push(
      <g key={i}>
        <circle cx={x} cy={y} r={R} fill="url(#flashWash)" opacity={a} />
        <ellipse cx={x} cy={y} rx={L.w * 0.035 * (1 + a)} ry={L.w * 0.018 * (1 + a)} fill="#fff1c2" opacity={Math.min(1, a * 1.6)} />
      </g>,
    );
  }
  void clamp;
  return (
    <svg width={L.w} height={L.h} style={{ position: "absolute", inset: 0, mixBlendMode: "screen", pointerEvents: "none" }}>
      <defs>
        <radialGradient id="flashWash">
          <stop offset="0" stopColor="#ffb458" stopOpacity="0.8" />
          <stop offset="0.35" stopColor="#d9561c" stopOpacity="0.35" />
          <stop offset="1" stopColor="#d9561c" stopOpacity="0" />
        </radialGradient>
      </defs>
      {els}
    </svg>
  );
};
