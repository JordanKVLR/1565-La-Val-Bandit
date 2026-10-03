import type { Settings } from '../state/settings';
import { settings } from '../state/settings';
import { useStore } from '../state/store';
import { installApp, installOffer, isIos, isStandalone } from '../platform/fullscreen';

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
      <button type="button" class={`btn tab ${value ? 'on' : ''}`} onClick={() => onChange(true)}>
        On
      </button>
      <button type="button" class={`btn tab ${!value ? 'on' : ''}`} onClick={() => onChange(false)}>
        Off
      </button>
    </div>
  );
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
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
          <div class="seg">
            {([1, 2, 4] as const).map((v) => (
              <button
                type="button"
                key={v}
                class={`btn tab ${s.battleSpeed === v ? 'on' : ''}`}
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
          <div class="seg">
            <button
              type="button"
              class={`btn tab ${s.closeUps ? 'on' : ''}`}
              onClick={() => set({ closeUps: true })}
            >
              On
            </button>
            <button
              type="button"
              class={`btn tab ${!s.closeUps ? 'on' : ''}`}
              onClick={() => set({ closeUps: false })}
            >
              Off
            </button>
          </div>
        </div>
        <div class="setting">
          <span>Text size</span>
          <div class="seg">
            <button
              type="button"
              class={`btn tab ${s.textSize === 'normal' ? 'on' : ''}`}
              onClick={() => set({ textSize: 'normal' })}
            >
              Normal
            </button>
            <button
              type="button"
              class={`btn tab ${s.textSize === 'large' ? 'on' : ''}`}
              onClick={() => set({ textSize: 'large' })}
            >
              Large
            </button>
          </div>
        </div>
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
        <button type="button" class="btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
