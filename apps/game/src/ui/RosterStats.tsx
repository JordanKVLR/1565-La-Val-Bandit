import type { StatName } from '@m1565/core';
import { meetsRequirements, starterAttacks } from '@m1565/core';
import type { Library, RosterEntry } from '@m1565/content';
import { attackPool } from '@m1565/content';
import { summarize } from '../campaign/inventory';
import { ArmMovIcons, AttributeBars } from './battle/StatBars';

/**
 * A pilot's six attributes (with gear in brackets) and + buttons for unspent points, and
 * (optionally) the techniques this loadout already allows.
 */
export function RosterStats({
  lib,
  entry,
  onRaise,
  showAttacks = false,
}: {
  lib: Library;
  entry: RosterEntry;
  onRaise: (stat: StatName) => void;
  showAttacks?: boolean;
}) {
  const points = entry.statPoints ?? 0;
  const frame = lib.frames.get(entry.frame);
  const weapon = lib.weapons.get(entry.weapon);
  const geared = summarize(lib, entry).stats;
  // Locked techniques stay hidden: only what this pilot can already use with this loadout.
  const learned =
    frame && weapon
      ? [...starterAttacks(weapon), ...attackPool(lib, frame, weapon)].filter((a) =>
          meetsRequirements(geared, a),
        )
      : [];
  return (
    <div class="roster-stats">
      <div class="rs-head">
        {frame && <ArmMovIcons arm={frame.armour} mov={frame.move} />}
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
          <li class="ok">
            Techniques: {learned.length ? learned.map((a) => a.name).join(', ') : 'none yet'}
          </li>
        </ul>
      )}
    </div>
  );
}
