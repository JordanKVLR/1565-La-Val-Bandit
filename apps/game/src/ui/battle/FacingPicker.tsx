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
            onClick={() => onPick(corners[c])}
          >
            {ARROWS[c]}
          </button>
        ))}
      </div>
      <button type="button" class="btn ghost" onClick={onCancel}>
        Back
      </button>
    </div>
  );
}
