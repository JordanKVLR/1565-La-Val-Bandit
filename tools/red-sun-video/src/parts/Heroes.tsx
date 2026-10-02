import React from "react";
import { BANNERS, BRIDGE, PALETTE } from "../timeline";
import { Layout } from "../layout";
import { Song } from "../useSong";
import { keyed, lerp, prog, easeOut, easeInOut, MALTESE_ARM } from "../lib";
import { Medallion } from "./Medallion";
import { panOffset } from "./Land";

const Cross: React.FC<{ r: number; fill?: string }> = ({ r, fill = "#f4ead0" }) => (
  <g transform={`scale(${r})`} fill={fill}>
    <rect x={-0.14} y={-0.14} width={0.28} height={0.28} />
    {[0, 90, 180, 270].map((a) => <path key={a} d={MALTESE_ARM} transform={`rotate(${a})`} />)}
  </g>
);

/** Tall Maltese-cross banners that rise on the walls. */
export const Banners: React.FC<{ s: Song; L: Layout }> = ({ s, L }) => {
  const amt = keyed(s.t, BANNERS);
  if (amt < 0.01) return null;
  const ox = panOffset(s, L, 0.9);
  const poleH = L.h * 0.3, bw = L.h * 0.11, bh = L.h * 0.16;
  const base = 0.3 * L.stripW * 0.9;
  return (
    <svg width={L.w} height={L.h} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 6 }, (_, i) => {
        const x = base + L.w * (0.09 + 0.165 * i);
        const rise = prog(amt, i * 0.1, i * 0.1 + 0.4, easeOut);
        const top = L.wallTop + 6 - poleH * rise;
        const wave = Math.sin(s.t * 5 + i * 1.7) * bw * 0.06 + s.pulse * bw * 0.04;
        return (
          <g key={i} transform={`translate(${x + ox} 0)`}>
            <rect x={-2} y={top} width={4} height={L.wallTop + 6 - top} fill="#120708" />
            <path d={`M2 ${top} q${bw * 0.5} ${wave} ${bw} 0 L${bw} ${top + bh} q${-bw * 0.5} ${wave * -1} ${-bw + 2} 0 Z`} fill={PALETTE.crimson} stroke="#2a0507" strokeWidth={1.5} />
            <g transform={`translate(${bw * 0.5 + 1} ${top + bh * 0.46})`}><Cross r={bw * 0.28} /></g>
          </g>
        );
      })}
    </svg>
  );
};

type Hero = "boy" | "knight" | "mother" | "sailor";
const ORDER: Hero[] = ["boy", "knight", "mother", "sailor"];

const Figure: React.FC<{ kind: Hero; fill: string; rim: string }> = ({ kind, fill, rim }) => {
  const common = { fill, stroke: rim, strokeWidth: 0.006, strokeLinejoin: "round" as const };
  switch (kind) {
    case "boy":
      return (
        <g {...common}>
          <rect x={-0.11} y={-0.3} width={0.09} height={0.3} rx={0.03} /><rect x={0.02} y={-0.3} width={0.09} height={0.3} rx={0.03} />
          <path d="M-0.15 -0.28 L-0.13 -0.62 Q0 -0.68 0.13 -0.62 L0.15 -0.28 Z" />
          <circle cx={0} cy={-0.73} r={0.1} />
          {[-0.09, -0.03, 0.04, 0.1, -0.12, 0.12].map((x, i) => <circle key={i} cx={x} cy={-0.82 + (i % 2) * 0.03} r={0.045} />)}
          <path d="M0.12 -0.6 L0.27 -0.86" stroke={fill} strokeWidth={0.06} strokeLinecap="round" fill="none" />
          <path d="M-0.13 -0.6 L-0.2 -0.36" stroke={fill} strokeWidth={0.06} strokeLinecap="round" fill="none" />
        </g>
      );
    case "knight":
      return (
        <g {...common}>
          <path d="M-0.17 -0.88 Q0 -0.94 0.17 -0.88 L0.34 0 Q0 -0.06 -0.34 0 Z" opacity={0.95} />
          <rect x={-0.1} y={-0.42} width={0.08} height={0.42} /><rect x={0.03} y={-0.42} width={0.08} height={0.42} />
          <path d="M-0.15 -0.4 L-0.17 -0.86 Q0 -0.92 0.17 -0.86 L0.15 -0.4 Z" />
          <path d="M-0.1 -0.9 Q0 -1.2 0.1 -0.9 Z" /><circle cx={0} cy={-0.98} r={0.1} />
          <path d="M-0.12 -1.0 Q0 -1.2 0.12 -1.0 L0.14 -0.98 L-0.14 -0.98 Z" />
          <path d="M0.2 -0.2 L0.2 -0.8" stroke={fill} strokeWidth={0.035} /><path d="M0.12 -0.7 L0.28 -0.7" stroke={fill} strokeWidth={0.03} />
          <g fill="#f4ead0" stroke="none" opacity={0.85}><path d="M0 -0.74 L-0.06 -0.62 L0 -0.52 L0.06 -0.62 Z" /><path d="M-0.08 -0.62 L0.08 -0.62" stroke="#f4ead0" strokeWidth={0.03} /></g>
        </g>
      );
    case "mother":
      return (
        <g {...common}>
          <path d="M-0.28 0 L-0.1 -0.55 L0.1 -0.55 L0.28 0 Z" />
          <path d="M-0.12 -0.52 L-0.11 -0.82 Q0 -0.88 0.11 -0.82 L0.12 -0.52 Z" />
          <circle cx={0} cy={-0.93} r={0.09} />
          <path d="M-0.14 -0.95 Q-0.15 -1.07 0 -1.08 Q0.15 -1.07 0.14 -0.93 Q0.2 -0.75 0.1 -0.7 L0.05 -0.85 Q-0.08 -0.87 -0.1 -0.85 L-0.14 -0.7 Q-0.2 -0.78 -0.14 -0.95 Z" />
          <ellipse cx={0.12} cy={-0.55} rx={0.08} ry={0.07} />
        </g>
      );
    case "sailor":
    default:
      return (
        <g {...common}>
          <rect x={-0.11} y={-0.42} width={0.09} height={0.42} /><rect x={0.02} y={-0.42} width={0.09} height={0.42} />
          <path d="M-0.17 -0.4 L-0.15 -0.84 Q0 -0.9 0.15 -0.84 L0.17 -0.4 Z" />
          <circle cx={0} cy={-0.95} r={0.095} />
          <path d="M-0.11 -0.99 Q0 -1.12 0.11 -0.99 L0.17 -0.97 L-0.17 -0.97 Z" />
          <ellipse cx={-0.12} cy={-0.7} rx={0.14} ry={0.07} fill="none" stroke={fill} strokeWidth={0.04} transform="rotate(35 -0.12 -0.7)" />
          <path d="M0.24 0 L0.24 -1.05" stroke={fill} strokeWidth={0.03} /><path d="M0.2 -1.05 L0.3 -1.05" stroke={fill} strokeWidth={0.05} />
        </g>
      );
  }
};

/** Bridge vignettes: boy with the medallion, knight, mother, sailor; they join in a row on "Hold the line". */
export const Heroes: React.FC<{ s: Song; L: Layout }> = ({ s, L }) => {
  const t = s.t;
  if (t < BRIDGE.boy - 0.2 || t > BRIDGE.out + 4) return null;
  const H = L.tall ? L.h * 0.26 : L.h * 0.37;
  const feet = L.wallTop + L.h * 0.012;
  const start: Record<Hero, number> = { boy: BRIDGE.boy, knight: BRIDGE.knight, mother: BRIDGE.mother, sailor: BRIDGE.sailor };
  const from: Record<Hero, number> = L.tall ? { boy: 0.26, knight: 0.74, mother: 0.38, sailor: 0.62 } : { boy: 0.2, knight: 0.8, mother: 0.36, sailor: 0.64 };
  const row: Record<Hero, number> = L.tall ? { boy: 0.2, knight: 0.4, mother: 0.6, sailor: 0.8 } : { boy: 0.34, knight: 0.447, mother: 0.553, sailor: 0.66 };
  const scale: Record<Hero, number> = { boy: 0.72, knight: 1.05, mother: 0.92, sailor: 0.98 };
  const mv = prog(t, BRIDGE.row, BRIDGE.rowDone);
  const hold = prog(t, BRIDGE.rowDone, BRIDGE.out);
  const out = prog(t, BRIDGE.out + 0.2, BRIDGE.out + 3.5);
  const els = ORDER.map((k, idx) => {
    const a = prog(t, start[k], start[k] + 0.9, easeOut);
    if (a <= 0) return null;
    const lineFocus = t < BRIDGE.row ? prog(t, start[k], start[k] + 0.5) * (1 - prog(t, start[k] + 2.2, start[k] + 3.2)) : 0;
    const x = lerp(from[k], row[k], mv) * L.w;
    const sc = H * scale[k] * (1 + 0.03 * lineFocus + 0.02 * s.pulse * (0.4 + hold * 1.4));
    const slide = (1 - a) * H * 0.06;
    const rimA = 0.35 + 0.5 * lineFocus + 0.5 * hold + 0.2 * s.pulse;
    const fill = "#0a0405";
    return (
      <g key={k} opacity={a * (1 - out)} transform={`translate(${x} ${feet + slide}) scale(${sc})`}>
        <Figure kind={k} fill={fill} rim={`rgba(255,${170 + idx * 10},80,${Math.min(1, rimA)})`} />
      </g>
    );
  });
  // medallion in the boy's raised hand
  const ba = prog(t, BRIDGE.boy + 0.5, BRIDGE.boy + 1.6);
  const bx = lerp(from.boy, row.boy, mv) * L.w + 0.27 * H * scale.boy;
  const by = feet - 0.86 * H * scale.boy;
  return (
    <>
      <svg width={L.w} height={L.h} style={{ position: "absolute", inset: 0 }}>{els}</svg>
      <div style={{ position: "absolute", inset: 0, opacity: ba * (1 - out) }}>
        <Medallion size={H * 0.26} glow={0.7 + 0.5 * s.pulse + hold * 0.6} x={bx} y={by - H * 0.06} />
      </div>
    </>
  );
};
export { easeInOut };
