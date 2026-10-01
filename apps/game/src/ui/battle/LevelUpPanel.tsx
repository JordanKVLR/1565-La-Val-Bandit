import type { PilotStats, StatName, UnitState } from '@m1565/core';
import { AttributeBars } from './StatBars';

interface Props {
  /** The unit: its top-level attributes include gear, `pilot` holds its own. */
  unit: PilotStats & Pick<UnitState, 'name' | 'level' | 'statPoints' | 'maxHp' | 'pilot'>;
  title?: string;
  onRaise: (stat: StatName) => void;
  onDone: () => void;
  doneLabel?: string;
}

/** Spend level-up points on any of the six attributes. Techniques stay a surprise. */
export function LevelUpPanel({ unit, title, onRaise, onDone, doneLabel }: Props) {
  return (
    <div class="modal" role="dialog" aria-label="Level up">
      <div class="modal-box levelup">
        <h2>{title ?? `${unit.name} reached level ${unit.level}!`}</h2>
        <p class="points" data-testid="stat-points">
          {unit.statPoints} point{unit.statPoints === 1 ? '' : 's'} to spend · Max HP {unit.maxHp}
        </p>
        <AttributeBars
          stats={unit.pilot}
          geared={unit}
          help
          onRaise={onRaise}
          canRaise={unit.statPoints > 0}
        />
        <p class="hint">New techniques unlock as your attributes grow. Experiment to find them.</p>
        <button type="button" class="btn" onClick={onDone}>
          {doneLabel ?? (unit.statPoints > 0 ? 'Save points for later' : 'Continue')}
        </button>
      </div>
    </div>
  );
}
