import type { StatName } from '@m1565/core';
import type { Library, RosterEntry } from '@m1565/content';
import { t } from '../../i18n';
import { Button, Chip, Sheet } from '../design';
import { PilotAttributes, PilotSkills } from '../PilotAttributes';
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
        <div class="tr-main">
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
          <PilotAttributes
            lib={lib}
            entry={entry}
            name={name}
            onRaise={(stat) => onRaise(entry.characterId, stat)}
          />
        </div>
        <PilotSkills lib={lib} entry={entry} />
      </div>
    </Sheet>
  );
}
