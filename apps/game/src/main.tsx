import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { loadArtManifest } from './render/art';
import { App } from './ui/App';
import '@fontsource/pirata-one/400.css';
import './ui/styles.css';

registerSW({ immediate: true });

void loadArtManifest();

const root = document.getElementById('app');
if (root) render(<App />, root);
