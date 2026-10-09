import { defineConfig, devices } from '@playwright/test';

// E2E_PORT lets parallel checkouts each test their own build instead of reusing one server.
const port = Number(process.env.E2E_PORT ?? 4173);

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: `http://localhost:${port}/`, trace: 'retain-on-failure' },
  webServer: {
    command: `pnpm build && pnpm preview --port ${port} --strictPort`,
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    // Small Android phone held in landscape: the primary target.
    {
      name: 'phone-landscape',
      use: {
        ...devices['Pixel 5 landscape'],
        launchOptions: { args: ['--use-gl=swiftshader', '--ignore-gpu-blocklist'] },
      },
    },
    // Steam Deck resolution.
    {
      name: 'deck',
      use: {
        viewport: { width: 1280, height: 800 },
        launchOptions: { args: ['--use-gl=swiftshader', '--ignore-gpu-blocklist'] },
      },
    },
  ],
});
