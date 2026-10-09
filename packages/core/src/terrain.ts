export interface TerrainType {
  /** Stable id used by maps and saves, e.g. "plain". */
  readonly id: string;
  /** Display name shown in the HUD label. */
  readonly name: string;
  /** AP cost to enter one tile of this terrain. */
  readonly moveCost: number;
  /** Evasion bonus (percentage points) for a unit standing here. */
  readonly avoid: number;
  /** Units cannot enter impassable tiles (deep water, sheer walls). */
  readonly impassable?: boolean;
}
