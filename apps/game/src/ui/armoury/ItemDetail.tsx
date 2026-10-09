import { useState } from 'preact/hooks';
import type { Library, RosterEntry } from '@m1565/content';
import type { LoadoutSummary } from '../../campaign/inventory';
import { equipped } from '../../campaign/inventory';
import { t, tParts } from '../../i18n';
import { rangeText } from '../battle/attackText';
import { STAT_INFO } from '../battle/statInfo';
import { usePrompt } from '../KeyHint';
import { ItemIcon } from './ItemIcon';
import type { Action, ActionId, Mode, ShelfEntry } from './model';
import { actionsFor, iconVariant, itemDescription, itemName, nameOf, previewFor } from './model';
import { StatDelta, TierBadge } from './parts';

function subLine(lib: Library, e: ShelfEntry): string {
  const sep = t('common.sep');
  if (e.kind === 'weapon') {
    const w = lib.weapons.get(e.id);
    if (!w) return t('item.kind.weapon');
    return [
      t(`weaponType.title.${w.type}`),
      t('armoury.range', { range: rangeText(w.minRange, w.maxRange) }),
      ...(w.maxRange > 1 ? [t('armoury.apToFire', { n: w.apCost })] : []),
    ].join(sep);
  }
  if (e.kind === 'frame') {
    const f = lib.frames.get(e.id);
    return f
      ? [
          t(`frameClass.armaturaTitle.${f.class}`),
          t('stat.hpValue', { n: f.hp }),
          t('stat.movValue', { n: f.move }),
        ].join(sep)
      : t('item.kind.frame');
  }
  return t(`item.kind.${e.kind}`);
}

/** Before → after for the pilot: changed rows as bars, the rest summed up in one line. */
function Comparison({
  lib,
  before,
  after,
}: {
  lib: Library;
  before: LoadoutSummary;
  after: LoadoutSummary;
}) {
  const statMax = lib.balance.statMax;
  // `id` names the row for tests (stat-delta-DMG); `label` is what the player reads.
  const rows: { id: string; label: string; a: number; b: number; max: number }[] = [
    {
      id: 'HP',
      label: t('stat.hp'),
      a: before.hp,
      b: after.hp,
      max: Math.max(before.hp, after.hp) * 1.25,
    },
    {
      id: 'DMG',
      label: t('stat.dmg'),
      a: before.damage,
      b: after.damage,
      max: Math.max(before.damage, after.damage) * 1.25,
    },
    {
      id: 'BLOCK',
      label: t('stat.block'),
      a: before.block,
      b: after.block,
      max: Math.max(before.block, after.block, 1) * 1.25,
    },
    { id: 'HIT', label: t('stat.hit'), a: before.accuracy, b: after.accuracy, max: 60 },
    { id: 'MOV', label: t('stat.mov'), a: before.move, b: after.move, max: 8 },
    ...STAT_INFO.map((s) => ({
      id: s.key.toUpperCase(),
      label: s.label,
      a: before.stats[s.key],
      b: after.stats[s.key],
      max: statMax,
    })),
  ];
  const changed = rows.filter((r) => r.a !== r.b);
  const same = rows.filter((r) => r.a === r.b).map((r) => r.label);
  const gained = after.techniques.filter((name) => !before.techniques.includes(name));
  const lost = before.techniques.filter((name) => !after.techniques.includes(name));
  return (
    <div class="cmp-block">
      {changed.length === 0 && <p class="cmp-none">{t('armoury.noChange')}</p>}
      {changed.map((r) => (
        <StatDelta
          key={r.id}
          id={r.id}
          label={r.label}
          before={r.a}
          after={r.b}
          max={Math.round(r.max)}
        />
      ))}
      {before.reach !== after.reach && (
        <p class="cmp-reach">
          {tParts('armoury.reach', { before: before.reach, after: <b>{after.reach}</b> })}
        </p>
      )}
      {gained.length > 0 && (
        <p class="cmp-tech gained" data-testid="technique-gained">
          <span class="ct-h">{t('armoury.learns')}</span>
          {gained.map((name) => (
            <b key={name}>+ {name}</b>
          ))}
        </p>
      )}
      {lost.length > 0 && (
        <p class="cmp-tech lost" data-testid="technique-lost">
          <span class="ct-h">{t('armoury.loses')}</span>
          {lost.map((name) => (
            <s key={name}>− {name}</s>
          ))}
        </p>
      )}
      {changed.length > 0 && same.length > 0 && (
        <p class="cmp-same">{t('armoury.unchanged', { list: same.join(t('common.sep')) })}</p>
      )}
    </div>
  );
}

export function ItemDetail({
  lib,
  pilot,
  entry,
  mode,
  scudi,
  confirming,
  error,
  onAction,
  onClose,
}: {
  lib: Library;
  pilot: RosterEntry | undefined;
  entry: ShelfEntry;
  mode: Mode;
  scudi: number;
  /** The action awaiting its confirming second tap. */
  confirming: ActionId | null;
  error: string | null;
  onAction: (action: Action) => void;
  onClose: () => void;
}) {
  const slotItem = pilot ? equipped(pilot, entry.kind) : null;
  const actions = actionsFor(entry, mode, slotItem !== null);
  const preview =
    pilot && mode === 'shop' && entry.source !== 'unusable'
      ? entry.source === 'fitted'
        ? null
        : previewFor(lib, pilot, entry.kind, entry.id)
      : null;
  const removePreview =
    pilot && mode === 'shop' && entry.source === 'fitted' && actions.some((a) => a.id === 'remove')
      ? previewFor(lib, pilot, entry.kind, null)
      : null;
  const pilotName = pilot ? nameOf(lib, pilot.characterId) : '';
  const cost = (a: Action) => (a.id === 'buy' || a.id === 'buy-equip' ? (entry.price ?? 0) : 0);
  const blockedFor = (a: Action): string | null => {
    if (entry.blocked && a.id !== 'equip') return entry.blocked;
    if (cost(a) > scudi) return t('armoury.needScudi', { n: cost(a) - scudi });
    return null;
  };
  let reason: string | null = error;
  if (!reason && actions.length === 0) {
    reason =
      entry.source === 'unusable'
        ? (entry.blocked ?? t('armoury.cantWear'))
        : entry.kind === 'frame'
          ? t('armoury.needsFrame')
          : t('armoury.needsWeapon');
  }
  if (!reason) reason = actions.map(blockedFor).find((r) => r !== null) ?? null;
  const description = itemDescription(lib, entry.kind, entry.id);
  const [openDesc, setOpenDesc] = useState(false);
  const share = Math.round(lib.balance.armouryConfirmFraction * 100);
  const prompt = usePrompt();
  const confirmText = prompt('confirmPurchase', {
    share: share === 50 ? t('armoury.shareHalf') : t('armoury.sharePercent', { n: share }),
  });
  return (
    <section
      class="ar-panel item-detail"
      data-testid="item-detail"
      role="region"
      aria-label={t('armoury.itemDetails', { name: entry.name })}
    >
      <header class="id-head">
        <ItemIcon
          kind={entry.kind}
          variant={iconVariant(lib, entry.kind, entry.id)}
          tier={entry.tier ?? 'common'}
          size={44}
          title=""
        />
        <div class="id-title">
          <h3 tabIndex={-1}>{entry.name}</h3>
          <div class="id-sub">
            {entry.tier && <TierBadge tier={entry.tier} size="md" />}
            <span>{subLine(lib, entry)}</span>
          </div>
        </div>
        <button
          type="button"
          class="id-close"
          aria-label={t('common.back')}
          data-testid="item-detail-close"
          onClick={onClose}
        >
          ‹
        </button>
      </header>
      <div class="id-body">
        {description && (
          <p
            class={`id-desc${openDesc ? ' open' : ''}`}
            onClick={() => setOpenDesc((o) => !o)}
            title={openDesc ? undefined : t('armoury.readMore')}
          >
            {description}
          </p>
        )}
        {mode === 'sell' ? (
          <dl class="id-sell">
            <dt>{t('armoury.inStores')}</dt>
            <dd>×{entry.owned}</dd>
            <dt>{t('armoury.armourerPays')}</dt>
            <dd>{t('armoury.scudi', { n: entry.sellPrice ?? 0 })}</dd>
            <dt>{t('armoury.fittedTo')}</dt>
            <dd>{t('armoury.nobodySpares')}</dd>
          </dl>
        ) : (
          <>
            {pilot && (
              <h4 class="id-for">
                {entry.source === 'fitted'
                  ? removePreview
                    ? t('armoury.withoutIt', { pilot: pilotName })
                    : t('armoury.fittedToPilot', { pilot: pilotName })
                  : t('armoury.onPilot', { pilot: pilotName })}
              </h4>
            )}
            {entry.source === 'pilot' && entry.holderId && (
              <p class="id-note">
                {slotItem
                  ? t('armoury.exchange', {
                      holder: nameOf(lib, entry.holderId),
                      pilot: pilotName,
                      item: itemName(lib, entry.kind, slotItem),
                    })
                  : t('armoury.takenFrom', { holder: nameOf(lib, entry.holderId) })}
              </p>
            )}
            {preview && <Comparison lib={lib} before={preview.before} after={preview.after} />}
            {removePreview && (
              <Comparison lib={lib} before={removePreview.before} after={removePreview.after} />
            )}
          </>
        )}
      </div>
      {reason && (
        <p class="id-reason" data-testid="action-reason" role="status">
          {reason}
        </p>
      )}
      {confirming && (
        <p class="id-confirm" id="confirm-note">
          {confirmText}
        </p>
      )}
      {actions.length > 0 && (
        <div class="id-actions">
          {actions.map((a) => {
            const blocked = blockedFor(a);
            const isConfirm = confirming === a.id;
            return (
              <button
                key={a.id}
                type="button"
                class={`btn ${a.primary ? 'primary' : 'ghost'}${isConfirm ? ' confirming' : ''}`}
                disabled={!!blocked}
                data-testid={isConfirm ? 'action-confirm' : `action-${a.id}`}
                {...(isConfirm ? { 'aria-describedby': 'confirm-note' } : {})}
                onClick={() => onAction(a)}
              >
                {isConfirm ? t('armoury.confirm', { action: a.label }) : a.label}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** The detail column's resting state on wide screens. */
export function DetailEmpty() {
  return (
    <section class="ar-panel item-detail empty" aria-label={t('armoury.detailsEmptyLabel')}>
      <p class="id-empty">{t('armoury.detailsEmpty')}</p>
    </section>
  );
}
