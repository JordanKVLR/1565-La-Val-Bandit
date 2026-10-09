import type { AttackForecast, BattleState, Reaction, ReactionChoice, UnitState } from '@m1565/core';
import {
  assistFor,
  attackBackOptions,
  attackFpCost,
  chooseReaction,
  forecastAttack,
} from '@m1565/core';
import { useState } from 'preact/hooks';
import { t } from '../../i18n';
import { attackTags } from './attackText';
import { reasonText } from './reasons';
import { Portrait } from './StatBars';
import { AssistGrid, frameName, pad2, portraitIdFor, VbBars } from './vb';

/** Command names, as in the classic reaction menu ("Attack" is Attack back). */
const reactionLabel = (r: Reaction): string => t(`reaction.${r}`);

interface Props {
  state: BattleState;
  attacker: UnitState;
  defender: UnitState;
  forecast: AttackForecast;
  /** The full reaction menu when the player is the defender; unusable ones are greyed out. */
  choices?: readonly ReactionChoice[];
  /** With Attack back, also the technique chosen to strike back with. */
  onReact?: (r: Reaction, backAttackId?: string) => void;
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
        <Portrait name={unit.name} side={unit.side} castId={portraitIdFor(unit)} />
        <VbBars unit={unit} balance={state.balance} ap={ap ?? 0} fp={fp ?? 0} />
      </div>
      <div class="vb-rows">
        <div class="vb-row">
          <span class="vb-name">{unit.name}</span>
          <span>
            <small>{t('forecast.lv')}</small> {unit.level}
          </span>
        </div>
        <div class="vb-row">
          <span>{frameName(unit)}</span>
          <AssistGrid center={assist.center} allies={assist.allies} />
        </div>
        <div class="vb-row">
          <span>{t('forecast.assist', { n: pad2(assist.bonus) })}</span>
        </div>
        <div class="vb-row vb-action">
          <span class="vb-name">{line}</span>
          <span>{t('forecast.odds', { n: odds })}</span>
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
  // Attack back opens a technique list; the default is the main attack (or what reaches).
  const [backId, setBackId] = useState<string | undefined>(f.retaliation?.attackId);
  const [pickingBack, setPickingBack] = useState(false);
  const backOptions = choices ? attackBackOptions(state, defender, attacker.pos) : [];
  const backForecast = (id: string) =>
    forecastAttack(state, attacker, defender, attacker.pos, f.attack, id).retaliation;
  const back = choices && backId ? backForecast(backId) : f.retaliation;
  // On the player's turn, the enemy's reaction is decided up front and shown, as in the classic.
  const reaction: Reaction = choices
    ? picked
    : defender.controller === 'ai'
      ? chooseReaction(state, defender.id, attacker.id, f.attack.id)
      : 'defend';
  const times = f.hits > 1 ? ` ×${f.hits}` : '';
  const tags = attackTags(f.attack);
  const attackDetail =
    reaction === 'counter' && f.counter
      ? t('forecast.counterDamage', {
          damage: `${f.damage.counter}${times}`,
          reflect: f.counter.reflect,
        })
      : [
          t('forecast.damage', { damage: `${f.damage[reaction]}${times}` }),
          f.zone === 'front' ? null : t(`forecast.zone.${f.zone}`),
          tags.length ? tags.join(t('common.listSep')) : null,
        ]
          .filter((p) => p !== null)
          .join(t('common.sep'));
  const choice = choices?.find((c) => c.reaction === reaction);
  const defenderDetail =
    reaction === 'attackBack' && back
      ? t('forecast.strikesBack', {
          damage: `${back.damage}${back.hits > 1 ? ` ×${back.hits}` : ''}`,
        })
      : reaction === 'counter' && f.counter
        ? t('forecast.reflects', { n: f.counter.reflect })
        : reaction === 'defend'
          ? t('forecast.halves')
          : reaction === 'avoid'
            ? t('forecast.dodges')
            : t('forecast.takes');
  const atkAssist = { ...assistFor(state, attacker, defender.pos), center: defender.pos };
  const defAssist = { ...assistFor(state, defender, attacker.pos), center: attacker.pos };

  return (
    <div
      class={`vb-forecast${choices ? ' react' : ''}`}
      role="dialog"
      aria-label={t('forecast.label')}
    >
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
          line={reaction === 'attackBack' && back ? back.attackName : reactionLabel(reaction)}
          odds={reaction === 'attackBack' && back ? `${back.hitChance}` : defenderOdds(f, reaction)}
          detail={defenderDetail}
          {...(choice
            ? { fp: reaction === 'attackBack' && back ? back.fpCost : choice.fpCost }
            : {})}
        />
      </div>
      <nav
        class="vb-commands"
        aria-label={choices ? t('forecast.reactions') : t('battle.action.attack')}
      >
        {choices && pickingBack ? (
          <>
            <div class="vb-cmd-head">{t('forecast.strikeBackWith')}</div>
            {backOptions.map((o) => {
              const r = o.available ? backForecast(o.attack.id) : undefined;
              return (
                <button
                  type="button"
                  key={o.attack.id}
                  class={`vb-cmd fc-choice${o.attack.id === backId ? ' on' : ''}`}
                  disabled={!o.available}
                  aria-pressed={o.attack.id === backId}
                  title={o.reason ? reasonText(o.reason) : undefined}
                  onClick={() => {
                    setBackId(o.attack.id);
                    setPickingBack(false);
                  }}
                >
                  <span>{o.attack.name}</span>
                  {r ? (
                    <small>
                      {t('forecast.backOption', {
                        fp: o.fpCost,
                        hit: r.hitChance,
                        damage: `${r.damage}${r.hits > 1 ? `×${r.hits}` : ''}`,
                      })}
                    </small>
                  ) : (
                    <small class="why">{o.reason ? reasonText(o.reason) : ''}</small>
                  )}
                </button>
              );
            })}
            <button type="button" class="vb-cmd" onClick={() => setPickingBack(false)}>
              {t('common.back')}
            </button>
          </>
        ) : choices ? (
          <>
            <button
              type="button"
              class="vb-cmd go"
              data-testid="react-go"
              onClick={() => onReact?.(picked, picked === 'attackBack' ? backId : undefined)}
            >
              {t('forecast.go')}
            </button>
            {choices.map((c) => (
              <button
                type="button"
                key={c.reaction}
                class={`vb-cmd fc-choice${c.reaction === picked ? ' on' : ''}`}
                disabled={!c.available}
                aria-pressed={c.reaction === picked}
                title={c.reason ? reasonText(c.reason) : undefined}
                onClick={() => {
                  setPicked(c.reaction);
                  if (c.reaction === 'attackBack') setPickingBack(true);
                }}
              >
                <span>{reactionLabel(c.reaction)}</span>
                {c.available ? (
                  c.reaction === 'attackBack' && back ? (
                    <small>
                      {t('forecast.backChoice', { attack: back.attackName, fp: back.fpCost })}
                    </small>
                  ) : (
                    c.fpCost > 0 && <small>{t('forecast.fp', { n: c.fpCost })}</small>
                  )
                ) : (
                  <small class="why">{c.reason ? reasonText(c.reason) : ''}</small>
                )}
              </button>
            ))}
          </>
        ) : (
          <>
            <button type="button" class="vb-cmd go" onClick={onConfirm}>
              {t('forecast.go')}
            </button>
            <button type="button" class="vb-cmd" onClick={onCancel}>
              {t('common.back')}
            </button>
          </>
        )}
      </nav>
    </div>
  );
}
