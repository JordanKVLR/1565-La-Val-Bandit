'use strict';
/* Scenes 1-5: opening, siege map, Armatura reveal, Ninu, title slam */

/* ---------- shared bits ---------- */
function ship(c, x, y, s, col, alpha) {
  c.save();
  c.globalAlpha *= alpha;
  c.translate(x, y);
  c.scale(s, s);
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(-34, 0);
  c.quadraticCurveTo(0, 16, 34, -2);
  c.lineTo(28, -6);
  c.lineTo(-30, -6);
  c.closePath();
  c.fill();
  c.fillRect(-1, -52, 2.5, 48);
  c.beginPath();
  c.moveTo(1, -50);
  c.lineTo(30, -8);
  c.lineTo(1, -8);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(-2, -42);
  c.lineTo(-22, -8);
  c.lineTo(-2, -8);
  c.closePath();
  c.fill();
  c.restore();
}

function skyGrad(c, hz, top, mid, low) {
  const g = c.createLinearGradient(0, 0, 0, hz);
  g.addColorStop(0, top);
  g.addColorStop(0.7, mid);
  g.addColorStop(1, low);
  c.fillStyle = g;
  c.fillRect(0, 0, W, hz);
}

/* ====================================================================
   1. THE SUN RISES OVER MALTA   0 .. bar 7
   ==================================================================== */
SCENES.push({
  name: 'intro',
  a: 0,
  b: bar(7),
  tin: { type: 'cut', dur: 0 },
  draw(c, t, lt) {
    const hz = 650;
    skyGrad(c, hz, '#040203', '#1a0809', '#4f1712');
    const sea = c.createLinearGradient(0, hz, 0, H);
    sea.addColorStop(0, '#2c0d0d');
    sea.addColorStop(1, '#040203');
    c.fillStyle = sea;
    c.fillRect(0, hz, W, H - hz);
    // stars
    const r = rng(11);
    for (let i = 0; i < 90; i++) {
      const x = r() * W;
      const y = r() * hz * 0.8;
      const a = (0.2 + 0.5 * r()) * (0.6 + 0.4 * Math.sin(lt * 1.5 + i)) * (1 - prog(lt, 4, 11) * 0.8);
      c.fillStyle = `rgba(255,230,200,${a})`;
      c.fillRect(x, y, 1.6, 1.6);
    }
    const k = ease.outCubic(prog(lt, 0.3, 11.8));
    const sy = lerp(hz + 230, hz - 140, k);
    sun(c, W / 2, sy, 175, { glow: 0.35 + 0.65 * k, clipY: hz });
    // reflection
    for (let i = 0; i < 46; i++) {
      const y = hz + 6 + Math.pow(i, 1.45) * 2.6;
      const w = 175 * (1.15 - i / 70) * (0.55 + 0.45 * Math.sin(lt * 1.4 + i * 1.3));
      const h = 2.5 + i * 0.22;
      c.fillStyle = `rgba(255,90,54,${0.5 * k * (1 - i / 50)})`;
      c.fillRect(W / 2 - w, y, w * 2, h);
    }
    c.fillStyle = 'rgba(255,150,100,0.35)';
    c.fillRect(0, hz, W, 1.5);
    // fleet
    const rs = rng(5);
    for (let i = 0; i < 16; i++) {
      const x0 = rs() * W;
      const dy = rs() * 70;
      const sc = 0.55 + (dy / 70) * 0.6;
      const x = ((x0 + lt * 7 * sc) % (W + 200)) - 100;
      const a = ease.outCubic(prog(lt, 4.3 + i * 0.12, 6.3 + i * 0.12));
      ship(c, x, hz + 5 + dy * 0.5 + Math.sin(lt * 1.2 + i) * 2, sc, '#050203', a);
    }
    embers(c, lt, 40, 3, { speed: 22, alpha: 0.5 });
    // text
    const fadeA = 1 - prog(lt, 6.1, 6.6);
    text(c, 'MAY 18, 1565', W / 2, 190, {
      size: 30, spacing: 14, color: C.gold, alpha: ease.outCubic(prog(lt, 1.2, 2.4)) * fadeA,
    });
    if (fadeA > 0)
      textReveal(c, 'MALTA', W / 2, 340, prog(lt, 2.6, 5.0), {
        size: 168, weight: 700, spacing: 46, color: C.parch, shadow: 'rgba(0,0,0,0.6)',
      });
    c.save();
    c.globalAlpha *= fadeA;
    c.restore();
    const s2 = prog(lt, 6.7, 8.4) * (1 - prog(lt, 9.4, 9.8));
    if (s2 > 0)
      wordsReveal(c, 'An Ottoman armada rises over the horizon.', W / 2, 250, prog(lt, 6.7, 8.6), {
        font: F.body, size: 72, color: C.parch, alpha: 1 - prog(lt, 9.4, 9.8), weight: 'italic 500', shadow: 'rgba(0,0,0,0.7)',
      });
    if (lt > 9.9) {
      textReveal(c, 'THE GREAT SIEGE BEGINS', W / 2, 250, prog(lt, 9.9, 11.6), {
        size: 70, weight: 700, spacing: 14, color: C.parch, shadow: 'rgba(0,0,0,0.7)',
      });
    }
    // fade in from black
    c.fillStyle = `rgba(0,0,0,${1 - prog(lt, 0, 1.6)})`;
    c.fillRect(0, 0, W, H);
  },
});

/* ====================================================================
   2. THE SIEGE MAP   bar 7 .. bar 12
   ==================================================================== */
const MAP_BOX = { x: 900, y: 80, w: 960, view: [250, 210, 500, 470] };
SCENES.push({
  name: 'map',
  a: bar(7),
  b: bar(12),
  tin: { type: 'circle', dur: 1.5, cx: W / 2, cy: 510 },
  draw(c, t, lt) {
    c.fillStyle = '#100b09';
    c.fillRect(0, 0, W, H);
    const hp = MAPS.place('harbour', MAP_BOX);
    const zk = ease.inOutCubic(prog(lt, 3.5, 5.6));
    const z = lerp(1, 6, zk);
    const T = { x: 1300, y: 540 };
    const tx = (T.x - hp[0] * z) * zk;
    const ty = (T.y - hp[1] * z) * zk;
    const toScr = (p) => [p[0] * z + tx, p[1] * z + ty];
    c.save();
    c.translate(tx, ty);
    c.scale(z, z);
    // sea contours
    for (let i = 0; i < 9; i++) {
      const s = 1.04 + i * 0.045 + Math.sin(lt * 0.8 + i) * 0.004;
      maltaPath(c, MAP_BOX, s);
      c.strokeStyle = `rgba(216,179,106,${0.16 * (1 - i / 10)})`;
      c.lineWidth = 1.4 / z;
      c.stroke();
    }
    // land (harbour detail patched in)
    c.save();
    c.globalAlpha *= ease.outCubic(prog(lt, 1.6, 3));
    drawMalta(c, MAP_BOX, { land: '#46342a', sea: '#100b09', coast: C.gold, coastW: 3.2, z });
    c.restore();
    c.save();
    maltaPath(c, MAP_BOX, 1);
    c.clip();
    for (let i = 1; i < 7; i++) {
      maltaPath(c, MAP_BOX, 1 - i * 0.075);
      c.strokeStyle = `rgba(216,179,106,${0.14 * ease.outCubic(prog(lt, 2 + i * 0.1, 3.4 + i * 0.1)) * (1 - zk)})`;
      c.lineWidth = 1.2 / z;
      c.stroke();
    }
    c.restore();
    if (lt < 3.2) {
      maltaPath(c, MAP_BOX, 1);
      c.strokeStyle = C.gold;
      c.lineWidth = 3.2 / z;
      c.setLineDash([4000, 4000]);
      c.lineDashOffset = 4000 * (1 - ease.inOutCubic(prog(lt, 0.4, 2.6)));
      c.stroke();
      c.setLineDash([]);
    }
    // Ottoman landing arrows
    const mx = MAPS.place('marsaxlokk', MAP_BOX);
    const la = ease.outCubic(prog(lt, 1.5, 3.0));
    if (la > 0) {
      for (let i = 0; i < 4; i++) {
        const sx = mx[0] + 300 - i * 25;
        const sy = mx[1] + 250 + i * 50;
        c.strokeStyle = C.red;
        c.lineWidth = 6 / z;
        c.setLineDash([22 / z, 14 / z]);
        c.lineDashOffset = -lt * 60 / z;
        c.beginPath();
        c.moveTo(lerp(sx, mx[0] + 12, 0), lerp(sy, mx[1] + 14 + i * 4, 0));
        c.quadraticCurveTo(lerp(sx, mx[0], 0.5), lerp(sy, mx[1], 0.45) + 30, lerp(sx, mx[0] + 12, la), lerp(sy, mx[1] + 14 + i * 4, la));
        c.stroke();
      }
      c.setLineDash([]);
    }
    // fort markers
    const kz = ease.outBack(prog(lt, 4.8, 5.8));
    ['stElmo', 'birgu', 'senglea'].forEach((p, i) => {
      const [px, py] = MAPS.hplace(p, MAP_BOX);
      c.save();
      c.translate(px, py);
      c.scale(kz / z * 1.2, kz / z * 1.2);
      c.rotate(Math.PI / 4);
      c.fillStyle = C.ink;
      c.fillRect(-9, -9, 18, 18);
      c.strokeStyle = C.gold;
      c.lineWidth = 2.5;
      c.strokeRect(-9, -9, 18, 18);
      c.restore();
    });
    // marsaxlokk pin
    c.beginPath();
    c.arc(mx[0], mx[1], 7 / z, 0, 6.28);
    c.fillStyle = C.hot;
    c.fill();
    c.restore();
    // labels (screen space)
    const lab = (p, str, dx, dy, a, al = 'left') => {
      const sp = toScr(p);
      if (a <= 0) return;
      c.save();
      c.strokeStyle = C.gold;
      c.globalAlpha = a;
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(sp[0], sp[1]);
      c.lineTo(sp[0] + dx, sp[1] + dy);
      c.stroke();
      c.restore();
      text(c, str, sp[0] + dx + (al === 'left' ? 10 : -10), sp[1] + dy + 8, {
        size: 28, spacing: 4, color: C.goldLight, align: al, alpha: a, shadow: '#000', shadowBlur: 10,
      });
    };
    lab(MAPS.place('marsaxlokk', MAP_BOX), 'MARSAXLOKK', -90, 70, ease.outCubic(prog(lt, 2.6, 3.4)) * (1 - zk), 'right');
    lab(MAPS.place('mdina', MAP_BOX), 'MDINA', -50, -60, ease.outCubic(prog(lt, 2.8, 3.6)) * (1 - zk), 'right');
    const la2 = ease.outCubic(prog(lt, 5.4, 6.2));
    lab(MAPS.hplace('stElmo', MAP_BOX), 'FORT ST ELMO', 90, -80, la2);
    lab(MAPS.hplace('birgu', MAP_BOX), 'BIRGU', 130, 30, la2);
    lab(MAPS.hplace('senglea', MAP_BOX), 'SENGLEA', -90, 110, la2, 'right');
    // left panel
    c.save();
    const pg = c.createLinearGradient(0, 0, 820, 0);
    pg.addColorStop(0, 'rgba(8,5,4,0.94)');
    pg.addColorStop(0.45, 'rgba(8,5,4,0.8)');
    pg.addColorStop(0.75, 'rgba(8,5,4,0.4)');
    pg.addColorStop(1, 'rgba(8,5,4,0)');
    c.fillStyle = pg;
    c.fillRect(0, 0, 840, H);
    c.restore();
    tag(c, '01 · THE SETTING', 120, 250, ease.outCubic(prog(lt, 0.9, 1.9)));
    const L = [
      ['The Ottoman fleet lands at Marsaxlokk.', 1.2, 3.5],
      ['Knights of St John and Maltese militia hold the Grand Harbour.', 3.7, 6.2],
      ['Heavily outnumbered. No way out.', 6.4, 9.4],
    ];
    L.forEach(([s, a, b]) => {
      const kk = prog(lt, a, a + 1.2);
      const out = 1 - prog(lt, b - 0.4, b);
      if (kk <= 0 || out <= 0) return;
      const lines = s.length > 24 ? (() => { const i = s.indexOf(' ', Math.floor(s.length / 2) - 4); return [s.slice(0, i), s.slice(i + 1)]; })() : [s];
      lines.forEach((ln, i) =>
        wordsReveal(c, ln, 120, 370 + i * 78, kk, { font: F.body, size: 66, weight: 'italic 500', align: 'left', alpha: out, color: C.parch }),
      );
    });
    c.save();
    c.restore();
    embers(c, lt, 25, 9, { speed: 14, alpha: 0.35 });
  },
});

/* ====================================================================
   3. ARMATURA REVEAL   bar 12 .. bar 16
   ==================================================================== */
function drawArmatura(c, x0, y0, S, lt) {
  // blueprint line-art of a clockwork war-harness. S = scale (1 = 560px tall)
  c.save();
  c.translate(x0, y0);
  c.scale(S, S);
  c.lineJoin = 'round';
  const line = C.goldLight;
  const fillC = 'rgba(31,90,74,0.55)';
  const st = (w = 3) => {
    c.strokeStyle = line;
    c.lineWidth = w;
    c.stroke();
  };
  const poly = (pts, fill = fillC) => {
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fillStyle = fill;
    c.fill();
    st();
  };
  // legs
  [-1, 1].forEach((s) => {
    poly([[s * 22, -300], [s * 82, -300], [s * 76, -170], [s * 30, -170]]);
    poly([[s * 30, -170], [s * 76, -170], [s * 70, -20], [s * 38, -20]]);
    poly([[s * 28, -20], [s * 84, -20], [s * 100, 0], [s * 20, 0]], 'rgba(216,179,106,0.35)');
    c.beginPath();
    c.arc(s * 53, -170, 20, 0, 6.28);
    c.fillStyle = C.ink;
    c.fill();
    st(2.5);
    // piston
    c.beginPath();
    c.moveTo(s * 94, -290);
    c.lineTo(s * 94, -180);
    st(5);
  });
  // hips
  poly([[-90, -330], [90, -330], [80, -290], [-80, -290]], 'rgba(216,179,106,0.3)');
  // torso
  poly([[-100, -470], [100, -470], [74, -330], [-74, -330]]);
  poly([[-70, -466], [70, -466], [52, -360], [-52, -360]], 'rgba(15,47,40,0.8)');
  // core dial with gear
  c.beginPath();
  c.arc(0, -415, 44, 0, 6.28);
  c.fillStyle = C.ink;
  c.fill();
  st(3);
  gear(c, 0, -415, 36, 10, lt * 0.8, { stroke: C.gold, lw: 2.5, hole: 0.3, spokes: 4 });
  // shoulders
  [-1, 1].forEach((s) => {
    c.beginPath();
    c.arc(s * 118, -462, 46, Math.PI, 0);
    c.lineTo(s * 72, -462);
    c.closePath();
    c.fillStyle = 'rgba(216,179,106,0.3)';
    c.fill();
    st();
    // arm
    poly([[s * 98, -440], [s * 140, -440], [s * 150, -330], [s * 108, -330]]);
    poly([[s * 108, -330], [s * 150, -330], [s * 156, -230], [s * 112, -230]]);
    c.beginPath();
    c.arc(s * 134, -230, 20, 0, 6.28);
    c.fillStyle = C.ink;
    c.fill();
    st();
  });
  // blade held in right hand
  c.beginPath();
  c.moveTo(150, -232);
  c.lineTo(190, -640);
  c.lineTo(202, -636);
  c.lineTo(166, -228);
  c.closePath();
  c.fillStyle = 'rgba(244,224,160,0.2)';
  c.fill();
  st(2.5);
  c.beginPath();
  c.moveTo(126, -240);
  c.lineTo(190, -246);
  st(5);
  // tower shield on left
  c.beginPath();
  c.moveTo(-190, -400);
  c.lineTo(-120, -420);
  c.lineTo(-120, -190);
  c.lineTo(-155, -140);
  c.lineTo(-190, -190);
  c.closePath();
  c.fillStyle = 'rgba(122,31,24,0.55)';
  c.fill();
  st(3);
  maltese(c, -155, -300, 26, C.parch);
  // head
  c.beginPath();
  c.arc(0, -505, 40, Math.PI, 0);
  c.lineTo(36, -480);
  c.lineTo(-36, -480);
  c.closePath();
  c.fillStyle = 'rgba(216,179,106,0.35)';
  c.fill();
  st();
  c.fillStyle = C.ink;
  c.fillRect(-26, -498, 52, 8);
  c.beginPath();
  c.moveTo(-6, -545);
  c.quadraticCurveTo(10, -585, 44, -560 + Math.sin(lt * 2) * 4);
  c.lineTo(6, -545);
  c.fillStyle = C.red;
  c.fill();
  // winding key on the back
  c.save();
  c.translate(-14, -435);
  c.rotate(lt * 0.9);
  c.strokeStyle = C.gold;
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, -62);
  c.stroke();
  c.beginPath();
  c.ellipse(-16, -70, 17, 11, 0, 0, 6.28);
  c.ellipse(16, -70, 17, 11, 0, 0, 6.28);
  c.stroke();
  c.restore();
  c.restore();
}

function humanFigure(c, x, y, S, col) {
  c.save();
  c.translate(x, y);
  c.scale(S, S);
  c.strokeStyle = col;
  c.fillStyle = col;
  c.lineWidth = 3 / S;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(0, -168, 12, 0, 6.28);
  c.stroke();
  c.beginPath();
  c.moveTo(0, -155);
  c.lineTo(0, -85);
  c.moveTo(-26, -138);
  c.lineTo(0, -148);
  c.lineTo(26, -138);
  c.moveTo(0, -85);
  c.lineTo(-18, 0);
  c.moveTo(0, -85);
  c.lineTo(18, 0);
  c.stroke();
  c.restore();
}

SCENES.push({
  name: 'armatura',
  a: bar(12),
  b: bar(16),
  tin: { type: 'slat', dur: 1.2, n: 10, dir: 1 },
  draw(c, t, lt) {
    // blueprint ground
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
    // big background gears
    const gp = beatPulse(t, 4) * 0.05;
    gear(c, 1620, 220, 260, 22, lt * 0.15, { stroke: 'rgba(216,179,106,0.22)', lw: 2, spokes: 6 });
    gear(c, 1330, 830, 170, 16, -lt * 0.21 + 0.2, { stroke: 'rgba(216,179,106,0.2)', lw: 2, spokes: 5 });
    gear(c, 1840, 760, 120, 12, lt * 0.28, { stroke: 'rgba(216,179,106,0.18)', lw: 2, spokes: 4 });
    // figure
    const x0 = 1230;
    const y0 = 930;
    const S = 1.18 + gp;
    const rk = ease.inOutCubic(prog(lt, 1.7, 4.6));
    c.save();
    c.beginPath();
    c.rect(0, y0 - 760 * S * rk - 30, W, 900);
    c.clip();
    drawArmatura(c, x0, y0, S, lt);
    c.restore();
    // scan line
    if (rk > 0 && rk < 1) {
      const sy = y0 - 760 * S * rk;
      const sg = c.createLinearGradient(0, sy - 30, 0, sy + 4);
      sg.addColorStop(0, 'rgba(244,224,160,0)');
      sg.addColorStop(1, 'rgba(244,224,160,0.8)');
      c.fillStyle = sg;
      c.fillRect(x0 - 340, sy - 30, 680, 34);
    }
    // floor line
    c.strokeStyle = C.gold;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x0 - 420, y0 + 2);
    c.lineTo(x0 + 420, y0 + 2);
    c.stroke();
    // scale: human + dimension
    const dk = ease.outCubic(prog(lt, 4.6, 5.8));
    if (dk > 0) {
      c.save();
      c.globalAlpha *= dk;
      humanFigure(c, x0 - 400, y0, 1.18 * 1.0, 'rgba(234,223,194,0.85)');
      const topY = y0 - 640 * S;
      c.strokeStyle = C.hot;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x0 - 285, y0);
      c.lineTo(x0 - 285, topY);
      c.moveTo(x0 - 300, y0);
      c.lineTo(x0 - 270, y0);
      c.moveTo(x0 - 300, topY);
      c.lineTo(x0 - 270, topY);
      c.stroke();
      text(c, '3–4 m', x0 - 285, topY - 18, { size: 34, color: C.hot, align: 'center', spacing: 4 });
      text(c, 'PILOT', x0 - 400, y0 + 44, { size: 20, spacing: 6, color: C.parch, alpha: 0.9 });
      c.restore();
    }
    // callouts on the machine
    callout(c, x0, y0 - 415 * S, x0 + 270, 400, 'SPRING-WOUND CORE', ease.outCubic(prog(lt, 5.2, 6.2)), { size: 26 });
    callout(c, x0 - 22, y0 - 500 * S, x0 + 250, 215, 'WINDING KEY', ease.outCubic(prog(lt, 5.8, 6.8)), { size: 26 });
    // text
    tag(c, '02 · THE TWIST', 120, 215, ease.outCubic(prog(lt, 0.9, 1.9)));
    wordsReveal(c, 'In this 1565,', 120, 330, prog(lt, 1.0, 2.2), { font: F.body, size: 66, weight: 'italic 500', align: 'left' });
    wordsReveal(c, 'war is fought by machines.', 120, 410, prog(lt, 1.5, 3.0), { font: F.body, size: 66, weight: 'italic 500', align: 'left' });
    textReveal(c, 'ARMATURA', 120, 600, prog(lt, 3.2, 4.8), { size: 112, weight: 900, spacing: 10, align: 'left', color: C.parch });
    wordsReveal(c, 'Clockwork war-harnesses, piloted from within.', 120, 680, prog(lt, 4.6, 6.0), { font: F.body, size: 42, align: 'left', weight: '500', color: C.goldLight });
    wordsReveal(c, 'Invented c. 1550. Sold to both sides.', 120, 740, prog(lt, 5.6, 7.0), { font: F.body, size: 42, align: 'left', weight: '500', color: C.goldLight });
    embers(c, lt, 30, 21, { speed: 18, color: '244,224,160', alpha: 0.4 });
  },
});

/* ====================================================================
   4. NINU & THE BROKEN MEDALLION   bar 16 .. bar 22 (build to the drop)
   ==================================================================== */
function medallionHalf(c, cx, cy, r, side, open, lt) {
  // side -1 = cross half (left), +1 = crescent half (right); open 0..1 gap
  c.save();
  c.translate(cx + side * open * 40, cy);
  c.beginPath();
  c.rect(side < 0 ? -r - 5 : 0, -r - 5, r + 5, r * 2 + 10);
  c.clip();
  c.beginPath();
  c.arc(0, 0, r, 0, 6.28);
  c.fillStyle = side < 0 ? '#5d1712' : '#0f4a45';
  c.fill();
  c.lineWidth = 8;
  c.strokeStyle = C.gold;
  c.stroke();
  c.beginPath();
  c.arc(0, 0, r * 0.82, 0, 6.28);
  c.lineWidth = 2;
  c.stroke();
  if (side < 0) maltese(c, 0, 0, r * 0.5, C.parch);
  else {
    // crescent
    c.beginPath();
    c.arc(0, 0, r * 0.5, 0, 6.28);
    c.fillStyle = C.goldLight;
    c.fill();
    c.beginPath();
    c.arc(r * 0.16, 0, r * 0.42, 0, 6.28);
    c.fillStyle = '#0f4a45';
    c.fill();
  }
  // crack edge
  c.restore();
}

SCENES.push({
  name: 'ninu',
  a: bar(16),
  b: 41.34,
  tin: { type: 'cross', dur: 1.3, flash: 0.5 },
  draw(c, t, lt) {
    c.fillStyle = '#0d0808';
    c.fillRect(0, 0, W, H);
    const bg = ST('battle-a1-piccolo-soccorso');
    const im = img(bg);
    if (im) {
      c.save();
      c.globalAlpha = 0.28;
      const z = 1.1 + lt * 0.01;
      c.drawImage(im, 0, 0, 1920, 1080, -W * (z - 1) / 2, -H * (z - 1) / 2, W * z, H * z);
      c.restore();
      c.fillStyle = 'rgba(10,6,6,0.55)';
      c.fillRect(0, 0, W, H);
    }
    const riser = bar(20) - bar(16); // 7.43s
    // portrait in arch
    const pk = ease.outCubic(prog(lt, 0.5, 1.7));
    const px = 120, py = 190, pw = 520, ph = 640;
    c.save();
    c.globalAlpha *= pk;
    c.translate(0, (1 - pk) * 40);
    c.beginPath();
    c.moveTo(px, py + ph);
    c.lineTo(px, py + pw / 2);
    c.arc(px + pw / 2, py + pw / 2, pw / 2, Math.PI, 0);
    c.lineTo(px + pw, py + ph);
    c.closePath();
    c.save();
    c.clip();
    c.fillStyle = '#e4dfd2';
    c.fillRect(px, py, pw, ph);
    const pi = img(PORT('ninu'));
    if (pi) c.drawImage(pi, px - 10, py + 60, pw + 20, pw + 20);
    const sh = c.createLinearGradient(0, py + ph - 200, 0, py + ph);
    sh.addColorStop(0, 'rgba(10,6,6,0)');
    sh.addColorStop(1, 'rgba(10,6,6,0.9)');
    c.fillStyle = sh;
    c.fillRect(px, py + ph - 200, pw, 200);
    c.restore();
    c.strokeStyle = C.gold;
    c.lineWidth = 4;
    c.stroke();
    c.restore();
    text(c, 'NINU', px + pw / 2, py + ph - 30, { size: 56, weight: 700, spacing: 18, alpha: pk });
    // text column
    tag(c, '03 · THE HERO', 760, 250, ease.outCubic(prog(lt, 0.9, 1.9)));
    wordsReveal(c, 'A farmer’s son from Żejtun.', 760, 360, prog(lt, 1.4, 3.0), { font: F.body, size: 74, weight: 'italic 500', align: 'left' });
    const o2 = 1;
    wordsReveal(c, 'Raised a peasant.', 760, 460, prog(lt, 3.0, 4.0), { font: F.body, size: 56, align: 'left', color: C.goldLight, alpha: o2 });
    wordsReveal(c, 'Born of two worlds.', 760, 530, prog(lt, 3.8, 4.9), { font: F.body, size: 56, align: 'left', color: C.goldLight, alpha: o2 });
    // medallion
    const mk = ease.outCubic(prog(lt, 4.5, 5.6));
    const join = ease.inOutCubic(prog(lt, 6.4, 7.4));
    if (mk > 0) {
      c.save();
      c.globalAlpha *= mk;
      const open = 1 - join;
      medallionHalf(c, 1370, 700, 170, -1, open, lt);
      medallionHalf(c, 1370, 700, 170, 1, open, lt);
      c.restore();
      if (join > 0.98) {
        const gl = c.createRadialGradient(1370, 700, 100, 1370, 700, 360);
        gl.addColorStop(0, `rgba(255,200,120,${0.4 * hit(t, bar(16) + 7.4, 3)})`);
        gl.addColorStop(1, 'rgba(255,200,120,0)');
        c.fillStyle = gl;
        c.fillRect(900, 300, 960, 800);
      }
      text(c, 'THE BROKEN MEDALLION', 1370, 960, { size: 24, spacing: 10, color: C.gold, alpha: mk * 0.9 });
    }
    // RISER: flash cuts on each beat for the last 4 bars of this scene (bars 20..22)
    const rl = lt - riser;
    if (rl > 0) {
      const names = [
        'battle-b1-marsaxlokk', 'battle-a3-castile-breach', 'ui-combat-forecast', 'battle-b7-st-elmo-ravelin',
        'battle-i2-mdina-walls', 'ui-cinematic-closeup-1', 'battle-c2-marsamxett-galleys', 'battle-a5-scala-engine',
        'battle-b9-fall-of-st-elmo', 'ui-defender-reaction-menu', 'battle-c4-corradino-heights', 'battle-i5-naxxar-ridge',
        'battle-b4-night-crossing', 'ui-camera-rotated-90', 'battle-b3-sciberras', 'battle-b5-tigne',
      ];
      // beats accelerate: first 6 shots on beats, then on half beats
      const beats = rl / BEAT;
      let idx;
      let local;
      if (beats < 4) {
        idx = Math.floor(beats);
        local = beats % 1;
      } else {
        const hb = (beats - 4) * 2;
        idx = 4 + Math.floor(hb);
        local = hb % 1;
      }
      const name = names[idx % names.length];
      c.save();
      const wk = Math.min(1, rl / 0.15);
      c.globalAlpha = wk;
      const sc = 1.0 + 0.12 * (1 - local);
      const im2 = img(ST(name));
      if (im2) {
        c.translate(W / 2, H / 2);
        c.scale(sc, sc);
        c.drawImage(im2, -W / 2, -H / 2, W, H);
      }
      c.restore();
      c.fillStyle = `rgba(0,0,0,${0.25 + 0.2 * local})`;
      c.fillRect(0, 0, W, H);
      flash(c, (1 - local) * 0.55 * Math.min(1, rl * 2));
      // vertical slit bars closing in toward the drop
      const closeK = prog(rl, 2.8, 3.7);
      c.fillStyle = '#000';
      c.fillRect(0, 0, W, H * 0.5 * closeK);
      c.fillRect(0, H - H * 0.5 * closeK, W, H * 0.5 * closeK);
      // counter ticks
      text(c, String(idx + 1).padStart(2, '0'), W - 120, H - 80, { size: 40, spacing: 6, color: C.gold, align: 'right', alpha: 0.8 });
    }
  },
});

/* ====================================================================
   5. TITLE SLAM   bar 22 .. bar 25
   ==================================================================== */
const DROP = 41.34; // measured chorus-1 downbeat (the drop lands a pickup after bar 22)
SCENES.push({
  name: 'title',
  a: DROP,
  b: bar(25),
  tin: { type: 'cut', dur: 0, flash: 1, flashK: 5, flashColor: '255,236,200' },
  draw(c, t, lt) {
    fillBg(c, '#1b0a0a', '#050203');
    const pulse = beatPulse(t, 6);
    const rk = ease.outExpo(prog(lt, 0, 1.6));
    sun(c, W / 2, 470, 360 * (0.55 + 0.45 * rk) + pulse * 10, { glow: 1.1, rays: 36, rot: lt * 0.06, bands: 7 });
    // shockwave rings
    for (let i = 0; i < 3; i++) {
      const k = prog(lt, i * 0.14, 1.4 + i * 0.14);
      if (k <= 0 || k >= 1) continue;
      c.beginPath();
      c.arc(W / 2, 470, 120 + ease.outExpo(k) * 1500, 0, 6.28);
      c.strokeStyle = `rgba(255,200,150,${0.6 * (1 - k)})`;
      c.lineWidth = 6 * (1 - k) + 1;
      c.stroke();
    }
    embers(c, lt, 90, 33, { speed: 60, alpha: 0.8 });
    // dark plate under title for legibility
    const tp = c.createRadialGradient(W / 2, 520, 100, W / 2, 520, 780);
    tp.addColorStop(0, 'rgba(5,2,3,0.55)');
    tp.addColorStop(1, 'rgba(5,2,3,0)');
    c.fillStyle = tp;
    c.fillRect(0, 0, W, H);
    // logo shield
    const sk = ease.outBack(prog(lt, 0.15, 0.9));
    c.save();
    c.translate(W / 2, 250);
    c.scale(sk, sk);
    maltese(c, 0, 0, 70, C.parch);
    c.restore();
    // title: slams in
    const tk = ease.outExpo(prog(lt, 0.05, 0.8));
    c.save();
    c.translate(W / 2, 520);
    const sc = 1 + (1 - tk) * 0.5;
    c.scale(sc, sc);
    c.globalAlpha *= clamp(tk * 2);
    text(c, 'ARMATURA', 0, 0, { size: 232, weight: 900, spacing: 20 * tk + 6, color: C.parch, shadow: 'rgba(0,0,0,0.8)', shadowBlur: 40 });
    c.restore();
    const yk = ease.outCubic(prog(lt, 0.7, 1.5));
    text(c, '1565', W / 2, 650, { size: 124, weight: 700, spacing: 48, color: C.gold, alpha: yk, shadow: 'rgba(0,0,0,0.8)' });
    // sub lines
    const s1 = ease.outCubic(prog(lt, 1.3, 2.1)) * (1 - prog(lt, 3.0, 3.4));
    text(c, 'THE GREAT SIEGE OF MALTA', W / 2, 760, { font: F.title, size: 40, spacing: 16, color: C.parch, alpha: s1 });
    const s2 = ease.outCubic(prog(lt, 3.5, 4.4));
    text(c, 'A STORY-DRIVEN TACTICAL RPG', W / 2, 760, { font: F.title, size: 40, spacing: 16, color: C.goldLight, alpha: s2 });
    wordsReveal(c, 'Turn-based battles. Branching story. Clockwork war-harnesses.', W / 2, 840, prog(lt, 4.2, 5.4), {
      font: F.body, size: 44, weight: 'italic 500', color: C.parch,
    });
    flash(c, hit(t, DROP, 7) * 0.5);
  },
});
