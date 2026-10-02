import React, { useMemo } from "react";
import { DYN, FLOOD, FORT, TORCHES, WATER, PALETTE } from "../timeline";
import { Layout } from "../layout";
import { Song } from "../useSong";
import { keyed, prog, rng, mix } from "../lib";
import { goldMix, sunGeom } from "./Sky";
import { fortScreen, panOffset } from "./Land";

/** God rays fanning from the sun; they swell on every beat. */
export const Rays: React.FC<{ s: Song; L: Layout }> = ({ s, L }) => {
  const dyn = keyed(s.t, DYN);
  const { cy } = sunGeom(s, L);
  const g = goldMix(s.t);
  const rays = useMemo(() => {
    const r = rng(2024);
    return Array.from({ length: 22 }, () => ({ a: r() * Math.PI * 2, w: 0.02 + r() * 0.05, o: 0.4 + r() * 0.6, sp: (r() - 0.5) * 0.05 }));
  }, []);
  const strength = prog(s.t, 8, 20) * (0.05 + s.heat * 0.16) * (0.65 + 0.7 * s.pulse * (0.4 + dyn) + s.kick * 0.5);
  if (strength < 0.005) return null;
  const len = Math.max(L.w, L.h) * 1.6;
  const col = mix([255, 150, 70], [255, 225, 150], g);
  return (
    <svg width={L.w} height={L.h} style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id="rayFade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={col} stopOpacity="1" />
          <stop offset="1" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>
      <g transform={`translate(${L.cx} ${cy})`}>
        {rays.map((r, i) => {
          const a = r.a + s.t * r.sp;
          const w = r.w * (1 + 0.5 * s.pulse * dyn);
          return (
            <path
              key={i} d={`M0 0 L${len * Math.cos(a - w)} ${len * Math.sin(a - w)} L${len * Math.cos(a + w)} ${len * Math.sin(a + w)} Z`}
              fill={col} opacity={strength * r.o * 0.55}
              style={{ maskImage: undefined }}
            />
          );
        })}
      </g>
    </svg>
  );
};

/** Shockwave rings from the sun on strong drum hits. */
export const Shock: React.FC<{ s: Song; L: Layout; hits: { t: number; v: number }[] }> = ({ s, L, hits }) => {
  const { R, cy } = sunGeom(s, L);
  const g = goldMix(s.t);
  const els: React.ReactNode[] = [];
  for (const h of hits) {
    const age = s.t - h.t;
    if (age < 0 || age > 0.9) continue;
    const e = 1 - Math.pow(1 - age / 0.9, 3);
    els.push(
      <circle key={h.t} cx={L.cx} cy={cy} r={R * (1 + e * 1.8)} fill="none" stroke={g > 0.4 ? "#ffe3a0" : "#ff9a4a"}
        strokeWidth={R * 0.05 * (1 - e) + 1} opacity={(1 - age / 0.9) * 0.55 * h.v} />,
    );
  }
  if (!els.length) return null;
  return <svg width={L.w} height={L.h} style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}>{els}</svg>;
};

/** Little fires and torches that stay lit across the island. */
export const Torches: React.FC<{ s: Song; L: Layout }> = ({ s, L }) => {
  const amt = keyed(s.t, TORCHES);
  const pts = useMemo(() => {
    const r = rng(808);
    const city = Array.from({ length: 46 }, () => ({ x: r() * L.stripW * 0.75, dy: r() * 34, th: r(), ph: r() * 6.28, sz: 1.6 + r() * 1.6 }));
    const wall = Array.from({ length: 16 }, (_, i) => ({ x: 120 + i * (L.stripW * 0.72 / 16) + r() * 60, th: r(), ph: r() * 6.28 }));
    return { city, wall };
  }, [L.stripW]);
  if (amt < 0.01) return null;
  const cox = panOffset(s, L, 0.35), wox = panOffset(s, L, 0.9);
  const flick = (ph: number) => 0.7 + 0.3 * Math.sin(s.t * 11 + ph) * Math.sin(s.t * 7.3 + ph * 2);
  return (
    <svg width={L.w} height={L.h} style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}>
      <defs>
        <radialGradient id="torch">
          <stop offset="0" stopColor="#ffd27a" stopOpacity="0.95" />
          <stop offset="0.3" stopColor="#ff8a2a" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ff5a1a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {pts.city.map((p, i) => {
        if (p.th > amt) return null;
        const x = p.x + cox;
        if (x < -20 || x > L.w + 20) return null;
        const f = flick(p.ph);
        return <g key={i}><circle cx={x} cy={L.horizon - p.dy} r={p.sz * 6 * f} fill="url(#torch)" /><circle cx={x} cy={L.horizon - p.dy} r={p.sz * 0.7} fill="#fff0c0" opacity={f} /></g>;
      })}
      {pts.wall.map((p, i) => {
        if (p.th > amt) return null;
        const x = p.x + wox;
        if (x < -40 || x > L.w + 40) return null;
        const f = flick(p.ph);
        return <g key={i}><circle cx={x} cy={L.wallTop - 36} r={26 * f * (L.w / 1920 + 0.4)} fill="url(#torch)" /><ellipse cx={x} cy={L.wallTop - 36} rx={3.2} ry={6 * f} fill="#fff0c0" /></g>;
      })}
    </svg>
  );
};

/** Fort St Elmo: fires dim and smoke pours from the ruined bastion. */
export const FortFx: React.FC<{ s: Song; L: Layout }> = ({ s, L }) => {
  const amt = keyed(s.t, FORT);
  const puffs = useMemo(() => { const r = rng(61); return Array.from({ length: 16 }, () => ({ ph: r(), sw: r() * 6.28, sz: 0.6 + r() * 0.8 })); }, []);
  if (amt < 0.01) return null;
  const f = fortScreen(s, L);
  if (f.x < -400 || f.x > L.w + 400) return null;
  const k = L.h * 0.0011;
  return (
    <svg width={L.w} height={L.h} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="fortFire"><stop offset="0" stopColor="#ff9a3a" stopOpacity="0.9" /><stop offset="1" stopColor="#c0200e" stopOpacity="0" /></radialGradient>
        <radialGradient id="fortSmoke"><stop offset="0" stopColor="#262022" stopOpacity="0.95" /><stop offset="1" stopColor="#262022" stopOpacity="0" /></radialGradient>
      </defs>
      <g style={{ mixBlendMode: "screen" }}>
        {[-150, -50, 70, 160].map((dx, i) => (
          <circle key={i} cx={f.x + dx * k * 2} cy={f.y + 28 * k * 8} r={(30 + 14 * Math.sin(s.t * 9 + i * 2)) * k * 2.4} fill="url(#fortFire)" opacity={amt * (0.6 + 0.3 * Math.sin(s.t * 6 + i))} />
        ))}
      </g>
      {puffs.map((p, i) => {
        const age = ((s.t * 0.09 + p.ph) % 1 + 1) % 1;
        return <circle key={i} cx={f.x + Math.sin(s.t * 0.4 + p.sw) * 30 * k * 4 + age * 220 * k * 3} cy={f.y - age * L.h * 0.55} r={L.h * 0.035 * p.sz * (1 + age * 3.2)} fill="url(#fortSmoke)" opacity={Math.sin(Math.PI * age) * 0.8 * amt} />;
      })}
    </svg>
  );
};

/** Exposed seabed and tide marks as the harbour water level drops. */
export const Seabed: React.FC<{ s: Song; L: Layout }> = ({ s, L }) => {
  const a = keyed(s.t, WATER);
  const mud = useMemo(() => { const r = rng(12); return Array.from({ length: 80 }, () => r()); }, []);
  if (a < 0.01) return null;
  const maxH = L.h * 0.085;
  const top = (x: number, i: number, lvl: number) => L.wallTop - maxH * lvl * (0.82 + 0.18 * mud[i % mud.length]) - Math.sin(x * 0.01 + i) * 2;
  const pts = (lvl: number) => { let d = ""; for (let i = 0; i <= 60; i++) { const x = (L.w * i) / 60; d += `${i ? "L" : "M"}${x} ${top(x, i, lvl)} `; } return d; };
  const sea = mix([20, 54, 88], [90, 60, 40], 0);
  void sea;
  return (
    <svg width={L.w} height={L.h} style={{ position: "absolute", inset: 0 }}>
      <path d={`${pts(a)} L${L.w} ${L.wallTop + 2} L0 ${L.wallTop + 2} Z`} fill="#3b2a1c" />
      <path d={`${pts(a * 0.66)} L${L.w} ${L.wallTop + 2} L0 ${L.wallTop + 2} Z`} fill="#2a1d14" opacity={0.7} />
      <path d={pts(a)} stroke="rgba(255,190,110,0.35)" strokeWidth={1.6} fill="none" />
      <path d={pts(a * 0.5)} stroke="rgba(255,190,110,0.12)" strokeWidth={1} fill="none" />
    </svg>
  );
};

/** Full-frame colour: darkening, gold flood, kick flashes. */
export const Grade: React.FC<{ s: Song; dark: number }> = ({ s, dark }) => {
  const flood = keyed(s.t, FLOOD);
  const dyn = keyed(s.t, DYN);
  const kickA = s.kick * 0.13 * dyn;
  return (
    <>
      {dark > 0.01 ? <div style={{ position: "absolute", inset: 0, background: `rgba(6,2,4,${dark})` }} /> : null}
      {flood > 0.01 ? (
        <div style={{ position: "absolute", inset: 0, mixBlendMode: "screen", opacity: flood * (0.75 + 0.25 * s.pulse), background: `radial-gradient(ellipse at 50% 45%, ${PALETTE.gold}cc 0%, rgba(242,184,75,0.35) 40%, rgba(242,184,75,0) 75%)` }} />
      ) : null}
      {kickA > 0.005 ? <div style={{ position: "absolute", inset: 0, mixBlendMode: "screen", background: `rgba(255,120,50,${kickA})` }} /> : null}
    </>
  );
};
