import React, { useMemo } from "react";
import { CUES, FLEET } from "../timeline";
import { Layout } from "../layout";
import { Song } from "../useSong";
import { clamp, keyed, mix, prog, rng } from "../lib";
import { goldMix } from "./Sky";
import { panOffset } from "./Land";

/** Galley sails on the horizon. Count follows timeline.FLEET; sinks below the horizon in the outro. */
export const Ships: React.FC<{ s: Song; L: Layout }> = ({ s, L }) => {
  const ships = useMemo(() => {
    const r = rng(41);
    return Array.from({ length: 32 }, (_, i) => ({
      x: r(), depth: r(), sc: 0.6 + r() * 0.9, ph: r() * 6.28, sinkAt: r() * 0.55,
    }));
  }, []);
  const n = keyed(s.t, FLEET);
  const g = goldMix(s.t);
  const sink = prog(s.t, CUES.fleetSinks[0], CUES.fleetSinks[1]);
  const sail = mix([26, 10, 14], [70, 40, 28], g);
  const ox = panOffset(s, L, 0.2);
  const clipId = "horizonClip";
  return (
    <svg width={L.w} height={L.h} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={L.w} height={L.horizon + 3} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {ships.map((sh, i) => {
          const a = clamp(n - i);
          if (a <= 0) return null;
          const ap = prog(a, 0, 1);
          const k = (L.tall ? L.w * 0.0055 : L.h * 0.0058) * sh.sc * (0.75 + sh.depth * 0.7);
          const rawX = ((sh.x * L.stripW * 0.6 + ox) % L.stripW + L.stripW) % L.stripW;
          const x = (rawX / L.stripW) * L.w * 1.2 - L.w * 0.1;
          const my = prog(sink, sh.sinkAt, sh.sinkAt + 0.45);
          const y = L.horizon + 2 - sh.depth * 6 + my * k * 14 + Math.sin(s.t * 0.9 + sh.ph) * 1.2;
          const o = ap * (1 - my * 0.2);
          return (
            <g key={i} transform={`translate(${x} ${y}) scale(${k})`} opacity={o}>
              <path d="M-5 0 L5 0 L3.4 1.5 L-3.4 1.5 Z" fill={sail} />
              <path d="M-0.2 0 L-0.2 -8 L-4.6 -0.4 Z" fill={sail} />
              <path d="M0.4 0 L0.4 -10 L5 -0.4 Z" fill={sail} />
              <rect x={-0.1} y={-10.4} width={0.3} height={10.4} fill={sail} />
            </g>
          );
        })}
      </g>
    </svg>
  );
};
