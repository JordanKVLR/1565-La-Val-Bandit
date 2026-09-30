import { settings } from '../state/settings';
import { Store } from '../state/store';

/**
 * Full screen for phones. Browsers only allow entering it from a tap, so the game asks on the
 * next tap whenever the Full screen setting is on and the page isn't already full screen (the
 * first tap, or after the back gesture or an app switch dropped out). Leaving on purpose is done
 * by turning the setting off, which is hard to hit by accident.
 */

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Whether the browser offers "install as app" right now (Android Chrome and desktop). */
export const installOffer = new Store<InstallPromptEvent | null>(null);

function supported(): boolean {
  return typeof document !== 'undefined' && !!document.documentElement.requestFullscreen;
}

/** Already running as an installed app (no browser bars to hide). */
export function isStandalone(): boolean {
  try {
    return (
      matchMedia('(display-mode: standalone)').matches ||
      matchMedia('(display-mode: fullscreen)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
}

/** iPhone/iPad Safari can't go full screen from a web page; installing is the only way. */
export function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

async function lockLandscape(): Promise<void> {
  try {
    const o = screen.orientation as ScreenOrientation & {
      lock?: (o: 'landscape') => Promise<void>;
    };
    await o.lock?.('landscape');
  } catch {
    // Not supported (desktop, iOS) or not allowed; the rotate overlay still covers portrait.
  }
}

/** Call from a tap handler: enters full screen if the player wants it and it isn't on yet. */
export function enterFullscreenIfWanted(): void {
  if (!settings.get().fullscreen || !supported() || isStandalone()) return;
  if (document.fullscreenElement) return;
  document.documentElement
    .requestFullscreen({ navigationUI: 'hide' })
    .then(lockLandscape)
    .catch(() => {
      // Refused (e.g. inside an iframe); the game still works in the normal window.
    });
}

export function exitFullscreen(): void {
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
}

export function initFullscreen(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installOffer.set(e as InstallPromptEvent);
  });
  window.addEventListener('appinstalled', () => installOffer.set(null));
  // Turning the setting off leaves full screen straight away.
  settings.subscribe(() => {
    if (!settings.get().fullscreen) exitFullscreen();
  });
}

export async function installApp(): Promise<void> {
  const offer = installOffer.get();
  if (!offer) return;
  await offer.prompt();
  await offer.userChoice.catch(() => undefined);
  installOffer.set(null);
}
