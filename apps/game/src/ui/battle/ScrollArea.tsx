import type { ComponentChildren, RefObject } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';
import { cx, Icon } from '../design';

/**
 * Marks a scrolling box with `data-more="above below"` (whichever applies, or "none") and keeps
 * it current, so CSS can fade the clipped edge and show a chevron: lists that scroll say so
 * (overlays.css). `marker` is the element that carries the attribute (default: the box).
 */
export function useScrollCue(
  box: RefObject<HTMLElement>,
  marker?: RefObject<HTMLElement>,
): void {
  // Re-run after every render: expanding a row changes the content height, not the box's.
  useLayoutEffect(() => {
    const el = box.current;
    const mark = marker?.current ?? el;
    if (!el || !mark) return;
    const update = () => {
      const above = el.scrollTop > 2;
      const below = el.scrollTop + el.clientHeight < el.scrollHeight - 2;
      const value = [above && 'above', below && 'below'].filter(Boolean).join(' ') || 'none';
      if (mark.dataset.more !== value) mark.dataset.more = value;
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null;
    resize?.observe(el);
    for (const child of el.children) resize?.observe(child);
    return () => {
      el.removeEventListener('scroll', update);
      resize?.disconnect();
    };
  });
}

/** A scrolling region whose clipped edges fade, with a chevron while more lies below. */
export function ScrollArea({
  class: className,
  children,
  testId,
}: {
  class?: string;
  children: ComponentChildren;
  testId?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  useScrollCue(box, wrap);
  return (
    <div ref={wrap} class={cx('ov-scrollwrap', className)} data-testid={testId}>
      <div ref={box} class="ov-scroll">
        {children}
      </div>
      <Icon name="chevronRight" class="ov-cue" />
    </div>
  );
}

/** The scroll cue for a Sheet's body (the Sheet owns the scrolling box). */
export function useSheetScrollCue(inner: RefObject<HTMLElement>): void {
  const body = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    body.current = inner.current?.closest<HTMLElement>('.ds-sheet__body') ?? null;
  });
  useScrollCue(body);
}
