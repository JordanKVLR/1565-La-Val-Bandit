import type { StatName } from '@m1565/core';
import { meetsRequirements } from '@m1565/core';
import type { Library, RosterEntry } from '@m1565/content';
import { attackPool } from '@m1565/content';
import { requirementText } from './battle/attackText';

const STATS: readonly StatName[] = ['str', 'skl', 'agi'];

/** A pilot's stats with + buttons for unspent points, and (optionally) their techniques. */
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
  const pool = frame && weapon ? attackPool(lib, frame, weapon) : [];
  return (
    <div class="roster-stats">
      <div class="rs-line">
        {STATS.map((k) => (
          <span class="rs-stat" key={k}>
            {k.toUpperCase()} {entry.stats[k]}
            {points > 0 && (
              <button
                type="button"
                class="btn mini"
                aria-label={`Raise ${k.toUpperCase()} for ${entry.characterId}`}
                onClick={() => onRaise(k)}
              >
                +
              </button>
            )}
          </span>
        ))}
        {points > 0 && <b class="rs-points">{points} pts</b>}
      </div>
      {showAttacks && pool.length > 0 && (
        <ul class="rs-attacks">
          {pool.map((a) => {
            const ok = meetsRequirements(entry.stats, a);
            return (
              <li key={a.id} class={ok ? 'ok' : 'locked'}>
                {ok ? '✓' : '🔒'} {a.name}
                {!ok && <small> · {requirementText(a, entry.stats)}</small>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
