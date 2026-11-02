// Cavaliere: the Order's knightly armatura, hand-drawn as layered SVG.
const INK = '#0e1118';
const W = 1000, H = 1300, GROUND = 1190;
const f = (n) => Math.round(n * 10) / 10;
let defs = '';
const grad = (id, stops, x1 = 0, y1 = 0, x2 = 1, y2 = 0) => {
  defs += `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops
    .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
    .join('')}</linearGradient>`;
};
grad('steel', [[0, '#2c313e'], [0.14, '#5d6678'], [0.34, '#e7edf6'], [0.52, '#a7b0c1'], [0.78, '#5a6173'], [1, '#262b37']]);
grad('steelV', [[0, '#e9eef7'], [0.35, '#a9b2c3'], [0.75, '#596073'], [1, '#2a2f3b']], 0, 0, 0, 1);
grad('steelDark', [[0, '#1d212b'], [0.3, '#4a5265'], [0.5, '#7b8499'], [0.75, '#3b4252'], [1, '#161a22']]);
grad('brass', [[0, '#4d300c'], [0.22, '#c8913a'], [0.4, '#fff1b8'], [0.62, '#d9a443'], [1, '#43290a']]);
grad('brassV', [[0, '#fff1b8'], [0.4, '#d9a443'], [1, '#43290a']], 0, 0, 0, 1);
grad('cloth', [[0, '#5a0b13'], [0.3, '#b3202b'], [0.5, '#e43f47'], [0.75, '#a01a25'], [1, '#52090f']]);
grad('clothV', [[0, '#d0343d'], [1, '#4d0910']], 0, 0, 0, 1);
grad('white', [[0, '#bdb8ac'], [0.45, '#fffdf4'], [1, '#c9c4b6']]);
grad('leather', [[0, '#2a1608'], [0.4, '#7a4a22'], [1, '#2a1608']]);
grad('sky', [[0, '#141a38'], [0.45, '#3a2748'], [0.72, '#a2423a'], [1, '#f0a050']], 0, 0, 0, 1);
grad('ground', [[0, '#2a2420'], [1, '#0d0b0a']], 0, 0, 0, 1);
defs += `<radialGradient id="ember" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff3b0"/><stop offset="0.35" stop-color="#ffb347"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>
<radialGradient id="glowRed" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffd27a" stop-opacity="0.9"/><stop offset="1" stop-color="#ff7a2a" stop-opacity="0"/></radialGradient>
<radialGradient id="rivet" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff"/><stop offset="0.5" stop-color="#9aa3b4"/><stop offset="1" stop-color="#2b303c"/></radialGradient>
<radialGradient id="vig" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.65"/></radialGradient>
<filter id="rim" x="-5%" y="-5%" width="110%" height="110%"><feOffset in="SourceAlpha" dx="-4" dy="2" result="off"/><feComposite in="SourceAlpha" in2="off" operator="out" result="edge"/><feFlood flood-color="#ffb866" flood-opacity="0.7"/><feComposite in2="edge" operator="in" result="rimc"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="rimc"/></feMerge></filter><filter id="blur8"><feGaussianBlur stdDeviation="8"/></filter><filter id="blur3"><feGaussianBlur stdDeviation="3"/></filter><filter id="blur18"><feGaussianBlur stdDeviation="18"/></filter>`;

const ang = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI - 90;
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const rivet = (x, y, r = 4.5) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="url(#rivet)" stroke="${INK}" stroke-width="1.5"/>`;

/** A tapered armour tube from a to b, drawn in local space so shading runs across it. */
function limb(a, b, w1, w2, fill = 'steel', o = {}) {
  const L = dist(a, b);
  const bulge = o.bulge ?? 0;
  const lames = o.lames ?? 0;
  let s = `<g transform="translate(${f(a[0])} ${f(a[1])}) rotate(${f(ang(a, b))})">`;
  const path = `M ${-w1 / 2} 0 C ${-w1 / 2 - bulge} ${L * 0.3}, ${-w2 / 2 - bulge} ${L * 0.7}, ${-w2 / 2} ${L} L ${w2 / 2} ${L} C ${w2 / 2 + bulge} ${L * 0.7}, ${w1 / 2 + bulge} ${L * 0.3}, ${w1 / 2} 0 Z`;
  s += `<path d="${path}" fill="url(#${fill})" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
  for (let i = 1; i <= lames; i++) {
    const t = i / (lames + 1);
    const w = w1 + (w2 - w1) * t + bulge * 1.2;
    s += `<path d="M ${-w / 2} ${L * t} Q 0 ${L * t + 9} ${w / 2} ${L * t}" fill="none" stroke="${INK}" stroke-width="3.2" opacity="0.85"/>`;
    s += `<path d="M ${-w / 2 + 3} ${L * t + 3} Q 0 ${L * t + 11} ${w / 2 - 3} ${L * t + 3}" fill="none" stroke="#fff" stroke-width="1.6" opacity="0.35"/>`;
  }
  s += `<path d="M ${-w1 / 2 + 5} 6 L ${-w2 / 2 + 5} ${L - 6}" stroke="#fff" stroke-width="2.4" opacity="0.5" stroke-linecap="round"/>`;
  if (o.ridge) s += `<path d="M 0 6 L 0 ${L - 6}" stroke="${INK}" stroke-width="2" opacity="0.45"/>`;
  s += '</g>';
  return s;
}
function joint(p, r, fill = 'steelDark', spike = false) {
  let s = `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="url(#${fill})" stroke="${INK}" stroke-width="5"/>`;
  s += `<circle cx="${p[0]}" cy="${p[1]}" r="${r * 0.55}" fill="url(#brass)" stroke="${INK}" stroke-width="3"/>`;
  s += rivet(p[0] - r * 0.12, p[1] - r * 0.12, r * 0.16);
  return s;
}

// ---- skeleton -------------------------------------------------
const P = {
  head: [524, 262], neck: [508, 338],
  shN: [468, 408], shF: [548, 416],
  elN: [404, 548], wrN: [548, 618],
  elF: [632, 520], wrF: [704, 566],
  hip: [500, 752],
  kBack: [418, 884], aBack: [372, 1122], tBack: [452, 1180],
  kFront: [612, 884], aFront: [592, 1126], tFront: [716, 1182],
};

let body = '';

// ---- backdrop -------------------------------------------------
let bg = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
bg += `<circle cx="800" cy="210" r="120" fill="#ffd9a0" opacity="0.35" filter="url(#blur18)"/><circle cx="800" cy="210" r="46" fill="#ffe9c4" opacity="0.9"/>`;
// far limestone bastion + sea haze
bg += `<path d="M0 860 L0 700 L70 700 L70 668 L130 668 L130 700 L210 700 L210 640 L270 640 L270 700 L420 740 L520 740 L700 700 L760 700 L760 650 L830 650 L830 700 L1000 720 L1000 880 Z" fill="#2b2433" opacity="0.8"/>`;
bg += `<path d="M0 900 L0 760 L110 760 L110 730 L170 730 L170 760 L330 790 L560 780 L650 740 L720 740 L720 710 L790 710 L790 740 L1000 770 L1000 920 Z" fill="#1d1824"/>`;
for (let i = 0; i < 38; i++) {
  const x = (i * 197) % 1000, y = 250 + ((i * 331) % 520);
  bg += `<circle cx="${x}" cy="${y}" r="${1 + (i % 3) * 0.7}" fill="#ffe3b0" opacity="${0.25 + (i % 5) * 0.08}"/>`;
}
bg += `<rect y="${GROUND - 30}" width="${W}" height="${H - GROUND + 30}" fill="url(#ground)"/>`;
bg += `<path d="M0 ${GROUND - 20} Q 500 ${GROUND - 44} 1000 ${GROUND - 20} L1000 ${GROUND - 5} L0 ${GROUND - 5} Z" fill="#43372d" opacity="0.8"/>`;
for (let i = 0; i < 18; i++) {
  const x = 40 + ((i * 163) % 920), y = GROUND + 10 + ((i * 53) % 70);
  bg += `<ellipse cx="${x}" cy="${y}" rx="${14 + (i % 4) * 8}" ry="${4 + (i % 3) * 2}" fill="#5b4c3e" opacity="0.55"/>`;
}
bg += `<ellipse cx="540" cy="${GROUND + 6}" rx="300" ry="34" fill="#000" opacity="0.6" filter="url(#blur8)"/>`;
// steam drifting behind
const puff = (x, y, r, o = 0.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f5f0e8" opacity="${o}" filter="url(#blur8)"/>`;
bg += puff(330, 300, 40, 0.3) + puff(290, 230, 56, 0.24) + puff(236, 150, 74, 0.18) + puff(170, 70, 92, 0.12);

// ---- far arm + shield (behind torso) ---------------------------
body += limb(P.shF, P.elF, 42, 36, 'steelDark', { lames: 1 });
body += joint(P.elF, 26, 'steelDark');
body += limb(P.elF, P.wrF, 36, 30, 'steelDark', { lames: 1 });
// round shield with the eight-pointed cross
const sh = [772, 596], sr = 150;
body += `<g transform="translate(${sh[0]} ${sh[1]}) rotate(-14)">`;
body += `<circle r="${sr + 10}" fill="url(#brass)" stroke="${INK}" stroke-width="6"/>`;
body += `<circle r="${sr}" fill="url(#cloth)" stroke="${INK}" stroke-width="5"/>`;
body += `<circle r="${sr - 20}" fill="none" stroke="url(#brass)" stroke-width="6" opacity="0.9"/>`;
const maltese = (k = 1, fill = 'white') => [0, 90, 180, 270].map((a) => `<path d="M -11 -16 L -38 -92 L 0 -72 L 38 -92 L 11 -16 Z" transform="rotate(${a}) scale(${k})" fill="url(#${fill})" stroke="${INK}" stroke-width="${4 / k}" stroke-linejoin="round"/>`).join('');
const arm = (a, len, wd) => `<path d="M ${-wd / 2} 0 L ${-wd / 2} ${-len} L 0 ${-len - wd * 0.9} L ${wd / 2} ${-len} L ${wd / 2} 0 Z" transform="rotate(${a})" fill="url(#white)" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
// eight-pointed cross (original vector drawing): four long arms plus four short diagonals
body += maltese(1.28);
body += `<circle r="30" fill="url(#brass)" stroke="${INK}" stroke-width="5"/><circle r="12" fill="url(#steelV)" stroke="${INK}" stroke-width="3"/>`;
for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; body += rivet(Math.cos(a) * (sr - 8), Math.sin(a) * (sr - 8), 4.2); }
body += `<path d="M ${-sr + 30} -40 A ${sr} ${sr} 0 0 1 -40 ${-sr + 30}" fill="none" stroke="#fff" stroke-width="7" opacity="0.38" stroke-linecap="round"/>`;
body += `</g>`;

// ---- boiler pack (behind torso) ------------------------------
let pack = '';
pack += `<g transform="translate(404 392) rotate(8)">`;
pack += `<rect x="-62" y="-6" width="124" height="268" rx="46" fill="url(#brass)" stroke="${INK}" stroke-width="6"/>`;
for (const y of [34, 96, 158, 220]) pack += `<rect x="-66" y="${y}" width="132" height="14" rx="6" fill="url(#steelDark)" stroke="${INK}" stroke-width="4"/>`;
for (const y of [41, 103, 165, 227]) { pack += rivet(-52, y, 3.6) + rivet(52, y, 3.6) + rivet(0, y, 3.6); }
pack += `<rect x="-26" y="-34" width="52" height="40" rx="12" fill="url(#steel)" stroke="${INK}" stroke-width="5"/>`;
pack += `<rect x="-14" y="-56" width="28" height="28" rx="8" fill="url(#brass)" stroke="${INK}" stroke-width="5"/>`;
pack += `<circle cx="0" cy="124" r="30" fill="#1b1d25" stroke="${INK}" stroke-width="5"/><circle cx="0" cy="124" r="24" fill="url(#ember)"/><circle cx="0" cy="124" r="30" fill="none" stroke="url(#brass)" stroke-width="5"/>`;
pack += `<g transform="translate(-34 52)"><circle r="19" fill="#f4efe0" stroke="${INK}" stroke-width="4"/><circle r="19" fill="none" stroke="url(#brass)" stroke-width="5"/><path d="M 0 0 L 10 -11" stroke="#b01c24" stroke-width="3.5" stroke-linecap="round"/><circle r="3" fill="${INK}"/></g>`;
pack += `</g>`;
// pipes
pack += `<path d="M 420 372 C 440 342, 452 350, 470 386" fill="none" stroke="${INK}" stroke-width="22" stroke-linecap="round"/><path d="M 420 372 C 440 342, 452 350, 470 386" fill="none" stroke="url(#brassV)" stroke-width="14" stroke-linecap="round"/>`;
pack += `<path d="M 392 560 C 372 620, 400 668, 458 690" fill="none" stroke="${INK}" stroke-width="20" stroke-linecap="round"/><path d="M 392 560 C 372 620, 400 668, 458 690" fill="none" stroke="url(#steelV)" stroke-width="12" stroke-linecap="round"/>`;
body += pack;

// ---- back leg (far) ------------------------------------------
body += limb(P.hip, P.kBack, 98, 78, 'steelDark', { lames: 2, bulge: 9 });
body += joint(P.kBack, 39, 'steelDark');
body += limb(P.kBack, P.aBack, 78, 54, 'steelDark', { lames: 2, bulge: 7 });
body += `<path d="M ${P.aBack[0] - 24} ${P.aBack[1] - 6} L ${P.tBack[0] + 34} ${P.tBack[1] - 38} L ${P.tBack[0] + 78} ${P.tBack[1] - 6} L ${P.tBack[0] + 66} ${P.tBack[1] + 2} L ${P.aBack[0] - 30} ${P.tBack[1] + 2} Z" fill="url(#steelDark)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;

// ---- torso ------------------------------------------------------
// tabard (hangs behind the tassets, in front of the far leg)
body += `<path d="M 442 650 C 436 760, 430 860, 438 966 L 560 990 C 566 880, 566 780, 556 650 Z" fill="url(#cloth)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
body += `<path d="M 488 668 C 480 770, 480 880, 486 980 M 524 664 C 522 780, 526 890, 534 988" fill="none" stroke="#2a050a" stroke-width="3" opacity="0.5"/>`;
body += `<g transform="translate(498 906) scale(0.5)">${maltese(1, 'white')}</g>`;
body += `<path d="M 438 966 L 560 990 L 556 1004 L 436 980 Z" fill="url(#brass)" stroke="${INK}" stroke-width="4"/>`;
// cuirass
const cuirass = 'M 428 392 C 392 452, 412 584, 446 664 L 552 668 C 600 580, 610 460, 568 396 C 530 372, 470 372, 428 392 Z';
body += `<path d="${cuirass}" fill="url(#steel)" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`;
body += `<path d="M 506 384 C 520 470, 520 580, 514 664" fill="none" stroke="${INK}" stroke-width="3" opacity="0.5"/>`;
body += `<path d="M 436 420 C 424 482, 436 588, 456 650" fill="none" stroke="#fff" stroke-width="4" opacity="0.55" stroke-linecap="round"/>`;
// breast ridge + brass bands + gorget
body += `<path d="M 430 462 C 500 504, 562 486, 598 446" fill="none" stroke="${INK}" stroke-width="5"/><path d="M 432 470 C 500 512, 560 494, 594 456" fill="none" stroke="url(#brassV)" stroke-width="7"/>`;
body += `<path d="M 446 600 C 500 624, 548 616, 580 596" fill="none" stroke="${INK}" stroke-width="5"/><path d="M 448 608 C 500 632, 548 624, 578 604" fill="none" stroke="url(#brassV)" stroke-width="7"/>`;
for (const [x, y] of [[452, 474], [492, 492], [532, 492], [570, 466], [462, 616], [504, 630], [544, 624]]) body += rivet(x, y, 4.4);
// order emblem on the breast (small cross)
body += `<g transform="translate(520 508) scale(0.36)">${maltese(1, 'white')}</g>`;
// glowing furnace vent in the chest
body += `<rect x="470" y="548" width="78" height="40" rx="8" fill="#1a0e08" stroke="${INK}" stroke-width="4"/><rect x="474" y="552" width="70" height="32" rx="6" fill="url(#ember)" opacity="0.95"/>`;
for (const y of [556, 565, 574]) body += `<rect x="470" y="${y}" width="78" height="5" fill="url(#steelV)" stroke="${INK}" stroke-width="2.5"/>`;
// gorget collar
body += `<path d="M 462 372 C 470 340, 546 338, 556 372 L 566 404 C 520 424, 466 420, 452 404 Z" fill="url(#steelV)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
body += `<path d="M 458 392 C 500 410, 530 410, 564 392" fill="none" stroke="${INK}" stroke-width="3"/><path d="M 456 380 C 500 396, 530 396, 562 380" fill="none" stroke="${INK}" stroke-width="3"/>`;
// belt + buckle + tassets
body += `<path d="M 440 650 C 500 672, 548 670, 560 650 L 562 690 C 520 710, 470 708, 442 692 Z" fill="url(#leather)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
body += `<rect x="494" y="654" width="30" height="40" rx="6" fill="url(#brass)" stroke="${INK}" stroke-width="4"/>`;
for (let i = 0; i < 4; i++) {
  const y = 686 + i * 4, x = 438 + i * 2;
  body += `<path d="M ${x} ${y} C ${x - 6} ${y + 60}, ${x - 2} ${y + 84}, ${x + 18} ${y + 94} L ${x + 108} ${y + 100} C ${x + 128} ${y + 84}, ${x + 130} ${y + 50}, ${x + 120} ${y} Z" fill="url(#steel)" stroke="${INK}" stroke-width="5" stroke-linejoin="round" opacity="${i === 0 ? 1 : 0}"/>`;
}
// three overlapping tasset plates
for (const [dx, dy, w, h] of [[-4, 692, 124, 70], [6, 728, 118, 66], [16, 762, 108, 60]]) {
  body += `<path d="M ${442 + dx} ${dy} L ${442 + dx + w} ${dy} C ${442 + dx + w + 4} ${dy + h * 0.6}, ${442 + dx + w - 14} ${dy + h}, ${442 + dx + w * 0.5} ${dy + h + 6} C ${442 + dx + 14} ${dy + h}, ${442 + dx - 4} ${dy + h * 0.6}, ${442 + dx} ${dy} Z" fill="url(#steel)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
  body += rivet(442 + dx + 16, dy + 14, 3.8) + rivet(442 + dx + w - 16, dy + 14, 3.8);
}

// ---- front leg (near) ---------------------------------------
body += limb(P.hip, P.kFront, 110, 86, 'steel', { lames: 2, bulge: 10, ridge: true });
body += `<g><path d="M 566 790 L 650 872" stroke="${INK}" stroke-width="26" stroke-linecap="round"/><path d="M 566 790 L 650 872" stroke="url(#brassV)" stroke-width="18" stroke-linecap="round"/><path d="M 606 826 L 650 872" stroke="${INK}" stroke-width="14" stroke-linecap="round"/><path d="M 606 826 L 650 872" stroke="url(#steelV)" stroke-width="8" stroke-linecap="round"/></g>`;
body += rivet(566, 790, 5) + rivet(650, 872, 5);
body += joint(P.kFront, 45, 'steel');
// poleyn spike
body += `<path d="M ${P.kFront[0] + 22} ${P.kFront[1] - 16} L ${P.kFront[0] + 66} ${P.kFront[1] - 6} L ${P.kFront[0] + 24} ${P.kFront[1] + 14} Z" fill="url(#steelV)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
body += limb(P.kFront, P.aFront, 86, 58, 'steel', { lames: 2, bulge: 8, ridge: true });
body += `<path d="M ${P.aFront[0] - 28} ${P.aFront[1] - 10} L ${P.aFront[0] + 30} ${P.aFront[1] - 10} L ${P.tFront[0] + 40} ${P.tFront[1] - 40} L ${P.tFront[0] + 96} ${P.tFront[1] - 8} L ${P.tFront[0] + 84} ${P.tFront[1] + 2} L ${P.aFront[0] - 30} ${P.tFront[1] + 2} Z" fill="url(#steel)" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`;
body += `<path d="M ${P.aFront[0] + 6} ${P.aFront[1] + 30} Q ${P.tFront[0] - 6} ${P.tFront[1] - 44} ${P.tFront[0] + 58} ${P.tFront[1] - 22}" fill="none" stroke="${INK}" stroke-width="3" opacity="0.6"/>`;
body += `<rect x="${P.aFront[0] - 30}" y="${P.aFront[1] - 6}" width="68" height="16" rx="6" fill="url(#brass)" stroke="${INK}" stroke-width="4"/>`;

// ---- near arm + sword -------------------------------------------
// pauldron (layered lames)
const pcx = 462, pcy = 414;
for (const [r, off] of [[70, 36], [64, 18], [58, 0]]) {
  body += `<path d="M ${pcx - r} ${pcy + off} A ${r} ${r * 0.86} 0 0 1 ${pcx + r * 0.9} ${pcy + off - 8} L ${pcx + r * 0.8} ${pcy + off + 22} Q ${pcx} ${pcy + off + 34} ${pcx - r} ${pcy + off + 12} Z" fill="url(#steel)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
}
body += `<path d="M ${pcx - 54} ${pcy - 8} A 58 50 0 0 1 ${pcx + 44} ${pcy - 26}" fill="none" stroke="#fff" stroke-width="5" opacity="0.6" stroke-linecap="round"/>`;
body += `<path d="M ${pcx - 4} ${pcy - 52} L ${pcx + 6} ${pcy - 86} L ${pcx + 22} ${pcy - 48} Z" fill="url(#brassV)" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
body += rivet(pcx - 28, pcy + 8, 4.6) + rivet(pcx + 14, pcy - 2, 4.6) + rivet(pcx + 46, pcy + 6, 4.6);
body += limb([P.shN[0] - 4, P.shN[1] + 40], P.elN, 56, 46, 'steel', { lames: 2, bulge: 4 });
body += joint(P.elN, 30, 'steel');
body += `<path d="M ${P.elN[0] - 30} ${P.elN[1] - 6} L ${P.elN[0] - 62} ${P.elN[1] + 22} L ${P.elN[0] - 28} ${P.elN[1] + 28} Z" fill="url(#steelV)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
body += limb(P.elN, P.wrN, 46, 36, 'steel', { lames: 2, bulge: 5 });
const g0 = P.wrN;
// sword (blade raised forward) then the fist over the grip
{
  const gx = g0[0] + 10, gy = g0[1] + 6, A = -130;
  body += `<g transform="translate(${gx} ${gy}) rotate(${A})">`;
  body += `<rect x="-9" y="-70" width="18" height="96" rx="7" fill="url(#leather)" stroke="${INK}" stroke-width="5"/>`;
  for (let i = 0; i < 5; i++) body += `<path d="M -9 ${-62 + i * 18} L 9 ${-52 + i * 18}" stroke="#d9a443" stroke-width="2.5"/>`;
  body += `<circle cx="0" cy="-82" r="17" fill="url(#brass)" stroke="${INK}" stroke-width="5"/><circle cx="0" cy="-82" r="7" fill="url(#steelV)" stroke="${INK}" stroke-width="3"/>`;
  body += `<path d="M -80 30 C -52 18, -22 34, 0 30 C 22 34, 52 18, 80 30 L 80 48 C 52 38, 22 54, 0 50 C -22 54, -52 38, -80 48 Z" fill="url(#brassV)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
  body += `<circle cx="-80" cy="39" r="10" fill="url(#brass)" stroke="${INK}" stroke-width="4"/><circle cx="80" cy="39" r="10" fill="url(#brass)" stroke="${INK}" stroke-width="4"/>`;
  body += `<path d="M -22 48 L -22 470 L 0 520 L 22 470 L 22 48 Z" fill="url(#steel)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
  body += `<path d="M 0 54 L 0 500" stroke="${INK}" stroke-width="5" opacity="0.45"/><path d="M -13 58 L -13 470" stroke="#fff" stroke-width="3.5" opacity="0.75"/><path d="M 17 62 L 17 462" stroke="#fff" stroke-width="2" opacity="0.28"/>`;
  body += `<path d="M -22 48 L -22 470 L 0 520" fill="none" stroke="#ffd9a0" stroke-width="2.5" opacity="0.4"/>`;
  // the fist, in the grip's own frame
  body += `<g transform="translate(0 -26)"><path d="M -25 -26 C -30 -6, -26 20, -10 30 L 14 30 C 28 20, 30 -6, 25 -26 Z" fill="url(#steel)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
  for (const y of [-14, -2, 10, 22]) body += `<path d="M -26 ${y} Q 0 ${y + 7} 26 ${y}" stroke="${INK}" stroke-width="3" fill="none"/>`;
  body += `<path d="M -20 -22 C -24 -4, -20 16, -8 26" stroke="#fff" stroke-width="3" opacity="0.5" fill="none" stroke-linecap="round"/>`;
  body += `<rect x="-30" y="-36" width="60" height="14" rx="6" fill="url(#brass)" stroke="${INK}" stroke-width="4"/></g>`;
  body += `</g>`;
}

// ---- head -----------------------------------------------------------
{
  const [hx, hy] = P.head;
  // plume streaming back
  body += `<path d="M ${hx - 8} ${hy - 78} C ${hx - 70} ${hy - 150}, ${hx - 170} ${hy - 110}, ${hx - 230} ${hy - 20} C ${hx - 180} ${hy - 62}, ${hx - 120} ${hy - 58}, ${hx - 56} ${hy - 30} C ${hx - 100} ${hy - 22}, ${hx - 148} ${hy + 18}, ${hx - 170} ${hy + 70} C ${hx - 116} ${hy + 26}, ${hx - 60} ${hy + 14}, ${hx - 30} ${hy + 12} Z" fill="url(#clothV)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
  body += `<path d="M ${hx - 50} ${hy - 90} C ${hx - 110} ${hy - 122}, ${hx - 170} ${hy - 80}, ${hx - 214} ${hy - 22}" fill="none" stroke="#ff8a8e" stroke-width="3.5" opacity="0.55" stroke-linecap="round"/>`;
  // helm: rounded skull, sloped visor, chin guard
  body += `<path d="M ${hx - 52} ${hy + 10} C ${hx - 66} ${hy - 62}, ${hx - 24} ${hy - 98}, ${hx + 22} ${hy - 92} C ${hx + 64} ${hy - 86}, ${hx + 92} ${hy - 44}, ${hx + 90} ${hy + 6} L ${hx + 88} ${hy + 44} C ${hx + 80} ${hy + 76}, ${hx + 44} ${hy + 92}, ${hx + 4} ${hy + 88} C ${hx - 36} ${hy + 82}, ${hx - 56} ${hy + 50}, ${hx - 52} ${hy + 10} Z" fill="url(#steel)" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`;
  // visor plate
  body += `<path d="M ${hx + 6} ${hy - 62} C ${hx + 52} ${hy - 58}, ${hx + 90} ${hy - 22}, ${hx + 92} ${hy + 4} L ${hx + 90} ${hy + 30} C ${hx + 52} ${hy + 22}, ${hx + 26} ${hy + 18}, ${hx + 4} ${hy + 20} Z" fill="url(#steelV)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
  // eye slit with ember glow
  body += `<path d="M ${hx + 16} ${hy - 22} L ${hx + 84} ${hy - 14} L ${hx + 84} ${hy - 2} L ${hx + 16} ${hy - 8} Z" fill="#150a06" stroke="${INK}" stroke-width="3"/>`;
  body += `<ellipse cx="${hx + 62}" cy="${hy - 10}" rx="26" ry="9" fill="url(#glowRed)"/><path d="M ${hx + 44} ${hy - 13} L ${hx + 80} ${hy - 9}" stroke="#ffe29a" stroke-width="4" stroke-linecap="round"/>`;
  // breath vents
  for (let i = 0; i < 5; i++) body += `<path d="M ${hx + 50 + i * 8} ${hy + 40 - i * 1.5} L ${hx + 52 + i * 8} ${hy + 60}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
  // crest ridge, brass trim, rivets
  body += `<path d="M ${hx - 40} ${hy - 62} C ${hx - 4} ${hy - 104}, ${hx + 44} ${hy - 98}, ${hx + 84} ${hy - 46}" fill="none" stroke="url(#brassV)" stroke-width="10" stroke-linecap="round"/>`;
  body += `<path d="M ${hx - 40} ${hy - 62} C ${hx - 4} ${hy - 104}, ${hx + 44} ${hy - 98}, ${hx + 84} ${hy - 46}" fill="none" stroke="${INK}" stroke-width="2" opacity="0.5"/>`;
  body += `<path d="M ${hx - 46} ${hy + 18} L ${hx + 6} ${hy + 22}" stroke="url(#brassV)" stroke-width="9" stroke-linecap="round"/>`;
  for (const [x, y] of [[-30, -28], [-14, -44], [-8, 30], [-34, 4], [18, -58]]) body += rivet(hx + x, hy + y, 4.4);
  body += `<path d="M ${hx - 44} ${hy - 20} C ${hx - 38} ${hy - 62}, ${hx - 6} ${hy - 86}, ${hx + 22} ${hy - 82}" fill="none" stroke="#fff" stroke-width="5" opacity="0.6" stroke-linecap="round"/>`;
  body += `<circle cx="${hx - 20}" cy="${hy + 22}" r="14" fill="url(#brass)" stroke="${INK}" stroke-width="4"/>`;
}

// ---- steam + sparks (foreground) ------------------------------
let fx = '';
fx += puff(396, 318, 26, 0.7) + puff(372, 278, 34, 0.55) + puff(342, 232, 42, 0.42) + puff(300, 180, 50, 0.3);
fx += `<circle cx="404" cy="516" r="46" fill="url(#ember)" opacity="0.5" filter="url(#blur3)"/>`;
for (let i = 0; i < 16; i++) {
  const x = 330 + ((i * 53) % 150) - i * 6, y = 560 - ((i * 71) % 400);
  fx += `<circle cx="${x}" cy="${y}" r="${1.6 + (i % 3)}" fill="#ffb347" opacity="${0.8 - i * 0.03}"/>`;
}
// bright glints
const star = (x, y, s) => `<path d="M ${x} ${y - s} L ${x + s * 0.18} ${y - s * 0.18} L ${x + s} ${y} L ${x + s * 0.18} ${y + s * 0.18} L ${x} ${y + s} L ${x - s * 0.18} ${y + s * 0.18} L ${x - s} ${y} L ${x - s * 0.18} ${y - s * 0.18} Z" fill="#fff" opacity="0.95"/>`;
fx += star(464, 392, 22) + star(900, 330, 24) + star(556, 252, 14) + star(412, 884, 15);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${defs}</defs>${bg}<g filter="url(#rim)">${body}</g>${fx}<rect width="${W}" height="${H}" fill="url(#vig)"/></svg>`;
import { writeFileSync } from 'node:fs';
writeFileSync(new URL('./cavaliere.svg', import.meta.url), svg);
console.log('ok', svg.length);
