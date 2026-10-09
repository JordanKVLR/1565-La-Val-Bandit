import type { Library } from '@m1565/content';
import { useState } from 'preact/hooks';
import type { GameSession } from '../campaign/GameSession';
import type { CampaignSave } from '../campaign/types';
import { t, tParts } from '../i18n';
import type { SlotId } from '../platform/storage';
import { readSave } from '../platform/storage';
import { useStore } from '../state/store';
import { difficultyName, DifficultyPicker, SaveBadges } from './difficulty';
import { battlesWonInSaves, CodexScreen } from './CodexScreen';
import { SettingsPanel } from './SettingsPanel';

const MANUAL: readonly SlotId[] = ['slot1', 'slot2', 'slot3'];

export function describeSave(save: CampaignSave | null): string {
  if (!save) return t('save.empty');
  const when = new Date(save.savedAt).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  return t('save.describe', { chapter: save.chapter.title || t('save.prologue'), when });
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
  const [showCodex, setShowCodex] = useState(false);
  const [, refresh] = useState(0);
  const { difficulty, ngPlus } = useStore(session.view);
  if (showSettings) return <SettingsPanel onClose={() => setShowSettings(false)} />;
  if (changing)
    return (
      <div
        class="modal"
        role="dialog"
        aria-label={t('difficulty.title')}
        onClick={(e) => e.stopPropagation()}
      >
        <div class="modal-box difficulty-box">
          <h2>{t('difficulty.title')}</h2>
          <p class="modal-hint">{t('menu.difficultyHint')}</p>
          <DifficultyPicker
            balance={lib.balance}
            value={difficulty}
            onPick={(d) => {
              session.setDifficulty(d);
              setMessage(t('menu.difficultySet', { name: difficultyName(d) }));
              setChanging(false);
            }}
          />
          <button type="button" class="btn ghost" data-nav-back onClick={() => setChanging(false)}>
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  if (showCodex) {
    const won = new Set([...battlesWonInSaves(), ...session.view.get().completedBattles]);
    return <CodexScreen completedBattles={[...won]} onClose={() => setShowCodex(false)} />;
  }
  return (
    <div
      class="modal"
      role="dialog"
      aria-label={t('common.menu')}
      onClick={(e) => e.stopPropagation()}
    >
      <div class="modal-box">
        <h2>{t('common.menu')}</h2>
        <div class="setting" data-testid="menu-difficulty">
          <span>
            {tParts('menu.difficulty', { name: <strong>{difficultyName(difficulty)}</strong> })}
            {ngPlus > 0 && <span class="badge ngplus">{t('ngPlus.badge', { n: ngPlus })}</span>}
          </span>
          <button type="button" class="btn tab" onClick={() => setChanging(true)}>
            {t('menu.change')}
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
                  session.saveTo(slot) ? t('menu.savedToSlot', { n: i + 1 }) : t('menu.saveFailed'),
                );
                refresh((n) => n + 1);
              }}
            >
              <span>{t('menu.saveToSlot', { n: i + 1 })}</span>
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
            {t('common.settings')}
          </button>
          <button type="button" class="btn ghost" onClick={() => setShowCodex(true)}>
            {t('codex.title')}
          </button>
          <button type="button" class="btn ghost" onClick={onQuit}>
            {t('menu.titleScreen')}
          </button>
          <button type="button" class="btn" data-nav-back data-nav-default onClick={onClose}>
            {t('common.resume')}
          </button>
        </div>
      </div>
    </div>
  );
}
