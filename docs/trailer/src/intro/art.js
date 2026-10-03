'use strict';
/* Procedural art kit for the opening cinematic: engraved-print silhouettes, fire, water, ships, forts. */

/* ---------- atmosphere ---------- */
function gradSky(c, y0, y1, stops) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([p, col]) => g.addColorStop(p, col));
  c.fillStyle = g;
  c.fillRect(0, y0, W, y1 - y0);
}

/* engraved water: horizontal wavy lines, denser toward the viewer */
function waterLines(c, hz, t, col = '255,150,110', alpha = 0.22, o = {}) {
  const { n = 46, amp = 3, speed = 0.8, seed = 1 } = o;
  c.save();
  c.lineWidth = 1.4;
  for (let i = 0; i < n; i++) {
    const k = i / n;
    const y = hz + 8 + Math.pow(k, 1.7) * (H - hz);
    const a = alpha * (0.35 + 0.65 * k);
    c.strokeStyle = `rgba(${col},${a})`;
    c.beginPath();
    const ph = i * 1.7 + seed;
    for (let x = -20; x <= W + 20; x += 24) {
      const yy = y + Math.sin(x * 0.012 * (1 + k) + t * speed * (0.6 + k) + ph) * amp * (0.4 + k * 1.6);
      if (x === -20) c.moveTo(x, yy);
      else c.lineTo(x, yy);
    }
    c.stroke();
  }
  c.restore();
}

/* diagonal hatching clipped to the current path (call after building a path) */
function hatchClip(c, bounds, angle = -0.6, gap = 7, col = 'rgba(0,0,0,0.35)', lw = 1.2) {
  c.save();
  c.clip();
  c.strokeStyle = col;
  c.lineWidth = lw;
  const [x, y, w, h] = bounds;
  const d = Math.hypot(w, h);
  c.translate(x + w / 2, y + h / 2);
  c.rotate(angle);
  c.beginPath();
  for (let i = -d; i < d; i += gap) {
    c.moveTo(i, -d);
    c.lineTo(i, d);
  }
  c.stroke();
  c.restore();
}

function smoke(c, x, y, t, o = {}) {
  const { n = 14, w = 60, h = 420, col = '30,22,22', alpha = 0.35, seed = 3, drift = 80 } = o;
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const life = 5 + r() * 3;
    const k = ((t + r() * life) % life) / life;
    const px = x + (r() - 0.5) * w + k * drift + Math.sin(t * 0.8 + i) * 12 * k;
    const py = y - k * h;
    const rad = 14 + k * 70 + r() * 20;
    c.fillStyle = `rgba(${col},${alpha * Math.sin(k * Math.PI)})`;
    c.beginPath();
    c.arc(px, py, rad, 0, 6.28);
    c.fill();
  }
}

/* flickering flame (layered teardrops) */
function flame(c, x, y, s, t, seed = 1, o = {}) {
  const { glow = 1 } = o;
  const f = 0.85 + 0.15 * Math.sin(t * 9 + seed * 3) + 0.08 * Math.sin(t * 23 + seed);
  const g = c.createRadialGradient(x, y - 30 * s, 4, x, y - 30 * s, 220 * s * f);
  g.addColorStop(0, `rgba(255,170,70,${0.55 * glow})`);
  g.addColorStop(1, 'rgba(255,90,40,0)');
  c.fillStyle = g;
  c.fillRect(x - 240 * s, y - 260 * s, 480 * s, 480 * s);
  const layers = [
    ['#d9361f', 1.0],
    ['#ff7a2a', 0.72],
    ['#ffd36b', 0.42],
  ];
  layers.forEach(([col, sc], i) => {
    const w = 26 * s * sc;
    const h = 78 * s * sc * f;
    const sway = Math.sin(t * 6 + seed + i) * 6 * s;
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x - w, y);
    c.quadraticCurveTo(x - w * 1.1, y - h * 0.55, x + sway, y - h);
    c.quadraticCurveTo(x + w * 1.1, y - h * 0.55, x + w, y);
    c.closePath();
    c.fill();
  });
}

function rain(c, t, o = {}) {
  const { n = 180, col = '200,210,230', alpha = 0.35, angle = 0.25, len = 34, seed = 5 } = o;
  const r = rng(seed);
  c.save();
  c.strokeStyle = `rgba(${col},${alpha})`;
  c.lineWidth = 1.2;
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const x0 = r() * (W + 400) - 200;
    const sp = 900 + r() * 700;
    const y = ((r() * H + t * sp) % (H + 80)) - 40;
    const x = x0 - (y / H) * H * angle;
    c.moveTo(x, y);
    c.lineTo(x - len * angle, y + len);
  }
  c.stroke();
  c.restore();
}

/* ---------- ships ---------- */
/* a galley with animated oars. dir 1 = sails to the right */
function galley(c, x, y, s, t, col = '#060304', o = {}) {
  const { dir = 1, oars = 9, sail = true, flag = null, bob = 1 } = o;
  c.save();
  c.translate(x, y + Math.sin(t * 1.3 + x * 0.01) * 3 * bob * s);
  c.scale(dir * s, s);
  c.rotate(Math.sin(t * 0.9 + x * 0.02) * 0.012 * bob);
  c.fillStyle = col;
  c.strokeStyle = col;
  // hull
  c.beginPath();
  c.moveTo(-120, -6);
  c.quadraticCurveTo(-60, 26, 120, 10);
  c.quadraticCurveTo(138, -4, 150, -30);
  c.lineTo(132, -14);
  c.lineTo(-108, -14);
  c.closePath();
  c.fill();
  // stern castle
  c.fillRect(-122, -34, 34, 22);
  c.fillRect(-118, -42, 6, 10);
  // oars
  c.lineWidth = 2.2;
  for (let i = 0; i < oars; i++) {
    const ox = -90 + (i * 180) / Math.max(1, oars - 1);
    const sw = Math.sin(t * 2.4 - i * 0.35) * 0.35;
    c.beginPath();
    c.moveTo(ox, -4);
    c.lineTo(ox - Math.sin(0.7 + sw) * 60, 34 + Math.cos(0.7 + sw) * 20);
    c.stroke();
  }
  if (sail) {
    c.fillRect(-2, -100, 3, 90);
    c.beginPath();
    c.moveTo(1, -98);
    c.quadraticCurveTo(62, -62, 96, -16);
    c.lineTo(1, -16);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(-2, -88);
    c.quadraticCurveTo(-44, -56, -78, -16);
    c.lineTo(-2, -16);
    c.closePath();
    c.fill();
  }
  if (flag) {
    c.fillStyle = flag;
    const wv = Math.sin(t * 5 + x) * 4;
    c.beginPath();
    c.moveTo(1, -104);
    c.lineTo(34, -98 + wv);
    c.lineTo(1, -90);
    c.closePath();
    c.fill();
  }
  c.restore();
}

/* a tiny distant sail (for fleets) */
function sailSmall(c, x, y, s, col = '#050203', a = 1) {
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  c.scale(s, s);
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(-14, 0);
  c.quadraticCurveTo(0, 6, 14, -1);
  c.lineTo(10, -3);
  c.lineTo(-11, -3);
  c.closePath();
  c.fill();
  c.fillRect(-0.7, -22, 1.5, 20);
  c.beginPath();
  c.moveTo(1, -22);
  c.lineTo(11, -4);
  c.lineTo(1, -4);
  c.closePath();
  c.fill();
  c.restore();
}

/* ---------- architecture ---------- */
function battlements(c, x, y, w, n, h) {
  const cw = w / (n * 2 - 1);
  for (let i = 0; i < n; i++) c.fillRect(x + i * cw * 2, y - h, cw, h + 1);
}
function tower(c, x, base, w, h, col, o = {}) {
  const { roof = false, flag = null, t = 0 } = o;
  c.fillStyle = col;
  c.fillRect(x, base - h, w, h);
  battlements(c, x - 4, base - h, w + 8, 4, 12);
  c.fillRect(x - 4, base - h, w + 8, 6);
  if (roof) {
    c.beginPath();
    c.moveTo(x - 6, base - h);
    c.lineTo(x + w / 2, base - h - w * 0.9);
    c.lineTo(x + w + 6, base - h);
    c.closePath();
    c.fill();
  }
  if (flag) {
    c.fillRect(x + w / 2 - 1, base - h - 60, 2.5, 54);
    c.fillStyle = flag;
    const wv = Math.sin(t * 4 + x) * 5;
    c.beginPath();
    c.moveTo(x + w / 2 + 1, base - h - 60);
    c.lineTo(x + w / 2 + 38, base - h - 52 + wv);
    c.lineTo(x + w / 2 + 1, base - h - 40);
    c.closePath();
    c.fill();
    c.fillStyle = col;
  }
}
/* a bastioned fortress silhouette, base at y. s scales */
function fortress(c, x, base, s, col, t = 0, flag = null) {
  c.save();
  c.translate(x, base);
  c.scale(s, s);
  c.fillStyle = col;
  // curtain wall
  c.fillRect(-340, -120, 680, 120);
  battlements(c, -340, -120, 680, 18, 16);
  // sloped talus
  c.beginPath();
  c.moveTo(-380, 0);
  c.lineTo(-340, -120);
  c.lineTo(340, -120);
  c.lineTo(380, 0);
  c.closePath();
  c.fill();
  tower(c, -330, 0, 90, 230, col, { t });
  tower(c, 240, 0, 90, 260, col, { t, flag });
  tower(c, -60, 0, 120, 300, col, { roof: true, t, flag });
  // arched gate
  c.globalCompositeOperation = 'destination-out';
  c.beginPath();
  c.moveTo(-34, 0);
  c.lineTo(-34, -52);
  c.arc(0, -52, 34, Math.PI, 0);
  c.lineTo(34, 0);
  c.closePath();
  c.fill();
  c.globalCompositeOperation = 'source-over';
  c.restore();
}

/* ---------- people (silhouettes, no faces) ---------- */
function cloaked(c, x, y, s, col = '#0a0607', o = {}) {
  const { hood = true, lean = 0, arm = 0, rim = null } = o;
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.rotate(lean);
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(-44, 0);
  c.quadraticCurveTo(-38, -70, -30, -112);
  c.quadraticCurveTo(-36, -134, -22, -146);
  c.lineTo(-10, -154);
  c.lineTo(10, -154);
  c.lineTo(22, -146);
  c.quadraticCurveTo(36, -134, 30, -112);
  c.quadraticCurveTo(38, -70, 44, 0);
  c.closePath();
  c.fill();
  c.beginPath();
  c.arc(0, -172, hood ? 20 : 16, 0, 6.28);
  c.fill();
  if (hood) {
    c.beginPath();
    c.moveTo(-24, -162);
    c.quadraticCurveTo(0, -214, 24, -162);
    c.lineTo(16, -148);
    c.lineTo(-16, -148);
    c.closePath();
    c.fill();
  }
  if (arm) {
    c.lineWidth = 13;
    c.strokeStyle = col;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(24, -128);
    c.lineTo(24 + 40 * arm, -96 - 12 * arm);
    c.stroke();
  }
  if (rim) {
    c.strokeStyle = rim;
    c.lineWidth = 3 / s;
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(-44, 0);
    c.quadraticCurveTo(-38, -70, -30, -112);
    c.quadraticCurveTo(-36, -134, -22, -146);
    c.lineTo(-10, -154);
    c.stroke();
    c.beginPath();
    c.arc(0, -172, hood ? 20 : 16, Math.PI * 0.9, Math.PI * 1.7);
    c.stroke();
  }
  c.restore();
}

function lantern(c, x, y, t, s = 1, o = {}) {
  const f = 0.88 + 0.12 * Math.sin(t * 11 + x) + 0.05 * Math.sin(t * 29);
  const g = c.createRadialGradient(x, y, 2, x, y, 280 * s * f);
  g.addColorStop(0, `rgba(255,200,110,${0.75 * (o.glow ?? 1)})`);
  g.addColorStop(0.3, `rgba(255,150,60,${0.25 * (o.glow ?? 1)})`);
  g.addColorStop(1, 'rgba(255,120,40,0)');
  c.fillStyle = g;
  c.fillRect(x - 300 * s, y - 300 * s, 600 * s, 600 * s);
  c.fillStyle = '#ffe3a0';
  c.beginPath();
  c.arc(x, y, 7 * s, 0, 6.28);
  c.fill();
  c.strokeStyle = '#1a1010';
  c.lineWidth = 3 * s;
  c.strokeRect(x - 10 * s, y - 14 * s, 20 * s, 28 * s);
}

/* beacon fire on a hill with expanding signal rings */
function beacon(c, x, y, k, t, o = {}) {
  if (k <= 0) return;
  const s = o.s ?? 1;
  const kk = ease.outCubic(k);
  // rings
  for (let i = 0; i < 2; i++) {
    const rk = prog(k, i * 0.12, 0.8 + i * 0.12);
    if (rk <= 0 || rk >= 1) continue;
    c.beginPath();
    c.arc(x, y - 30 * s, 20 + ease.outExpo(rk) * 260 * s, 0, 6.28);
    c.strokeStyle = `rgba(255,190,110,${0.7 * (1 - rk)})`;
    c.lineWidth = 3;
    c.stroke();
  }
  flame(c, x, y, s * (0.5 + 0.5 * kk), t, x * 0.01, { glow: kk });
  c.fillStyle = '#120a08';
  c.fillRect(x - 20 * s, y - 2, 40 * s, 10 * s);
}

/* bell, swinging */
function bell(c, x, y, s, swing, col = '#c9a45a') {
  c.save();
  c.translate(x, y);
  c.rotate(swing);
  c.scale(s, s);
  c.translate(0, 40);
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(-8, -40);
  c.quadraticCurveTo(-10, -20, -34, 18);
  c.lineTo(34, 18);
  c.quadraticCurveTo(10, -20, 8, -40);
  c.closePath();
  c.fill();
  c.fillStyle = col === '#c9a45a' ? '#3a2a14' : col;
  c.beginPath();
  c.arc(0, 24, 6, 0, 6.28);
  c.fill();
  c.fillRect(-2, -62, 4, 24);
  c.restore();
}

/* falcon in flight */
function falcon(c, x, y, s, t, col = '#0a0607', dir = 1) {
  c.save();
  c.translate(x, y);
  c.scale(dir * s, s);
  const f = Math.sin(t * 6);
  c.fillStyle = col;
  // body
  c.beginPath();
  c.moveTo(-26, 2);
  c.quadraticCurveTo(0, -8, 30, 0);
  c.quadraticCurveTo(0, 10, -26, 2);
  c.fill();
  // head + beak
  c.beginPath();
  c.moveTo(28, -1);
  c.lineTo(40, 3);
  c.lineTo(28, 5);
  c.fill();
  // wings
  [-1, 1].forEach((side) => {
    c.beginPath();
    c.moveTo(-4, 0);
    c.quadraticCurveTo(-10, -50 * f - 10, 18, -62 * f - 8 + (side > 0 ? 0 : 0));
    c.quadraticCurveTo(6, -24 * f, 12, 0);
    c.closePath();
    c.fill();
  });
  // tail
  c.beginPath();
  c.moveTo(-24, 1);
  c.lineTo(-50, -6);
  c.lineTo(-50, 10);
  c.closePath();
  c.fill();
  c.restore();
}

/* tent with pennant (Ottoman camp) */
function tent(c, x, base, s, col, flag, t) {
  c.save();
  c.translate(x, base);
  c.scale(s, s);
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(-70, 0);
  c.lineTo(-52, -70);
  c.quadraticCurveTo(0, -120, 52, -70);
  c.lineTo(70, 0);
  c.closePath();
  c.fill();
  c.fillRect(-1.5, -150, 3, 50);
  c.fillStyle = flag;
  const wv = Math.sin(t * 4 + x) * 4;
  c.beginPath();
  c.moveTo(1.5, -150);
  c.lineTo(34, -142 + wv);
  c.lineTo(1.5, -128);
  c.closePath();
  c.fill();
  c.restore();
}

function crescent(c, x, y, r, col) {
  c.fillStyle = col;
  c.beginPath();
  c.arc(x, y, r, 0, 6.28);
  c.fill();
  c.globalCompositeOperation = 'destination-out';
  c.beginPath();
  c.arc(x + r * 0.35, y, r * 0.82, 0, 6.28);
  c.fill();
  c.globalCompositeOperation = 'source-over';
}

/* small armatura silhouette (filled) for armies. facing right when dir = 1 */
function armSil(c, x, base, s, col, accent, dir = 1, t = 0) {
  c.save();
  c.translate(x, base);
  c.scale(dir * s, s);
  c.fillStyle = col;
  c.strokeStyle = accent;
  c.lineWidth = 3 / s;
  c.globalAlpha *= 1;
  // legs
  c.fillRect(-30, -150, 22, 150);
  c.fillRect(8, -150, 22, 150);
  c.fillRect(-36, -12, 34, 12);
  c.fillRect(6, -12, 34, 12);
  // hip + torso
  c.fillRect(-44, -190, 88, 50);
  c.beginPath();
  c.moveTo(-58, -290);
  c.lineTo(58, -290);
  c.lineTo(44, -190);
  c.lineTo(-44, -190);
  c.closePath();
  c.fill();
  // pauldrons
  c.beginPath();
  c.arc(-64, -278, 30, Math.PI, 0);
  c.arc(64, -278, 30, Math.PI, 0);
  c.fill();
  // arms
  c.fillRect(-84, -278, 24, 110);
  c.fillRect(60, -278, 24, 110);
  // head
  c.beginPath();
  c.arc(0, -314, 26, Math.PI, 0);
  c.lineTo(24, -296);
  c.lineTo(-24, -296);
  c.closePath();
  c.fill();
  // spear
  c.fillRect(92, -420, 4, 420);
  // rim light
  c.globalAlpha *= 0.4;
  c.strokeRect(-44, -190, 88, 50);
  c.beginPath();
  c.arc(0, -314, 26, Math.PI, 0);
  c.stroke();
  c.beginPath();
  c.arc(-64, -278, 30, Math.PI, 0);
  c.arc(64, -278, 30, Math.PI, 0);
  c.stroke();
  c.strokeRect(-30, -150, 22, 150);
  c.strokeRect(8, -150, 22, 150);
  c.globalAlpha /= 0.4;
  // glowing core + visor
  const g = 0.6 + 0.4 * Math.sin(t * 3 + x);
  c.fillStyle = accent;
  c.globalAlpha *= 0.4 + 0.6 * g;
  c.beginPath();
  c.arc(0, -240, 12, 0, 6.28);
  c.fill();
  c.fillRect(-14, -312, 28, 5);
  c.restore();
}

/* ---------- map helpers for the Mediterranean ---------- */
const MED = [
  [-5.35, 36.1], [-4.4, 36.7], [-2.2, 36.7], [-1.0, 37.6], [-0.5, 38.3], [0.2, 38.7], [-0.3, 39.5], [0.8, 40.7], [2.2, 41.4], [3.3, 42.3],
  [3.5, 43.3], [4.8, 43.4], [5.4, 43.2], [6.0, 43.1], [7.3, 43.7], [8.9, 44.4], [9.8, 44.1], [10.3, 43.5], [11.8, 42.1], [12.3, 41.7],
  [13.5, 41.2], [14.2, 40.8], [15.0, 40.6], [15.7, 39.9], [16.0, 39.0], [15.8, 38.2], [15.7, 37.9], [16.5, 38.4], [17.1, 39.0], [17.1, 39.4],
  [16.7, 39.7], [16.5, 40.4], [17.2, 40.4], [18.4, 40.1], [18.35, 39.8], [18.4, 40.3], [17.9, 40.6], [16.9, 41.1], [16.2, 41.9], [15.9, 41.9],
  [14.0, 42.5], [13.5, 43.6], [12.6, 44.1], [12.4, 44.9], [12.3, 45.4], [13.7, 45.6], [13.8, 44.9], [14.4, 45.3], [15.2, 44.1], [16.4, 43.5],
  [18.1, 42.6], [19.1, 42.1], [19.4, 41.3], [19.4, 40.4], [20.3, 39.6], [20.7, 38.9], [21.4, 38.2], [21.7, 37.8], [21.7, 36.8], [22.4, 36.4],
  [23.1, 36.5], [23.7, 37.9], [24.0, 38.2], [23.5, 38.9], [22.9, 40.5], [23.9, 40.0], [24.5, 40.9], [26.0, 40.8], [26.4, 40.2], [26.2, 39.3],
  [26.8, 38.4], [27.4, 37.0], [28.3, 36.7], [29.5, 36.3], [30.7, 36.9], [32.0, 36.5], [34.6, 36.7], [36.1, 36.6], [36.2, 35.8], [35.8, 34.8],
  [35.5, 33.9], [35.0, 32.8], [34.4, 31.5], [32.3, 31.3], [29.9, 31.2], [27.2, 31.3], [25.2, 31.6], [23.9, 32.1], [22.0, 32.9], [20.1, 32.1],
  [20.0, 31.0], [19.0, 30.3], [18.0, 30.5], [17.0, 31.0], [16.6, 31.2], [15.1, 32.4], [13.2, 32.9], [12.1, 33.1], [10.1, 33.9], [10.8, 34.7],
  [10.6, 35.8], [11.0, 37.0], [10.3, 36.9], [9.8, 37.3], [8.2, 36.9], [7.8, 36.9], [3.0, 36.8], [-0.6, 35.7], [-2.0, 35.2], [-5.3, 35.9],
];
const MED_ISLANDS = [
  [[12.4, 38.1], [13.4, 38.2], [15.65, 38.25], [15.2, 37.5], [15.3, 37.0], [15.1, 36.7], [14.4, 36.8], [13.3, 37.5], [12.5, 37.6]],
  [[8.2, 39.0], [8.4, 40.6], [9.6, 41.0], [9.7, 39.2], [8.7, 38.9]],
  [[8.6, 41.9], [9.4, 43.0], [9.5, 41.4]],
  [[23.5, 35.3], [24.8, 35.4], [26.3, 35.2], [25.0, 35.0], [23.6, 35.2]],
  [[32.3, 35.0], [33.6, 35.4], [34.6, 35.7], [34.0, 35.0], [33.0, 34.6]],
];
/* Black Sea / Marmara shore for Istanbul context */
const PLACES_MED = { istanbul: [28.97, 41.0], malta: [14.4, 35.9], rhodes: [28.2, 36.4] };
function medProject(lon, lat, box) {
  const lon0 = -6;
  const lon1 = 37;
  const lat0 = 46.2;
  const lat1 = 29.8;
  return [box.x + ((lon - lon0) / (lon1 - lon0)) * box.w, box.y + ((lat - lat0) / (lat1 - lat0)) * box.h];
}
function medIslands(c, box) {
  MED_ISLANDS.forEach((poly) => {
    c.beginPath();
    poly.forEach(([lo, la], i) => {
      const [x, y] = medProject(lo, la, box);
      if (i) c.lineTo(x, y);
      else c.moveTo(x, y);
    });
    c.closePath();
  });
}
function medPath(c, box) {
  c.beginPath();
  MED.forEach(([lo, la], i) => {
    const [x, y] = medProject(lo, la, box);
    if (i) c.lineTo(x, y);
    else c.moveTo(x, y);
  });
  c.closePath();
}

Object.assign(window, {
  gradSky, waterLines, hatchClip, smoke, flame, rain, galley, sailSmall, battlements, tower, fortress, cloaked, medIslands, MED_ISLANDS,
  lantern, beacon, bell, falcon, tent, crescent, armSil, MED, PLACES_MED, medProject, medPath,
});
