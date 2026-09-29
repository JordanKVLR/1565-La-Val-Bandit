/** Shown by CSS only when the device is in portrait: the game is landscape-only. */
export function RotateOverlay() {
  return (
    <div class="rotate-overlay" role="alert">
      <div class="rotate-icon" aria-hidden="true">
        ⤾
      </div>
      <p>Turn your phone sideways to play.</p>
    </div>
  );
}
