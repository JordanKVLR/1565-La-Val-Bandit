/**
 * Save storage: save slots, settings and the player profile (achievements).
 *
 * Every write is crash-safe, because a console (or a phone) can suspend or kill the game at any
 * moment, even halfway through writing. Each record lives under its key plus two helpers:
 *
 * - `<key>.tmp`: the new copy is written here first and read back to check it is whole;
 * - `<key>.bak`: the previous good copy, kept when the new one replaces it.
 *
 * A write goes tmp → (check) → bak ← old primary → primary ← new → remove tmp. Whichever step a
 * kill interrupts, a read still finds a whole copy: an interrupted tmp leaves the primary as it
 * was; an interrupted primary leaves the new copy complete in tmp; a primary that is damaged in
 * any other way falls back to the backup. The primary key keeps the plain JSON format older
 * builds wrote, so existing saves load unchanged (see docs/adr/0011-console-readiness-saves-lifecycle-trophies.md).
 *
 * The backend is localStorage today. Native adapters (Capacitor Filesystem, Electron fs + Steam
 * Cloud, a console SDK's save-data API) implement `KeyValueBackend` and plug in with
 * `setStorageBackend`, without touching game code. `flushStorage` asks the platform to make
 * the writes durable (Electron commits Chromium's storage to disk), for the suspend hooks.
 */
export type SlotId = 'auto' | 'slot1' | 'slot2' | 'slot3';
export const SLOTS: readonly SlotId[] = ['auto', 'slot1', 'slot2', 'slot3'];

/** Synchronous string storage: `localStorage`, or a native adapter with the same shape. */
export interface KeyValueBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Where a read found its copy. */
export type ReadSource = 'primary' | 'temp' | 'backup';

const TMP = '.tmp';
const BAK = '.bak';

let override: KeyValueBackend | null = null;
const flushers = new Set<() => Promise<void> | void>();

/** Replaces the storage backend (native adapters, tests). `null` restores localStorage. */
export function setStorageBackend(backend: KeyValueBackend | null): void {
  override = backend;
}

function backend(): KeyValueBackend | null {
  if (override) return override;
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    // Accessing localStorage itself can throw (blocked cookies, sandboxed frames).
    return null;
  }
}

/** A copy is usable when it parses as a JSON object (a cut-off write never does). */
function usable(raw: string | null): raw is string {
  if (!raw) return false;
  try {
    const v: unknown = JSON.parse(raw);
    return typeof v === 'object' && v !== null;
  } catch {
    return false;
  }
}

function get(b: KeyValueBackend, key: string): string | null {
  try {
    return b.getItem(key);
  } catch {
    return null;
  }
}

function remove(b: KeyValueBackend, key: string): void {
  try {
    b.removeItem(key);
  } catch {
    // Nothing to do if storage is unavailable.
  }
}

/**
 * Writes `value` (a JSON object's text) under `key` so that a crash at any point leaves a whole
 * copy readable. Returns false if the new copy could not be stored; the old one then remains.
 */
export function writeRecord(key: string, value: string): boolean {
  const b = backend();
  if (!b || !usable(value)) return false;
  try {
    // 1. The new copy goes to the side first, and must read back whole.
    b.setItem(key + TMP, value);
    if (get(b, key + TMP) !== value) return false;
  } catch {
    return false;
  }
  // 2. The current copy, if whole, becomes the backup. Optional: tmp still covers a crash.
  const current = get(b, key);
  if (usable(current) && current !== value) {
    try {
      b.setItem(key + BAK, current);
    } catch {
      // Out of space for a backup: carry on; the new copy is safe in tmp until step 3 ends.
    }
  }
  try {
    // 3. Replace the primary, then drop the side copy.
    b.setItem(key, value);
    if (get(b, key) !== value) return false;
  } catch {
    return false;
  }
  remove(b, key + TMP);
  return true;
}

/**
 * Reads the newest whole copy under `key`: an unfinished write's side copy (it is newer than
 * the primary), else the primary, else the backup. `accept` can reject a copy that parses but
 * is unusable (for example a save that no longer migrates), so the next one is tried.
 */
export function readRecord(
  key: string,
  accept: (raw: string) => boolean = () => true,
): { readonly raw: string; readonly source: ReadSource } | null {
  const b = backend();
  if (!b) return null;
  const order: [string, ReadSource][] = [
    [key + TMP, 'temp'],
    [key, 'primary'],
    [key + BAK, 'backup'],
  ];
  for (const [k, source] of order) {
    const raw = get(b, k);
    if (usable(raw) && accept(raw)) return { raw, source };
  }
  return null;
}

/** Removes a record with its side copy and backup. */
export function deleteRecord(key: string): void {
  const b = backend();
  if (!b) return;
  for (const k of [key, key + TMP, key + BAK]) remove(b, k);
}

/** Reads a JSON record (see `readRecord`), or null. */
export function readJson<T>(key: string): T | null {
  const found = readRecord(key);
  return found ? (JSON.parse(found.raw) as T) : null;
}

/** Writes a JSON record crash-safely (see `writeRecord`). */
export function writeJson(key: string, data: unknown): boolean {
  let text: string;
  try {
    text = JSON.stringify(data);
  } catch {
    return false;
  }
  return writeRecord(key, text);
}

export const saveKey = (slot: SlotId) => `armatura.save.${slot}`;

export function writeSave(slot: SlotId, data: unknown): boolean {
  return writeJson(saveKey(slot), data);
}

export function readSave<T>(slot: SlotId): T | null {
  return readJson<T>(saveKey(slot));
}

export function deleteSave(slot: SlotId): void {
  deleteRecord(saveKey(slot));
}

/** Registers a platform hook that makes finished writes durable (see `flushStorage`). */
export function onFlushStorage(flush: () => Promise<void> | void): () => void {
  flushers.add(flush);
  return () => flushers.delete(flush);
}

/**
 * Makes every finished write durable before the app may be suspended or killed. Writes are
 * synchronous, so nothing is queued in the game itself; this asks the platform (Electron:
 * Chromium's storage commit) to put them on disk now.
 */
export async function flushStorage(): Promise<void> {
  await Promise.all(
    [...flushers].map(async (f) => {
      try {
        await f();
      } catch {
        // A failed flush leaves the platform's own lazy commit to finish the job.
      }
    }),
  );
}
