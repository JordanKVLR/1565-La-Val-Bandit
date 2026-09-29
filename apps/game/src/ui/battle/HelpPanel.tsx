/** Rules at a glance, reachable from the battle HUD. */
export function HelpPanel({ onClose }: { onClose: () => void }) {
  return (
    <div class="modal" role="dialog" aria-label="How to play">
      <div class="modal-box help">
        <h2>How to play</h2>
        <dl>
          <dt>Your turn</dt>
          <dd>
            Move, then Attack, then End Turn and pick a facing. Undo takes back a move you haven't
            followed with an attack.
          </dd>
          <dt>AP (blue)</dt>
          <dd>
            Action points. Each turn adds 40, up to 100. Moving and attacking spend AP, and so does
            reacting when attacked. Saving AP keeps you safe.
          </dd>
          <dt>FP (yellow)</dt>
          <dd>
            Fatigue. Attacks and reactions add it. At 50 you fight worse; at 100 you can only
            Defend. Ending a turn without moving or attacking rests you faster.
          </dd>
          <dt>Reactions</dt>
          <dd>
            When attacked: <b>Defend</b> always takes the hit but halves it. <b>Avoid</b> costs 10
            AP and may dodge it completely. <b>Counter</b> takes a full hit but strikes back if you
            survive and are in range.
          </dd>
          <dt>Position</dt>
          <dd>
            Hits from the side (+10%) and rear (+25%, ×1.25 damage) are deadlier, so face the enemy
            at the end of your turn. Higher ground adds accuracy and damage. Each ally next to your
            target adds +5% (up to +15%).
          </dd>
          <dt>Terrain</dt>
          <dd>
            The bottom-left readout shows height, cover and terrain, e.g. "1H 10% Field". Cover
            makes a unit harder to hit.
          </dd>
        </dl>
        <button type="button" class="btn" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}
