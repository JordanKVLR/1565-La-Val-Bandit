import type { ControlContext, PadInput } from '../platform/input/controls';
import { keyForPad } from '../platform/input/controls';
import { setInputDevice } from '../platform/input/device';
import {
  controllerNotice,
  noteControllerConnection,
  noteControllerEvent,
} from '../platform/input/disconnect';
import { installGamepad } from '../platform/input/gamepad';
import type { NavDir } from './spatial';
import { pickInDirection } from './spatial';

/**
 * Keyboard and gamepad navigation for every screen.
 *
 * - Gamepad inputs become the keys the screens already handle (see platform/input/controls),
 *   dispatched as `keydown` on the focused control. Ⓐ on a focused control presses it.
 * - Screens handle their own keys on `document` (battle, story) or on elements (armoury
 *   grids) and call `preventDefault()` when they used one. Whatever is left reaches the
 *   fallbacks here, on `window`: arrows move focus spatially inside the top dialog (or the
 *   screen), Esc presses the dialog's `[data-nav-back]` button, [ ] switch tabs, and Enter with
 *   nothing focused focuses the dialog's `[data-nav-default]` control.
 */

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** The control our own navigation focused last (programmatic focus is not always :focus-visible). */
let navFocused: WeakRef<Element> | null = null;

function visible(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  return getComputedStyle(el).visibility !== 'hidden';
}

/** The topmost open dialog, else the current screen. */
export function focusScope(): HTMLElement {
  const dialogs = [
    ...document.querySelectorAll<HTMLElement>('[role="dialog"], [role="alertdialog"]'),
  ].filter(visible);
  return dialogs.at(-1) ?? document.querySelector<HTMLElement>('main') ?? document.body;
}

function candidates(scope: HTMLElement): HTMLElement[] {
  return [...scope.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    // Roving tab stops (tabindex -1) are reached with the arrows inside their own widget.
    (el) => el.tabIndex >= 0 && !(el as HTMLButtonElement).disabled && visible(el),
  );
}

function focusEl(el: HTMLElement): void {
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  navFocused = new WeakRef(el);
}

/** Is `el` focused by the keyboard or pad (rather than left focused by a tap or click)? */
function keyboardFocused(el: Element): boolean {
  if (navFocused?.deref() === el) return true;
  try {
    return el.matches(':focus-visible');
  } catch {
    return false;
  }
}

/** The control to start from in a scope: its marked default, else the first one. */
function defaultIn(scope: HTMLElement): HTMLElement | undefined {
  const list = candidates(scope);
  return list.find((el) => el.hasAttribute('data-nav-default')) ?? list[0];
}

function scrollableIn(start: Element | null, scope: HTMLElement): HTMLElement | undefined {
  for (let el = start as HTMLElement | null; el && scope.contains(el); el = el.parentElement) {
    if (el.scrollHeight > el.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(el).overflowY))
      return el;
  }
  return [scope, ...scope.querySelectorAll<HTMLElement>('*')].find(
    (el) =>
      el.scrollHeight > el.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(el).overflowY),
  );
}

function scrollScope(dir: -1 | 1, from: Element | null): boolean {
  const scope = focusScope();
  const box = scrollableIn(from, scope);
  if (!box) return false;
  const before = box.scrollTop;
  box.scrollBy({ top: dir * box.clientHeight * 0.6 });
  return box.scrollTop !== before || box.scrollHeight > box.clientHeight;
}

/** Moves focus to the next control in `dir`; scrolls the dialog when there is none. */
export function moveFocus(dir: NavDir): boolean {
  const scope = focusScope();
  const current = document.activeElement as HTMLElement | null;
  if (!current || current === document.body || !scope.contains(current)) {
    const first = defaultIn(scope);
    if (first) focusEl(first);
    return !!first;
  }
  // A focused text panel (e.g. an open note) scrolls first, then lets focus move on.
  if ((dir === 'up' || dir === 'down') && current.scrollHeight > current.clientHeight + 4) {
    const atEdge =
      dir === 'up'
        ? current.scrollTop <= 0
        : current.scrollTop + current.clientHeight >= current.scrollHeight - 2;
    if (!atEdge) {
      current.scrollBy({ top: (dir === 'up' ? -1 : 1) * current.clientHeight * 0.6 });
      return true;
    }
  }
  const list = candidates(scope).filter((el) => el !== current);
  const i = pickInDirection(
    current.getBoundingClientRect(),
    list.map((el) => el.getBoundingClientRect()),
    dir,
  );
  if (i >= 0) {
    focusEl(list[i]!);
    return true;
  }
  if (dir === 'up' || dir === 'down') return scrollScope(dir === 'up' ? -1 : 1, current);
  return false;
}

const ARROWS: Record<string, NavDir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

function isTextField(el: Element | null): boolean {
  return (
    !!el &&
    (el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement ||
      (el instanceof HTMLInputElement &&
        !['range', 'checkbox', 'radio', 'button'].includes(el.type)))
  );
}

/** Left/right on a slider steps it (the browser does this itself for real key presses). */
function stepRange(el: HTMLInputElement, dir: NavDir): void {
  if (dir === 'right') el.stepUp();
  else el.stepDown();
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function onFallbackKey(e: KeyboardEvent): void {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
  const target = e.target as Element | null;
  if (isTextField(target)) return;
  const dir = ARROWS[e.key];
  if (dir) {
    if (
      target instanceof HTMLInputElement &&
      target.type === 'range' &&
      (dir === 'left' || dir === 'right')
    ) {
      if (!e.isTrusted) stepRange(target, dir);
      return;
    }
    if (moveFocus(dir)) e.preventDefault();
    return;
  }
  const scope = focusScope();
  switch (e.key) {
    case 'Escape':
    case 'ContextMenu': {
      const back = scope.matches('[role="dialog"], [role="alertdialog"]')
        ? candidates(scope)
            .reverse()
            .find((el) => el.hasAttribute('data-nav-back'))
        : undefined;
      if (back) {
        e.preventDefault();
        back.click();
      }
      return;
    }
    case 'Enter':
    case ' ': {
      const active = document.activeElement;
      if (active && active !== document.body && scope.contains(active)) return;
      const first = defaultIn(scope);
      if (first) {
        e.preventDefault();
        focusEl(first);
      }
      return;
    }
    case '[':
    case ']': {
      const tabs = [...scope.querySelectorAll<HTMLElement>('[role="tab"]')].filter(visible);
      if (tabs.length < 2) return;
      const i = Math.max(
        0,
        tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'),
      );
      const next = tabs[(i + (e.key === ']' ? 1 : tabs.length - 1)) % tabs.length]!;
      e.preventDefault();
      next.click();
      focusEl(next);
      return;
    }
    case 'PageUp':
    case 'PageDown':
      // Real Page keys scroll natively; the pad's right stick sends synthetic ones.
      if (!e.isTrusted && scrollScope(e.key === 'PageUp' ? -1 : 1, document.activeElement)) {
        e.preventDefault();
      }
      return;
  }
}

/** Is `el` something Ⓐ should press? */
function pressable(el: Element): el is HTMLElement {
  return (
    el instanceof HTMLButtonElement ||
    el instanceof HTMLAnchorElement ||
    (el instanceof HTMLInputElement &&
      ['checkbox', 'radio', 'button', 'submit'].includes(el.type)) ||
    (el instanceof HTMLElement &&
      /^(button|tab|option|menuitem|checkbox|switch)$/.test(el.getAttribute('role') ?? ''))
  );
}

/** Sends a pad input to the page as the key it stands for in the current context. */
export function dispatchPadInput(input: PadInput, context: ControlContext): void {
  setInputDevice('gamepad');
  const key = keyForPad(context, input);
  if (!key) return;
  let active = document.activeElement;
  if (active && active !== document.body && !keyboardFocused(active)) {
    // Focus left behind by a tap or click: the pad starts fresh rather than pressing it.
    (active as HTMLElement).blur?.();
    active = document.body;
  }
  if (key === 'Enter' && active && active !== document.body && pressable(active)) {
    active.click();
    return;
  }
  (active ?? document.body).dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
  );
}

/** Which control table applies, from what is on screen. */
export function currentContext(): ControlContext {
  if (focusScope().closest('.modal')) return 'menu';
  if (document.querySelector('.armoury')) return 'armoury';
  if (document.querySelector('.battle-screen')) return 'battle';
  return 'menu';
}

/**
 * Installs keyboard fallbacks, input-device tracking and the gamepad adapter. `onPad` runs on
 * every pad input (e.g. to unlock audio, which browsers allow only after user input).
 */
export function installInput(onPad?: () => void): () => void {
  const onKeyDevice = (e: KeyboardEvent) => {
    if (e.isTrusted) setInputDevice('keyboard');
    // While the controller disconnect notice is up, any key closes it and goes no further.
    if (controllerNotice.get().open && noteControllerEvent({ type: 'otherInput' })) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };
  const onPointer = () => setInputDevice('pointer');
  window.addEventListener('keydown', onKeyDevice, true);
  window.addEventListener('pointerdown', onPointer, true);
  window.addEventListener('keydown', onFallbackKey);
  const stopPad = installGamepad(
    (input, padIndex) => {
      onPad?.();
      // A press that closes the controller disconnect notice is used up by it.
      if (noteControllerEvent({ type: 'padInput', index: padIndex })) return;
      dispatchPadInput(input, currentContext());
    },
    (e) => noteControllerConnection(e.type, e.index),
  );
  return () => {
    window.removeEventListener('keydown', onKeyDevice, true);
    window.removeEventListener('pointerdown', onPointer, true);
    window.removeEventListener('keydown', onFallbackKey);
    stopPad();
  };
}
