import type { BattleController } from '../../scenes/BattleController';

export function ActionMenu({ ctl }: { ctl: BattleController }) {
  const unit = ctl.active();
  if (!unit) return null;
  return (
    <nav class="action-menu" aria-label="Actions">
      <div class="action-title">{unit.name}</div>
      <button
        type="button"
        class="btn action"
        disabled={!ctl.canMove()}
        onClick={() => ctl.chooseMove()}
      >
        Move
      </button>
      <button
        type="button"
        class="btn action"
        disabled={!ctl.canAttack()}
        onClick={() => ctl.chooseAttack()}
      >
        Attack
      </button>
      {ctl.canUndo() && (
        <button type="button" class="btn action" onClick={() => ctl.undoMove()}>
          Undo
        </button>
      )}
      <button type="button" class="btn action end" onClick={() => ctl.chooseEndTurn()}>
        End Turn
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
          {confirm}
        </button>
      )}
      <button type="button" class="btn ghost" onClick={onCancel}>
        Back
      </button>
    </div>
  );
}
