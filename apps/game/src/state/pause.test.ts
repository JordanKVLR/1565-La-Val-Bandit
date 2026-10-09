import { describe, expect, it } from 'vitest';
import { PauseGate } from './pause';

describe('PauseGate', () => {
  it('runs straight through when nothing holds it', async () => {
    const gate = new PauseGate();
    await expect(gate.whenRunning()).resolves.toBeUndefined();
    expect(gate.paused.get()).toBe(false);
  });

  it('waits until every reason is released', async () => {
    const gate = new PauseGate();
    gate.hold('suspended');
    gate.hold('controller');
    expect(gate.paused.get()).toBe(true);
    let resumed = false;
    const waiting = gate.whenRunning().then(() => (resumed = true));
    gate.release('suspended');
    await Promise.resolve();
    expect(resumed).toBe(false);
    expect(gate.isHeld('controller')).toBe(true);
    gate.release('controller');
    await waiting;
    expect(resumed).toBe(true);
    expect(gate.paused.get()).toBe(false);
  });

  it('ignores releasing a reason that was not held', () => {
    const gate = new PauseGate();
    gate.hold('controller');
    gate.release('suspended');
    expect(gate.isHeld()).toBe(true);
  });
});
