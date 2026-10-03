'use strict';
/* Opening cinematic, shots 1-6 */

/* narration caption: lines revealed word by word in a dark lower third */
function capBack(c, k = 1, h = 330) {
  if (k <= 0) return;
  const g = c.createLinearGradient(0, H - h, 0, H);
  g.addColorStop(0, 'rgba(4,2,2,0)');
  g.addColorStop(1, `rgba(4,2,2,${0.82 * k})`);
  c.fillStyle = g;
  c.fillRect(0, H - h, W, h);
}
/* lt: scene time, [a,b]: visible window (seconds). */
function cap(c, lt, a, b, lines, o = {}) {
  const { y = H - 150, size = 64, color = C.parch, align = 'center', x = W / 2, lh = 78, font = F.body, weight = 'italic 500' } = o;
  const k = prog(lt, a, a + 1.3);
  const out = 1 - prog(lt, b - 0.7, b);
  if (k <= 0 || out <= 0) return;
  const n = lines.length;
  lines.forEach((ln, i) => {
    wordsReveal(c, ln, x, y - (n - 1 - i) * lh, clamp(k * 1.5 - i * 0.35), {
      font, size, weight, color, align, alpha: out, shadow: 'rgba(0,0,0,0.9)', shadowBlur: 22,
    });
  });
}
function sceneFade(c, lt, inDur = 1.2) {
  if (lt < inDur) {
    c.fillStyle = `rgba(0,0,0,${1 - lt / inDur})`;
    c.fillRect(0, 0, W, H);
  }
}

/* ====================================================================
   1. EXILE   0 .. 13.2
   ==================================================================== */
SCENES.push({
  name: 'exile',
  a: 0,
  b: 13.2,
  tin: { type: 'cut', dur: 0 },
  draw(c, t, lt) {
    const hz = 700;
    gradSky(c, 0, hz, [[0, '#06030a'], [0.55, '#2a0b10'], [1, '#7a2012']]);
    // stars fade as the fire lights the sky
    const rs = rng(4);
    for (let i = 0; i < 110; i++) {
      const x = rs() * W;
      const y = rs() * hz * 0.7;
      c.fillStyle = `rgba(255,235,210,${(0.15 + rs() * 0.5) * (0.6 + 0.4 * Math.sin(lt * 1.3 + i))})`;
      c.fillRect(x, y, 1.6, 1.6);
    }
    // burning glow behind the fortress
    const gl = c.createRadialGradient(360, hz - 160, 40, 360, hz - 160, 900);
    gl.addColorStop(0, 'rgba(255,120,50,0.55)');
    gl.addColorStop(1, 'rgba(255,60,30,0)');
    c.fillStyle = gl;
    c.fillRect(0, 0, W, H);
    // distant island + fortress (slow parallax)
    const px = -lt * 4;
    c.fillStyle = '#12080a';
    c.beginPath();
    c.moveTo(-200 + px, hz);
    c.quadraticCurveTo(200 + px, hz - 150, 520 + px, hz - 70);
    c.quadraticCurveTo(700 + px, hz - 40, 820 + px, hz);
    c.closePath();
    c.fill();
    fortress(c, 360 + px, hz - 28, 1.15, '#0b0507', lt);
    // fires on the walls + smoke
    [[150, 262], [300, 300], [420, 232], [540, 330]].forEach(([fx, fy], i) => {
      flame(c, fx + px, hz - fy * 0.9, 0.9, lt, i + 1, { glow: 0.8 });
    });
    smoke(c, 360 + px, hz - 320, lt, { n: 22, w: 360, h: 520, col: '24,14,14', alpha: 0.5, seed: 11, drift: 160 });
    // sea
    const sea = c.createLinearGradient(0, hz, 0, H);
    sea.addColorStop(0, '#3b0f0c');
    sea.addColorStop(1, '#050203');
    c.fillStyle = sea;
    c.fillRect(0, hz, W, H - hz);
    // fire reflection
    for (let i = 0; i < 36; i++) {
      const y = hz + 6 + Math.pow(i, 1.5) * 2.4;
      const w = 220 * (1 - i / 50) * (0.55 + 0.45 * Math.sin(lt * 1.6 + i * 1.2));
      c.fillStyle = `rgba(255,110,50,${0.4 * (1 - i / 40)})`;
      c.fillRect(360 + px - w, y, w * 2, 2 + i * 0.2);
    }
    waterLines(c, hz, lt, '255,140,100', 0.16, { n: 36 });
    // the fleet leaves: galleys sailing right, away from the fire
    const fleet = [
      [0.0, 0.62], [0.18, 0.74], [0.36, 0.9], [0.55, 1.0], [0.74, 0.84], [0.9, 0.7],
    ];
    fleet.forEach(([u, s], i) => {
      const x = 820 + u * 1100 + lt * (22 + s * 14);
      const y = hz + 34 + s * 110;
      galley(c, x, y, s, lt + i, '#050203', { oars: 9, flag: i === 3 ? '#b8321f' : null });
    });
    embers(c, lt, 70, 8, { speed: 55, alpha: 0.8 });
    // text
    textReveal(c, '1522', W / 2, 250, prog(lt, 0.9, 2.8), { size: 150, weight: 700, spacing: 40, color: C.gold, shadow: 'rgba(0,0,0,0.7)' });
    capBack(c, ease.outCubic(prog(lt, 3, 4)));
    cap(c, lt, 3.4, 7.2, ['Rhodes falls.']);
    cap(c, lt, 7.6, 12.6, ['The Knights of St John', 'have no home.'], { size: 62 });
    sceneFade(c, lt, 1.6);
  },
});

/* ====================================================================
   2. A ROCK IN THE SEA   13.2 .. 29.88
   ==================================================================== */
const IMAP = { x: 880, y: 90, w: 960, view: [20, 20, 735, 680] };
SCENES.push({
  name: 'rock',
  a: 13.2,
  b: 29.88,
  tin: { type: 'fade', dur: 1.6 },
  draw(c, t, lt) {
    fillBg(c, '#110b09', '#050303');
    // ink-wash sky
    const gl = c.createRadialGradient(1380, 540, 80, 1380, 540, 900);
    gl.addColorStop(0, 'rgba(90,40,20,0.35)');
    gl.addColorStop(1, 'rgba(90,40,20,0)');
    c.fillStyle = gl;
    c.fillRect(0, 0, W, H);
    // camera: the whole archipelago, then a push into the Grand Harbour as the forts rise
    const zk = ease.inOutCubic(prog(lt, 9.6, 12.2));
    const z = lerp(1, 7, zk);
    const hp = MAPS.place('harbour', IMAP);
    const T = { x: 1340, y: 560 };
    const tx = (T.x - hp[0] * z) * zk;
    const ty = (T.y - hp[1] * z) * zk;
    const toScr = (p) => [p[0] * z + tx, p[1] * z + ty];
    c.save();
    c.translate(tx, ty);
    c.scale(z, z);
    // sea contours
    for (let i = 0; i < 10; i++) {
      const s = 1.05 + i * 0.05 + Math.sin(lt * 0.8 + i) * 0.004;
      maltaPath(c, IMAP, s);
      c.strokeStyle = `rgba(216,179,106,${0.18 * (1 - i / 11) * ease.outCubic(prog(lt, 3.5, 6)) * (1 - zk * 0.7)})`;
      c.lineWidth = 1.3 / z;
      c.stroke();
    }
    // the islands rise from the sea
    const rise = ease.outCubic(prog(lt, 3.8, 7.5));
    c.save();
    c.globalAlpha *= rise;
    c.translate(0, ((1 - rise) * 40) / z);
    drawMalta(c, IMAP, { land: '#4a3726', sea: '#110b09', coast: C.gold, coastW: 3, z });
    c.save();
    maltaPath(c, IMAP, 1);
    c.clip();
    for (let i = 1; i < 7; i++) {
      maltaPath(c, IMAP, 1 - i * 0.075);
      c.strokeStyle = `rgba(216,179,106,${0.18 * (1 - zk)})`;
      c.lineWidth = 1.2 / z;
      c.stroke();
    }
    c.restore();
    c.restore();
    // harbour forts appear on the real peninsulas
    const forts = [
      ['stElmo', 'FORT ST ELMO', [150, -120, 'left']],
      ['stAngelo', 'FORT ST ANGELO', [170, -40, 'left']],
      ['birgu', 'BIRGU', [190, 60, 'left']],
      ['senglea', 'SENGLEA', [70, 190, 'left']],
    ];
    const fpts = forts.map(([p]) => MAPS.hplace(p, IMAP));
    forts.forEach(([, , ], i) => {
      const k = ease.outBack(prog(lt, 11.4 + i * 0.45, 12.2 + i * 0.45));
      if (k <= 0) return;
      const [px, py] = fpts[i];
      c.save();
      c.translate(px, py);
      c.scale(k / z, k / z);
      c.rotate(Math.PI / 4);
      c.fillStyle = C.ink;
      c.fillRect(-11, -11, 22, 22);
      c.strokeStyle = C.gold;
      c.lineWidth = 3;
      c.strokeRect(-11, -11, 22, 22);
      c.restore();
    });
    c.restore();
    // island names at the wide view
    const iw = ease.outCubic(prog(lt, 6.0, 7.2)) * (1 - zk);
    if (iw > 0) {
      [['GOZO', [165, 120]], ['COMINO', [372, 196]], ['MALTA', [520, 470]]].forEach(([n, p]) => {
        const [x, y] = MAPS.px(p[0], p[1], IMAP);
        text(c, n, x, y, { size: n === 'MALTA' ? 34 : 24, spacing: 12, color: C.goldLight, alpha: iw * 0.85, shadow: '#000', shadowBlur: 10 });
      });
    }
    // fort labels (screen space)
    forts.forEach(([, name, off], i) => {
      const a = prog(lt, 11.7 + i * 0.45, 12.6 + i * 0.45);
      if (a <= 0) return;
      const [sx, sy] = toScr(fpts[i]);
      c.save();
      c.globalAlpha *= a;
      c.strokeStyle = C.gold;
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(sx, sy);
      c.lineTo(sx + off[0], sy + off[1]);
      c.stroke();
      c.restore();
      text(c, name, sx + off[0] + (off[2] === 'left' ? 10 : -10), sy + off[1] + 8, { size: 26, spacing: 6, color: C.goldLight, align: off[2], alpha: a, shadow: '#000', shadowBlur: 10 });
    });
    text(c, 'THE GRAND HARBOUR', 1500, 930, { size: 30, spacing: 12, color: C.gold, alpha: prog(lt, 11.0, 12.0), shadow: '#000' });
    text(c, 'fortified by the Knights, 1530–1565', 1500, 976, { font: F.body, size: 34, weight: 'italic 500', color: C.parch, alpha: prog(lt, 11.5, 12.5), shadow: '#000' });
    // falcon crossing the sky
    const fk = prog(lt, 0.2, 9.5);
    if (fk > 0 && fk < 1) {
      const fx = lerp(-100, W + 100, ease.inOutSine(fk));
      const fy = 250 + Math.sin(fk * 5) * 40 - fk * 60;
      falcon(c, fx, fy, 1.5, lt, 'rgba(10,6,7,0.95)');
    }
    // text
    textReveal(c, '1530', 130, 270, prog(lt, 0.8, 2.6), { size: 140, weight: 700, spacing: 30, color: C.gold, align: 'left', shadow: 'rgba(0,0,0,0.7)' });
    const L = (str, y, a, b, sz = 54) =>
      wordsReveal(c, str, 130, y, prog(lt, a, a + 1.4), { font: F.body, size: sz, weight: 'italic 500', align: 'left', alpha: 1 - prog(lt, b - 0.6, b) });
    L('An emperor gives them', 400, 3.2, 8.4);
    L('a rock in the middle of the sea.', 468, 3.8, 8.4);
    L('The rent:', 640, 9, 16.4);
    L('one falcon a year.', 710, 9.8, 16.4, 66);
    // falcon icon next to rent
    const ik = ease.outCubic(prog(lt, 11.5, 12.6));
    if (ik > 0) falcon(c, 640 + Math.sin(lt * 0.9) * 8, 690 - 6 * Math.sin(lt * 1.4), 1.1, lt * 0.5, C.goldLight);
    sceneFade(c, lt, 0.01);
  },
});

/* ====================================================================
   3. THE MACHINES   29.88 .. 41.34
   ==================================================================== */
SCENES.push({
  name: 'machines',
  a: 29.88,
  b: 41.34,
  tin: { type: 'fade', dur: 1.2 },
  draw(c, t, lt) {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b2620');
    g.addColorStop(1, '#06130f');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(216,179,106,0.09)';
    c.lineWidth = 1;
    for (let x = 0; x < W; x += 60) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, H);
      c.stroke();
    }
    for (let y = 0; y < H; y += 60) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(W, y);
      c.stroke();
    }
    const spin = lt * (0.2 + 0.12 * lt * 0.5 * prog(lt, 6, 11.4) * 3);
    // gears fly in and lock
    const gears = [
      [260, 250, 190, 20, 1], [560, 150, 110, 12, -1], [1640, 250, 230, 24, 1], [1380, 880, 150, 16, -1],
      [180, 860, 130, 13, -1], [1820, 760, 100, 11, 1], [900, 960, 90, 10, 1],
    ];
    gears.forEach(([gx, gy, r, n, d], i) => {
      const k = ease.outBack(prog(lt, 0.2 + i * 0.25, 1.3 + i * 0.25));
      if (k <= 0) return;
      gear(c, gx + (1 - k) * (gx < W / 2 ? -500 : 500), gy, r * k, n, d * spin * (20 / n) * 2 + i, { stroke: 'rgba(216,179,106,0.32)', lw: 2, spokes: 5 });
    });
    // first harness: assembled by a scan line
    const cam = ease.inOutCubic(prog(lt, 6, 9));
    const S = lerp(1.22, 0.78, cam);
    const x0 = lerp(960, 1290, cam);
    const y0 = 960;
    const rk = ease.inOutCubic(prog(lt, 1.4, 4.4));
    c.save();
    c.beginPath();
    c.rect(0, y0 - 760 * S * rk - 30, W, 900);
    c.clip();
    drawArmatura(c, x0, y0, S, lt);
    c.restore();
    if (rk > 0 && rk < 1) {
      const sy = y0 - 760 * S * rk;
      const sg = c.createLinearGradient(0, sy - 30, 0, sy + 4);
      sg.addColorStop(0, 'rgba(244,224,160,0)');
      sg.addColorStop(1, 'rgba(244,224,160,0.85)');
      c.fillStyle = sg;
      c.fillRect(x0 - 340 * S, sy - 30, 680 * S, 34);
    }
    // the human for scale
    const dk = ease.outCubic(prog(lt, 4.4, 5.6)) * (1 - cam);
    if (dk > 0) {
      c.save();
      c.globalAlpha *= dk;
      humanFigure(c, x0 - 360 * S, y0, 1.18, 'rgba(234,223,194,0.85)');
      c.restore();
    }
    // the second harness (the other side of the war)
    const k2 = ease.outCubic(prog(lt, 7.6, 9.4));
    if (k2 > 0) {
      c.save();
      c.globalAlpha *= k2;
      c.filter = 'hue-rotate(150deg) saturate(1.6)';
      c.translate(560, 0);
      c.scale(-1, 1);
      c.translate(-560 + 0, 0);
      drawArmatura(c, 520 * 1 + 0, y0, S, lt + 1.7);
      c.restore();
      c.filter = 'none';
    }
    floorLine(c, x0, y0);
    capBack(c, ease.outCubic(prog(lt, 1, 2)), 300);
    cap(c, lt, 1.2, 5.8, ['In this history,', 'an inventor builds machines of war.'], { size: 60 });
    cap(c, lt, 6.6, 11.2, ['He sells them to both sides.'], { size: 66 });
    sceneFade(c, lt, 0.01);
  },
});
function floorLine(c, x0, y0) {
  c.strokeStyle = C.gold;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(0, y0 + 2);
  c.lineTo(W, y0 + 2);
  c.stroke();
}

/* ====================================================================
   4. TWO EMPIRES   41.34 .. 66.7
   ==================================================================== */
const MBOX = { x: 130, y: 130, w: 1660, h: 803 };
function catmull(pts, per = 14) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < per; j++) {
      const u = j / per;
      const u2 = u * u;
      const u3 = u2 * u;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3),
      ]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
let ROUTE = null;
SCENES.push({
  name: 'empires',
  a: 41.34,
  b: 66.7,
  tin: { type: 'cut', dur: 0, flash: 1, flashK: 5 },
  draw(c, t, lt) {
    if (lt < 11.6) {
      fillBg(c, '#0a0b12', '#030305');
      if (!ROUTE) {
        const geo = [[28.97, 41.0], [27.6, 40.5], [26.4, 40.1], [25.3, 38.6], [24.0, 36.6], [22.0, 35.6], [18.5, 35.5], [14.4, 35.9]];
        ROUTE = catmull(geo.map(([lo, la]) => medProject(lo, la, MBOX)), 16);
      }
      medPath(c, MBOX);
      const sg = c.createLinearGradient(0, MBOX.y, 0, MBOX.y + MBOX.h);
      sg.addColorStop(0, '#16253f');
      sg.addColorStop(1, '#0a1424');
      c.fillStyle = sg;
      c.fill();
      c.save();
      medPath(c, MBOX);
      c.clip();
      c.strokeStyle = 'rgba(216,179,106,0.07)';
      c.lineWidth = 1;
      for (let x = MBOX.x; x < MBOX.x + MBOX.w; x += 80) {
        c.beginPath();
        c.moveTo(x, MBOX.y);
        c.lineTo(x, MBOX.y + MBOX.h);
        c.stroke();
      }
      for (let y = MBOX.y; y < MBOX.y + MBOX.h; y += 80) {
        c.beginPath();
        c.moveTo(MBOX.x, y);
        c.lineTo(MBOX.x + MBOX.w, y);
        c.stroke();
      }
      waterLines(c, MBOX.y, t, '140,170,230', 0.08, { n: 40 });
      c.restore();
      // islands as land
      medIslands(c, MBOX);
      c.fillStyle = '#0a0b12';
      c.fill();
      c.strokeStyle = C.gold;
      c.lineWidth = 2;
      c.stroke();
      medPath(c, MBOX);
      c.strokeStyle = C.gold;
      c.lineWidth = 3;
      c.stroke();
      const ist = medProject(...PLACES_MED.istanbul, MBOX);
      const mal = medProject(...PLACES_MED.malta, MBOX);
      const ig = c.createRadialGradient(ist[0], ist[1], 4, ist[0], ist[1], 150 + 10 * Math.sin(lt * 3));
      ig.addColorStop(0, 'rgba(47,176,184,0.7)');
      ig.addColorStop(1, 'rgba(47,176,184,0)');
      c.fillStyle = ig;
      c.fillRect(ist[0] - 200, ist[1] - 200, 400, 400);
      c.fillStyle = '#7fe0e6';
      c.beginPath();
      c.arc(ist[0], ist[1], 7, 0, 6.28);
      c.fill();
      text(c, 'ISTANBUL', ist[0] - 16, ist[1] - 22, { size: 22, spacing: 6, color: '#8fe3e8', align: 'right', alpha: prog(lt, 0.8, 1.6) });
      const n = ROUTE.length - 1;
      const rk = ease.inOutCubic(prog(lt, 1.2, 5.0));
      c.save();
      c.strokeStyle = 'rgba(47,176,184,0.5)';
      c.lineWidth = 3;
      c.setLineDash([14, 10]);
      c.lineDashOffset = -lt * 30;
      c.beginPath();
      for (let i = 0; i <= n * rk; i++) {
        const [x, y] = ROUTE[i];
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
      c.restore();
      const nShips = 26;
      for (let i = 0; i < nShips; i++) {
        const u = ((lt - 2.6) * 0.055 - i * 0.034 + 1000) % 1.2;
        if (lt < 2.6 + i * 0.12 || u > 1 || u * n > n * rk) continue;
        const [x, y] = ROUTE[Math.min(n, Math.floor(u * n))];
        const j = Math.sin(i * 12.9) * 12;
        sailSmall(c, x + j, y + j * 0.6, 1.5 + (i % 3) * 0.25, '#f2fafa', 0.96);
      }
      const mp = 0.5 + 0.5 * Math.sin(lt * 4);
      c.beginPath();
      c.arc(mal[0], mal[1], 14 + mp * 8, 0, 6.28);
      c.strokeStyle = `rgba(217,70,47,${0.5 + 0.3 * mp})`;
      c.lineWidth = 3;
      c.stroke();
      c.fillStyle = C.hot;
      c.beginPath();
      c.arc(mal[0], mal[1], 7, 0, 6.28);
      c.fill();
      text(c, 'MALTA', mal[0], mal[1] + 52, { size: 26, spacing: 8, color: C.hot, align: 'center', alpha: prog(lt, 4.5, 5.5), weight: 700 });
      capBack(c, ease.outCubic(prog(lt, 1.5, 2.5)), 300);
      cap(c, lt, 2.0, 6.6, ['Suleiman the Magnificent', 'sends his fleet.'], { size: 62 });
      cap(c, lt, 7.2, 11.4, ['The greatest empire of its age', 'sets sail for a rock.'], { size: 58 });
    } else {
      const l2 = lt - 11.6;
      gradSky(c, 0, 780, [[0, '#0a1030'], [0.55, '#2c2850'], [1, '#6a4a66']]);
      const rs = rng(21);
      for (let i = 0; i < 120; i++) {
        c.fillStyle = `rgba(255,240,220,${0.2 + rs() * 0.5})`;
        c.fillRect(rs() * W, rs() * 480, 1.6, 1.6);
      }
      const mg = c.createRadialGradient(1560, 190, 10, 1560, 190, 260);
      mg.addColorStop(0, 'rgba(255,245,220,0.6)');
      mg.addColorStop(1, 'rgba(255,245,220,0)');
      c.fillStyle = mg;
      c.fillRect(1260, 0, 600, 520);
      c.fillStyle = '#f2ead2';
      c.beginPath();
      c.arc(1560, 190, 46, 0, 6.28);
      c.fill();
      const hz = 780;
      // sea first, town on a rise in front
      c.fillStyle = '#080a18';
      c.fillRect(0, hz, W, H - hz);
      waterLines(c, hz, lt, '170,190,255', 0.16, { n: 18 });
      // town silhouette with lit windows
      c.fillStyle = '#06070f';
      for (let i = 0; i < 26; i++) {
        const bx = i * 78 + (i % 3) * 12;
        const bh = 80 + ((i * 53) % 130);
        c.fillRect(bx, hz - bh, 66, bh + 4);
        if (i % 4 === 1) {
          c.beginPath();
          c.arc(bx + 33, hz - bh, 26, Math.PI, 0);
          c.fill();
        }
        c.fillStyle = `rgba(255,190,100,${0.5 + 0.3 * Math.sin(lt * 3 + i)})`;
        c.fillRect(bx + 14, hz - bh + 24, 7, 12);
        c.fillRect(bx + 40, hz - bh + 48, 7, 12);
        c.fillStyle = '#06070f';
      }
      // church tower: lit belfry with swinging bells
      c.fillStyle = '#06070f';
      c.fillRect(1120, hz - 520, 190, 524);
      c.beginPath();
      c.moveTo(1108, hz - 520);
      c.lineTo(1215, hz - 650);
      c.lineTo(1322, hz - 520);
      c.closePath();
      c.fill();
      c.fillStyle = 'rgba(255,170,90,0.95)';
      c.fillRect(1150, hz - 470, 130, 140);
      const swing = Math.sin(lt * 5.2) * 0.38 * prog(l2, 0, 1);
      c.save();
      c.beginPath();
      c.rect(1150, hz - 470, 130, 140);
      c.clip();
      bell(c, 1182, hz - 470, 1.1, swing, '#1a0e08');
      bell(c, 1250, hz - 470, 1.1, -swing, '#1a0e08');
      c.restore();
      const ph = ((t - OFFSET) / BEAT) % 2;
      for (let i = 0; i < 3; i++) {
        const k = (ph / 2 + i / 3) % 1;
        c.beginPath();
        c.arc(1215, hz - 400, 60 + k * 800, 0, 6.28);
        c.strokeStyle = `rgba(255,210,150,${0.3 * (1 - k)})`;
        c.lineWidth = 3;
        c.stroke();
      }
      const pk = ease.outCubic(prog(l2, 0.6, 1.8));
      c.save();
      c.globalAlpha *= pk;
      c.translate((1 - pk) * -120, 0);
      archPortrait(c, 'valette', 150, 120, 440, 600);
      c.restore();
      text(c, 'JEAN DE VALETTE', 370, 790, { size: 38, weight: 700, spacing: 8, alpha: pk, shadow: '#000' });
      text(c, 'GRAND MASTER OF THE ORDER', 370, 836, { size: 22, spacing: 8, color: C.goldLight, alpha: pk, shadow: '#000' });
      cap(c, l2, 2.2, 7.2, ['A Grand Master of seventy', 'sends for every man', 'who can hold a pike.'], { size: 56, x: 880, y: 330, align: 'center', lh: 70 });
      cap(c, l2, 7.8, 13.4, ['The bells of Malta begin to ring.'], { size: 56, x: 880, y: 330, align: 'center' });
    }
  },
});

/* ====================================================================
   5. THE PEOPLE   66.7 .. 85.8
   ==================================================================== */
const PEOPLE = [
  { id: 'pawlu', name: 'PAWLU', title: 'FARMER', line: ['A farmer', 'who remembers the galleys.'], bg: 'field' },
  { id: 'kateri', name: 'KATERI', title: 'MECHANIC', line: ['A clockmaker’s daughter', 'who keeps the machines alive.'], bg: 'forge' },
  { id: 'luis', name: 'FRA LUIS', title: 'KNIGHT OF ARAGON', line: ['A knight', 'with orders he cannot speak.'], bg: 'bastion' },
  { id: 'ninu', name: 'NINU', title: 'MILITIAMAN OF ŻEJTUN', line: ['A boy', 'who wants to prove himself.'], bg: 'hill' },
];
function bgField(c, t, lt) {
  gradSky(c, 0, H, [[0, '#2a1608'], [0.45, '#8a4a1a'], [1, '#1a0f06']]);
  sun(c, 1480, 520, 170, { glow: 0.8, clipY: 640 });
  for (let r = 0; r < 7; r++) {
    const y = 600 + r * 70;
    c.fillStyle = `rgba(${22 - r},${12 - r},6,${0.9})`;
    c.beginPath();
    c.moveTo(0, y);
    for (let x = 0; x <= W; x += 40) c.lineTo(x, y - 20 - Math.sin(x * 0.004 + r) * 18);
    c.lineTo(W, H);
    c.lineTo(0, H);
    c.closePath();
    c.fill();
    c.strokeStyle = `rgba(240,190,90,${0.25 - r * 0.02})`;
    c.lineWidth = 2;
    for (let x = 20 + (r % 2) * 14; x < W; x += 34) {
      const sway = Math.sin(t * 1.5 + x * 0.02 + r) * 5;
      c.beginPath();
      c.moveTo(x, y - 14);
      c.lineTo(x + sway, y - 54 - r * 3);
      c.stroke();
    }
  }
}
function bgForge(c, t, lt) {
  gradSky(c, 0, H, [[0, '#1a0c08'], [1, '#2a1208']]);
  const gl = c.createRadialGradient(1500, 700, 40, 1500, 700, 900);
  gl.addColorStop(0, 'rgba(255,140,50,0.45)');
  gl.addColorStop(1, 'rgba(255,100,30,0)');
  c.fillStyle = gl;
  c.fillRect(0, 0, W, H);
  [[1500, 420, 300, 26, 1], [1180, 700, 170, 15, -1], [1800, 740, 200, 18, -1], [1000, 300, 120, 12, 1]].forEach(([x, y, r, n, d], i) =>
    gear(c, x, y, r, n, d * t * 0.35 * (22 / n) + i, { stroke: 'rgba(216,179,106,0.35)', lw: 3, spokes: 6 }),
  );
  // sparks
  const rs = rng(31);
  for (let i = 0; i < 40; i++) {
    const life = 1.6 + rs();
    const k = ((t + rs() * life) % life) / life;
    const sx = 1450 + (rs() - 0.5) * 260 + k * 160 * (rs() - 0.3);
    const sy = 760 + k * 220 - Math.sin(k * 3.14) * 120;
    c.fillStyle = `rgba(255,${180 + rs() * 60},90,${1 - k})`;
    c.fillRect(sx, sy, 3, 3);
  }
  c.fillStyle = '#0c0605';
  c.fillRect(0, 880, W, 200);
}
function bgBastion(c, t, lt) {
  gradSky(c, 0, 760, [[0, '#0c1020'], [0.6, '#40384a'], [1, '#a05a3a']]);
  waterLines(c, 760, t, '220,170,150', 0.14, { n: 14 });
  c.fillStyle = '#0e0a0c';
  c.fillRect(0, 760, W, 320);
  fortress(c, 1500, 800, 1.5, '#0a0709', t, '#b8321f');
  c.fillStyle = '#0a0709';
  c.fillRect(0, 700, 700, 380);
  battlements(c, 0, 700, 700, 9, 26);
  rain(c, t, { n: 90, alpha: 0.22, seed: 41 });
}
function bgHill(c, t, lt) {
  gradSky(c, 0, 720, [[0, '#1d1230'], [0.5, '#8a3c4a'], [1, '#f0a060']]);
  sun(c, 1380, 640, 150, { glow: 1.0, clipY: 700 });
  c.fillStyle = '#2a1424';
  c.fillRect(0, 700, W, 380);
  waterLines(c, 700, t, '255,200,150', 0.2, { n: 14 });
  for (let i = 0; i < 6; i++) sailSmall(c, 1100 + i * 90, 704, 0.7 + (i % 2) * 0.2, '#150a12', 0.9);
  [['#1b0f1d', 760, 0.004], ['#120a16', 840, 0.003], ['#0a050d', 930, 0.005]].forEach(([col, y, f], i) => {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(0, y);
    for (let x = 0; x <= W; x += 30) c.lineTo(x, y - 60 - Math.sin(x * f + i * 2) * 60 - (x < 700 ? (700 - x) * 0.16 : 0));
    c.lineTo(W, H);
    c.lineTo(0, H);
    c.closePath();
    c.fill();
  });
}
SCENES.push({
  name: 'people',
  a: 66.7,
  b: 85.8,
  tin: { type: 'wipe', dur: 1.0, angle: 0.25 },
  draw(c, t, lt, d) {
    const per = d / PEOPLE.length;
    const idx = Math.min(PEOPLE.length - 1, Math.floor(lt / per));
    const l = lt - idx * per;
    const p = PEOPLE[idx];
    const BG = { field: bgField, forge: bgForge, bastion: bgBastion, hill: bgHill };
    BG[p.bg](c, t, l);
    // keep type legible
    const right = idx % 2 === 0;
    c.fillStyle = 'rgba(5,3,3,0.38)';
    c.fillRect(0, 0, W, H);
    const k = ease.outCubic(prog(l, 0.1, 0.9));
    const out = 1 - prog(l, per - 0.45, per - 0.05);
    c.save();
    c.globalAlpha *= k * out;
    c.translate((right ? 1 : -1) * (1 - k) * 100, 0);
    archPortrait(c, p.id, right ? 1180 : 200, 170, 520, 700);
    c.restore();
    const tx = right ? 150 : 820;
    c.save();
    c.globalAlpha *= out;
    textReveal(c, p.name, tx, 440, prog(l, 0.25, 1.2), { size: 110, weight: 900, spacing: 10, align: 'left', shadow: '#000' });
    text(c, p.title, tx, 500, { size: 30, spacing: 10, align: 'left', color: C.goldLight, alpha: prog(l, 0.7, 1.3), shadow: '#000', shadowBlur: 12 });
    p.line.forEach((ln, i) =>
      wordsReveal(c, ln, tx, 600 + i * 76, prog(l, 1.0 + i * 0.4, 2.3 + i * 0.4), { font: F.body, size: 58, weight: 'italic 500', align: 'left', shadow: '#000', shadowBlur: 16 }),
    );
    c.restore();
    PEOPLE.forEach((_, i) => {
      c.fillStyle = i === idx ? C.hot : 'rgba(216,179,106,0.4)';
      c.beginPath();
      c.arc(tx + 10 + i * 34, 960, 8, 0, 6.28);
      c.fill();
    });
    embers(c, lt, 30, 51, { speed: 20, alpha: 0.4 });
  },
});

/* ====================================================================
   6. THE SECRET   85.8 .. 96.7
   ==================================================================== */
SCENES.push({
  name: 'secret',
  a: 85.8,
  b: 96.7,
  tin: { type: 'fade', dur: 1.2 },
  draw(c, t, lt) {
    gradSky(c, 0, 700, [[0, '#070a14'], [1, '#1c2640']]);
    // distant harbour lights
    for (let i = 0; i < 14; i++) {
      const x = 80 + i * 130 + (i % 3) * 20;
      c.fillStyle = `rgba(255,190,110,${0.35 + 0.25 * Math.sin(lt * 2 + i)})`;
      c.fillRect(x, 640 - (i % 4) * 14, 5, 7);
    }
    // quay + dark water
    c.fillStyle = '#080a10';
    c.fillRect(0, 760, W, 320);
    c.fillStyle = '#10141c';
    c.fillRect(0, 700, W, 70);
    waterLines(c, 770, lt, '140,170,220', 0.16, { n: 14, seed: 2 });
    // a boat hull at the quay
    c.fillStyle = '#05060a';
    c.beginPath();
    c.moveTo(1450, 760);
    c.quadraticCurveTo(1700, 800, 1880, 740);
    c.lineTo(1860, 720);
    c.lineTo(1470, 724);
    c.closePath();
    c.fill();
    // two figures meeting
    const cx = 960;
    const ap = ease.outCubic(prog(lt, 1.2, 3.2));
    cloaked(c, lerp(520, 820, ap), 720, 2.0, '#05060a', { hood: true, arm: ap * 0.9, rim: 'rgba(255,200,130,0.8)' });
    cloaked(c, lerp(1500, 1110, ap), 720, 2.1, '#07080d', { hood: true, lean: -0.02, arm: -ap * 0.9, rim: 'rgba(255,200,130,0.8)' });
    // lantern
    lantern(c, 960, 520, lt, 1.4, { glow: 0.9 * ease.outCubic(prog(lt, 0.4, 1.6)) });
    // the bundle passes hands
    const bk = ease.inOutCubic(prog(lt, 3.6, 5.4));
    if (lt > 3.2) {
      c.fillStyle = '#d8cfb8';
      c.beginPath();
      c.ellipse(lerp(900, 1050, bk), 595 - Math.sin(bk * 3.14) * 24, 24, 15, 0, 0, 6.28);
      c.fill();
    }
    // the medallion snaps
    const sn = lt - 6.2;
    if (sn > 0) {
      const sk = ease.outCubic(clamp(sn / 1.6));
      const mx = 960;
      const my = 420;
      const gl = c.createRadialGradient(mx, my, 10, mx, my, 360);
      gl.addColorStop(0, `rgba(255,214,140,${0.55 * Math.exp(-sn * 0.8)})`);
      gl.addColorStop(1, 'rgba(255,214,140,0)');
      c.fillStyle = gl;
      c.fillRect(mx - 400, my - 400, 800, 800);
      medallionHalf(c, mx, my - sk * 10, 74, -1, 0.35 + sk * 1.5, lt);
      medallionHalf(c, mx, my - sk * 10, 74, 1, 0.35 + sk * 1.5, lt);
      flash(c, hit(t, 85.8 + 6.2, 14) * 0.22);
    }
    rain(c, lt, { n: 260, alpha: 0.4, angle: 0.18, len: 40 });
    text(c, '1542', 130, 190, { size: 120, weight: 700, spacing: 30, color: C.gold, align: 'left', alpha: ease.outCubic(prog(lt, 0.6, 2)) * (1 - prog(lt, 5.4, 6.4)), shadow: '#000' });
    capBack(c, ease.outCubic(prog(lt, 6.4, 7.4)), 300);
    cap(c, lt, 6.8, 10.6, ['Some secrets are older', 'than the siege.'], { size: 66 });
  },
});
