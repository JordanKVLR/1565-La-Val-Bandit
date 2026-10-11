import { t } from '../../i18n';
import { Button, Divider, Hint } from '../design';

interface Props {
  outcome: 'victory' | 'defeat';
  onRetry: () => void;
  onContinue: () => void;
  continueLabel?: string;
  /** Shown under the actions after a defeat: what retrying costs. */
  retryNote?: string;
}

/**
 * The end of a battle, over the dimmed map: the outcome in large inscriptional capitals over a
 * gold rule, one line under it, and the actions. After a defeat, Retry battle is the main action
 * (ADR 0007) and Give up asks for a second press, since it lets the defeat stand.
 */
export function EndOverlay({
  outcome,
  onRetry,
  onContinue,
  continueLabel = t('common.continue'),
  retryNote,
}: Props) {
  const victory = outcome === 'victory';
  const title = victory ? t('battle.victory') : t('battle.defeat');
  return (
    <div class={`end-overlay ov-end ov-end--${outcome}`} role="dialog" aria-label={title}>
      <div class="ov-end__inner">
        <h2 class="ov-end__title">{title}</h2>
        <Divider glyph={victory ? 'cross' : undefined} class="ov-end__rule" />
        <p class="ov-end__line">
          {victory ? t('overlay.end.victoryLine') : t('overlay.end.defeatLine')}
        </p>
        <div class="ov-end__actions">
          {victory ? (
            <Button
              variant="primary"
              size="lg"
              label={continueLabel}
              navDefault
              onClick={onContinue}
            />
          ) : (
            <>
              <Button
                variant="danger"
                label={t('battle.giveUp')}
                confirmLabel={t('overlay.end.giveUpConfirm')}
                onClick={onContinue}
              />
              <Button
                variant="primary"
                size="lg"
                icon="undo"
                label={t('battle.retry')}
                navDefault
                onClick={onRetry}
              />
            </>
          )}
        </div>
        {!victory && retryNote && <Hint class="ov-end__note" text={retryNote} />}
      </div>
    </div>
  );
}
