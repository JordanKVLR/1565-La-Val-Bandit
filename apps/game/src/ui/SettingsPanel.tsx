import type { Settings } from '../state/settings';
import { settings } from '../state/settings';
import { useStore } from '../state/store';
import { installApp, installOffer, isIos, isStandalone } from '../platform/fullscreen';
import type { DisplaySetting } from '../platform/displayMode';
import { t, tRich } from '../i18n';

/** Layout choices (ADR 0010): Auto picks TV for a gamepad on a big screen. */
const DISPLAY_CHOICES: readonly DisplaySetting[] = ['auto', 'handheld', 'tv'];

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
        {t('common.on')}
      </button>
      <button
        type="button"
        class={`btn tab ${!value ? 'on' : ''}`}
        aria-pressed={!value}
        onClick={() => onChange(false)}
      >
        {t('common.off')}
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
    <div class="modal" role="dialog" aria-label={t('common.settings')}>
      <div class="modal-box">
        <h2>{t('common.settings')}</h2>
        {!standalone && (
          <div class="setting">
            <span>{t('settings.fullscreen')}</span>
            <OnOff
              label={t('settings.fullscreen')}
              value={s.fullscreen}
              onChange={(v) => set({ fullscreen: v })}
            />
          </div>
        )}
        {!standalone && offer && (
          <div class="setting">
            <span>{t('settings.installPrompt')}</span>
            <button type="button" class="btn" onClick={() => void installApp()}>
              {t('settings.install')}
            </button>
          </div>
        )}
        {!standalone && isIos() && <p class="setting-hint">{tRich('settings.iosHint')}</p>}
        <div class="setting">
          <span>{t('settings.battleSpeed')}</span>
          <div class="seg" role="group" aria-label={t('settings.battleSpeed')}>
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
          <span>{t('settings.highContrast')}</span>
          <OnOff
            label={t('settings.highContrast')}
            value={s.highContrast}
            onChange={(v) => set({ highContrast: v })}
          />
        </div>
        <div class="setting">
          <span>{t('settings.closeUps')}</span>
          <div class="seg" role="group" aria-label={t('settings.closeUps')}>
            <button
              type="button"
              class={`btn tab ${s.closeUps ? 'on' : ''}`}
              aria-pressed={s.closeUps}
              onClick={() => set({ closeUps: true })}
            >
              {t('common.on')}
            </button>
            <button
              type="button"
              class={`btn tab ${!s.closeUps ? 'on' : ''}`}
              aria-pressed={!s.closeUps}
              onClick={() => set({ closeUps: false })}
            >
              {t('common.off')}
            </button>
          </div>
        </div>
        <div class="setting">
          <span>{t('settings.textSize')}</span>
          <div class="seg" role="group" aria-label={t('settings.textSize')}>
            <button
              type="button"
              class={`btn tab ${s.textSize === 'normal' ? 'on' : ''}`}
              aria-pressed={s.textSize === 'normal'}
              onClick={() => set({ textSize: 'normal' })}
            >
              {t('settings.textSize.normal')}
            </button>
            <button
              type="button"
              class={`btn tab ${s.textSize === 'large' ? 'on' : ''}`}
              aria-pressed={s.textSize === 'large'}
              onClick={() => set({ textSize: 'large' })}
            >
              {t('settings.textSize.large')}
            </button>
          </div>
        </div>
        <div class="setting">
          <span>{t('settings.display')}</span>
          <div class="seg" role="group" aria-label={t('settings.display')}>
            {DISPLAY_CHOICES.map((v) => (
              <button
                type="button"
                key={v}
                class={`btn tab ${s.display === v ? 'on' : ''}`}
                aria-pressed={s.display === v}
                data-testid={`display-${v}`}
                onClick={() => set({ display: v })}
              >
                {t(`settings.display.${v}`)}
              </button>
            ))}
          </div>
        </div>
        <p class="setting-hint">{t('settings.displayHint')}</p>
        <label class="setting">
          <span>{t('settings.music')}</span>
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
          <span>{t('settings.sfx')}</span>
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
            <span>{t('settings.intro')}</span>
            <button type="button" class="btn ghost" onClick={onWatchIntro}>
              {t('settings.watchIntro')}
            </button>
          </div>
        )}
        <button type="button" class="btn" data-nav-back onClick={onClose}>
          {t('common.done')}
        </button>
      </div>
    </div>
  );
}
