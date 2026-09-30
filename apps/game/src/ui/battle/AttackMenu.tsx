import { pilotStats } from '@m1565/core';
import type { BattleController } from '../../scenes/BattleController';
import { attackStats, attackTags, requirementText } from './attackText';

/** The active unit's techniques: usable ones first, locked ones with what they still need. */
export function AttackMenu({ ctl }: { ctl: BattleController }) {
  const unit = ctl.active();
  if (!unit) return null;
  const stats = pilotStats(unit);
  const options = [...ctl.attackOptions()].sort((a, b) => Number(b.unlocked) - Number(a.unlocked));
  return (
    <div class="attack-menu" role="dialog" aria-label="Choose an attack">
      <header class="am-head">
        <strong>{unit.name}</strong>
        <span>
          AP {unit.ap} · {unit.weapon.name}
        </span>
        <button type="button" class="btn ghost" onClick={() => ctl.cancel()}>
          Back
        </button>
      </header>
      <ul class="am-list">
        {options.map(({ attack, unlocked, affordable, targets }) => {
          const usable = unlocked && affordable && targets.length > 0;
          const reason = !unlocked
            ? `Needs ${requirementText(attack, stats)}`
            : !affordable
              ? 'Not enough AP'
              : !targets.length
                ? 'No enemy in range'
                : '';
          return (
            <li key={attack.id}>
              <button
                type="button"
                class={`am-item ${unlocked ? '' : 'locked'}`}
                disabled={!usable}
                onClick={() => ctl.chooseTechnique(attack.id)}
              >
                <span class="am-name">
                  {unlocked ? '' : '🔒 '}
                  {attack.name}
                </span>
                <span class="am-stats">{attackStats(attack, unit.weapon)}</span>
                {attackTags(attack).length > 0 && (
                  <span class="am-tags">{attackTags(attack).join(' · ')}</span>
                )}
                {reason && <span class="am-reason">{reason}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
