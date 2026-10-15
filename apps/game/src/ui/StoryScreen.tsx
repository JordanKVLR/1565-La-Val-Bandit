import type { Library } from '@m1565/content';
import { loadMap, mapSources } from '@m1565/content';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { GameSession, Screen } from '../campaign/GameSession';
import { portraitUrl } from '../render/art';
import { BattleView } from '../render/BattleView';
import type { StageState } from '../campaign/types';
import { useStore } from '../state/store';
import { t } from '../i18n';
import { Button, cx, Divider, Icon } from './design';
import { usePrompt } from './KeyHint';

type StoryScreenState = Extract<Screen, { kind: 'story' }>;

interface Props {
  session: GameSession;
  lib: Library;
  onMenu: () => void;
}

/** Diorama: the stage map with characters standing on it. Remounts when the map changes. */
function Stage({ stage, lib, still }: { stage: StageState; lib: Library; still: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<BattleView | null>(null);
  const map = useMemo(() => {
    const source = stage.map ? mapSources[stage.map] : undefined;
    return source ? loadMap(source, lib.terrains) : null;
  }, [stage.map, lib]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !map) return;
    const view = new BattleView(canvas, map, () => {});
    viewRef.current = view;
    return () => view.dispose();
  }, [map]);

  useEffect(() => {
    viewRef.current?.setIdlePaused(still);
  }, [still, map]);

  useEffect(() => {
    viewRef.current?.syncUnits(
      Object.entries(stage.actors).map(([id, a]) => {
        const cast = lib.cast.get(id);
        return {
          id,
          label: (cast?.name ?? id).replace(/^Fra /, '').charAt(0),
          color: cast?.color ?? '#777777',
          arrowColor: '#f4ead2',
          hp: 1,
          maxHp: 1,
          active: false,
          hideHp: true,
          at: { x: a.x, y: a.y },
          facing: a.facing,
        };
      }),
    );
  }, [stage.actors, map, lib]);

  if (!map) return <div class="stage-blank" />;
  return <canvas ref={canvasRef} class="battle-canvas stage-canvas" aria-hidden="true" />;
}

/** Reveals text over time; a tap first completes the line, the next tap advances. */
function useTypewriter(text: string, cps = 60): [string, boolean, () => void] {
  const [shown, setShown] = useState(0);
  // With reduced motion the whole line appears at once.
  useEffect(() => setShown(prefersReducedMotion() ? text.length : 0), [text]);
  useEffect(() => {
    if (shown >= text.length) return;
    const t = setTimeout(() => setShown((n) => Math.min(text.length, n + 2)), 2000 / cps);
    return () => clearTimeout(t);
  }, [shown, text, cps]);
  return [text.slice(0, shown), shown >= text.length, () => setShown(text.length)];
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * The story: the diorama fills the screen, a slim glass dialogue box sits at the bottom with the
 * speaker's portrait, name and title, and choices rise above it. Chapter cards dim the scene
 * behind a centred title.
 */
export function StoryScreen({ session, lib, onMenu }: Props) {
  const view = useStore(session.view);
  const screen = view.screen as StoryScreenState;
  const line = screen.line;
  const full = line?.text ?? '';
  const [text, done, finish] = useTypewriter(full);
  const speaker = line?.speaker
    ? [...lib.cast.values()].find((c) => c.speaker === line.speaker)
    : undefined;

  const onTap = () => {
    if (screen.choices) return;
    if (screen.card) {
      session.advance();
      return;
    }
    if (!done) finish();
    else session.advance();
  };
  // The key handler below is installed once and reads the latest of these on every key, so a key
  // pressed right after the screen changes (before any effect re-runs) is judged by what is
  // on screen now, not by the previous render.
  const tapRef = useRef(onTap);
  tapRef.current = onTap;
  const choicesOpen = useRef(false);
  choicesOpen.current = !!screen.choices;
  const menuRef = useRef(onMenu);
  menuRef.current = onMenu;
  const prompt = usePrompt();

  // Keyboard and gamepad: Enter/Space (pad Ⓐ) continue, Esc or the pad's Menu button open the
  // menu. Choices are buttons, reached with the arrows (see ui/input.ts).
  // A layout effect, so the handler exists the moment the screen is visible.
  useLayoutEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector('[role="dialog"]')) return;
      const target = e.target as HTMLElement | null;
      if (e.key === 'Escape' || e.key === 'ContextMenu') {
        e.preventDefault();
        menuRef.current();
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (target?.closest('button')?.matches(':focus-visible')) return;
        if (choicesOpen.current) return;
        e.preventDefault();
        tapRef.current();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const portrait = speaker ? portraitUrl(speaker.id) : undefined;

  return (
    <main class="fe-story" onClick={onTap} data-testid="story-screen">
      <Stage stage={view.stage} lib={lib} still={!done} />
      <div class="fe-story__shade" aria-hidden="true" />
      <div class="fe-story__menu" onClick={(e) => e.stopPropagation()}>
        <Button iconOnly icon="menu" label={t('common.menu')} onClick={onMenu} />
        {session.inCamp && (
          <Button
            variant="ghost"
            label={t('camp.skip')}
            testId="skip-camp"
            onClick={() => session.skipCamp()}
          />
        )}
      </div>

      {screen.card && (
        <div class="chapter-card fe-card" data-testid="chapter-card">
          <div class="fe-card__inner">
            <Divider glyph="cross" class="fe-card__rule" />
            <h2 class="fe-card__title">{screen.card.title}</h2>
            {screen.card.subtitle && <p class="fe-card__subtitle">{screen.card.subtitle}</p>}
            <Divider class="fe-card__rule fe-card__rule--end" />
          </div>
          <span class="fe-card__hint">{prompt('continue')}</span>
        </div>
      )}

      {!screen.card && (line || screen.choices) && (
        <div class="fe-story__stack">
          {screen.choices && (
            <div
              class="fe-choices"
              role="group"
              aria-label={t('story.choices')}
              onClick={(e) => e.stopPropagation()}
            >
              {screen.choices.map((c, i) => (
                <button
                  type="button"
                  class="fe-choice"
                  key={i}
                  data-nav-default={i === 0 || undefined}
                  onClick={() => session.choose(i)}
                >
                  <Icon name="diamond" class="fe-choice__mark" />
                  <span class="fe-choice__text">{c}</span>
                </button>
              ))}
            </div>
          )}
          {line && (
            <section
              class={cx('fe-dialogue', !speaker && 'is-narration', portrait && 'has-portrait')}
              aria-live="polite"
            >
              {speaker && (
                <div
                  class="fe-dialogue__portrait"
                  style={{ backgroundColor: speaker.color }}
                  aria-hidden="true"
                >
                  {portrait ? (
                    <img src={portrait} alt="" />
                  ) : (
                    speaker.name.replace(/^(Fra|La) /, '').charAt(0)
                  )}
                </div>
              )}
              <div class="fe-dialogue__body">
                {speaker && (
                  <header class="fe-dialogue__speaker">
                    <span class="fe-dialogue__name">{speaker.name}</span>
                    {speaker.title && <span class="fe-dialogue__role">{speaker.title}</span>}
                  </header>
                )}
                {/* The rest of the line is laid out unseen, so the box never grows as it types. */}
                <p class="fe-dialogue__text">
                  <span data-testid="dialogue-text">{text}</span>
                  <span class="fe-dialogue__rest" aria-hidden="true">
                    {full.slice(text.length)}
                  </span>
                </p>
              </div>
              {done && !screen.choices && (
                <span class="dlg-next fe-dialogue__next" aria-hidden="true">
                  <span class="fe-dialogue__prompt">{prompt('continue')}</span>
                  <Icon name="chevronRight" class="fe-dialogue__chev" />
                </span>
              )}
            </section>
          )}
        </div>
      )}
    </main>
  );
}
