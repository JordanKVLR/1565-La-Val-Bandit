import type { PilotStats, StatName, UnitState } from '@m1565/core';
import { pilotStats } from '@m1565/core';
import { STAT_INFO } from './statInfo';

interface Props {
  unit: PilotStats & Pick<UnitState, 'name' | 'level' | 'statPoints' | 'frameAgility' | 'maxHp'>;
  title?: string;
  onRaise: (stat: StatName) => void;
  onDone: () => void;
  doneLabel?: string;
}

/** Spend level-up points on any of the seven attributes. Techniques stay a surprise. */
export function LevelUpPanel({ unit, title, onRaise, onDone, doneLabel }: Props) {
  const stats = pilotStats(unit);
  return (
    <div class="modal" role="dialog" aria-label="Level up">
      <div class="modal-box levelup">
        <h2>{title ?? `${unit.name} reached level ${unit.level}!`}</h2>
        <p class="points" data-testid="stat-points">
          {unit.statPoints} point{unit.statPoints === 1 ? '' : 's'} to spend · Max HP {unit.maxHp}
        </p>
        <div class="stat-rows">
          {STAT_INFO.map((s) => (
            <div class="stat-row" key={s.key}>
              <span class="stat-name">{s.label}</span>
              <span class="stat-value">{stats[s.key]}</span>
              <small>{s.help}</small>
              <button
                type="button"
                class="btn icon"
                aria-label={`Raise ${s.label}`}
                disabled={unit.statPoints <= 0}
                onClick={() => onRaise(s.key)}
              >
                +
              </button>
            </div>
          ))}
        </div>
        <p class="hint">New techniques unlock as your stats grow. Experiment to find them.</p>
        <button type="button" class="btn" onClick={onDone}>
          {doneLabel ?? (unit.statPoints > 0 ? 'Save points for later' : 'Continue')}
        </button>
      </div>
    </div>
  );
}
