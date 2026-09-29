// Renders apps/game/public/icons/icon.svg to the PNG sizes the PWA manifest and stores need.
// Usage: pnpm --filter @m1565/game icons
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const iconsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public/icons');
const svg = await readFile(resolve(iconsDir, 'icon.svg'), 'utf8');
const browser = await chromium.launch();
for (const size of [192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`,
  );
  await page.screenshot({ path: resolve(iconsDir, `icon-${size}.png`), omitBackground: true });
  await page.close();
}
await browser.close();
console.log('icons written to', iconsDir);
