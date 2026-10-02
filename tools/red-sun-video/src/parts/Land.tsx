import React, { useMemo } from "react";
import { Layout } from "../layout";
import { Song } from "../useSong";
import { keyed, mix, rng } from "../lib";
import { PAN } from "../timeline";
import { goldMix } from "./Sky";

type Kind = "hills" | "city" | "wall";

function skyline(seed: number, width: number, minH: number, maxH: number, kind: Kind, extra?: { fortX: number }) {
  const r = rng(seed);
  let d = `M0 0`;
  let x = 0;
  const pts: string[] = [];
  if (kind === "hills") {
    let y = -minH;
    d = `M0 0 L0 ${-minH}`;
    while (x < width) {
      const nx = x + 80 + r() * 160;
      const ny = -(minH + r() * (maxH - minH));
      d += ` Q${(x + nx) / 2} ${Math.min(y, ny) - 18} ${nx} ${ny}`;
      x = nx; y = ny;
    }
    return d + ` L${x} 0 Z`;
  }
  if (kind === "wall") {
    // limestone bastion: sloped talus + crenellated parapet
    const top = -maxH;
    d = `M0 0 L0 ${top}`;
    while (x < width) {
      const bw = 34 + r() * 10, gap = 22 + r() * 6;
      d += ` L${x} ${top - 26} L${x + bw} ${top - 26} L${x + bw} ${top}`;
      x += bw;
      d += ` L${x + gap} ${top}`;
      x += gap;
      if (r() < 0.07) { // bastion tower
        const tw = 160 + r() * 80;
        d += ` L${x} ${top - 60} L${x + tw} ${top - 60} L${x + tw} ${top}`;
        x += tw;
      }
    }
    return d + ` L${x} 0 Z`;
  }
  // city: blocks, towers, domes, crenellated walls, one star fort
  d = `M0 0 L0 ${-minH}`;
  while (x < width) {
    const fort = extra && Math.abs(x - extra.fortX) < 60;
    if (fort) {
      const fw = 380, fh = maxH * 1.15;
      // angular bastion with slanted flanks
      d += ` L${x} ${-minH} L${x + 40} ${-fh * 0.55} L${x + 120} ${-fh * 0.55} L${x + 150} ${-fh} L${x + 230} ${-fh} L${x + 260} ${-fh * 0.55} L${x + fw - 40} ${-fh * 0.55} L${x + fw} ${-minH}`;
      x += fw + 20;
      continue;
    }
    const w = 30 + r() * 70;
    const h = minH + r() * (maxH - minH) * 0.55;
    const roll = r();
    d += ` L${x} ${-h} `;
    if (roll < 0.09) { // dome
      d += `Q${x + w / 2} ${-h - w * 0.9} ${x + w} ${-h}`;
    } else if (roll < 0.16) { // bell tower with spire
      d += `L${x + w * 0.35} ${-h} L${x + w * 0.5} ${-h - 90} L${x + w * 0.65} ${-h} L${x + w} ${-h}`;
    } else if (roll < 0.35) { // crenellations
      const n = Math.max(2, Math.floor(w / 14));
      for (let i = 0; i < n; i++) d += `L${x + (i * w) / n} ${-h - 9} L${x + ((i + 0.5) * w) / n} ${-h - 9} L${x + ((i + 0.5) * w) / n} ${-h} L${x + ((i + 1) * w) / n} ${-h} `;
    } else d += `L${x + w} ${-h} `;
    x += w;
    d += `L${x} ${-minH}`;
  }
  void pts;
  return d + ` L${x} 0 Z`;
}

export type LandProps = { s: Song; L: Layout };

export const panOffset = (s: Song, L: Layout, parallax: number) => -keyed(s.t, PAN) * L.stripW * parallax;

/** One horizontally-wrapping strip; x offset gives parallax. */
const Strip: React.FC<{ d: string; baseY: number; x: number; L: Layout; fill: string; rim?: string; width: number; stroke?: string; fillBelow?: boolean }> = ({ d, baseY, x, L, fill, width, stroke, fillBelow }) => (
  <svg width={L.w} height={L.h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
    <g transform={`translate(${x} ${baseY})`}>
      <path d={d} fill={fill} stroke={stroke} strokeWidth={stroke ? 2 : 0} />
    </g>
    {fillBelow ? <rect x={0} y={baseY} width={L.w} height={L.h - baseY} fill={fill} /> : null}
  </svg>
);

export const FarLand: React.FC<LandProps> = ({ s, L }) => {
  const g = goldMix(s.t);
  const W = L.stripW;
  const hills = useMemo(() => skyline(3, W, 14, 46, "hills"), [W]);
  const city = useMemo(() => skyline(11, W, 14, 70, "city", { fortX: W * 0.62 }), [W]);
  const farFill = mix([58, 20, 26], [120, 70, 50], g);
  const midFill = mix([30, 12, 16], [78, 44, 30], g);
  return (
    <>
      <Strip d={hills} baseY={L.horizon + 2} x={panOffset(s, L, 0.12)} L={L} fill={farFill} width={W} />
      <Strip d={city} baseY={L.horizon + 8} x={panOffset(s, L, 0.35)} L={L} fill={midFill} width={W} />
    </>
  );
};

export const NearWall: React.FC<LandProps> = ({ s, L }) => {
  const g = goldMix(s.t);
  const W = L.stripW;
  const wall = useMemo(() => skyline(23, W, 0, L.h - L.wallTop, "wall"), [W, L.h, L.wallTop]);
  const lit = mix([42, 24, 20], [150, 108, 60], 0.35 * s.heat + 0.4 * g);
  return (
    <>
      <Strip d={wall} baseY={L.h} x={panOffset(s, L, 0.9)} L={L} fill={lit} width={W} stroke="rgba(255,170,80,0.25)" fillBelow />
      <div
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: L.h - L.wallTop + 30,
          background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(8,4,6,0.85) 100%)",
        }}
      />
    </>
  );
};
