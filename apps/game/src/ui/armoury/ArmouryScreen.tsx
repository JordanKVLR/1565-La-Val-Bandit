import type { Library, RosterEntry } from '@m1565/content';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { GameSession } from '../../campaign/GameSession';
import type { ItemKind } from '../../campaign/inventory';
import { equipped } from '../../campaign/inventory';
import { t } from '../../i18n';
import { sfx } from '../../platform/audio';
import { figureSpec } from '../../render/Armatura';
import { SIDE_COLORS } from '../../render/palette';
import { UnitViewer } from '../../render/UnitViewer';
import { useStore } from '../../state/store';
import { Button, Chip, Icon, Panel, useMediaQuery } from '../design';
import { ItemIcon } from './ItemIcon';
import { DetailEmpty, ItemDetail } from './ItemDetail';
import type { Action, ActionId, Mode, ShelfEntry } from './model';
import { iconVariant, itemName, nameOf, shelfSections, sideOf, tierOf } from './model';
import { ArmourerEmblem, KindGlyph, ScudiCounter } from './parts';
import { PilotFace } from './PilotFace';
import { entryKey, Shelf, TABS } from './Shelf';
import { TrainingSheet } from './Training';
import './armoury.css';

type BarkKind = 'greetings' | 'onBuy' | 'onSell' | 'onEquip' | 'tooPoor';
interface Bark {
  readonly kind: BarkKind;
  readonly text: string;
  readonly n: number;
}
interface Selected {
  readonly kind: ItemKind;
  readonly id: string;
  readonly source: ShelfEntry['source'];
  readonly holderId?: string;
}

const slotLabel = (kind: ItemKind): string => t(`item.kind.${kind}`);
const UI_KEY = 'm1565.armoury.ui';
const CONFIRM_MS = 4000;
/** Steam Deck, desktop and TV: a separate detail column beside the shelf. */
const WIDE_QUERY = '(min-width: 1100px) and (min-height: 521px)';

function loadUi(): { tab: ItemKind; mode: Mode } {
  try {
    const raw = JSON.parse(localStorage.getItem(UI_KEY) ?? '{}') as { tab?: string };
    const tab = TABS.find((k) => k === raw.tab) ?? 'weapon';
    return { tab, mode: 'shop' };
  } catch {
    return { tab: 'weapon', mode: 'shop' };
  }
}

/** The pilot's armatura on its plinth, turning slowly; falls back to an icon without WebGL. */
function ArmaturaCanvas({
  lib,
  pilot,
  preview,
}: {
  lib: Library;
  pilot: RosterEntry;
  preview: Selected | null;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const frameId = preview?.kind === 'frame' ? preview.id : pilot.frame;
  const weaponId = preview?.kind === 'weapon' ? preview.id : pilot.weapon;
  const frame = lib.frames.get(frameId);
  const weapon = lib.weapons.get(weaponId);
  useEffect(() => {
    if (!ref.current || !frame || !weapon) return;
    if (matchMedia('(max-height: 300px)').matches) return setFailed(true);
    let viewer: UnitViewer | null = null;
    try {
      viewer = new UnitViewer(
        ref.current,
        figureSpec(
          lib,
          { frameId, frameClass: frame.class, weapon, characterId: pilot.characterId },
          SIDE_COLORS.player,
        ),
      );
      setFailed(false);
    } catch {
      setFailed(true);
    }
    return () => viewer?.dispose();
  }, [frameId, weaponId, pilot.characterId]);
  return (
    <div class="ps-viewer">
      {failed ? (
        <ItemIcon kind="frame" variant={iconVariant(lib, 'frame', frameId)} size={96} title="" />
      ) : (
        <canvas ref={ref} class="arm-viewer" data-testid="arm-viewer" aria-hidden="true" />
      )}
      {preview && (preview.kind === 'frame' || preview.kind === 'weapon') && (
        <Chip tone="gold" icon="info" label={t('armoury.preview')} class="ps-preview" />
      )}
    </div>
  );
}

/** A pilot on the rail: portrait, short name and level; selected with a gold rule and ring. */
function PilotChip({
  lib,
  entry,
  selected,
  onSelect,
}: {
  lib: Library;
  entry: RosterEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  const name = nameOf(lib, entry.characterId);
  const frame = lib.frames.get(entry.frame)?.name ?? entry.frame;
  const points = entry.statPoints ?? 0;
  const label = points
    ? t('armoury.pilotChipPoints', { name, level: entry.level, frame, n: points })
    : t('armoury.pilotChip', { name, level: entry.level, frame });
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      aria-controls="pilot-stage"
      aria-label={label}
      tabIndex={selected ? 0 : -1}
      class={`pilot-chip${selected ? ' on' : ''}`}
      data-testid={`pilot-chip-${entry.characterId}`}
      onClick={onSelect}
    >
      <PilotFace lib={lib} entry={entry} />
      <span class="pc-name">{name.split(' ').pop()}</span>
      <span class="pc-lv">{t('unit.lvUpper', { n: entry.level })}</span>
      {points > 0 && (
        <span class="ds-badge pc-pip" aria-hidden="true">
          +{points}
        </span>
      )}
    </button>
  );
}

/** The selected pilot: name, the turning armatura and the four slots under it. */
function PilotStage({
  lib,
  pilot,
  preview,
  flash,
  onSlot,
}: {
  lib: Library;
  pilot: RosterEntry;
  preview: Selected | null;
  flash: ItemKind | null;
  onSlot: (kind: ItemKind) => void;
}) {
  const side = sideOf(lib, pilot.characterId);
  const frame = lib.frames.get(pilot.frame);
  return (
    <Panel
      as="section"
      class="ar-panel pilot-stage"
      id="pilot-stage"
      testId="pilot-stage"
      aria-label={t('armoury.pilot')}
    >
      <header class="ps-head">
        <h3>{nameOf(lib, pilot.characterId)}</h3>
        <small>
          {[
            t('unit.lvUpper', { n: pilot.level }),
            t(`armoury.side.${side}`),
            frame ? t(`frameClass.armatura.${frame.class}`) : '',
          ].join(t('common.sep'))}
        </small>
      </header>
      <ArmaturaCanvas lib={lib} pilot={pilot} preview={preview} />
      <div class="ps-slots">
        {(['frame', 'weapon', 'charm', 'amulet'] as const).map((kind) => {
          const id = equipped(pilot, kind);
          return (
            <button
              key={kind}
              type="button"
              class={`slot-btn${id ? '' : ' empty'}${flash === kind ? ' flash' : ''}`}
              data-testid={`slot-${kind}`}
              aria-label={t('armoury.slot', {
                slot: slotLabel(kind),
                item: id ? itemName(lib, kind, id) : t('armoury.slotEmpty'),
              })}
              onClick={() => onSlot(kind)}
            >
              {id ? (
                <ItemIcon
                  kind={kind}
                  variant={iconVariant(lib, kind, id)}
                  tier={tierOf(lib, kind, id) ?? 'common'}
                  size={30}
                  title=""
                />
              ) : (
                <span class="slot-empty-ico" aria-hidden="true">
                  <Icon name="plus" />
                </span>
              )}
              <span class="slot-text">
                <small>
                  <KindGlyph kind={kind} />
                  {slotLabel(kind)}
                </small>
                <b>{id ? itemName(lib, kind, id) : t('armoury.empty')}</b>
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

/**
 * Between battles, the armourer's workshop: fit each pilot from the stores, swap gear between
 * pilots, buy from the armourer's stock and sell spares, and spend stat points.
 */
export function ArmouryScreen({ session, lib }: { session: GameSession; lib: Library }) {
  const view = useStore(session.view);
  const { roster, scudi } = view;
  const isWide = useMediaQuery(WIDE_QUERY);
  const [pilotId, setPilotId] = useState(roster[0]?.characterId ?? '');
  const [{ tab, mode }, setUi] = useState(loadUi);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [confirm, setConfirm] = useState<{ key: string; action: ActionId } | null>(null);
  const [training, setTraining] = useState<'open' | 'battle' | null>(null);
  const [nagged, setNagged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<ItemKind | null>(null);
  const [announce, setAnnounce] = useState('');
  const [burst, setBurst] = useState<{ n: number; up: boolean } | null>(null);

  const pilot = roster.find((r) => r.characterId === pilotId) ?? roster[0];
  const side = pilot ? sideOf(lib, pilot.characterId) : 'malta';
  const armourer = lib.armourers[side];
  const barkCount = useRef(0);
  const [bark, setBark] = useState<Bark>(() => ({
    kind: 'greetings',
    text: armourer.greetings[view.completedBattles.length % armourer.greetings.length]!,
    n: 0,
  }));
  const say = (kind: BarkKind, who = armourer) => {
    const lines = who[kind];
    barkCount.current += 1;
    setBark({ kind, text: lines[barkCount.current % lines.length]!, n: barkCount.current });
  };

  useEffect(() => {
    try {
      localStorage.setItem(UI_KEY, JSON.stringify({ tab }));
    } catch {
      // Private mode: the tab just isn't remembered.
    }
  }, [tab]);

  useEffect(() => {
    if (!confirm) return;
    const timer = setTimeout(() => setConfirm(null), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [confirm]);

  const sections = useMemo(
    () => (pilot ? shelfSections(lib, view, pilot.characterId, tab, mode) : []),
    [
      lib,
      view.roster,
      view.stores,
      view.scudi,
      view.completedBattles,
      pilot?.characterId,
      tab,
      mode,
    ],
  );
  const all = sections.flatMap((s) => s.entries);
  const selectedKey = selected ? entryKey(selected) : null;
  const entry: ShelfEntry | null = selectedKey
    ? (all.find((e) => entryKey(e) === selectedKey) ??
      // An item that moved section (fitted, sold down to the stock): follow it by id.
      all.find((e) => e.kind === selected!.kind && e.id === selected!.id && !e.holderId) ??
      null)
    : null;

  const lastCard = useRef<string | null>(null);
  /** Closes the detail and puts focus back on the card that opened it. */
  const closeDetail = () => {
    setSelected(null);
    const key = lastCard.current;
    requestAnimationFrame(() => {
      const card = key && document.querySelector<HTMLElement>(`.item-card[data-key="${key}"]`);
      (card || document.querySelector<HTMLElement>('.item-card'))?.focus({ preventScroll: true });
    });
  };

  const pickPilot = (id: string) => {
    if (id === pilot?.characterId) return;
    const next = sideOf(lib, id);
    setPilotId(id);
    setSelected(null);
    setConfirm(null);
    setError(null);
    if (next !== side) say('greetings', lib.armourers[next]);
    sfx('tap');
  };
  const setTab = (k: ItemKind) => {
    setUi({ tab: k, mode: 'shop' });
    setSelected(null);
    setConfirm(null);
    setError(null);
  };
  const setMode = (m: Mode) => {
    setUi({ tab, mode: m });
    setSelected(null);
    setConfirm(null);
    setError(null);
  };
  const select = (e: ShelfEntry) => {
    const key = entryKey(e);
    setConfirm(null);
    setError(null);
    if (key === selectedKey && !isWide) return closeDetail();
    setSelected({
      kind: e.kind,
      id: e.id,
      source: e.source,
      ...(e.holderId ? { holderId: e.holderId } : {}),
    });
    lastCard.current = key;
    if (!isWide)
      requestAnimationFrame(() => document.querySelector<HTMLElement>('.id-title h3')?.focus());
    sfx('select');
  };
  const onSlot = (kind: ItemKind) => {
    if (!pilot) return;
    setUi({ tab: kind, mode: 'shop' });
    setConfirm(null);
    setError(null);
    const id = equipped(pilot, kind);
    setSelected(id ? { kind, id, source: 'fitted' } : null);
  };

  const run = (action: Action) => {
    if (!entry || !pilot) return;
    const key = entryKey(entry);
    const price = entry.price ?? 0;
    const buying = action.id === 'buy' || action.id === 'buy-equip';
    if (buying && price > scudi) {
      say('tooPoor');
      return;
    }
    if (
      buying &&
      price > scudi * lib.balance.armouryConfirmFraction &&
      !(confirm?.key === key && confirm.action === action.id)
    ) {
      setConfirm({ key, action: action.id });
      return;
    }
    setConfirm(null);
    const who = nameOf(lib, pilot.characterId);
    try {
      switch (action.id) {
        case 'equip':
          session.equipItem(pilot.characterId, entry.kind, entry.id);
          break;
        case 'swap':
        case 'take':
          session.swapItem(pilot.characterId, entry.holderId!, entry.kind);
          break;
        case 'buy':
          session.buyItem(entry.shopItem!);
          break;
        case 'buy-equip':
          session.buyItem(entry.shopItem!);
          session.equipItem(pilot.characterId, entry.kind, entry.id);
          break;
        case 'remove':
          session.equipItem(pilot.characterId, entry.kind, null);
          break;
        case 'sell':
          session.sellItem(entry.kind, entry.id);
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return;
    }
    const left = session.state.scudi;
    const fits = action.id !== 'buy' && action.id !== 'sell';
    if (fits) {
      setFlash(entry.kind);
      setTimeout(() => setFlash(null), 400);
    }
    if (buying || action.id === 'sell')
      setBurst({ n: (burst?.n ?? 0) + 1, up: action.id === 'sell' });
    say(buying ? 'onBuy' : action.id === 'sell' ? 'onSell' : 'onEquip');
    sfx('select');
    const item = entry.name;
    const msg: Record<ActionId, () => string> = {
      equip: () => t('armoury.did.equip', { who, item }),
      swap: () => t('armoury.did.swap', { who, item }),
      take: () => t('armoury.did.take', { who, item }),
      'buy-equip': () => t('armoury.did.buyEquip', { who, item, left }),
      buy: () => t('armoury.did.buy', { item, left }),
      remove: () => t('armoury.did.remove', { who, item }),
      sell: () => t('armoury.did.sell', { item, left }),
    };
    setAnnounce(msg[action.id]());
    if (action.id === 'remove' || (action.id === 'sell' && entry.owned <= 1)) closeDetail();
    else if (fits) setSelected({ kind: entry.kind, id: entry.id, source: 'fitted' });
  };

  const pending = roster.reduce((n, r) => n + (r.statPoints ?? 0), 0);
  const toBattle = () => {
    if (pending > 0 && !nagged) {
      setNagged(true);
      const first = roster.find((r) => (r.statPoints ?? 0) > 0);
      if (first) setPilotId(first.characterId);
      setTraining('battle');
      return;
    }
    session.closePrep();
  };

  // Keyboard: Esc backs out, Q/E change shelf, [ ] change pilot.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest('input, textarea')) return;
      if (e.key === 'Escape') {
        if (confirm) setConfirm(null);
        else if (training) setTraining(null);
        else if (selected) closeDetail();
        return;
      }
      if (training) return;
      const k = e.key.toLowerCase();
      if ((k === 'q' || k === 'e') && mode === 'shop') {
        const i = TABS.indexOf(tab);
        setTab(TABS[(i + (k === 'e' ? 1 : TABS.length - 1)) % TABS.length]!);
      } else if ((k === '[' || k === ']') && roster.length > 1 && pilot) {
        const i = roster.indexOf(pilot);
        pickPilot(roster[(i + (k === ']' ? 1 : roster.length - 1)) % roster.length]!.characterId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const onRailKey = (e: KeyboardEvent) => {
    if (!pilot || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    const i = roster.indexOf(pilot);
    const next = roster[(i + (e.key === 'ArrowDown' ? 1 : roster.length - 1)) % roster.length]!;
    pickPilot(next.characterId);
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>(`[data-testid="pilot-chip-${next.characterId}"]`)
        ?.focus(),
    );
  };

  if (!pilot) {
    return (
      <main class="armoury is-empty" data-testid="armoury-screen">
        <p class="shelf-empty">{t('armoury.nobody')}</p>
        <Button
          variant="primary"
          size="lg"
          label={t('armoury.onward')}
          testId="to-battle"
          onClick={() => session.closePrep()}
        />
      </main>
    );
  }

  const detail = entry ? (
    <ItemDetail
      key={entryKey(entry)}
      lib={lib}
      pilot={pilot}
      entry={entry}
      mode={mode}
      scudi={scudi}
      confirming={confirm && confirm.key === entryKey(entry) ? confirm.action : null}
      error={error}
      onAction={run}
      onClose={closeDetail}
    />
  ) : null;

  return (
    <main
      class={`armoury${isWide ? ' wide' : ''}`}
      data-side={side}
      data-testid="armoury-screen"
      aria-label={t('armoury.label')}
    >
      <header class="armourer-bar" data-testid="armourer-bar">
        <ArmourerEmblem side={side} />
        <div class="ab-who">
          <div class="ab-name">
            <b data-testid="armourer-name">{armourer.name}</b>
            <small>{armourer.title}</small>
          </div>
          <q key={bark.n} class="ab-bark" data-testid="armourer-bark">
            {bark.text}
          </q>
        </div>
        <div class="ab-purse">
          <ScudiCounter value={scudi} />
          {burst && (
            <span key={burst.n} class={`coin-burst ${burst.up ? 'in' : 'out'}`} aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => (
                <i key={i} style={{ '--i': i }} />
              ))}
            </span>
          )}
        </div>
        <Button
          class="ab-train"
          label={t('armoury.train')}
          testId="train"
          onClick={() => setTraining('open')}
        >
          {pending > 0 && (
            <>
              <span class="ds-badge" aria-hidden="true">
                {pending}
              </span>
              <span class="ds-visually-hidden">{t('roster.pointsToSpend', { n: pending })}</span>
            </>
          )}
        </Button>
        <Button
          class="ab-battle"
          variant="primary"
          icon="chevronRight"
          label={t('armoury.toBattle')}
          testId="to-battle"
          onClick={toBattle}
        />
      </header>

      <nav
        class="pilot-rail"
        role="tablist"
        aria-orientation="vertical"
        aria-label={t('armoury.pilots')}
        data-testid="pilot-rail"
        onKeyDown={onRailKey}
      >
        {roster.map((r) => (
          <PilotChip
            key={r.characterId}
            lib={lib}
            entry={r}
            selected={r.characterId === pilot.characterId}
            onSelect={() => pickPilot(r.characterId)}
          />
        ))}
      </nav>

      <div class="ar-stage">
        {!isWide && detail ? (
          detail
        ) : (
          <PilotStage
            lib={lib}
            pilot={pilot}
            preview={mode === 'shop' && entry && entry.source !== 'fitted' ? selected : null}
            flash={flash}
            onSlot={onSlot}
          />
        )}
      </div>

      <Shelf
        lib={lib}
        pilot={pilot}
        tab={tab}
        mode={mode}
        sections={sections}
        selectedKey={entry ? entryKey(entry) : null}
        onTab={setTab}
        onMode={setMode}
        onSelect={select}
      />

      {isWide && <div class="ar-detail">{detail ?? <DetailEmpty side={side} />}</div>}

      <div class="ds-visually-hidden" aria-live="polite">
        {announce}
      </div>

      {training && (
        <TrainingSheet
          lib={lib}
          roster={roster}
          pilotId={pilot.characterId}
          onPilot={(id) => pickPilot(id)}
          onRaise={(id, stat) => session.raiseStat(id, stat)}
          onClose={() => setTraining(null)}
          onBattle={training === 'battle' ? () => session.closePrep() : null}
        />
      )}
    </main>
  );
}
