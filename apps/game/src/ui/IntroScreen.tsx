import { useEffect, useRef, useState } from 'preact/hooks';
import { music } from '../platform/audio';
import { settings } from '../state/settings';
import { t } from '../i18n';
import { Button, Icon } from './design';
import { usePrompt } from './KeyHint';
import { INTRO_SOURCES, introVolume } from './intro';

/** Give up and go straight to the game if the video has not become playable by then. */
const LOAD_TIMEOUT_MS = 15000;

/**
 * The opening cinematic (docs/adr/0014-opening-cinematic-video.md): a 43.2 s video with the song
 * mixed in. It plays on every New Game, ends the screen when it ends, and offers Skip. A video that
 * cannot load or decode (the single-file preview has none) never holds the player back.
 */
export function IntroScreen({ onDone }: { onDone: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const done = useRef(false);
  const blockedRef = useRef(false);
  const unblock = useRef(() => {});
  const finish = () => {
    if (done.current) return;
    done.current = true;
    video.current?.pause();
    onDone();
  };

  const prompt = usePrompt();
  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    music('none');
    const el = video.current!;
    el.volume = introVolume(settings.get().musicVolume);
    const unsubscribe = settings.subscribe(() => {
      el.volume = introVolume(settings.get().musicVolume);
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    const onHidden = () => {
      if (document.hidden) el.pause();
      else if (!done.current && !blockedRef.current) void el.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onHidden);
    const giveUp = window.setTimeout(finish, LOAD_TIMEOUT_MS);

    // Start at once: iOS Safari only loads a video once play() has been asked for.
    const onPlaying = () => {
      window.clearTimeout(giveUp);
      setLoaded(true);
    };
    el.addEventListener('playing', onPlaying);
    el.addEventListener('ended', finish);
    // A decode failure partway through. (Load failures arrive on the last <source>, see below.)
    el.addEventListener('error', finish);
    el.play().catch((e: unknown) => {
      const name = (e as { name?: string } | null)?.name;
      if (name === 'NotAllowedError') {
        // No user gesture yet (opened from a link or a reload): wait for a tap.
        window.clearTimeout(giveUp);
        blockedRef.current = true;
        setLoaded(true);
        setBlocked(true);
      } else if (name === 'NotSupportedError') finish();
    });
    unblock.current = () => {
      blockedRef.current = false;
      setBlocked(false);
      void el.play().catch(finish);
    };

    return () => {
      window.clearTimeout(giveUp);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onHidden);
      unsubscribe();
      el.pause();
      el.removeAttribute('src');
      el.load();
    };
  }, []);

  return (
    <div class="intro-screen" role="region" aria-label={t('intro.title')}>
      <video
        ref={video}
        class="intro-video"
        aria-label={t('intro.title')}
        data-testid="intro-video"
        playsInline
        preload="auto"
        tabIndex={-1}
      >
        {INTRO_SOURCES.map((s, i) => (
          <source
            key={s.file}
            src={`${base}${s.file}`}
            type={s.type}
            // The browser tries the sources in order; only the last one failing is the end of the
            // road (a <source> error does not bubble to the <video>).
            onError={i === INTRO_SOURCES.length - 1 ? finish : undefined}
          />
        ))}
      </video>
      {!loaded && (
        <p class="intro-loading" role="status">
          <Icon name="cross" class="intro-loading__mark" />
          {t('common.loading')}
        </p>
      )}
      {loaded && blocked && (
        <button type="button" class="intro-begin" onClick={() => unblock.current()}>
          <span class="intro-begin__text">{prompt('begin')}</span>
        </button>
      )}
      <Button
        class="intro-skip"
        variant="ghost"
        label={t('common.skip')}
        icon="chevronRight"
        keyHint="back"
        keyContext="menu"
        onClick={finish}
      />
    </div>
  );
}
