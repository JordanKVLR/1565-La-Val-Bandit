import { useEffect, useState } from 'preact/hooks';

/**
 * Phones in landscape: the breakpoint every screen uses for its compact layout (a 360–430 px
 * tall screen). CSS repeats it as `@media (max-height: 520px)`. In TV mode media queries see
 * the TV's real size, so this never matches there (ADR 0010).
 */
export const PHONE_QUERY = '(max-height: 520px)';

/** Whether a media query matches, kept up to date. False where matchMedia is missing. */
export function useMediaQuery(query: string): boolean {
  const get = () => typeof matchMedia === 'function' && matchMedia(query).matches;
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const list = matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);
  return matches;
}
