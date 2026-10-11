import { useEffect, useState } from 'preact/hooks';
import { t, tParts } from '../../i18n';
import { Button, Chip, Icon, Meter, Sheet } from '../design';

export interface XpGain {
  readonly unitId: string;
  readonly name: string;
  readonly xp: number;
  readonly levelBefore: number;
  readonly xpBefore: number;
  readonly levelAfter: number;
  readonly xpAfter: number;
  /** Names of pilot skills gained with the level-ups in this exchange. */
  readonly newSkills?: readonly string[];
}

/** "New skill: X" lines (a level-up announcement), each with the active-skill star. */
export function NewSkillLines({ names }: { names: readonly string[] }) {
  if (!names.length) return null;
  return (
    <ul class="ov-newskills" data-testid="new-skill">
      {names.map((name) => (
        <li key={name}>
          <Icon name="star" class="ov-newskills__mark" />
          <span>{tParts('skills.newSkill', { name: <b>{name}</b> })}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Experience earned in the last exchange, shown until tapped away: each unit's XP meter fills
 * from where it was, through any level-up, to where it is now.
 */
export function XpPanel({
  gains,
  xpPerLevel,
  onDone,
}: {
  gains: readonly XpGain[];
  xpPerLevel: number;
  onDone: () => void;
}) {
  // Start at the old value, then let the meter's transition carry it to the new one.
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <Sheet
      label={t('xp.title')}
      closeLabel={t('common.continue')}
      onClose={onDone}
      placement="center"
      size="sm"
      ornament="cross"
      closeButton={false}
      class="ov-sheet ov-xp"
      testId="xp-panel"
      footer={
        <Button
          variant="primary"
          label={t('common.continue')}
          keyHint="confirm"
          keyContext="menu"
          navDefault
          testId="xp-continue"
          onClick={onDone}
        />
      }
    >
      <ul class="ov-xp__gains">
        {gains.map((g) => {
          const levelled = g.levelAfter > g.levelBefore;
          const start = levelled ? 0 : g.xpBefore;
          return (
            <li key={g.unitId} class="ov-xp__gain">
              <div class="ov-xp__head">
                <strong class="ov-xp__name">{g.name}</strong>
                <span class="ov-xp__plus">{t('xp.gain', { n: g.xp })}</span>
              </div>
              <Meter
                label={t('stat.xp')}
                kind="xp"
                value={filled ? g.xpAfter : start}
                max={xpPerLevel}
                valueText={t('unit.lv', { n: g.levelAfter })}
                class="ov-xp__meter"
              />
              <div class="ov-xp__foot">
                {levelled && (
                  <Chip
                    tone="gold"
                    icon="star"
                    label={t('xp.levelUp', { from: g.levelBefore, to: g.levelAfter })}
                  />
                )}
                <small class="ov-xp__progress">
                  {t('overlay.xp.progress', {
                    xp: g.xpAfter,
                    max: xpPerLevel,
                    left: xpPerLevel - g.xpAfter,
                  })}
                </small>
              </div>
              <NewSkillLines names={g.newSkills ?? []} />
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
