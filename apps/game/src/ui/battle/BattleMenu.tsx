interface Props {
  onResume: () => void;
  onLog: () => void;
  onHelp: () => void;
  onSettings: () => void;
  onQuit: () => void;
}

/** The ☰ menu in battle. Progress is saved automatically, so quitting keeps your place. */
export function BattleMenu({ onResume, onLog, onHelp, onSettings, onQuit }: Props) {
  return (
    <div class="modal" role="dialog" aria-label="Battle menu" onClick={onResume}>
      <div class="modal-box menu-box" onClick={(e) => e.stopPropagation()}>
        <h2>Menu</h2>
        <button type="button" class="btn" onClick={onResume}>
          Resume
        </button>
        <button type="button" class="btn ghost" onClick={onLog}>
          Battle log
        </button>
        <button type="button" class="btn ghost" onClick={onHelp}>
          How to play
        </button>
        <button type="button" class="btn ghost" onClick={onSettings}>
          Settings
        </button>
        <button type="button" class="btn ghost" onClick={onQuit}>
          Save &amp; quit to title
        </button>
      </div>
    </div>
  );
}

export function LogPanel({ log, onClose }: { log: readonly string[]; onClose: () => void }) {
  return (
    <div class="modal" role="dialog" aria-label="Battle log" onClick={onClose}>
      <div class="modal-box log-box" onClick={(e) => e.stopPropagation()}>
        <h2>Battle log</h2>
        <div class="log-lines">
          {log.length === 0 ? (
            <p class="empty">Nothing has happened yet.</p>
          ) : (
            [...log].reverse().map((l, i) => <p key={i}>{l}</p>)
          )}
        </div>
        <button type="button" class="btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
