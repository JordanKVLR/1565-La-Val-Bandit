import type { BattleController } from '../../scenes/BattleController';
import { t } from '../../i18n';
import { KeyHint } from '../KeyHint';

/**
 * The active unit's commands. While `moving`, its movement range is on the map (the default at
 * the start of a turn) and Move shows as selected.
 */
export function ActionMenu({ ctl, moving = false }: { ctl: BattleController; moving?: boolean }) {
  const unit = ctl.active();
  if (!unit) return null;
  return (
    <nav class="action-menu" aria-label={t('battle.actions')}>
      <div class="action-title">{unit.name}</div>
      <button
        type="button"
        class={`btn action${moving ? ' on' : ''}`}
        aria-pressed={moving}
        disabled={!ctl.canMove()}
        onClick={() => ctl.chooseMove()}
        title={moving ? t('battle.moveTip') : undefined}
      >
        {t('battle.action.move')} <KeyHint action="move" />
      </button>
      <button
        type="button"
        class="btn action"
        disabled={!ctl.canAttack()}
        onClick={() => ctl.chooseAttack()}
      >
        {t('battle.action.attack')} <KeyHint action="attack" />
      </button>
      {ctl.canUndo() && (
        <button type="button" class="btn action" onClick={() => ctl.undoMove()}>
          {t('battle.action.undo')} <KeyHint action="undo" />
        </button>
      )}
      <button type="button" class="btn action end" onClick={() => ctl.chooseEndTurn()}>
        {t('battle.action.endTurn')} <KeyHint action="endTurn" />
      </button>
    </nav>
  );
}

export function SubModeBar({
  label,
  onCancel,
  confirm,
  onConfirm,
}: {
  label: string;
  onCancel: () => void;
  confirm?: string;
  onConfirm?: () => void;
}) {
  return (
    <div class="submode">
      <span>{label}</span>
      {confirm && onConfirm && (
        <button type="button" class="btn" onClick={onConfirm}>
          {confirm} <KeyHint action="confirm" />
        </button>
      )}
      <button type="button" class="btn ghost" onClick={onCancel}>
        {t('common.back')} <KeyHint action="back" />
      </button>
    </div>
  );
}
