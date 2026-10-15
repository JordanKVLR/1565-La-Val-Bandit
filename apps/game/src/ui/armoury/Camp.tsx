import type { CampScene, Library } from '@m1565/content';
import { bondRankFor } from '@m1565/content';
import { t } from '../../i18n';
import { Button, Chip, Sheet } from '../design';
import { nameOf } from './model';

/** Rank as filled and empty pips (never colour alone), with the rank number as text. */
export function RankPips({ rank }: { rank: number }) {
  return (
    <span class="bond-pips" role="img" aria-label={t('camp.rank', { n: rank })}>
      {[1, 2, 3].map((i) => (
        <i key={i} class={i <= rank ? 'on' : ''} aria-hidden="true">
          {i <= rank ? '◆' : '◇'}
        </i>
      ))}
    </span>
  );
}

/**
 * Camp talks: short optional scenes between battles. Each one deepens a bond; a bond makes the
 * two fight better side by side (within a couple of tiles). The list shows who is in each talk,
 * and below it every bond with its rank.
 */
export function CampSheet({
  lib,
  talks,
  scores,
  present,
  onListen,
  onClose,
}: {
  lib: Library;
  talks: readonly CampScene[];
  scores: Readonly<Record<string, number>>;
  present: readonly string[];
  onListen: (id: string) => void;
  onClose: () => void;
}) {
  const bonds = lib.bondTable.bonds.filter((b) => present.includes(b.a) && present.includes(b.b));
  return (
    <Sheet
      label={t('camp.title')}
      title={t('camp.title')}
      closeLabel={t('common.close')}
      onClose={onClose}
      placement="center"
      size="lg"
      ornament="cross"
      closeButton={false}
      class="ar-camp"
      testId="camp-sheet"
      footer={
        <Button variant="primary" label={t('common.done')} navDefault navBack onClick={onClose} />
      }
    >
      <p class="camp-intro">{t('camp.intro')}</p>
      <h3 class="camp-h">{t('camp.talks')}</h3>
      {talks.length === 0 ? (
        <p class="camp-empty" data-testid="camp-empty">
          {t('camp.none')}
        </p>
      ) : (
        <ul class="camp-list">
          {talks.map((c) => (
            <li key={c.id} class="camp-talk" data-testid={`camp-talk-${c.id}`}>
              <div class="camp-talk__text">
                <b>{c.title}</b>
                <small>{c.with.map((w) => nameOf(lib, w)).join(t('common.sep'))}</small>
              </div>
              <Button
                variant="primary"
                icon="chevronRight"
                label={t('camp.listen')}
                onClick={() => onListen(c.id)}
              />
            </li>
          ))}
        </ul>
      )}
      <h3 class="camp-h">{t('camp.bonds')}</h3>
      <ul class="camp-bonds" data-testid="camp-bonds">
        {bonds.map((b) => {
          const rank = bondRankFor(lib, scores[b.var] ?? 0);
          return (
            <li key={b.var} class="camp-bond">
              <span>
                {nameOf(lib, b.a)} {t('camp.and')} {nameOf(lib, b.b)}
              </span>
              <RankPips rank={rank} />
              {rank === 0 && <Chip label={t('camp.noBond')} />}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
