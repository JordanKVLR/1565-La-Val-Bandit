import type { AttackForecast, BattleState, Reaction, ReactionChoice, UnitState } from '@m1565/core';
import { attackFpCost } from '@m1565/core';
import { attackTags } from './attackText';
import type { CostPreview } from './StatBars';
import { ArmMovIcons, Portrait, UnitBars } from './StatBars';

const REACTION_LABEL: Record<Reaction, string> = {
  defend: 'Defend',
  avoid: 'Avoid',
  attackBack: 'Attack back',
  counter: 'Counter',
  none: 'Do nothing',
};

/** The odds line under each reaction button. */
function reactionOdds(f: AttackForecast, r: Reaction): string {
  const times = f.hits > 1 ? ` ×${f.hits}` : '';
  if (r === 'counter' && f.counter) {
    return `${f.counter.chance}% to reflect ${f.counter.reflect} · else take ${f.damage.counter}${times}`;
  }
  if (r === 'attackBack' && f.retaliation) {
    return `take ${f.hitChance[r]}% · ${f.damage[r]}${times}, hit back ${f.retaliation.hitChance}% · ${f.retaliation.damage}`;
  }
  return `${f.hitChance[r]}% · ${f.damage[r]} dmg${times}`;
}

interface Props {
  state: BattleState;
  attacker: UnitState;
  defender: UnitState;
  forecast: AttackForecast;
  /** The full reaction menu when the player is the defender; unusable ones are greyed out. */
  choices?: readonly ReactionChoice[];
  onReact?: (r: Reaction) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

function Side({
  unit,
  state,
  extra,
  preview,
}: {
  unit: UnitState;
  state: BattleState;
  extra: string;
  preview?: CostPreview;
}) {
  return (
    <section class={`fc-side fc-${unit.side}`}>
      <div class="fc-head">
        <Portrait name={unit.name} side={unit.side} castId={unit.characterId} />
        <UnitBars unit={unit} balance={state.balance} preview={preview} />
      </div>
      <div class="fc-rows">
        <div class="fc-row">
          <span>{unit.name}</span>
          <span>Lv {unit.level}</span>
        </div>
        <div class="fc-row">
          <span>{unit.weapon.name}</span>
          <ArmMovIcons arm={unit.arm} mov={unit.mov} />
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
  choices,
  onReact,
  onConfirm,
  onCancel,
}: Props) {
  const zone = forecast.zone === 'front' ? '' : ` · ${forecast.zone} attack`;
  const tags = attackTags(forecast.attack);
  const technique = `${forecast.attack.name}${tags.length ? ` (${tags.join(', ')})` : ''}`;
  const assist = forecast.assist ? ` · assist +${forecast.assist}%` : '';
  const answers = [
    forecast.retaliation
      ? `Can strike back: ${forecast.retaliation.hitChance}% · ${forecast.retaliation.damage}`
      : '',
    forecast.counter
      ? `Counter ${forecast.counter.chance}% · reflect ${forecast.counter.reflect}`
      : '',
  ].filter(Boolean);
  const counter =
    forecast.zone === 'rear'
      ? 'Hit from behind: can only avoid'
      : answers.join(' · ') || 'Cannot strike back';
  // The player's own attack: show what it will cost on the attacker's bars.
  const cost: CostPreview | undefined = choices
    ? undefined
    : { ap: forecast.attack.apCost, fp: attackFpCost(state, attacker, forecast.attack) };
  return (
    <div class="forecast" role="dialog" aria-label="Combat forecast">
      <div class="fc-sides">
        <Side
          unit={attacker}
          state={state}
          extra={`${technique}${zone}${assist}`}
          {...(cost ? { preview: cost } : {})}
        />
        <Side unit={defender} state={state} extra={counter} />
      </div>
      <div class="fc-choices">
        {choices ? (
          choices.map((c) => (
            <button
              type="button"
              class={`btn fc-choice${c.reaction === 'none' ? ' ghost' : ''}`}
              key={c.reaction}
              disabled={!c.available}
              onClick={() => onReact?.(c.reaction)}
            >
              <span class="fc-choice-name">{REACTION_LABEL[c.reaction]}</span>
              <span class="fc-choice-odds">
                {c.fpCost > 0 && <span class="fc-cost">FP +{c.fpCost}</span>}
                {c.available ? reactionOdds(forecast, c.reaction) : c.reason}
              </span>
            </button>
          ))
        ) : (
          <>
            <div class="fc-odds" data-testid="forecast-odds">
              Hit {forecast.hitChance.avoid}–{forecast.hitChance.attackBack}% · Dmg{' '}
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
