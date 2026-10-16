import type { StatName } from '@m1565/core';
import { useState } from 'preact/hooks';
import type { Library, RosterEntry } from '@m1565/content';
import { t } from '../../i18n';
import { Button, Chip, Sheet } from '../design';
import { PilotAttributes, PilotSkills } from '../PilotAttributes';
import { nameOf } from './model';
import { PilotFace } from './PilotFace';
import { bonusText } from '../battle/statInfo';

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
  onPromote,
  onClose,
  onBattle,
}: {
  lib: Library;
  roster: readonly RosterEntry[];
  pilotId: string;
  onPilot: (id: string) => void;
  onRaise: (id: string, stat: StatName) => void;
  onPromote: (id: string, classId: string) => void;
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
      closeButton={false}
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
              navBack
              onClick={onClose}
            />
          </>
        ) : (
          <Button variant="primary" label={t('common.done')} navDefault navBack onClick={onClose} />
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
        <PromotionPanel
          key={entry.characterId}
          lib={lib}
          entry={entry}
          name={name}
          onPromote={(classId) => onPromote(entry.characterId, classId)}
        />
      </div>
    </Sheet>
  );
}

/**
 * Promotion at the promotion level: pick one of the classes, once. Each shows its stat package
 * and skill; choosing asks to confirm, because the choice is final.
 */
function PromotionPanel({
  lib,
  entry,
  name,
  onPromote,
}: {
  lib: Library;
  entry: RosterEntry;
  name: string;
  onPromote: (classId: string) => void;
}) {
  const [pick, setPick] = useState<string | null>(null);
  const need = lib.balance.promotionLevel;
  const chosen = entry.class ? lib.classes.get(entry.class) : undefined;
  if (chosen) {
    return (
      <section class="tr-promo" data-testid="promotion">
        <h3 class="tr-promo__h">{t('promotion.title')}</h3>
        <p class="tr-promo__done">
          <Chip tone="gold" icon="star" label={t('promotion.class', { name: chosen.name })} />
          <span>
            {chosen.skill.name}: {chosen.skill.description}
          </span>
        </p>
      </section>
    );
  }
  if (entry.level < need) {
    return (
      <section class="tr-promo" data-testid="promotion">
        <h3 class="tr-promo__h">{t('promotion.title')}</h3>
        <p class="tr-promo__hint">{t('promotion.hint', { n: need })}</p>
      </section>
    );
  }
  const picked = pick ? lib.classes.get(pick) : undefined;
  return (
    <section class="tr-promo" data-testid="promotion">
      <h3 class="tr-promo__h">{t('promotion.title')}</h3>
      <p class="tr-promo__hint">{t('promotion.ready', { name })}</p>
      <ul class="tr-promo__list">
        {[...lib.classes.values()].map((c) => (
          <li key={c.id} class="tr-class" data-testid={`class-${c.id}`}>
            <div class="tr-class__text">
              <b>{c.name}</b>
              <small>{c.description}</small>
              <small>
                {bonusText(c.bonus as Partial<Record<StatName, number>>)}
                {t('common.sep')}
                {c.skill.name}: {c.skill.description}
              </small>
            </div>
            <Button label={t('promotion.choose')} onClick={() => setPick(c.id)} />
          </li>
        ))}
      </ul>
      {picked && (
        <div class="tr-promo__confirm" role="alertdialog" aria-label={t('promotion.title')}>
          <span>{t('promotion.confirm', { name, class: picked.name })}</span>
          <Button variant="ghost" label={t('promotion.cancel')} onClick={() => setPick(null)} />
          <Button
            variant="primary"
            label={t('promotion.promote')}
            testId="confirm-promotion"
            onClick={() => onPromote(picked.id)}
          />
        </div>
      )}
    </section>
  );
}
