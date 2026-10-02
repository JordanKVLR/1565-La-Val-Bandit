// Renders the trailer frame by frame in headless Chromium and pipes each worker's chunk into ffmpeg.
// usage (from apps/game so @playwright/test resolves):
//   node ../../docs/trailer/render.mjs [--out dir] [--workers 3] [--start 0] [--end 6813] [--fps 30]
import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import { pathToFileURL, fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []),
);
const here = path.dirname(fileURLToPath(import.meta.url));
const fps = parseInt(args.fps ?? '30', 10);
const duration = 227.08;
const total = Math.ceil(duration * fps);
const start = parseInt(args.start ?? '0', 10);
const end = Math.min(total, parseInt(args.end ?? String(total), 10));
const workers = parseInt(args.workers ?? '3', 10);
const out = path.resolve(args.out ?? path.join(here, 'build'));
fs.mkdirSync(out, { recursive: true });
const url = pathToFileURL(path.join(here, 'src', 'index.html')).href;

const per = Math.ceil((end - start) / workers);
const t0 = Date.now();
let done = 0;

async function worker(w) {
  const a = start + w * per;
  const b = Math.min(end, a + per);
  if (a >= b) return;
  const seg = path.join(out, `seg_${String(w).padStart(2, '0')}.mp4`);
  const ff = spawn(
    'ffmpeg',
    ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '12', '-pix_fmt', 'yuv420p', '-r', String(fps), seg],
    { stdio: ['pipe', 'inherit', 'inherit'] },
  );
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => console.error('PAGEERR', e.message));
  await page.goto(url);
  await page.evaluate(() => window.ready);
  for (let f = a; f < b; f++) {
    await page.evaluate((t) => window.renderFrame(t), f / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 94 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    done++;
    if (done % 100 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`${done}/${end - start} frames, ${(done / el).toFixed(1)} fps, eta ${(((end - start - done) / (done / el)) / 60).toFixed(1)} min`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  return seg;
}

const segs = (await Promise.all(Array.from({ length: workers }, (_, w) => worker(w)))).filter(Boolean);
fs.writeFileSync(path.join(out, 'segments.txt'), segs.map((s) => `file '${s}'`).join('\n') + '\n');
console.log('done', segs.length, 'segments in', ((Date.now() - t0) / 1000).toFixed(0), 's');
