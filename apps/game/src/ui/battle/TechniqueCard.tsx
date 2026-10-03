import type { Attack, PilotStats, Weapon } from '@m1565/core';
import { attackRange, RANGED_STYLES } from '@m1565/core';
import { requirementText } from './attackText';

/** What a technique does, in plain words (e.g. "Strikes twice", "Ignores half of DEF"). */
export function techniqueEffects(a: Attack): string[] {
  const out: string[] = [];
  const hits = a.hits ?? 1;
  if (hits > 1)
    out.push(`Strikes ${hits === 2 ? 'twice' : `${hits} times`}, each blow rolled separately`);
  if (a.pierce)
    out.push(
      a.pierce >= 0.99
        ? "Ignores the target's DEF"
        : a.pierce >= 0.5
          ? `Ignores ${a.pierce === 0.5 ? 'half' : `${Math.round(a.pierce * 100)}%`} of the target's DEF`
          : `Ignores ${Math.round(a.pierce * 100)}% of the target's DEF`,
    );
  if (a.fatigue) out.push(`Tires the target: +${a.fatigue} FP`);
  if (a.apDamage) out.push(`Shakes the target: −${a.apDamage} AP for its next actions`);
  if (a.noCounter) out.push("Can't be answered with Attack back or Counter");
  if (RANGED_STYLES.has(a.style)) out.push('Ranged: reloading and smoke cost extra FP');
  if ((a.maxRange ?? 1) >= 2 && !RANGED_STYLES.has(a.style))
    out.push('Reaches an enemy two tiles away');
  if (a.power >= 1.3) out.push('Heavy: a big wind-up, very tiring');
  if (a.accuracy >= 10) out.push('Accurate: easier to land');
  else if (a.accuracy <= -25) out.push('Wild: hard to land');
  return out;
}

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
  const range = r.min === r.max ? `${r.max}` : `${r.min}–${r.max}`;
  const hits = attack.hits ?? 1;
  const req = requirementText(attack, stats);
  const effects = techniqueEffects(attack);
  return (
    <div class={`tech-card${compact ? ' compact' : ''}`}>
      <div class="tc-head">
        <strong class="tc-name">{attack.name}</strong>
        <span class="tc-style">{attack.style}</span>
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
          <dt>Power</dt>
          <dd>
            {Math.round(attack.power * 100)}%{hits > 1 ? ` ×${hits}` : ''}
          </dd>
        </div>
        <div>
          <dt>Hit</dt>
          <dd>
            {attack.accuracy > 0 ? '+' : attack.accuracy < 0 ? '−' : '±'}
            {Math.abs(attack.accuracy)}%
          </dd>
        </div>
        <div>
          <dt>AP</dt>
          <dd>{attack.apCost}</dd>
        </div>
        <div>
          <dt>FP</dt>
          <dd>{fpCost}</dd>
        </div>
        <div>
          <dt>Range</dt>
          <dd>{range}</dd>
        </div>
      </dl>
      {!compact && req && <p class="tc-req">Needs {req}</p>}
    </div>
  );
}
