'use strict';
/* helpers shared with the trailer scenes (copied so intro.html does not load the trailer scenes) */
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

function sceneBg(c, top = '#140c0b', bottom = '#060303') {
  fillBg(c, top, bottom);
  const g = c.createRadialGradient(W * 0.72, H * 0.35, 50, W * 0.72, H * 0.35, 900);
  g.addColorStop(0, 'rgba(120,30,20,0.25)');
  g.addColorStop(1, 'rgba(120,30,20,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
}
function headline(c, lines, x, y, k, o = {}) {
  lines.forEach((ln, i) =>
    textReveal(c, ln, x, y + i * (o.lh ?? 86), clamp(k * 1.3 - i * 0.25), {
      size: o.size ?? 72, weight: 700, spacing: o.spacing ?? 6, align: o.align ?? 'left', color: o.color ?? C.parch,
    }),
  );
}
function wrapLines(c, str, size, maxW) {
  setFont(c, F.body, size, 0);
  c.font = `500 ${size}px ${F.body}`;
  const words = str.split(' ');
  const lines = [];
  let cur = '';
  words.forEach((w) => {
    const test = cur ? cur + ' ' + w : w;
    if (c.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  });
  if (cur) lines.push(cur);
  return lines;
}
/* wrapped, word-revealed paragraph; returns number of lines */
function body(c, str, x, y, k, o = {}) {
  const size = o.size ?? 44;
  const lines = o.maxW ? wrapLines(c, str, size, o.maxW) : [str];
  lines.forEach((ln, i) =>
    wordsReveal(c, ln, x, y + i * size * 1.2, clamp(k * 1.4 - i * 0.3), {
      font: F.body, size, weight: '500', color: o.color ?? C.goldLight, align: o.align ?? 'left', alpha: o.alpha ?? 1,
    }),
  );
  return lines.length;
}
/* a scene-local step helper: returns {k (0..1 in), out (1..0 out), lt} for a step spanning [a,b] seconds */
function step(lt, a, b, fin = 0.5, fout = 0.4) {
  return { k: prog(lt, a, a + fin), out: 1 - prog(lt, b - fout, b), l: lt - a, on: lt >= a && lt < b };
}


Object.assign(window, { drawArmatura, humanFigure, medallionHalf, sceneBg, headline, wrapLines, body, step });
