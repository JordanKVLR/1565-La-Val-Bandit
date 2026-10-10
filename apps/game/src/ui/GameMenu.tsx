import type { Library } from '@m1565/content';
import { useState } from 'preact/hooks';
import type { GameSession } from '../campaign/GameSession';
import type { CampaignSave } from '../campaign/types';
import { t, tParts } from '../i18n';
import type { SlotId } from '../platform/storage';
import { readSave } from '../platform/storage';
import { useStore } from '../state/store';
import { battlesWonInSaves, CodexScreen } from './CodexScreen';
import { Button, Chip, Hint, Sheet } from './design';
import { difficultyName, DifficultyPicker, DifficultyPips } from './difficulty';
import { SlotButton, SlotList } from './SaveSlots';
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
      <Sheet
        label={t('difficulty.title')}
        placement="center"
        size="lg"
        ornament="cross"
        closeLabel={t('common.back')}
        onClose={() => setChanging(false)}
        class="fe-sheet"
      >
        <Hint text={t('menu.difficultyHint')} class="fe-sheet__hint" />
        <DifficultyPicker
          balance={lib.balance}
          value={difficulty}
          onPick={(d) => {
            session.setDifficulty(d);
            setMessage(t('menu.difficultySet', { name: difficultyName(d) }));
            setChanging(false);
          }}
        />
      </Sheet>
    );
  if (showCodex) {
    const won = new Set([...battlesWonInSaves(), ...session.view.get().completedBattles]);
    return <CodexScreen completedBattles={[...won]} onClose={() => setShowCodex(false)} />;
  }
  return (
    <Sheet
      label={t('common.menu')}
      placement="center"
      ornament="cross"
      closeLabel={t('common.close')}
      onClose={onClose}
      class="fe-sheet fe-menu"
      footer={
        <Button
          variant="primary"
          label={t('common.resume')}
          navDefault
          keyHint="back"
          keyContext="menu"
          onClick={onClose}
        />
      }
    >
      <div class="fe-menu__grid">
        <section class="fe-menu__main">
          <div class="fe-menu__difficulty" data-testid="menu-difficulty">
            <DifficultyPips d={difficulty} />
            <span class="fe-menu__difficulty-text">
              {tParts('menu.difficulty', { name: <strong>{difficultyName(difficulty)}</strong> })}
            </span>
            {ngPlus > 0 && (
              <Chip tone="gold" icon="cross" label={t('ngPlus.badge', { n: ngPlus })} />
            )}
            <Button
              size="sm"
              class="fe-menu__change"
              label={t('menu.change')}
              onClick={() => setChanging(true)}
            />
          </div>
          <h3 class="fe-label">{t('fe.menu.save')}</h3>
          <SlotList>
            {MANUAL.map((slot, i) => {
              const save = readSave<CampaignSave>(slot);
              return (
                <SlotButton
                  key={slot}
                  name={t('menu.saveToSlot', { n: i + 1 })}
                  detail={describeSave(save)}
                  save={save}
                  onClick={() => {
                    setMessage(
                      session.saveTo(slot)
                        ? t('menu.savedToSlot', { n: i + 1 })
                        : t('menu.saveFailed'),
                    );
                    refresh((n) => n + 1);
                  }}
                />
              );
            })}
          </SlotList>
          <p class="fe-menu__msg" role="status">
            {message}
          </p>
        </section>
        <nav class="fe-menu__more" aria-label={t('fe.menu.more')}>
          <Button
            variant="ghost"
            block
            label={t('common.settings')}
            onClick={() => setShowSettings(true)}
          />
          <Button
            variant="ghost"
            block
            label={t('codex.title')}
            onClick={() => setShowCodex(true)}
          />
          <Button
            variant="ghost"
            block
            icon="back"
            label={t('menu.titleScreen')}
            onClick={onQuit}
          />
        </nav>
      </div>
    </Sheet>
  );
}
