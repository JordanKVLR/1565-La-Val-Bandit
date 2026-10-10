import type { RefObject } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';
import type { AnchorOptions, Insets, Point } from './logic';
import { placeBeside } from './logic';

export interface AnchorSource {
  /** The point to sit beside, in the anchor layer's CSS pixels; null leaves the bar where it is. */
  point: () => Point | null;
  /** Calls `onChange` whenever the point may have moved (camera pan, zoom, resize); unsubscribes. */
  subscribe: (onChange: () => void) => () => void;
  /** Points the bar should not cover, in the same pixels (e.g. the other units). */
  avoid?: () => readonly Point[];
}

/**
 * Keeps `ref` (absolutely placed inside a layer that covers the map) beside a moving point,
 * e.g. the action bar beside the selected unit. Positions are written straight to the
 * element's style on each change, without re-rendering. While `enabled` is false (phones,
 * where the bar docks to the bottom edge in CSS) the inline position is cleared.
 *
 * `source` should be memoised (a new object resubscribes). `insets(layer)` gives the margins
 * to keep clear inside the layer (HUD, title-safe area).
 */
export function useAnchor(
  ref: RefObject<HTMLElement>,
  source: AnchorSource | null,
  enabled: boolean,
  insets: (layer: HTMLElement) => Insets,
  opts?: AnchorOptions,
): void {
  // The latest margins and options, read on every update without resubscribing.
  const config = useRef({ insets, opts });
  config.current = { insets, opts };
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!enabled || !source) {
      el.style.transform = '';
      el.removeAttribute('data-anchored');
      return;
    }
    const layer = el.offsetParent as HTMLElement | null;
    let last = '';
    const update = () => {
      const point = source.point();
      if (!point || !layer) return;
      const at = placeBeside(
        point,
        { width: el.offsetWidth, height: el.offsetHeight },
        { width: layer.clientWidth, height: layer.clientHeight },
        config.current.insets(layer),
        { ...config.current.opts, avoid: source.avoid?.() },
      );
      const transform = `translate(${at.x}px, ${at.y}px)`;
      if (transform === last) return;
      last = transform;
      el.style.transform = transform;
      el.dataset.anchored = at.side;
    };
    update();
    const stop = source.subscribe(update);
    const resize = new ResizeObserver(update);
    resize.observe(el);
    return () => {
      stop();
      resize.disconnect();
    };
  }, [ref, source, enabled]);
}
