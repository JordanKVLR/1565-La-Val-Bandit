import { t } from '../i18n';
import { Icon } from './design';

/** Shown by CSS only when the device is in portrait: the game is landscape-only. */
export function RotateOverlay() {
  return (
    <div class="fe-rotate" role="alert">
      <span class="fe-rotate__phone" aria-hidden="true">
        <Icon name="rotateRight" class="fe-rotate__icon" />
      </span>
      <p class="fe-rotate__text">{t('rotate.text')}</p>
    </div>
  );
}
