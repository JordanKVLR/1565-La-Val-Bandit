import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*', 'apps/game'],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**'],
      thresholds: { 'packages/core/src/**': { lines: 90, functions: 90, branches: 85 } },
    },
  },
});
