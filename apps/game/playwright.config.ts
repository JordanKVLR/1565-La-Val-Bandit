import { defineConfig, devices } from '@playwright/test';

// E2E_PORT lets parallel checkouts each test their own build instead of reusing one server.
const port = Number(process.env.E2E_PORT ?? 4173);
const gl = { args: ['--use-gl=swiftshader', '--ignore-gpu-blocklist'] };
/** TV layout checks (ADR 0010) run only on the TV projects, and only they run them. */
const tvSpec = /tv\.spec\.ts$/;

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
      testIgnore: tvSpec,
      use: {
        ...devices['Pixel 5 landscape'],
        launchOptions: { args: ['--use-gl=swiftshader', '--ignore-gpu-blocklist'] },
      },
    },
    // Steam Deck resolution.
    {
      name: 'deck',
      testIgnore: tvSpec,
      use: {
        viewport: { width: 1280, height: 800 },
        launchOptions: { args: ['--use-gl=swiftshader', '--ignore-gpu-blocklist'] },
      },
    },
    // A TV from the sofa: 1080p and 4K at device scale 1, in the TV layout.
    {
      name: 'tv-1080',
      testMatch: tvSpec,
      use: { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, launchOptions: gl },
    },
    {
      name: 'tv-4k',
      testMatch: tvSpec,
      use: { viewport: { width: 3840, height: 2160 }, deviceScaleFactor: 1, launchOptions: gl },
    },
  ],
});
