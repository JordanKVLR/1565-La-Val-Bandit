/** Shared numbers and helpers for drawing a unit's stats (cards, sheets, training). */

/** Attributes top out at 32 (the classic cap), so a full meter means a maxed attribute. */
export const ATTRIBUTE_BAR_MAX = 32;

/** "(+2)" after a gear-inclusive attribute: how much of it the gear gives. */
export function gearNote(diff: number): string {
  return `(${diff > 0 ? '+' : ''}${diff})`;
}

/** AP/FP an action is about to cost, previewed on the meters. */
export interface CostPreview {
  readonly ap?: number;
  readonly fp?: number;
}
