import type { Settings } from '../state/settings';
import { settings } from '../state/settings';
import { useStore } from '../state/store';

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const s = useStore(settings);
  const set = (p: Partial<Settings>) => settings.set({ ...s, ...p });
  return (
    <div class="modal" role="dialog" aria-label="Settings">
      <div class="modal-box">
        <h2>Settings</h2>
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
