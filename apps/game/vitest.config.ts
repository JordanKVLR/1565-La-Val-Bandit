import { inkPlugin } from '@m1565/content/vite-plugin-ink';
import { defineProject } from 'vitest/config';

export default defineProject({
  plugins: [inkPlugin()],
  test: { name: 'game', environment: 'node', include: ['src/**/*.test.ts'], passWithNoTests: true },
});
