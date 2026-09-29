import { inkPlugin } from '@m1565/content/vite-plugin-ink';
import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// BASE_PATH lets the same build serve from a sub-path (GitHub Pages: /<repo>/) or from root.
const base = process.env.BASE_PATH ?? '/';
// Single-file preview build (no service worker) for sharing as a claude.ai page.
const singleFile = process.env.SINGLE_FILE === '1';

export default defineConfig({
  base,
  plugins: [
    inkPlugin(),
    preact(),
    VitePWA({
      disable: singleFile,
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Armatura 1565',
        short_name: 'Armatura',
        description: 'A tactical RPG set during the Great Siege of Malta.',
        theme_color: '#1b1410',
        background_color: '#1b1410',
        display: 'fullscreen',
        orientation: 'landscape',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 800,
    ...(singleFile && { outDir: 'dist-single', assetsInlineLimit: Number.MAX_SAFE_INTEGER }),
  },
});
