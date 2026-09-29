declare module '*.ink' {
  /** Compiled ink story JSON (see tools/vite-plugin-ink.ts). */
  const story: Record<string, unknown>;
  export default story;
}
