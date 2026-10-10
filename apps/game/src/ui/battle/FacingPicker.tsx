import type { Facing } from '@m1565/core';
import { useRef } from 'preact/hooks';
import { t } from '../../i18n';
import type { AnchorSource } from '../design';
import { Button, PHONE_QUERY, SideMark, useAnchor, useMediaQuery } from '../design';
import { anchorInsets } from './anchoring';

type Corner = 'upLeft' | 'upRight' | 'downLeft' | 'downRight';

interface Props {
  corners: Record<Corner, Facing>;
  current: Facing;
  onPick: (f: Facing) => void;
  onCancel: () => void;
  /** Where the unit stands on screen: the picker opens beside it, where the action bar was. */
  anchor?: AnchorSource | null;
}

const ORDER: readonly Corner[] = ['upLeft', 'upRight', 'downLeft', 'downRight'];

/**
 * End-of-turn facing: four arrows around the unit's mark, pointing the way the isometric
 * screen does. The current facing is pressed (gold rule and wash) and says "now" in words.
 */
export function FacingPicker({ corners, current, onPick, onCancel, anchor }: Props) {
  const panel = useRef<HTMLElement>(null);
  const docked = useMediaQuery(PHONE_QUERY) || !anchor;
  useAnchor(panel, anchor ?? null, !docked, anchorInsets, { gap: 48, lift: 20 });
  return (
    <section
      ref={panel}
      class={`ds-panel ds-elev-2 ds-outlined ov-panel ov-facing${docked ? ' is-docked' : ''}`}
      role="dialog"
      aria-label={t('facing.choose')}
    >
      <p class="ov-title ov-facing__q">{t('facing.question')}</p>
      <div class="ov-facing__grid">
        {ORDER.map((c) => {
          const now = corners[c] === current;
          return (
            <Button
              key={c}
              class={`ov-facing__btn ov-facing__btn--${c}`}
              icon="arrowUp"
              iconOnly
              label={t(`facing.face.${corners[c]}`)}
              pressed={now}
              navDefault={now}
              onClick={() => onPick(corners[c])}
            >
              {/* The current facing is marked in words too, not by the gold alone. */}
              {now && (
                <small class="ov-facing__now" aria-hidden="true">
                  {t('facing.now')}
                </small>
              )}
            </Button>
          );
        })}
        <span class="ov-facing__unit" aria-hidden="true">
          <SideMark side="player" />
        </span>
      </div>
      <Button
        class="ov-facing__back"
        variant="ghost"
        size="sm"
        icon="back"
        label={t('common.back')}
        keyHint="back"
        navBack
        block
        onClick={onCancel}
      />
    </section>
  );
}
