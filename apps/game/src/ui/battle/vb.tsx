import type { UnitState } from '@m1565/core';
import { loadLibrary } from '@m1565/content';
import type { FigureSpec } from '../../render/Armatura';
import { figureSpec } from '../../render/Armatura';
import { genericPortraitId } from '../../render/art';
import { t } from '../../i18n';

/** Lookups the battle panels share: frame names, portraits, the armatura figure, gear names. */

let lib: ReturnType<typeof loadLibrary> | null = null;

/** The unit's frame (war-harness) name, e.g. "Ħaddiem". */
export function frameName(unit: UnitState): string {
  lib ??= loadLibrary();
  return lib.frames.get(unit.frameId)?.name ?? unit.frameClass;
}

/** The armatura figure for the details sheet. */
/**
 * Whose portrait a unit shows: its own character's, the story figure it stands in for, or the
 * soldier or janissary stand-in.
 */
export function portraitIdFor(
  unit: Pick<UnitState, 'characterId' | 'frameId' | 'portrait'>,
): string | null {
  if (unit.characterId) return unit.characterId;
  if (unit.portrait) return unit.portrait;
  lib ??= loadLibrary();
  const frame = lib.frames.get(unit.frameId);
  return frame
    ? genericPortraitId(lib.frameFactions.get(frame.id) ?? '', lib.frameModels.get(frame.id) ?? '')
    : null;
}

export function unitFigure(unit: UnitState, accent: string): FigureSpec {
  lib ??= loadLibrary();
  return figureSpec(lib, unit, accent);
}

/** Name of a charm or amulet by id, or "No charm" / "No amulet". */
export function gearName(id: string | null, slot: 'charm' | 'amulet'): string {
  if (!id) return slot === 'charm' ? t('gear.noCharm') : t('gear.noAmulet');
  lib ??= loadLibrary();
  return lib.gear.get(id)?.name ?? id;
}
