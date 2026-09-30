import type { StatName } from '@m1565/core';
import { meetsRequirements } from '@m1565/core';
import type { Library, RosterEntry } from '@m1565/content';
import { attackPool } from '@m1565/content';
import { STAT_INFO } from './battle/statInfo';

/** A pilot's seven stats with + buttons for unspent points, and (optionally) learned techniques. */
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
  // Locked techniques stay hidden: only what this pilot can already use with this loadout.
  const learned =
    frame && weapon
      ? attackPool(lib, frame, weapon).filter((a) => meetsRequirements(entry.stats, a))
      : [];
  return (
    <div class="roster-stats">
      <div class="rs-line">
        {STAT_INFO.map(({ key, label, help }) => (
          <span class="rs-stat" key={key} title={help}>
            {label} {entry.stats[key]}
            {points > 0 && (
              <button
                type="button"
                class="btn mini"
                aria-label={`Raise ${label} for ${entry.characterId}`}
                onClick={() => onRaise(key)}
              >
                +
              </button>
            )}
          </span>
        ))}
        {points > 0 && <b class="rs-points">{points} pts</b>}
      </div>
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
