import { useState } from 'preact/hooks';
import type { ControlContext } from '../../platform/input/controls';
import { helpRows } from '../../platform/input/controls';

const CONTROL_PAGES: readonly { context: ControlContext; title: string }[] = [
  { context: 'battle', title: 'Battle' },
  { context: 'menu', title: 'Menus and story' },
  { context: 'armoury', title: 'Armoury' },
];

/** Touch, keyboard and gamepad controls, drawn from the same table the inputs use. */
function ControlsPage() {
  return (
    <div class="help-controls" data-testid="help-controls">
      <h3>Touch</h3>
      <dl>
        <dt>Tap</dt>
        <dd>Select a tile or unit, press a button, next line of dialogue</dd>
        <dt>Tap again</dt>
        <dd>Move to the tile you picked, or attack the enemy you picked</dd>
        <dt>Drag · pinch</dt>
        <dd>Pan · zoom the map</dd>
        <dt>⟲ ⟳ buttons</dt>
        <dd>Rotate the map 90°</dd>
        <dt>☰ button</dt>
        <dd>Menu: battle log, this help, settings, save and quit</dd>
      </dl>
      {CONTROL_PAGES.map((page) => (
        <table class="controls-table" key={page.context}>
          <caption>{page.title}</caption>
          <thead>
            <tr>
              <th scope="col">Action</th>
              <th scope="col">Keyboard</th>
              <th scope="col">Gamepad</th>
            </tr>
          </thead>
          <tbody>
            {helpRows(page.context).map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                <td>{r.keys}</td>
                <td>{r.pad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
      <p class="hint">
        With a mouse, hovering a blue tile shows the route and one click moves. On a gamepad, the
        cursor arrows follow the camera: ↑ steps up-right on the map, → down-right. Ⓐ on your own
        unit opens Move.
      </p>
    </div>
  );
}

/** Rules at a glance and the controls, reachable from the battle HUD. */
export function HelpPanel({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState<'rules' | 'controls'>('rules');
  return (
    <div class="modal" role="dialog" aria-label="How to play">
      <div class="modal-box help">
        <h2>How to play</h2>
        <div class="seg help-tabs" role="tablist" aria-label="Help pages">
          {(
            [
              ['rules', 'Rules'],
              ['controls', 'Controls'],
            ] as const
          ).map(([id, label]) => (
            <button
              type="button"
              key={id}
              role="tab"
              id={`help-tab-${id}`}
              aria-selected={page === id}
              aria-controls="help-page"
              tabIndex={page === id ? 0 : -1}
              class={`btn tab ${page === id ? 'on' : ''}`}
              onClick={() => setPage(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div id="help-page" role="tabpanel" aria-labelledby={`help-tab-${page}`}>
          {page === 'controls' ? (
            <ControlsPage />
          ) : (
            <dl>
              <dt>Your turn</dt>
              <dd>
                Your unit is selected for you and its movement range is already showing: blue tiles
                inside a white outline. Tap a tile to see the route and its AP cost, then tap it
                again to move (with a mouse, hovering shows the route and one click moves). Enemies
                you can strike are framed in yellow with a crosshair; tap one for the forecast.
                Attack range is orange stripes inside a dashed edge. Undo takes back a move you
                haven't followed with an attack. Turn on High-contrast map in Settings for bolder
                highlights.
              </dd>
              <dt>Keyboard, mouse and gamepad</dt>
              <dd>
                M Move · A Attack · E End turn · U Undo · arrows move a tile cursor · Enter or Space
                confirm · Esc or right-click go back. Every control, gamepad included, is on the
                Controls page.
              </dd>
              <dt>Techniques</dt>
              <dd>
                Every pilot starts with two attacks for their weapon: blades Slash (accurate,
                lighter) and Thrust; polearms Thrust and Long Thrust (reaches 2 tiles, less
                accurate); maces Bash and Smash; guns Fire (2–4 tiles) and a Stock Strike up close
                as strong as a Slash. Each faction adds its own techniques, learned as your
                attributes grow. The stronger a technique, the more AP and FP it costs and the less
                accurate it is: FP is 5 plus 45 for every step of power above ×1.0, and anything
                fired or thrown costs 20 FP more. Open a unit's techniques to read what each one
                does.
              </dd>
              <dt>XP and levels</dt>
              <dd>
                XP comes only from landing a blow: about 30 for a hit, a little more the more damage
                it does, and a large bonus for a defeating blow. Head-on hits earn the most, rear
                attacks the least; stronger enemies give more, weaker ones less. Defending and
                dodging earn nothing. Every 500 XP is a level: more HP and 3 attribute points.
              </dd>
              <dt>Skills</dt>
              <dd>
                Each named pilot has three skills of their own, gained at levels 1, 5 and 10: small
                passive edges such as better aim from high ground, less damage while defending,
                cheaper reactions or healing a little each turn. They work on their own and are
                already counted in the forecast. Open a unit's Info and tap Skills to read them;
                skills still to come show a padlock and the level they unlock at.
              </dd>
              <dt>Attributes</dt>
              <dd>
                <b>BAS</b> +4 max HP per point · <b>POW</b> and <b>WEP</b> damage · <b>DEX</b> +2%
                accuracy · <b>AGL</b> −2% to be hit, earlier turns · <b>DEF</b> −1.5 damage taken
                per point. Armaturas, weapons, charms and amulets add to them (max 32).
              </dd>
              <dt>AP (blue)</dt>
              <dd>
                Action points. Every turn starts with a full 100. Moving and attacking spend AP;
                reacting never does. Your card shows the cost of a move or technique before you
                commit. AP you don't spend is not wasted: it rests you (see FP).
              </dd>
              <dt>FP (yellow)</dt>
              <dd>
                Fatigue. Your own attacks add their technique's FP (Slash and Thrust: 5). Reacting
                is what tires you most. At the end of your turn every 3 AP left unspent removes 2
                FP, so a turn spent waiting clears 66. At 50 you fight worse; at 100 you faint and
                must rest a turn.
              </dd>
              <dt>Reactions</dt>
              <dd>
                When attacked you always choose. <b>Defend</b> (FP +30) halves whatever gets past
                your DEF. <b>Avoid</b> (FP +20) may dodge it. <b>Attack back</b> takes the hit, then
                strikes back with a technique you choose if you survive; it costs that technique's
                AP and FP, all as FP (Slash: 25), and only techniques that reach and keep you at or
                under 100 FP are offered. From the front only, <b>Counter</b> (FP +20) is a gamble:
                if it works the blow is repelled onto the attacker at 1.25×; if it fails you take
                1.25×. Higher DEX + AGL than the attacker improves the odds. From behind you can
                only Avoid. <b>Do nothing</b> costs nothing.
              </dd>
              <dt>Position</dt>
              <dd>
                Hits from the side (+10%) and rear (+25%, ×1.25 damage) are deadlier, so face the
                enemy at the end of your turn. Higher ground adds accuracy and damage. Each ally
                next to your target adds +5% (up to +15%).
              </dd>
              <dt>Terrain</dt>
              <dd>
                The bottom-left readout shows height, cover and terrain, e.g. "1H 10% Field". Cover
                makes a unit harder to hit.
              </dd>
            </dl>
          )}
        </div>
        <button type="button" class="btn" data-nav-back onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}
