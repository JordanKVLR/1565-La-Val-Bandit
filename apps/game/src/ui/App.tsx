import { useState } from 'preact/hooks';
import { BattleScreen } from './BattleScreen';
import { RotateOverlay } from './RotateOverlay';
import { TitleScreen } from './TitleScreen';

type Screen = 'title' | 'battle';

export function App() {
  const [screen, setScreen] = useState<Screen>('title');
  return (
    <>
      {screen === 'title' ? (
        <TitleScreen onStart={() => setScreen('battle')} />
      ) : (
        <BattleScreen onExit={() => setScreen('title')} />
      )}
      <RotateOverlay />
    </>
  );
}
