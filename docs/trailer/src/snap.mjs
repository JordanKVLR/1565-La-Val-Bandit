// usage: node snap.mjs out_dir t1 t2 ...   (renders single frames to PNG for review)
import { chromium } from '@playwright/test';
import { pathToFileURL } from 'url';
import path from 'path';
const [out, ...ts] = process.argv.slice(2);
const url = pathToFileURL(process.env.TRAILER_INDEX || path.resolve(path.dirname(new URL(import.meta.url).pathname), 'index.html')).href;
const b = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('console', (m) => m.type() === 'error' && console.log('ERR', m.text()));
p.on('pageerror', (e) => console.log('PAGEERR', e.message));
await p.goto(url);
await p.evaluate(() => window.ready);
for (const t of ts) {
  await p.evaluate((t) => window.renderFrame(t), parseFloat(t));
  await p.screenshot({ path: `${out}/f_${Math.round(parseFloat(t) * 100).toString().padStart(5, "0")}.png` });
}
await b.close();
