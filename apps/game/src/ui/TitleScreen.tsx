import type { Difficulty } from '@m1565/core';
import type { Library } from '@m1565/content';
import { useMemo, useState } from 'preact/hooks';
import { migrateCampaign } from '../campaign/migrate';
import { canStartNewGamePlus } from '../campaign/newGamePlus';
import type { CampaignSave } from '../campaign/types';
import type { SlotId } from '../platform/storage';
import { readSave, SLOTS } from '../platform/storage';
import { DifficultyPicker, SaveBadges } from './difficulty';
import { battlesWonInSaves, CodexScreen } from './CodexScreen';
import { describeSave } from './GameMenu';
import { SettingsPanel } from './SettingsPanel';

interface Props {
  lib: Library;
  onNew: (difficulty: Difficulty) => void;
  onLoad: (slot: SlotId) => void;
  /** Starts New Game+ from a save that reached an ending. */
  onNewGamePlus: (slot: SlotId) => void;
  onWatchIntro: () => void;
}

const slotName = (slot: SlotId, i: number) => (slot === 'auto' ? 'Autosave' : `Slot ${i}`);

/** Every slot's save, upgraded to the current format (null if empty or unreadable). */
function readAll(lib: Library): Record<SlotId, CampaignSave | null> {
  const out = {} as Record<SlotId, CampaignSave | null>;
  for (const slot of SLOTS) {
    const raw = readSave<Record<string, unknown>>(slot);
    try {
      out[slot] = raw ? migrateCampaign(lib, raw) : null;
    } catch {
      out[slot] = null;
    }
  }
  return out;
}

export function TitleScreen({ lib, onNew, onLoad, onNewGamePlus, onWatchIntro }: Props) {
  const [panel, setPanel] = useState<'none' | 'load' | 'settings' | 'new' | 'ngplus' | 'codex'>(
    'none',
  );
  const saves = useMemo(() => readAll(lib), [lib]);
  const auto = saves.auto;
  const finished = SLOTS.filter((s) => canStartNewGamePlus(saves[s]));
  return (
    <main class="title-screen">
      <h1>
        Armatura <span class="title-year">1565</span>
      </h1>
      <p class="subtitle">The Great Siege of Malta</p>
      <div class="title-menu">
        {auto && (
          <button type="button" class="btn title-continue" onClick={() => onLoad('auto')}>
            <span>Continue</span>
            <SaveBadges save={auto} />
          </button>
        )}
        <button type="button" class={`btn ${auto ? 'ghost' : ''}`} onClick={() => setPanel('new')}>
          New Game
        </button>
        {finished.length > 0 && (
          <button type="button" class="btn ghost" onClick={() => setPanel('ngplus')}>
            New Game+
          </button>
        )}
        <button type="button" class="btn ghost" onClick={() => setPanel('load')}>
          Load
        </button>
        <button type="button" class="btn ghost" onClick={() => setPanel('settings')}>
          Settings
        </button>
        <button type="button" class="btn ghost" onClick={() => setPanel('codex')}>
          Historical notes
        </button>
      </div>
      <p class="build-note">Prototype build · placeholder art</p>

      {panel === 'settings' && (
        <SettingsPanel onClose={() => setPanel('none')} onWatchIntro={onWatchIntro} />
      )}
      {panel === 'new' && (
        <div class="modal" role="dialog" aria-label="Choose difficulty">
          <div class="modal-box difficulty-box">
            <h2>Choose difficulty</h2>
            <p class="modal-hint">You can change it later from the menu.</p>
            <DifficultyPicker balance={lib.balance} onPick={onNew} />
            <button type="button" class="btn ghost" data-nav-back onClick={() => setPanel('none')}>
              Back
            </button>
          </div>
        </div>
      )}
      {panel === 'ngplus' && (
        <div class="modal" role="dialog" aria-label="New Game+">
          <div class="modal-box">
            <h2>New Game+</h2>
            <p class="modal-hint">
              Begin the story again with your company: levels, attributes, gear, stores and scudi
              carry over. Enemies grow stronger with every cycle. The new playthrough autosaves; the
              finished save is kept unless it is the autosave.
            </p>
            <div class="slots">
              {finished.map((slot) => {
                const save = saves[slot];
                return (
                  <button
                    type="button"
                    class="btn slot"
                    key={slot}
                    onClick={() => onNewGamePlus(slot)}
                  >
                    <span>{slotName(slot, SLOTS.indexOf(slot))}</span>
                    <span class="slot-detail">
                      <small>
                        Next: NG+ {(save?.ngPlus ?? 0) + 1} · {describeSave(save)}
                      </small>
                      <SaveBadges save={save} />
                    </span>
                  </button>
                );
              })}
            </div>
            <button type="button" class="btn ghost" data-nav-back onClick={() => setPanel('none')}>
              Back
            </button>
          </div>
        </div>
      )}
      {panel === 'codex' && (
        <CodexScreen completedBattles={battlesWonInSaves()} onClose={() => setPanel('none')} />
      )}
      {panel === 'load' && (
        <div class="modal" role="dialog" aria-label="Load game">
          <div class="modal-box">
            <h2>Load</h2>
            <div class="slots">
              {SLOTS.map((slot, i) => {
                const save = saves[slot];
                return (
                  <button
                    type="button"
                    class="btn slot"
                    key={slot}
                    disabled={!save}
                    onClick={() => onLoad(slot)}
                  >
                    <span>{slotName(slot, i)}</span>
                    <span class="slot-detail">
                      <small>{describeSave(save)}</small>
                      <SaveBadges save={save} />
                    </span>
                  </button>
                );
              })}
            </div>
            <button type="button" class="btn ghost" data-nav-back onClick={() => setPanel('none')}>
              Back
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
