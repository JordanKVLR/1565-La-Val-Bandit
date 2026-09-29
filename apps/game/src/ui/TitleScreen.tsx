interface Props {
  onStart: () => void;
}

export function TitleScreen({ onStart }: Props) {
  return (
    <main class="title-screen">
      <h1>1565</h1>
      <p class="subtitle">The Great Siege of Malta</p>
      <button type="button" class="btn" onClick={onStart}>
        Begin
      </button>
      <p class="build-note">Prototype build · placeholder art</p>
    </main>
  );
}
