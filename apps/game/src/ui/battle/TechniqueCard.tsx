import type { Attack, PilotStats, Weapon } from '@m1565/core';
import { attackRange } from '@m1565/core';
import { t } from '../../i18n';
import { Chip, cx, Icon } from '../design';
import { rangeText, requirementText, techniqueEffects } from './attackText';

export { techniqueEffects };

/** "+10%", "−25%" or "±0%": a technique's accuracy modifier. */
export function signedPct(n: number): string {
  return t('overlay.pctSigned', { sign: n > 0 ? '+' : n < 0 ? '−' : '±', n: Math.abs(n) });
}

/**
 * A technique's numbers in one row: power, accuracy and range, then what it costs (AP and FP)
 * set apart on the right. Labels in small capitals, values in tabular figures. `inline` puts
 * each label beside its value (the attack list); otherwise the label sits over it (cards).
 */
export function TechniqueNumbers({
  attack,
  weapon,
  fpCost = attack.fpCost,
  inline = false,
}: {
  attack: Attack;
  weapon: Weapon;
  fpCost?: number;
  inline?: boolean;
}) {
  const r = attackRange(attack, weapon);
  const hits = attack.hits ?? 1;
  const cell = (label: string, value: string, cost = false, title?: string) => (
    <div class={cx('ov-num', cost && 'ov-num--cost')} title={title}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
  return (
    <dl class={cx('ov-nums', inline && 'ov-nums--inline')}>
      {cell(
        t('overlay.num.pow'),
        hits > 1
          ? t('overlay.times', { damage: t('overlay.pct', { n: Math.round(attack.power * 100) }), n: hits })
          : t('overlay.pct', { n: Math.round(attack.power * 100) }),
        false,
        t('tech.power'),
      )}
      {cell(t('stat.hit'), signedPct(attack.accuracy), false, t('tech.hit'))}
      {cell(t('overlay.num.range'), rangeText(r.min, r.max), false, t('tech.range'))}
      {cell(t('stat.ap'), `${attack.apCost}`, true)}
      {cell(t('stat.fp'), `${fpCost}`, true)}
    </dl>
  );
}

/** What a technique does, in plain words, each with a small gold mark. */
export function TechniqueEffects({ attack }: { attack: Attack }) {
  const effects = techniqueEffects(attack);
  if (!effects.length) return null;
  return (
    <ul class="ov-effects">
      {effects.map((e) => (
        <li key={e}>
          <Icon name="diamond" class="ov-effects__mark" />
          {e}
        </li>
      ))}
    </ul>
  );
}

/**
 * A technique explained in full: name and style, description, plain-language effects and every
 * number. Used in the unit details sheet; the attack list shows the same pieces on demand.
 */
export function TechniqueCard({
  attack,
  weapon,
  fpCost = attack.fpCost,
  stats,
  compact = false,
}: {
  attack: Attack;
  weapon: Weapon;
  /** FP as this unit would pay it (defaults to the technique's own). */
  fpCost?: number;
  /** The pilot's attributes, to show unmet requirements. */
  stats?: PilotStats;
  compact?: boolean;
}) {
  const req = requirementText(attack, stats);
  return (
    <article class={cx('ov-tc', compact && 'ov-tc--compact')}>
      <header class="ov-tc__head">
        <h4 class="ov-tc__name">{attack.name}</h4>
        <Chip icon={null} class="ov-tc__style" label={t(`attackStyle.${attack.style}`)} />
      </header>
      {attack.description && <p class="ov-tc__desc">{attack.description}</p>}
      <TechniqueEffects attack={attack} />
      <TechniqueNumbers attack={attack} weapon={weapon} fpCost={fpCost} />
      {!compact && req && <p class="ov-tc__req">{t('tech.needs', { requirements: req })}</p>}
    </article>
  );
}
