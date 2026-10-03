'use strict';
/* Opening cinematic, shots 7-12 */

/* ====================================================================
   7. TWO SHORES   96.7 .. 128.3
   ==================================================================== */
const T7 = 96.7;
function drawKnights(c, t, lt) {
  gradSky(c, 0, 720, [[0, '#080c18'], [0.6, '#233049'], [1, '#6a7a98']]);
  const mg = c.createRadialGradient(300, 170, 8, 300, 170, 200);
  mg.addColorStop(0, 'rgba(235,240,255,0.5)');
  mg.addColorStop(1, 'rgba(235,240,255,0)');
  c.fillStyle = mg;
  c.fillRect(100, 0, 400, 400);
  c.fillStyle = '#e8ecf6';
  c.beginPath();
  c.arc(300, 170, 34, 0, 6.28);
  c.fill();
  c.fillStyle = '#060912';
  c.fillRect(0, 720, W, 360);
  fortress(c, 560, 740, 1.5, '#050813', t, '#b8321f');
  for (let i = 0; i < 6; i++) {
    const k = ease.outCubic(prog(lt, 1.0 + i * BEAT * 2, 1.9 + i * BEAT * 2));
    if (k <= 0) continue;
    const row = i % 3;
    armSil(c, 150 + i * 170 + row * 50, 1010 + row * 30 - (1 - k) * 60, 0.62 + row * 0.12, '#04060d', '#f2c860', 1, t);
  }
}
function drawOttomans(c, t, lt) {
  gradSky(c, 0, 720, [[0, '#04100f'], [0.6, '#0e3a38'], [1, '#2f8480']]);
  crescent(c, 1620, 170, 38, '#f2e8c8');
  c.fillStyle = '#031210';
  c.fillRect(0, 720, W, 360);
  for (let i = 0; i < 7; i++) tent(c, 1060 + i * 130, 780 + (i % 2) * 30, 1.3, '#031412', i % 2 ? '#2fb0b8' : '#d9462f', t);
  for (let i = 0; i < 6; i++) {
    const k = ease.outCubic(prog(lt, 1.0 + i * BEAT * 2, 1.9 + i * BEAT * 2));
    if (k <= 0) continue;
    const row = i % 3;
    armSil(c, 1770 - i * 170 - row * 50, 1010 + row * 30 - (1 - k) * 60, 0.62 + row * 0.12, '#021110', '#7fe6ec', -1, t);
  }
}
SCENES.push({
  name: 'shores',
  a: T7,
  b: 128.29,
  tin: { type: 'cross', dur: 1.4, flash: 0.7, flashK: 6 },
  draw(c, t, lt, d) {
    if (lt < 15.2) {
      const z = 1 + lt * 0.004;
      c.save();
      c.translate(W / 2, H / 2);
      c.scale(z, z);
      c.translate(-W / 2, -H / 2);
      const split = W / 2;
      c.save();
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(split + 70, 0);
      c.lineTo(split - 70, H);
      c.lineTo(0, H);
      c.closePath();
      c.clip();
      drawKnights(c, t, lt);
      c.restore();
      c.save();
      c.beginPath();
      c.moveTo(split + 70, 0);
      c.lineTo(W, 0);
      c.lineTo(W, H);
      c.lineTo(split - 70, H);
      c.closePath();
      c.clip();
      drawOttomans(c, t, lt);
      c.restore();
      // seam
      c.strokeStyle = C.gold;
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(split + 70, 0);
      c.lineTo(split - 70, H);
      c.stroke();
      // cannon flashes alternate shores
      for (let n = 0; n < 8; n++) {
        const at = 3.2 + n * BEAT * 3;
        const h = hit(t, T7 + at, 7);
        if (h < 0.02 || lt < at) continue;
        const left = n % 2 === 0;
        const fx = left ? 1000 - (n % 3) * 120 : 1000 + (n % 3) * 120;
        const g = c.createRadialGradient(fx, 640, 6, fx, 640, 300);
        g.addColorStop(0, `rgba(255,210,130,${0.8 * h})`);
        g.addColorStop(1, 'rgba(255,120,50,0)');
        c.fillStyle = g;
        c.fillRect(fx - 320, 320, 640, 640);
      }
      c.restore();
      embers(c, lt, 36, 61, { speed: 40, alpha: 0.7 });
      text(c, 'MALTESE FORTS', 380, 120, { size: 26, spacing: 12, color: '#9fb6e8', alpha: ease.outCubic(prog(lt, 1, 2)) * 0.9 });
      text(c, 'OTTOMAN CAMP', 1540, 120, { size: 26, spacing: 12, color: '#82e2e8', alpha: ease.outCubic(prog(lt, 1, 2)) * 0.9 });
      capBack(c, ease.outCubic(prog(lt, 2, 3)), 300);
      cap(c, lt, 2.4, 7.6, ['Two armies.'], { size: 74 });
      cap(c, lt, 8.2, 14.8, ['Two sides of one harbour.'], { size: 70 });
    } else {
      const l2 = lt - 15.2;
      const hz = 640;
      gradSky(c, 0, hz, [[0, '#04050a'], [1, '#14182a']]);
      const rs = rng(77);
      for (let i = 0; i < 100; i++) {
        c.fillStyle = `rgba(255,240,220,${0.15 + rs() * 0.5})`;
        c.fillRect(rs() * W, rs() * 480, 1.6, 1.6);
      }
      // two shores with fires
      c.fillStyle = '#050609';
      c.beginPath();
      c.moveTo(0, hz);
      c.lineTo(0, hz - 120);
      c.lineTo(520, hz - 60);
      c.lineTo(640, hz);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(W, hz);
      c.lineTo(W, hz - 130);
      c.lineTo(1400, hz - 50);
      c.lineTo(1280, hz);
      c.closePath();
      c.fill();
      fortress(c, 250, hz - 40, 0.9, '#050609', t, '#b8321f');
      for (let i = 0; i < 4; i++) tent(c, 1560 + i * 90, hz - 30, 0.9, '#040608', '#2fb0b8', t);
      for (let i = 0; i < 12; i++) {
        const lx = (i < 6 ? 60 + i * 80 : 1420 + (i - 6) * 80);
        c.fillStyle = `rgba(255,170,80,${0.55 + 0.35 * Math.sin(t * 7 + i)})`;
        c.fillRect(lx, hz - 40 - (i % 3) * 20, 5, 7);
      }
      const sea = c.createLinearGradient(0, hz, 0, H);
      sea.addColorStop(0, '#0a0d18');
      sea.addColorStop(1, '#020204');
      c.fillStyle = sea;
      c.fillRect(0, hz, W, H - hz);
      waterLines(c, hz, t, '255,170,110', 0.14, { n: 30 });
      // distant cannon glints
      for (let n = 0; n < 6; n++) {
        const at = 1 + n * BEAT * 4;
        const h = hit(t, T7 + 15.2 + at, 8);
        if (h < 0.02) continue;
        const left = n % 2 === 0;
        const fx = left ? 300 + n * 40 : 1620 - n * 30;
        const g = c.createRadialGradient(fx, hz - 80, 4, fx, hz - 80, 240);
        g.addColorStop(0, `rgba(255,200,120,${0.6 * h})`);
        g.addColorStop(1, 'rgba(255,100,40,0)');
        c.fillStyle = g;
        c.fillRect(fx - 260, hz - 340, 520, 520);
      }
      // two halves drift toward each other over the water but never meet
      const dk = ease.inOutSine(prog(l2, 2.0, 11));
      const lx = lerp(520, 905, dk);
      const rx = lerp(1400, 1015, dk);
      const my = 430 + Math.sin(l2 * 0.9) * 10;
      const glow = 0.5 + 0.5 * beatPulse(t, 3);
      const mg = c.createRadialGradient(960, my, 20, 960, my, 460);
      mg.addColorStop(0, `rgba(255,214,140,${0.14 + 0.25 * dk * glow})`);
      mg.addColorStop(1, 'rgba(255,214,140,0)');
      c.fillStyle = mg;
      c.fillRect(300, 0, 1320, 900);
      medallionHalf(c, lx, my, 130, -1, 0, lt);
      medallionHalf(c, rx, my, 130, 1, 0, lt);
      // reflection streaks
      c.fillStyle = `rgba(255,200,120,${0.1 + 0.1 * dk})`;
      c.fillRect(lx - 70, hz + 20, 70, 340);
      c.fillRect(rx, hz + 20, 70, 340);
      capBack(c, ease.outCubic(prog(l2, 3.5, 4.5)), 340);
      cap(c, l2, 4.0, 11.8, ['And two halves of something', 'that was never meant to be broken.'], { size: 62 });
      c.fillStyle = `rgba(0,0,0,${prog(l2, 14, 16.4)})`;
      c.fillRect(0, 0, W, H);
    }
  },
});

/* ====================================================================
   8. THE NIGHT BEFORE   128.29 .. 146.58
   ==================================================================== */
function nightStars(c, t, n = 90, seed = 3, ymax = 520) {
  const rs = rng(seed);
  for (let i = 0; i < n; i++) {
    c.fillStyle = `rgba(255,240,220,${(0.15 + rs() * 0.55) * (0.7 + 0.3 * Math.sin(t * 1.4 + i))})`;
    c.fillRect(rs() * W, rs() * ymax, 1.6, 1.6);
  }
}
function vigChapel(c, t, l) {
  fillBg(c, '#0c0807', '#030202');
  // arched window with moon
  c.fillStyle = '#151a2e';
  c.beginPath();
  c.moveTo(780, 560);
  c.lineTo(780, 220);
  c.arc(960, 220, 180, Math.PI, 0);
  c.lineTo(1140, 560);
  c.closePath();
  c.fill();
  c.fillStyle = '#e8e2cc';
  c.beginPath();
  c.arc(1010, 250, 44, 0, 6.28);
  c.fill();
  c.strokeStyle = '#05030a';
  c.lineWidth = 8;
  c.beginPath();
  c.moveTo(960, 40);
  c.lineTo(960, 560);
  c.moveTo(780, 340);
  c.lineTo(1140, 340);
  c.stroke();
  c.fillStyle = '#090605';
  c.fillRect(0, 700, W, 380);
  // candles
  const rs = rng(9);
  for (let i = 0; i < 38; i++) {
    const cx = 180 + (i % 19) * 92 + (rs() - 0.5) * 20;
    const cy = 760 + Math.floor(i / 19) * 90;
    c.fillStyle = '#d8cfb8';
    c.fillRect(cx - 5, cy, 10, 40);
    flame(c, cx, cy, 0.22, t, i, { glow: 0.5 });
  }
  // kneeling figures
  for (let i = 0; i < 6; i++) cloaked(c, 320 + i * 250, 1010, 1.25 - (i % 2) * 0.1, '#030202', { hood: true, lean: 0.12, rim: 'rgba(255,190,110,0.7)' });
}
function vigNet(c, t, l) {
  gradSky(c, 0, 640, [[0, '#04060e'], [1, '#1a2540']]);
  nightStars(c, t, 120, 5, 520);
  const mg = c.createRadialGradient(1420, 190, 8, 1420, 190, 260);
  mg.addColorStop(0, 'rgba(240,244,255,0.6)');
  mg.addColorStop(1, 'rgba(240,244,255,0)');
  c.fillStyle = mg;
  c.fillRect(1100, 0, 640, 520);
  c.fillStyle = '#f2f0e0';
  c.beginPath();
  c.arc(1420, 190, 50, 0, 6.28);
  c.fill();
  c.fillStyle = '#060912';
  c.fillRect(0, 640, W, 440);
  waterLines(c, 640, t, '170,200,255', 0.2, { n: 20 });
  c.fillStyle = 'rgba(240,244,255,0.18)';
  c.fillRect(1380, 650, 80, 200);
  // boat + fisherman
  c.fillStyle = '#03040a';
  c.beginPath();
  c.moveTo(250, 760);
  c.quadraticCurveTo(560, 880, 980, 740);
  c.lineTo(940, 700);
  c.lineTo(290, 710);
  c.closePath();
  c.fill();
  cloaked(c, 700, 750, 1.5, '#03040a', { hood: false, arm: 1, rim: 'rgba(200,215,255,0.6)' });
  // net hanging in the foreground, swaying
  c.strokeStyle = 'rgba(200,190,160,0.5)';
  c.lineWidth = 1.5;
  for (let i = 0; i <= 22; i++) {
    c.beginPath();
    for (let j = 0; j <= 10; j++) {
      const x = 100 + i * 80 + Math.sin(t * 0.8 + j * 0.5) * 8;
      const y = 820 + j * 24 + Math.sin(i * 0.5) * 10;
      if (j === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  }
  for (let j = 0; j <= 10; j++) {
    c.beginPath();
    for (let i = 0; i <= 22; i++) {
      const x = 100 + i * 80 + Math.sin(t * 0.8 + j * 0.5) * 8;
      const y = 820 + j * 24 + Math.sin(i * 0.5) * 10;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  }
}
function vigHome(c, t, l) {
  fillBg(c, '#0d0907', '#040302');
  // stone wall hatch
  c.fillStyle = '#17110d';
  c.fillRect(0, 0, W, H);
  c.beginPath();
  c.rect(0, 0, W, H);
  hatchClip(c, [0, 0, W, H], -0.5, 12, 'rgba(0,0,0,0.35)');
  // window
  c.fillStyle = '#05080f';
  c.fillRect(1360, 160, 240, 340);
  nightStars(c, t, 14, 8, 500);
  c.fillStyle = '#05080f';
  // table + candle + family silhouettes
  const gl = c.createRadialGradient(760, 700, 10, 760, 700, 640);
  gl.addColorStop(0, 'rgba(255,170,80,0.55)');
  gl.addColorStop(1, 'rgba(255,100,30,0)');
  c.fillStyle = gl;
  c.fillRect(0, 0, W, H);
  c.fillStyle = '#080504';
  c.fillRect(300, 800, 940, 24);
  c.fillRect(340, 820, 24, 260);
  c.fillRect(1176, 820, 24, 260);
  cloaked(c, 480, 820, 1.4, '#050302', { rim: 'rgba(255,190,110,0.8)', hood: false });
  cloaked(c, 760, 830, 1.1, '#050302', { rim: 'rgba(255,190,110,0.8)', hood: false });
  cloaked(c, 1010, 820, 1.5, '#050302', { rim: 'rgba(255,190,110,0.8)', hood: true });
  c.fillStyle = '#d8cfb8';
  c.fillRect(740, 770, 12, 32);
  flame(c, 746, 770, 0.3, t, 3, { glow: 0.9 });
}
function vigChildren(c, t, l) {
  fillBg(c, '#06070d', '#020204');
  // moonlit window beam
  c.fillStyle = '#0b1020';
  c.fillRect(0, 0, W, H);
  c.save();
  c.beginPath();
  c.moveTo(1500, 120);
  c.lineTo(1700, 120);
  c.lineTo(900, 1080);
  c.lineTo(300, 1080);
  c.closePath();
  const bg = c.createLinearGradient(1500, 120, 600, 1000);
  bg.addColorStop(0, 'rgba(200,215,255,0.28)');
  bg.addColorStop(1, 'rgba(200,215,255,0.02)');
  c.fillStyle = bg;
  c.fill();
  c.restore();
  c.fillStyle = '#090c18';
  c.fillRect(1440, 100, 280, 300);
  nightStars(c, t, 20, 4, 380);
  // two sleeping children under blankets, breathing
  const br = Math.sin(t * 1.4) * 4;
  [[520, 1], [980, 0.9]].forEach(([x, s], i) => {
    c.fillStyle = i ? '#1c2540' : '#2a1d2e';
    c.beginPath();
    c.moveTo(x - 220 * s, 930);
    c.quadraticCurveTo(x - 160 * s, 780 - br * s, x, 770 - br * s);
    c.quadraticCurveTo(x + 180 * s, 780 - br * s, x + 260 * s, 930);
    c.closePath();
    c.fill();
    c.fillStyle = '#e0cdb8';
    c.beginPath();
    c.arc(x - 150 * s, 800 - br * s, 36 * s, 0, 6.28);
    c.fill();
  });
  c.fillStyle = '#05060c';
  c.fillRect(0, 930, W, 150);
}
const NIGHT = [vigChapel, vigNet, vigHome, vigChildren];
SCENES.push({
  name: 'night',
  a: 128.29,
  b: 146.58,
  tin: { type: 'fade', dur: 1.6 },
  draw(c, t, lt, d) {
    const per = 3.7;
    const idx = Math.min(3, Math.floor(lt / per));
    const l = lt - idx * per;
    const prev = idx > 0 ? NIGHT[idx - 1] : null;
    const z = 1 + l * 0.012;
    const drawV = (fn, ll, a) => {
      c.save();
      c.globalAlpha *= a;
      c.translate(W / 2, H / 2);
      c.scale(z, z);
      c.translate(-W / 2, -H / 2);
      fn(c, t, ll);
      c.restore();
    };
    if (prev && l < 0.6) drawV(prev, l + per, 1);
    drawV(NIGHT[idx], l, idx === 0 ? 1 : ease.outCubic(prog(l, 0, 0.6)));
    embers(c, lt, 30, 71, { speed: 20, alpha: 0.35 });
    // line of text under each vignette
    const lines = ['Fifteen hundred and sixty-five.', 'Candles in every chapel.', 'Nets mended for the last time.', 'Children asleep, and no one else.'];
    // darker final fade into the holding line
    const fk = prog(lt, 13.8, 15.4);
    c.fillStyle = `rgba(0,0,0,${0.85 * fk})`;
    c.fillRect(0, 0, W, H);
    textReveal(c, 'HOLD THE LINE', W / 2, H / 2 + 30, prog(lt, 14.2, 16.8), { size: 130, weight: 900, spacing: 22, shadow: '#000' });
  },
});

/* ====================================================================
   9. SAILS   146.58 .. 154.29
   ==================================================================== */
SCENES.push({
  name: 'sails',
  a: 146.58,
  b: 154.29,
  tin: { type: 'cut', dur: 0 },
  draw(c, t, lt, d) {
    const hz = 640;
    const dawn = ease.inOutSine(prog(lt, 0, 7.6));
    gradSky(c, 0, hz, [[0, `rgb(${6 + 20 * dawn},${4 + 10 * dawn},${10 + 16 * dawn})`], [0.7, `rgb(${22 + 90 * dawn},${10 + 30 * dawn},${18 + 24 * dawn})`], [1, `rgb(${40 + 190 * dawn},${18 + 80 * dawn},${22 + 40 * dawn})`]]);
    // thin dawn line
    const gl = c.createLinearGradient(0, hz - 90, 0, hz);
    gl.addColorStop(0, 'rgba(255,150,90,0)');
    gl.addColorStop(1, `rgba(255,170,100,${0.2 + 0.7 * dawn})`);
    c.fillStyle = gl;
    c.fillRect(0, hz - 90, W, 90);
    sun(c, W / 2, hz + 160 - dawn * 100, 140, { glow: 0.2 + dawn * 0.8, clipY: hz });
    const sea = c.createLinearGradient(0, hz, 0, H);
    sea.addColorStop(0, `rgb(${30 + 60 * dawn},${10 + 20 * dawn},${14 + 14 * dawn})`);
    sea.addColorStop(1, '#030203');
    c.fillStyle = sea;
    c.fillRect(0, hz, W, H - hz);
    waterLines(c, hz, t, '255,150,110', 0.18, { n: 26 });
    // the fleet appears sail by sail
    const total = 90;
    const n = Math.floor(1 + Math.pow(prog(lt, 0.5, 6.8), 2.2) * (total - 1));
    const rs = rng(99);
    for (let i = 0; i < total; i++) {
      const u = rs();
      const v = rs();
      if (i >= n) continue;
      const x = 80 + u * (W - 160);
      const y = hz + 4 + v * v * 70;
      const s = 0.6 + v * 1.1;
      const age = Math.min(1, (n - i) / 3);
      sailSmall(c, x + Math.sin(lt * 0.6 + i) * 3, y, s, '#05030a', age);
    }
    // heartbeat pulse on the beat as the drums build
    flash(c, beatPulse(t, 9) * 0.05 * prog(lt, 1, 7));
    text(c, '18 MAY 1565', W / 2, 330, { size: 120, weight: 700, spacing: 30, color: C.parch, alpha: ease.outCubic(prog(lt, 3.0, 4.6)) * (1 - prog(lt, 6.8, 7.6)), shadow: 'rgba(0,0,0,0.8)', shadowBlur: 30 });
  },
});

/* ====================================================================
   10. BEACONS   154.29 .. 193.28
   ==================================================================== */
const BMAP = { x: 760, y: 60, w: 1000, view: [250, 200, 500, 480] };
const BEACON_SITES = ['marsaxlokk', 'zejtun', 'birgu', 'naxxar', 'mdina', 'mellieha'];
function subBeaconMap(c, t, l) {
  fillBg(c, '#06080f', '#020204');
  nightStars(c, t, 90, 6, H);
  const rs = rng(5);
  // sea contours
  for (let i = 0; i < 8; i++) {
    maltaPath(c, BMAP, 1.04 + i * 0.05);
    c.strokeStyle = `rgba(160,190,255,${0.1 * (1 - i / 9)})`;
    c.lineWidth = 1.2;
    c.stroke();
  }
  drawMalta(c, BMAP, { land: '#10141f', sea: '#06080f', coast: 'rgba(216,179,106,0.75)', coastW: 2.5 });
  // chain of fire
  const pts = BEACON_SITES.map((p) => (p === 'birgu' ? MAPS.hplace('birgu', BMAP) : MAPS.place(p, BMAP)));
  for (let i = 0; i < pts.length; i++) {
    const k = prog(l, 0.4 + i * 0.85, 1.4 + i * 0.85);
    if (i > 0) {
      const lk = prog(l, 0.4 + (i - 1) * 0.85 + 0.2, 0.4 + i * 0.85);
      if (lk > 0) {
        c.strokeStyle = `rgba(255,170,80,${0.6})`;
        c.lineWidth = 3;
        c.setLineDash([10, 10]);
        c.lineDashOffset = -l * 40;
        c.beginPath();
        c.moveTo(pts[i - 1][0], pts[i - 1][1]);
        c.lineTo(lerp(pts[i - 1][0], pts[i][0], lk), lerp(pts[i - 1][1], pts[i][1], lk));
        c.stroke();
        c.setLineDash([]);
      }
    }
    beacon(c, pts[i][0], pts[i][1], k, t, { s: 0.8 });
  }
}
function subBells(c, t, l) {
  gradSky(c, 0, 700, [[0, '#101a38'], [0.6, '#6a4a5a'], [1, '#f0a070']]);
  sun(c, 560, 640, 110, { glow: 0.9, clipY: 700 });
  c.fillStyle = '#05060c';
  c.fillRect(0, 700, W, 380);
  for (let i = 0; i < 24; i++) {
    const bx = i * 84 + (i % 3) * 14;
    const bh = 60 + ((i * 47) % 100);
    c.fillRect(bx, 700 - bh, 70, bh + 2);
    if (i % 5 === 2) {
      c.beginPath();
      c.arc(bx + 35, 700 - bh, 28, Math.PI, 0);
      c.fill();
    }
  }
  tower(c, 1100, 820, 380, 760, '#05060c', { roof: false, t });
  // lit belfry opening with bells hanging from a beam
  const bg = c.createLinearGradient(0, 160, 0, 380);
  bg.addColorStop(0, '#ffb060');
  bg.addColorStop(1, '#c0602a');
  c.fillStyle = bg;
  c.beginPath();
  c.moveTo(1170, 400);
  c.lineTo(1170, 230);
  c.arc(1290, 230, 120, Math.PI, 0);
  c.lineTo(1410, 400);
  c.closePath();
  c.fill();
  c.fillStyle = '#05060c';
  c.fillRect(1160, 120, 260, 18);
  const sw = Math.sin(t * 5.2 + l) * 0.4;
  bell(c, 1230, 140, 1.5, sw, '#1a0c08');
  bell(c, 1350, 140, 1.5, -sw, '#1a0c08');
  // pulse rings on each strike
  const ph = ((t - OFFSET) / BEAT) % 2;
  for (let i = 0; i < 3; i++) {
    const k = (ph / 2 + i / 3) % 1;
    c.beginPath();
    c.arc(1290, 280, 40 + k * 700, 0, 6.28);
    c.strokeStyle = `rgba(255,220,160,${0.35 * (1 - k)})`;
    c.lineWidth = 3;
    c.stroke();
  }
}
function subMilitia(c, t, l) {
  gradSky(c, 0, 760, [[0, '#1a1030'], [0.5, '#a04a46'], [1, '#f6b070']]);
  sun(c, 1500, 640, 120, { glow: 1, clipY: 760 });
  [['#2a1626', 760, 0.003], ['#160b16', 860, 0.004]].forEach(([col, y, f], i) => {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(0, y);
    for (let x = 0; x <= W; x += 30) c.lineTo(x, y - 40 - Math.sin(x * f + i) * 40);
    c.lineTo(W, H);
    c.lineTo(0, H);
    c.closePath();
    c.fill();
  });
  // a stream of militia running left across the ridge
  for (let i = 0; i < 16; i++) {
    const u = (((l * 0.18 + i * 0.062) % 1) + 1) % 1;
    const x = W + 100 - u * (W + 260);
    const y = 880 + (i % 4) * 22 - Math.abs(Math.sin(l * 9 + i)) * 10;
    const s = 0.8 + (i % 4) * 0.12;
    cloaked(c, x, y, s * 0.9, '#07040a', { hood: false, lean: -0.15, arm: 0.8 });
    c.fillStyle = '#07040a';
    c.fillRect(x + 20 * s, y - 220 * s, 3, 170 * s);
  }
  smoke(c, W * 0.5, 960, t, { n: 16, w: 1800, h: 120, col: '60,40,40', alpha: 0.25, seed: 4, drift: 200 });
}
function subWake(c, t, l) {
  fillBg(c, '#0a0608', '#020102');
  const gl = c.createRadialGradient(W / 2, 760, 40, W / 2, 760, 1000);
  gl.addColorStop(0, 'rgba(255,120,60,0.35)');
  gl.addColorStop(1, 'rgba(255,60,30,0)');
  c.fillStyle = gl;
  c.fillRect(0, 0, W, H);
  c.fillStyle = '#050304';
  c.fillRect(0, 900, W, 180);
  for (let i = 0; i < 7; i++) {
    const at = 0.4 + i * BEAT;
    const k = ease.outCubic(prog(l, at, at + 0.5));
    const x = 160 + i * 270;
    const s = 0.72 + 0.1 * Math.sin(i);
    armSil(c, x, 1000 - (1 - k) * 40, s, '#050304', '#ffb050', i % 2 ? 1 : -1, t);
    if (k > 0.3) {
      // visor and core glow
      const g = c.createRadialGradient(x, 1000 - 240 * s, 4, x, 1000 - 240 * s, 200 * s);
      g.addColorStop(0, `rgba(255,180,80,${0.5 * k})`);
      g.addColorStop(1, 'rgba(255,120,40,0)');
      c.fillStyle = g;
      c.fillRect(x - 220, 1000 - 440 * s, 440, 440);
      gear(c, x, 1000 - 240 * s, 22 * s, 8, t * (i % 2 ? 2 : -2), { stroke: '#ffd890', lw: 2, spokes: 3 });
    }
  }
  embers(c, l, 50, 33, { speed: 50, alpha: 0.8 });
}
function subHillRun(c, t, l) {
  gradSky(c, 0, 760, [[0, '#120b25'], [0.5, '#7a3548'], [1, '#e89060']]);
  sun(c, 460, 700, 130, { glow: 1, clipY: 760 });
  waterLines(c, 760, t, '255,190,140', 0.18, { n: 12 });
  c.fillStyle = '#10080e';
  c.beginPath();
  c.moveTo(0, 1080);
  c.lineTo(0, 880);
  c.quadraticCurveTo(600, 820, 1000, 600);
  c.quadraticCurveTo(1400, 360, 1920, 440);
  c.lineTo(1920, 1080);
  c.closePath();
  c.fill();
  // a lone figure runs up the path toward the beacon on the summit
  const u = ease.inOutSine(prog(l, 0.3, 8.2));
  const px = lerp(180, 1500, u);
  const py = 878 - u * 450 + Math.sin(u * 3) * 0;
  // path approximated on the curve: sample the same quad curve
  const qx = (a, b, c2, tt) => (1 - tt) * (1 - tt) * a + 2 * (1 - tt) * tt * b + tt * tt * c2;
  const seg = u < 0.5 ? [0, 880, 600, 820, 1000, 600, u * 2] : [1000, 600, 1400, 360, 1920, 440, (u - 0.5) * 2];
  const rx = qx(seg[0], seg[2], seg[4], seg[6]);
  const ry = qx(seg[1], seg[3], seg[5], seg[6]);
  cloaked(c, rx, ry + 6, 0.8, '#050205', { hood: false, lean: -0.25, arm: 1 });
  beacon(c, 1720, 440, ease.outCubic(prog(l, 0.1, 1.5)), t, { s: 1.4 });
  smoke(c, 1720, 420, t, { n: 10, w: 40, h: 500, col: '40,26,26', alpha: 0.3, seed: 6, drift: 120 });
}
const BEAC = [
  [subBeaconMap, 0, 7.4],
  [subBells, 7.4, 14.9],
  [subMilitia, 14.9, 22.3],
  [subWake, 22.3, 29.7],
  [subHillRun, 29.7, 39.0],
];
SCENES.push({
  name: 'beacons',
  a: 154.29,
  b: 193.28,
  tin: { type: 'cut', dur: 0, flash: 1, flashK: 4 },
  draw(c, t, lt, d) {
    let cur = BEAC[0];
    for (const b of BEAC) if (lt >= b[1]) cur = b;
    const l = lt - cur[1];
    const prev = BEAC[BEAC.indexOf(cur) - 1];
    if (prev && l < 0.5) {
      prev[0](c, t, lt - prev[1]);
    }
    c.save();
    if (prev && l < 0.5) {
      // wipe the new shot in on the beat
      c.beginPath();
      c.rect(0, 0, W * ease.outExpo(l / 0.5), H);
      c.clip();
    }
    cur[0](c, t, l);
    c.restore();
    capBack(c, ease.outCubic(prog(lt, 3.6, 4.6)) * (1 - prog(lt, 9.4, 10)), 300);
    cap(c, lt, 4.0, 9.8, ['The island rings its bells.'], { size: 72 });
    capBack(c, ease.outCubic(prog(lt, 30.8, 31.8)), 300);
    cap(c, lt, 31.2, 38.4, ['Four months of siege begin.'], { size: 72 });
    flash(c, hit(t, 154.29 + cur[1], 8) * (cur[1] > 0 ? 0.35 : 0));
  },
});

/* ====================================================================
   11. THE HILLTOP   193.28 .. 213.71
   ==================================================================== */
SCENES.push({
  name: 'hilltop',
  a: 193.28,
  b: 213.71,
  tin: { type: 'fade', dur: 1.8 },
  draw(c, t, lt, d) {
    const push = 1 + lt * 0.006;
    c.save();
    c.translate(1080, 640);
    c.scale(push, push);
    c.translate(-1080, -640);
    const dawn = ease.inOutSine(prog(lt, 0, d));
    gradSky(c, -100, 760, [[0, '#1c1230'], [0.45, '#9a4a52'], [1, '#f8b878']]);
    sun(c, 1340, 700 - dawn * 70, 150, { glow: 0.8 + dawn * 0.4, clipY: 760 });
    // clouds
    for (let i = 0; i < 6; i++) {
      c.fillStyle = `rgba(255,190,150,${0.12 + 0.03 * i})`;
      const cx = ((i * 380 + lt * 6) % (W + 400)) - 200;
      c.beginPath();
      c.ellipse(cx, 200 + i * 55, 280, 20, 0, 0, 6.28);
      c.fill();
    }
    c.fillStyle = '#4a2630';
    c.fillRect(-100, 760, W + 200, 400);
    waterLines(c, 760, t, '255,210,160', 0.2, { n: 12 });
    // distant sails on the horizon
    for (let i = 0; i < 10; i++) sailSmall(c, 900 + i * 85, 764, 0.6 + (i % 3) * 0.15, '#1a0c14', ease.outCubic(prog(lt, 4 + i * 0.5, 6 + i * 0.5)));
    // hills
    [['#2a1426', 820, 0.0035, 0], ['#1b0d1a', 900, 0.004, 1.5]].forEach(([col, y, f, ph]) => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(-100, y);
      for (let x = -100; x <= W + 100; x += 30) c.lineTo(x, y - 40 - Math.sin(x * f + ph) * 50);
      c.lineTo(W + 100, 1200);
      c.lineTo(-100, 1200);
      c.closePath();
      c.fill();
    });
    // the Zejtun hilltop with two figures
    c.fillStyle = '#0d060e';
    c.beginPath();
    c.moveTo(-100, 1200);
    c.lineTo(-100, 900);
    c.quadraticCurveTo(500, 880, 800, 760);
    c.quadraticCurveTo(1000, 700, 1300, 800);
    c.quadraticCurveTo(1700, 900, 2100, 900);
    c.lineTo(2100, 1200);
    c.closePath();
    c.fill();
    // carob tree
    c.strokeStyle = '#0d060e';
    c.lineWidth = 14;
    c.beginPath();
    c.moveTo(1500, 860);
    c.quadraticCurveTo(1490, 740, 1530, 660);
    c.stroke();
    c.fillStyle = '#0d060e';
    c.beginPath();
    c.ellipse(1530, 640, 120, 62, 0, 0, 6.28);
    c.fill();
    // Ninu and Pawlu facing the sea
    cloaked(c, 1020, 770, 0.9, '#07030a', { hood: false });
    cloaked(c, 1110, 772, 1.0, '#07030a', { hood: true, lean: 0.03 });
    c.restore();
    embers(c, lt, 26, 17, { speed: 14, color: '255,210,160', alpha: 0.5 });
    text(c, 'ŻEJTUN  ·  18 MAY 1565', 110, H - 90, { size: 26, spacing: 14, color: C.goldLight, align: 'left', alpha: ease.outCubic(prog(lt, 4, 6)) * (1 - prog(lt, 17, 19)) });
  },
});

/* ====================================================================
   12. TITLE   213.71 .. 227.08
   ==================================================================== */
SCENES.push({
  name: 'title',
  a: 213.71,
  b: 227.08,
  tin: { type: 'cut', dur: 0, flash: 1, flashK: 4 },
  draw(c, t, lt, d) {
    fillBg(c, '#1b0a0a', '#050203');
    const pulse = beatPulse(t, 6);
    const rk = ease.outExpo(prog(lt, 0, 1.8));
    sun(c, W / 2, 470, 360 * (0.5 + 0.5 * rk) + pulse * 10, { glow: 1.15, rays: 36, rot: lt * 0.05, bands: 7 });
    for (let i = 0; i < 3; i++) {
      const k = prog(lt, i * 0.14, 1.4 + i * 0.14);
      if (k <= 0 || k >= 1) continue;
      c.beginPath();
      c.arc(W / 2, 470, 120 + ease.outExpo(k) * 1500, 0, 6.28);
      c.strokeStyle = `rgba(255,200,150,${0.6 * (1 - k)})`;
      c.lineWidth = 6 * (1 - k) + 1;
      c.stroke();
    }
    embers(c, lt, 80, 33, { speed: 55, alpha: 0.8 });
    const tp = c.createRadialGradient(W / 2, 520, 100, W / 2, 520, 820);
    tp.addColorStop(0, 'rgba(5,2,3,0.58)');
    tp.addColorStop(1, 'rgba(5,2,3,0)');
    c.fillStyle = tp;
    c.fillRect(0, 0, W, H);
    const mk = ease.outBack(prog(lt, 0.2, 1.0));
    c.save();
    c.translate(W / 2, 230);
    c.scale(mk, mk);
    maltese(c, 0, 0, 66, C.parch);
    c.restore();
    const tk = ease.outExpo(prog(lt, 0.1, 0.9));
    c.save();
    c.translate(W / 2, 500);
    const sc = 1 + (1 - tk) * 0.45;
    c.scale(sc, sc);
    c.globalAlpha *= clamp(tk * 2);
    text(c, 'ARMATURA', 0, 0, { size: 224, weight: 900, spacing: 18 * tk + 6, shadow: 'rgba(0,0,0,0.8)', shadowBlur: 40 });
    c.restore();
    text(c, '1565', W / 2, 620, { size: 118, weight: 700, spacing: 46, color: C.gold, alpha: ease.outCubic(prog(lt, 0.7, 1.5)), shadow: 'rgba(0,0,0,0.8)' });
    text(c, 'THE GREAT SIEGE OF MALTA', W / 2, 710, { size: 38, spacing: 16, color: C.parch, alpha: ease.outCubic(prog(lt, 1.4, 2.2)) });
    // the sun fills the screen, handing off to the game
    const out = ease.inQuad(prog(lt, 10.4, 12.8));
    if (out > 0) {
      c.fillStyle = `rgba(0,0,0,${out})`;
      c.fillRect(0, 0, W, H);
    }
    flash(c, hit(t, 213.71, 7) * 0.45);
  },
});
