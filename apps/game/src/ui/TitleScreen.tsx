import { useState } from 'preact/hooks';
import type { CampaignSave } from '../campaign/types';
import type { SlotId } from '../platform/storage';
import { readSave, SLOTS } from '../platform/storage';
import { describeSave } from './GameMenu';
import { SettingsPanel } from './SettingsPanel';

interface Props {
  onNew: () => void;
  onLoad: (slot: SlotId) => void;
  onWatchIntro: () => void;
}

export function TitleScreen({ onNew, onLoad, onWatchIntro }: Props) {
  const [panel, setPanel] = useState<'none' | 'load' | 'settings'>('none');
  const auto = readSave<CampaignSave>('auto');
  return (
    <main class="title-screen">
      <h1>
        Armatura <span class="title-year">1565</span>
      </h1>
      <p class="subtitle">The Great Siege of Malta</p>
      <div class="title-menu">
        {auto && (
          <button type="button" class="btn" onClick={() => onLoad('auto')}>
            Continue
          </button>
        )}
        <button type="button" class={`btn ${auto ? 'ghost' : ''}`} onClick={onNew}>
          New Game
        </button>
        <button type="button" class="btn ghost" onClick={() => setPanel('load')}>
          Load
        </button>
        <button type="button" class="btn ghost" onClick={() => setPanel('settings')}>
          Settings
        </button>
      </div>
      <p class="build-note">Prototype build · placeholder art</p>

      {panel === 'settings' && (
        <SettingsPanel onClose={() => setPanel('none')} onWatchIntro={onWatchIntro} />
      )}
      {panel === 'load' && (
        <div class="modal" role="dialog" aria-label="Load game">
          <div class="modal-box">
            <h2>Load</h2>
            <div class="slots">
              {SLOTS.map((slot, i) => {
                const save = readSave<CampaignSave>(slot);
                return (
                  <button
                    type="button"
                    class="btn slot"
                    key={slot}
                    disabled={!save}
                    onClick={() => onLoad(slot)}
                  >
                    <span>{slot === 'auto' ? 'Autosave' : `Slot ${i}`}</span>
                    <small>{describeSave(save)}</small>
                  </button>
                );
              })}
            </div>
            <button type="button" class="btn ghost" onClick={() => setPanel('none')}>
              Back
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
