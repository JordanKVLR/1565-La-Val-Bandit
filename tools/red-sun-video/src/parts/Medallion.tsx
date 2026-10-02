import React from "react";
import { PALETTE } from "../timeline";

/** Ninu's half-medallion: circle split down the middle, cross on the left, crescent and star on the right. */
export const Medallion: React.FC<{ size: number; glow?: number; x?: number; y?: number }> = ({ size, glow = 0.5, x = 0, y = 0 }) => {
  const gold = PALETTE.gold;
  return (
    <svg width={size} height={size} viewBox="-60 -60 120 120" style={{ position: "absolute", left: x - size / 2, top: y - size / 2, overflow: "visible" }}>
      <defs>
        <radialGradient id="medGlow">
          <stop offset="0" stopColor={gold} stopOpacity={0.55 * glow} />
          <stop offset="1" stopColor={gold} stopOpacity="0" />
        </radialGradient>
        <clipPath id="medL"><rect x="-60" y="-60" width="59" height="120" /></clipPath>
        <clipPath id="medR"><rect x="1" y="-60" width="59" height="120" /></clipPath>
      </defs>
      <circle r="58" fill="url(#medGlow)" />
      <g clipPath="url(#medL)">
        <circle r="40" fill="#7a5a1c" stroke={gold} strokeWidth="3" />
        <g stroke={gold} strokeWidth="3.4" strokeLinecap="round" opacity="0.95">
          <path d="M-14 0 H-4 M-9 -12 V12" />
          <path d="M-20 -22 L-14 -16 M-20 22 L-14 16" strokeWidth="2" />
        </g>
        <circle r="31" fill="none" stroke={gold} strokeWidth="1" strokeDasharray="2 3" opacity="0.7" />
      </g>
      <g clipPath="url(#medR)">
        <circle r="40" fill="#6a4a14" stroke={gold} strokeWidth="3" />
        <path d="M24 -14 A15 15 0 1 0 24 14 A11 11 0 1 1 24 -14 Z" fill={gold} opacity="0.95" transform="translate(-12 0)" />
        <path d="M18 -2 l2 5 5 .3 -4 3.2 1.4 5 -4.4 -3 -4.4 3 1.4 -5 -4 -3.2 5 -.3 Z" fill={gold} transform="translate(3 -4) scale(0.9)" />
        <circle r="31" fill="none" stroke={gold} strokeWidth="1" strokeDasharray="2 3" opacity="0.7" />
      </g>
      <line x1="0" y1="-40" x2="0" y2="40" stroke={gold} strokeWidth="1.2" opacity="0.85" />
    </svg>
  );
};
