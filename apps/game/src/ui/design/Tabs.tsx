import type { ComponentChildren } from 'preact';
import { cx } from './logic';

export interface TabItem<Id extends string> {
  id: Id;
  /** Visible text, from the string table. */
  label: string;
  testId?: string;
  disabled?: boolean;
  /** A count shown after the label (e.g. points to spend). */
  count?: number | undefined;
}

/**
 * A row of tabs: text with a gold underline on the current one (and bolder text, so the state
 * is not colour alone). Every tab is a tab stop, so the D-pad's spatial focus reaches them, and
 * [ ] / LB RB switch tabs anywhere in the dialog (ui/input.ts). Render the content in a
 * `TabPanel` with the same `idPrefix`.
 */
export function Tabs<Id extends string>({
  label,
  tabs,
  value,
  onChange,
  idPrefix,
  class: className,
}: {
  /** Name of the tab list for assistive tech. */
  label: string;
  tabs: ReadonlyArray<TabItem<Id>>;
  value: Id;
  onChange: (id: Id) => void;
  /** Ties tabs to their panels: ids are `${idPrefix}-tab-${id}` and `${idPrefix}-panel-${id}`. */
  idPrefix: string;
  class?: string;
}) {
  return (
    <div class={cx('ds-tabs', className)} role="tablist" aria-label={label}>
      {tabs.map((tab) => {
        const on = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            class={cx('ds-tab', on && 'is-selected')}
            id={`${idPrefix}-tab-${tab.id}`}
            aria-selected={on}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            disabled={tab.disabled}
            data-testid={tab.testId}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
            {tab.count ? (
              <span class="ds-tab__count" aria-hidden="true">
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  id,
  idPrefix,
  class: className,
  testId,
  children,
}: {
  id: string;
  idPrefix: string;
  class?: string;
  testId?: string;
  children: ComponentChildren;
}) {
  return (
    <div
      class={cx('ds-tabpanel', className)}
      role="tabpanel"
      id={`${idPrefix}-panel-${id}`}
      aria-labelledby={`${idPrefix}-tab-${id}`}
      data-testid={testId}
    >
      {children}
    </div>
  );
}
