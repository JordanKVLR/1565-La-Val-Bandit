import { useEffect, useRef, useState } from 'preact/hooks';
import { music } from '../platform/audio';
import { settings } from '../state/settings';
import { introFinished, introScale, introTime, introVolume } from './intro';

type IntroWindow = Window & { ready?: Promise<void>; renderFrame?: (t: number) => Promise<void> };

/** Give up and go straight to the game if the cinematic page has not loaded by then. */
const LOAD_TIMEOUT_MS = 15000;

/**
 * The opening cinematic (docs/adr/0006-opening-cinematic.md): the canvas page in public/intro/
 * draws each frame, this screen drives its clock from Under the Red Sun and offers Skip.
 */
export function IntroScreen({ onDone }: { onDone: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const done = useRef(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const blockedRef = useRef(false);
  const unblock = useRef(() => {});
  const finish = () => {
    if (done.current) return;
    done.current = true;
    audio.current?.pause();
    onDone();
  };

  const scale = introScale(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
  const src = `${import.meta.env.BASE_URL}intro/index.html?scale=${scale}`;

  useEffect(() => {
    music('none');
    const el = new Audio(`${import.meta.env.BASE_URL}music/under-the-red-sun.mp3`);
    el.preload = 'auto';
    el.volume = introVolume(settings.get().musicVolume);
    audio.current = el;
    let audioOk = true;
    el.addEventListener('error', () => (audioOk = false));
    el.addEventListener('ended', finish);
    const unsubscribe = settings.subscribe(() => {
      el.volume = introVolume(settings.get().musicVolume);
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    const onHidden = () => {
      if (document.hidden) el.pause();
      else if (!done.current && audioOk && !blockedRef.current) void el.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onHidden);

    let raf = 0;
    let busy = false;
    let wall0: number | null = null;
    let started = false;
    const giveUp = window.setTimeout(() => {
      if (!(frame.current?.contentWindow as IntroWindow | null)?.renderFrame) finish();
    }, LOAD_TIMEOUT_MS);

    const start = async () => {
      if (started) return;
      started = true;
      const win = frame.current?.contentWindow as IntroWindow | null;
      if (!win?.renderFrame) return finish();
      await win.ready;
      window.clearTimeout(giveUp);
      setLoaded(true);
      try {
        await el.play();
      } catch {
        // No user gesture yet (opened from a link or a reload): wait for a tap.
        blockedRef.current = true;
        setBlocked(true);
      }
      const tick = async () => {
        raf = requestAnimationFrame(() => void tick());
        if (busy || done.current) return;
        if (blockedRef.current) return;
        // Without the song (failed to load), carry on from where it stopped on a wall clock.
        if (!audioOk && wall0 === null) wall0 = performance.now() - el.currentTime * 1000;
        const wall = wall0 === null ? 0 : (performance.now() - wall0) / 1000;
        const t = introTime(audioOk ? el.currentTime : null, wall);
        if (introFinished(t)) return finish();
        busy = true;
        try {
          await win.renderFrame!(t);
        } finally {
          busy = false;
        }
      };
      void tick();
    };
    const iframe = frame.current!;
    const onLoad = () => void start();
    iframe.addEventListener('load', onLoad);
    // The page may already have loaded from cache before this effect ran.
    if (iframe.contentDocument?.readyState === 'complete' && iframe.contentWindow) {
      if ((iframe.contentWindow as IntroWindow).renderFrame) void start();
    }
    unblock.current = () => {
      blockedRef.current = false;
      setBlocked(false);
      void el.play().catch(() => (audioOk = false));
    };

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(giveUp);
      iframe.removeEventListener('load', onLoad);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onHidden);
      unsubscribe();
      el.pause();
      el.removeAttribute('src');
    };
  }, []);

  return (
    <div class="intro-screen" role="region" aria-label="Opening cinematic">
      <iframe ref={frame} src={src} title="Opening cinematic" tabIndex={-1} />
      {!loaded && <p class="intro-loading">Loading…</p>}
      {loaded && blocked && (
        <button type="button" class="intro-begin" onClick={() => unblock.current()}>
          Tap to begin
        </button>
      )}
      <button type="button" class="btn ghost intro-skip" onClick={finish}>
        Skip
      </button>
    </div>
  );
}
