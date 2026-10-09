import { describe, expect, it } from 'vitest';
import type { DesktopLifecycle } from './desktop';
import type { LifecycleEnv } from './lifecycle';
import { installLifecycle } from './lifecycle';
import { flushStorage } from './storage';

class FakeDoc extends EventTarget {
  hidden = false;
  setHidden(hidden: boolean): void {
    this.hidden = hidden;
    this.dispatchEvent(new Event('visibilitychange'));
  }
}

function setup(extra: Partial<LifecycleEnv> = {}) {
  const win = new EventTarget();
  const doc = new FakeDoc();
  const calls: string[] = [];
  const stop = installLifecycle(
    { onSuspend: () => calls.push('suspend'), onResume: () => calls.push('resume') },
    { win, doc, ...extra },
  );
  return { win, doc, calls, stop };
}

describe('installLifecycle', () => {
  it('saves when the page hides and resumes once when it is shown again', () => {
    const { doc, win, calls } = setup();
    doc.setHidden(true);
    // pagehide and freeze may follow; each saves again in case it is the last chance.
    win.dispatchEvent(new Event('pagehide'));
    doc.dispatchEvent(new Event('freeze'));
    expect(calls).toEqual(['suspend', 'suspend', 'suspend']);
    // A resume signal while still hidden does nothing.
    doc.dispatchEvent(new Event('resume'));
    expect(calls).toHaveLength(3);
    doc.setHidden(false);
    win.dispatchEvent(new Event('pageshow'));
    expect(calls).toEqual(['suspend', 'suspend', 'suspend', 'resume']);
  });

  it('does not resume without a suspension first', () => {
    const { doc, calls } = setup();
    doc.setHidden(false);
    expect(calls).toEqual([]);
  });

  it('follows Cordova/Capacitor pause and resume events', () => {
    const { doc, calls } = setup();
    doc.dispatchEvent(new Event('pause'));
    doc.dispatchEvent(new Event('resume'));
    expect(calls).toEqual(['suspend', 'resume']);
  });

  it("follows Capacitor's App plugin when present", async () => {
    let cb: ((s: { isActive: boolean }) => void) | undefined;
    let removed = false;
    const { calls, stop } = setup({
      capacitorApp: {
        addListener: (_e, fn) => {
          cb = fn;
          return Promise.resolve({ remove: () => (removed = true) });
        },
      },
    });
    cb!({ isActive: false });
    cb!({ isActive: true });
    expect(calls).toEqual(['suspend', 'resume']);
    stop();
    await Promise.resolve();
    await Promise.resolve();
    expect(removed).toBe(true);
  });

  it("follows the Electron shell's sleep/wake and registers its storage flush", async () => {
    let listener: ((s: DesktopLifecycle) => void) | undefined;
    let flushed = 0;
    const { calls, stop } = setup({
      desktop: {
        platform: 'steam',
        unlockAchievement: () => Promise.resolve(true),
        flushStorage: () => {
          flushed++;
          return Promise.resolve();
        },
        onLifecycle: (fn) => {
          listener = fn;
          return () => (listener = undefined);
        },
      },
    });
    listener!('suspend');
    listener!('resume');
    expect(calls).toEqual(['suspend', 'resume']);
    await flushStorage();
    expect(flushed).toBe(1);
    stop();
    expect(listener).toBeUndefined();
    await flushStorage();
    expect(flushed).toBe(1);
  });

  it('stops listening when uninstalled', () => {
    const { doc, calls, stop } = setup();
    stop();
    doc.setHidden(true);
    expect(calls).toEqual([]);
  });

  it('is a no-op outside a browser', () => {
    expect(() => installLifecycle({ onSuspend() {}, onResume() {} }, null)()).not.toThrow();
  });
});
