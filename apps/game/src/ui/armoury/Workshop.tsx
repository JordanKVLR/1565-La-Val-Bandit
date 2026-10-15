import type { Library, Recipe, RosterEntry } from '@m1565/content';
import type { Stores } from '../../campaign/inventory';
import { countOf, craftBlocked, equipped } from '../../campaign/inventory';
import { t } from '../../i18n';
import { Button, Chip, Sheet } from '../design';
import { itemBonus, itemName, nameOf } from './model';
import { bonusText } from '../battle/statInfo';

const blockedText = (b: 'scudi' | 'parts' | 'ingredient' | undefined): string | undefined =>
  b === 'scudi'
    ? t('workshop.blocked.scudi')
    : b === 'parts'
      ? t('workshop.blocked.parts')
      : b === 'ingredient'
        ? t('workshop.blocked.ingredient')
        : undefined;

const POWER = (lib: Library, r: Recipe): string => {
  if (r.result.kind !== 'weapon') return bonusText(itemBonus(lib, r.result.kind, r.result.id));
  const to = lib.weapons.get(r.result.id)?.power ?? 0;
  const from = r.from ? (lib.weapons.get(r.from.id)?.power ?? 0) : 0;
  return r.from ? t('workshop.power', { from, to }) : t('workshop.powerOnly', { to });
};

/**
 * Kateri's Workshop: spend scudi and salvaged parts to temper a weapon or forge a keepsake.
 * An upgrade can use a spare or the copy a pilot has fitted (it stays in their hands).
 */
export function WorkshopSheet({
  lib,
  recipes,
  roster,
  stores,
  scudi,
  parts,
  onCraft,
  onClose,
}: {
  lib: Library;
  recipes: readonly Recipe[];
  roster: readonly RosterEntry[];
  stores: Stores;
  scudi: number;
  parts: number;
  onCraft: (recipe: Recipe, holderId?: string) => void;
  onClose: () => void;
}) {
  const h = { roster, stores, scudi, parts };
  return (
    <Sheet
      label={t('workshop.title')}
      title={t('workshop.title')}
      closeLabel={t('common.close')}
      onClose={onClose}
      placement="center"
      size="lg"
      ornament="cross"
      closeButton={false}
      class="ar-workshop"
      testId="workshop-sheet"
      footer={
        <>
          <Chip label={t('workshop.parts', { n: parts })} testId="parts-count" />
          <Button variant="primary" label={t('common.done')} navDefault navBack onClick={onClose} />
        </>
      }
    >
      <p class="camp-intro">{t('workshop.intro')}</p>
      {recipes.length === 0 ? (
        <p class="camp-empty">{t('workshop.none')}</p>
      ) : (
        <ul class="ws-list">
          {recipes.map((r) => {
            const holders = r.from
              ? roster.filter((p) => equipped(p, r.from!.kind) === r.from!.id)
              : [];
            const spare = r.from ? countOf(stores, r.from.kind, r.from.id) > 0 : false;
            const cost = (
              <span class="ws-cost">
                <Chip label={t('workshop.scudi', { n: r.scudi })} />
                <Chip label={t('workshop.partsCost', { n: r.parts })} />
              </span>
            );
            const makers: { key: string; label: string; holder?: string }[] = r.from
              ? [
                  ...(spare ? [{ key: 'spare', label: t('workshop.useSpare') }] : []),
                  ...holders.map((p) => ({
                    key: p.characterId,
                    label: t('workshop.upgradeFitted', { name: nameOf(lib, p.characterId) }),
                    holder: p.characterId,
                  })),
                ]
              : [{ key: 'make', label: t('workshop.forge') }];
            return (
              <li key={r.id} class="ws-recipe" data-testid={`recipe-${r.id}`}>
                <div class="ws-recipe__text">
                  <b>{itemName(lib, r.result.kind, r.result.id)}</b>
                  <small>
                    {r.from
                      ? t('workshop.from', { name: itemName(lib, r.from.kind, r.from.id) })
                      : t('workshop.fromParts')}
                    {t('common.sep')}
                    {POWER(lib, r)}
                  </small>
                </div>
                {cost}
                <div class="ws-actions">
                  {makers.length === 0 ? (
                    <Chip
                      tone="danger"
                      label={t('workshop.needs', { name: itemName(lib, r.from!.kind, r.from!.id) })}
                    />
                  ) : (
                    makers.map((m) => {
                      const blocked = craftBlocked(h, r, m.holder);
                      return (
                        <Button
                          key={m.key}
                          label={m.label}
                          disabled={blocked !== undefined}
                          title={blockedText(blocked)}
                          onClick={() => onCraft(r, m.holder)}
                        />
                      );
                    })
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}
