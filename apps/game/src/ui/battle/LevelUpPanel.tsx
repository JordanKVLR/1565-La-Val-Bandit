import type { StatName, UnitState } from '@m1565/core';
import { meetsRequirements, pilotStats } from '@m1565/core';
import { requirementText } from './attackText';

const STATS: ReadonlyArray<{ key: StatName; label: string; help: string }> = [
  { key: 'str', label: 'STR', help: 'Damage with every attack' },
  { key: 'skl', label: 'SKL', help: 'Accuracy' },
  { key: 'agi', label: 'AGI', help: 'Evasion and turn order' },
];

interface Props {
  unit: Pick<
    UnitState,
    'name' | 'level' | 'statPoints' | 'attacks' | 'str' | 'skl' | 'agi' | 'frameAgility'
  >;
  title?: string;
  onRaise: (stat: StatName) => void;
  onDone: () => void;
  doneLabel?: string;
}

/**
 * Spend level-up points. Shows the techniques that are still locked so the player can see
 * what each point brings them closer to.
 */
export function LevelUpPanel({ unit, title, onRaise, onDone, doneLabel }: Props) {
  const stats = pilotStats(unit);
  const locked = unit.attacks.filter((a) => !meetsRequirements(stats, a)).slice(0, 4);
  return (
    <div class="modal" role="dialog" aria-label="Level up">
      <div class="modal-box levelup">
        <h2>{title ?? `${unit.name} reached level ${unit.level}!`}</h2>
        <p class="points" data-testid="stat-points">
          {unit.statPoints} point{unit.statPoints === 1 ? '' : 's'} to spend
        </p>
        <div class="stat-rows">
          {STATS.map((s) => (
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
        {locked.length > 0 && (
          <div class="next-attacks">
            <span>Still locked</span>
            <ul>
              {locked.map((a) => (
                <li key={a.id}>
                  <b>{a.name}</b> needs {requirementText(a, stats)}
                </li>
              ))}
            </ul>
          </div>
        )}
        <button type="button" class="btn" onClick={onDone}>
          {doneLabel ?? (unit.statPoints > 0 ? 'Save points for later' : 'Continue')}
        </button>
      </div>
    </div>
  );
}
