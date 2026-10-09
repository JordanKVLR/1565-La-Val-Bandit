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
  continueLabel = 'Continue',
  retryNote,
}: Props) {
  return (
    <div class={`end-overlay ${outcome}`} role="dialog" aria-label={outcome}>
      <h2>{outcome === 'victory' ? 'Victory' : 'Defeat'}</h2>
      <div class="end-actions">
        {outcome === 'defeat' && (
          <button type="button" class="btn" onClick={onRetry}>
            Retry battle
          </button>
        )}
        <button
          type="button"
          class={`btn ${outcome === 'defeat' ? 'ghost' : ''}`}
          onClick={onContinue}
        >
          {outcome === 'victory' ? continueLabel : 'Give up'}
        </button>
      </div>
      {outcome === 'defeat' && retryNote && <p class="end-note">{retryNote}</p>}
    </div>
  );
}
