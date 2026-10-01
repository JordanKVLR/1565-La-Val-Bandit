import type { Library, RosterEntry, ShopItem } from '@m1565/content';
import type { StatBonus } from '@m1565/core';
import { useState } from 'preact/hooks';
import type { GameSession } from '../campaign/GameSession';
import type { ItemKind, LoadoutSummary, Stores } from '../campaign/inventory';
import {
  companyStock,
  canUse,
  countOf,
  equipped,
  priceOf,
  spares,
  summarize,
} from '../campaign/inventory';
import { useStore } from '../state/store';
import { bonusText, STAT_INFO } from './battle/statInfo';
import { RosterStats } from './RosterStats';

type Tab = 'loadout' | 'armoury';
interface Picking {
  readonly characterId: string;
  readonly kind: ItemKind;
}

const SLOT_LABEL: Record<ItemKind, string> = {
  frame: 'Armatura',
  weapon: 'Weapon',
  charm: 'Charm',
  amulet: 'Amulet',
};

/** Display name, attribute bonus and a short detail line for any item. */
function describe(lib: Library, kind: ItemKind, id: string) {
  if (kind === 'frame') {
    const f = lib.frames.get(id);
    return {
      name: f?.name ?? id,
      bonus: f?.bonus ?? {},
      detail: f ? `${f.class} · HP ${f.hp} · ARM ${f.armour} · MOV ${f.move}` : '',
    };
  }
  if (kind === 'weapon') {
    const w = lib.weapons.get(id);
    const range =
      w && (w.minRange === w.maxRange ? `${w.maxRange}` : `${w.minRange}–${w.maxRange}`);
    return {
      name: w?.name ?? id,
      bonus: w?.bonus ?? {},
      detail: w ? `${w.type} · range ${range}${w.maxRange > 1 ? ` · ${w.apCost} AP` : ''}` : '',
    };
  }
  const g = lib.gear.get(id);
  return { name: g?.name ?? id, bonus: g?.bonus ?? {}, detail: g?.description ?? '' };
}

function Bonus({ bonus }: { bonus: StatBonus }) {
  const text = bonusText(bonus);
  return <span class="item-bonus">{text || 'no bonus'}</span>;
}

/** Changed numbers between two loadouts, e.g. "DMG 30→36 ▲". */
function Comparison({ before, after }: { before: LoadoutSummary; after: LoadoutSummary }) {
  const rows: [string, number, number][] = [
    ...STAT_INFO.map((s): [string, number, number] => [
      s.label,
      before.stats[s.key],
      after.stats[s.key],
    ]),
    ['HP', before.hp, after.hp],
    ['DMG', before.damage, after.damage],
    ['HIT', before.accuracy, after.accuracy],
    ['BLOCK', before.block, after.block],
    ['ARM', before.armour, after.armour],
    ['MOV', before.move, after.move],
  ];
  const changed = rows.filter(([, a, b]) => a !== b);
  const gained = after.techniques.filter((t) => !before.techniques.includes(t));
  const lost = before.techniques.filter((t) => !after.techniques.includes(t));
  const reach = before.reach !== after.reach;
  if (!changed.length && !gained.length && !lost.length && !reach)
    return <small class="cmp none">No change</small>;
  return (
    <ul class="cmp">
      {reach && (
        <li class="info">
          {before.reach}→{after.reach}
        </li>
      )}
      {changed.map(([label, a, b]) => (
        <li key={label} class={b > a ? 'up' : 'down'}>
          {label} {a}→{b} {b > a ? '▲' : '▼'}
        </li>
      ))}
      {gained.length > 0 && <li class="up">Learns {gained.join(', ')}</li>}
      {lost.length > 0 && <li class="down">Loses {lost.join(', ')}</li>}
    </ul>
  );
}

/** One pilot's four equipment slots, each opening the picker. */
function Slots({
  lib,
  entry,
  onPick,
}: {
  lib: Library;
  entry: RosterEntry;
  onPick: (kind: ItemKind) => void;
}) {
  return (
    <div class="prep-slots">
      {(['frame', 'weapon', 'charm', 'amulet'] as const).map((kind) => {
        const id = equipped(entry, kind);
        const d = id ? describe(lib, kind, id) : null;
        return (
          <button
            type="button"
            class="gear-slot"
            key={kind}
            aria-label={`${SLOT_LABEL[kind]} for ${entry.characterId}`}
            onClick={() => onPick(kind)}
          >
            <small>{SLOT_LABEL[kind]}</small>
            <strong>{d ? d.name : 'Nothing fitted'}</strong>
            {d ? <Bonus bonus={d.bonus} /> : <span class="hint">Tap to fit</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Choose a spare item for one slot, seeing what it changes before fitting it. */
function Picker({
  lib,
  entry,
  kind,
  stores,
  onEquip,
  onClose,
}: {
  lib: Library;
  entry: RosterEntry;
  kind: ItemKind;
  stores: Stores;
  onEquip: (id: string | null) => void;
  onClose: () => void;
}) {
  const current = equipped(entry, kind);
  const before = summarize(lib, entry);
  // The fitted item itself is never offered again: picking it would change nothing.
  const options = spares(stores, kind).filter(
    ([id]) => id !== current && canUse(lib, entry, kind, id),
  );
  const withItem = (id: string | null) => summarize(lib, { ...entry, [kind]: id });
  const name = lib.characters.get(entry.characterId)?.name ?? entry.characterId;
  const cur = current ? describe(lib, kind, current) : null;
  return (
    <div class="modal" role="dialog" aria-label={`${SLOT_LABEL[kind]} for ${name}`}>
      <div class="modal-box prep-picker">
        <header>
          <h3>
            {SLOT_LABEL[kind]} · {name}
          </h3>
          <button type="button" class="btn" onClick={onClose}>
            Close
          </button>
        </header>
        <div class="picker-current">
          {cur ? (
            <>
              <small>Fitted now:</small> <strong>{cur.name}</strong> <Bonus bonus={cur.bonus} />{' '}
              <small>{cur.detail}</small>
            </>
          ) : (
            <strong>Nothing fitted</strong>
          )}
        </div>
        <div class="picker-list">
          {options.length === 0 && (
            <p class="empty">
              {kind === 'frame'
                ? 'No spare armaturas. New ones are won in the story or salvaged after victories.'
                : 'No spares in the stores. Buy more in the Armoury.'}
            </p>
          )}
          {options.map(([id, n]) => {
            const d = describe(lib, kind, id);
            return (
              <div class="picker-item" key={id}>
                <div class="pi-text">
                  <strong>
                    {d.name} <small>×{n}</small>
                  </strong>
                  <Bonus bonus={d.bonus} />
                  <small>{d.detail}</small>
                  <Comparison before={before} after={withItem(id)} />
                </div>
                <button type="button" class="btn go" onClick={() => onEquip(id)}>
                  Equip
                </button>
              </div>
            );
          })}
          {current && (kind === 'charm' || kind === 'amulet') && (
            <div class="picker-item">
              <div class="pi-text">
                <strong>Take off {cur?.name}</strong>
                <Comparison before={before} after={withItem(null)} />
              </div>
              <button type="button" class="btn" onClick={() => onEquip(null)}>
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Between battles: fit each pilot with the armaturas, weapons, charms and amulets the company
 * actually owns, and trade in the Armoury (weapons and trinkets only; armaturas are never sold).
 */
export function PrepScreen({ session, lib }: { session: GameSession; lib: Library }) {
  const view = useStore(session.view);
  const [tab, setTab] = useState<Tab>('loadout');
  const [picking, setPicking] = useState<Picking | null>(null);
  const { roster, stores, scudi } = view;

  const allegianceOf = (id: string) => lib.characters.get(id)?.allegiance ?? 'malta';
  const sides = [...new Set(roster.map((r) => allegianceOf(r.characterId)))];
  const stock = companyStock(lib, view.completedBattles, sides);
  const sellable = (['weapon', 'charm', 'amulet'] as const).flatMap((kind) =>
    spares(stores, kind).map(([id, n]) => ({ kind, id, n })),
  );
  const pickingEntry = picking && roster.find((r) => r.characterId === picking.characterId);

  return (
    <main class="prep-screen">
      <header class="prep-head">
        <h2>Preparation</h2>
        <div class="prep-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'loadout'}
            class={`btn tab ${tab === 'loadout' ? 'on' : ''}`}
            onClick={() => setTab('loadout')}
          >
            Armatura &amp; arms
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'armoury'}
            class={`btn tab ${tab === 'armoury' ? 'on' : ''}`}
            onClick={() => setTab('armoury')}
          >
            Armoury
          </button>
        </div>
        <div class="scudi" data-testid="scudi">
          {scudi} scudi
        </div>
      </header>

      {tab === 'loadout' ? (
        <div class="prep-list">
          {roster.map((r) => (
            <div class="prep-row loadout" key={r.characterId}>
              <div class="prep-pilot">
                <strong>{lib.characters.get(r.characterId)?.name}</strong>
                <small>
                  Lv {r.level} · {r.xp}/{lib.balance.xpPerLevel} XP
                </small>
                <RosterStats
                  lib={lib}
                  entry={r}
                  showAttacks
                  onRaise={(stat) => session.raiseStat(r.characterId, stat)}
                />
              </div>
              <Slots
                lib={lib}
                entry={r}
                onPick={(kind) => setPicking({ characterId: r.characterId, kind })}
              />
            </div>
          ))}
        </div>
      ) : (
        <div class="prep-list">
          <h3 class="prep-sub">For sale</h3>
          {stock.length === 0 && <p class="empty">The Armoury shelves are bare.</p>}
          {stock.map((s: ShopItem) => {
            const d = describe(lib, s.kind, s.item);
            const price = priceOf(lib, s.kind, s.item) ?? 0;
            const owned = countOf(stores, s.kind, s.item);
            return (
              <div class="prep-row shop" key={`${s.kind}:${s.item}`}>
                <div class="prep-pilot">
                  <strong>
                    {d.name} <small>· {SLOT_LABEL[s.kind]}</small>
                  </strong>
                  <Bonus bonus={d.bonus} />
                  <small>
                    {d.detail}
                    {owned ? ` · ${owned} spare` : ''}
                  </small>
                </div>
                <button
                  type="button"
                  class="btn"
                  disabled={scudi < price}
                  onClick={() => session.buyItem(s)}
                >
                  Buy · {price}
                </button>
              </div>
            );
          })}
          <h3 class="prep-sub">Sell spares (half price)</h3>
          {sellable.length === 0 && (
            <p class="empty">No spare weapons, charms or amulets. Fitted gear can't be sold.</p>
          )}
          {sellable.map(({ kind, id, n }) => {
            const d = describe(lib, kind, id);
            const back = Math.floor((priceOf(lib, kind, id) ?? 0) / 2);
            return (
              <div class="prep-row shop" key={`sell-${kind}:${id}`}>
                <div class="prep-pilot">
                  <strong>
                    {d.name} <small>×{n}</small>
                  </strong>
                  <Bonus bonus={d.bonus} />
                </div>
                <button type="button" class="btn" onClick={() => session.sellItem(kind, id)}>
                  Sell · {back}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <footer class="prep-foot">
        <button type="button" class="btn go" onClick={() => session.closePrep()}>
          To battle
        </button>
      </footer>

      {picking && pickingEntry && (
        <Picker
          lib={lib}
          entry={pickingEntry}
          kind={picking.kind}
          stores={stores}
          onEquip={(id) => {
            session.equipItem(picking.characterId, picking.kind, id);
            setPicking(null);
          }}
          onClose={() => setPicking(null)}
        />
      )}
    </main>
  );
}
