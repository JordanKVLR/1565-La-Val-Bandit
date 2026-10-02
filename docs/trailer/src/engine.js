/* Armatura 1565 trailer engine: deterministic canvas renderer.
   Everything is a pure function of time t (seconds), so frames can be rendered in any order. */
'use strict';

const W = 1920;
const H = 1080;
const BPM = 129.25;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const OFFSET = 0.17; // first downbeat
const DURATION = 227.08;

const C = {
  ink: '#0b0809',
  ink2: '#17100f',
  wine: '#3a0f12',
  red: '#c9301f',
  hot: '#ff5a36',
  gold: '#d8b36a',
  goldLight: '#f4e0a0',
  parch: '#eadfc2',
  teal: '#1f5a4a',
  tealDark: '#0f2f28',
  blue: '#2f5fa8',
};

/* ---------- maths / easing ---------- */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const ease = {
  lin: (k) => k,
  inQuad: (k) => k * k,
  outQuad: (k) => 1 - (1 - k) * (1 - k),
  outCubic: (k) => 1 - Math.pow(1 - k, 3),
  inCubic: (k) => k * k * k,
  inOutCubic: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  inOutSine: (k) => -(Math.cos(Math.PI * k) - 1) / 2,
  outExpo: (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
  inExpo: (k) => (k <= 0 ? 0 : Math.pow(2, 10 * k - 10)),
  inOutExpo: (k) =>
    k <= 0 ? 0 : k >= 1 ? 1 : k < 0.5 ? Math.pow(2, 20 * k - 10) / 2 : (2 - Math.pow(2, -20 * k + 10)) / 2,
  outBack: (k) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
  },
  outElastic: (k) => {
    if (k <= 0) return 0;
    if (k >= 1) return 1;
    return Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },
};
const bar = (k) => OFFSET + k * BAR;
const beatPhase = (t) => (((t - OFFSET) / BEAT) % 1 + 1) % 1; // 0 at each beat
const beatPulse = (t, k = 5) => Math.exp(-beatPhase(t) * k);
const barPulse = (t, k = 3) => Math.exp(-((((t - OFFSET) / BAR) % 1 + 1) % 1) * BAR * k * 0.35);
/* a hit at time h decays after it */
const hit = (t, h, k = 6) => (t < h ? 0 : Math.exp(-(t - h) * k));

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- images ---------- */
const imgCache = new Map();
const pending = new Set();
function img(src) {
  let e = imgCache.get(src);
  if (!e) {
    const el = new Image();
    e = { el, ok: false, last: 0 };
    el.onload = () => {};
    const p = new Promise((res) => {
      el.onload = () => {
        e.ok = true;
        res();
      };
      el.onerror = () => {
        e.ok = false;
        e.err = true;
        res();
      };
    });
    e.p = p;
    el.src = src;
    imgCache.set(src, e);
  }
  e.last = performance.now();
  if (!e.ok && !e.err) pending.add(e.p);
  return e.ok ? e.el : null;
}
function trimCache(max = 400) {
  if (imgCache.size <= max) return;
  const arr = [...imgCache.entries()].sort((a, b) => a[1].last - b[1].last);
  for (let i = 0; i < arr.length - max; i++) imgCache.delete(arr[i][0]);
}

/* ---------- drawing helpers ---------- */
function setFont(ctx, font, size, spacing = 0) {
  ctx.font = `${size}px ${font}`;
  ctx.letterSpacing = `${spacing}px`;
}
const F = {
  title: "'Cinzel', 'Cinzel Ext', serif",
  body: "'Cormorant Garamond', 'Cormorant Ext', serif",
};

function measure(ctx, str, font, size, spacing = 0) {
  setFont(ctx, font, size, spacing);
  return ctx.measureText(str).width - spacing; // trailing spacing is not visible
}

/* Static text. align: left | center | right */
function text(ctx, str, x, y, o = {}) {
  const { font = F.title, size = 48, color = C.parch, align = 'center', spacing = 0, alpha = 1, weight = '' } = o;
  if (alpha <= 0.002) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.letterSpacing = `${spacing}px`;
  ctx.font = `${weight ? weight + ' ' : ''}${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  const w = ctx.measureText(str).width - spacing;
  let px = x;
  if (align === 'center') px = x - w / 2;
  else if (align === 'right') px = x - w;
  ctx.textAlign = 'left';
  if (o.shadow) {
    ctx.shadowColor = o.shadow;
    ctx.shadowBlur = o.shadowBlur ?? 24;
  }
  if (o.stroke) {
    ctx.strokeStyle = o.stroke;
    ctx.lineWidth = o.strokeW ?? 2;
    ctx.strokeText(str, px, y);
  }
  ctx.fillText(str, px, y);
  ctx.restore();
}

/* Per-letter staggered reveal. k: 0..1 progress of the whole reveal. */
function textReveal(ctx, str, x, y, k, o = {}) {
  const { font = F.title, size = 48, color = C.parch, align = 'center', spacing = 0, rise = 0.5, weight = '' } = o;
  if (k <= 0) return;
  ctx.save();
  ctx.font = `${weight ? weight + ' ' : ''}${size}px ${font}`;
  ctx.letterSpacing = `${spacing}px`;
  ctx.textAlign = 'left';
  ctx.fillStyle = color;
  const total = ctx.measureText(str).width - spacing;
  let sx = x;
  if (align === 'center') sx = x - total / 2;
  else if (align === 'right') sx = x - total;
  const n = str.length;
  const span = 0.55; // portion of timeline used for stagger
  for (let i = 0; i < n; i++) {
    const d = (i / Math.max(1, n - 1)) * span;
    const kk = ease.outCubic(clamp((k - d) / (1 - span)));
    if (kk <= 0) continue;
    const pre = ctx.measureText(str.slice(0, i)).width;
    ctx.globalAlpha = (o.alpha ?? 1) * kk;
    if (o.shadow) {
      ctx.shadowColor = o.shadow;
      ctx.shadowBlur = o.shadowBlur ?? 20;
    }
    ctx.fillText(str[i], sx + pre, y + (1 - kk) * size * rise);
  }
  ctx.restore();
}

/* Word-by-word reveal for sentences (soft rise + fade). */
function wordsReveal(ctx, str, x, y, k, o = {}) {
  const { font = F.body, size = 56, color = C.parch, align = 'center', spacing = 0, weight = '', stagger = 0.6 } = o;
  if (k <= 0) return;
  ctx.save();
  ctx.font = `${weight ? weight + ' ' : ''}${size}px ${font}`;
  ctx.letterSpacing = `${spacing}px`;
  ctx.textAlign = 'left';
  ctx.fillStyle = color;
  const words = str.split(' ');
  const total = ctx.measureText(str).width;
  let px = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const space = ctx.measureText(' ').width;
  words.forEach((w, i) => {
    const d = (i / Math.max(1, words.length)) * stagger;
    const kk = ease.outCubic(clamp((k - d) / (1 - stagger)));
    const ww = ctx.measureText(w).width;
    ctx.globalAlpha = (o.alpha ?? 1) * kk;
    if (o.shadow) {
      ctx.shadowColor = o.shadow;
      ctx.shadowBlur = o.shadowBlur ?? 18;
    }
    ctx.fillText(w, px, y + (1 - kk) * size * 0.35);
    px += ww + space;
  });
  ctx.restore();
}

function rrect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function maltesePath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let a = 0; a < 4; a++) {
    const ca = Math.cos((a * Math.PI) / 2);
    const sa = Math.sin((a * Math.PI) / 2);
    const pts = [
      [-0.11, -0.11],
      [-0.3, -0.52],
      [0, -0.4],
      [0.3, -0.52],
      [0.11, -0.11],
    ];
    pts.forEach(([px, py], i) => {
      const x = cx + (px * ca - py * sa) * r * 2;
      const y = cy + (px * sa + py * ca) * r * 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  }
}
function maltese(ctx, cx, cy, r, fill = C.parch, stroke = null) {
  maltesePath(ctx, cx, cy, r);
  ctx.fillStyle = fill;
  ctx.fill('nonzero');
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function gear(ctx, cx, cy, r, teeth, ang, o = {}) {
  const { inner = 0.78, hole = 0.35, fill = null, stroke = C.gold, lw = 2, spokes = 0 } = o;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);
  ctx.beginPath();
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts = [
      [a - step * 0.28, r * inner],
      [a - step * 0.16, r],
      [a + step * 0.16, r],
      [a + step * 0.28, r * inner],
    ];
    pts.forEach(([pa, pr], j) => {
      const x = Math.cos(pa) * pr;
      const y = Math.sin(pa) * pr;
      if (i === 0 && j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
  }
  ctx.closePath();
  ctx.moveTo(r * hole, 0);
  ctx.arc(0, 0, r * hole, 0, Math.PI * 2, true);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill('evenodd');
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * hole, Math.sin(a) * r * hole);
    ctx.lineTo(Math.cos(a) * r * inner * 0.92, Math.sin(a) * r * inner * 0.92);
    ctx.stroke();
  }
  ctx.restore();
}

let _sunOff = null;
function sunOff(n) {
  if (!_sunOff || _sunOff.width < n) {
    _sunOff = document.createElement('canvas');
    _sunOff.width = _sunOff.height = n;
  }
  return _sunOff;
}
/* rising sun with banded cut-outs. */
function sun(ctx, cx, cy, r, o = {}) {
  const { glow = 1, bands = 0, rays = 0, rot = 0, color = C.red, hot = C.hot, clipY = null } = o;
  ctx.save();
  if (clipY !== null) {
    ctx.beginPath();
    ctx.rect(0, 0, W, clipY);
    ctx.clip();
  }
  // halo
  const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 3.2);
  g.addColorStop(0, `rgba(255,90,54,${0.5 * glow})`);
  g.addColorStop(0.35, `rgba(201,48,31,${0.22 * glow})`);
  g.addColorStop(1, 'rgba(201,48,31,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - r * 3.2, cy - r * 3.2, r * 6.4, r * 6.4);
  if (rays) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2;
      const long = i % 2 === 0;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - 0.02) * r * 1.08, Math.sin(a - 0.02) * r * 1.08);
      ctx.lineTo(Math.cos(a) * r * (long ? 1.9 : 1.5), Math.sin(a) * r * (long ? 1.9 : 1.5));
      ctx.lineTo(Math.cos(a + 0.02) * r * 1.08, Math.sin(a + 0.02) * r * 1.08);
      ctx.closePath();
      ctx.fillStyle = `rgba(244,200,140,${0.22 * glow})`;
      ctx.fill();
    }
    ctx.restore();
  }
  const d = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  d.addColorStop(0, hot);
  d.addColorStop(0.6, color);
  d.addColorStop(1, '#7a1a14');
  if (!bands) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = d;
    ctx.fill();
  } else {
    const oc = sunOff(Math.ceil(r * 2) + 4);
    const o = oc.getContext('2d');
    o.setTransform(1, 0, 0, 1, 0, 0);
    o.clearRect(0, 0, oc.width, oc.height);
    o.translate(r + 2 - cx, r + 2 - cy);
    const dd = o.createLinearGradient(0, cy - r, 0, cy + r);
    dd.addColorStop(0, hot);
    dd.addColorStop(0.6, color);
    dd.addColorStop(1, '#7a1a14');
    o.beginPath();
    o.arc(cx, cy, r, 0, Math.PI * 2);
    o.fillStyle = dd;
    o.fill();
    o.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < bands; i++) {
      const k = (i + 1) / (bands + 1);
      const y = cy + r * (0.1 + 0.9 * k);
      const hgt = r * 0.03 + r * 0.1 * k;
      o.fillRect(cx - r, y, r * 2, hgt);
    }
    ctx.drawImage(oc, cx - r - 2, cy - r - 2);
  }
  ctx.restore();
}

function vignette(ctx, strength = 0.55) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function fillBg(ctx, top = '#120c0c', bottom = '#050304') {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/* drifting embers, deterministic */
function embers(ctx, t, n = 70, seed = 7, o = {}) {
  const { speed = 40, color = '255,150,80', size = 2.2, alpha = 0.7 } = o;
  const r = rng(seed);
  ctx.save();
  for (let i = 0; i < n; i++) {
    const x0 = r() * W;
    const y0 = r() * H;
    const sp = (0.4 + r() * 1.2) * speed;
    const ph = r() * 6.28;
    const life = 6 + r() * 6;
    const k = ((t + r() * life) % life) / life;
    const x = x0 + Math.sin(t * 0.7 + ph) * 30 + k * 40;
    const y = y0 - ((t * sp) % (H + 80)) + 40;
    const yy = ((y % (H + 80)) + (H + 80)) % (H + 80) - 40;
    const a = Math.sin(k * Math.PI) * alpha * (0.5 + 0.5 * Math.sin(t * 3 + ph));
    ctx.fillStyle = `rgba(${color},${a})`;
    ctx.beginPath();
    ctx.arc(x, yy, size * (0.5 + r()), 0, 6.28);
    ctx.fill();
  }
  ctx.restore();
}

/* Gold double-rule frame with corner crosses */
function frame(ctx, alpha = 1, inset = 34) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha * 0.55;
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
  ctx.lineWidth = 0.8;
  ctx.strokeRect(inset + 9, inset + 9, W - (inset + 9) * 2, H - (inset + 9) * 2);
  ctx.globalAlpha *= 1.5;
  [
    [inset, inset],
    [W - inset, inset],
    [inset, H - inset],
    [W - inset, H - inset],
  ].forEach(([x, y]) => {
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.arc(x, y, 17, 0, 6.28);
    ctx.fill();
    maltese(ctx, x, y, 11, C.gold);
  });
  ctx.restore();
}

/* A screenshot in a brass frame with ken-burns. dest rect in canvas px.
   view: [fx, fy, zoom] focus in source px (1920x1080) and zoom (>=1). */
function shot(ctx, src, x, y, w, h, view = [960, 540, 1], o = {}) {
  const im = typeof src === 'string' ? img(src) : src;
  const { radius = 10, border = true, shadow = true, alpha = 1, sw = 1920, sh = 1080 } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (shadow) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 18;
    ctx.fillStyle = '#000';
    rrect(ctx, x, y, w, h, radius);
    ctx.fill();
    ctx.restore();
  }
  ctx.save();
  rrect(ctx, x, y, w, h, radius);
  ctx.clip();
  if (im) {
    const [fx, fy, z] = view;
    const vw = sw / z;
    const vh = vw * (h / w);
    let sx = clamp(fx - vw / 2, 0, sw - vw);
    let sy = clamp(fy - vh / 2, 0, sh - vh);
    ctx.drawImage(im, sx, sy, vw, vh, x, y, w, h);
  } else {
    ctx.fillStyle = '#1b1210';
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
  if (border) {
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 3;
    rrect(ctx, x, y, w, h, radius);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(244,224,160,0.35)';
    ctx.lineWidth = 1;
    rrect(ctx, x - 7, y - 7, w + 14, h + 14, radius + 5);
    ctx.stroke();
  }
  ctx.restore();
}

/* callout: dot on target, line, label. targets in canvas px. */
function callout(ctx, tx, ty, lx, ly, label, k, o = {}) {
  if (k <= 0) return;
  const { sub = '', align = 'left', color = C.goldLight, size = 34 } = o;
  const kk = ease.outCubic(k);
  const base = ctx.globalAlpha;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 10;
  // pulse ring
  ctx.beginPath();
  ctx.arc(tx, ty, 9, 0, 6.28);
  ctx.fill();
  ctx.globalAlpha = base * 0.5 * (1 - ((k * 3) % 1));
  ctx.beginPath();
  ctx.arc(tx, ty, 9 + ((k * 3) % 1) * 26, 0, 6.28);
  ctx.stroke();
  ctx.globalAlpha = base;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(lerp(tx, lx, kk), lerp(ty, ly, kk));
  ctx.stroke();
  ctx.restore();
  if (kk > 0.6) {
    const a = (kk - 0.6) / 0.4;
    text(ctx, label, lx + (align === 'left' ? 14 : -14), ly + 8, {
      size,
      align: align === 'left' ? 'left' : 'right',
      color,
      spacing: 3,
      alpha: a,
      shadow: 'rgba(0,0,0,0.9)',
      shadowBlur: 12,
    });
    if (sub)
      text(ctx, sub, lx + (align === 'left' ? 14 : -14), ly + 8 + size * 0.95, {
        font: F.body,
        size: size * 0.82,
        align: align === 'left' ? 'left' : 'right',
        color: C.parch,
        alpha: a * 0.9,
        shadow: 'rgba(0,0,0,0.9)',
        shadowBlur: 12,
      });
  }
}

/* section tag, e.g. "01 · THE SETTING" with growing rule */
function tag(ctx, label, x, y, k, o = {}) {
  if (k <= 0) return;
  const { color = C.gold, align = 'left' } = o;
  const w = 90 * ease.outCubic(k);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (align === 'left') {
    ctx.moveTo(x, y - 9);
    ctx.lineTo(x + w, y - 9);
  } else {
    ctx.moveTo(x, y - 9);
    ctx.lineTo(x - w, y - 9);
  }
  ctx.stroke();
  ctx.restore();
  text(ctx, label, align === 'left' ? x + 110 : x - 110, y, {
    size: 24,
    spacing: 8,
    color,
    align,
    alpha: ease.outCubic(clamp((k - 0.2) / 0.8)),
  });
}

/* ink-wash flash (white-hot) for hits */
function flash(ctx, a, color = '255,236,200') {
  if (a <= 0.01) return;
  ctx.fillStyle = `rgba(${color},${clamp(a)})`;
  ctx.fillRect(0, 0, W, H);
}

/* Maltese-cross iris wipe: reveal `draw` through an expanding cross (k 0..1) */
function crossClip(ctx, k, cx = W / 2, cy = H / 2) {
  const r = lerp(10, 2300, ease.inOutCubic(k));
  maltesePath(ctx, cx, cy, r);
  ctx.clip('nonzero');
}
function circleClip(ctx, k, cx = W / 2, cy = H / 2) {
  ctx.beginPath();
  ctx.arc(cx, cy, lerp(0, 2300, ease.inOutCubic(k)), 0, 6.28);
  ctx.clip();
}
function slatClip(ctx, k, n = 8, dir = 1) {
  const sw = W / n;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const kk = ease.outCubic(clamp(k * 1.5 - (i / n) * 0.5));
    const x = i * sw;
    if (dir > 0) ctx.rect(x, 0, sw + 1, H * kk);
    else ctx.rect(x, H * (1 - kk), sw + 1, H * kk + 1);
  }
  ctx.clip();
}
function wipeClip(ctx, k, angle = 0.25) {
  const x = lerp(-W * 0.3, W * 1.3, ease.inOutCubic(k));
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(x + H * angle, 0);
  ctx.lineTo(x - H * angle, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.clip();
}

/* Malta outline (lon, lat), clockwise from the north-west, harbour inlets included */
const MALTA = [
  [14.33, 35.985],
  [14.352, 35.992],
  [14.372, 35.98],
  [14.388, 35.968],
  [14.4, 35.955],
  [14.402, 35.945],
  [14.412, 35.94],
  [14.425, 35.955],
  [14.436, 35.948],
  [14.44, 35.938],
  [14.455, 35.935],
  [14.475, 35.925],
  [14.492, 35.918],
  [14.505, 35.912],
  [14.497, 35.905],
  [14.484, 35.905],
  [14.488, 35.897],
  [14.5, 35.895],
  [14.512, 35.9],
  [14.522, 35.9],
  [14.52, 35.892],
  [14.507, 35.885],
  [14.503, 35.878],
  [14.515, 35.876],
  [14.523, 35.882],
  [14.535, 35.884],
  [14.54, 35.892],
  [14.556, 35.89],
  [14.566, 35.872],
  [14.572, 35.858],
  [14.558, 35.846],
  [14.548, 35.838],
  [14.562, 35.828],
  [14.552, 35.82],
  [14.53, 35.822],
  [14.512, 35.815],
  [14.49, 35.812],
  [14.465, 35.818],
  [14.445, 35.82],
  [14.425, 35.822],
  [14.4, 35.832],
  [14.375, 35.848],
  [14.355, 35.87],
  [14.338, 35.9],
  [14.335, 35.93],
  [14.325, 35.95],
];
const MAPS = {
  // lon/lat -> canvas box. box: x,y,w,h
  project(lon, lat, box) {
    const lon0 = 14.32;
    const lon1 = 14.58;
    const lat0 = 36.0;
    const lat1 = 35.8;
    return [
      box.x + ((lon - lon0) / (lon1 - lon0)) * box.w,
      box.y + ((lat - lat0) / (lat1 - lat0)) * box.h,
    ];
  },
};
function maltaPath(ctx, box, scale = 1) {
  const pts = MALTA.map(([lo, la]) => MAPS.project(lo, la, box));
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const q = pts.map(([x, y]) => [cx + (x - cx) * scale, cy + (y - cy) * scale]);
  const n = q.length;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  ctx.beginPath();
  const m0 = mid(q[n - 1], q[0]);
  ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(q[i], q[(i + 1) % n]);
    ctx.quadraticCurveTo(q[i][0], q[i][1], m[0], m[1]);
  }
  ctx.closePath();
}

Object.assign(window, {
  W, H, BPM, BEAT, BAR, OFFSET, DURATION, C, clamp, lerp, prog, ease, bar, beatPhase, beatPulse, barPulse, hit,
  rng, img, pending, trimCache, text, textReveal, wordsReveal, rrect, maltese, maltesePath, gear, sun, vignette,
  fillBg, embers, frame, shot, callout, tag, flash, crossClip, circleClip, slatClip, wipeClip, MALTA, MAPS,
  maltaPath, F, measure, setFont,
});

/* ---------- scene registry + footage paths ---------- */
window.SCENES = [];
window.ST = (n) => `../footage/stills/${n}.jpg`;
window.PORT = (n) => `../footage/portraits/${n}.webp`;
window.CLIP = (name, sec, fps = 30) => `../footage/frames/${name}/${String(Math.max(1, Math.floor(sec * fps) + 1)).padStart(4, '0')}.jpg`;

/* map a source-pixel point (in a 1920x1080 screenshot) to canvas px for a shot() call */
window.viewMap = (view, rect, px, py, sw = 1920, sh = 1080) => {
  const [fx, fy, z] = view;
  const vw = sw / z;
  const vh = vw * (rect.h / rect.w);
  const sx = clamp(fx - vw / 2, 0, sw - vw);
  const sy = clamp(fy - vh / 2, 0, sh - vh);
  return [rect.x + ((px - sx) / vw) * rect.w, rect.y + ((py - sy) / vh) * rect.h];
};

/* cheap blurred backdrop: downscale then upscale a screenshot */
let _blur = null;
window.blurBg = (c, src, alpha = 1, dim = 0.55, zoom = 1.08) => {
  const im = typeof src === 'string' ? img(src) : src;
  if (!im) return;
  if (!_blur) {
    _blur = document.createElement('canvas');
    _blur.width = 160;
    _blur.height = 90;
  }
  const o = _blur.getContext('2d');
  o.imageSmoothingEnabled = true;
  o.drawImage(im, 0, 0, 160, 90);
  c.save();
  c.globalAlpha *= alpha;
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'high';
  c.drawImage(_blur, -W * (zoom - 1) / 2, -H * (zoom - 1) / 2, W * zoom, H * zoom);
  c.fillStyle = `rgba(8,5,5,${dim})`;
  c.fillRect(0, 0, W, H);
  c.restore();
};

/* arch-framed portrait */
window.archPortrait = (c, name, x, y, w, h, o = {}) => {
  c.save();
  c.beginPath();
  c.moveTo(x, y + h);
  c.lineTo(x, y + w / 2);
  c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
  c.lineTo(x + w, y + h);
  c.closePath();
  c.save();
  c.clip();
  c.fillStyle = '#e4dfd2';
  c.fillRect(x, y, w, h);
  const pi = img(PORT(name));
  const zz = o.zoom ?? 1;
  if (pi) c.drawImage(pi, x - 10 - (w * (zz - 1)) / 2, y + h * 0.1 - (w * (zz - 1)) / 2, (w + 20) * zz, (w + 20) * zz);
  const sh = c.createLinearGradient(0, y + h - 220, 0, y + h);
  sh.addColorStop(0, 'rgba(10,6,6,0)');
  sh.addColorStop(1, 'rgba(10,6,6,0.92)');
  c.fillStyle = sh;
  c.fillRect(x, y + h - 220, w, 220);
  c.restore();
  c.strokeStyle = C.gold;
  c.lineWidth = 4;
  c.stroke();
  c.restore();
};
