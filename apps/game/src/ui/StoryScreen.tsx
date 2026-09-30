import type { Library } from '@m1565/content';
import { loadMap, mapSources } from '@m1565/content';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { GameSession, Screen } from '../campaign/GameSession';
import { portraitUrl } from '../render/art';
import { BattleView } from '../render/BattleView';
import type { StageState } from '../campaign/types';
import { useStore } from '../state/store';

type StoryScreenState = Extract<Screen, { kind: 'story' }>;

interface Props {
  session: GameSession;
  lib: Library;
  onMenu: () => void;
}

/** Diorama: the stage map with characters standing on it. Remounts when the map changes. */
function Stage({ stage, lib }: { stage: StageState; lib: Library }) {
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
  useEffect(() => setShown(0), [text]);
  useEffect(() => {
    if (shown >= text.length) return;
    const t = setTimeout(() => setShown((n) => Math.min(text.length, n + 2)), 2000 / cps);
    return () => clearTimeout(t);
  }, [shown, text, cps]);
  return [text.slice(0, shown), shown >= text.length, () => setShown(text.length)];
}

export function StoryScreen({ session, lib, onMenu }: Props) {
  const view = useStore(session.view);
  const screen = view.screen as StoryScreenState;
  const line = screen.line;
  const [text, done, finish] = useTypewriter(line?.text ?? '');
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

  return (
    <main class="story-screen" onClick={onTap} data-testid="story-screen">
      <Stage stage={view.stage} lib={lib} />
      <div class="story-controls" onClick={(e) => e.stopPropagation()}>
        <button type="button" class="btn icon" aria-label="Menu" onClick={onMenu}>
          ☰
        </button>
      </div>

      {screen.card && (
        <div class="chapter-card" data-testid="chapter-card">
          <h2>{screen.card.title}</h2>
          <p>{screen.card.subtitle}</p>
          <span class="tap-hint">Tap to continue</span>
        </div>
      )}

      {line && !screen.card && (
        <section class={`dialogue ${speaker ? '' : 'narration'}`} aria-live="polite">
          {speaker && (
            <div class="dlg-portrait" style={{ background: speaker.color }} aria-hidden="true">
              {portraitUrl(speaker.id) ? (
                <img src={portraitUrl(speaker.id)} alt="" />
              ) : (
                speaker.name.replace(/^(Fra|La) /, '').charAt(0)
              )}
            </div>
          )}
          <div class="dlg-body">
            {speaker && (
              <div class="dlg-name">
                {speaker.name}
                {speaker.title && <small>{speaker.title}</small>}
              </div>
            )}
            <p class="dlg-text" data-testid="dialogue-text">
              {text}
            </p>
          </div>
          {done && !screen.choices && (
            <span class="dlg-next" aria-hidden="true">
              ▼
            </span>
          )}
        </section>
      )}

      {screen.choices && (
        <div class="choices" role="group" aria-label="Choices" onClick={(e) => e.stopPropagation()}>
          {screen.choices.map((c, i) => (
            <button type="button" class="btn choice" key={i} onClick={() => session.choose(i)}>
              {c}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
