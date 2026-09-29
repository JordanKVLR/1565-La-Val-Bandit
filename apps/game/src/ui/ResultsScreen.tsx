import type { Library } from '@m1565/content';
import type { GameSession, Screen } from '../campaign/GameSession';

export function ResultsScreen({
  session,
  screen,
  lib,
}: {
  session: GameSession;
  screen: Extract<Screen, { kind: 'results' }>;
  lib: Library;
}) {
  const roster = session.state.roster;
  return (
    <main class="results-screen">
      <h2>Victory</h2>
      <ul class="results-lines">
        {screen.lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      <table class="roster-table">
        <thead>
          <tr>
            <th>Pilot</th>
            <th>Lv</th>
            <th>XP</th>
            <th>STR</th>
            <th>SKL</th>
            <th>AGI</th>
          </tr>
        </thead>
        <tbody>
          {roster.map((r) => (
            <tr key={r.characterId}>
              <td>{lib.characters.get(r.characterId)?.name ?? r.characterId}</td>
              <td>{r.level}</td>
              <td>{r.xp}</td>
              <td>{r.stats.str}</td>
              <td>{r.stats.skl}</td>
              <td>{r.stats.agi}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" class="btn" onClick={() => session.closeResults()}>
        Continue
      </button>
    </main>
  );
}
