import { settings } from '../state/settings';
import type { Mood, Theme } from './musicThemes';
import { degreeToMidi, midiToHz, STRUM_STEPS, THEMES } from './musicThemes';
import { CROSSFADE_S, restartsOnEntry, trackFor, TRACK_VOLUME } from './musicTracks';

/**
 * Sound effects are synthesised live with Web Audio. Music is two recorded tracks (see
 * musicTracks.ts), streamed and looped; the small Maltese-folk sequencer (musicThemes.ts) only
 * plays if a track can't be loaded.
 */
export type Sfx =
  'tap' | 'select' | 'move' | 'hit' | 'miss' | 'defend' | 'counter' | 'defeat' | 'victory' | 'loss';
export type { Mood };

let ctx: AudioContext | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let reverb: ConvolverNode | null = null;
let currentMood: Mood = 'none';
let trackGain: GainNode | null = null;

function audio(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    musicGain = ctx.createGain();
    sfxGain = ctx.createGain();
    musicGain.connect(ctx.destination);
    sfxGain.connect(ctx.destination);
    trackGain = ctx.createGain();
    trackGain.connect(ctx.destination);
    // A short hall so the flute and guitar ring like they would in a stone courtyard.
    reverb = ctx.createConvolver();
    reverb.buffer = impulse(ctx, 1.8);
    const wet = ctx.createGain();
    wet.gain.value = 0.3;
    reverb.connect(wet).connect(musicGain);
    applyVolumes();
    settings.subscribe(applyVolumes);
    watchVisibility();
    return ctx;
  } catch {
    return null;
  }
}

function applyVolumes(): void {
  const s = settings.get();
  if (musicGain) musicGain.gain.value = s.musicVolume * 0.18;
  if (sfxGain) sfxGain.gain.value = s.sfxVolume * 0.5;
  if (trackGain) trackGain.gain.value = s.musicVolume * TRACK_VOLUME;
}

/** Browsers only allow sound after a user gesture; call this from the first tap. */
export function unlockAudio(): void {
  const c = audio();
  if (c && c.state === 'suspended' && !document.hidden) void c.resume();
  // A track asked for before the first tap was blocked by the browser: start it now.
  if (active && active.el.paused && !document.hidden) playElement(active);
}

/** Silences everything at once (app suspended or hidden); `resumeAudio` picks up again. */
export function pauseAudio(): void {
  if (ctx && ctx.state === 'running') void ctx.suspend();
  for (const t of tracks.values()) t.el.pause();
}

/** Resumes the sound paused by `pauseAudio` (never while the page is hidden). */
export function resumeAudio(): void {
  if (!ctx || document.hidden) return;
  if (active) playElement(active);
  if (ctx.state !== 'suspended') return;
  void ctx.resume().then(() => {
    if (seq) seq.nextStepTime = seq.nextNoteTime = ctx!.currentTime + 0.05;
  });
}

/**
 * Stop all sound the moment the page is hidden (switching apps, locking the phone, closing the
 * tab) and pick up again when it comes back. Without this, phones keep playing for a while.
 */
function watchVisibility(): void {
  const pause = pauseAudio;
  const resume = resumeAudio;
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : resume()));
  window.addEventListener('pagehide', pause);
  window.addEventListener('pageshow', resume);
  window.addEventListener('blur', () => {
    if (document.hidden) pause();
  });
}

function impulse(c: AudioContext, seconds: number): AudioBuffer {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  }
  return buf;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  gain: number,
  at = 0,
  dest = sfxGain,
  slideTo?: number,
): void {
  const c = ctx;
  if (!c || !dest) return;
  const t = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(dur: number, gain: number, at = 0, lowpass = 1800): void {
  const c = ctx;
  if (!c || !sfxGain) return;
  const t = c.currentTime + at;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = lowpass;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(sfxGain);
  src.start(t);
}

export function sfx(name: Sfx): void {
  if (!audio() || ctx?.state !== 'running') return;
  switch (name) {
    case 'tap':
      tone(660, 0.06, 'triangle', 0.25);
      break;
    case 'select':
      tone(520, 0.07, 'triangle', 0.3);
      tone(780, 0.09, 'triangle', 0.25, 0.05);
      break;
    case 'move':
      for (let i = 0; i < 3; i++) noise(0.05, 0.25, i * 0.12, 600);
      break;
    case 'hit':
      noise(0.18, 0.9, 0, 2500);
      tone(140, 0.2, 'square', 0.35, 0, sfxGain, 60);
      break;
    case 'miss':
      noise(0.25, 0.35, 0, 4000);
      tone(900, 0.2, 'sine', 0.15, 0, sfxGain, 400);
      break;
    case 'defend':
      tone(300, 0.12, 'square', 0.25);
      noise(0.1, 0.5, 0, 1200);
      break;
    case 'counter':
      tone(440, 0.08, 'sawtooth', 0.2);
      tone(330, 0.12, 'sawtooth', 0.2, 0.08);
      break;
    case 'defeat':
      tone(220, 0.6, 'sawtooth', 0.3, 0, sfxGain, 55);
      noise(0.5, 0.6, 0.05, 900);
      break;
    case 'victory':
      [392, 494, 587, 784].forEach((f, i) => tone(f, 0.35, 'triangle', 0.3, i * 0.14));
      break;
    case 'loss':
      [330, 294, 262, 196].forEach((f, i) => tone(f, 0.45, 'triangle', 0.3, i * 0.2));
      break;
  }
}

// ── Music ──────────────────────────────────────────────────────────────────────

interface Sequencer {
  readonly theme: Theme;
  /** Eighth-note counter and the time the next one sounds. */
  step: number;
  nextStepTime: number;
  /** Position in the melody: which entry of `order`, which note, and when it sounds. */
  orderIdx: number;
  noteIdx: number;
  nextNoteTime: number;
  readonly drone: AudioNode[];
  readonly timer: ReturnType<typeof setInterval>;
}

let seq: Sequencer | null = null;
const LOOKAHEAD = 0.2;

/** Sends a voice to the music bus, with some of it into the reverb. */
function toMusic(node: AudioNode, wet = 0.5): void {
  if (!musicGain) return;
  node.connect(musicGain);
  if (reverb && wet > 0) {
    const send = ctx!.createGain();
    send.gain.value = wet;
    node.connect(send).connect(reverb);
  }
}

function envGain(t: number, attack: number, peak: number, hold: number, release: number): GainNode {
  const g = ctx!.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.setValueAtTime(peak, t + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
  return g;
}

/** Flejguta: breathy reed flute with a delayed vibrato. */
function flute(freq: number, t: number, dur: number): void {
  const c = ctx!;
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, t);
  const vib = c.createOscillator();
  const vibDepth = c.createGain();
  vib.frequency.value = 5.2;
  vibDepth.gain.setValueAtTime(0, t);
  vibDepth.gain.linearRampToValueAtTime(freq * 0.006, t + Math.min(0.35, dur * 0.6));
  vib.connect(vibDepth).connect(osc.frequency);
  const over = c.createOscillator();
  over.type = 'triangle';
  over.frequency.setValueAtTime(freq * 2, t);
  const overGain = c.createGain();
  overGain.gain.value = 0.12;
  const g = envGain(t, 0.07, 0.3, Math.max(0.01, dur - 0.2), 0.25);
  osc.connect(g);
  over.connect(overGain).connect(g);
  toMusic(g, 0.6);
  // A puff of breath at the start of each note.
  breath(t, freq);
  for (const o of [osc, vib, over]) {
    o.start(t);
    o.stop(t + dur + 0.4);
  }
}

function breath(t: number, freq: number): void {
  const c = ctx!;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * 0.12), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq * 2;
  bp.Q.value = 2;
  const g = envGain(t, 0.02, 0.05, 0.02, 0.08);
  src.connect(bp).connect(g);
  toMusic(g, 0.3);
  src.start(t);
}

/** Żaqq chanter: a nasal reed, with a quick grace note before longer notes. */
function chanter(freq: number, t: number, dur: number, grace?: number): void {
  const c = ctx!;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2200;
  lp.Q.value = 3;
  const g = envGain(t, 0.02, 0.16, Math.max(0.01, dur - 0.08), 0.08);
  lp.connect(g);
  toMusic(g, 0.35);
  const start = grace ? t + 0.05 : t;
  for (const detune of [-6, 6]) {
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.detune.value = detune;
    if (grace) osc.frequency.setValueAtTime(grace, t);
    osc.frequency.setValueAtTime(freq, start);
    osc.connect(lp);
    osc.start(t);
    osc.stop(t + dur + 0.2);
  }
}

/** Għana-style guitar: a plucked string, bright then quickly mellow. */
function pluck(freq: number, t: number, gain = 0.12): void {
  const c = ctx!;
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = freq;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(freq * 8, t);
  lp.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.4);
  const g = envGain(t, 0.004, gain, 0.01, 0.9);
  osc.connect(lp).connect(g);
  toMusic(g, 0.4);
  osc.start(t);
  osc.stop(t + 1.1);
}

/** Tanbur frame drum: a deep "dum" or a dry rim "tek". */
function tanbur(kind: 'D' | 't', t: number): void {
  const c = ctx!;
  if (kind === 'D') {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.25);
    const g = envGain(t, 0.005, 0.55, 0.02, 0.3);
    osc.connect(g);
    toMusic(g, 0.15);
    osc.start(t);
    osc.stop(t + 0.4);
  }
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * 0.08), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = kind === 'D' ? 'lowpass' : 'highpass';
  f.frequency.value = kind === 'D' ? 600 : 2500;
  const g = c.createGain();
  g.gain.value = kind === 'D' ? 0.25 : 0.18;
  src.connect(f).connect(g);
  toMusic(g, 0.2);
  src.start(t);
}

/** Żafżafa friction drum: a low rubbed growl that swells and fades. */
function zafzafa(t: number, beat: number): void {
  const c = ctx!;
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(52, t);
  osc.frequency.linearRampToValueAtTime(64, t + beat * 0.8);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 260;
  lp.Q.value = 6;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.35, t + beat * 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t + beat * 0.95);
  osc.connect(lp).connect(g);
  toMusic(g, 0.1);
  osc.start(t);
  osc.stop(t + beat);
}

/** Żaqq drone: the bag's two drones on the root and fifth, breathing slowly. */
function startDrone(theme: Theme): AudioNode[] {
  const c = ctx!;
  const t = c.currentTime;
  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(0.09 * theme.drone + 0.0001, t + 2);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 650;
  const breathe = c.createOscillator();
  const breatheDepth = c.createGain();
  breathe.frequency.value = 0.25;
  breatheDepth.gain.value = 0.02 * theme.drone;
  breathe.connect(breatheDepth).connect(out.gain);
  lp.connect(out);
  toMusic(out, 0.3);
  const nodes: AudioNode[] = [out, breathe];
  for (const semis of [-24, -17]) {
    const osc = c.createOscillator();
    osc.type = theme.melodyVoice === 'chanter' ? 'sawtooth' : 'triangle';
    osc.frequency.value = midiToHz(theme.root + semis);
    osc.connect(lp);
    osc.start(t);
    nodes.push(osc);
  }
  breathe.start(t);
  return nodes;
}

function stopDrone(nodes: readonly AudioNode[]): void {
  const c = ctx;
  if (!c) return;
  const out = nodes[0] as GainNode;
  out.gain.cancelScheduledValues(c.currentTime);
  out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), c.currentTime);
  out.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.8);
  for (const n of nodes.slice(1)) (n as OscillatorNode).stop(c.currentTime + 0.9);
}

function chordTones(theme: Theme, bar: number): number[] {
  const root = theme.chords[bar % theme.chords.length]!;
  return [root, root + 2, root + 4].map((d) =>
    midiToHz(degreeToMidi(theme.root - 12, theme.scale, d)),
  );
}

/** Guitar, drums and friction drum for one eighth note. */
function playStep(s: Sequencer, t: number): void {
  const { theme } = s;
  const eighth = 30 / theme.bpm;
  const bar = Math.floor(s.step / 8);
  const pos = s.step % 8;
  const tones = chordTones(theme, bar);
  if (theme.guitar === 'strum') {
    if (STRUM_STEPS.includes(pos)) {
      const down = pos !== 3;
      (down ? tones : [...tones].reverse()).forEach((f, i) =>
        pluck(f, t + i * 0.018, pos === 0 ? 0.11 : 0.08),
      );
      pluck(tones[0]! / 2, t, pos === 0 ? 0.1 : 0.05);
    }
  } else {
    const arp = [0, 1, 2, 1, 2, 0, 1, 2];
    pluck(tones[arp[pos]!]! * (pos === 4 ? 2 : 1), t, 0.09);
    if (pos === 0) pluck(tones[0]! / 2, t, 0.09);
  }
  const hit = theme.drums?.[pos];
  if (hit === 'D' || hit === 't') tanbur(hit, t);
  if (theme.friction.includes(pos)) zafzafa(t, eighth * 2);
}

function playNote(s: Sequencer, t: number): number {
  const { theme } = s;
  const beat = 60 / theme.bpm;
  const phrase = theme.phrases[theme.order[s.orderIdx]!]!;
  const [degree, beats] = phrase[s.noteIdx]!;
  const dur = beats * beat;
  if (degree !== null) {
    const freq = midiToHz(degreeToMidi(theme.root, theme.scale, degree));
    if (theme.melodyVoice === 'flute') flute(freq, t, dur * 0.95);
    else {
      const grace =
        beats >= 1 ? midiToHz(degreeToMidi(theme.root, theme.scale, degree + 1)) : undefined;
      chanter(freq, t, dur * 0.92, grace);
    }
  }
  s.noteIdx += 1;
  if (s.noteIdx >= phrase.length) {
    s.noteIdx = 0;
    s.orderIdx = (s.orderIdx + 1) % theme.order.length;
  }
  return dur;
}

function schedule(): void {
  const s = seq;
  const c = ctx;
  if (!s || !c || c.state !== 'running') return;
  const horizon = c.currentTime + LOOKAHEAD;
  // After a long pause, don't try to catch up on missed notes.
  if (s.nextStepTime < c.currentTime - 0.5) s.nextStepTime = s.nextNoteTime = c.currentTime + 0.05;
  while (s.nextStepTime < horizon) {
    playStep(s, s.nextStepTime);
    s.step += 1;
    s.nextStepTime += 30 / s.theme.bpm;
  }
  while (s.nextNoteTime < horizon) s.nextNoteTime += playNote(s, s.nextNoteTime);
}

// ── Recorded tracks ───────────────────────────────────────────

interface Track {
  readonly url: string;
  readonly el: HTMLAudioElement;
  readonly gain: GainNode;
  failed: boolean;
}

const tracks = new Map<string, Track>();
let active: Track | null = null;

function trackOf(url: string): Track | null {
  const c = audio();
  if (!c || !trackGain) return null;
  let t = tracks.get(url);
  if (t) return t;
  const el = new Audio();
  el.loop = true;
  el.preload = 'auto';
  el.crossOrigin = 'anonymous';
  el.src = url;
  const gain = c.createGain();
  gain.gain.value = 0;
  // Routed through Web Audio so the fades and the volume slider also work on iOS.
  c.createMediaElementSource(el).connect(gain).connect(trackGain);
  const track: Track = { url, el, gain, failed: false };
  el.addEventListener('error', () => {
    track.failed = true;
    // The file couldn't load (offline before it was ever cached): use the generated theme.
    if (active === track) {
      active = null;
      startSequencer(currentMood);
    }
  });
  tracks.set(url, track);
  // Fetch the whole file once so the service worker caches it for offline play.
  if (!url.startsWith('data:')) void fetch(url).catch(() => undefined);
  t = track;
  return t;
}

function playElement(t: Track): void {
  if (document.hidden) return;
  // Before the first tap this is refused; unlockAudio() tries again.
  void t.el.play().catch(() => undefined);
}

function fadeTo(t: Track, value: number): void {
  const c = ctx!;
  const now = c.currentTime;
  t.gain.gain.cancelScheduledValues(now);
  t.gain.gain.setValueAtTime(t.gain.gain.value, now);
  t.gain.gain.linearRampToValueAtTime(value, now + CROSSFADE_S);
}

function fadeOutActive(): void {
  const old = active;
  active = null;
  if (!old) return;
  fadeTo(old, 0);
  // Paused (not reset) after the fade, so the piano can carry on from here later.
  setTimeout(
    () => {
      if (active !== old) old.el.pause();
    },
    CROSSFADE_S * 1000 + 50,
  );
}

function stopSequencer(): void {
  if (!seq) return;
  clearInterval(seq.timer);
  stopDrone(seq.drone);
  seq = null;
}

function startSequencer(mood: Mood): void {
  stopSequencer();
  if (mood === 'none' || !audio()) return;
  const theme = THEMES[mood];
  const start = ctx!.currentTime + 0.1;
  seq = {
    theme,
    step: 0,
    nextStepTime: start,
    orderIdx: 0,
    noteIdx: 0,
    nextNoteTime: start + (8 * 30) / theme.bpm, // the guitar plays a bar alone first
    drone: startDrone(theme),
    timer: setInterval(schedule, 50),
  };
}

/**
 * Switches the music for a mood: the piano outside battle, the charge in battle, crossfading.
 * Safe to call before audio is unlocked.
 */
export function music(mood: Mood): void {
  if (mood === currentMood) return;
  const previous = currentMood;
  currentMood = mood;
  const url = trackFor(mood);
  const next = url ? trackOf(url) : null;
  if (!next || next.failed) {
    fadeOutActive();
    startSequencer(mood);
    return;
  }
  stopSequencer();
  if (active === next) return;
  fadeOutActive();
  active = next;
  if (restartsOnEntry(previous, mood)) next.el.currentTime = 0;
  playElement(next);
  fadeTo(next, 1);
}

/** The track playing now, if any (for tests and debugging). */
export function currentTrack(): string | null {
  return active?.url ?? null;
}
