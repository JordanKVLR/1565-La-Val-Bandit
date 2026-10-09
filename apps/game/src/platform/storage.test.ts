import { afterEach, describe, expect, it } from 'vitest';
import type { KeyValueBackend } from './storage';
import {
  deleteSave,
  flushStorage,
  onFlushStorage,
  readRecord,
  readSave,
  saveKey,
  setStorageBackend,
  writeRecord,
  writeSave,
} from './storage';

/**
 * In-memory storage that can be told to "die" during the n-th setItem from now: it stores only
 * the first half of the value (a torn write) and then throws, like a process killed mid-write.
 */
class FlakyStorage implements KeyValueBackend {
  readonly data = new Map<string, string>();
  private crashIn = -1;
  private tornWrite = true;
  writes: string[] = [];

  crashOnWrite(n: number, torn = true): void {
    this.crashIn = n;
    this.tornWrite = torn;
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.writes.push(key);
    if (this.crashIn === 0) {
      this.crashIn = -1;
      if (this.tornWrite) this.data.set(key, value.slice(0, Math.floor(value.length / 2)));
      throw new Error('killed mid-write');
    }
    if (this.crashIn > 0) this.crashIn -= 1;
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }
}

const v1 = { version: 3, scudi: 100, note: 'first' };
const v2 = { version: 3, scudi: 250, note: 'second' };

afterEach(() => setStorageBackend(null));

describe('crash-safe records', () => {
  it('writes the primary in the plain format older builds read, leaving no side copy', () => {
    const s = new FlakyStorage();
    setStorageBackend(s);
    expect(writeSave('auto', v1)).toBe(true);
    expect(JSON.parse(s.data.get(saveKey('auto'))!)).toEqual(v1);
    expect(s.data.has(`${saveKey('auto')}.tmp`)).toBe(false);
    expect(readSave('auto')).toEqual(v1);
  });

  it('keeps the previous good copy as a backup', () => {
    const s = new FlakyStorage();
    setStorageBackend(s);
    writeSave('slot1', v1);
    writeSave('slot1', v2);
    expect(JSON.parse(s.data.get(`${saveKey('slot1')}.bak`)!)).toEqual(v1);
    expect(readSave('slot1')).toEqual(v2);
  });

  // The write order is tmp, bak, primary. Kill it at each step, torn or clean, and the game
  // must always read back a whole save: the old one or the new one, never a broken one.
  for (const torn of [true, false]) {
    for (const step of [0, 1, 2]) {
      it(`survives a kill during write step ${step + 1} (${torn ? 'torn' : 'clean'} write)`, () => {
        const s = new FlakyStorage();
        setStorageBackend(s);
        writeSave('auto', v1);
        s.crashOnWrite(step, torn);
        // A lost backup alone does not fail the write: the new save is in place.
        expect(writeSave('auto', v2)).toBe(step === 1);
        const back = readSave<typeof v1>('auto');
        expect([v1, v2]).toContainEqual(back);
        // After a kill while replacing the primary, the finished side copy carries the new save.
        if (step === 2) expect(back).toEqual(v2);
        // The next write succeeds and cleans up.
        expect(writeSave('auto', v2)).toBe(true);
        expect(readSave('auto')).toEqual(v2);
        expect(s.data.has(`${saveKey('auto')}.tmp`)).toBe(false);
      });
    }
  }

  it('falls back to the backup when the primary is damaged', () => {
    const s = new FlakyStorage();
    setStorageBackend(s);
    writeSave('auto', v1);
    writeSave('auto', v2);
    s.data.set(saveKey('auto'), '{"version":3,"scu');
    expect(readRecord(saveKey('auto'))?.source).toBe('backup');
    expect(readSave('auto')).toEqual(v1);
  });

  it('lets the caller reject a copy that parses but is unusable', () => {
    const s = new FlakyStorage();
    setStorageBackend(s);
    writeSave('auto', v1);
    writeSave('auto', v2);
    const found = readRecord(saveKey('auto'), (raw) => !raw.includes('second'));
    expect(found?.source).toBe('backup');
  });

  it('refuses to store text that is not a JSON object, keeping the old save', () => {
    const s = new FlakyStorage();
    setStorageBackend(s);
    writeSave('auto', v1);
    expect(writeRecord(saveKey('auto'), '{"cut')).toBe(false);
    expect(writeRecord(saveKey('auto'), '42')).toBe(false);
    expect(readSave('auto')).toEqual(v1);
  });

  it('fails cleanly when storage is full or missing', () => {
    const full: KeyValueBackend = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {},
    };
    setStorageBackend(full);
    expect(writeSave('auto', v1)).toBe(false);
    expect(readSave('auto')).toBeNull();
    setStorageBackend(null); // node has no localStorage
    expect(writeSave('auto', v1)).toBe(false);
    expect(readSave('auto')).toBeNull();
  });

  it('detects storage that silently drops a write', () => {
    const s = new FlakyStorage();
    setStorageBackend({
      getItem: (k) => s.getItem(k),
      setItem: (k, v) => (k.endsWith('.tmp') ? undefined : s.setItem(k, v)),
      removeItem: (k) => s.removeItem(k),
    });
    expect(writeSave('auto', v1)).toBe(false);
  });

  it('deletes a save with its side copies', () => {
    const s = new FlakyStorage();
    setStorageBackend(s);
    writeSave('slot2', v1);
    writeSave('slot2', v2);
    deleteSave('slot2');
    expect([...s.data.keys()].filter((k) => k.includes('slot2'))).toEqual([]);
  });
});

describe('flushStorage', () => {
  it('runs every platform flusher and tolerates failures', async () => {
    const ran: string[] = [];
    const off1 = onFlushStorage(() => void ran.push('a'));
    const off2 = onFlushStorage(async () => {
      ran.push('b');
      throw new Error('disk busy');
    });
    await flushStorage();
    expect(ran.sort()).toEqual(['a', 'b']);
    off1();
    off2();
    ran.length = 0;
    await flushStorage();
    expect(ran).toEqual([]);
  });
});
