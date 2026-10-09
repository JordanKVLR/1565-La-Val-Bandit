import type { PilotStats, StatName, UnitState } from '@m1565/core';
import { AttributeBars } from './StatBars';
import { NewSkills } from '../SkillList';
import { t } from '../../i18n';

interface Props {
  /** The unit: its top-level attributes include gear, `pilot` holds its own. */
  unit: PilotStats &
    Pick<UnitState, 'name' | 'level' | 'statPoints' | 'maxHp' | 'pilot'> &
    Partial<Pick<UnitState, 'skills'>>;
  title?: string;
  onRaise: (stat: StatName) => void;
  onDone: () => void;
  doneLabel?: string;
}

/** Spend level-up points on any of the six attributes. Techniques stay a surprise. */
export function LevelUpPanel({ unit, title, onRaise, onDone, doneLabel }: Props) {
  return (
    <div class="modal" role="dialog" aria-label={t('levelUp.label')}>
      <div class="modal-box levelup">
        <h2>{title ?? t('levelUp.title', { name: unit.name, level: unit.level })}</h2>
        <p class="points" data-testid="stat-points">
          {t('levelUp.points', { n: unit.statPoints, hp: unit.maxHp })}
        </p>
        <NewSkills
          names={(unit.skills ?? []).filter((s) => s.level === unit.level).map((s) => s.name)}
        />
        <AttributeBars
          stats={unit.pilot}
          geared={unit}
          help
          onRaise={onRaise}
          canRaise={unit.statPoints > 0}
        />
        <p class="hint">{t('levelUp.hint')}</p>
        <button type="button" class="btn" onClick={onDone}>
          {doneLabel ?? (unit.statPoints > 0 ? t('levelUp.saveForLater') : t('common.continue'))}
        </button>
      </div>
    </div>
  );
}
