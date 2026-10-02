import type { BattleSetup, BattleState } from '@m1565/core';
import { isBattleId, loadBattle, loadLibrary } from '@m1565/content';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { GameSession } from '../campaign/GameSession';
import { music, sfx, unlockAudio } from '../platform/audio';
import { enterFullscreenIfWanted, initFullscreen } from '../platform/fullscreen';
import type { SlotId } from '../platform/storage';
import { settings } from '../state/settings';
import { useStore } from '../state/store';
import { BattleScreen } from './BattleScreen';
import { EndScreen } from './EndScreen';
import { GameMenu } from './GameMenu';
import { PrepScreen } from './PrepScreen';
import { ResultsScreen } from './ResultsScreen';
import { RotateOverlay } from './RotateOverlay';
import { StoryScreen } from './StoryScreen';
import { TitleScreen } from './TitleScreen';

/** Battles against a named commander get the heavier theme. */
function battleMood(setup: BattleSetup): 'battle' | 'boss' {
  return setup.victory.some((v) => v.type === 'defeatLeader') ? 'boss' : 'battle';
}

/** `?battle=<id>` jumps straight into a battle with default pilots (for testing and design). */
function debugBattleId(): string | null {
  try {
    const id = new URLSearchParams(location.search).get('battle');
    return id && isBattleId(id) ? id : null;
  } catch {
    return null;
  }
}

function SessionView({ session, onTitle }: { session: GameSession; onTitle: () => void }) {
  const lib = useMemo(() => loadLibrary(), []);
  const view = useStore(session.view);
  const [menu, setMenu] = useState(false);
  const screen = view.screen;

  useEffect(() => {
    if (screen.kind === 'title') onTitle();
    music(
      screen.kind === 'battle'
        ? battleMood(screen.setup)
        : // Gentle Piano carries on through story, preparation, results and the ending.
          'story',
    );
  }, [screen, onTitle]);

  return (
    <>
      {screen.kind === 'story' && (
        <StoryScreen session={session} lib={lib} onMenu={() => setMenu(true)} />
      )}
      {screen.kind === 'battle' && (
        <BattleScreen
          key={screen.key}
          setup={screen.setup}
          lib={lib}
          title={screen.setup.map.name}
          {...(screen.initial ? { initial: screen.initial } : {})}
          onExit={(outcome, state: BattleState) => session.finishBattle(outcome, state)}
          onStateChange={(state) => session.saveBattleProgress(state)}
        />
      )}
      {screen.kind === 'results' && <ResultsScreen session={session} screen={screen} lib={lib} />}
      {screen.kind === 'prep' && <PrepScreen session={session} lib={lib} />}
      {screen.kind === 'end' && <EndScreen onTitle={onTitle} />}
      {menu && (
        <GameMenu
          session={session}
          onClose={() => setMenu(false)}
          onQuit={() => {
            session.autosave();
            setMenu(false);
            onTitle();
          }}
        />
      )}
    </>
  );
}

export function App() {
  const lib = useMemo(() => loadLibrary(), []);
  const [session, setSession] = useState<GameSession | null>(null);
  const [debugBattle, setDebugBattle] = useState(debugBattleId);
  const { textSize } = useStore(settings);

  useEffect(() => {
    document.documentElement.dataset.textSize = textSize;
  }, [textSize]);

  // Sound may only start after a user gesture; also give every button a soft click.
  useEffect(() => {
    initFullscreen();
    const onPointer = (e: PointerEvent) => {
      unlockAudio();
      enterFullscreenIfWanted();
      if ((e.target as HTMLElement | null)?.closest('button')) sfx('tap');
    };
    window.addEventListener('pointerdown', onPointer);
    return () => window.removeEventListener('pointerdown', onPointer);
  }, []);

  useEffect(() => {
    if (!session && !debugBattle) music('title');
  }, [session, debugBattle]);

  const debugSetup = useMemo(
    () => (debugBattle ? loadBattle(debugBattle, lib) : null),
    [debugBattle, lib],
  );

  useEffect(() => {
    if (debugSetup) music(battleMood(debugSetup));
  }, [debugSetup]);

  return (
    <>
      {debugSetup ? (
        <BattleScreen
          setup={debugSetup}
          lib={lib}
          title={debugSetup.map.name}
          onExit={() => setDebugBattle(null)}
        />
      ) : session ? (
        <SessionView session={session} onTitle={() => setSession(null)} />
      ) : (
        <TitleScreen
          onNew={() => setSession(new GameSession(lib))}
          onLoad={(slot: SlotId) => {
            const loaded = GameSession.load(lib, slot);
            if (loaded) setSession(loaded);
          }}
        />
      )}
      <RotateOverlay />
    </>
  );
}
