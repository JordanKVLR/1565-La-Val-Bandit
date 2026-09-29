/**
 * Save-slot storage. localStorage today (saves are a few KB); Capacitor Filesystem / Steam Cloud
 * adapters can replace this later without touching game code.
 */
export type SlotId = 'auto' | 'slot1' | 'slot2' | 'slot3';
export const SLOTS: readonly SlotId[] = ['auto', 'slot1', 'slot2', 'slot3'];

const key = (slot: SlotId) => `armatura.save.${slot}`;

export function writeSave(slot: SlotId, data: unknown): boolean {
  try {
    localStorage.setItem(key(slot), JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function readSave<T>(slot: SlotId): T | null {
  try {
    const raw = localStorage.getItem(key(slot));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function deleteSave(slot: SlotId): void {
  try {
    localStorage.removeItem(key(slot));
  } catch {
    // Nothing to do if storage is unavailable.
  }
}
