import type { Difficulty } from '@m1565/core';
import type { Library } from '@m1565/content';
import { useMemo, useState } from 'preact/hooks';
import { migrateCampaign } from '../campaign/migrate';
import { canStartNewGamePlus } from '../campaign/newGamePlus';
import type { CampaignSave } from '../campaign/types';
import { t, tParts } from '../i18n';
import type { SlotId } from '../platform/storage';
import { readSave, SLOTS } from '../platform/storage';
import { battlesWonInSaves, CodexScreen } from './CodexScreen';
import { Button, Divider, Hint, Icon, Sheet } from './design';
import { DifficultyPicker, SaveBadges } from './difficulty';
import { describeSave } from './GameMenu';
import { SlotButton, SlotList } from './SaveSlots';
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

type Panel = 'none' | 'load' | 'settings' | 'new' | 'ngplus' | 'codex';

/**
 * The title: the name in inscriptional capitals on the left, one gold main action (Continue, or
 * New Game on a fresh install) and a quiet list of the rest on the right.
 */
export function TitleScreen({ lib, onNew, onLoad, onNewGamePlus, onWatchIntro }: Props) {
  const [panel, setPanel] = useState<Panel>('none');
  const saves = useMemo(() => readAll(lib), [lib]);
  const auto = saves.auto;
  const finished = SLOTS.filter((s) => canStartNewGamePlus(saves[s]));
  const close = () => setPanel('none');
  return (
    <main class="fe-title">
      <div class="fe-title__layout">
        <header class="fe-title__brand">
          <Icon name="cross" class="fe-title__emblem" />
          <h1 class="fe-title__name">
            {tParts('title.heading', { year: <span class="fe-title__year">1565</span> })}
          </h1>
          <Divider glyph="cross" class="fe-title__rule" />
          <p class="fe-title__subtitle">{t('title.subtitle')}</p>
        </header>

        <nav class="fe-title__menu" aria-label={t('fe.title.menu')}>
          {auto && (
            <Button
              variant="primary"
              size="lg"
              block
              class="fe-title__continue"
              label={t('common.continue')}
              detail={describeSave(auto)}
              navDefault
              onClick={() => onLoad('auto')}
            >
              <SaveBadges save={auto} />
            </Button>
          )}
          {/* The first D-pad press or Ⓐ lands on Continue, else New Game (ui/input.ts). */}
          {!auto && (
            <Button
              variant="primary"
              size="lg"
              block
              class="fe-title__continue"
              label={t('title.newGame')}
              navDefault
              onClick={() => setPanel('new')}
            />
          )}
          <div class="fe-title__list">
            {auto && (
              <Button
                variant="ghost"
                size="lg"
                block
                label={t('title.newGame')}
                onClick={() => setPanel('new')}
              />
            )}
            {finished.length > 0 && (
              <Button
                variant="ghost"
                size="lg"
                block
                label={t('title.newGamePlus')}
                onClick={() => setPanel('ngplus')}
              />
            )}
            <Button
              variant="ghost"
              size="lg"
              block
              label={t('title.load')}
              onClick={() => setPanel('load')}
            />
            <Button
              variant="ghost"
              size="lg"
              block
              label={t('common.settings')}
              onClick={() => setPanel('settings')}
            />
            <Button
              variant="ghost"
              size="lg"
              block
              label={t('codex.title')}
              onClick={() => setPanel('codex')}
            />
          </div>
        </nav>
      </div>
      <p class="fe-title__note">{t('title.buildNote')}</p>

      {panel === 'settings' && <SettingsPanel onClose={close} onWatchIntro={onWatchIntro} />}
      {panel === 'new' && (
        <Sheet
          label={t('title.chooseDifficulty')}
          placement="center"
          size="lg"
          ornament="cross"
          closeLabel={t('common.back')}
          onClose={close}
          class="fe-sheet"
        >
          <Hint text={t('title.chooseDifficultyHint')} class="fe-sheet__hint" />
          <DifficultyPicker balance={lib.balance} onPick={onNew} />
        </Sheet>
      )}
      {panel === 'ngplus' && (
        <Sheet
          label={t('title.newGamePlus')}
          placement="center"
          ornament="cross"
          closeLabel={t('common.back')}
          onClose={close}
          class="fe-sheet"
        >
          <Hint text={t('title.ngPlusText')} class="fe-sheet__hint" />
          <SlotList>
            {finished.map((slot) => {
              const save = saves[slot];
              return (
                <SlotButton
                  key={slot}
                  name={slotName(slot, SLOTS.indexOf(slot))}
                  detail={t('title.ngPlusNext', {
                    n: (save?.ngPlus ?? 0) + 1,
                    save: describeSave(save),
                  })}
                  save={save}
                  onClick={() => onNewGamePlus(slot)}
                />
              );
            })}
          </SlotList>
        </Sheet>
      )}
      {panel === 'codex' && <CodexScreen completedBattles={battlesWonInSaves()} onClose={close} />}
      {panel === 'load' && (
        <Sheet
          label={t('title.loadGame')}
          title={t('title.load')}
          placement="center"
          ornament="cross"
          closeLabel={t('common.back')}
          onClose={close}
          class="fe-sheet"
        >
          <SlotList>
            {SLOTS.map((slot, i) => {
              const save = saves[slot];
              return (
                <SlotButton
                  key={slot}
                  name={slotName(slot, i)}
                  detail={describeSave(save)}
                  save={save}
                  disabled={!save}
                  onClick={() => onLoad(slot)}
                />
              );
            })}
          </SlotList>
        </Sheet>
      )}
    </main>
  );
}
