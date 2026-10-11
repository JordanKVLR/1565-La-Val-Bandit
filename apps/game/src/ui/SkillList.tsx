import type { Skill } from '@m1565/core';
import { t } from '../i18n';
import { Icon } from './design';

/**
 * A pilot's skills as hairline rows (styles in pilot.css): active ones with a star and "Active",
 * locked ones dimmed, on a dashed rule, with a padlock and "Unlocks at Lv N", so the state reads
 * by shape and wording as well as tone. `fresh` marks skills just gained (a "New" tag).
 */
export function SkillList({
  skills,
  level,
  fresh = [],
  hideLocked = false,
  testId = 'skill-list',
}: {
  skills: readonly Skill[];
  level: number;
  fresh?: readonly string[];
  hideLocked?: boolean;
  testId?: string;
}) {
  const shown = hideLocked ? skills.filter((s) => s.level <= level) : skills;
  if (!shown.length) return <p class="skill-none">{t('skills.none')}</p>;
  return (
    <ul class="skill-list" data-testid={testId}>
      {shown.map((s) => {
        const locked = s.level > level;
        return (
          <li
            key={s.id}
            class={`skill-row ${locked ? 'locked' : 'active'}`}
            data-testid={`skill-${s.id}`}
            aria-label={t(locked ? 'skills.ariaLocked' : 'skills.ariaActive', {
              name: s.name,
              level: s.level,
              description: s.description ?? '',
            })}
          >
            <Icon name={locked ? 'lock' : 'star'} class="skill-icon" />
            <span class="skill-body">
              <span class="skill-head">
                <b class="skill-name">{s.name}</b>
                {fresh.includes(s.id) && <span class="skill-new">{t('skills.new')}</span>}
                <small class="skill-state">
                  {t(locked ? 'skills.unlocksAt' : 'skills.activeAt', { level: s.level })}
                </small>
              </span>
              {s.description && <span class="skill-desc">{s.description}</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
