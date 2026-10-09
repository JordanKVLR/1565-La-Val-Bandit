import { Store } from './store';

/** Why gameplay is held: the app is suspended/hidden, or the active controller went away. */
export type PauseReason = 'suspended' | 'controller';

/**
 * Holds gameplay while any reason is active. The battle's AI waits on `whenRunning()` between
 * its steps, so nothing advances while the app is in the background or the controller
 * disconnect notice is up; an animation already playing just finishes.
 */
export class PauseGate {
  private readonly reasons = new Set<PauseReason>();
  private waiters: (() => void)[] = [];
  /** True while paused, for the UI. */
  readonly paused = new Store(false);

  hold(reason: PauseReason): void {
    this.reasons.add(reason);
    if (!this.paused.get()) this.paused.set(true);
  }

  release(reason: PauseReason): void {
    if (!this.reasons.delete(reason) || this.reasons.size > 0) return;
    this.paused.set(false);
    const waiting = this.waiters;
    this.waiters = [];
    for (const w of waiting) w();
  }

  isHeld(reason?: PauseReason): boolean {
    return reason ? this.reasons.has(reason) : this.reasons.size > 0;
  }

  /** Resolves at once when running, else when the last reason is released. */
  whenRunning(): Promise<void> {
    if (this.reasons.size === 0) return Promise.resolve();
    return new Promise((resolve) => this.waiters.push(resolve));
  }
}

/** The game's one pause gate. */
export const gameplayPause = new PauseGate();
