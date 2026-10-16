import type { BattleSetup, BattleState, Difficulty } from '@m1565/core';
import type { Library } from '@m1565/content';
import { isBattleId, loadBattle, loadLibrary } from '@m1565/content';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { GameSession } from '../campaign/GameSession';
import { migrateCampaign } from '../campaign/migrate';
import { canStartNewGamePlus, newGamePlus } from '../campaign/newGamePlus';
import { syncAchievements } from '../platform/achievements';
import { music, pauseAudio, resumeAudio, sfx, unlockAudio } from '../platform/audio';
import type { Challenge } from '../platform/challenge';
import { bestFor, challengeFor, dayNumber, record, scoreOf } from '../platform/challenge';
import { enterFullscreenIfWanted, initFullscreen } from '../platform/fullscreen';
import { installLifecycle } from '../platform/lifecycle';
import type { SlotId } from '../platform/storage';
import { flushStorage, readSave } from '../platform/storage';
import { gameplayPause } from '../state/pause';
import { settings } from '../state/settings';
import { useStore } from '../state/store';
import { t } from '../i18n';
import { ArmouryScreen } from './armoury/ArmouryScreen';
import { ControllerNotice } from './ControllerNotice';
import { BattleScreen } from './BattleScreen';
import { EndScreen } from './EndScreen';
import { GameMenu } from './GameMenu';
import { ResultsScreen } from './ResultsScreen';
import { RotateOverlay } from './RotateOverlay';
import { StoryScreen } from './StoryScreen';
import { IntroScreen } from './IntroScreen';
import { installInput } from './input';
import { TitleScreen } from './TitleScreen';

/** Battles against a named commander get the heavier theme. */
function battleMood(setup: BattleSetup): 'battle' | 'boss' {
  return setup.victory.some((v) => v.type === 'defeatLeader') ? 'boss' : 'battle';
}

/** The title's line about today's challenge and the best result on this device. */
function challengeNote(lib: Library, _runs: number): string {
  const c = challengeFor(lib, dayNumber());
  const best = bestFor(c.day);
  return best
    ? t('challenge.best', { name: c.skirmish.title, ...best })
    : t('challenge.today', { name: c.skirmish.title });
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

/** `?armoury` opens the Armoury with a demo company (for testing and design). */
function debugArmoury(): boolean {
  try {
    return new URLSearchParams(location.search).has('armoury');
  } catch {
    return false;
  }
}

/** `?results` or `?end` opens that screen with a demo company (for testing and design). */
function debugScreen(): 'results' | 'end' | null {
  try {
    const q = new URLSearchParams(location.search);
    return q.has('results') ? 'results' : q.has('end') ? 'end' : null;
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
          onRetry={(state) => session.retryBattle(state)}
          retryNote={session.defeatKeepsXp ? t('battle.retryKeepsXp') : t('battle.retryLosesXp')}
          onStateChange={(state) => session.saveBattleProgress(state)}
        />
      )}
      {screen.kind === 'results' && <ResultsScreen session={session} screen={screen} lib={lib} />}
      {screen.kind === 'prep' && <ArmouryScreen session={session} lib={lib} />}
      {screen.kind === 'end' && <EndScreen onTitle={onTitle} />}
      {menu && (
        <GameMenu
          session={session}
          lib={lib}
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
  const [session, setSession] = useState<GameSession | null>(() => {
    const demoScreen = debugScreen();
    if (!debugArmoury() && !demoScreen) return null;
    const demo = new GameSession(lib);
    if (demoScreen) demo.openScreenDemo(demoScreen);
    else demo.openArmouryDemo();
    return demo;
  });
  const [debugBattle, setDebugBattle] = useState(debugBattleId);
  // Today's challenge, once started from the title (a bumped counter refreshes its note).
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [challengeRuns, setChallengeRuns] = useState(0);
  // The opening cinematic plays before every new game, and on request from Settings.
  const [intro, setIntro] = useState<'new' | 'watch' | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('knight');
  const { textSize } = useStore(settings);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  useEffect(() => {
    document.documentElement.dataset.textSize = textSize;
  }, [textSize]);

  // Sound may only start after a user gesture; also give every button a soft click.
  useEffect(() => {
    initFullscreen();
    // Re-send unlocks recorded on this device (one may have failed while offline).
    syncAchievements();
    const onPointer = (e: PointerEvent) => {
      unlockAudio();
      enterFullscreenIfWanted();
      if ((e.target as HTMLElement | null)?.closest('button')) sfx('tap');
    };
    window.addEventListener('pointerdown', onPointer);
    // Keyboard focus navigation and the gamepad (a pad press also counts as user input).
    const uninstallInput = installInput(unlockAudio);
    // Suspend (console/phone/Deck sleep, app switch, tab hidden, quit): save now, make it
    // durable, and hold sound, animation and the battle; resume carries on where it was.
    const root = document.documentElement;
    const uninstallLifecycle = installLifecycle({
      onSuspend: () => {
        sessionRef.current?.flush();
        void flushStorage();
        pauseAudio();
        gameplayPause.hold('suspended');
        root.dataset.suspended = '';
      },
      onResume: () => {
        delete root.dataset.suspended;
        gameplayPause.release('suspended');
        resumeAudio();
      },
    });
    return () => {
      window.removeEventListener('pointerdown', onPointer);
      uninstallInput();
      uninstallLifecycle();
    };
  }, []);

  useEffect(() => {
    if (!session && !debugBattle && !intro && !challenge) music('title');
  }, [session, debugBattle, intro, challenge]);

  const debugSetup = useMemo(
    () => (debugBattle ? loadBattle(debugBattle, lib) : null),
    [debugBattle, lib],
  );

  useEffect(() => {
    if (debugSetup) music(battleMood(debugSetup));
  }, [debugSetup]);

  return (
    <>
      {challenge ? (
        <BattleScreen
          key={`challenge-${challenge.day}`}
          setup={challenge.setup}
          lib={lib}
          title={`${t('challenge.title')} · ${challenge.skirmish.title}`}
          onExit={(outcome, state: BattleState) => {
            if (outcome === 'victory') record(challenge.day, scoreOf(state));
            setChallenge(null);
            setChallengeRuns((n) => n + 1);
          }}
          onRetry={() => setChallenge(challengeFor(lib, challenge.day))}
          retryNote={t('battle.retryLosesXp')}
        />
      ) : debugSetup ? (
        <BattleScreen
          setup={debugSetup}
          lib={lib}
          title={debugSetup.map.name}
          onExit={() => setDebugBattle(null)}
        />
      ) : intro ? (
        <IntroScreen
          onDone={() => {
            if (intro === 'new') setSession(new GameSession(lib, undefined, { difficulty }));
            setIntro(null);
          }}
        />
      ) : session ? (
        <SessionView session={session} onTitle={() => setSession(null)} />
      ) : (
        <TitleScreen
          lib={lib}
          onNew={(d) => {
            setDifficulty(d);
            setIntro('new');
          }}
          onNewGamePlus={(slot: SlotId) => {
            // Starts the story again at once (the opening cinematic was seen last time).
            const raw = readSave<Record<string, unknown>>(slot);
            const save = raw ? migrateCampaign(lib, raw) : null;
            if (save && canStartNewGamePlus(save))
              setSession(new GameSession(lib, undefined, newGamePlus(lib, save)));
          }}
          onWatchIntro={() => setIntro('watch')}
          onChallenge={() => setChallenge(challengeFor(lib, dayNumber()))}
          challengeNote={challengeNote(lib, challengeRuns)}
          onLoad={(slot: SlotId) => {
            const loaded = GameSession.load(lib, slot);
            if (loaded) setSession(loaded);
          }}
        />
      )}
      <RotateOverlay />
      <ControllerNotice />
    </>
  );
}
