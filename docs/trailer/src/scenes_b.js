'use strict';
/* Scenes 6-9: how it plays, combat, story routes, both sides, cast */

/* small helpers */
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

/* ====================================================================
   6. HOW IT PLAYS   bar 25 .. bar 36   (chorus 1)
   ==================================================================== */
const HP_FRAME = { x: 690, y: 215, w: 1130, h: 636 };
SCENES.push({
  name: 'howto',
  a: bar(25),
  b: bar(36),
  tin: { type: 'slat', dur: 1.0, n: 12, dir: -1 },
  draw(c, t, lt, d) {
    sceneBg(c);
    const R = HP_FRAME;
    const S1 = bar(28) - bar(25);
    const S2 = bar(31) - bar(25);
    const S3 = bar(34) - bar(25);
    tag(c, '04 · HOW IT PLAYS', 110, 150, ease.outCubic(prog(lt, 0.4, 1.4)));
    // step indicator
    const idx = lt < S1 ? 0 : lt < S2 ? 1 : lt < S3 ? 2 : 3;
    for (let i = 0; i < 4; i++) {
      c.fillStyle = i === idx ? C.hot : 'rgba(216,179,106,0.35)';
      c.fillRect(110 + i * 62, 960, 48, 5);
    }
    const slide = (a, b) => {
      // frame slides in from the right over 0.7s and out to the left
      const inK = ease.outCubic(prog(lt, a, a + 0.8));
      const outK = ease.inCubic(prog(lt, b - 0.5, b));
      return { dx: (1 - inK) * 900 - outK * 900, a: inK * (1 - outK) };
    };

    // ---- step 1: battlefield + turn order
    {
      const a = 0, b = S1 + 0.4;
      if (lt >= a && lt < b) {
        const sl = slide(a, S1);
        const l = lt - a;
        const view = [960 + l * 8, 520, 1.0 + l * 0.018];
        const r = { ...R, x: R.x + sl.dx };
        shot(c, ST('battle-a1-piccolo-soccorso'), r.x, r.y, r.w, r.h, view, { alpha: sl.a });
        c.save();
        c.globalAlpha *= sl.a;
        const p1 = viewMap(view, r, 960, 40);
        callout(c, p1[0], p1[1], r.x + 330, r.y - 70, 'TURN ORDER', prog(l, 1.4, 2.4), { size: 26 });
        const p2 = viewMap(view, r, 200, 100);
        callout(c, p2[0], p2[1], r.x + 330, r.y + r.h + 55, 'MISSION OBJECTIVE', prog(l, 2.4, 3.4), { size: 26 });
        c.restore();
        const st = step(lt, a + 0.3, S1 - 0.2);
        c.save();
        c.translate(0, 0);
        headline(c, ['COMMAND', 'THE SQUAD'], 110, 360, st.k * st.out, { size: 76 });
        body(c, 'Turn-based battles on 3D isometric battlefields.', 110, 560, prog(lt, 0.9, 2.0) * st.out, { size: 42, maxW: 540 });
        body(c, 'Every unit is a pilot inside an Armatura.', 110, 700, prog(lt, 1.8, 2.9) * st.out, { size: 38, maxW: 540, color: C.parch });
        c.restore();
      }
    }
    // ---- step 2: move + AP cost
    {
      const a = S1 - 0.4, b = S2 + 0.4;
      if (lt >= a && lt < b) {
        const sl = slide(a, S2);
        const l = lt - a;
        const view = [1100 - l * 6, 640, 1.25];
        const r = { ...R, x: R.x + sl.dx };
        shot(c, ST('ui-move-path-ap-cost'), r.x, r.y, r.w, r.h, view, { alpha: sl.a });
        c.save();
        c.globalAlpha *= sl.a;
        const p1 = viewMap(view, r, 1640, 1038);
        callout(c, p1[0], p1[1], r.x + r.w - 380, r.y - 60, 'ACTION POINT COST', prog(l, 1.5, 2.5), { size: 26 });
        const p2 = viewMap(view, r, 950, 340);
        callout(c, p2[0], p2[1], r.x + 120, r.y + r.h + 55, 'TERRAIN & HEIGHT MATTER', prog(l, 2.6, 3.6), { size: 26 });
        c.restore();
        const st = step(lt, a + 0.5, S2 - 0.2);
        headline(c, ['EVERY STEP', 'COSTS AP'], 110, 360, st.k * st.out, { size: 76 });
        body(c, 'Roads are quick. Sand, rubble and climbs are not.', 110, 560, prog(lt, a + 1.3, a + 2.4) * st.out, { size: 42, maxW: 540 });
        body(c, 'The route and its cost are previewed first.', 110, 700, prog(lt, a + 2.2, a + 3.3) * st.out, { size: 38, maxW: 540, color: C.parch });
      }
    }
    // ---- step 3: rotate (clip)
    {
      const a = S2 - 0.4, b = S3 + 0.4;
      if (lt >= a && lt < b) {
        const sl = slide(a, S3);
        const l = lt - a;
        const r = { ...R, x: R.x + sl.dx };
        shot(c, CLIP('camera-rotation', clamp(l - 0.2, 0, 7.2)), r.x, r.y, r.w, r.h, [960, 540, 1], { alpha: sl.a });
        const st = step(lt, a + 0.5, S3 - 0.2);
        headline(c, ['ROTATE', 'THE WORLD'], 110, 360, st.k * st.out, { size: 76 });
        body(c, 'Turn the camera in 90° steps to see around walls and ridges.', 110, 560, prog(lt, a + 1.3, a + 2.6) * st.out, { size: 42, maxW: 540 });
        // rotation glyph
        c.save();
        c.translate(1760, 215);
        c.globalAlpha *= sl.a;
        c.rotate(-lt * 1.6);
        c.strokeStyle = C.goldLight;
        c.lineWidth = 5;
        c.beginPath();
        c.arc(0, 0, 30, 0.3, 5.2);
        c.stroke();
        c.beginPath();
        c.moveTo(24, -26);
        c.lineTo(38, -4);
        c.lineTo(14, -6);
        c.fillStyle = C.goldLight;
        c.fill();
        c.restore();
      }
    }
    // ---- step 4: fatigue
    {
      const a = S3 - 0.4;
      if (lt >= a) {
        const sl = slide(a, 999);
        const l = lt - a;
        const r = { ...R, x: R.x + sl.dx };
        shot(c, ST('ui-attack-technique-menu'), r.x, r.y, r.w, r.h, [960, 540, 1], { alpha: sl.a });
        const st = step(lt, a + 0.5, 999);
        headline(c, ['EVERY BLOW', 'TIRES YOU'], 110, 360, st.k, { size: 62, spacing: 4 });
        // FP meter graphic
        const mx = 110;
        const my = 580;
        const mw = 520;
        const fill = ease.inOutSine(prog(l, 1.2, 4.2));
        c.save();
        c.globalAlpha *= prog(l, 0.9, 1.5);
        text(c, 'FATIGUE POINTS', mx, my - 22, { size: 22, spacing: 8, color: C.gold, align: 'left' });
        c.fillStyle = 'rgba(255,255,255,0.1)';
        rrect(c, mx, my, mw, 28, 6);
        c.fill();
        const col = fill > 0.99 ? '#d9362a' : fill >= 0.5 ? '#e0a53a' : '#5fae5a';
        c.fillStyle = col;
        rrect(c, mx, my, Math.max(8, mw * fill), 28, 6);
        c.fill();
        c.strokeStyle = C.parch;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(mx + mw / 2, my - 8);
        c.lineTo(mx + mw / 2, my + 36);
        c.stroke();
        text(c, '50  TIRED  −10% hit & evade', mx + mw / 2, my + 72, { size: 24, spacing: 2, color: C.parch, align: 'center', alpha: prog(fill, 0.45, 0.55) });
        text(c, '100  FAINTS', mx + mw, my + 112, { size: 24, spacing: 4, color: '#ff7b6a', align: 'right', alpha: prog(fill, 0.93, 1) });
        c.restore();
        body(c, 'Rest to recover. Plan your turns.', 110, 800, prog(l, 3.2, 4.3), { size: 40, maxW: 540 });
      }
    }
    embers(c, lt, 30, 51, { speed: 20, alpha: 0.4 });
  },
});

/* ====================================================================
   7. THE FIGHT   bar 36 .. bar 52   (verse 2 -> pre-chorus build)
   ==================================================================== */
const REACTIONS = [
  ['DEFEND', '+30 FP', 'Always hit, but half the damage.', '#4f8fd0'],
  ['AVOID', '+20 FP', 'Roll to dodge. If it lands, full damage.', '#5fae8a'],
  ['ATTACK BACK', 'AP + FP', 'Take the hit, then strike back.', '#e0a53a'],
  ['COUNTER', '+20 FP', 'A gamble: take nothing, return 1.25×.', '#c27ad0'],
  ['DO NOTHING', 'FREE', 'Take the hit.', '#9a8f80'],
];
SCENES.push({
  name: 'fight',
  a: bar(36),
  b: bar(52),
  tin: { type: 'wipe', dur: 1.1, angle: 0.3 },
  draw(c, t, lt, d) {
    sceneBg(c, '#0e0c10', '#050305');
    const P1 = bar(40) - bar(36);
    const P2 = bar(46) - bar(36);
    const P3 = bar(49) - bar(36);
    tag(c, '05 · THE BATTLE', 110, 150, ease.outCubic(prog(lt, 0.4, 1.4)));

    // ---- A: attack sequence
    if (lt < P1) {
      const a = 0;
      const out = 1 - prog(lt, P1 - 0.45, P1 - 0.05);
      c.save();
      c.globalAlpha *= out;
      const r = { x: 690, y: 215, w: 1130, h: 636 };
      shot(c, CLIP('attack-sequence', clamp(lt - 0.2, 0, 11.9)), r.x, r.y, r.w, r.h, [960, 540, 1]);
      headline(c, ['CHOOSE', 'YOUR BLOW'], 110, 360, ease.outCubic(prog(lt, 0.4, 1.6)), { size: 76 });
      body(c, 'See hit chance and damage before you commit.', 110, 560, prog(lt, 1.2, 2.5), { size: 42, maxW: 540 });
      body(c, 'Stronger attacks cost more AP and FP.', 110, 720, prog(lt, 3.6, 4.8), { size: 36, color: C.parch, maxW: 540 });
      c.restore();
    }
    // ---- B: reactions
    if (lt >= P1 && lt < P2) {
      const l = lt - P1;
      const inK = ease.outCubic(prog(l, 0.05, 0.6));
      const out = 1 - prog(lt, P2 - 0.45, P2 - 0.05);
      c.save();
      c.globalAlpha *= inK * out;
      const r = { x: 110, y: 290, w: 880, h: 495 };
      const useClip = l < 4.9;
      shot(c, useClip ? CLIP('defender-reaction', l) : ST('ui-defender-reaction-menu'), r.x, r.y, r.w, r.h, [960, 540, 1]);
      text(c, 'THE DEFENDER ANSWERS', 110, 240, { size: 46, weight: 700, spacing: 8, align: 'left' });
      body(c, 'Every attack is met with a choice.', 110, 850, prog(l, 0.4, 1.4), { size: 42 });
      body(c, 'Reactions cost fatigue, not AP.', 110, 910, prog(l, 1.2, 2.2), { size: 42, color: C.parch });
      c.restore();
      REACTIONS.forEach(([name, cost, desc, col], i) => {
        const k = ease.outBack(prog(l, 0.8 + i * BEAT * 2, 1.5 + i * BEAT * 2)) * out;
        if (k <= 0) return;
        const x = 1060 + (1 - k) * 160;
        const y = 250 + i * 138;
        c.save();
        c.globalAlpha *= clamp(k) * out;
        c.fillStyle = 'rgba(20,14,12,0.9)';
        rrect(c, x, y, 770, 116, 10);
        c.fill();
        c.fillStyle = col;
        c.fillRect(x, y + 8, 8, 100);
        c.strokeStyle = 'rgba(216,179,106,0.5)';
        c.lineWidth = 1.5;
        rrect(c, x, y, 770, 116, 10);
        c.stroke();
        text(c, name, x + 34, y + 54, { size: 36, weight: 700, spacing: 5, align: 'left' });
        text(c, desc, x + 34, y + 94, { font: F.body, size: 30, align: 'left', color: C.goldLight, weight: '500' });
        text(c, cost, x + 740, y + 54, { size: 28, spacing: 3, align: 'right', color: col, weight: 700 });
        c.restore();
      });
    }
    // ---- C: facing
    if (lt >= P2 && lt < P3) {
      const l = lt - P2;
      const inK = ease.outCubic(prog(l, 0.05, 0.6));
      const out = 1 - prog(lt, P3 - 0.45, P3 - 0.05);
      c.save();
      c.globalAlpha *= inK * out;
      headline(c, ['POSITION', 'DECIDES'], 110, 360, ease.outCubic(prog(l, 0.2, 1.4)), { size: 76 });
      body(c, 'Strike the flank or the back for bonus hit chance and damage.', 110, 560, prog(l, 1.2, 2.5), { size: 42, maxW: 540 });
      // diagram
      const cx = 1250;
      const cy = 600;
      const R0 = 250;
      const arc = (a0, a1, col, label, sub, la, ly) => {
        c.beginPath();
        c.moveTo(cx, cy);
        c.arc(cx, cy, R0, a0, a1);
        c.closePath();
        c.fillStyle = col + '55';
        c.fill();
        c.strokeStyle = col;
        c.lineWidth = 3;
        c.stroke();
      };
      const rk = ease.outCubic(prog(l, 0.4, 1.4));
      c.save();
      c.translate(cx, cy);
      c.scale(rk, rk);
      c.translate(-cx, -cy);
      // facing = up. rear = bottom 90deg, front = top 90deg, sides = left/right
      arc(-Math.PI * 0.75, -Math.PI * 0.25, '#5fae8a');
      arc(-Math.PI * 0.25, Math.PI * 0.25, '#e0a53a');
      arc(Math.PI * 0.25, Math.PI * 0.75, '#d9362a');
      arc(Math.PI * 0.75, Math.PI * 1.25, '#e0a53a');
      // unit
      c.beginPath();
      c.arc(cx, cy, 52, 0, 6.28);
      c.fillStyle = '#17202c';
      c.fill();
      c.strokeStyle = C.goldLight;
      c.lineWidth = 4;
      c.stroke();
      c.beginPath();
      c.moveTo(cx, cy - 36);
      c.lineTo(cx + 18, cy - 4);
      c.lineTo(cx - 18, cy - 4);
      c.closePath();
      c.fillStyle = C.goldLight;
      c.fill();
      c.restore();
      text(c, 'FRONT', cx, cy - R0 - 24, { size: 28, spacing: 6, color: '#7fd4aa' });
      text(c, 'SIDE', cx + R0 + 24, cy + 10, { size: 28, spacing: 6, color: '#f0bf55', align: 'left' });
      text(c, 'REAR', cx, cy + R0 + 54, { size: 28, spacing: 6, color: '#ff7b6a' });
      // sweeping attacker
      const sweep = prog(l, 2.0, 5.0);
      const ang = lerp(-Math.PI * 0.5, Math.PI * 0.5, ease.inOutCubic(sweep));
      const ax = cx + Math.cos(ang) * (R0 + 125);
      const ay = cy + Math.sin(ang) * (R0 + 125);
      if (sweep > 0) {
        c.save();
        c.translate(ax, ay);
        c.beginPath();
        c.arc(0, 0, 24, 0, 6.28);
        c.fillStyle = C.red;
        c.fill();
        c.strokeStyle = C.parch;
        c.lineWidth = 3;
        c.stroke();
        c.restore();
        c.strokeStyle = 'rgba(255,90,54,0.6)';
        c.lineWidth = 3;
        c.setLineDash([10, 8]);
        c.beginPath();
        c.moveTo(ax, ay);
        c.lineTo(cx + (ax - cx) * 0.3, cy + (ay - cy) * 0.3);
        c.stroke();
        c.setLineDash([]);
        const where = ang < -0.4 ? 0 : ang < 0.7 ? 1 : 2;
        const msgs = [
          ['FRONT', 'All reactions available'],
          ['SIDE', '+10% to hit'],
          ['REAR', '+25% hit, ×1.25 damage'],
        ];
        // side is east when attacker swept right
        const m = ang < -0.6 ? msgs[0] : ang < 0.55 ? msgs[1] : msgs[2];
        text(c, m[0], 1830, 270, { size: 44, weight: 700, spacing: 6, align: 'right', color: C.parch });
        text(c, m[1], 1830, 322, { font: F.body, size: 38, align: 'right', color: C.goldLight, weight: '500' });
        if (m[0] === 'REAR') text(c, 'The defender can only Avoid', 1830, 366, { font: F.body, size: 32, align: 'right', color: '#ff9b8a', weight: 'italic 500' });
      }
      c.restore();
    }
    // ---- D: close-ups
    if (lt >= P3) {
      const l = lt - P3;
      const inK = ease.outCubic(prog(l, 0.05, 0.6));
      c.save();
      c.globalAlpha *= inK;
      const r = { x: 690, y: 215, w: 1130, h: 636 };
      const alt = Math.floor(l / (BEAT * 4)) % 2;
      shot(c, ST(alt ? 'ui-cinematic-closeup-2' : 'ui-cinematic-closeup-1'), r.x, r.y, r.w, r.h, [960, 540, 1.0 + (l % (BEAT * 4)) * 0.03]);
      headline(c, ['EVERY BLOW', 'GETS A', 'CLOSE-UP'], 110, 340, ease.outCubic(prog(l, 0.2, 1.4)), { size: 70, lh: 80 });
      body(c, 'Skip it, speed it up, or switch it off.', 110, 640, prog(l, 1.4, 2.5), { size: 40, color: C.parch, maxW: 540 });
      c.restore();
    }
    embers(c, lt, 24, 61, { speed: 16, alpha: 0.35 });
  },
});

/* ====================================================================
   8a. THE STORY: three routes   bar 52 .. bar 60 (chorus 2)
   ==================================================================== */
const ROUTES = [
  { name: 'THE CROSS', col: '#d9462f', desc: 'Embrace the knightly blood. Defend Birgu.', end: 'Victory Day', y: 330 },
  { name: 'THE ISLAND', col: '#4f8fd0', desc: 'Reject both thrones. Fight with Mdina and the militia.', end: 'Son of Malta', y: 560 },
  { name: 'THE CRESCENT', col: '#2fb0b8', desc: 'Cross the harbour. Play the Ottoman side.', end: 'Two Halves', y: 790 },
];
SCENES.push({
  name: 'routes',
  a: bar(52),
  b: bar(60),
  tin: { type: 'circle', dur: 1.3, cx: W / 2, cy: H / 2, flash: 0.8, flashK: 6 },
  draw(c, t, lt) {
    sceneBg(c, '#12090a', '#050203');
    tag(c, '06 · THE STORY', 110, 150, ease.outCubic(prog(lt, 0.4, 1.4)));
    headline(c, ['ONE SIEGE. THREE ROUTES.'], 110, 250, prog(lt, 0.3, 2.0), { size: 70, spacing: 6 });
    body(c, 'Your choices at the fall of St Elmo decide the road ahead.', 110, 330, prog(lt, 5.8, 7.0), { size: 40, maxW: 700, color: C.parch });
    // trunk
    const trunkY = 560;
    const x0 = 160;
    const x1 = 640;
    const x2 = 940;
    const k1 = ease.inOutCubic(prog(lt, 1.0, 2.4));
    const nodes = [
      [x0, 'PROLOGUE', 'Sails at dawn', 0.9],
      [x1, 'ST ELMO', 'The secret is revealed', 2.4],
    ];
    c.save();
    c.strokeStyle = C.gold;
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(x0, trunkY);
    c.lineTo(lerp(x0, x1, k1), trunkY);
    c.stroke();
    c.restore();
    nodes.forEach(([x, n, s, at]) => {
      const k = ease.outBack(prog(lt, at, at + 0.6));
      if (k <= 0) return;
      c.save();
      c.translate(x, trunkY);
      c.scale(k, k);
      c.beginPath();
      c.arc(0, 0, 20, 0, 6.28);
      c.fillStyle = C.ink;
      c.fill();
      c.lineWidth = 5;
      c.strokeStyle = C.gold;
      c.stroke();
      c.restore();
      text(c, n, x, trunkY + 66, { size: 24, spacing: 6, color: C.gold, alpha: k });
      text(c, s, x, trunkY + 100, { font: F.body, size: 28, color: C.parch, alpha: k, weight: 'italic 500' });
    });
    // choice burst
    const bk = ease.outCubic(prog(lt, 4.0, 5.0));
    // branches
    ROUTES.forEach((r, i) => {
      const k = ease.inOutCubic(prog(lt, 3.0 + i * 0.6, 4.4 + i * 0.6));
      if (k <= 0) return;
      c.save();
      c.strokeStyle = r.col;
      c.lineWidth = 6;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(x1, trunkY);
      c.bezierCurveTo(lerp(x1, x2, 0.6), trunkY, lerp(x1, x2, 0.4), r.y, lerp(x1, x2, 1), r.y);
      c.setLineDash([2000, 2000]);
      c.lineDashOffset = 2000 * (1 - k);
      c.stroke();
      c.setLineDash([]);
      c.restore();
      const nk = ease.outBack(prog(lt, 4.0 + i * 0.6, 4.7 + i * 0.6));
      if (nk > 0) {
        c.save();
        c.translate(x2, r.y);
        c.scale(nk, nk);
        c.beginPath();
        c.arc(0, 0, 26, 0, 6.28);
        c.fillStyle = r.col;
        c.fill();
        c.lineWidth = 4;
        c.strokeStyle = C.parch;
        c.stroke();
        c.restore();
        const tk = prog(lt, 4.2 + i * 0.6, 5.2 + i * 0.6);
        text(c, r.name, x2 + 54, r.y - 8, { size: 40, weight: 700, spacing: 8, align: 'left', alpha: tk, color: C.parch });
        text(c, r.desc, x2 + 54, r.y + 38, { font: F.body, size: 38, align: 'left', alpha: tk, color: C.goldLight, weight: '500' });
        text(c, 'ENDING — ' + r.end.toUpperCase(), x2 + 54, r.y + 84, { size: 28, spacing: 6, align: 'left', alpha: prog(lt, 6.8 + i * 0.5, 7.6 + i * 0.5), color: '#ffffff', weight: 700 });
      }
    });
    // inset: choice dialogue
    const ik = ease.outCubic(prog(lt, 5.4, 6.4));
    if (ik > 0) {
      c.save();
      c.globalAlpha *= ik;
      shot(c, ST('story-choice-1'), 1400, 80, 420, 236, [700, 800, 1.7], { radius: 8 });
      c.restore();
    }
    embers(c, lt, 30, 71, { speed: 18, alpha: 0.4 });
  },
});

/* ====================================================================
   8b. PLAY BOTH SIDES   bar 60 .. bar 69
   ==================================================================== */
SCENES.push({
  name: 'bothsides',
  a: bar(60),
  b: bar(69),
  tin: { type: 'wipe', dur: 1.0, angle: -0.3 },
  draw(c, t, lt, d) {
    fillBg(c, '#0a0a0c', '#040304');
    const split = 0.5 * W + Math.sin(lt * 0.5) * 20;
    const slide = ease.outCubic(prog(lt, 0.2, 1.4));
    // left: Maltese
    c.save();
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(split + 90, 0);
    c.lineTo(split - 90, H);
    c.lineTo(0, H);
    c.closePath();
    c.clip();
    c.translate(-(1 - slide) * 900, 0);
    const imL = img(ST('battle-i2-mdina-walls'));
    if (imL) {
      c.drawImage(imL, 0, 0, W, H);
      c.fillStyle = 'rgba(15,35,70,0.45)';
      c.fillRect(0, 0, W, H);
    }
    c.restore();
    // right: Ottoman
    c.save();
    c.beginPath();
    c.moveTo(split + 90, 0);
    c.lineTo(W, 0);
    c.lineTo(W, H);
    c.lineTo(split - 90, H);
    c.closePath();
    c.clip();
    c.translate((1 - slide) * 900, 0);
    const imR = img(ST('battle-c4-corradino-heights'));
    if (imR) {
      c.drawImage(imR, 0, 0, W, H);
      c.fillStyle = 'rgba(10,70,75,0.45)';
      c.fillRect(0, 0, W, H);
    }
    c.restore();
    // divider
    c.save();
    c.strokeStyle = C.gold;
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(split + 90, 0);
    c.lineTo(split - 90, H);
    c.stroke();
    c.restore();
    c.fillStyle = 'rgba(5,3,3,0.62)';
    c.fillRect(0, 0, W, H);
    // text
    const t1 = step(lt, 1.2, 7.0, 0.8, 0.5);
    text(c, 'MALTA', 480, 300, { size: 46, weight: 700, spacing: 14, color: '#8fb8ee', alpha: t1.k * t1.out });
    text(c, 'THE OTTOMANS', 1440, 300, { size: 46, weight: 700, spacing: 14, color: '#6fd6dc', alpha: t1.k * t1.out });
    body(c, 'The Order and the militia', 480, 680, prog(lt, 1.8, 3.0) * t1.out, { size: 44, align: 'center', color: C.parch });
    body(c, 'The armada and the corsairs', 1440, 680, prog(lt, 2.2, 3.4) * t1.out, { size: 44, align: 'center', color: C.parch });
    // headline
    const hk = prog(lt, 3.6, 5.2);
    const ho = 1 - prog(lt, 9.2, 9.8);
    c.save();
    c.fillStyle = `rgba(5,3,3,${0.62 * hk * ho})`;
    c.fillRect(0, 380, W, 220);
    c.restore();
    textReveal(c, 'PLAY BOTH SIDES OF THE SIEGE', W / 2, 510, hk, { size: 80, weight: 700, spacing: 8, alpha: ho });
    wordsReveal(c, 'Heroism and cost on both sides, with a playable Ottoman route.', W / 2, 575, prog(lt, 5.4, 6.9), { font: F.body, size: 42, weight: 'italic 500', color: C.goldLight, alpha: ho });
    // medallion closes
    const mk = prog(lt, 9.6, 10.6);
    if (mk > 0) {
      c.save();
      c.fillStyle = `rgba(5,3,3,${0.85 * mk})`;
      c.fillRect(0, 0, W, H);
      c.restore();
      const join = ease.inOutCubic(prog(lt, 12.2, 14.2));
      c.save();
      c.globalAlpha *= mk;
      medallionHalf(c, W / 2, 470, 190, -1, (1 - join) * 2.2, lt);
      medallionHalf(c, W / 2, 470, 190, 1, (1 - join) * 2.2, lt);
      c.restore();
      const gl = hit(t, bar(60) + 14.2, 2.5);
      if (gl > 0.02) {
        const g = c.createRadialGradient(W / 2, 470, 120, W / 2, 470, 520);
        g.addColorStop(0, `rgba(255,200,120,${0.5 * gl})`);
        g.addColorStop(1, 'rgba(255,200,120,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
      }
      textReveal(c, 'TWO BROTHERS. TWO SIDES.', W / 2, 770, prog(lt, 10.4, 12.0), { size: 60, weight: 700, spacing: 10, alpha: mk });
      wordsReveal(c, 'One broken medallion.', W / 2, 850, prog(lt, 12.0, 13.4), { font: F.body, size: 56, weight: 'italic 500', color: C.goldLight });
    }
    embers(c, lt, 26, 81, { speed: 18, alpha: 0.4 });
  },
});

/* ====================================================================
   9. THE CAST   bar 69 .. bar 79  (bridge)
   ==================================================================== */
const CAST = [
  { id: 'ninu', name: 'NINU', title: 'Militiaman of Żejtun', line: 'A farmer’s son with a secret.', bg: 'battle-b1-marsaxlokk' },
  { id: 'luis', name: 'FRA LUIS', title: 'Knight of Aragon', line: 'A reluctant mentor with orders of his own.', bg: 'battle-a3-castile-breach' },
  { id: 'kateri', name: 'KATERI', title: 'Armatura mechanic', line: 'Clockmaker’s daughter. Keeps the machines alive.', bg: 'battle-a5-scala-engine' },
  { id: 'pawlu', name: 'PAWLU', title: 'Farmer, former galley slave', line: 'He knows the truth, and swore silence.', bg: 'battle-b3-sciberras' },
  { id: 'valette', name: 'LA VALETTE', title: 'Grand Master of the Order', line: 'He has watched from afar for twenty years.', bg: 'battle-b9-fall-of-st-elmo' },
];
SCENES.push({
  name: 'cast',
  a: bar(69),
  b: bar(79),
  tin: { type: 'fade', dur: 1.2 },
  draw(c, t, lt, d) {
    fillBg(c, '#0b0708', '#030203');
    const per = BAR * 2;
    const idx = Math.min(CAST.length - 1, Math.floor(lt / per));
    const l = lt - idx * per;
    const ch = CAST[idx];
    const prev = CAST[idx - 1];
    // backdrops crossfade
    if (prev) blurBg(c, ST(prev.bg), 1 - ease.inOutSine(prog(l, 0, 0.8)), 0.72);
    blurBg(c, ST(ch.bg), (idx === 0 ? ease.inOutSine(prog(lt, 0, 1.2)) : ease.inOutSine(prog(l, 0, 0.8))), 0.72);
    const right = idx % 2 === 1;
    const pw = 520;
    const ph = 700;
    const px = right ? 1220 : 180;
    const py = 190;
    const k = ease.outCubic(prog(l, 0.05, 0.9));
    c.save();
    c.globalAlpha *= k;
    c.translate((right ? 1 : -1) * (1 - k) * 120, 0);
    archPortrait(c, ch.id, px, py, pw, ph);
    c.restore();
    const tx = right ? 140 : 800;
    tag(c, 'THE CAST', tx, 250, ease.outCubic(prog(lt, 0.5, 1.5)));
    textReveal(c, ch.name, tx, 400, prog(l, 0.2, 1.2), { size: 104, weight: 900, spacing: 10, align: 'left' });
    text(c, ch.title.toUpperCase(), tx, 468, { size: 34, spacing: 9, align: 'left', color: C.goldLight, alpha: prog(l, 0.5, 1.1), shadow: '#000', shadowBlur: 14 });
    wordsReveal(c, ch.line, tx, 570, prog(l, 0.8, 1.9), { font: F.body, size: 58, shadow: '#000', shadowBlur: 16, weight: 'italic 500', align: 'left' });
    // progress pips
    CAST.forEach((_, i) => {
      c.fillStyle = i === idx ? C.hot : 'rgba(216,179,106,0.4)';
      c.beginPath();
      c.arc(tx + 10 + i * 34, 960, 8, 0, 6.28);
      c.fill();
    });
    // 'and more' under last
    if (idx === CAST.length - 1) {
      const mk = prog(l, 1.9, 3.0);
      text(c, 'WITH BALBI · DENIZ · LEYLA · AND THE INVENTOR SCALA', W / 2, 1010, { size: 30, spacing: 8, color: C.goldLight, alpha: mk, shadow: '#000', shadowBlur: 14 });
    }
    embers(c, lt, 26, 91, { speed: 18, alpha: 0.35 });
  },
});
