import type { Settings } from '../state/settings';
import { settings } from '../state/settings';
import { useStore } from '../state/store';
import { installApp, installOffer, isIos, isStandalone } from '../platform/fullscreen';
import type { DisplaySetting } from '../platform/displayMode';

/** Layout choices (ADR 0010): Auto picks TV for a gamepad on a big screen. */
const DISPLAY_CHOICES: readonly (readonly [DisplaySetting, string])[] = [
  ['auto', 'Auto'],
  ['handheld', 'Handheld'],
  ['tv', 'TV'],
];

function OnOff({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div class="seg" role="group" aria-label={label}>
      <button
        type="button"
        class={`btn tab ${value ? 'on' : ''}`}
        aria-pressed={value}
        onClick={() => onChange(true)}
      >
        On
      </button>
      <button
        type="button"
        class={`btn tab ${!value ? 'on' : ''}`}
        aria-pressed={!value}
        onClick={() => onChange(false)}
      >
        Off
      </button>
    </div>
  );
}

export function SettingsPanel({
  onClose,
  onWatchIntro,
}: {
  onClose: () => void;
  /** Offered on the title screen only: replays the opening cinematic. */
  onWatchIntro?: () => void;
}) {
  const s = useStore(settings);
  const set = (p: Partial<Settings>) => settings.set({ ...s, ...p });
  const offer = useStore(installOffer);
  const standalone = isStandalone();
  return (
    <div class="modal" role="dialog" aria-label="Settings">
      <div class="modal-box">
        <h2>Settings</h2>
        {!standalone && (
          <div class="setting">
            <span>Full screen</span>
            <OnOff
              label="Full screen"
              value={s.fullscreen}
              onChange={(v) => set({ fullscreen: v })}
            />
          </div>
        )}
        {!standalone && offer && (
          <div class="setting">
            <span>Play as an app, without browser bars</span>
            <button type="button" class="btn" onClick={() => void installApp()}>
              Install app
            </button>
          </div>
        )}
        {!standalone && isIos() && (
          <p class="setting-hint">
            On iPhone, tap Share, then <b>Add to Home Screen</b> to play full screen.
          </p>
        )}
        <div class="setting">
          <span>Battle speed</span>
          <div class="seg" role="group" aria-label="Battle speed">
            {([1, 2, 4] as const).map((v) => (
              <button
                type="button"
                key={v}
                class={`btn tab ${s.battleSpeed === v ? 'on' : ''}`}
                aria-pressed={s.battleSpeed === v}
                onClick={() => set({ battleSpeed: v })}
              >
                ×{v}
              </button>
            ))}
          </div>
        </div>
        <div class="setting">
          <span>High-contrast map</span>
          <OnOff
            label="High-contrast map"
            value={s.highContrast}
            onChange={(v) => set({ highContrast: v })}
          />
        </div>
        <div class="setting">
          <span>Duel close-ups</span>
          <div class="seg" role="group" aria-label="Duel close-ups">
            <button
              type="button"
              class={`btn tab ${s.closeUps ? 'on' : ''}`}
              aria-pressed={s.closeUps}
              onClick={() => set({ closeUps: true })}
            >
              On
            </button>
            <button
              type="button"
              class={`btn tab ${!s.closeUps ? 'on' : ''}`}
              aria-pressed={!s.closeUps}
              onClick={() => set({ closeUps: false })}
            >
              Off
            </button>
          </div>
        </div>
        <div class="setting">
          <span>Text size</span>
          <div class="seg" role="group" aria-label="Text size">
            <button
              type="button"
              class={`btn tab ${s.textSize === 'normal' ? 'on' : ''}`}
              aria-pressed={s.textSize === 'normal'}
              onClick={() => set({ textSize: 'normal' })}
            >
              Normal
            </button>
            <button
              type="button"
              class={`btn tab ${s.textSize === 'large' ? 'on' : ''}`}
              aria-pressed={s.textSize === 'large'}
              onClick={() => set({ textSize: 'large' })}
            >
              Large
            </button>
          </div>
        </div>
        <div class="setting">
          <span>Display</span>
          <div class="seg" role="group" aria-label="Display">
            {DISPLAY_CHOICES.map(([v, label]) => (
              <button
                type="button"
                key={v}
                class={`btn tab ${s.display === v ? 'on' : ''}`}
                aria-pressed={s.display === v}
                data-testid={`display-${v}`}
                onClick={() => set({ display: v })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p class="setting-hint">Auto uses the TV layout when you play with a controller on a big screen.</p>
        <label class="setting">
          <span>Music</span>
          <input
            id="music-volume"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={s.musicVolume}
            onInput={(e) => set({ musicVolume: Number((e.target as HTMLInputElement).value) })}
          />
        </label>
        <label class="setting">
          <span>Sound effects</span>
          <input
            id="sfx-volume"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={s.sfxVolume}
            onInput={(e) => set({ sfxVolume: Number((e.target as HTMLInputElement).value) })}
          />
        </label>
        {onWatchIntro && (
          <div class="setting">
            <span>Opening cinematic</span>
            <button type="button" class="btn ghost" onClick={onWatchIntro}>
              Watch intro
            </button>
          </div>
        )}
        <button type="button" class="btn" data-nav-back onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
