import type { Library, RosterEntry } from '@m1565/content';
import type { ItemKind } from '../../campaign/inventory';
import { bonusText } from '../battle/statInfo';
import { ItemIcon } from './ItemIcon';
import type { Mode, ShelfEntry, ShelfSection } from './model';
import { headlineDelta, iconVariant, nameOf, previewFor } from './model';
import { CoinGlyph, TierBadge } from './parts';

export const TABS: readonly { kind: ItemKind; label: string; short: string }[] = [
  { kind: 'weapon', label: 'Weapons', short: 'Arms' },
  { kind: 'charm', label: 'Charms', short: 'Charms' },
  { kind: 'amulet', label: 'Amulets', short: 'Amulets' },
  { kind: 'frame', label: 'Armaturas', short: 'Harness' },
];

/** The test id part of an entry: pilot-held items are distinct per holder. */
export const cardId = (e: Pick<ShelfEntry, 'kind' | 'id' | 'holderId'>) =>
  `${e.kind}-${e.id}${e.holderId ? `-on-${e.holderId}` : ''}`;

/** A stable key for an entry: the same item can sit in the stores and in the stock at once. */
export const entryKey = (e: Pick<ShelfEntry, 'kind' | 'id' | 'holderId' | 'source'>) =>
  `${e.source}:${cardId(e)}`;

const TAB_ICON: Record<ItemKind, { kind: 'weapon' | 'frame' | 'charm' | 'amulet'; v: string }> = {
  weapon: { kind: 'weapon', v: 'blade' },
  charm: { kind: 'charm', v: 'charm-pow-1' },
  amulet: { kind: 'amulet', v: 'pilgrim-shell' },
  frame: { kind: 'frame', v: 'knight' },
};

function emptyText(tab: ItemKind, mode: Mode): string {
  if (mode === 'sell')
    return "No spares to sell. Fitted gear can't be sold, and armaturas are never traded.";
  if (tab === 'frame')
    return 'No spare armaturas. New harnesses are won in the story or salvaged after victories.';
  return 'Nothing on this shelf yet. Win battles to unlock stock.';
}

/** The chips on a card: up to three bonuses, or the frame's HP and MOV. */
function chips(lib: Library, e: ShelfEntry): string[] {
  const parts = bonusText(e.bonus)
    .split(' · ')
    .filter(Boolean)
    .sort((a, b) => Math.abs(parseInt(b.slice(3))) - Math.abs(parseInt(a.slice(3))));
  if (e.kind === 'frame') {
    const f = lib.frames.get(e.id);
    return f ? [`HP ${f.hp}`, `MOV ${f.move}`, ...parts.slice(0, 2)] : parts;
  }
  return parts.slice(0, 3);
}

function foot(lib: Library, e: ShelfEntry, mode: Mode) {
  if (mode === 'sell')
    return (
      <span class="ic-price">
        <CoinGlyph /> Sell · {e.sellPrice ?? 0}
      </span>
    );
  switch (e.source) {
    case 'fitted':
      return <span class="ic-stamp">✠ Fitted</span>;
    case 'stores':
      return <span class="ic-owned">×{e.owned} in stores</span>;
    case 'pilot':
      return <span class="ic-owned">On {nameOf(lib, e.holderId ?? '')}</span>;
    case 'shop':
      return (
        <span class="ic-price">
          <CoinGlyph /> {e.price ?? 0}
          {e.owned > 0 && <small> · ×{e.owned} owned</small>}
        </span>
      );
    case 'unusable':
      return <span class="ic-owned">Other side</span>;
  }
}

function ItemCard({
  lib,
  pilot,
  entry,
  mode,
  selected,
  tabStop,
  onSelect,
}: {
  lib: Library;
  pilot: RosterEntry | undefined;
  entry: ShelfEntry;
  mode: Mode;
  selected: boolean;
  /** Roving tab stop: only one card in the grid is reachable with Tab. */
  tabStop: boolean;
  onSelect: () => void;
}) {
  const hint =
    pilot && mode === 'shop' && entry.source !== 'fitted' && entry.source !== 'unusable'
      ? (() => {
          const p = previewFor(lib, pilot, entry.kind, entry.id);
          return headlineDelta(p.before, p.after);
        })()
      : null;
  const cs = chips(lib, entry);
  const tierWord = entry.tier ?? lib.frames.get(entry.id)?.class ?? '';
  const label = [
    entry.name,
    tierWord,
    cs.join(', '),
    entry.source === 'shop' && mode === 'shop' ? `${entry.price} scudi` : null,
    mode === 'sell' ? `sells for ${entry.sellPrice} scudi` : null,
    entry.source === 'fitted' ? 'fitted' : null,
    hint,
    entry.blocked ? `unavailable: ${entry.blocked}` : null,
  ]
    .filter(Boolean)
    .join(', ');
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      aria-label={label}
      tabIndex={tabStop ? 0 : -1}
      class={`item-card t-${entry.tier ?? 'frame'}${selected ? ' selected' : ''}${entry.blocked ? ' is-blocked' : ''}`}
      data-testid={`item-card-${cardId(entry)}`}
      data-key={entryKey(entry)}
      data-source={entry.source}
      data-blocked={entry.blocked ? 'true' : 'false'}
      onClick={onSelect}
    >
      <span class="ic-icon">
        <ItemIcon
          kind={entry.kind}
          variant={iconVariant(lib, entry.kind, entry.id)}
          tier={entry.tier ?? 'common'}
          size={40}
          title=""
        />
        {entry.blocked && (
          <span class="ic-lock" aria-hidden="true">
            🔒
          </span>
        )}
      </span>
      <span class="ic-name">{entry.name}</span>
      <span class="ic-chips">
        {entry.blocked ? (
          <span class="ic-reason">{entry.blocked}</span>
        ) : (
          cs.map((c) => (
            <span key={c} class={`chip${/-\d/.test(c) ? ' neg' : ''}`}>
              {c}
            </span>
          ))
        )}
      </span>
      <span class="ic-tier">
        {entry.tier ? <TierBadge tier={entry.tier} /> : <span class="frame-class">{tierWord}</span>}
      </span>
      <span class="ic-foot">
        {hint && !entry.blocked && (
          <span class="ic-hints">
            {hint.split('  ').map((h) => (
              <span key={h} class={`ic-hint${h.startsWith('▼') ? ' down' : ''}`}>
                {h}
              </span>
            ))}
          </span>
        )}
        {foot(lib, entry, mode)}
      </span>
    </button>
  );
}

export function Shelf({
  lib,
  pilot,
  tab,
  mode,
  sections,
  selectedKey,
  onTab,
  onMode,
  onSelect,
}: {
  lib: Library;
  pilot: RosterEntry | undefined;
  tab: ItemKind;
  mode: Mode;
  sections: readonly ShelfSection[];
  selectedKey: string | null;
  onTab: (kind: ItemKind) => void;
  onMode: (mode: Mode) => void;
  onSelect: (entry: ShelfEntry) => void;
}) {
  const active = TABS.find((t) => t.kind === tab)!;
  const onTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const i = TABS.findIndex((t) => t.kind === tab);
    const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]!;
    onTab(next.kind);
    document.getElementById(`shelf-tab-${next.kind}`)?.focus();
  };
  const onGridKey = (e: KeyboardEvent) => {
    const grid = e.currentTarget as HTMLElement;
    const cards = [...grid.querySelectorAll<HTMLButtonElement>('.item-card')];
    const i = cards.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const cols = Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(' ').length);
    const step: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: cols,
      ArrowUp: -cols,
    };
    const j =
      e.key in step
        ? i + step[e.key]!
        : e.key === 'Home'
          ? 0
          : e.key === 'End'
            ? cards.length - 1
            : null;
    // Past the first or last card, the key is left for spatial focus (keyboard and gamepad
    // can then reach the tabs and buttons around the grid; see ui/input.ts).
    if (j === null || j < 0 || j >= cards.length) return;
    e.preventDefault();
    cards[j]?.focus();
  };
  const empty = sections.every((s) => s.entries.length === 0);
  const keys = sections.flatMap((s) => s.entries.map(entryKey));
  const stop = selectedKey && keys.includes(selectedKey) ? selectedKey : keys[0];
  return (
    <section
      class={`ar-panel shelf${mode === 'sell' ? ' selling' : ''}`}
      data-testid="shelf"
      aria-label="Shelf"
    >
      <div class="shelf-head">
        {mode === 'shop' ? (
          <div class="shelf-tabs" role="tablist" aria-label="Item kinds" onKeyDown={onTabKey}>
            {TABS.map((t) => (
              <button
                key={t.kind}
                id={`shelf-tab-${t.kind}`}
                type="button"
                role="tab"
                aria-selected={t.kind === tab}
                aria-controls="shelf-panel"
                tabIndex={t.kind === tab ? 0 : -1}
                class={`shelf-tab${t.kind === tab ? ' on' : ''}`}
                data-testid={`shelf-tab-${t.kind}`}
                onClick={() => onTab(t.kind)}
              >
                <ItemIcon
                  kind={TAB_ICON[t.kind].kind}
                  variant={TAB_ICON[t.kind].v}
                  size={22}
                  title=""
                />
                <span class="tl-long">{t.label}</span>
                <span class="tl-short">{t.short}</span>
              </button>
            ))}
          </div>
        ) : (
          <h3 class="shelf-sell-title">Sell spares (half price)</h3>
        )}
        <button
          type="button"
          class={`shelf-mode${mode === 'sell' ? ' on' : ''}`}
          aria-pressed={mode === 'sell'}
          data-testid="shelf-mode-sell"
          onClick={() => onMode(mode === 'sell' ? 'shop' : 'sell')}
        >
          <CoinGlyph /> {mode === 'sell' ? 'Done selling' : 'Sell spares'}
        </button>
      </div>
      <div
        id="shelf-panel"
        class="shelf-grid"
        role="listbox"
        aria-label={mode === 'sell' ? 'Spares to sell' : active.label}
        onKeyDown={onGridKey}
      >
        {empty && (
          <p class="shelf-empty" role="note">
            {emptyText(tab, mode)}
          </p>
        )}
        {sections.map((s) => [
          <h4
            key={`h-${s.title}`}
            class="shelf-sec"
            data-testid={`shelf-section-${s.source}`}
            role="presentation"
          >
            {s.title}
          </h4>,
          ...s.entries.map((e) => (
            <ItemCard
              key={`${s.title}-${entryKey(e)}`}
              lib={lib}
              pilot={pilot}
              entry={e}
              mode={mode}
              selected={selectedKey === entryKey(e)}
              tabStop={stop === entryKey(e)}
              onSelect={() => onSelect(e)}
            />
          )),
        ])}
      </div>
    </section>
  );
}
