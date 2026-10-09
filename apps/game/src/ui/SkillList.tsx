import type { Skill } from '@m1565/core';
import { t, tParts } from '../i18n';

/** A small padlock, drawn so a locked skill reads by shape as well as by being greyed. */
export function Padlock({ size = 14 }: { size?: number }) {
  return (
    <svg
      class="skill-lock"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
      <rect x="2.5" y="7" width="11" height="8" rx="1.5" fill="currentColor" />
      <rect x="7.2" y="9.5" width="1.6" height="3" rx="0.8" fill="var(--skill-lock-hole, #000)" />
    </svg>
  );
}

/** A four-pointed star for an active skill (shape, not colour, marks it). */
function ActiveMark() {
  return (
    <svg class="skill-mark" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 0.5 10 6 15.5 8 10 10 8 15.5 6 10 0.5 8 6 6Z" fill="currentColor" />
    </svg>
  );
}

/**
 * A pilot's skills: active ones with a star and "Active", locked ones greyed with a padlock and
 * "Unlocks at Lv N". `fresh` marks skills just gained (shown with a "New" tag).
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
            <span class="skill-icon">{locked ? <Padlock /> : <ActiveMark />}</span>
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

/** "New skill: X" lines for a level-up announcement. */
export function NewSkills({ names }: { names: readonly string[] }) {
  if (!names.length) return null;
  return (
    <p class="skill-announce" data-testid="new-skill">
      {names.map((name) => (
        <span key={name}>
          <ActiveMark /> {tParts('skills.newSkill', { name: <b>{name}</b> })}
        </span>
      ))}
    </p>
  );
}
