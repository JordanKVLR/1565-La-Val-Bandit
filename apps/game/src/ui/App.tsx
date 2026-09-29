import { loadBattle, loadLibrary } from '@m1565/content';
import { useMemo, useState } from 'preact/hooks';
import { BattleScreen } from './BattleScreen';
import { RotateOverlay } from './RotateOverlay';
import { TitleScreen } from './TitleScreen';

type Screen = 'title' | 'battle';

export function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const lib = useMemo(() => loadLibrary(), []);
  const setup = useMemo(() => loadBattle('b1-marsaxlokk', lib), [lib]);
  return (
    <>
      {screen === 'title' ? (
        <TitleScreen onStart={() => setScreen('battle')} />
      ) : (
        <BattleScreen
          setup={setup}
          lib={lib}
          title="Shore of Marsaxlokk"
          onExit={() => setScreen('title')}
        />
      )}
      <RotateOverlay />
    </>
  );
}
