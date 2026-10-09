import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { installDisplay } from './platform/display';
import { loadArtManifest } from './render/art';
import { App } from './ui/App';
import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/700.css';
import './ui/styles.css';
import './ui/maltese.generated.css';
import './ui/maltese.css';
import './ui/input.css';
import './ui/tv.css';

registerSW({ immediate: true });

void loadArtManifest();

// Handheld or TV layout, before the first paint (ADR 0010).
installDisplay();

const root = document.getElementById('app');
if (root) render(<App />, root);
