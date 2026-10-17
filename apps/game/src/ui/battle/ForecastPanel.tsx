import type { AttackForecast, BattleState, Reaction, ReactionChoice, UnitState } from '@m1565/core';
import { attackBackOptions, chooseReaction, forecastAttack, NO_REACTION } from '@m1565/core';
import { useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { IconName } from '../design';
import { Button, Chip, Divider, Icon, Meter, SideMark } from '../design';
import { attackTags } from './attackText';
import type { ForecastSide } from './forecastModel';
import { forecastModel, hitChips } from './forecastModel';
import { reasonText } from './reasons';
import { ScrollArea } from './ScrollArea';
import { Portrait } from './Portrait';
import { frameName, portraitIdFor } from './vb';

/** Command names, as in the classic reaction menu ("Attack" is Attack back). */
const reactionLabel = (r: Reaction): string => t(`reaction.${r}`);

/** A shape for each reaction, so the list scans without reading (and never by colour). */
const REACTION_ICON: Record<Reaction, IconName> = {
  defend: 'shield',
  avoid: 'dodge',
  attackBack: 'attack',
  counter: 'counter',
  none: 'dash',
};

interface Props {
  state: BattleState;
  attacker: UnitState;
  defender: UnitState;
  forecast: AttackForecast;
  /** The full reaction menu when the player is the defender; unusable ones say why. */
  choices?: readonly ReactionChoice[];
  /** With Attack back, also the technique chosen to strike back with. */
  onReact?: (r: Reaction, backAttackId?: string) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  /** A heading over the comparison ("Levend attacks! How do you respond?"). */
  heading?: string;
}

const pct = (n: number) => t('overlay.pct', { n: Math.max(0, Math.round(n)) });
const times = (damage: number, hits: number) =>
  hits > 1 ? t('overlay.times', { damage, n: hits }) : `${damage}`;

/** One side of the comparison: who, what it does, its odds and its meters after the exchange. */
function SideColumn({
  side,
  state,
  verb,
  verbIcon,
  note,
  chips,
  mayFall,
  role,
}: {
  side: ForecastSide;
  state: BattleState;
  verb: string;
  verbIcon: IconName;
  note?: string | undefined;
  chips: readonly string[];
  mayFall: boolean;
  role: 'attacker' | 'defender';
}) {
  const u = side.unit;
  return (
    <section class={`ov-side ov-side--${role}`} aria-label={u.name}>
      <header class="ov-side__head">
        <div class={`bhud-avatar side-${u.side}`}>
          <Portrait name={u.name} side={u.side} castId={portraitIdFor(u)} />
          <SideMark side={u.side} label={t(`unit.side.${u.side}`)} />
        </div>
        <div class="ov-side__id">
          <strong class="ov-side__name">{u.name}</strong>
          <span class="ov-side__line">
            {t('overlay.unitLine', { level: u.level, frame: frameName(u) })}
          </span>
        </div>
      </header>
      <p class="ov-side__verb">
        <Icon name={verbIcon} class="ov-side__verb-icon" />
        <span>{verb}</span>
      </p>
      <dl class="ov-odds">
        <div class="ov-odd ov-odd--hit">
          <dt>{t('stat.hit')}</dt>
          <dd class={side.hit === null ? 'is-none' : undefined}>
            {side.hit === null ? '—' : pct(side.hit)}
          </dd>
        </div>
        <div class="ov-odd">
          <dt>{t('stat.dmg')}</dt>
          <dd class={side.damage === null ? 'is-none' : undefined}>
            {side.damage === null ? '—' : times(side.damage, side.hits)}
          </dd>
        </div>
      </dl>
      <div class="ov-side__meters" title={t('overlay.forecast.ifHit')}>
        <Meter
          label={t('stat.hp')}
          kind="hp"
          value={u.hp}
          max={u.maxHp}
          delta={side.hpAfter - u.hp}
        />
        <Meter
          label={t('stat.ap')}
          kind="ap"
          value={u.ap}
          max={state.balance.apMax}
          delta={-side.apCost}
        />
        <Meter
          label={t('stat.fp')}
          kind="fp"
          value={u.fp}
          max={state.balance.fpMax}
          delta={side.fpGain}
        />
      </div>
      {note && <p class="ov-side__note">{note}</p>}
      {(chips.length > 0 || mayFall) && (
        <div class="ov-chips">
          {mayFall && <Chip tone="danger" label={t('overlay.forecast.mayFall')} />}
          {chips.map((c) => (
            <Chip key={c} icon={null} label={c} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * The combat forecast: attacker against defender, side by side, with HP before → after as
 * meter previews, the odds and damage of each, and the modifiers as chips. For the player's own
 * attack it shows the enemy's intended reaction and Go! / Back; when the player is attacked,
 * the reactions list each option with its FP cost (or why it can't be chosen), picking one
 * previews it, and Go! confirms.
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
  heading,
}: Props) {
  // The first real reaction is pre-selected; 'none' only when the defender is too Spent to react.
  const firstChoice = choices?.find((c) => c.available)?.reaction ?? NO_REACTION;
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
  const choice = choices?.find((c) => c.reaction === reaction);
  const m = forecastModel({ state, attacker, defender, forecast: f, reaction, back, choice });

  // Every term of each hit chance is listed, so a gap between the two sides is never a mystery
  // (stats, flank, ground, height, allies, fatigue, skills). A blow that is not being dodged gets
  // the not-dodging bonus; Defend and Counter are certain, so they list none.
  const noDodge = state.balance.counterHitBonus;
  const attackChips = [
    ...hitChips(
      f.hitParts,
      f.zone,
      reaction === 'defend' || reaction === 'counter' || reaction === 'avoid' ? 0 : noDodge,
    ),
    // Defending makes the blow twice as likely to land (the number shown is already doubled).
    ...(reaction === 'defend' ? [t('overlay.mod.defendDouble')] : []),
    // Several strikes already show beside the damage.
    ...attackTags(f.attack).slice(f.hits > 1 ? 1 : 0),
    // What the blow is worth in XP when you strike (the level gap, in words and a number).
    ...(attacker.side === 'player' && f.xpGap > 1
      ? [t('overlay.xp.tougher', { n: f.xpGap })]
      : attacker.side === 'player' && f.xpGap < 1
        ? [t('overlay.xp.weaker', { n: f.xpGap })]
        : []),
  ];
  const defenderChips =
    reaction === 'attackBack' && back ? hitChips(back.hitParts, back.zone, noDodge) : [];
  const attackNote =
    reaction === 'counter' && f.counter
      ? t('forecast.counterDamage', {
          damage: times(f.damage.counter, f.hits),
          reflect: f.counter.reflect,
        })
      : undefined;
  const defenderNote =
    reaction === 'attackBack' && back
      ? t(f.kind ? 'forecast.strikesBackUnlessDowned' : 'forecast.strikesBack', {
          damage: times(back.damage, back.hits),
        })
      : reaction === 'counter' && f.counter
        ? t('forecast.reflects', { n: f.counter.reflect })
        : reaction === 'defend'
          ? t(f.kind === 'knockdown' ? 'forecast.halvesHolds' : 'forecast.halves')
          : reaction === 'avoid'
            ? t('forecast.dodges')
            : t('forecast.takes');

  return (
    <section
      class={`ds-panel ds-elev-3 ds-outlined ov-panel ov-forecast${choices ? ' is-react' : ''}`}
      role="dialog"
      aria-label={t('forecast.label')}
    >
      {heading && (
        <header class="ov-forecast__heading">
          <h2 class="ov-title">{heading}</h2>
        </header>
      )}
      <div class="ov-forecast__body">
        <div class="ov-duel">
          <SideColumn
            role="attacker"
            side={m.attacker}
            state={state}
            verb={f.attack.name}
            verbIcon="attack"
            note={attackNote}
            chips={attackChips}
            mayFall={m.attackerMayFall}
          />
          <div class="ov-vs">
            <Divider vertical class="ov-vs__rule" />
            <Icon name="attack" class="ov-vs__mark" label={t('overlay.forecast.versus')} />
            <Divider vertical class="ov-vs__rule" />
          </div>
          <SideColumn
            role="defender"
            side={m.defender}
            state={state}
            verb={m.defender.techniqueName ?? reactionLabel(reaction)}
            verbIcon={REACTION_ICON[reaction]}
            note={defenderNote}
            chips={defenderChips}
            mayFall={m.defenderMayFall}
          />
        </div>
        <nav
          class="ov-forecast__actions"
          aria-label={choices ? t('forecast.reactions') : t('battle.action.attack')}
        >
          {choices && pickingBack ? (
            <>
              <span class="ov-label">{t('forecast.strikeBackWith')}</span>
              <ScrollArea class="ov-options">
                {backOptions.map((o) => {
                  const r = o.available ? backForecast(o.attack.id) : undefined;
                  const on = o.attack.id === backId;
                  return (
                    <button
                      type="button"
                      key={o.attack.id}
                      class={`ov-option fc-choice${on ? ' is-pressed' : ''}`}
                      disabled={!o.available}
                      aria-pressed={on}
                      onClick={() => {
                        setBackId(o.attack.id);
                        setPickingBack(false);
                      }}
                    >
                      <span class="ov-option__name">{o.attack.name}</span>
                      {r ? (
                        <small class="ov-option__meta">
                          {t('forecast.backOption', {
                            fp: o.fpCost,
                            hit: r.hitChance,
                            damage: times(r.damage, r.hits),
                          })}
                        </small>
                      ) : (
                        <small class="ov-option__reason">
                          <Icon name="warning" class="ov-option__reason-icon" />
                          {o.reason ? reasonText(o.reason) : ''}
                        </small>
                      )}
                    </button>
                  );
                })}
              </ScrollArea>
              <Button
                variant="ghost"
                size="sm"
                icon="back"
                label={t('common.back')}
                block
                onClick={() => setPickingBack(false)}
              />
            </>
          ) : choices ? (
            <>
              <span class="ov-label">{t('overlay.reaction.pick')}</span>
              <ScrollArea class="ov-options">
                {choices.every((c) => !c.available) && (
                  <p class="ov-option__reason" role="status">
                    {t('forecast.spent')}
                  </p>
                )}
                {choices.map((c) => {
                  const on = c.reaction === picked;
                  return (
                    <button
                      type="button"
                      key={c.reaction}
                      class={`ov-option fc-choice${on ? ' is-pressed' : ''}`}
                      disabled={!c.available}
                      aria-pressed={on}
                      onClick={() => {
                        setPicked(c.reaction);
                        if (c.reaction === 'attackBack') setPickingBack(true);
                      }}
                    >
                      <Icon name={REACTION_ICON[c.reaction]} class="ov-option__icon" />
                      <span class="ov-option__name">{reactionLabel(c.reaction)}</span>
                      {c.available ? (
                        c.reaction === 'attackBack' && back ? (
                          <small class="ov-option__meta">
                            {t('forecast.backChoice', { attack: back.attackName, fp: back.fpCost })}
                          </small>
                        ) : (
                          c.fpCost > 0 && (
                            <small class="ov-option__meta">
                              {t('forecast.fp', { n: c.fpCost })}
                            </small>
                          )
                        )
                      ) : (
                        <small class="ov-option__reason">
                          <Icon name="warning" class="ov-option__reason-icon" />
                          {c.reason ? reasonText(c.reason) : ''}
                        </small>
                      )}
                    </button>
                  );
                })}
              </ScrollArea>
              <Button
                variant="primary"
                size="lg"
                label={t('forecast.go')}
                icon="confirm"
                keyHint="confirm"
                testId="react-go"
                block
                class="ov-go"
                onClick={() => onReact?.(picked, picked === 'attackBack' ? backId : undefined)}
              />
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                label={t('common.back')}
                icon="back"
                keyHint="back"
                navBack
                block
                onClick={onCancel}
              />
              <Button
                variant="primary"
                size="lg"
                label={t('forecast.go')}
                icon="confirm"
                keyHint="confirm"
                block
                class="ov-go"
                onClick={onConfirm}
              />
            </>
          )}
        </nav>
      </div>
    </section>
  );
}
