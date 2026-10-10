import type { StatName } from '@m1565/core';
import type { Library, RosterEntry } from '@m1565/content';
import { characterSkills } from '@m1565/content';
import { summarize } from '../../campaign/inventory';
import { t } from '../../i18n';
import { ATTRIBUTE_BAR_MAX, gearNote } from '../battle/StatBars';
import { STAT_INFO } from '../battle/statInfo';
import { Button, Chip, Hint, Meter, Sheet, Stat, StatGrid } from '../design';
import { SkillList } from '../SkillList';
import { nameOf } from './model';
import { PilotFace } from './PilotFace';

/**
 * Spending stat points between battles, on a sheet: the pilot (with arrows to the next one),
 * the six attributes as meters with a raise button each while points remain, and the pilot's
 * skills (locked ones keep their padlock and "Unlocks at Lv N").
 */
export function TrainingSheet({
  lib,
  roster,
  pilotId,
  onPilot,
  onRaise,
  onClose,
  onBattle,
}: {
  lib: Library;
  roster: readonly RosterEntry[];
  pilotId: string;
  onPilot: (id: string) => void;
  onRaise: (id: string, stat: StatName) => void;
  onClose: () => void;
  /** Set when opened from To battle: offers to leave the points for later. */
  onBattle: (() => void) | null;
}) {
  const entry = roster.find((r) => r.characterId === pilotId) ?? roster[0]!;
  const i = roster.indexOf(entry);
  const step = (d: number) => onPilot(roster[(i + d + roster.length) % roster.length]!.characterId);
  const name = nameOf(lib, entry.characterId);
  const points = entry.statPoints ?? 0;
  const summary = summarize(lib, entry);
  const skills = characterSkills(lib, entry.characterId);
  const frame = lib.frames.get(entry.frame);
  return (
    <Sheet
      label={t('armoury.training')}
      title={t('armoury.trainingTitle', { name })}
      closeLabel={t('common.close')}
      onClose={onClose}
      placement="center"
      size="lg"
      ornament="cross"
      class="ar-training"
      testId="training-sheet"
      footer={
        onBattle ? (
          <>
            <Button variant="ghost" label={t('armoury.spendLater')} onClick={onBattle} />
            <Button
              variant="primary"
              label={t('armoury.keepTraining')}
              navDefault
              onClick={onClose}
            />
          </>
        ) : (
          <Button variant="primary" label={t('common.done')} navDefault onClick={onClose} />
        )
      }
    >
      <div class="tr-grid">
        <section class="tr-main" aria-label={t('unit.attributes')}>
          <div class="tr-pilot">
            {roster.length > 1 && (
              <Button
                label={t('armoury.prevPilot')}
                icon="back"
                iconOnly
                variant="ghost"
                onClick={() => step(-1)}
              />
            )}
            <PilotFace lib={lib} entry={entry} />
            <div class="tr-pilot__id">
              <span class="tr-pilot__lv">{t('unit.lvUpper', { n: entry.level })}</span>
            </div>
            {points > 0 ? (
              <Chip
                tone="gold"
                icon="plus"
                label={t('roster.pointsToSpend', { n: points })}
                class="tr-points"
              />
            ) : (
              <span class="tr-none">{t('armoury.noPoints')}</span>
            )}
            {roster.length > 1 && (
              <Button
                class="tr-next"
                label={t('armoury.nextPilot')}
                icon="chevronRight"
                iconOnly
                variant="ghost"
                onClick={() => step(1)}
              />
            )}
          </div>
          <h3 class="ar-label">{t('unit.attributes')}</h3>
          <div class={`tr-attrs${points > 0 ? ' can-raise' : ''}`}>
            {STAT_INFO.map((s) => {
              const base = entry.stats[s.key];
              const geared = summary.stats[s.key];
              const diff = geared - base;
              return (
                <div class="tr-attr" key={s.key}>
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
                      class="tr-raise"
                      label={t('roster.raise', { stat: s.label, pilot: name })}
                      icon="plus"
                      iconOnly
                      size="sm"
                      disabled={base >= ATTRIBUTE_BAR_MAX}
                      onClick={() => onRaise(entry.characterId, s.key)}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <StatGrid columns={2} class="tr-stats">
            {frame && <Stat label={t('unit.move')} value={frame.move} />}
            <Stat label={t('stat.hp')} value={summary.hp} />
          </StatGrid>
          <h3 class="ar-label">{t('unit.tab.techniques')}</h3>
          <Hint
            class="tr-tech"
            text={
              summary.techniques.length
                ? summary.techniques.join(t('common.listSep'))
                : t('roster.noTechniques')
            }
          />
        </section>
        {skills.length > 0 && (
          <section class="tr-skills" aria-label={t('roster.skills')}>
            <h3 class="ar-label">{t('roster.skills')}</h3>
            <SkillList skills={skills} level={entry.level} testId="roster-skills" />
          </section>
        )}
      </div>
    </Sheet>
  );
}
