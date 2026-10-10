import type { BattleState, UnitState } from '@m1565/core';
import { findUnit } from '@m1565/core';
import { t } from '../../i18n';
import { portraitUrl } from '../../render/art';
import { useArtRevision } from '../useArt';
import { portraitIdFor } from './vb';

/** How many units the queue shows: the one acting and those after it this round. */
const QUEUE_LENGTH = 7;

/** The units still to act this round, current first. */
export function upcomingUnits(state: BattleState, length = QUEUE_LENGTH): UnitState[] {
  return state.turnOrder
    .slice(Math.max(0, state.turnIndex))
    .map((id) => findUnit(state, id))
    .filter((u): u is UnitState => !!u && !u.defeated)
    .slice(0, length);
}

/**
 * The turn order as a slim glass rail of tokens (top centre). Each token is the unit's
 * portrait (or initial) in its side's shape and colour, a circle for yours and a diamond for
 * the enemy's. The unit acting now is larger, ringed and pointed at by a caret, and a hairline
 * separates it from the rest: told by shape, size and position, not by colour.
 */
export function TurnQueue({ state }: { state: BattleState }) {
  useArtRevision();
  const upcoming = upcomingUnits(state);
  return (
    <ol class="bhud-queue" aria-label={t('battle.turnOrder')}>
      {upcoming.map((u, i) => {
        const url = portraitUrl(portraitIdFor(u));
        const side = t(`unit.side.${u.side}`);
        return [
          // A hairline between the unit acting now and the ones still to come.
          i === 1 && (
            <li key="sep" class="bhud-queue__sep" role="presentation" aria-hidden="true" />
          ),
          <li
            key={u.id}
            class={`bhud-queue__token side-${u.side}${i === 0 ? ' is-now' : ''}`}
            aria-current={i === 0 ? 'step' : undefined}
            title={u.name}
          >
            <span class="bhud-queue__face" aria-hidden="true">
              {url ? <img src={url} alt="" /> : <span>{u.name.charAt(0)}</span>}
            </span>
            <span class="ds-visually-hidden">
              {i === 0
                ? t('battleHud.queueNow', { name: u.name, side })
                : t('battleHud.queueUnit', { name: u.name, side })}
            </span>
          </li>,
        ];
      })}
    </ol>
  );
}
