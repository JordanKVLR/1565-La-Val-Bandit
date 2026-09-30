/** Rules at a glance, reachable from the battle HUD. */
export function HelpPanel({ onClose }: { onClose: () => void }) {
  return (
    <div class="modal" role="dialog" aria-label="How to play">
      <div class="modal-box help">
        <h2>How to play</h2>
        <dl>
          <dt>Your turn</dt>
          <dd>
            Move, then Attack, then End Turn and pick a facing. Tap a blue tile to see the route and
            its AP cost on your card, then tap it again to move. Undo takes back a move you haven't
            followed with an attack.
          </dd>
          <dt>Techniques</dt>
          <dd>
            Every pilot starts with two attacks for their weapon: blades Slash (accurate, lighter)
            and Thrust; polearms Thrust and Long Thrust (reaches 2 tiles, less accurate); maces Bash
            and Smash; guns Fire (2–4 tiles) and a weak Stock Strike up close. Each faction adds its
            own techniques, learned as your attributes grow; you'll be told when one unlocks.
          </dd>
          <dt>XP and levels</dt>
          <dd>
            Every hit earns 20 XP and a defeating blow 60; surviving an enemy attack with a reaction
            earns 3. Beating stronger enemies earns more than beating weaker ones. At 100 XP you
            level up, gain HP and 5 points to spend.
          </dd>
          <dt>Attributes</dt>
          <dd>
            <b>STR</b> damage · <b>SKL</b> accuracy · <b>AGI</b> dodging · <b>DEF</b> −1.5 damage
            taken per point · <b>INT</b> Counter odds and technique accuracy · <b>SPI</b> cheaper
            techniques, faster fatigue recovery, resists drains · <b>VIT</b> +5% max HP per point.
          </dd>
          <dt>AP (blue)</dt>
          <dd>
            Action points. Every turn starts with a full 100. Moving and attacking spend AP;
            reacting never does. Your card shows the cost of a move or technique before you commit.
            AP you don't spend is not wasted: it rests you (see FP).
          </dd>
          <dt>FP (yellow)</dt>
          <dd>
            Fatigue. Your own attacks add only a little (Slash and Thrust: 5). Reacting is what
            tires you. At the end of your turn every 3 AP left unspent removes 2 FP, so a turn spent
            waiting clears 66. At 50 you fight worse; at 100 you faint and must rest a turn.
          </dd>
          <dt>Reactions</dt>
          <dd>
            When attacked you always choose. <b>Defend</b> (FP +30) halves the hit. <b>Avoid</b> (FP
            +20) may dodge it. <b>Attack back</b> (FP equal to the strike's AP, e.g. 30) takes the
            hit, then strikes back if you survive and are in range. From the front only,{' '}
            <b>Counter</b> (FP +20) is a gamble: if it works the blow is repelled onto the attacker
            at 1.25×; if it fails you take 1.25×. INT improves the odds. From behind you can only
            Avoid. <b>Do nothing</b> costs nothing.
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
