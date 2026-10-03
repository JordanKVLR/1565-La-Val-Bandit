import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

/**
 * The opening cinematic is a canvas page whose source lives in docs/trailer (the same code renders
 * the video master). This copies it into public/intro/ (generated, git-ignored) so the game can
 * play it in-engine in a same-origin iframe. See docs/adr/0006-opening-cinematic.md.
 */
const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../../docs/trailer');
const out = resolve(here, 'public/intro');

const SCRIPTS = [
  'malta_geo.js',
  'engine.js',
  'intro/shared.js',
  'intro/art.js',
  'intro/shots1.js',
  'intro/shots2.js',
  'main.js',
];

export function syncIntro(): void {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(resolve(out, 'intro'), { recursive: true });
  for (const f of SCRIPTS) cpSync(resolve(src, 'src', f), resolve(out, f));
  cpSync(resolve(src, 'fonts'), resolve(out, 'fonts'), { recursive: true });
  const html = readFileSync(resolve(src, 'src/intro.html'), 'utf8')
    .replaceAll('url(../fonts/', 'url(fonts/')
    .replace(
      /canvas \{[^}]*\}/,
      'canvas { display: block; width: 100vw; height: 100vh; object-fit: contain; }',
    )
    // The game passes the render scale in the query string and serves portraits from art/.
    .replace(
      '<script src="malta_geo.js"></script>',
      `<script>
      window.PORTRAIT_BASE = '../art/portraits/';
      window.INTRO_SCALE = Number(new URLSearchParams(location.search).get('scale')) || 1;
    </script>
    <script src="malta_geo.js"></script>`,
    );
  writeFileSync(resolve(out, 'index.html'), html);
}

export function introPlugin(): Plugin {
  return {
    name: 'm1565-intro',
    buildStart() {
      syncIntro();
    },
  };
}
