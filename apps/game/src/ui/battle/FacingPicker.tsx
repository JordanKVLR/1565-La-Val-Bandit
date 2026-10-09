import type { Facing } from '@m1565/core';

type Corner = 'upLeft' | 'upRight' | 'downLeft' | 'downRight';

interface Props {
  corners: Record<Corner, Facing>;
  current: Facing;
  onPick: (f: Facing) => void;
  onCancel: () => void;
}

const ARROWS: Record<Corner, string> = { upLeft: '↖', upRight: '↗', downLeft: '↙', downRight: '↘' };

/** End-of-turn facing choice, laid out to match the isometric screen directions. */
export function FacingPicker({ corners, current, onPick, onCancel }: Props) {
  return (
    <div class="facing-picker" role="dialog" aria-label="Choose facing">
      <p>Face which way?</p>
      <div class="facing-grid">
        {(Object.keys(ARROWS) as Corner[]).map((c) => (
          <button
            type="button"
            key={c}
            class={`btn facing-btn ${corners[c] === current ? 'current' : ''}`}
            aria-label={`Face ${corners[c]}`}
            aria-pressed={corners[c] === current}
            data-nav-default={corners[c] === current || undefined}
            onClick={() => onPick(corners[c])}
          >
            {ARROWS[c]}
            {/* The current facing is marked in words too, not by the outline alone. */}
            {corners[c] === current && (
              <small class="facing-now" aria-hidden="true">
                now
              </small>
            )}
          </button>
        ))}
      </div>
      <button type="button" class="btn ghost" data-nav-back onClick={onCancel}>
        Back
      </button>
    </div>
  );
}
