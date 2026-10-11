import type { StatName } from '@m1565/core';
import type { Library, RosterEntry } from '@m1565/content';
import { characterSkills } from '@m1565/content';
import { summarize } from '../campaign/inventory';
import { t } from '../i18n';
import { ATTRIBUTE_BAR_MAX, gearNote } from './battle/stats';
import { STAT_INFO } from './battle/statInfo';
import { Hint, Meter, Stat, StatGrid } from './design';
import { Button } from './design';
import { SkillList } from './SkillList';

/**
 * A pilot between battles (styles in pilot.css): the six attributes as meters, with gear's
 * share in brackets and a raise button each while points remain, then movement and HP and the
 * techniques this loadout allows. The Armoury's training sheet and the Results screen's
 * "Raise attributes" sheet both draw it, so spending points looks the same everywhere.
 */
export function PilotAttributes({
  lib,
  entry,
  name,
  onRaise,
}: {
  lib: Library;
  entry: RosterEntry;
  /** The pilot's display name, for the raise buttons' accessible names. */
  name: string;
  onRaise: (stat: StatName) => void;
}) {
  const points = entry.statPoints ?? 0;
  const summary = summarize(lib, entry);
  const frame = lib.frames.get(entry.frame);
  return (
    <section class="pa" aria-label={t('unit.attributes')}>
      <h3 class="pa-label">{t('unit.attributes')}</h3>
      <div class={`pa-attrs${points > 0 ? ' can-raise' : ''}`}>
        {STAT_INFO.map((s) => {
          const base = entry.stats[s.key];
          const geared = summary.stats[s.key];
          const diff = geared - base;
          return (
            <div class="pa-attr" key={s.key}>
              <Meter
                label={s.label}
                title={s.help}
                kind="neutral"
                value={geared}
                max={ATTRIBUTE_BAR_MAX}
                valueText={diff ? `${geared} ${gearNote(diff)}` : `${geared}`}
              />
              {points > 0 && (
                <Button
                  class="pa-raise"
                  label={t('roster.raise', { stat: s.label, pilot: name })}
                  icon="plus"
                  iconOnly
                  size="sm"
                  disabled={base >= ATTRIBUTE_BAR_MAX}
                  onClick={() => onRaise(s.key)}
                />
              )}
            </div>
          );
        })}
      </div>
      <StatGrid columns={2} class="pa-stats">
        {frame && <Stat label={t('unit.move')} value={frame.move} />}
        <Stat label={t('stat.hp')} value={summary.hp} />
      </StatGrid>
      <h3 class="pa-label">{t('unit.tab.techniques')}</h3>
      <Hint
        class="pa-tech"
        text={
          summary.techniques.length
            ? summary.techniques.join(t('common.listSep'))
            : t('roster.noTechniques')
        }
      />
    </section>
  );
}

/** The pilot's skills under a small label; locked ones show the level they unlock at. */
export function PilotSkills({ lib, entry }: { lib: Library; entry: RosterEntry }) {
  const skills = characterSkills(lib, entry.characterId);
  if (!skills.length) return null;
  return (
    <section class="pa-skills" aria-label={t('roster.skills')}>
      <h3 class="pa-label">{t('roster.skills')}</h3>
      <SkillList skills={skills} level={entry.level} testId="roster-skills" />
    </section>
  );
}
