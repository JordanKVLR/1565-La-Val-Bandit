import { useState } from 'preact/hooks';
import type { Library, RosterEntry } from '@m1565/content';
import type { LoadoutSummary } from '../../campaign/inventory';
import { equipped } from '../../campaign/inventory';
import { STAT_INFO } from '../battle/statInfo';
import { usePressWord } from '../KeyHint';
import { ItemIcon } from './ItemIcon';
import type { Action, ActionId, Mode, ShelfEntry } from './model';
import { actionsFor, iconVariant, itemDescription, itemName, nameOf, previewFor } from './model';
import { StatDelta, TierBadge } from './parts';

const KIND_LABEL = { weapon: 'Weapon', frame: 'Armatura', charm: 'Charm', amulet: 'Amulet' };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function subLine(lib: Library, e: ShelfEntry): string {
  if (e.kind === 'weapon') {
    const w = lib.weapons.get(e.id);
    if (!w) return 'Weapon';
    const range = w.minRange === w.maxRange ? `${w.maxRange}` : `${w.minRange}–${w.maxRange}`;
    return `${cap(w.type)} · Range ${range}${w.maxRange > 1 ? ` · ${w.apCost} AP to fire` : ''}`;
  }
  if (e.kind === 'frame') {
    const f = lib.frames.get(e.id);
    return f ? `${cap(f.class)} armatura · HP ${f.hp} · MOV ${f.move}` : 'Armatura';
  }
  return KIND_LABEL[e.kind];
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
  const rows: { label: string; a: number; b: number; max: number }[] = [
    { label: 'HP', a: before.hp, b: after.hp, max: Math.max(before.hp, after.hp) * 1.25 },
    {
      label: 'DMG',
      a: before.damage,
      b: after.damage,
      max: Math.max(before.damage, after.damage) * 1.25,
    },
    {
      label: 'BLOCK',
      a: before.block,
      b: after.block,
      max: Math.max(before.block, after.block, 1) * 1.25,
    },
    { label: 'HIT', a: before.accuracy, b: after.accuracy, max: 60 },
    { label: 'MOV', a: before.move, b: after.move, max: 8 },
    ...STAT_INFO.map((s) => ({
      label: s.label,
      a: before.stats[s.key],
      b: after.stats[s.key],
      max: statMax,
    })),
  ];
  const changed = rows.filter((r) => r.a !== r.b);
  const same = rows.filter((r) => r.a === r.b).map((r) => r.label);
  const gained = after.techniques.filter((t) => !before.techniques.includes(t));
  const lost = before.techniques.filter((t) => !after.techniques.includes(t));
  return (
    <div class="cmp-block">
      {changed.length === 0 && <p class="cmp-none">No change to the numbers.</p>}
      {changed.map((r) => (
        <StatDelta key={r.label} label={r.label} before={r.a} after={r.b} max={Math.round(r.max)} />
      ))}
      {before.reach !== after.reach && (
        <p class="cmp-reach">
          Reach: {before.reach} → <b>{after.reach}</b>
        </p>
      )}
      {gained.length > 0 && (
        <p class="cmp-tech gained" data-testid="technique-gained">
          <span class="ct-h">Learns</span>
          {gained.map((t) => (
            <b key={t}>+ {t}</b>
          ))}
        </p>
      )}
      {lost.length > 0 && (
        <p class="cmp-tech lost" data-testid="technique-lost">
          <span class="ct-h">Loses</span>
          {lost.map((t) => (
            <s key={t}>− {t}</s>
          ))}
        </p>
      )}
      {changed.length > 0 && same.length > 0 && (
        <p class="cmp-same">Unchanged: {same.join(' · ')}</p>
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
    if (cost(a) > scudi) return `Need ${cost(a) - scudi} more scudi`;
    return null;
  };
  let reason: string | null = error;
  if (!reason && actions.length === 0) {
    reason =
      entry.source === 'unusable'
        ? (entry.blocked ?? "Can't be worn")
        : `A pilot always needs ${entry.kind === 'frame' ? 'an armatura' : 'a weapon'}. Fit another to replace it.`;
  }
  if (!reason) reason = actions.map(blockedFor).find((r) => r !== null) ?? null;
  const description = itemDescription(lib, entry.kind, entry.id);
  const [openDesc, setOpenDesc] = useState(false);
  const share = Math.round(lib.balance.armouryConfirmFraction * 100);
  const pressWord = usePressWord();
  const confirmText = `That is more than ${share === 50 ? 'half' : `${share}%`} of your purse. ${pressWord} again to confirm.`;
  return (
    <section
      class="ar-panel item-detail"
      data-testid="item-detail"
      role="region"
      aria-label={`${entry.name} details`}
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
          aria-label="Back"
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
            title={openDesc ? undefined : 'Tap to read more'}
          >
            {description}
          </p>
        )}
        {mode === 'sell' ? (
          <dl class="id-sell">
            <dt>In the stores</dt>
            <dd>×{entry.owned}</dd>
            <dt>The armourer pays</dt>
            <dd>{entry.sellPrice} scudi</dd>
            <dt>Fitted to</dt>
            <dd>Nobody (spares only)</dd>
          </dl>
        ) : (
          <>
            {pilot && (
              <h4 class="id-for">
                {entry.source === 'fitted'
                  ? removePreview
                    ? `${pilotName} without it`
                    : `Fitted to ${pilotName}`
                  : `On ${pilotName}`}
              </h4>
            )}
            {entry.source === 'pilot' && entry.holderId && (
              <p class="id-note">
                {slotItem
                  ? `${nameOf(lib, entry.holderId)} gets ${pilotName}'s ${itemName(lib, entry.kind, slotItem)} in exchange.`
                  : `Taken from ${nameOf(lib, entry.holderId)}.`}
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
                {isConfirm ? `Confirm ${a.label}` : a.label}
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
    <section class="ar-panel item-detail empty" aria-label="Item details">
      <p class="id-empty">Pick an item on the shelf to see what it does and compare it.</p>
    </section>
  );
}
