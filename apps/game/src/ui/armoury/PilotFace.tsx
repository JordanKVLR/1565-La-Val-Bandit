import type { Library, RosterEntry } from '@m1565/content';
import { portraitUrl } from '../../render/art';
import { Icon } from '../design';
import { nameOf, sideOf } from './model';

/**
 * A pilot's portrait. Allegiance shows by shape, not colour: an escutcheon (pointed shield)
 * with a small Maltese cross for the Order, a domed arch with a crescent for the Porte.
 */
export function PilotFace({ lib, entry }: { lib: Library; entry: RosterEntry }) {
  const side = sideOf(lib, entry.characterId);
  const name = nameOf(lib, entry.characterId);
  const url = portraitUrl(entry.characterId);
  return (
    <span class={`ar-face side-${side}`} aria-hidden="true">
      <span class="ar-face__ring">
        <span class="ar-face__pic">{url ? <img src={url} alt="" /> : name.charAt(0)}</span>
      </span>
      <Icon name={side === 'malta' ? 'cross' : 'crescent'} class="ar-face__mark" />
    </span>
  );
}
