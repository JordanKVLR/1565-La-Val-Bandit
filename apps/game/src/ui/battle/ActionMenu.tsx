import { useRef } from 'preact/hooks';
import type { BattleController } from '../../scenes/BattleController';
import { t } from '../../i18n';
import type { AnchorSource, Insets } from '../design';
import {
  ActionBar,
  ActionBarSeparator,
  Button,
  Panel,
  PHONE_QUERY,
  useAnchor,
  useMediaQuery,
} from '../design';

/**
 * Margins the anchored bar keeps inside the anchor layer: the HUD along the top, the screen
 * edge, and in TV mode the title-safe area (the layer reaches past it, like the canvas).
 */
function layerInsets(layer: HTMLElement): Insets {
  const safeX = Math.max(0, -layer.offsetLeft);
  const safeY = Math.max(0, -layer.offsetTop);
  const edge = 12;
  return { top: safeY + 64, right: safeX + edge, bottom: safeY + edge, left: safeX + edge };
}

/**
 * The active unit's commands as a slim bar. On wide screens (Deck, desktop, TV) it stands
 * beside the unit on the map and follows the camera; on phones it docks to the bottom edge.
 * While `moving`, the unit's movement range is on the map (the default at the start of a turn)
 * and Move shows as pressed.
 */
export function ActionMenu({
  ctl,
  moving = false,
  anchor,
}: {
  ctl: BattleController;
  moving?: boolean;
  /** Where the active unit is on screen; without it the bar docks like on a phone. */
  anchor?: AnchorSource | null;
}) {
  const bar = useRef<HTMLElement>(null);
  const docked = useMediaQuery(PHONE_QUERY) || !anchor;
  useAnchor(bar, anchor ?? null, !docked, layerInsets, { gap: 48, lift: 28 });
  const unit = ctl.active();
  if (!unit) return null;
  return (
    <ActionBar
      as="nav"
      label={t('battle.actions')}
      orientation={docked ? 'horizontal' : 'vertical'}
      class={`bhud-actions${docked ? ' is-docked' : ''}`}
      barRef={bar}
    >
      <Button
        label={t('battle.action.move')}
        icon="move"
        keyHint="move"
        pressed={moving}
        disabled={!ctl.canMove()}
        onClick={() => ctl.chooseMove()}
        title={moving ? t('battle.moveTip') : undefined}
      />
      <Button
        label={t('battle.action.attack')}
        icon="attack"
        keyHint="attack"
        disabled={!ctl.canAttack()}
        onClick={() => ctl.chooseAttack()}
      />
      {ctl.canUndo() && (
        <Button
          label={t('battle.action.undo')}
          icon="undo"
          keyHint="undo"
          onClick={() => ctl.undoMove()}
        />
      )}
      <ActionBarSeparator />
      <Button
        label={t('battle.action.endTurn')}
        icon="endTurn"
        keyHint="endTurn"
        onClick={() => ctl.chooseEndTurn()}
      />
    </ActionBar>
  );
}

/** A slim prompt for a step in progress (route preview, picking a target), with its buttons. */
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
    <Panel elevation={2} compact class="bhud-submode" role="group" aria-label={label}>
      <span class="bhud-submode__text">{label}</span>
      {confirm && onConfirm && (
        <Button
          variant="primary"
          label={confirm}
          icon="confirm"
          keyHint="confirm"
          onClick={onConfirm}
        />
      )}
      <Button
        variant="ghost"
        label={t('common.back')}
        icon="back"
        keyHint="back"
        onClick={onCancel}
      />
    </Panel>
  );
}
