import type { AttackForecast, BattleState, Reaction, ReactionChoice, UnitState } from '@m1565/core';
import { assistFor, attackFpCost, chooseReaction } from '@m1565/core';
import { useState } from 'preact/hooks';
import { attackTags } from './attackText';
import { Portrait } from './StatBars';
import { AssistGrid, frameName, pad2, VbBars } from './vb';

/** Command names, as in the classic reaction menu. */
const REACTION_LABEL: Record<Reaction, string> = {
  defend: 'Defend',
  avoid: 'Avoid',
  attackBack: 'Attack',
  counter: 'Counter',
  none: 'Do nothing',
};

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

/** The hit chance the defender's panel shows for its reaction: its own strike, or "---". */
function defenderOdds(f: AttackForecast, r: Reaction): string {
  if (r === 'attackBack' && f.retaliation) return `${f.retaliation.hitChance}`;
  if (r === 'counter' && f.counter) return `${f.counter.chance}`;
  return '---';
}

function Side({
  unit,
  state,
  assist,
  line,
  odds,
  detail,
  ap,
  fp,
}: {
  unit: UnitState;
  state: BattleState;
  assist: {
    bonus: number;
    allies: readonly { x: number; y: number }[];
    center: { x: number; y: number };
  };
  line: string;
  odds: string;
  detail: string;
  ap?: number;
  fp?: number;
}) {
  return (
    <section class={`vb-panel vb-side fc-${unit.side}`}>
      <div class="vb-side-top">
        <Portrait name={unit.name} side={unit.side} castId={unit.characterId} />
        <VbBars unit={unit} balance={state.balance} ap={ap ?? 0} fp={fp ?? 0} />
      </div>
      <div class="vb-rows">
        <div class="vb-row">
          <span class="vb-name">{unit.name}</span>
          <span>
            <small>LV</small> {unit.level}
          </span>
        </div>
        <div class="vb-row">
          <span>{frameName(unit)}</span>
          <AssistGrid center={assist.center} allies={assist.allies} />
        </div>
        <div class="vb-row">
          <span>Assist +{pad2(assist.bonus)}%</span>
        </div>
        <div class="vb-row vb-action">
          <span class="vb-name">{line}</span>
          <span>{odds} %</span>
        </div>
        <div class="vb-detail">{detail}</div>
      </div>
    </section>
  );
}

/**
 * Combat forecast in the classic layout: attacker and defender panels side by side, and a
 * command list. For the player's own attack it shows the enemy's intended reaction (Go / Back);
 * when the player is attacked, picking a command previews it and Go! confirms.
 */
export function ForecastPanel({
  state,
  attacker,
  defender,
  forecast: f,
  choices,
  onReact,
  onConfirm,
  onCancel,
}: Props) {
  const firstChoice =
    choices?.find((c) => c.available && c.reaction !== 'none')?.reaction ?? 'none';
  const [picked, setPicked] = useState<Reaction>(firstChoice);
  // On the player's turn, the enemy's reaction is decided up front and shown, as in the classic.
  const reaction: Reaction = choices
    ? picked
    : defender.controller === 'ai'
      ? chooseReaction(state, defender.id, attacker.id, f.attack.id)
      : 'defend';
  const times = f.hits > 1 ? ` ×${f.hits}` : '';
  const tags = attackTags(f.attack);
  const zone = f.zone === 'front' ? '' : ` · ${f.zone}`;
  const attackDetail =
    reaction === 'counter' && f.counter
      ? `${f.damage.counter}${times} dmg, or ${f.counter.reflect} back to you`
      : `${f.damage[reaction]}${times} dmg${zone}${tags.length ? ` · ${tags.join(', ')}` : ''}`;
  const choice = choices?.find((c) => c.reaction === reaction);
  const defenderDetail =
    reaction === 'attackBack' && f.retaliation
      ? `strikes back for ${f.retaliation.damage}`
      : reaction === 'counter' && f.counter
        ? `reflects ${f.counter.reflect} on success`
        : reaction === 'defend'
          ? 'halves the blow'
          : reaction === 'avoid'
            ? 'tries to dodge'
            : 'takes the blow';
  const atkAssist = { ...assistFor(state, attacker, defender.pos), center: defender.pos };
  const defAssist = { ...assistFor(state, defender, attacker.pos), center: attacker.pos };

  return (
    <div class={`vb-forecast${choices ? ' react' : ''}`} role="dialog" aria-label="Combat forecast">
      <div class="vb-sides">
        <Side
          unit={attacker}
          state={state}
          assist={atkAssist}
          line={f.attack.name}
          odds={pad2(f.hitChance[reaction])}
          detail={attackDetail}
          {...(choices ? {} : { ap: f.attack.apCost, fp: attackFpCost(state, attacker, f.attack) })}
        />
        <Side
          unit={defender}
          state={state}
          assist={defAssist}
          line={REACTION_LABEL[reaction]}
          odds={defenderOdds(f, reaction)}
          detail={defenderDetail}
          {...(choice ? { fp: choice.fpCost } : {})}
        />
      </div>
      <nav class="vb-commands" aria-label={choices ? 'Reactions' : 'Attack'}>
        {choices ? (
          <>
            <button
              type="button"
              class="vb-cmd go"
              data-testid="react-go"
              onClick={() => onReact?.(picked)}
            >
              Go!
            </button>
            {choices.map((c) => (
              <button
                type="button"
                key={c.reaction}
                class={`vb-cmd fc-choice${c.reaction === picked ? ' on' : ''}`}
                disabled={!c.available}
                aria-pressed={c.reaction === picked}
                title={c.reason}
                onClick={() => setPicked(c.reaction)}
              >
                <span>{REACTION_LABEL[c.reaction]}</span>
                {c.available ? (
                  c.fpCost > 0 && <small>FP {c.fpCost}</small>
                ) : (
                  <small class="why">{c.reason}</small>
                )}
              </button>
            ))}
          </>
        ) : (
          <>
            <button type="button" class="vb-cmd go" onClick={onConfirm}>
              Go!
            </button>
            <button type="button" class="vb-cmd" onClick={onCancel}>
              Back
            </button>
          </>
        )}
      </nav>
    </div>
  );
}
