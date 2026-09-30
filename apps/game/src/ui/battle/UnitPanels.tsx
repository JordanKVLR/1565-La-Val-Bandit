import type { BattleState, UnitState } from '@m1565/core';
import { pilotStats, unlockedAttacks } from '@m1565/core';
import { attackStats, attackTags } from './attackText';
import { STAT_INFO } from './statInfo';
import { Portrait } from './StatBars';

/** Compact card for a tapped unit (bottom-left, clear of the action menu). */
export function UnitCard({
  unit,
  state,
  onDetails,
}: {
  unit: UnitState;
  state: BattleState;
  onDetails: () => void;
}) {
  return (
    <aside class={`unit-card side-${unit.side}`} data-testid="unit-card">
      <div class="uc-head">
        <strong>{unit.name}</strong>
        <small>Lv {unit.level}</small>
        <button
          type="button"
          class="btn mini details"
          onClick={onDetails}
          aria-label={`Details for ${unit.name}`}
        >
          Details
        </button>
      </div>
      <span class="uc-line">
        HP {unit.hp}/{unit.maxHp} · AP {unit.ap} · FP {unit.fp}
      </span>
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
            <p>
              HP {unit.hp}/{unit.maxHp} · AP {unit.ap}/{state.balance.apMax} · FP {unit.fp}/
              {state.balance.fpMax} · ARM {unit.arm} · MOV {unit.mov}
            </p>
          </div>
        </header>
        <div class="ud-stats">
          {STAT_INFO.map((s) => (
            <div class="ud-stat" key={s.key} title={s.help}>
              <span>{s.label}</span>
              <b>{stats[s.key]}</b>
              <small>{s.help}</small>
            </div>
          ))}
        </div>
        {unit.side === 'player' && (
          <div class="ud-techniques">
            <span>Techniques</span>
            <ul>
              {techniques.map((a) => (
                <li key={a.id}>
                  <b>{a.name}</b>{' '}
                  <small>{[attackStats(a, unit.weapon), ...attackTags(a)].join(' · ')}</small>
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
