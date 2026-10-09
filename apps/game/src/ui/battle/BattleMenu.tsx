import { t } from '../../i18n';

interface Props {
  onResume: () => void;
  onLog: () => void;
  onHelp: () => void;
  onSettings: () => void;
  onQuit: () => void;
}

/** The ☰ menu in battle. Progress is saved automatically, so quitting keeps your place. */
export function BattleMenu({ onResume, onLog, onHelp, onSettings, onQuit }: Props) {
  return (
    <div class="modal" role="dialog" aria-label={t('battle.menu')} onClick={onResume}>
      <div class="modal-box menu-box" onClick={(e) => e.stopPropagation()}>
        <h2>{t('common.menu')}</h2>
        <button type="button" class="btn" data-nav-back onClick={onResume}>
          {t('common.resume')}
        </button>
        <button type="button" class="btn ghost" onClick={onLog}>
          {t('battle.log')}
        </button>
        <button type="button" class="btn ghost" onClick={onHelp}>
          {t('battle.howToPlay')}
        </button>
        <button type="button" class="btn ghost" onClick={onSettings}>
          {t('common.settings')}
        </button>
        <button type="button" class="btn ghost" onClick={onQuit}>
          {t('battle.saveQuit')}
        </button>
      </div>
    </div>
  );
}

export function LogPanel({ log, onClose }: { log: readonly string[]; onClose: () => void }) {
  return (
    <div class="modal" role="dialog" aria-label={t('battle.log')} onClick={onClose}>
      <div class="modal-box log-box" onClick={(e) => e.stopPropagation()}>
        <h2>{t('battle.log')}</h2>
        <div class="log-lines">
          {log.length === 0 ? (
            <p class="empty">{t('battle.logEmpty')}</p>
          ) : (
            [...log].reverse().map((l, i) => <p key={i}>{l}</p>)
          )}
        </div>
        <button type="button" class="btn" data-nav-back onClick={onClose}>
          {t('common.close')}
        </button>
      </div>
    </div>
  );
}
