import type { Attack, PilotStats, Weapon } from '@m1565/core';
import { attackRange } from '@m1565/core';
import { t } from '../../i18n';
import { rangeText, requirementText, techniqueEffects } from './attackText';

export { techniqueEffects };

/**
 * A technique explained in full: description, plain-language effects and every number. Used in
 * the unit details sheet and the Armoury; the attack menu shows a compact version.
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
  const r = attackRange(attack, weapon);
  const hits = attack.hits ?? 1;
  const req = requirementText(attack, stats);
  const effects = techniqueEffects(attack);
  return (
    <div class={`tech-card${compact ? ' compact' : ''}`}>
      <div class="tc-head">
        <strong class="tc-name">{attack.name}</strong>
        <span class="tc-style">{t(`attackStyle.${attack.style}`)}</span>
      </div>
      {attack.description && <p class="tc-desc">{attack.description}</p>}
      {effects.length > 0 && (
        <ul class="tc-effects">
          {effects.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <dl class="tc-numbers">
        <div>
          <dt>{t('tech.power')}</dt>
          <dd>
            {Math.round(attack.power * 100)}%{hits > 1 ? ` ×${hits}` : ''}
          </dd>
        </div>
        <div>
          <dt>{t('tech.hit')}</dt>
          <dd>
            {attack.accuracy > 0 ? '+' : attack.accuracy < 0 ? '−' : '±'}
            {Math.abs(attack.accuracy)}%
          </dd>
        </div>
        <div>
          <dt>{t('stat.ap')}</dt>
          <dd>{attack.apCost}</dd>
        </div>
        <div>
          <dt>{t('stat.fp')}</dt>
          <dd>{fpCost}</dd>
        </div>
        <div>
          <dt>{t('tech.range')}</dt>
          <dd>{rangeText(r.min, r.max)}</dd>
        </div>
      </dl>
      {!compact && req && <p class="tc-req">{t('tech.needs', { requirements: req })}</p>}
    </div>
  );
}
