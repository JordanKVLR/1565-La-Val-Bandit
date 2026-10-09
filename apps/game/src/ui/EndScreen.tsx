import { t } from '../i18n';

export function EndScreen({ onTitle }: { onTitle: () => void }) {
  return (
    <main class="end-screen">
      <h2>{t('app.title')}</h2>
      <p>{t('end.thanks')}</p>
      <p class="credits">
        {t('end.credits')}
        <br />
        {t('end.placeholder')}
      </p>
      <p class="end-ngplus">{t('end.ngPlus')}</p>
      <button type="button" class="btn" onClick={onTitle}>
        {t('end.returnToTitle')}
      </button>
    </main>
  );
}
