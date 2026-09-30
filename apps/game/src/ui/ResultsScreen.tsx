import type { Library } from '@m1565/content';
import type { GameSession, Screen } from '../campaign/GameSession';
import { useStore } from '../state/store';
import { RosterStats } from './RosterStats';

export function ResultsScreen({
  session,
  screen,
  lib,
}: {
  session: GameSession;
  screen: Extract<Screen, { kind: 'results' }>;
  lib: Library;
}) {
  const roster = useStore(session.view).roster;
  return (
    <main class="results-screen">
      <h2>Victory</h2>
      <ul class="results-lines">
        {screen.lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      <div class="results-roster">
        {roster.map((r) => (
          <div class="results-pilot" key={r.characterId}>
            <strong>
              {lib.characters.get(r.characterId)?.name ?? r.characterId} <small>Lv {r.level}</small>
            </strong>
            <span class="xp-track wide">
              <span style={{ width: `${r.xp}%` }} />
            </span>
            <RosterStats
              lib={lib}
              entry={r}
              onRaise={(stat) => session.raiseStat(r.characterId, stat)}
            />
          </div>
        ))}
      </div>
      <button type="button" class="btn" onClick={() => session.closeResults()}>
        Continue
      </button>
    </main>
  );
}
