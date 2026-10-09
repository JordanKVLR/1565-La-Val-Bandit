import type { Library } from '@m1565/content';
import { useState } from 'preact/hooks';
import type { GameSession } from '../campaign/GameSession';
import type { CampaignSave } from '../campaign/types';
import type { SlotId } from '../platform/storage';
import { readSave } from '../platform/storage';
import { useStore } from '../state/store';
import { DIFFICULTY_NAMES, DifficultyPicker, SaveBadges } from './difficulty';
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

/** In-game menu: save to a slot, change difficulty, settings, or return to the title. */
export function GameMenu({
  session,
  lib,
  onClose,
  onQuit,
}: {
  session: GameSession;
  lib: Library;
  onClose: () => void;
  onQuit: () => void;
}) {
  const [message, setMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [changing, setChanging] = useState(false);
  const [, refresh] = useState(0);
  const { difficulty, ngPlus } = useStore(session.view);
  if (showSettings) return <SettingsPanel onClose={() => setShowSettings(false)} />;
  if (changing)
    return (
      <div class="modal" role="dialog" aria-label="Difficulty" onClick={(e) => e.stopPropagation()}>
        <div class="modal-box difficulty-box">
          <h2>Difficulty</h2>
          <p class="modal-hint">Takes effect from the next battle.</p>
          <DifficultyPicker
            balance={lib.balance}
            value={difficulty}
            onPick={(d) => {
              session.setDifficulty(d);
              setMessage(`Difficulty set to ${DIFFICULTY_NAMES[d]}.`);
              setChanging(false);
            }}
          />
          <button type="button" class="btn ghost" onClick={() => setChanging(false)}>
            Back
          </button>
        </div>
      </div>
    );
  return (
    <div class="modal" role="dialog" aria-label="Menu" onClick={(e) => e.stopPropagation()}>
      <div class="modal-box">
        <h2>Menu</h2>
        <div class="setting" data-testid="menu-difficulty">
          <span>
            Difficulty: <strong>{DIFFICULTY_NAMES[difficulty]}</strong>
            {ngPlus > 0 && <span class="badge ngplus">NG+ {ngPlus}</span>}
          </span>
          <button type="button" class="btn tab" onClick={() => setChanging(true)}>
            Change
          </button>
        </div>
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
              <span class="slot-detail">
                <small>{describeSave(readSave<CampaignSave>(slot))}</small>
                <SaveBadges save={readSave<CampaignSave>(slot)} />
              </span>
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
