import { desktopBridge } from './desktop';
import { onFlushStorage } from './storage';

/**
 * App suspend/resume, from whichever platform signal arrives first. Consoles, phones and the
 * Steam Deck can suspend the game at any moment and may kill it afterwards without warning, so
 * on suspend the game saves (`onSuspend`) and stops sound and gameplay; on resume it carries on
 * exactly where it was.
 *
 * Signals: the page going hidden (`visibilitychange`, every browser and WebView), `pagehide`
 * and `freeze` (the page may be discarded), Capacitor's App plugin `appStateChange` and the
 * Cordova-style `pause`/`resume` document events when present, and the Electron shell's
 * system sleep/lock/minimise events (`window.desktop.onLifecycle`). A console SDK's
 * suspend/constrain notifications would call `suspend`/`resume` here too.
 */
export interface LifecycleHooks {
  /** Persist progress now; may be called more than once per suspension. */
  onSuspend(): void;
  /** Called once when the app comes back after `onSuspend`. */
  onResume(): void;
}

/** The parts of `window`/`document` this module listens on (EventTargets in tests). */
export interface LifecycleEnv {
  readonly win: EventTarget;
  readonly doc: EventTarget & { readonly hidden?: boolean };
  /** Capacitor's App plugin, if the native app bundles it. */
  readonly capacitorApp?: {
    addListener(
      event: 'appStateChange',
      cb: (s: { isActive: boolean }) => void,
    ): Promise<{ remove(): void }> | { remove(): void };
  };
  readonly desktop?: ReturnType<typeof desktopBridge>;
}

type CapacitorGlobal = {
  Capacitor?: { Plugins?: { App?: LifecycleEnv['capacitorApp'] } };
};

function browserEnv(): LifecycleEnv | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  if (typeof window.addEventListener !== 'function') return null;
  const capacitorApp = (window as unknown as CapacitorGlobal).Capacitor?.Plugins?.App;
  const desktop = desktopBridge();
  return {
    win: window,
    doc: document,
    ...(capacitorApp ? { capacitorApp } : {}),
    ...(desktop ? { desktop } : {}),
  };
}

/**
 * Starts listening; returns a function that stops. Also registers the Electron shell's storage
 * commit as a flush hook for `flushStorage`.
 */
export function installLifecycle(
  hooks: LifecycleHooks,
  env: LifecycleEnv | null = browserEnv(),
): () => void {
  if (!env) return () => {};
  let suspended = false;
  const suspend = () => {
    // Save on every signal (hidden, then pagehide, then freeze): each may be the last one.
    hooks.onSuspend();
    suspended = true;
  };
  const resume = () => {
    if (!suspended || env.doc.hidden) return;
    suspended = false;
    hooks.onResume();
  };
  const onVisibility = () => (env.doc.hidden ? suspend() : resume());
  const listeners: [EventTarget, string, () => void][] = [
    [env.doc, 'visibilitychange', onVisibility],
    [env.win, 'pagehide', suspend],
    [env.win, 'pageshow', resume],
    [env.doc, 'freeze', suspend],
    // Page Lifecycle "resume" after a freeze, and Cordova/Capacitor's document resume.
    [env.doc, 'resume', resume],
    [env.doc, 'pause', suspend],
  ];
  for (const [target, type, fn] of listeners) target.addEventListener(type, fn);

  const cleanups: (() => void)[] = [];
  if (env.capacitorApp) {
    const handle = env.capacitorApp.addListener('appStateChange', (s) =>
      s.isActive ? resume() : suspend(),
    );
    cleanups.push(() => void Promise.resolve(handle).then((h) => h.remove()));
  }
  if (env.desktop?.onLifecycle) {
    cleanups.push(env.desktop.onLifecycle((s) => (s === 'suspend' ? suspend() : resume())));
  }
  const flush = env.desktop?.flushStorage;
  if (flush) cleanups.push(onFlushStorage(() => flush()));

  return () => {
    for (const [target, type, fn] of listeners) target.removeEventListener(type, fn);
    for (const c of cleanups) c();
  };
}
