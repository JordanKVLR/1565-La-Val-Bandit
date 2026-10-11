/**
 * Facial expressions as plain numbers, so they can be blended (a short tween between two
 * moods) and tested. The face renderer (face.ts) turns these into eyelids, brows and a mouth.
 */
export const EXPRESSIONS = [
  'neutral',
  'happy',
  'angry',
  'sad',
  'surprised',
  'determined',
  'smug',
  'worried',
] as const;
export type Expression = (typeof EXPRESSIONS)[number];

export function isExpression(v: unknown): v is Expression {
  return typeof v === 'string' && (EXPRESSIONS as readonly string[]).includes(v);
}

export interface ExprParams {
  /** Eye openness, 1 = normal, >1 wide. */
  open: number;
  /** Upper lid cover, 0..0.7 (fraction of the eye). */
  lid: number;
  /** Lid slant: + angry (inner end low), - sad (inner end high). */
  slant: number;
  /** Lower lid raised (smiling squint), 0..1. */
  lower: number;
  /** Pupil scale. */
  pupil: number;
  /** Gaze, -1..1. */
  gx: number;
  gy: number;
  /** Brow lift in design units (negative = raised). */
  brow: number;
  /** Brow tilt: + inner end down (angry), - inner end up (sad). */
  tilt: number;
  /** Extra lift of the right brow (negative = raised) for the sceptical look. */
  browR: number;
  /** Mouth half-width scale. */
  mw: number;
  /** Mouth corner heights (positive = down) left and right of the viewer. */
  cl: number;
  cr: number;
  /** How far the middle of the lips sags below the corner line (negative = rises). */
  curve: number;
  /** Mouth opening depth. */
  mopen: number;
  /** Roundness of an open mouth, 0.4 lens .. 1 round. */
  k: number;
  teeth: number;
  tongue: number;
  blush: number;
  sweat: number;
  vein: number;
  tear: number;
  /** Head roll in degrees (positive = clockwise), vertical offset and shoulder drop. */
  tiltDeg: number;
  dy: number;
  shoulders: number;
}

export const NEUTRAL: ExprParams = {
  open: 1,
  lid: 0.04,
  slant: 0,
  lower: 0,
  pupil: 1,
  gx: 0,
  gy: 0,
  brow: 0,
  tilt: 0,
  browR: 0,
  mw: 1,
  cl: -0.4,
  cr: -0.4,
  curve: 1.2,
  mopen: 0,
  k: 0.5,
  teeth: 0,
  tongue: 0,
  blush: 0,
  sweat: 0,
  vein: 0,
  tear: 0,
  tiltDeg: 0,
  dy: 0,
  shoulders: 0,
};

const x = (o: Partial<ExprParams>): ExprParams => ({ ...NEUTRAL, ...o });

export const EXPR: Readonly<Record<Expression, ExprParams>> = {
  neutral: NEUTRAL,
  happy: x({
    open: 0.95,
    lid: 0,
    slant: -0.1,
    lower: 0.6,
    pupil: 1.12,
    brow: -2.5,
    tilt: -0.15,
    mw: 1.18,
    cl: -4.2,
    cr: -4.2,
    curve: 4.4,
    mopen: 4.4,
    k: 0.62,
    teeth: 1,
    tongue: 0.7,
    blush: 0.6,
    tiltDeg: 3,
    dy: -1,
  }),
  angry: x({
    open: 0.96,
    lid: 0.28,
    slant: 0.6,
    lower: 0.12,
    pupil: 0.82,
    brow: 1.6,
    tilt: 0.85,
    mw: 1.02,
    cl: 2.6,
    cr: 2.6,
    curve: -2,
    mopen: 4.6,
    k: 0.85,
    teeth: 1,
    vein: 1,
    dy: 1.6,
    shoulders: -1.5,
  }),
  sad: x({
    open: 0.9,
    lid: 0.22,
    slant: -0.55,
    pupil: 1.18,
    gy: 0.55,
    brow: -1,
    tilt: -0.85,
    mw: 0.82,
    cl: 2.8,
    cr: 2.8,
    curve: -3,
    tear: 1,
    tiltDeg: -4,
    dy: 2.2,
    shoulders: 3,
  }),
  surprised: x({
    open: 1.32,
    lid: 0,
    pupil: 0.6,
    brow: -5.8,
    tilt: -0.1,
    mw: 0.52,
    cl: 0,
    cr: 0,
    curve: 0,
    mopen: 8.5,
    k: 1.05,
    tongue: 0.35,
    sweat: 0.7,
    dy: -2.4,
    shoulders: -3,
  }),
  determined: x({
    open: 0.96,
    lid: 0.14,
    slant: 0.32,
    pupil: 0.95,
    gy: -0.12,
    brow: 0.6,
    tilt: 0.5,
    mw: 1.05,
    cl: 0.8,
    cr: 0.8,
    curve: 0.1,
    dy: 1,
    shoulders: -1,
  }),
  smug: x({
    open: 0.86,
    lid: 0.36,
    slant: 0.08,
    lower: 0.18,
    pupil: 0.95,
    gx: 0.6,
    brow: -0.4,
    tilt: 0.12,
    browR: -3.2,
    mw: 1.08,
    cl: 1,
    cr: -4.6,
    curve: 1.6,
    tiltDeg: -3.5,
    dy: -0.5,
  }),
  worried: x({
    open: 1.06,
    lid: 0,
    slant: -0.38,
    pupil: 0.92,
    gy: 0.15,
    brow: -2.2,
    tilt: -0.95,
    mw: 0.88,
    cl: 1.2,
    cr: 1.2,
    curve: -1.2,
    mopen: 1.6,
    k: 0.5,
    sweat: 1,
    dy: 1,
    tiltDeg: 2,
  }),
};

export function lerpExpr(a: ExprParams, b: ExprParams, t: number): ExprParams {
  const out = { ...a };
  for (const k of Object.keys(a) as (keyof ExprParams)[]) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

// ── choosing an expression for a line of dialogue ─────────────────────────────────────────────

/** Speakers who tend to answer a shout with anger rather than alarm. */
const HOT = new Set([
  'turgut',
  'mustafa',
  'piali',
  'yusuf',
  'janissary',
  'soldier',
  'luis',
  'rozi',
  'anastagi',
  'valette',
]);
/** Speakers who tend to look worried when unsure. */
const TIMID = new Set(['villager', 'villager-man', 'ninu', 'deniz']);

const has = (s: string, words: readonly string[]) => words.some((w) => s.includes(w));

const ANGRY = [
  'damn',
  'curse',
  'traitor',
  'coward',
  'dog',
  'die ',
  'kill',
  'burn',
  'fool',
  'enough',
  'how dare',
  'insolen',
  'infidel',
  'heretic',
  'liar',
  'never!',
  'get out',
  'silence',
  'impossible',
];
const SAD = [
  'sorry',
  'dead',
  'died',
  'death',
  'lost',
  'gone',
  'mourn',
  'alas',
  'grave',
  'forgive',
  'weep',
  'tears',
  'buried',
  'grief',
  'farewell',
  'goodbye',
  'too late',
  'remember them',
  'widow',
  'orphan',
  'wept',
];
const HAPPY = [
  'thank',
  'laugh',
  'haha',
  'ha!',
  'well done',
  'victory',
  'victorious',
  'welcome',
  'blessed',
  'delight',
  'wonderful',
  'glad',
  'good news',
  'celebrate',
  'cheer',
  'joy',
  'at last',
  'we did it',
  'my friend',
  'hooray',
  'bravo',
  'smile',
];
const DETERMINED = [
  'we hold',
  'will hold',
  'we will',
  "we'll",
  'i will',
  "i'll",
  'i swear',
  'vow',
  'must',
  'stand',
  'to arms',
  'forward',
  'fight',
  'defend',
  'no surrender',
  'for the order',
  'for malta',
  'ready',
  'shall not',
  'not yield',
  'to the walls',
  'together',
  'charge',
];
const SMUG = [
  'of course',
  'naturally',
  'as expected',
  'told you',
  'i knew',
  'clever',
  'amusing',
  'how quaint',
  'perhaps you',
  'indeed',
  'obviously',
  'did you really',
  'you think',
  'cute',
  'pity',
];
const WORRIED = [
  'afraid',
  'worry',
  'worried',
  'fear',
  'nervous',
  'what if',
  'how many',
  'too many',
  'they are coming',
  'are coming',
  'trouble',
  'careful',
  'please',
  'hurry',
  'be careful',
  'dangerous',
  'help',
  'lost us',
];
const SURPRISED = [
  'what?',
  'impossible?',
  'you?',
  'how?',
  'behind you',
  'look out',
  'watch out',
  'they came',
  'already',
  'unbelievable',
  'incredible',
  'by all the saints',
  'madre',
  'sweet mary',
];

/**
 * A plausible expression for a line, from its punctuation and a few keywords. Deterministic and
 * cheap: the same text and speaker always give the same face. Narration (no speaker) is neutral.
 */
export function expressionForLine(text: string, speakerId?: string | null): Expression {
  const raw = text.trim();
  if (!raw) return 'neutral';
  const s = raw.toLowerCase();
  const words = s.split(/\s+/).filter(Boolean).length;
  const hot = speakerId ? HOT.has(speakerId) : false;
  const timid = speakerId ? TIMID.has(speakerId) : false;
  const bang = (raw.match(/!/g) ?? []).length;
  const ask = raw.includes('?');
  const tail = raw.replace(/["')\]»”’\s]+$/u, '');

  if (/[?!]{2,}|!\?|\?!/.test(raw)) return hot && has(s, ANGRY) ? 'angry' : 'surprised';
  if (has(s, ANGRY) && (bang > 0 || hot)) return 'angry';
  if (has(s, SURPRISED)) return 'surprised';
  if (has(s, SAD)) return 'sad';
  if (has(s, HAPPY)) return 'happy';
  if (has(s, SMUG)) return 'smug';
  if (has(s, WORRIED)) return 'worried';
  if (has(s, DETERMINED)) return 'determined';
  if (bang > 0) {
    if (hot) return words <= 6 || bang > 1 ? 'angry' : 'determined';
    return words <= 4 ? 'surprised' : 'determined';
  }
  if (ask) {
    if (words <= 8) return timid ? 'worried' : 'surprised';
    return 'neutral';
  }
  if (/(\.\.\.|…)$/.test(tail)) return 'sad';
  return 'neutral';
}
