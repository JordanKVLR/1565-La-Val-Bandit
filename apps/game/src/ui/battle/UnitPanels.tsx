import type { BattleState, UnitState } from '@m1565/core';
import { attackFpCost, pilotStats, unlockedAttacks } from '@m1565/core';
import { attackStats, attackTags } from './attackText';
import type { CostPreview } from './StatBars';
import { ArmMovIcons, AttributeBars, Portrait, UnitBars } from './StatBars';

/**
 * Compact card for a unit (bottom-left, clear of the action menu): HP/AP/FP bars, armour and
 * movement. `preview` shows what the action being set up will cost.
 */
export function UnitCard({
  unit,
  state,
  onDetails,
  preview,
  testId = 'unit-card',
}: {
  unit: UnitState;
  state: BattleState;
  onDetails: () => void;
  preview?: CostPreview | undefined;
  testId?: string;
}) {
  return (
    <aside class={`unit-card side-${unit.side}`} data-testid={testId}>
      <div class="uc-head">
        <strong>{unit.name}</strong>
        <small>Lv {unit.level}</small>
        <ArmMovIcons arm={unit.arm} mov={unit.mov} />
        <button
          type="button"
          class="btn mini details"
          onClick={onDetails}
          aria-label={`Details for ${unit.name}`}
        >
          Details
        </button>
      </div>
      <UnitBars unit={unit} balance={state.balance} preview={preview} />
      {unit.side === 'player' && (
        <span class="xp-line" data-testid="unit-xp">
          XP {unit.xp}/{state.balance.xpPerLevel}
          <span class="xp-track">
            <span style={{ width: `${(unit.xp / state.balance.xpPerLevel) * 100}%` }} />
          </span>
          {unit.statPoints > 0 && <b> +{unit.statPoints} pts</b>}
        </span>
      )}
    </aside>
  );
}

/** Full sheet for a unit: all seven attributes, equipment and learned techniques. */
export function UnitDetails({
  unit,
  state,
  onClose,
  onSpend,
}: {
  unit: UnitState;
  state: BattleState;
  onClose: () => void;
  onSpend?: () => void;
}) {
  const stats = pilotStats(unit);
  // Enemies' techniques stay a mystery; your own are listed.
  const techniques = unit.side === 'player' ? unlockedAttacks(unit) : [];
  return (
    <div class="modal" role="dialog" aria-label={`${unit.name} details`} onClick={onClose}>
      <div class="modal-box details-box" onClick={(e) => e.stopPropagation()}>
        <header class="ud-head">
          <Portrait name={unit.name} side={unit.side} castId={unit.characterId} />
          <div>
            <h2>{unit.name}</h2>
            <p>
              Lv {unit.level}
              {unit.side === 'player' ? ` · XP ${unit.xp}/${state.balance.xpPerLevel}` : ''} ·{' '}
              {unit.weapon.name}
            </p>
          </div>
          <ArmMovIcons arm={unit.arm} mov={unit.mov} />
        </header>
        <div class="ud-body">
          <UnitBars unit={unit} balance={state.balance} />
          <AttributeBars stats={stats} help />
        </div>
        {unit.side === 'player' && (
          <div class="ud-techniques">
            <span>Techniques</span>
            <ul>
              {techniques.map((a) => (
                <li key={a.id}>
                  <b>{a.name}</b>{' '}
                  <small>
                    {[
                      attackStats(a, unit.weapon, attackFpCost(state, unit, a)),
                      ...attackTags(a),
                    ].join(' · ')}
                  </small>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div class="menu-row">
          {onSpend && unit.statPoints > 0 && (
            <button type="button" class="btn" onClick={onSpend}>
              Spend {unit.statPoints} points
            </button>
          )}
          <button type="button" class="btn ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
