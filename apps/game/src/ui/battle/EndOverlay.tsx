interface Props {
  outcome: 'victory' | 'defeat';
  onRetry: () => void;
  onContinue: () => void;
  continueLabel?: string;
}

export function EndOverlay({ outcome, onRetry, onContinue, continueLabel = 'Continue' }: Props) {
  return (
    <div
      class={`end-overlay ${outcome}`}
      role="dialog"
      aria-label={outcome === 'victory' ? 'Victory' : 'Defeat'}
    >
      <h2>{outcome === 'victory' ? 'Victory' : 'Defeat'}</h2>
      <div class="end-actions">
        {outcome === 'defeat' && (
          <button type="button" class="btn" onClick={onRetry}>
            Try again
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
    </div>
  );
}
