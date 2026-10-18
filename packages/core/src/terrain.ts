export interface TerrainType {
  /** Stable id used by maps and saves, e.g. "plain". */
  readonly id: string;
  /** Display name shown in the HUD label. */
  readonly name: string;
  /** AP cost for a medium frame to enter one tile of this terrain. */
  readonly moveCost: number;
  /** Light and heavy frames pay differently on some ground (the classic per-class table). */
  readonly moveCostByClass?: { readonly light?: number; readonly heavy?: number };
  /** Evasion bonus (percentage points) for a unit standing here. */
  readonly avoid: number;
  /** Units cannot enter impassable tiles (deep water, sheer walls). */
  readonly impassable?: boolean;
}

/** AP for a frame of this class to enter one tile of this terrain. */
export function moveCostFor(t: TerrainType, frameClass: 'light' | 'medium' | 'heavy'): number {
  return (frameClass === 'medium' ? undefined : t.moveCostByClass?.[frameClass]) ?? t.moveCost;
}
