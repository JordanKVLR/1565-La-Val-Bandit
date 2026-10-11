import type { UnitState } from '@m1565/core';
import { portraitUrl } from '../../render/art';
import { useArtRevision } from '../useArt';

/**
 * A unit's portrait, or while there is none its initial on the side's colour (hud.css). It
 * fills its frame (`.bhud-avatar`, `.cu-avatar`), which draws the side's ring and shape mark.
 */
export function Portrait({
  name,
  side,
  castId,
}: {
  name: string;
  side: UnitState['side'];
  castId?: string | null;
}) {
  // The first battle screen can render before the art manifest has loaded: draw again then.
  useArtRevision();
  const url = portraitUrl(castId);
  return (
    <div class={`portrait portrait-${side}`} aria-hidden="true">
      {url ? <img src={url} alt="" /> : name.charAt(0)}
    </div>
  );
}
