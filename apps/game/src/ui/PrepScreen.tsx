import type { Library, RosterEntry, ShopItem } from '@m1565/content';
import { ALLEGIANCE_FACTIONS } from '@m1565/content';
import { useState } from 'preact/hooks';
import type { GameSession } from '../campaign/GameSession';
import { useStore } from '../state/store';

type Tab = 'loadout' | 'shop';

/** Between battles: choose each pilot's frame and weapon, and buy new designs. */
export function PrepScreen({ session, lib }: { session: GameSession; lib: Library }) {
  const view = useStore(session.view);
  const [roster, setRoster] = useState<RosterEntry[]>([...view.roster]);
  const [armory, setArmory] = useState<string[]>([...view.armory]);
  const [scudi, setScudi] = useState(view.scudi);
  const [tab, setTab] = useState<Tab>('loadout');

  const allegianceOf = (id: string) => lib.characters.get(id)?.allegiance ?? 'malta';
  const framesFor = (id: string) => {
    const factions: readonly string[] = ALLEGIANCE_FACTIONS[allegianceOf(id)];
    return armory.filter((a) => {
      const f = lib.frames.get(a);
      return f && factions.includes(lib.frameFactions.get(a) ?? '');
    });
  };
  const weaponsFor = (id: string) => {
    const own = allegianceOf(id);
    return armory.filter((a) => {
      if (!lib.weapons.has(a)) return false;
      const listing = lib.shop.find((s) => s.item === a);
      return (
        !listing ||
        listing.allegiance === own ||
        roster.some((r) => r.characterId === id && r.weapon === a)
      );
    });
  };
  const setLoadout = (id: string, patch: Partial<Pick<RosterEntry, 'frame' | 'weapon'>>) =>
    setRoster((rs) => rs.map((r) => (r.characterId === id ? { ...r, ...patch } : r)));

  // Only sell to the side currently fielded (Maltese or Ottoman pilots in the roster).
  const sides = new Set(roster.map((r) => allegianceOf(r.characterId)));
  const forSale = lib.shop.filter(
    (s: ShopItem) =>
      sides.has(s.allegiance) &&
      !armory.includes(s.item) &&
      (s.after === null || view.completedBattles.includes(s.after)),
  );
  const buy = (s: ShopItem) => {
    if (scudi < s.price) return;
    setScudi(scudi - s.price);
    setArmory([...armory, s.item]);
  };
  const itemName = (s: ShopItem) =>
    (s.kind === 'frame' ? lib.frames.get(s.item)?.name : lib.weapons.get(s.item)?.name) ?? s.item;
  const itemDetail = (s: ShopItem) => {
    if (s.kind === 'frame') {
      const f = lib.frames.get(s.item);
      return f
        ? `HP ${f.hp} · ARM ${f.armour} · MOV ${f.move} · AGI ${f.agility >= 0 ? '+' : ''}${f.agility}`
        : '';
    }
    const w = lib.weapons.get(s.item);
    return w
      ? `POW ${w.power} · ACC ${w.accuracy} · AP ${w.apCost} · range ${w.minRange}–${w.maxRange}`
      : '';
  };

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
            Loadout
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'shop'}
            class={`btn tab ${tab === 'shop' ? 'on' : ''}`}
            onClick={() => setTab('shop')}
          >
            Workshop
          </button>
        </div>
        <div class="scudi" data-testid="scudi">
          {scudi} scudi
        </div>
      </header>

      {tab === 'loadout' ? (
        <div class="prep-list">
          {roster.map((r) => (
            <div class="prep-row" key={r.characterId}>
              <div class="prep-pilot">
                <strong>{lib.characters.get(r.characterId)?.name}</strong>
                <small>
                  Lv {r.level} · STR {r.stats.str} SKL {r.stats.skl} AGI {r.stats.agi}
                </small>
              </div>
              <label>
                <span>Frame</span>
                <select
                  id={`frame-${r.characterId}`}
                  value={r.frame}
                  onChange={(e) =>
                    setLoadout(r.characterId, { frame: (e.target as HTMLSelectElement).value })
                  }
                >
                  {framesFor(r.characterId).map((f) => (
                    <option value={f} key={f}>
                      {lib.frames.get(f)?.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Weapon</span>
                <select
                  id={`weapon-${r.characterId}`}
                  value={r.weapon}
                  onChange={(e) =>
                    setLoadout(r.characterId, { weapon: (e.target as HTMLSelectElement).value })
                  }
                >
                  {weaponsFor(r.characterId).map((w) => (
                    <option value={w} key={w}>
                      {lib.weapons.get(w)?.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}
        </div>
      ) : (
        <div class="prep-list">
          {forSale.length === 0 && (
            <p class="empty">Nothing new in the workshop yet. Win battles to unlock designs.</p>
          )}
          {forSale.map((s) => (
            <div class="prep-row shop" key={s.item}>
              <div class="prep-pilot">
                <strong>{itemName(s)}</strong>
                <small>
                  {s.kind === 'frame' ? 'Frame' : 'Weapon'} · {itemDetail(s)}
                </small>
              </div>
              <button type="button" class="btn" disabled={scudi < s.price} onClick={() => buy(s)}>
                Buy · {s.price}
              </button>
            </div>
          ))}
        </div>
      )}

      <footer class="prep-foot">
        <button
          type="button"
          class="btn go"
          onClick={() => session.closePrep(roster, scudi, armory)}
        >
          To battle
        </button>
      </footer>
    </main>
  );
}
