'use strict';
/* Timeline + frame renderer. window.renderFrame(t) draws one frame; window.ready resolves when fonts are loaded. */

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d', { alpha: false });

// scenes register themselves in SCENES (see scenes_*.js), ordered by start time
SCENES.sort((a, b) => a.a - b.a);
SCENES.forEach((s, i) => {
  const next = SCENES[i + 1];
  s.end = next ? next.a + (next.tin ? next.tin.dur : 0) : DURATION + 1;
});

function applyTransition(c, tin, k) {
  if (!tin || k >= 1) return;
  switch (tin.type) {
    case 'fade':
      c.globalAlpha *= ease.inOutSine(k);
      break;
    case 'cross':
      crossClip(c, k, tin.cx ?? W / 2, tin.cy ?? H / 2);
      break;
    case 'circle':
      circleClip(c, k, tin.cx ?? W / 2, tin.cy ?? H / 2);
      break;
    case 'slat':
      slatClip(c, k, tin.n ?? 8, tin.dir ?? 1);
      break;
    case 'wipe':
      wipeClip(c, k, tin.angle ?? 0.25);
      break;
    default:
      break;
  }
}

function drawAll(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  for (const s of SCENES) {
    if (t < s.a || t >= s.end) continue;
    const lt = t - s.a;
    const k = s.tin && s.tin.dur > 0 ? clamp(lt / s.tin.dur) : 1;
    ctx.save();
    applyTransition(ctx, s.tin, k);
    s.draw(ctx, t, lt, s.b - s.a);
    ctx.restore();
    if (s.tin && (s.tin.type === 'cross' || s.tin.type === 'circle') && k < 1) {
      ctx.save();
      const e = ease.inOutCubic(k);
      const r = lerp(10, 2300, e);
      if (s.tin.type === 'cross') maltesePath(ctx, s.tin.cx ?? W / 2, s.tin.cy ?? H / 2, r);
      else {
        ctx.beginPath();
        ctx.arc(s.tin.cx ?? W / 2, s.tin.cy ?? H / 2, r, 0, 6.28);
      }
      ctx.strokeStyle = `rgba(244,224,160,${0.9 * (1 - k)})`;
      ctx.lineWidth = 8;
      ctx.shadowColor = 'rgba(255,200,120,0.9)';
      ctx.shadowBlur = 30;
      ctx.stroke();
      ctx.restore();
    }
    // transition accents: flash on cut
    if (s.tin && s.tin.flash && lt >= 0) flash(ctx, hit(t, s.a, s.tin.flashK ?? 9) * s.tin.flash, s.tin.flashColor);
  }
  // global grade
  ctx.save();
  vignette(ctx, 0.42);
  ctx.restore();
  // final fade to black
  const fo = prog(t, DURATION - 1.7, DURATION - 0.05);
  if (fo > 0) {
    ctx.fillStyle = `rgba(0,0,0,${ease.inOutSine(fo)})`;
    ctx.fillRect(0, 0, W, H);
  }
}

window.renderFrame = async (t) => {
  for (let pass = 0; pass < 6; pass++) {
    pending.clear();
    drawAll(t);
    if (!pending.size) break;
    await Promise.all([...pending]);
  }
  trimCache(500);
};

window.ready = (async () => {
  const specs = [
    "400 40px 'Cinzel'",
    "700 40px 'Cinzel'",
    "900 40px 'Cinzel'",
    "500 40px 'Cormorant Garamond'",
    "italic 500 40px 'Cormorant Garamond'",
    "600 40px 'Cormorant Garamond'",
  ];
  const sample = 'Żejtun ĠanniĦ ħaddiem Mellieħa Tigné 1565 ŻĠĦ';
  await Promise.all(specs.map((s) => document.fonts.load(s, sample)));
  await document.fonts.ready;
  if (window.PRELOAD) await Promise.all(window.PRELOAD().map((s) => img(s) && 0));
  pending.clear();
})();

// dev helpers: ?t=12.5 renders a single frame, ?play loops in real time
const q = new URLSearchParams(location.search);
if (q.has('t')) {
  window.ready.then(() => window.renderFrame(parseFloat(q.get('t'))));
} else if (q.has('play')) {
  window.ready.then(() => {
    const t0 = performance.now();
    const loop = async () => {
      const t = ((performance.now() - t0) / 1000) % DURATION;
      await window.renderFrame(t);
      requestAnimationFrame(loop);
    };
    loop();
  });
}
