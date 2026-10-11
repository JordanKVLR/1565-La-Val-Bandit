import { useRef } from 'preact/hooks';
import { t } from '../../i18n';
import { Button, Hint, Sheet } from '../design';
import { useSheetScrollCue } from './ScrollArea';

interface Props {
  onResume: () => void;
  onLog: () => void;
  onHelp: () => void;
  onSettings: () => void;
  onQuit: () => void;
}

/**
 * The battle menu: Resume first (it is also how the menu closes, so the sheet draws no ✕), then
 * the log, help and settings, and Save & quit. Progress is saved after every action, so quitting
 * keeps your place and needs no confirmation.
 */
export function BattleMenu({ onResume, onLog, onHelp, onSettings, onQuit }: Props) {
  return (
    <Sheet
      label={t('battle.menu')}
      title={t('common.menu')}
      closeLabel={t('common.resume')}
      onClose={onResume}
      placement="center"
      size="sm"
      ornament="cross"
      closeButton={false}
      class="ov-sheet ov-menu"
    >
      <div class="ov-menu__list">
        <Button
          variant="primary"
          block
          label={t('common.resume')}
          keyHint="back"
          keyContext="menu"
          navBack
          onClick={onResume}
        />
        <Button block label={t('battle.log')} onClick={onLog} />
        <Button block label={t('battle.howToPlay')} icon="info" onClick={onHelp} />
        <Button block label={t('common.settings')} onClick={onSettings} />
        <Button block variant="ghost" icon="back" label={t('battle.saveQuit')} onClick={onQuit} />
      </div>
      <Hint class="ov-menu__saved" text={t('overlay.menu.saved')} />
    </Sheet>
  );
}

/** The battle log, newest first, in a side sheet over the map. */
export function LogPanel({ log, onClose }: { log: readonly string[]; onClose: () => void }) {
  const inner = useRef<HTMLOListElement>(null);
  useSheetScrollCue(inner);
  return (
    <Sheet
      label={t('battle.log')}
      closeLabel={t('common.close')}
      onClose={onClose}
      placement="side"
      size="md"
      class="ov-sheet ov-log"
    >
      {log.length === 0 ? (
        <p class="ov-log__empty">{t('battle.logEmpty')}</p>
      ) : (
        <ol class="ov-log__lines" ref={inner}>
          {[...log].reverse().map((l, i) => (
            <li key={log.length - i} class={i === 0 ? 'is-latest' : undefined}>
              {i === 0 && <span class="ov-log__latest">{t('overlay.log.latest')}</span>}
              {l}
            </li>
          ))}
        </ol>
      )}
    </Sheet>
  );
}
