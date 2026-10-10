import { t } from '../i18n';
import { Button, Chip, Divider, Icon, Panel } from './design';

/** The ending: thanks and credits, and the New Game+ offer, with one way back to the title. */
export function EndScreen({ onTitle }: { onTitle: () => void }) {
  return (
    <main class="fe-page fe-end">
      <div class="fe-end__inner">
        <Icon name="cross" class="fe-page__emblem" />
        <h1 class="fe-end__title">{t('app.title')}</h1>
        <Divider glyph="cross" class="fe-page__rule" />
        <p class="fe-end__thanks">{t('end.thanks')}</p>
        <p class="fe-end__credits">
          {t('end.credits')}
          <br />
          {t('end.placeholder')}
        </p>
        <Panel elevation={1} compact class="fe-end__ngplus">
          <Chip tone="gold" icon="cross" label={t('title.newGamePlus')} />
          <p>{t('end.ngPlus')}</p>
        </Panel>
        <Button
          variant="primary"
          size="lg"
          label={t('end.returnToTitle')}
          navDefault
          onClick={onTitle}
        />
      </div>
    </main>
  );
}
