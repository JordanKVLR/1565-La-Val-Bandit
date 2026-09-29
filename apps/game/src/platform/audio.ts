import { settings } from '../state/settings';

/**
 * Placeholder audio, synthesised live with Web Audio so the game ships without any sound files.
 * Final recordings can replace these behind the same `sfx()` / `music()` calls.
 */
export type Sfx =
  'tap' | 'select' | 'move' | 'hit' | 'miss' | 'defend' | 'counter' | 'defeat' | 'victory' | 'loss';
export type Mood = 'none' | 'story' | 'battle';

let ctx: AudioContext | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let musicTimer: ReturnType<typeof setInterval> | null = null;
let currentMood: Mood = 'none';
let step = 0;

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
    applyVolumes();
    settings.subscribe(applyVolumes);
    return ctx;
  } catch {
    return null;
  }
}

function applyVolumes(): void {
  const s = settings.get();
  if (musicGain) musicGain.gain.value = s.musicVolume * 0.18;
  if (sfxGain) sfxGain.gain.value = s.sfxVolume * 0.5;
}

/** Browsers only allow sound after a user gesture; call this from the first tap. */
export function unlockAudio(): void {
  const c = audio();
  if (c && c.state === 'suspended') void c.resume();
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

// Modal scales give a Mediterranean colour without borrowing any real melody.
const SCALES: Record<Exclude<Mood, 'none'>, number[]> = {
  story: [146.8, 164.8, 174.6, 196.0, 220.0, 233.1, 261.6, 293.7], // D dorian-ish
  battle: [146.8, 155.6, 185.0, 196.0, 220.0, 233.1, 277.2, 293.7], // D phrygian dominant
};

/** Simple generative music: a drone, a slow arpeggio and (in battle) a drum pulse. */
export function music(mood: Mood): void {
  if (mood === currentMood) return;
  currentMood = mood;
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
  if (mood === 'none' || !audio()) return;
  const scale = SCALES[mood];
  const beat = mood === 'battle' ? 0.32 : 0.6;
  musicTimer = setInterval(() => {
    if (!ctx || ctx.state !== 'running' || !musicGain) return;
    const i = step++;
    if (i % 8 === 0) tone(scale[0]! / 2, beat * 8, 'sine', 0.5, 0, musicGain);
    const pattern = mood === 'battle' ? [0, 2, 3, 2, 4, 3, 1, 2] : [0, 4, 2, 5, 3, 6, 4, 7];
    const note = scale[(pattern[i % 8]! + (Math.floor(i / 16) % 2) * 2) % scale.length]!;
    tone(note, beat * 1.6, mood === 'battle' ? 'sawtooth' : 'triangle', 0.18, 0, musicGain);
    if (mood === 'battle' && i % 2 === 0) tone(70, 0.15, 'sine', 0.6, 0, musicGain, 40);
  }, beat * 1000);
}
