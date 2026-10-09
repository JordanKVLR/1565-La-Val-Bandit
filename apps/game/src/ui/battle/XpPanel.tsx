import { useEffect, useState } from 'preact/hooks';
import { NewSkills } from '../SkillList';
import { t } from '../../i18n';

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

/**
 * Experience earned in the last exchange, shown until tapped away: each unit's XP bar fills
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
  // Start at the old value, then let CSS animate the bar to the new one.
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(t);
  }, []);
  const pct = (xp: number) => `${Math.min(100, (xp / xpPerLevel) * 100)}%`;
  return (
    <div class="modal xp-modal" role="dialog" aria-label={t('xp.title')} onClick={onDone}>
      <div class="modal-box xp-panel" data-testid="xp-panel">
        <h2>{t('xp.title')}</h2>
        <ul class="xp-gains">
          {gains.map((g) => {
            const levelled = g.levelAfter > g.levelBefore;
            return (
              <li key={g.unitId}>
                <div class="xp-head">
                  <strong>{g.name}</strong>
                  <span class="xp-plus">{t('xp.gain', { n: g.xp })}</span>
                </div>
                <span class="xp-track wide" aria-hidden="true">
                  <span
                    class={levelled ? 'over' : ''}
                    style={{
                      width: filled ? pct(g.xpAfter) : pct(levelled ? 0 : g.xpBefore),
                    }}
                  />
                </span>
                <small>
                  {levelled ? (
                    <b class="xp-level">
                      {t('xp.levelUp', { from: g.levelBefore, to: g.levelAfter })}
                    </b>
                  ) : (
                    t('unit.lv', { n: g.levelAfter })
                  )}{' '}
                  {t('xp.progress', {
                    xp: g.xpAfter,
                    max: xpPerLevel,
                    left: xpPerLevel - g.xpAfter,
                  })}
                </small>
                <NewSkills names={g.newSkills ?? []} />
              </li>
            );
          })}
        </ul>
        <button type="button" class="btn go" data-testid="xp-continue" onClick={onDone}>
          {t('common.continue')}
        </button>
      </div>
    </div>
  );
}
