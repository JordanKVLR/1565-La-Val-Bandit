/** Dev-only gallery: every cast member in every expression (open /portraits2d.html). */
import { CAST_IDS, EXPRESSIONS, drawPortrait } from './portraits';

const params = new URLSearchParams(location.search);
const size = Number(params.get('size')) || 120;
const only = params.get('id');
const exOnly = params.get('ex');
const root = document.getElementById('root')!;
root.style.setProperty('--cell', `${size}px`);
if (exOnly) root.style.cssText += 'display:flex;flex-wrap:wrap;gap:8px';

for (const id of CAST_IDS) {
  if (only && only !== id) continue;
  const row = document.createElement('section');
  row.className = 'row';
  const h = document.createElement('h2');
  h.textContent = id;
  row.append(h);
  const cells = document.createElement('div');
  cells.className = 'cells';
  for (const ex of EXPRESSIONS) {
    if (exOnly && exOnly !== ex) continue;
    const fig = document.createElement('figure');
    const cv = document.createElement('canvas');
    const px = size * 2;
    cv.width = cv.height = px;
    cv.style.width = cv.style.height = `${size}px`;
    drawPortrait(cv.getContext('2d')!, id, ex, 0, 0, px);
    const cap = document.createElement('figcaption');
    cap.textContent = ex;
    fig.append(cv, cap);
    cells.append(fig);
  }
  row.append(cells);
  root.append(row);
}
