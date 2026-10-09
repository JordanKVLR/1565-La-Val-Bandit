import type { Difficulty } from '@m1565/core';
import type { Library } from '@m1565/content';
import { useMemo, useState } from 'preact/hooks';
import { migrateCampaign } from '../campaign/migrate';
import { canStartNewGamePlus } from '../campaign/newGamePlus';
import type { CampaignSave } from '../campaign/types';
import { t, tParts } from '../i18n';
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

const slotName = (slot: SlotId, i: number) =>
  slot === 'auto' ? t('save.autosave') : t('save.slot', { n: i });

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
      <h1>{tParts('title.heading', { year: <span class="title-year">1565</span> })}</h1>
      <p class="subtitle">{t('title.subtitle')}</p>
      <div class="title-menu">
        {auto && (
          <button
            type="button"
            class="btn title-continue"
            data-nav-default
            onClick={() => onLoad('auto')}
          >
            <span>{t('common.continue')}</span>
            <SaveBadges save={auto} />
          </button>
        )}
        {/* The first D-pad press or Ⓐ lands on Continue, else New Game (ui/input.ts). */}
        <button
          type="button"
          class={`btn ${auto ? 'ghost' : ''}`}
          data-nav-default={!auto || undefined}
          onClick={() => setPanel('new')}
        >
          {t('title.newGame')}
        </button>
        {finished.length > 0 && (
          <button type="button" class="btn ghost" onClick={() => setPanel('ngplus')}>
            {t('title.newGamePlus')}
          </button>
        )}
        <button type="button" class="btn ghost" onClick={() => setPanel('load')}>
          {t('title.load')}
        </button>
        <button type="button" class="btn ghost" onClick={() => setPanel('settings')}>
          {t('common.settings')}
        </button>
        <button type="button" class="btn ghost" onClick={() => setPanel('codex')}>
          {t('codex.title')}
        </button>
      </div>
      <p class="build-note">{t('title.buildNote')}</p>

      {panel === 'settings' && (
        <SettingsPanel onClose={() => setPanel('none')} onWatchIntro={onWatchIntro} />
      )}
      {panel === 'new' && (
        <div class="modal" role="dialog" aria-label={t('title.chooseDifficulty')}>
          <div class="modal-box difficulty-box">
            <h2>{t('title.chooseDifficulty')}</h2>
            <p class="modal-hint">{t('title.chooseDifficultyHint')}</p>
            <DifficultyPicker balance={lib.balance} onPick={onNew} />
            <button type="button" class="btn ghost" data-nav-back onClick={() => setPanel('none')}>
              {t('common.back')}
            </button>
          </div>
        </div>
      )}
      {panel === 'ngplus' && (
        <div class="modal" role="dialog" aria-label={t('title.newGamePlus')}>
          <div class="modal-box">
            <h2>{t('title.newGamePlus')}</h2>
            <p class="modal-hint">{t('title.ngPlusText')}</p>
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
                        {t('title.ngPlusNext', {
                          n: (save?.ngPlus ?? 0) + 1,
                          save: describeSave(save),
                        })}
                      </small>
                      <SaveBadges save={save} />
                    </span>
                  </button>
                );
              })}
            </div>
            <button type="button" class="btn ghost" data-nav-back onClick={() => setPanel('none')}>
              {t('common.back')}
            </button>
          </div>
        </div>
      )}
      {panel === 'codex' && (
        <CodexScreen completedBattles={battlesWonInSaves()} onClose={() => setPanel('none')} />
      )}
      {panel === 'load' && (
        <div class="modal" role="dialog" aria-label={t('title.loadGame')}>
          <div class="modal-box">
            <h2>{t('title.load')}</h2>
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
              {t('common.back')}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
