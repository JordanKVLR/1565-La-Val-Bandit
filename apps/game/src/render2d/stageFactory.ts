/** Picks the 2D or 3D implementation of the duel stage and the unit viewer (ADR 0013). */
import { DuelStage } from '../render/DuelStage';
import { UnitViewer } from '../render/UnitViewer';
import type { FigureSpec } from '../render/Armatura';
import { settings } from '../state/settings';
import { DuelStage2D } from './DuelStage2D';
import { UnitViewer2D } from './UnitViewer2D';

export type DuelStageLike = DuelStage | DuelStage2D;
export type UnitViewerLike = UnitViewer | UnitViewer2D;

/** The render mode is read once, when the stage is created. */
export function currentMode(): '2d' | '3d' {
  return settings.get().renderMode === '3d' ? '3d' : '2d';
}

export function createDuelStage(
  canvas: HTMLCanvasElement,
  left: FigureSpec,
  right: FigureSpec,
  ground: string,
  speed: number,
): DuelStageLike {
  return currentMode() === '2d'
    ? new DuelStage2D(canvas, left, right, ground, speed)
    : new DuelStage(canvas, left, right, ground, speed);
}

export function createUnitViewer(canvas: HTMLCanvasElement, spec: FigureSpec): UnitViewerLike {
  return currentMode() === '2d' ? new UnitViewer2D(canvas, spec) : new UnitViewer(canvas, spec);
}
