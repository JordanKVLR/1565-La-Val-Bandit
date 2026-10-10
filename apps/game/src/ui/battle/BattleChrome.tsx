import type { BattleState, UnitState } from '@m1565/core';
import type { ComponentChildren } from 'preact';
import { useEffect, useId, useState } from 'preact/hooks';
import { t, tParts } from '../../i18n';
import { Button, Icon, Panel, SideMark } from '../design';
import { describeObjectives } from './objectives';

/**
 * The battle HUD's chrome (docs/DESIGN.md): the brief in the top-left corner (battle name,
 * round and whose turn, objectives), the map buttons in the top-right corner, short-lived
 * announcements and the round banner. The turn queue (TurnQueue.tsx) sits between them.
 */

/** A message split around its placeholder, with the words outside it styled as a label. */
function labelled(parts: readonly unknown[]): ComponentChildren {
  return parts.map((p, i) =>
    typeof p === 'string' ? (
      <span key={i} class="bhud-obj__label">
        {p}
      </span>
    ) : (
      (p as ComponentChildren)
    ),
  );
}

/**
 * One calm glass card: the battle's name in small capitals, the round and the unit acting
 * (with its side's mark), and the win condition on one line. The full win and loss
 * conditions open on a tap (or on hover and keyboard focus with a pointer or pad).
 */
export function BattleBrief({
  title,
  state,
  active,
  hidden,
}: {
  title: string;
  state: BattleState;
  active: UnitState | undefined;
  hidden: boolean;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ongoing = state.outcome === 'ongoing';
  const { win, lose } = describeObjectives(state);
  return (
    <header class="bhud-top" hidden={hidden}>
      <Panel elevation={2} compact class="bhud-brief">
        <p class="bhud-brief__title">{title}</p>
        {active && ongoing && (
          <p class="bhud-brief__turn" data-testid="turn-banner">
            <SideMark side={active.side} label={t(`unit.side.${active.side}`)} />
            <span>
              {tParts('battle.turnBanner', {
                round: state.round,
                name: <strong class="bhud-brief__name">{active.name}</strong>,
              })}
            </span>
          </p>
        )}
        {ongoing && (
          <div class={`bhud-obj${open ? ' is-open' : ''}`} data-testid="objective">
            <button
              type="button"
              class="bhud-obj__toggle"
              aria-expanded={open}
              aria-controls={id}
              onClick={() => setOpen((o) => !o)}
            >
              <span class="ds-visually-hidden">{t('battleHud.objectives')}</span>
              <Icon name="flag" class="bhud-obj__icon" />
              <span class="bhud-obj__win">
                {labelled(tParts('battle.win', { objectives: <span>{win}</span> }))}
              </span>
              <Icon name="chevronRight" class="bhud-obj__chevron" />
            </button>
            <p class="bhud-obj__lose" id={id}>
              <Icon name="warning" class="bhud-obj__icon" />
              <span>{labelled(tParts('battle.lose', { conditions: <span>{lose}</span> }))}</span>
            </p>
          </div>
        )}
      </Panel>
    </header>
  );
}

/** Rotate (pointer and touch only; triggers and , . rotate otherwise) and the menu. */
export function MapControls({
  hidden,
  onRotate,
  onMenu,
}: {
  hidden: boolean;
  onRotate: (direction: 1 | -1) => void;
  onMenu: () => void;
}) {
  return (
    <div class="bhud-mapctl" role="group" aria-label={t('battleHud.mapControls')} hidden={hidden}>
      <span class="bhud-mapctl__rotate pointer-only">
        <Button
          variant="ghost"
          label={t('battle.rotateLeft')}
          icon="rotateLeft"
          iconOnly
          onClick={() => onRotate(-1)}
        />
        <Button
          variant="ghost"
          label={t('battle.rotateRight')}
          icon="rotateRight"
          iconOnly
          onClick={() => onRotate(1)}
        />
      </span>
      <Button variant="ghost" label={t('common.menu')} icon="menu" iconOnly onClick={onMenu} />
    </div>
  );
}

/** Short-lived announcements ("Ninu learned a technique"), in a live region that is always there. */
export function Toasts({ notices }: { notices: readonly { id: number; text: string }[] }) {
  return (
    <div class="bhud-toasts" role="status" aria-label={t('battleHud.notices')}>
      {notices.map((n) => (
        <Panel key={n.id} elevation={3} compact class="bhud-toast">
          <Icon name="cross" class="bhud-toast__glyph" />
          <span>{n.text}</span>
        </Panel>
      ))}
    </div>
  );
}

/** How long the round banner stays (ms); it fades in and out within this. */
const ROUND_BANNER_MS = 1700;

/**
 * "Round 2" across the top of the map for a moment when a round begins (and when the battle
 * opens). Decorative: the brief says the round for assistive tech, so this is hidden from it,
 * and it never takes a tap.
 */
export function RoundBanner({ round, enabled }: { round: number; enabled: boolean }) {
  const [shown, setShown] = useState<number | null>(null);
  useEffect(() => {
    if (!enabled) return;
    setShown(round);
    const timer = setTimeout(() => setShown(null), ROUND_BANNER_MS);
    return () => clearTimeout(timer);
    // Only a new round shows it; pausing in a dialog does not.
  }, [round]);
  if (shown === null || !enabled) return null;
  return (
    <div class="bhud-round" aria-hidden="true" key={shown}>
      <Icon name="cross" class="bhud-round__glyph" />
      <span>{t('battleHud.round', { n: shown })}</span>
      <Icon name="cross" class="bhud-round__glyph" />
    </div>
  );
}
