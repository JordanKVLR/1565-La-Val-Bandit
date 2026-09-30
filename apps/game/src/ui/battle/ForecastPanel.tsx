import type { AttackForecast, BattleState, Reaction, UnitState } from '@m1565/core';
import { attackTags } from './attackText';
import { Portrait, UnitBars } from './StatBars';

const REACTION_LABEL: Record<Reaction, string> = {
  defend: 'Defend',
  avoid: 'Avoid',
  counter: 'Counter',
};

interface Props {
  state: BattleState;
  attacker: UnitState;
  defender: UnitState;
  forecast: AttackForecast;
  /** Reactions offered to the player when they are the defender. */
  reactions?: readonly Reaction[];
  onReact?: (r: Reaction) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

function Side({ unit, state, extra }: { unit: UnitState; state: BattleState; extra: string }) {
  return (
    <section class={`fc-side fc-${unit.side}`}>
      <div class="fc-head">
        <Portrait name={unit.name} side={unit.side} castId={unit.characterId} />
        <UnitBars unit={unit} apMax={state.balance.apMax} fpMax={state.balance.fpMax} />
      </div>
      <div class="fc-rows">
        <div class="fc-row">
          <span>{unit.name}</span>
          <span>Lv {unit.level}</span>
        </div>
        <div class="fc-row">
          <span>{unit.weapon.name}</span>
          <span>ARM {unit.arm}</span>
        </div>
        <div class="fc-row fc-extra">{extra}</div>
      </div>
    </section>
  );
}

/**
 * Side-by-side combat forecast. Used for the player's own attacks (Go / Cancel) and, with
 * `reactions`, for choosing Defend / Avoid / Counter when an enemy attacks the player.
 */
export function ForecastPanel({
  state,
  attacker,
  defender,
  forecast,
  reactions,
  onReact,
  onConfirm,
  onCancel,
}: Props) {
  const zone = forecast.zone === 'front' ? '' : ` · ${forecast.zone} attack`;
  const tags = attackTags(forecast.attack);
  const technique = `${forecast.attack.name}${tags.length ? ` (${tags.join(', ')})` : ''}`;
  const assist = forecast.assist ? ` · assist +${forecast.assist}%` : '';
  const counter = forecast.counter
    ? `Counter: ${forecast.counter.hitChance}% · ${forecast.counter.damage} dmg`
    : 'Cannot counter';
  return (
    <div class="forecast" role="dialog" aria-label="Combat forecast">
      <div class="fc-sides">
        <Side unit={attacker} state={state} extra={`${technique}${zone}${assist}`} />
        <Side unit={defender} state={state} extra={counter} />
      </div>
      <div class="fc-choices">
        {reactions ? (
          reactions.map((r) => (
            <button type="button" class="btn fc-choice" key={r} onClick={() => onReact?.(r)}>
              <span class="fc-choice-name">{REACTION_LABEL[r]}</span>
              <span class="fc-choice-odds">
                {forecast.hitChance[r]}% · {forecast.damage[r]} dmg
              </span>
            </button>
          ))
        ) : (
          <>
            <div class="fc-odds" data-testid="forecast-odds">
              Hit {forecast.hitChance.avoid}–{forecast.hitChance.counter}% · Dmg{' '}
              {forecast.damage.avoid}
              {forecast.hits > 1 ? ` ×${forecast.hits}` : ''}
              <small> ({forecast.damage.defend} if defended)</small>
            </div>
            <button type="button" class="btn go" onClick={onConfirm}>
              Go!
            </button>
            <button type="button" class="btn ghost" onClick={onCancel}>
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
