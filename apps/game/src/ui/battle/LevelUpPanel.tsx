import type { PilotStats, StatName, UnitState } from '@m1565/core';
import { isAttackUnlocked } from '@m1565/core';
import { t } from '../../i18n';
import { Button, Chip, Hint, Meter, Sheet } from '../design';
import { ATTRIBUTE_BAR_MAX, gearNote } from './stats';
import { STAT_INFO } from './statInfo';
import { NewSkillLines } from './XpPanel';

interface Props {
  /** The unit: its top-level attributes include gear, `pilot` holds its own. */
  unit: PilotStats &
    Pick<UnitState, 'name' | 'level' | 'statPoints' | 'maxHp' | 'pilot'> &
    Partial<Pick<UnitState, 'skills' | 'attacks'>>;
  title?: string;
  onRaise: (stat: StatName) => void;
  onDone: () => void;
  doneLabel?: string;
}

/**
 * Spend level-up points on any of the six attributes: each row names the attribute, says what
 * it does, shows it as a meter (gear's share in brackets) and has a 44 px raise button.
 * Techniques that open at this level are announced beside the new skills.
 */
export function LevelUpPanel({ unit, title, onRaise, onDone, doneLabel }: Props) {
  const canRaise = unit.statPoints > 0;
  return (
    <Sheet
      label={t('levelUp.label')}
      title={title ?? t('levelUp.title', { name: unit.name, level: unit.level })}
      closeLabel={t('common.close')}
      onClose={onDone}
      dismissible={false}
      placement="center"
      size="md"
      ornament="cross"
      closeButton={false}
      class="ov-sheet ov-levelup"
      footer={
        <>
          <Hint class="ov-levelup__hint" text={t('levelUp.hint')} />
          <Button
            variant={canRaise ? 'secondary' : 'primary'}
            label={doneLabel ?? (canRaise ? t('levelUp.saveForLater') : t('common.continue'))}
            keyContext="menu"
            onClick={onDone}
          />
        </>
      }
    >
      <div class="ov-levelup__top">
        <Chip
          tone={canRaise ? 'gold' : 'neutral'}
          icon={canRaise ? 'plus' : null}
          testId="stat-points"
          label={t('levelUp.points', { n: unit.statPoints, hp: unit.maxHp })}
        />
        <NewSkillLines
          names={(unit.skills ?? []).filter((s) => s.level === unit.level).map((s) => s.name)}
          techniques={(unit.attacks ?? [])
            .filter((a) => (a.level ?? 1) === unit.level && isAttackUnlocked(unit.level, unit, a))
            .map((a) => a.name)}
        />
      </div>
      <ul class="ov-attrs">
        {STAT_INFO.map((s) => {
          const own = unit.pilot[s.key];
          const geared = unit[s.key];
          const diff = geared - own;
          return (
            <li key={s.key} class="ov-attr">
              <div class="ov-attr__text">
                <Meter
                  label={s.label}
                  kind="neutral"
                  value={geared}
                  max={ATTRIBUTE_BAR_MAX}
                  valueText={diff ? `${geared} ${gearNote(diff)}` : `${geared}`}
                  title={s.help}
                />
                <small class="ov-attr__help">{s.help}</small>
              </div>
              <Button
                class="ov-attr__raise"
                icon="plus"
                iconOnly
                label={t('stat.raise', { stat: s.label })}
                disabled={!canRaise || own >= ATTRIBUTE_BAR_MAX}
                onClick={() => onRaise(s.key)}
              />
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
