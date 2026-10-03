import { attackFpCost } from '@m1565/core';
import type { BattleController } from '../../scenes/BattleController';
import { attackStats } from './attackText';
import { techniqueEffects } from './TechniqueCard';

/** The active unit's learned techniques; locked ones stay hidden until unlocked. */
export function AttackMenu({ ctl }: { ctl: BattleController }) {
  const unit = ctl.active();
  if (!unit) return null;
  // Only techniques the pilot has learned are listed; discovering new ones is part of the game.
  const options = ctl.attackOptions().filter((o) => o.unlocked);
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
        {options.map(({ attack, affordable, targets }) => {
          const usable = affordable && targets.length > 0;
          const reason = !affordable ? 'Not enough AP' : !targets.length ? 'No enemy in range' : '';
          return (
            <li key={attack.id}>
              <button
                type="button"
                class="am-item"
                disabled={!usable}
                onClick={() => ctl.chooseTechnique(attack.id)}
              >
                <span class="am-name">{attack.name}</span>
                <span class="am-stats">
                  {attackStats(attack, unit.weapon, attackFpCost(ctl.state, unit, attack))}
                </span>
                {attack.description && <span class="am-desc">{attack.description}</span>}
                {techniqueEffects(attack).length > 0 && (
                  <span class="am-tags">{techniqueEffects(attack).join(' · ')}</span>
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
