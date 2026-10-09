import { t } from '../../i18n';

interface Props {
  outcome: 'victory' | 'defeat';
  onRetry: () => void;
  onContinue: () => void;
  continueLabel?: string;
  /** Shown under the actions after a defeat: what retrying costs. */
  retryNote?: string;
}

export function EndOverlay({
  outcome,
  onRetry,
  onContinue,
  continueLabel = t('common.continue'),
  retryNote,
}: Props) {
  const title = outcome === 'victory' ? t('battle.victory') : t('battle.defeat');
  return (
    <div class={`end-overlay ${outcome}`} role="dialog" aria-label={title}>
      <h2>{title}</h2>
      <div class="end-actions">
        {outcome === 'defeat' && (
          <button type="button" class="btn" onClick={onRetry}>
            {t('battle.retry')}
          </button>
        )}
        <button
          type="button"
          class={`btn ${outcome === 'defeat' ? 'ghost' : ''}`}
          onClick={onContinue}
        >
          {outcome === 'victory' ? continueLabel : t('battle.giveUp')}
        </button>
      </div>
      {outcome === 'defeat' && retryNote && <p class="end-note">{retryNote}</p>}
    </div>
  );
}
