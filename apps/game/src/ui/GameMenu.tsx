import { useState } from 'preact/hooks';
import type { GameSession } from '../campaign/GameSession';
import type { CampaignSave } from '../campaign/types';
import type { SlotId } from '../platform/storage';
import { readSave } from '../platform/storage';
import { SettingsPanel } from './SettingsPanel';

const MANUAL: readonly SlotId[] = ['slot1', 'slot2', 'slot3'];

export function describeSave(save: CampaignSave | null): string {
  if (!save) return 'Empty';
  const when = new Date(save.savedAt).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  return `${save.chapter.title || 'Prologue'} · ${when}`;
}

/** In-game menu: save to a slot, settings, or return to the title. */
export function GameMenu({
  session,
  onClose,
  onQuit,
}: {
  session: GameSession;
  onClose: () => void;
  onQuit: () => void;
}) {
  const [message, setMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [, refresh] = useState(0);
  if (showSettings) return <SettingsPanel onClose={() => setShowSettings(false)} />;
  return (
    <div class="modal" role="dialog" aria-label="Menu" onClick={(e) => e.stopPropagation()}>
      <div class="modal-box">
        <h2>Menu</h2>
        <div class="slots">
          {MANUAL.map((slot, i) => (
            <button
              type="button"
              class="btn slot"
              key={slot}
              onClick={() => {
                setMessage(
                  session.saveTo(slot)
                    ? `Saved to slot ${i + 1}.`
                    : 'Could not save: storage is unavailable.',
                );
                refresh((n) => n + 1);
              }}
            >
              <span>Save to slot {i + 1}</span>
              <small>{describeSave(readSave<CampaignSave>(slot))}</small>
            </button>
          ))}
        </div>
        {message && <p class="menu-msg">{message}</p>}
        <div class="menu-row">
          <button type="button" class="btn ghost" onClick={() => setShowSettings(true)}>
            Settings
          </button>
          <button type="button" class="btn ghost" onClick={onQuit}>
            Title screen
          </button>
          <button type="button" class="btn" onClick={onClose}>
            Resume
          </button>
        </div>
      </div>
    </div>
  );
}
