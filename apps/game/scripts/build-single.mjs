// Builds the game as one self-contained HTML fragment (inline CSS + JS, no service worker),
// for hosts that only accept a single page, e.g. a private claude.ai preview.
// Usage: pnpm --filter @m1565/game build:single  →  apps/game/dist-single/armatura-1565.html
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
execSync('vite build', {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, SINGLE_FILE: '1', BASE_PATH: './' },
});

const out = resolve(root, 'dist-single');
const html = readFileSync(resolve(out, 'index.html'), 'utf8');
const read = (re) => {
  const m = html.match(re);
  if (!m) throw new Error(`asset not found: ${re}`);
  return readFileSync(resolve(out, m[1]), 'utf8');
};
const js = read(/<script type="module" crossorigin src="\.\/([^"]+)"/).replaceAll(
  '</script',
  '<\\/script',
);
const css = read(/<link rel="stylesheet" crossorigin href="\.\/([^"]+)"/);
// No art folder next to a single page: embed the portraits as data: URLs instead.
const artDir = resolve(root, 'public/art');
const manifest = JSON.parse(readFileSync(resolve(artDir, 'manifest.json'), 'utf8'));
const mime = (p) =>
  p.endsWith('.webp') ? 'image/webp' : p.endsWith('.png') ? 'image/png' : 'image/jpeg';
const portraits = Object.fromEntries(
  Object.entries(manifest.portraits ?? {}).map(([id, p]) => [
    id,
    `data:${mime(p)};base64,${readFileSync(resolve(artDir, p)).toString('base64')}`,
  ]),
);
const art = JSON.stringify({ portraits }).replaceAll('</', '<\\/');
const page = `<title>Armatura 1565</title>
<meta name="theme-color" content="#1b1410">
<style>${css}</style>
<div id="app"></div>
<script>window.__M1565_ART__=${art}</script>
<script type="module">${js}</script>
`;
writeFileSync(resolve(out, 'armatura-1565.html'), page);
console.log(`single-file build: ${(page.length / 1024).toFixed(0)} KB`);
