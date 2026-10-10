import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { pickLocale, setLocale, t } from './i18n';
import { installDisplay } from './platform/display';
import { loadArtManifest } from './render/art';
import { App } from './ui/App';
import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/alegreya-sans/400.css';
import '@fontsource/alegreya-sans/500.css';
import '@fontsource/alegreya-sans/700.css';
// Design tokens first: every stylesheet after this may use them (docs/DESIGN.md).
import './ui/design/tokens.css';
import './ui/styles.css';
import './ui/maltese.generated.css';
import './ui/maltese.css';
import './ui/input.css';
import './ui/design/components.css';
import './ui/battle/hud.css';
import './ui/tv.css';

registerSW({ immediate: true });

// UI language before the first render (ADR 0012): the player's first shipped language.
setLocale(pickLocale(navigator.languages ?? [navigator.language]));
document.title = t('app.title');

void loadArtManifest();

// Handheld or TV layout, before the first paint (ADR 0010).
installDisplay();

const root = document.getElementById('app');
if (root) render(<App />, root);
