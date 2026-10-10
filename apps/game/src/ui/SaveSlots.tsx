import type { ComponentChildren } from 'preact';
import { SaveBadges } from './difficulty';
import { cx, Icon } from './design';

/**
 * One save slot as a row: its name in capitals, what is in it underneath (chapter and time, or
 * "Empty"), and the save's NG+ and difficulty badges on the right. Used by Load, New Game+ and
 * the in-game menu's Save.
 */
export function SlotButton({
  name,
  detail,
  save,
  disabled = false,
  onClick,
  testId,
  children,
}: {
  name: string;
  detail: string;
  save: { readonly ngPlus?: unknown; readonly difficulty?: unknown } | null;
  disabled?: boolean;
  onClick: () => void;
  testId?: string;
  children?: ComponentChildren;
}) {
  return (
    <button
      type="button"
      class={cx('fe-slot', !save && 'is-empty')}
      disabled={disabled}
      data-testid={testId}
      onClick={onClick}
    >
      <span class="fe-slot__text">
        <span class="fe-slot__name">{name}</span>
        <small class="fe-slot__detail">{detail}</small>
      </span>
      <SaveBadges save={save} />
      {children}
      {!disabled && <Icon name="chevronRight" class="fe-slot__go" />}
    </button>
  );
}

/** A column of slot rows. */
export function SlotList({ children }: { children: ComponentChildren }) {
  return <div class="fe-slots">{children}</div>;
}
