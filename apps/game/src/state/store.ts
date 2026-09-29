import { useEffect, useState } from 'preact/hooks';

/** Minimal observable value. Keeps game-side state out of Preact while letting UI re-render. */
export class Store<T> {
  private readonly listeners = new Set<() => void>();

  constructor(private value: T) {}

  get(): T {
    return this.value;
  }

  set(value: T): void {
    this.value = value;
    for (const l of this.listeners) l();
  }

  update(fn: (v: T) => T): void {
    this.set(fn(this.value));
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export function useStore<T>(store: Store<T>): T {
  const [, setTick] = useState(0);
  useEffect(() => store.subscribe(() => setTick((n) => n + 1)), [store]);
  return store.get();
}
