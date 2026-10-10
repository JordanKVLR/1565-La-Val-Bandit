# ADR 0013: 2D art pipeline (default) with a 3D switch

## Status
Accepted.

## Context
The 3D procedural Armatura figures are placeholders until proper 3D designs exist. We want
world-class, fun 2D visuals now, without losing the 3D path.

## Decision
- A new `render2d/` layer draws everything as hand-authored vector art on Canvas 2D: a
  pose-driven side-view rig for every frame model (`rig.ts`), an effects toolkit (`fx.ts`), a 2D
  duel stage (`DuelStage2D.ts`) with a script per attack (`attacks/`), animated map sprites,
  and vector character portraits with expressions.
- The rig is driven by the same `Pose` and keyframes (`duelMoves.ts`) as the 3D figure, so both
  modes play the same choreography. Per-attack scripts add extra choreography and effects.
- `Settings.renderMode` is `'2d'` (default) or `'3d'`, switchable any time in Settings. The 3D
  code is untouched and remains the fallback.
- Core stays untouched; the render layer never decides rules.

## Consequences
Two presentation paths to keep working until the 3D designs land. `contract.ts` is the seam.
