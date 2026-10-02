import React, { useMemo } from "react";
import { PALETTE, CUES } from "../timeline";
import { Layout } from "../layout";
import { Song } from "../useSong";
import { mix, prog, rng } from "../lib";
import { goldMix, sunGeom } from "./Sky";

export const Sea: React.FC<{ s: Song; L: Layout }> = ({ s, L }) => {
  const reveal = prog(s.t, CUES.worldReveal[0], CUES.worldReveal[1]);
  const g = goldMix(s.t);
  const { R } = sunGeom(s, L);
  const streaks = useMemo(() => {
    const r = rng(7);
    return Array.from({ length: 70 }, () => ({ d: r(), ph: r() * 6.28, sp: 0.4 + r() * 0.8, wv: 0.5 + r() }));
  }, []);
  const seaH = L.h - L.horizon;
  const reflect = mix([255, 120, 40], [255, 214, 130], g);
  const intro = prog(s.t, 3, 13);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: reveal }}>
      <div
        style={{
          position: "absolute", left: 0, right: 0, top: L.horizon, height: seaH,
          background: `linear-gradient(to bottom, ${mix([60, 20, 26], [18, 56, 92], 0.5 + 0.5 * (1 - s.heat) * 0)} 0%, ${PALETTE.sea} 25%, ${PALETTE.seaDeep} 100%)`,
        }}
      />
      <svg width={L.w} height={L.h} style={{ position: "absolute", inset: 0 }}>
        {streaks.map((k, i) => {
          const y = L.horizon + 2 + Math.pow(k.d, 1.7) * seaH * 0.9;
          const depth = (y - L.horizon) / seaH;
          const wide = R * (0.5 + depth * 1.6) * (0.4 + k.wv * 0.6);
          const x = L.cx + Math.sin(s.t * k.sp * 1.4 + k.ph) * wide * 0.35 * (0.3 + depth);
          const th = 1.5 + depth * 5 + s.pulse * 1.5;
          const op = (0.12 + 0.42 * (1 - depth * 0.5)) * (0.5 + 0.5 * Math.sin(s.t * k.sp * 3 + k.ph * 2)) * (0.3 + s.heat) * intro;
          return <rect key={i} x={x - wide / 2} y={y} width={wide} height={th} rx={th / 2} fill={reflect} opacity={Math.max(0, op)} />;
        })}
      </svg>
    </div>
  );
};
