import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { loadArtManifest } from './render/art';
import { App } from './ui/App';
import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/700.css';
import './ui/styles.css';
import './ui/maltese.generated.css';
import './ui/maltese.css';
import './ui/input.css';

registerSW({ immediate: true });

void loadArtManifest();

const root = document.getElementById('app');
if (root) render(<App />, root);
