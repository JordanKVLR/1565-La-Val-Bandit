import { useState } from 'preact/hooks';
import type { Library, RosterEntry } from '@m1565/content';
import type { LoadoutSummary } from '../../campaign/inventory';
import { equipped } from '../../campaign/inventory';
import { t, tParts } from '../../i18n';
import { rangeText } from '../battle/attackText';
import { STAT_INFO } from '../battle/statInfo';
import { Button, Chip, Divider, Hint, Icon, Panel, Stat, StatGrid } from '../design';
import { usePrompt } from '../KeyHint';
import { Padlock } from '../SkillList';
import { ItemIcon } from './ItemIcon';
import type { Action, ActionId, Mode, ShelfEntry } from './model';
import { actionsFor, iconVariant, itemDescription, itemName, nameOf, previewFor } from './model';
import { ArmourerEmblem, StatDelta, TierBadge } from './parts';

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

/**
 * Before → after for the pilot: the changed numbers as meters (gain hatched, loss cut out,
 * ▲/▼ with the difference), techniques learned or lost as chips, the rest summed up in a line.
 */
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
      {changed.length === 0 && <Hint class="cmp-none" text={t('armoury.noChange')} />}
      {changed.length > 0 && (
        <div class="cmp-rows">
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
        </div>
      )}
      {before.reach !== after.reach && (
        <p class="cmp-line">
          {tParts('armoury.reach', { before: before.reach, after: <b>{after.reach}</b> })}
        </p>
      )}
      {gained.length > 0 && (
        <p class="cmp-tech gained" data-testid="technique-gained">
          <span class="ar-label">{t('armoury.learns')}</span>
          {gained.map((name) => (
            <Chip key={name} tone="gold" icon="plus" label={name} />
          ))}
        </p>
      )}
      {lost.length > 0 && (
        <p class="cmp-tech lost" data-testid="technique-lost">
          <span class="ar-label">{t('armoury.loses')}</span>
          {lost.map((name) => (
            <Chip key={name} icon={null} class="is-lost">
              <s>− {name}</s>
            </Chip>
          ))}
        </p>
      )}
      {changed.length > 0 && same.length > 0 && (
        <Hint
          class="cmp-same"
          text={t('armoury.unchanged', { list: same.join(t('common.sep')) })}
        />
      )}
    </div>
  );
}

/**
 * The chosen item: what it is, what it does to this pilot (before → after) and what can be done
 * with it. Buy & equip is the primary action; a purchase of more than the confirm share of the
 * purse turns into a danger button that asks for a second press.
 */
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
    <Panel
      as="section"
      class="ar-panel item-detail"
      testId="item-detail"
      role="region"
      aria-label={t('armoury.itemDetails', { name: entry.name })}
    >
      <header class="id-head">
        <ItemIcon
          kind={entry.kind}
          variant={iconVariant(lib, entry.kind, entry.id)}
          tier={entry.tier ?? 'common'}
          size={48}
          title=""
        />
        <div class="id-title">
          <h3 tabIndex={-1}>{entry.name}</h3>
          <div class="id-sub">
            {entry.tier && <TierBadge tier={entry.tier} size="md" />}
            <span>{subLine(lib, entry)}</span>
          </div>
        </div>
        <Button
          class="id-close"
          label={t('common.back')}
          icon="back"
          iconOnly
          variant="ghost"
          testId="item-detail-close"
          onClick={onClose}
        />
      </header>
      <Divider class="id-rule" />
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
          <StatGrid columns={1} class="id-sell">
            <Stat label={t('armoury.inStores')} value={`×${entry.owned}`} />
            <Stat
              label={t('armoury.armourerPays')}
              value={t('armoury.scudi', { n: entry.sellPrice ?? 0 })}
              emphasis
            />
            <Stat label={t('armoury.fittedTo')} value={t('armoury.nobodySpares')} />
          </StatGrid>
        ) : (
          <>
            {pilot && (
              <h4 class="ar-label id-for">
                {entry.source === 'fitted'
                  ? removePreview
                    ? t('armoury.withoutIt', { pilot: pilotName })
                    : t('armoury.fittedToPilot', { pilot: pilotName })
                  : t('armoury.onPilot', { pilot: pilotName })}
              </h4>
            )}
            {entry.source === 'pilot' && entry.holderId && (
              <Hint
                class="id-note"
                icon="info"
                text={
                  slotItem
                    ? t('armoury.exchange', {
                        holder: nameOf(lib, entry.holderId),
                        pilot: pilotName,
                        item: itemName(lib, entry.kind, slotItem),
                      })
                    : t('armoury.takenFrom', { holder: nameOf(lib, entry.holderId) })
                }
              />
            )}
            {preview && <Comparison lib={lib} before={preview.before} after={preview.after} />}
            {removePreview && (
              <Comparison lib={lib} before={removePreview.before} after={removePreview.after} />
            )}
          </>
        )}
      </div>
      {(reason || confirming || actions.length > 0) && (
        <footer class="id-foot">
          {reason && (
            <p
              class={`id-reason${error ? ' is-error' : ''}`}
              data-testid="action-reason"
              role="status"
            >
              {error ? <Icon name="warning" /> : <Padlock size={13} />}
              <span>{reason}</span>
            </p>
          )}
          {confirming && (
            <p class="id-confirm" id="confirm-note">
              <Icon name="warning" />
              <span>{confirmText}</span>
            </p>
          )}
          {actions.length > 0 && (
            <div class="id-actions">
              {actions.map((a) => {
                const blocked = blockedFor(a);
                const isConfirm = confirming === a.id;
                return (
                  <Button
                    key={a.id}
                    class={`id-action${a.primary ? ' is-main' : ''}${isConfirm ? ' is-armed' : ''}`}
                    variant={isConfirm ? 'danger' : a.primary ? 'primary' : 'secondary'}
                    label={isConfirm ? t('armoury.confirm', { action: a.label }) : a.label}
                    disabled={!!blocked}
                    testId={isConfirm ? 'action-confirm' : `action-${a.id}`}
                    {...(isConfirm ? { 'aria-describedby': 'confirm-note' } : {})}
                    onClick={() => onAction(a)}
                  />
                );
              })}
            </div>
          )}
        </footer>
      )}
    </Panel>
  );
}

/** The detail column's resting state on wide screens: the armourer's sign and a hint. */
export function DetailEmpty({ side }: { side: 'malta' | 'ottoman' }) {
  return (
    <Panel
      as="section"
      class="ar-panel item-detail empty"
      aria-label={t('armoury.detailsEmptyLabel')}
    >
      <ArmourerEmblem side={side} />
      <Hint class="id-empty" text={t('armoury.detailsEmpty')} />
    </Panel>
  );
}
