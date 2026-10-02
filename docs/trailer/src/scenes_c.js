'use strict';
/* Scenes 10-13: hold the line, campaign montage, build/stats, calm outro, finale */

const BATTLES = [
  ['battle-a1-piccolo-soccorso', 'THE LITTLE RELIEF', 'Get the relief captain to safety'],
  ['battle-b1-marsaxlokk', 'SHORE OF MARSAXLOKK', 'Rout the enemy on the beach'],
  ['battle-i2-mdina-walls', 'WALLS OF MDINA', 'Survive five rounds, or rout them'],
  ['battle-a3-castile-breach', 'BREACH OF CASTILE', 'Survive six rounds, or rout them'],
  ['battle-b7-st-elmo-ravelin', 'RAVELIN OF ST ELMO', 'Survive five rounds at the fort'],
  ['battle-c2-marsamxett-galleys', 'GALLEYS OF MARSAMXETT', 'Rout the galley crews'],
  ['battle-a5-scala-engine', 'SCALA’S ENGINE', 'Defeat Scala'],
  ['battle-c4-corradino-heights', 'CORRADINO HEIGHTS', 'Defeat the foreman'],
  ['battle-b9-fall-of-st-elmo', 'THE FALL OF ST ELMO', 'Ninu must escape'],
  ['battle-i5-naxxar-ridge', 'NAXXAR RIDGE', 'Defeat Scala'],
  ['battle-b3-sciberras', 'SCIBERRAS RIDGE', 'Defeat the gun captain'],
  ['battle-b5-tigne', 'GUNS OF TIGNÉ', 'Rout them, or hold four rounds'],
];

/* ====================================================================
   10. HOLD THE LINE   bar 79 .. bar 83   (drum build, dip)
   ==================================================================== */
const OBJECTIVES = ['ROUT THE ENEMY', 'DEFEAT THE LEADER', 'SURVIVE N ROUNDS', 'ESCAPE TO SAFETY'];
SCENES.push({
  name: 'holdline',
  a: 146.58,
  b: bar(83),
  tin: { type: 'fade', dur: 0.9 },
  draw(c, t, lt, d) {
    fillBg(c, '#0a0505', '#030202');
    blurBg(c, ST('battle-b7-st-elmo-ravelin'), 1, 0.7, 1.1 + lt * 0.006);
    c.fillStyle = 'rgba(120,10,6,0.22)';
    c.fillRect(0, 0, W, H);
    const shake = prog(lt, 4.5, d) * 3;
    c.save();
    c.translate(Math.sin(lt * 61) * shake, Math.cos(lt * 53) * shake);
    // objective header
    text(c, 'EVERY BATTLE HAS ITS OWN OBJECTIVE', W / 2, 250, { size: 28, spacing: 12, color: C.gold, alpha: ease.outCubic(prog(lt, 0.4, 1.4)) });
    // HOLD THE LINE, one word per beat
    const words = ['HOLD', 'THE', 'LINE'];
    const sizes = [168, 110, 168];
    const ws = words.map((w, i) => measure(c, w, F.title, sizes[i], 10) * 1.28 + 20);
    const gap = 70;
    const total = ws.reduce((a, b) => a + b, 0) + gap * 2;
    let acc = W / 2 - total / 2;
    const x = ws.map((w) => {
      const cx = acc + w / 2;
      acc += w + gap;
      return cx;
    });
    const t0 = 0.9;
    words.forEach((w, i) => {
      const at = t0 + i * BEAT * 2;
      const l = lt - at;
      if (l < 0) return;
      const k = ease.outExpo(clamp(l / 0.5));
      c.save();
      c.translate(x[i], 480);
      const sc = 1 + (1 - k) * 0.35;
      c.scale(sc, sc);
      c.globalAlpha *= clamp(k * 2);
      text(c, w, 0, 0, { size: sizes[i], weight: 900, spacing: 10, color: C.parch, shadow: 'rgba(0,0,0,0.8)', shadowBlur: 30 });
      c.restore();
      c.fillStyle = `rgba(255,236,200,${0.18 * hit(t, t - lt + at, 9)})`;
      c.fillRect(0, 0, W, H);
    });
    // chips
    OBJECTIVES.forEach((o, i) => {
      const at = 3.2 + i * BEAT * 1.5;
      const k = ease.outBack(prog(lt, at, at + 0.4));
      if (k <= 0) return;
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = W / 2 + (col - 0.5) * 520;
      const cy = 690 + row * 100;
      c.save();
      c.translate(cx, cy);
      c.scale(k, k);
      c.fillStyle = 'rgba(15,8,6,0.85)';
      rrect(c, -230, -36, 460, 72, 36);
      c.fill();
      c.strokeStyle = C.gold;
      c.lineWidth = 2;
      c.stroke();
      text(c, o, 0, 10, { size: 26, spacing: 6, color: C.goldLight, weight: 700 });
      c.restore();
    });
    c.restore();
    // darken into the riser
    const dk = prog(lt, 6.2, d);
    c.fillStyle = `rgba(0,0,0,${dk * 0.9})`;
    c.fillRect(0, 0, W, H);
    // final white-hot line grows
    if (dk > 0) {
      c.fillStyle = `rgba(255,236,200,${dk})`;
      c.fillRect(W / 2 - dk * 700, H / 2 - 2, dk * 1400, 4);
    }
  },
});

/* ====================================================================
   11a. THE CAMPAIGN MONTAGE   bar 83 .. bar 90   (final chorus)
   ==================================================================== */
SCENES.push({
  name: 'montage',
  a: bar(83),
  b: bar(90),
  tin: { type: 'cut', dur: 0, flash: 0.6, flashK: 8 },
  draw(c, t, lt, d) {
    fillBg(c);
    // one still per bar; the first bar is the headline card over the first still
    const n = Math.min(BATTLES.length - 1, Math.floor(lt / BAR));
    const l = lt - n * BAR;
    const drawStill = (idx, local, dir) => {
      const [name] = BATTLES[idx % BATTLES.length];
      const z = 1.06 + local * 0.035;
      const im = img(ST(name));
      if (!im) return;
      c.save();
      const inK = ease.outExpo(prog(local, 0, 0.35));
      c.translate(dir * (1 - inK) * W * 0.5, 0);
      c.drawImage(im, -W * (z - 1) / 2 - local * 14 * dir, -H * (z - 1) / 2, W * z, H * z);
      c.restore();
    };
    if (n > 0 && l < 0.4) drawStill(n - 1, BAR + l, n % 2 ? -1 : 1);
    drawStill(n, l, n % 2 ? 1 : -1);
    c.fillStyle = 'rgba(8,4,4,0.28)';
    c.fillRect(0, 0, W, H);
    // lower third
    const [, name, sub] = BATTLES[n % BATTLES.length];
    const lk = ease.outCubic(prog(l, 0.15, 0.8));
    const g = c.createLinearGradient(0, H - 380, 0, H);
    g.addColorStop(0, 'rgba(5,3,3,0)');
    g.addColorStop(0.55, 'rgba(5,3,3,0.8)');
    g.addColorStop(1, 'rgba(5,3,3,0.95)');
    c.fillStyle = g;
    c.fillRect(0, H - 380, W, 380);
    c.save();
    c.translate(-(1 - lk) * 80, 0);
    c.globalAlpha *= lk;
    text(c, 'BATTLE ' + String(n + 1).padStart(2, '0'), 110, H - 140, { size: 24, spacing: 12, color: C.hot, align: 'left', weight: 700 });
    text(c, name, 110, H - 80, { size: 64, weight: 700, spacing: 8, align: 'left', shadow: '#000', shadowBlur: 16 });
    text(c, sub, 110, H - 36, { font: F.body, size: 34, align: 'left', color: C.goldLight, weight: 'italic 500' });
    c.restore();
    // header counter
    const hk = ease.outCubic(prog(lt, 0.2, 1.0));
    c.save();
    c.globalAlpha *= hk;
    c.fillStyle = 'rgba(5,3,3,0.75)';
    rrect(c, 1290, 110, 520, 120, 6);
    c.fill();
    c.strokeStyle = C.gold;
    c.lineWidth = 2;
    rrect(c, 1290, 110, 520, 120, 6);
    c.stroke();
    text(c, '07 · THE CAMPAIGN', 1320, 152, { size: 22, spacing: 8, color: C.gold, align: 'left' });
    text(c, '24 BATTLES', 1320, 210, { size: 58, weight: 900, spacing: 8, align: 'left' });
    c.restore();
    // beat flashes
    flash(c, beatPulse(t, 12) * 0.07);
    // progress ticks
    for (let i = 0; i < 7; i++) {
      c.fillStyle = i <= n ? C.hot : 'rgba(255,255,255,0.3)';
      c.fillRect(W - 110 - (6 - i) * 40, 100, 30, 4);
    }
  },
});

/* ====================================================================
   11b. BUILD YOUR ARMATURA   bar 90 .. bar 97
   ==================================================================== */
const ATTRS = [
  ['BAS', 5, 14],
  ['POW', 7, 19],
  ['DEX', 6, 16],
  ['AGL', 7, 18],
  ['DEF', 4, 12],
  ['WEP', 6, 17],
];
function radar(c, cx, cy, R, k, k2) {
  const n = ATTRS.length;
  const pt = (i, v) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v];
  };
  // rings
  for (let r = 1; r <= 4; r++) {
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const [x, y] = pt(i, r / 4);
      if (i) c.lineTo(x, y);
      else c.moveTo(x, y);
    }
    c.closePath();
    c.strokeStyle = `rgba(216,179,106,${0.15 + (r === 4 ? 0.25 : 0)})`;
    c.lineWidth = r === 4 ? 2 : 1;
    c.stroke();
  }
  for (let i = 0; i < n; i++) {
    const [x, y] = pt(i, 1);
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(x, y);
    c.strokeStyle = 'rgba(216,179,106,0.2)';
    c.lineWidth = 1;
    c.stroke();
  }
  // polygon: starting stats, then grown by level-ups (k2 = 0..1)
  const val = (i, kk) => {
    const [, v0, v1] = ATTRS[i];
    return lerp(v0, v1, ease.inOutCubic(k2));
  };
  const pts = ATTRS.map((_, i) => {
    const kk = ease.outCubic(clamp(k * 1.4 - i * 0.1));
    return [i, val(i) / 32, kk];
  });
  c.beginPath();
  pts.forEach(([i, v, kk], idx) => {
    const [x, y] = pt(i, v * kk);
    if (idx) c.lineTo(x, y);
    else c.moveTo(x, y);
  });
  c.closePath();
  c.fillStyle = 'rgba(217,70,47,0.35)';
  c.fill();
  c.strokeStyle = C.hot;
  c.lineWidth = 4;
  c.stroke();
  pts.forEach(([i, v, kk]) => {
    const [x, y] = pt(i, v * kk);
    c.beginPath();
    c.arc(x, y, 8, 0, 6.28);
    c.fillStyle = C.goldLight;
    c.fill();
    const [lx, ly] = pt(i, 1.2);
    text(c, ATTRS[i][0], lx, ly + 8, { size: 34, weight: 700, spacing: 6, color: C.parch, alpha: kk });
    text(c, String(Math.round(val(i))), lx, ly + 44, { size: 28, color: C.hot, alpha: kk, weight: 700 });
  });
}

SCENES.push({
  name: 'build',
  a: bar(90),
  b: bar(97),
  tin: { type: 'wipe', dur: 0.9, angle: 0.25, flash: 0.35, flashK: 8 },
  draw(c, t, lt, d) {
    sceneBg(c, '#0f0a0a', '#050303');
    const SW = 6.6; // switch to the prep-screen footage
    const out1 = 1 - prog(lt, SW - 0.5, SW);
    if (out1 > 0) {
      c.save();
      c.globalAlpha *= out1;
      tag(c, '08 · BUILD YOUR ARMATURA', 110, 150, ease.outCubic(prog(lt, 0.3, 1.2)));
      headline(c, ['PILOT.', 'FRAME.', 'GEAR.'], 110, 290, ease.outCubic(prog(lt, 0.2, 1.8)), { size: 96, lh: 104, spacing: 8 });
      const items = [
        ['Six attributes shape every pilot', 'Spend 3 points on every level-up.'],
        ['46 techniques to learn', 'Unlocked by weapon, frame and stats.'],
        ['Owned gear, not endless loot', 'Fit, swap and salvage Armaturas and weapons.'],
      ];
      items.forEach(([h1, h2], i) => {
        const at = 1.6 + i * 1.5;
        const k = prog(lt, at, at + 0.8);
        if (k <= 0) return;
        c.fillStyle = C.hot;
        c.fillRect(110, 640 + i * 124 - 26, 5, 84 * ease.outCubic(k));
        text(c, h1, 140, 640 + i * 124, { size: 34, weight: 700, spacing: 3, align: 'left', alpha: k });
        text(c, h2, 140, 640 + i * 124 + 42, { font: F.body, size: 34, align: 'left', color: C.goldLight, alpha: k, weight: '500' });
      });
      const rk = ease.outCubic(prog(lt, 1.0, 3.6));
      c.save();
      c.globalAlpha *= prog(lt, 0.8, 1.6);
      radar(c, 1330, 490, 260, rk, prog(lt, 3.4, 6.0));
      c.restore();
      text(c, 'NINU · STARTING STATS', 1330, 985, { size: 24, spacing: 10, color: C.gold, alpha: prog(lt, 1.8, 2.6) * (1 - prog(lt, 3.3, 3.8)) });
      text(c, 'NINU · AFTER LEVEL-UPS', 1330, 985, { size: 24, spacing: 10, color: C.hot, alpha: prog(lt, 4.0, 4.8) });
      c.restore();
    }
    if (lt >= SW) {
      const l = lt - SW;
      const inK = ease.outCubic(prog(l, 0.1, 0.8));
      const R = { x: 690, y: 215, w: 1130, h: 636 };
      const shop = l >= 3.2;
      c.save();
      c.globalAlpha *= inK;
      shot(c, ST(shop ? 'prep-armoury-shop-screen' : 'prep-loadout-screen'), R.x, R.y, R.w, R.h,
        shop ? [960, 330 + l * 4, 1.5] : [480, 150 + l * 4, 2.3]);
      tag(c, '08 · BUILD YOUR ARMATURA', 110, 150, 1);
      headline(c, ['GEAR UP', 'BETWEEN', 'BATTLES'], 110, 330, ease.outCubic(prog(l, 0.2, 1.4)), { size: 64, lh: 76, spacing: 5 });
      body(c, 'Fit Armaturas, weapons and charms to your squad.', 110, 620, prog(l, 1.0, 2.2), { size: 40, maxW: 540 });
      body(c, 'Then spend your scudi in the Armoury.', 110, 780, prog(l, 3.4, 4.6), { size: 40, maxW: 540, color: C.parch });
      c.restore();
    }
    embers(c, lt, 26, 101, { speed: 18, alpha: 0.4 });
  },
});

/* ====================================================================
   11c. BY THE NUMBERS   bar 97 .. bar 104
   ==================================================================== */
const STATS = [
  [24, 'BATTLES', 'each its own map and objective'],
  [3, 'ROUTES', 'the Cross, the Island, the Crescent'],
  [3, 'ENDINGS', 'shaped by your choices'],
  [46, 'TECHNIQUES', 'to unlock and master'],
];
SCENES.push({
  name: 'numbers',
  a: bar(97),
  b: 192.96,
  tin: { type: 'cross', dur: 1.0 },
  draw(c, t, lt, d) {
    fillBg(c, '#140a0a', '#050202');
    const bgI = ['battle-b5-tigne', 'battle-i5-naxxar-ridge', 'battle-c2-marsamxett-galleys', 'battle-a5-scala-engine'];
    const per = d / 4;
    const idx = Math.min(3, Math.floor(lt / per));
    const l = lt - idx * per;
    blurBg(c, ST(bgI[idx]), 1, 0.62, 1.1 + l * 0.004);
    c.save();
    c.globalAlpha *= 0.32;
    sun(c, W / 2, 520, 300, { glow: 0.5, rays: 28, rot: lt * 0.05, color: '#6a1710', hot: '#8a2218' });
    c.restore();
    c.fillStyle = 'rgba(5,3,3,0.45)';
    c.fillRect(0, 0, W, H);
    const [num, label, sub] = STATS[idx];
    const k = ease.outExpo(prog(l, 0, 0.5));
    const count = Math.round(num * ease.outCubic(prog(l, 0, 0.9)));
    c.save();
    c.translate(W / 2, 560);
    const sc = 1 + (1 - k) * 0.4;
    c.scale(sc, sc);
    c.globalAlpha *= clamp(k * 2);
    text(c, String(count), 0, 0, { size: 380, weight: 900, spacing: 6, color: C.parch, shadow: 'rgba(0,0,0,0.7)', shadowBlur: 40 });
    c.restore();
    textReveal(c, label, W / 2, 700, prog(l, 0.05, 0.7), { size: 90, weight: 700, spacing: 24, color: C.goldLight, shadow: '#000', shadowBlur: 24 });
    wordsReveal(c, sub, W / 2, 790, prog(l, 0.3, 1.1), { font: F.body, size: 48, weight: 'italic 500', color: C.goldLight });
    flash(c, hit(t, t - lt + idx * per, 8) * 0.22);
    // pips
    STATS.forEach((_, i) => {
      c.fillStyle = i === idx ? C.hot : 'rgba(216,179,106,0.4)';
      c.fillRect(W / 2 - 100 + i * 54, 930, 40, 5);
    });
  },
});

/* ====================================================================
   12. CALM OUTRO   bar 104 .. bar 115   (piano alone)
   ==================================================================== */
function iconBrowser(c, x, y, s, col) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.strokeStyle = col;
  c.lineWidth = 4 / s;
  rrect(c, -50, -36, 100, 72, 8);
  c.stroke();
  c.beginPath();
  c.moveTo(-50, -16);
  c.lineTo(50, -16);
  c.stroke();
  [[-38], [-26], [-14]].forEach(([dx]) => {
    c.beginPath();
    c.arc(dx, -26, 3, 0, 6.28);
    c.fillStyle = col;
    c.fill();
  });
  c.restore();
}
function iconPhone(c, x, y, s, col) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.strokeStyle = col;
  c.lineWidth = 4 / s;
  rrect(c, -64, -34, 128, 68, 14);
  c.stroke();
  c.beginPath();
  c.arc(54, 0, 3, 0, 6.28);
  c.fillStyle = col;
  c.fill();
  c.restore();
}
function iconDeck(c, x, y, s, col) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.strokeStyle = col;
  c.lineWidth = 4 / s;
  rrect(c, -80, -32, 160, 64, 28);
  c.stroke();
  rrect(c, -40, -22, 80, 44, 4);
  c.stroke();
  c.beginPath();
  c.arc(-62, -4, 6, 0, 6.28);
  c.arc(62, -4, 6, 0, 6.28);
  c.stroke();
  c.restore();
}
function iconTablet(c, x, y, s, col) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.strokeStyle = col;
  c.lineWidth = 4 / s;
  rrect(c, -60, -42, 120, 84, 10);
  c.stroke();
  rrect(c, -50, -32, 100, 64, 3);
  c.stroke();
  c.restore();
}

SCENES.push({
  name: 'outro',
  a: 192.96,
  b: bar(115),
  tin: { type: 'fade', dur: 1.6 },
  draw(c, t, lt, d) {
    fillBg(c, '#0b0607', '#030202');
    blurBg(c, ST('battle-b9-fall-of-st-elmo'), 0.9, 0.58, 1.12 + lt * 0.003);
    // low red sun glow that grows toward the reprise
    const gk = ease.inQuad(prog(lt, 9.5, d));
    const hz = 880;
    sun(c, W / 2, lerp(hz + 190, hz - 30, gk), 170, { glow: 0.2 + gk * 1.0, clipY: hz });
    const sea2 = c.createLinearGradient(0, hz, 0, H);
    sea2.addColorStop(0, `rgba(60,16,12,${0.9})`);
    sea2.addColorStop(1, 'rgba(3,2,2,1)');
    c.fillStyle = sea2;
    c.fillRect(0, hz, W, H - hz);
    for (let i = 0; i < 12; i++) {
      const w = 170 * (1 - i / 16) * gk * (0.6 + 0.4 * Math.sin(lt * 1.3 + i));
      c.fillStyle = `rgba(255,90,54,${0.5 * gk * (1 - i / 14)})`;
      c.fillRect(W / 2 - w, hz + 6 + i * 13, w * 2, 3 + i * 0.3);
    }
    c.fillStyle = 'rgba(255,150,100,0.3)';
    c.fillRect(0, hz, W, 1.5);
    c.fillStyle = 'rgba(4,2,2,0.2)';
    c.fillRect(0, 0, W, H);
    const A = (a, b) => prog(lt, a, a + 1.4) * (1 - prog(lt, b - 0.8, b));
    // 1
    wordsReveal(c, 'Heroism and cost,', W / 2, 470, prog(lt, 1.0, 3.2), { font: F.body, size: 104, weight: 'italic 500', alpha: 1 - prog(lt, 5.4, 6.2) });
    wordsReveal(c, 'on both sides.', W / 2, 580, prog(lt, 2.4, 4.4), { font: F.body, size: 104, weight: 'italic 500', alpha: 1 - prog(lt, 5.4, 6.2) });
    // 2
    const a2 = prog(lt, 6.6, 7.6) * (1 - prog(lt, 11.0, 11.8));
    if (a2 > 0) {
      text(c, 'ARMATURA 1565', W / 2, 400, { size: 60, weight: 700, spacing: 20, color: C.gold, alpha: a2 });
      wordsReveal(c, 'An original tactical RPG of the Great Siege of Malta,', W / 2, 500, prog(lt, 7.0, 9.0), { font: F.body, size: 56, weight: '500', alpha: 1 - prog(lt, 11.0, 11.8) });
      wordsReveal(c, 'where clockwork machines changed the war.', W / 2, 575, prog(lt, 8.0, 10.0), { font: F.body, size: 56, weight: '500', color: C.goldLight, alpha: 1 - prog(lt, 11.0, 11.8) });
    }
    // 3: platforms
    const a3 = prog(lt, 12.2, 13.2) * (1 - prog(lt, 18.8, 19.6));
    if (a3 > 0) {
      text(c, 'BUILT FOR', W / 2, 330, { size: 26, spacing: 16, color: C.gold, alpha: a3 });
      const icons = [
        [iconBrowser, 'BROWSER'],
        [iconPhone, 'PHONES'],
        [iconTablet, 'TABLETS'],
        [iconDeck, 'STEAM DECK'],
      ];
      icons.forEach(([fn, label], i) => {
        const k = ease.outBack(prog(lt, 12.8 + i * 0.5, 13.6 + i * 0.5)) * (1 - prog(lt, 18.8, 19.6));
        if (k <= 0) return;
        const x = W / 2 + (i - 1.5) * 330;
        c.save();
        c.globalAlpha *= clamp(k);
        fn(c, x, 470, 1.6 * k, C.goldLight);
        text(c, label, x, 580, { size: 28, spacing: 10, color: C.parch });
        c.restore();
      });
      wordsReveal(c, 'Landscape. Touch-first. Free to play.', W / 2, 700, prog(lt, 15.2, 17.0), { font: F.body, size: 56, weight: 'italic 500', alpha: 1 - prog(lt, 18.8, 19.6) });
    }
    embers(c, lt, 36, 111, { speed: 14, alpha: 0.45 });
  },
});

/* ====================================================================
   13. FINALE   bar 115 .. end
   ==================================================================== */
const COLLAGE = [
  'battle-a1-piccolo-soccorso', 'battle-b1-marsaxlokk', 'ui-combat-forecast', 'battle-i2-mdina-walls',
  'story-line-05', 'battle-c2-marsamxett-galleys', 'ui-cinematic-closeup-1', 'battle-a3-castile-breach',
  'battle-b7-st-elmo-ravelin', 'battle-c4-corradino-heights', 'ui-defender-reaction-menu', 'battle-i5-naxxar-ripple',
];
COLLAGE[11] = 'battle-i5-naxxar-ridge';
SCENES.push({
  name: 'finale',
  a: bar(115),
  b: DURATION,
  tin: { type: 'cut', dur: 0, flash: 1, flashK: 4 },
  draw(c, t, lt, d) {
    fillBg(c, '#180909', '#050202');
    const collapseAt = bar(118) - bar(115);
    const ck = ease.inCubic(prog(lt, collapseAt - 0.25, collapseAt + 0.35));
    // collage 4x3
    if (ck < 1) {
      const tw = W / 4;
      const th = H / 3;
      COLLAGE.forEach((name, i) => {
        const at = i * BEAT;
        const k = ease.outCubic(prog(lt, at, at + 0.3));
        const col = i % 4;
        const row = Math.floor(i / 4);
        const cx = col * tw + tw / 2;
        const cy = row * th + th / 2;
        c.save();
        const toCx = lerp(cx, W / 2, ck);
        const toCy = lerp(cy, 540, ck);
        c.translate(toCx, toCy);
        const s = (1 + 0.1 * (1 - k)) * (1 - ck * 0.95);
        c.scale(s, s);
        c.rotate(ck * 1.2 * (i % 2 ? 1 : -1));
        const im = img(ST(name));
        c.beginPath();
        c.rect(-tw / 2 + 3, -th / 2 + 3, tw - 6, th - 6);
        c.save();
        c.clip();
        if (im) {
          const sh = 1080;
          const sw = sh * (tw / th);
          c.drawImage(im, 960 - sw / 2, 0, sw, sh, -tw / 2, -th / 2, tw, th);
        }
        c.fillStyle = `rgba(8,4,4,${0.78 * (1 - k)})`;
        c.fillRect(-tw / 2, -th / 2, tw, th);
        c.fillStyle = `rgba(255,236,200,${0.5 * hit(t, bar(115) + at, 10)})`;
        c.fillRect(-tw / 2, -th / 2, tw, th);
        c.restore();
        c.strokeStyle = C.gold;
        c.lineWidth = 3;
        c.strokeRect(-tw / 2 + 3, -th / 2 + 3, tw - 6, th - 6);
        c.restore();
      });
    }
    // lockup after the collapse
    const L = lt - collapseAt;
    if (L > -0.05) {
      const sk = ease.outExpo(clamp(L / 1.4));
      const pulse = beatPulse(t, 6);
      sun(c, W / 2, 440, 330 * (0.4 + 0.6 * sk) + pulse * 8, { glow: 1.15, rays: 36, rot: L * 0.05, bands: 7 });
      for (let i = 0; i < 3; i++) {
        const k = prog(L, i * 0.14, 1.4 + i * 0.14);
        if (k <= 0 || k >= 1) continue;
        c.beginPath();
        c.arc(W / 2, 440, 120 + ease.outExpo(k) * 1500, 0, 6.28);
        c.strokeStyle = `rgba(255,200,150,${0.6 * (1 - k)})`;
        c.lineWidth = 6 * (1 - k) + 1;
        c.stroke();
      }
      embers(c, lt, 80, 121, { speed: 55, alpha: 0.8 });
      const tp = c.createRadialGradient(W / 2, 520, 100, W / 2, 520, 820);
      tp.addColorStop(0, 'rgba(5,2,3,0.6)');
      tp.addColorStop(1, 'rgba(5,2,3,0)');
      c.fillStyle = tp;
      c.fillRect(0, 0, W, H);
      const mk = ease.outBack(prog(L, 0.2, 1.0));
      c.save();
      c.translate(W / 2, 215);
      c.scale(mk, mk);
      maltese(c, 0, 0, 62, C.parch);
      c.restore();
      const tk = ease.outExpo(prog(L, 0.15, 0.9));
      c.save();
      c.translate(W / 2, 470);
      const sc = 1 + (1 - tk) * 0.4;
      c.scale(sc, sc);
      c.globalAlpha *= clamp(tk * 2);
      text(c, 'ARMATURA', 0, 0, { size: 208, weight: 900, spacing: 18 * tk + 6, shadow: 'rgba(0,0,0,0.8)', shadowBlur: 40 });
      c.restore();
      text(c, '1565', W / 2, 580, { size: 112, weight: 700, spacing: 44, color: C.gold, alpha: ease.outCubic(prog(L, 0.6, 1.4)), shadow: 'rgba(0,0,0,0.8)' });
      text(c, 'THE GREAT SIEGE OF MALTA', W / 2, 660, { size: 36, spacing: 16, color: C.parch, alpha: ease.outCubic(prog(L, 1.2, 2.0)) });
      // call to action
      const ck2 = prog(L, 3.2, 4.2);
      if (ck2 > 0) {
        c.save();
        c.globalAlpha *= ease.outCubic(ck2);
        c.fillStyle = 'rgba(8,4,4,0.8)';
        rrect(c, W / 2 - 460, 730, 920, 150, 10);
        c.fill();
        c.strokeStyle = C.gold;
        c.lineWidth = 2.5;
        rrect(c, W / 2 - 460, 730, 920, 150, 10);
        c.stroke();
        text(c, 'PLAY NOW IN YOUR BROWSER', W / 2, 790, { size: 38, weight: 700, spacing: 10, color: C.hot });
        text(c, 'jordankvlr.github.io/1565-La-Val-Bandit', W / 2, 850, { font: F.body, size: 46, weight: '600', color: C.parch, spacing: 1 });
        c.restore();
      }
      text(c, 'Music: “Under the Red Sun”', W / 2, 990, { font: F.body, size: 36, weight: 'italic 500', color: C.goldLight, alpha: prog(L, 4.6, 5.6) });
    }
    flash(c, hit(t, bar(118), 6) * 0.9);
  },
});
