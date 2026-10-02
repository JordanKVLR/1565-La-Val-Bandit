import React, { useMemo } from "react";
import { Layout } from "../layout";
import { Song } from "../useSong";
import { keyed, rng, prog } from "../lib";
import { SMOKE } from "../timeline";
import { goldMix } from "./Sky";

/** Drifting smoke columns rising from the harbour. */
export const Smoke: React.FC<{ s: Song; L: Layout }> = ({ s, L }) => {
  const amt = keyed(s.t, SMOKE);
  const puffs = useMemo(() => {
    const r = rng(5);
    const srcs = Array.from({ length: 6 }, () => ({ x: 0.08 + r() * 0.84 }));
    return Array.from({ length: 54 }, (_, i) => {
      const src = srcs[i % srcs.length];
      return { x: src.x, ph: r(), life: 9 + r() * 5, r0: 0.03 + r() * 0.03, sway: r() * 6.28, wind: 0.04 + r() * 0.08 };
    });
  }, []);
  if (amt < 0.01) return null;
  return (
    <svg width={L.w} height={L.h} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="puff">
          <stop offset="0" stopColor="#3b3438" stopOpacity="0.9" />
          <stop offset="1" stopColor="#3b3438" stopOpacity="0" />
        </radialGradient>
      </defs>
      {puffs.map((p, i) => {
        const age = ((s.t / p.life + p.ph) % 1 + 1) % 1;
        const y = L.horizon - 4 - age * L.h * 0.62;
        const x = p.x * L.w + Math.sin(s.t * 0.3 + p.sway) * 24 + age * L.w * p.wind;
        const r = L.h * (p.r0 + age * 0.12);
        const op = Math.sin(Math.PI * age) * 0.55 * amt * (i % 6 < Math.ceil(amt * 6) ? 1 : 0.25);
        return <circle key={i} cx={x} cy={y} r={r} fill="url(#puff)" opacity={op} />;
      })}
    </svg>
  );
};

/** Embers: constant drift plus bursts on drum hits (burstTimes in song seconds). */
export const Embers: React.FC<{ s: Song; L: Layout; density?: number; bursts?: { t: number; v: number }[] }> = ({ s, L, density = 0.4, bursts = [] }) => {
  const g = goldMix(s.t);
  const drift = useMemo(() => {
    const r = rng(77);
    return Array.from({ length: 120 }, () => ({ x: r(), ph: r(), sp: 0.05 + r() * 0.1, sz: 0.8 + r() * 2.4, sw: r() * 6.28 }));
  }, []);
  const n = Math.round(drift.length * Math.min(1, density));
  const colour = g > 0.5 ? "#ffd27a" : "#ff8a2a";
  const burstEls: React.ReactNode[] = [];
  for (const b of bursts) {
    const age = s.t - b.t;
    if (age < 0 || age > 2.2) continue;
    const r = rng(Math.round(b.t * 1000));
    const cnt = Math.round(10 + b.v * 22);
    const ox = L.cx + (r() - 0.5) * L.w * 0.6;
    for (let i = 0; i < cnt; i++) {
      const ang = -Math.PI / 2 + (r() - 0.5) * 2.6, sp = (0.2 + r() * 0.9) * L.h * 0.55;
      const e = prog(age, 0, 2.2, (x) => 1 - Math.pow(1 - x, 3));
      const x = ox + Math.cos(ang) * sp * e, y = L.horizon * 0.9 + Math.sin(ang) * sp * e + 120 * age * age;
      burstEls.push(<circle key={`${b.t}-${i}`} cx={x} cy={y} r={1 + r() * 2.4} fill={colour} opacity={Math.max(0, 1 - age / 2.2)} />);
    }
  }
  return (
    <svg width={L.w} height={L.h} style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}>
      {drift.slice(0, n).map((p, i) => {
        const age = ((s.t * p.sp + p.ph) % 1 + 1) % 1;
        const x = p.x * L.w + Math.sin(s.t * 0.8 + p.sw) * 30 + age * 80;
        const y = L.h * 0.95 - age * L.h * 0.95;
        const tw = 0.6 + 0.4 * Math.sin(s.t * 4 + p.sw * 3);
        return <circle key={i} cx={x} cy={y} r={p.sz} fill={colour} opacity={Math.sin(Math.PI * age) * tw * 0.85} />;
      })}
      {burstEls}
    </svg>
  );
};
