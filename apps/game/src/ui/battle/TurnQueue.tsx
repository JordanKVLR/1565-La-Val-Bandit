import type { BattleState } from '@m1565/core';
import { findUnit } from '@m1565/core';
import { t } from '../../i18n';

/** Upcoming units this round, current first. */
export function TurnQueue({ state }: { state: BattleState }) {
  const upcoming = state.turnOrder
    .slice(Math.max(0, state.turnIndex))
    .map((id) => findUnit(state, id))
    .filter((u) => u && !u.defeated)
    .slice(0, 7);
  return (
    <ol class="turn-queue" aria-label={t('battle.turnOrder')}>
      {upcoming.map((u, i) => (
        <li key={u!.id} class={`tq-${u!.side} ${i === 0 ? 'now' : ''}`} title={u!.name}>
          {u!.name.charAt(0)}
        </li>
      ))}
    </ol>
  );
}
