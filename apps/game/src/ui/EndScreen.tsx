export function EndScreen({ onTitle }: { onTitle: () => void }) {
  return (
    <main class="end-screen">
      <h2>Armatura 1565</h2>
      <p>Thank you for playing.</p>
      <p class="credits">
        Design, code and story: the Armatura 1565 team.
        <br />
        Placeholder art and sound throughout; final assets to come.
      </p>
      <button type="button" class="btn" onClick={onTitle}>
        Return to title
      </button>
    </main>
  );
}
