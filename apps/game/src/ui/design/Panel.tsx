import type { ComponentChildren, JSX } from 'preact';
import type { IconName } from './Icon';
import { Icon } from './Icon';
import { cx } from './logic';

export type Elevation = 1 | 2 | 3;

export interface PanelProps {
  /** 1: chips, HUD readouts · 2: cards and panels (default) · 3: sheets and dialogs. */
  elevation?: Elevation;
  /** The element to render (landmarks: `section`, `aside`, `nav`). */
  as?: 'div' | 'section' | 'aside' | 'nav' | 'header' | 'footer';
  /** Heading text drawn in Cinzel above the content, with a gold hairline under it. */
  title?: string;
  /** Heading level for `title` (default h2). */
  titleLevel?: 2 | 3;
  /** A small glyph centred on the heading's hairline: period flavour, used sparingly. */
  ornament?: IconName;
  /** A gold hairline around the panel (default true); off for nested or very small surfaces. */
  outlined?: boolean;
  /** Tighter padding for HUD pieces. */
  compact?: boolean;
  class?: string;
  testId?: string;
  role?: 'group' | 'region' | 'status' | 'note' | 'presentation';
  'aria-label'?: string;
  'aria-labelledby'?: string;
  id?: string;
  style?: JSX.CSSProperties;
  children?: ComponentChildren;
}

/**
 * A glass surface: translucent, blurred, with a gold hairline and a soft shadow. The base of
 * every card, bar and sheet. No double borders, lace strips or inner frames.
 */
export function Panel({
  elevation = 2,
  as: Tag = 'div',
  title,
  titleLevel = 2,
  ornament,
  outlined = true,
  compact = false,
  class: className,
  testId,
  children,
  ...rest
}: PanelProps) {
  const H = titleLevel === 3 ? 'h3' : 'h2';
  return (
    <Tag
      class={cx(
        'ds-panel',
        `ds-elev-${elevation}`,
        outlined && 'ds-outlined',
        compact && 'ds-compact',
        className,
      )}
      data-testid={testId}
      {...rest}
    >
      {title && (
        <header class="ds-panel__head">
          <H class="ds-panel__title">{title}</H>
          <Divider glyph={ornament} />
        </header>
      )}
      {children}
    </Tag>
  );
}

/** A gold hairline, optionally with a small glyph in the middle (Maltese cross, crescent…). */
export function Divider({
  glyph,
  vertical = false,
  class: className,
}: {
  glyph?: IconName | undefined;
  vertical?: boolean;
  class?: string;
}) {
  return (
    <div
      class={cx('ds-divider', vertical && 'ds-divider--v', glyph && 'ds-divider--glyph', className)}
      role="separator"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
    >
      {glyph && <Icon name={glyph} class="ds-divider__glyph" />}
    </div>
  );
}
