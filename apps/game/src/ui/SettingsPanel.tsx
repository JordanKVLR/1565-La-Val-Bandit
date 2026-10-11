import type { ComponentChildren } from 'preact';
import { useId } from 'preact/hooks';
import type { Settings } from '../state/settings';
import { settings } from '../state/settings';
import { useStore } from '../state/store';
import { installApp, installOffer, isIos, isStandalone } from '../platform/fullscreen';
import type { DisplaySetting } from '../platform/displayMode';
import { t, tRich } from '../i18n';
import { Button, Segmented, Sheet, Slider, Switch } from './design';

/** Layout choices (ADR 0010): Auto picks TV for a gamepad on a big screen. */
const DISPLAY_CHOICES: readonly DisplaySetting[] = ['auto', 'handheld', 'tv'];

/** One setting: its name on the left, its control on the right, an optional hint underneath. */
function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ComponentChildren;
  children: (labelId: string) => ComponentChildren;
}) {
  const id = useId();
  return (
    <div class="fe-setting">
      <span class="fe-setting__label" id={id}>
        {label}
      </span>
      <span class="fe-setting__control">{children(id)}</span>
      {hint && <p class="fe-setting__hint">{hint}</p>}
    </div>
  );
}

function Group({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <section class="fe-settings__group">
      <h3 class="fe-label">{title}</h3>
      {children}
    </section>
  );
}

const percent = (v: number) => t('fe.settings.percent', { n: Math.round(v * 100) });

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
  const onOff = { onText: t('common.on'), offText: t('common.off') };
  return (
    <Sheet
      label={t('common.settings')}
      placement="center"
      ornament="cross"
      closeButton={false}
      closeLabel={t('common.close')}
      onClose={onClose}
      class="fe-sheet fe-settings"
      footer={
        <Button
          variant="primary"
          label={t('common.done')}
          keyHint="back"
          keyContext="menu"
          onClick={onClose}
        />
      }
    >
      <div class="fe-settings__groups">
        <Group title={t('fe.settings.screen')}>
          <Row label={t('settings.display')} hint={t('settings.displayHint')}>
            {(id) => (
              <Segmented
                labelledBy={id}
                value={s.display}
                onChange={(v) => set({ display: v })}
                options={DISPLAY_CHOICES.map((v) => ({
                  value: v,
                  label: t(`settings.display.${v}`),
                  testId: `display-${v}`,
                }))}
              />
            )}
          </Row>
          <Row label={t('settings.textSize')}>
            {(id) => (
              <Segmented
                labelledBy={id}
                value={s.textSize}
                onChange={(v) => set({ textSize: v })}
                options={[
                  { value: 'normal', label: t('settings.textSize.normal') },
                  { value: 'large', label: t('settings.textSize.large') },
                ]}
              />
            )}
          </Row>
          {!standalone && (
            <Row label={t('settings.fullscreen')}>
              {(id) => (
                <Switch
                  labelledBy={id}
                  checked={s.fullscreen}
                  onChange={(v) => set({ fullscreen: v })}
                  {...onOff}
                />
              )}
            </Row>
          )}
          {!standalone && offer && (
            <Row label={t('settings.installPrompt')}>
              {() => (
                <Button size="sm" label={t('settings.install')} onClick={() => void installApp()} />
              )}
            </Row>
          )}
          {!standalone && isIos() && <p class="fe-setting__hint">{tRich('settings.iosHint')}</p>}
        </Group>

        <Group title={t('fe.settings.battle')}>
          <Row label={t('settings.battleSpeed')}>
            {(id) => (
              <Segmented
                labelledBy={id}
                value={s.battleSpeed}
                onChange={(v) => set({ battleSpeed: v })}
                options={([1, 2, 4] as const).map((v) => ({
                  value: v,
                  label: t('fe.settings.speed', { n: v }),
                }))}
              />
            )}
          </Row>
          <Row label={t('settings.closeUps')}>
            {(id) => (
              <Switch
                labelledBy={id}
                checked={s.closeUps}
                onChange={(v) => set({ closeUps: v })}
                {...onOff}
              />
            )}
          </Row>
          <Row label={t('settings.highContrast')}>
            {(id) => (
              <Switch
                labelledBy={id}
                checked={s.highContrast}
                onChange={(v) => set({ highContrast: v })}
                {...onOff}
              />
            )}
          </Row>
        </Group>

        <Group title={t('fe.settings.sound')}>
          <Row label={t('settings.music')}>
            {(id) => (
              <Slider
                id="music-volume"
                labelledBy={id}
                value={s.musicVolume}
                valueText={percent(s.musicVolume)}
                onChange={(v) => set({ musicVolume: v })}
              />
            )}
          </Row>
          <Row label={t('settings.sfx')}>
            {(id) => (
              <Slider
                id="sfx-volume"
                labelledBy={id}
                value={s.sfxVolume}
                valueText={percent(s.sfxVolume)}
                onChange={(v) => set({ sfxVolume: v })}
              />
            )}
          </Row>
          {onWatchIntro && (
            <Row label={t('settings.intro')}>
              {() => (
                <Button
                  size="sm"
                  variant="secondary"
                  label={t('settings.watchIntro')}
                  onClick={onWatchIntro}
                />
              )}
            </Row>
          )}
        </Group>
      </div>
    </Sheet>
  );
}
