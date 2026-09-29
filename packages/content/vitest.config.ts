import { defineProject } from 'vitest/config';
import { inkPlugin } from './tools/vite-plugin-ink';

export default defineProject({
  plugins: [inkPlugin()],
  test: { name: 'content', environment: 'node' },
});
