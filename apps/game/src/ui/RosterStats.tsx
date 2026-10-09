import type { StatName } from '@m1565/core';
import type { Library, RosterEntry } from '@m1565/content';
import { characterSkills } from '@m1565/content';
import { summarize } from '../campaign/inventory';
import { AttributeBars, MovIcon } from './battle/StatBars';
import { SkillList } from './SkillList';

/**
 * A pilot's six attributes (with gear in brackets) and + buttons for unspent points, and
 * (optionally) the techniques this loadout already allows.
 */
export function RosterStats({
  lib,
  entry,
  onRaise,
  showAttacks = false,
  showSkills = false,
}: {
  lib: Library;
  entry: RosterEntry;
  onRaise: (stat: StatName) => void;
  showAttacks?: boolean;
  /** List the pilot's skills, locked ones with the level they unlock at. */
  showSkills?: boolean;
}) {
  const points = entry.statPoints ?? 0;
  const frame = lib.frames.get(entry.frame);
  const summary = summarize(lib, entry);
  const geared = summary.stats;
  // Locked techniques stay hidden: only what this pilot can already use with this loadout.
  const learned = summary.techniques;
  const skills = showSkills ? characterSkills(lib, entry.characterId) : [];
  return (
    <div class="roster-stats">
      <div class="rs-head">
        {frame && <MovIcon mov={frame.move} />}
        {points > 0 && <b class="rs-points">{points} points to spend</b>}
      </div>
      <AttributeBars
        stats={entry.stats}
        geared={geared}
        {...(points > 0 ? { onRaise } : {})}
        raiseLabel={(label) => `Raise ${label} for ${entry.characterId}`}
      />
      {showAttacks && (
        <ul class="rs-attacks">
          <li class="ok">Techniques: {learned.length ? learned.join(', ') : 'none yet'}</li>
        </ul>
      )}
      {skills.length > 0 && (
        <section class="rs-skills" aria-label="Skills">
          <h4>Skills</h4>
          <SkillList skills={skills} level={entry.level} testId="roster-skills" />
        </section>
      )}
    </div>
  );
}
