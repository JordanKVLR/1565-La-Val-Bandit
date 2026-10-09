import type { JSX } from 'preact';
import { t } from '../../i18n';

/**
 * Original inline-SVG icons for the armoury: weapons, frames (unit bodies), charms and amulets.
 * Tier is readable without colour: common = thin single frame, fine = double frame + corner
 * studs, masterwork = ornate frame with Maltese-cross corners and a soft gold halo.
 */

export type IconKind = 'weapon' | 'frame' | 'charm' | 'amulet';
export type WeaponIconType = 'blade' | 'polearm' | 'blunt' | 'firearm' | 'explosive';
export type FrameIconModel =
  | 'knight'
  | 'militia'
  | 'gunner'
  | 'janissary'
  | 'sipahi'
  | 'corsair'
  | 'machine'
  | 'tower'
  | 'barge';
export type Tier = 'common' | 'fine' | 'masterwork';

export interface ItemIconProps {
  kind: IconKind;
  variant: string;
  tier?: Tier;
  size?: number;
  title?: string;
}

const C = {
  ink: '#1b1410',
  plate: '#2a1f18',
  gold: '#c9a45c',
  goldLight: '#ead08f',
  parchment: '#f4ead2',
  limestone: '#dcc99a',
  stoneLine: '#9c8659',
  steel: '#c3cad2',
  steelDark: '#7f8893',
  wood: '#9a643a',
  woodDark: '#6a4224',
  red: '#c0442f',
  ember: '#e8792c',
  flame: '#f6c04a',
  olive: '#8fa448',
  oliveDark: '#5d6f2a',
  fruit: '#7c5a8c',
  blue: '#4b86bf',
  coral: '#e2705c',
  skin: '#cf9d72',
  straw: '#dbb866',
  cloth: '#8b5e3c',
  copper: '#b0703f',
} as const;

/** Stroke shorthand. */
function s(stroke: string, width: number): { stroke: string; 'stroke-width': number } {
  return { stroke, 'stroke-width': width };
}

const ROUND = { 'stroke-linecap': 'round', 'stroke-linejoin': 'round' } as const;

/** Path shorthand: d, fill, optional stroke colour, width and round caps/joins. */
function P(d: string, fill: string, stroke?: string, width = 1, round = false): JSX.Element {
  if (!stroke) return <path d={d} fill={fill} />;
  return <path d={d} fill={fill} {...s(stroke, width)} {...(round ? ROUND : {})} />;
}

/** Rect shorthand: x, y, w, h, fill, corner radius, optional stroke colour and width. */
function R(
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  rx = 0,
  stroke?: string,
  width = 1,
): JSX.Element {
  const box = { x, y, width: w, height: h, rx, fill };
  return stroke ? <rect {...box} {...s(stroke, width)} /> : <rect {...box} />;
}

/** Eight-pointed Maltese cross centred on (cx, cy) with arm length s. */
function maltesePath(cx: number, cy: number, s: number): string {
  const arms: string[] = [];
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const p = (dx: number, dy: number): string => {
      const x = cx + dx * Math.cos(a) - dy * Math.sin(a);
      const y = cy + dx * Math.sin(a) + dy * Math.cos(a);
      return `${x.toFixed(2)} ${y.toFixed(2)}`;
    };
    arms.push(`M${p(0, 0)}L${p(-0.55 * s, -s)}L${p(0, -0.68 * s)}L${p(0.55 * s, -s)}Z`);
  }
  return arms.join('');
}

// ---------------------------------------------------------------- tier frames

function TierFrame({ tier }: { tier: Tier }): JSX.Element {
  if (tier === 'common') {
    return (
      <rect x="3.5" y="3.5" width="57" height="57" rx="5" fill="none" {...s('#8c7b60', 1.2)} />
    );
  }
  if (tier === 'fine') {
    const studs: [number, number][] = [
      [6.5, 6.5],
      [57.5, 6.5],
      [6.5, 57.5],
      [57.5, 57.5],
    ];
    return (
      <g>
        <rect x="2.5" y="2.5" width="59" height="59" rx="5" fill="none" {...s(C.steel, 1.5)} />
        <rect x="5.5" y="5.5" width="53" height="53" rx="3" fill="none" {...s(C.steel, 0.9)} />
        {studs.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" fill={C.steel} {...s(C.ink, 0.8)} />
        ))}
      </g>
    );
  }
  const corners: [number, number][] = [
    [8, 8],
    [56, 8],
    [8, 56],
    [56, 56],
  ];
  return (
    <g>
      {/* soft halo: wide translucent strokes, no filters needed */}
      <rect
        x="3"
        y="3"
        width="58"
        height="58"
        rx="6"
        fill="none"
        stroke={C.gold}
        stroke-opacity="0.18"
        stroke-width="6"
      />
      <rect
        x="3"
        y="3"
        width="58"
        height="58"
        rx="6"
        fill="none"
        stroke={C.gold}
        stroke-opacity="0.3"
        stroke-width="3.5"
      />
      <rect x="2.5" y="2.5" width="59" height="59" rx="6" fill="none" {...s(C.goldLight, 2)} />
      <rect
        x="6"
        y="6"
        width="52"
        height="52"
        rx="3"
        fill="none"
        {...s(C.gold, 1)}
        stroke-dasharray="1.6 1.6"
      />
      {corners.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="5.4" fill={C.ink} {...s(C.gold, 0.9)} />
          <path d={maltesePath(x, y, 4.4)} fill={C.goldLight} />
        </g>
      ))}
      {/* midpoint lozenges along each edge */}
      {P(
        'M32 0.8 34.2 3 32 5.2 29.8 3ZM32 58.8 34.2 61 32 63.2 29.8 61ZM0.8 32 3 29.8 5.2 32 3 34.2ZM58.8 32 61 29.8 63.2 32 61 34.2Z',
        C.goldLight,
      )}
    </g>
  );
}

// ---------------------------------------------------------------- weapons

function Weapon({ type }: { type: string }): JSX.Element {
  switch (type) {
    case 'polearm':
      return (
        <g transform="rotate(40 32 32)">
          {R(30.8, 24, 2.4, 33, C.wood, 1, C.woodDark, 0.6)}
          {P('M32 6 36.2 16 34 25 30 25 27.8 16Z', C.steel, C.steelDark, 0.8)}
          {P('M30 21 21 16 24.5 26 30 26.5Z', C.steel, C.steelDark, 0.8)}
          {P('M34 21 43 16 39.5 26 34 26.5Z', C.steel, C.steelDark, 0.8)}
          <line x1="32" y1="9" x2="32" y2="23" {...s(C.steelDark, 0.8)} />
          {R(29.3, 25.5, 5.4, 3.2, C.gold, 1)}
          <path d="M31 29 28 35M33 29 36 35" {...s(C.red, 1.4)} {...ROUND} />
        </g>
      );
    case 'blunt':
      return (
        <g>
          <circle cx="38" cy="28" r="15" fill={C.woodDark} {...s(C.gold, 1.6)} />
          <circle cx="38" cy="28" r="10.5" fill="none" {...s(C.wood, 1.2)} />
          <circle cx="38" cy="28" r="3.6" fill={C.steel} {...s(C.steelDark, 0.8)} />
          <g transform="rotate(-35 26 34)">
            {R(24.8, 29, 2.4, 27, C.wood, 1, C.ink, 0.6)}
            {R(24.2, 47, 3.6, 7, C.cloth, 1, C.ink, 0.5)}
            {P('M22 17 16.5 20.5 16.5 27.5 22 30Z', C.steel, C.steelDark, 0.8)}
            {P('M30 17 35.5 20.5 35.5 27.5 30 30Z', C.steel, C.steelDark, 0.8)}
            {R(22, 16, 8, 15, C.steel, 2, C.steelDark, 0.9)}
            <line x1="26" y1="17" x2="26" y2="30" {...s(C.steelDark, 0.9)} />
            <circle cx="26" cy="14" r="2.2" fill={C.steel} {...s(C.steelDark, 0.7)} />
            {R(23.6, 30.5, 4.8, 2.4, C.gold, 1)}
          </g>
        </g>
      );
    case 'firearm':
      return (
        <g transform="rotate(-18 32 33)">
          {P(
            'M6 31 14 30 24 28.5 52 28.5 52 32 27 33 19 36.5 9 42 6.5 41Z',
            C.wood,
            C.woodDark,
            0.9,
            true,
          )}
          {R(22, 25.6, 37, 3.2, C.steel, 1, C.steelDark, 0.6)}
          {R(56.5, 25, 2.8, 4.4, C.steelDark, 0.6)}
          {R(27, 27.3, 5, 2.2, C.gold, 0)}
          {P('M30 33 C26 36 33 39 28 44', 'none', C.gold, 1.8, true)}
          {P('M29.5 28 C26 25 28.5 21 25 19', 'none', C.gold, 1.8, true)}
          <circle cx="24.6" cy="18.4" r="1.9" fill={C.ember} />
          <circle cx="24.6" cy="18.4" r="3.4" fill={C.flame} fill-opacity="0.3" />
          <path d="M10 33.5 18 32.5" {...s(C.woodDark, 0.8)} />
        </g>
      );
    case 'explosive':
      return (
        <g transform="translate(-3 4)">
          <circle cx="29" cy="38" r="15" fill={C.steelDark} {...s(C.ink, 1)} />
          {P('M14.5 40 Q29 46 43.5 40', 'none', C.ink, 1.2)}
          {P('M20 30 Q23 25 29 24', 'none', C.steel, 2.4, true)}
          <rect
            x="30"
            y="19"
            width="7"
            height="6"
            rx="1"
            fill={C.gold}
            transform="rotate(35 33.5 22)"
          />
          {P('M36 19 Q38 12 44 12 Q48 12 49 8', 'none', C.parchment, 1.5, true)}
          {P(
            'M50 2 51.4 5.6 55 4.6 52.6 7.6 56 9.6 52 9.8 52.4 13.6 50 10.6 47.4 13 48 9.4 44.4 8.4 47.8 6.8 46.6 3.4 49.6 5.2Z',
            C.flame,
            C.ember,
            0.6,
          )}
          <circle cx="50.2" cy="8.2" r="1.6" fill={C.parchment} />
        </g>
      );
    case 'blade':
    default:
      return (
        <g transform="rotate(45 32 32)">
          {P('M32 6 35.4 12 35.4 39 28.6 39 28.6 12Z', C.steel, C.steelDark, 0.8)}
          <line x1="32" y1="12" x2="32" y2="36" {...s(C.steelDark, 1.1)} />
          {R(21.5, 38.5, 21, 3.6, C.gold, 1.6, C.ink, 0.5)}
          {R(30.2, 42, 3.6, 10, C.cloth, 1, C.ink, 0.5)}
          <circle cx="32" cy="54.6" r="3" fill={C.gold} {...s(C.ink, 0.5)} />
        </g>
      );
  }
}

// ---------------------------------------------------------------- frames

function Shoulders({ fill }: { fill: string }): JSX.Element {
  return <path d="M12 58 Q12 45 32 43 Q52 45 52 58Z" fill={fill} {...s(C.ink, 0.8)} />;
}

function Face({ cy, r = 7 }: { cy: number; r?: number }): JSX.Element {
  return (
    <g>
      <rect x="29" y={cy + r - 2} width="6" height="6" fill={C.skin} />
      <circle cx="32" cy={cy} r={r} fill={C.skin} {...s(C.ink, 0.6)} />
    </g>
  );
}

function Frame({ model }: { model: string }): JSX.Element {
  switch (model) {
    case 'knight':
      return (
        <g>
          <Shoulders fill={C.steelDark} />
          {P('M20 45 Q32 40 44 45 L44 49 Q32 45 20 49Z', C.steel)}
          {P('M32 15 Q38 6 48 8 Q42 10 40 16 Q44 14 47 16 Q40 18 36 20Z', C.red)}
          {P('M22 42 V27 Q22 14 32 14 Q42 14 42 27 V42 Q32 46 22 42Z', C.steel, C.steelDark, 1)}
          <path d="M32 14 V43" {...s(C.steelDark, 0.9)} />
          {R(23.5, 27, 17, 2.4, C.ink, 1)}
          <path d="M26 34h1M29 35h1M34 35h1M37 34h1" {...s(C.ink, 1.4)} {...ROUND} />
        </g>
      );
    case 'militia':
      return (
        <g>
          <Shoulders fill={C.cloth} />
          {P('M26 44 32 50 38 44', 'none', C.parchment, 1.2)}
          <Face cy={34} r={8} />
          <path d="M28.5 33.5h1.5M34 33.5h1.5" {...s(C.ink, 1.3)} {...ROUND} />
          <ellipse cx="32" cy="26" rx="17" ry="3.8" fill={C.straw} {...s(C.woodDark, 0.7)} />
          {P('M23.5 26 Q23.5 15 32 15 Q40.5 15 40.5 26Z', C.straw, C.woodDark, 0.7)}
          {R(23.6, 22.5, 16.8, 2.4, C.red, 0)}
          <path
            d="M18 27 Q32 30 46 27"
            fill="none"
            {...s(C.woodDark, 0.6)}
            stroke-dasharray="1.5 1.2"
          />
        </g>
      );
    case 'gunner':
      return (
        <g>
          <Shoulders fill={C.woodDark} />
          <path d="M18 50 46 46" {...s(C.gold, 2)} />
          <Face cy={37} />
          <path d="M29 37h1.5M33.5 37h1.5" {...s(C.ink, 1.3)} {...ROUND} />
          {P('M24 18 Q32 4 40 18Z', C.steel, C.steelDark, 0.8)}
          {P('M22 29 Q22 16 32 16 Q42 16 42 29Z', C.steel, C.steelDark, 0.8)}
          {P('M12 23 Q32 35 52 23 Q47 32 32 32 Q17 32 12 23Z', C.steel, C.steelDark, 0.8)}
          <circle cx="24" cy="27" r="0.9" fill={C.gold} />
          <circle cx="40" cy="27" r="0.9" fill={C.gold} />
        </g>
      );
    case 'janissary':
      return (
        <g>
          <Shoulders fill={C.blue} />
          <path d="M32 43 V58" {...s(C.gold, 1.2)} />
          <Face cy={39} />
          {P('M28 41 Q32 44 36 41', 'none', C.ink, 1.2)}
          {P('M38 13 Q49 18 47 44 L41.5 42 Q43.5 24 38 18Z', '#d6c9ac', C.stoneLine, 0.7)}
          {P('M24.5 34 L25.5 12 Q32 7 38.5 12 L39.5 34Z', C.parchment, C.stoneLine, 0.8)}
          {R(24, 30.5, 16, 3.6, C.gold, 1)}
          {P('M30.5 30 V21 Q32 18 33.5 21 V30Z', C.goldLight, C.gold, 0.6)}
        </g>
      );
    case 'sipahi':
      return (
        <g>
          <Shoulders fill={C.red} />
          {P('M21 32 Q20 46 32 47 Q44 46 43 32', C.steelDark, C.ink, 0.6)}
          <Face cy={37} r={6.5} />
          <path d="M28.5 36h1.5M34 36h1.5" {...s(C.ink, 1.3)} {...ROUND} />
          <path d="M32 15 V5" {...s(C.steel, 2)} stroke-linecap="round" />
          <circle cx="32" cy="12.5" r="1.6" fill={C.gold} />
          {P('M21 31 Q21 17 32 15 Q43 17 43 31Z', C.steel, C.steelDark, 0.8)}
          {P('M26 30 Q26 20 32 16 M38 30 Q38 20 32 16', 'none', C.steelDark, 0.8)}
          <ellipse cx="32" cy="30" rx="13.5" ry="4" fill={C.parchment} {...s(C.stoneLine, 0.7)} />
          {P('M20 29 Q32 34 44 29M21 31.5 Q32 35.5 43 31.5', 'none', C.red, 0.8)}
          {R(31, 31, 2, 9, C.steel, 0.8, C.steelDark, 0.4)}
        </g>
      );
    case 'corsair':
      return (
        <g>
          <Shoulders fill="#3f5a4a" />
          {P('M22 46 32 52 42 46', 'none', C.parchment, 1.2)}
          <Face cy={35} r={8} />
          <path d="M33.5 34.5h2" {...s(C.ink, 1.3)} {...ROUND} />
          <path d="M25 31 39 37" {...s(C.ink, 1)} />
          <ellipse cx="29" cy="34.5" rx="2.4" ry="2" fill={C.ink} />
          {P('M27 40 Q32 46 37 40 Q32 43 27 40Z', C.ink)}
          {P('M23 33 Q22 20 32 20 Q42 20 41 33 Q37 27 32 27 Q27 27 23 33Z', C.red, C.ink, 0.7)}
          {P('M40 26 L49 29 L47 35 L42.5 30Z', C.red, C.ink, 0.7)}
          <circle cx="24.2" cy="38.5" r="1.6" fill="none" {...s(C.gold, 1)} />
        </g>
      );
    case 'machine':
      return (
        <g>
          <Shoulders fill={C.steelDark} />
          <path d="M18 52h28" {...s(C.ink, 0.8)} stroke-dasharray="1 2.5" />
          {R(35, 7, 4.5, 10, C.steelDark, 0, C.ink, 0.6)}
          <circle cx="40" cy="5" r="2.2" fill="#8f8a83" fill-opacity="0.7" />
          <circle cx="44" cy="3.5" r="1.5" fill="#8f8a83" fill-opacity="0.5" />
          {R(21, 15, 22, 27, C.copper, 5, C.ink, 1)}
          <path d="M21 21h22M21 36h22" {...s(C.woodDark, 0.9)} />
          {[24, 28, 32, 36, 40].map((x) => (
            <circle key={x} cx={x} cy="18" r="0.8" fill={C.goldLight} />
          ))}
          <circle cx="32" cy="28.5" r="7.5" fill={C.flame} fill-opacity="0.25" />
          <circle cx="32" cy="28.5" r="4.6" fill={C.ember} {...s(C.ink, 0.8)} />
          <circle cx="32" cy="28.5" r="1.8" fill={C.parchment} />
          <path d="M25 39h14" {...s(C.ink, 1.6)} stroke-dasharray="2 1.5" />
        </g>
      );
    case 'tower':
      return (
        <g fill="none" stroke={C.wood} {...ROUND}>
          <path d="M19 52 L23 14 H41 L45 52" stroke-width="3" />
          <path d="M21 33 H43 M22 23 H42 M20 43 H44" stroke-width="2" />
          <path
            d="M23 14 L43 52 M41 14 L21 52 M22 23 L42 43 M42 23 L22 43"
            {...s(C.woodDark, 1.2)}
          />
          {P('M21 14 V8 H25 V11 H29 V8 H35 V11 H39 V8 H43 V14Z', C.wood, C.woodDark, 1)}
          <circle cx="21" cy="54" r="4" fill={C.woodDark} {...s(C.gold, 1.2)} />
          <circle cx="43" cy="54" r="4" fill={C.woodDark} {...s(C.gold, 1.2)} />
        </g>
      );
    case 'barge':
      return (
        <g transform="translate(0 -3)">
          {P('M16 32 V18 M16 18 L28 30 H16', C.parchment, C.wood, 1.2)}
          {P('M8 36 H56 L50 48 Q32 52 14 48Z', C.wood, C.woodDark, 1, true)}
          <path d="M10 40 H54 M12 44 H52" {...s(C.woodDark, 0.8)} />
          {R(8, 33.5, 48, 2.5, C.gold, 0)}
          {R(44, 30, 9, 3, C.steelDark, 1)}
          {[20, 28, 36, 44].map((x) => (
            <path
              key={x}
              d={`M${x} 46 L${x - 6} 56`}
              {...s(C.limestone, 1.2)}
              stroke-linecap="round"
            />
          ))}
          {P('M6 56 Q10 53 14 56 T22 56 T30 56 T38 56 T46 56 T54 56 T60 56', 'none', C.blue, 1.4)}
        </g>
      );
    default:
      return (
        <g>
          <Shoulders fill={C.cloth} />
          <Face cy={32} r={9} />
        </g>
      );
  }
}

// ---------------------------------------------------------------- charms

function Pips({ level }: { level: number }): JSX.Element {
  const n = Math.max(1, Math.min(3, level));
  const start = 32 - (n - 1) * 3.5;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <path
          key={i}
          d={`M${start + i * 7} 50.6 l2.6 2.6 -2.6 2.6 -2.6 -2.6Z`}
          fill={C.goldLight}
          {...s(C.ink, 0.6)}
        />
      ))}
    </g>
  );
}

function CharmGlyph({ stat }: { stat: string }): JSX.Element {
  switch (stat) {
    case 'pow':
      return (
        <g>
          {P(
            'M32 9 C38 18 44 22 42 33 C41 41 36 45 32 45 C26 45 21 40 22 32 C23 26 27 24 28 18 C31 22 30 26 33 28 C34 22 33 15 32 9Z',
            C.ember,
            C.red,
            0.8,
          )}
          {P(
            'M32 24 C35 30 38 33 37 38 C36 42 34 43 32 43 C29 43 27 41 27 37 C27 33 30 31 32 24Z',
            C.flame,
          )}
          <ellipse cx="32" cy="46" rx="9" ry="2" fill={C.red} fill-opacity="0.6" />
        </g>
      );
    case 'def':
      return (
        <g>
          {P(
            'M19 12 H24.5 V15 H29.5 V12 H34.5 V15 H39.5 V12 H45 V29 Q45 40 32 47 Q19 40 19 29Z',
            C.limestone,
            C.stoneLine,
            1,
            true,
          )}
          <path
            d="M19 21 H45 M19 29 H45 M22 37 H42 M28 15 V21 M36 21 V29 M28 29 V37 M36 37 V43"
            {...s(C.stoneLine, 0.9)}
          />
          <path d={maltesePath(32, 29, 5)} fill={C.red} />
        </g>
      );
    case 'bas':
      return (
        <g>
          {P('M20 46 Q28 32 44 12', 'none', C.oliveDark, 1.8, true)}
          {(
            [
              [24, 38, -60],
              [29, 31, 30],
              [32, 27, -55],
              [37, 21, 35],
              [40, 17, -50],
              [44, 12, -40],
            ] as const
          ).map(([x, y, r]) => (
            <ellipse
              key={`${x}`}
              cx={x}
              cy={y}
              rx="2.4"
              ry="6"
              transform={`rotate(${r} ${x} ${y}) translate(0 -4)`}
              fill={C.olive}
              {...s(C.oliveDark, 0.6)}
            />
          ))}
          <circle cx="28" cy="40" r="3.4" fill={C.fruit} {...s(C.parchment, 0.8)} />
          <circle cx="36" cy="34" r="3" fill={C.fruit} {...s(C.parchment, 0.8)} />
        </g>
      );
    case 'agl':
      return (
        <g>
          {P('M10 41 H54 L51 46 H13Z', C.blue)}
          {P('M11 38 H53 V41 H11Z', C.red)}
          {P('M16 15 Q32 7 48 17', 'none', C.flame, 2.4, true)}
          {P('M13 26 Q32 12 51 26 Q32 38 13 26Z', C.parchment, C.ink, 1.2)}
          <circle cx="32" cy="25.5" r="6.4" fill={C.blue} {...s(C.ink, 0.8)} />
          <circle cx="32" cy="25.5" r="3" fill={C.ink} />
          <circle cx="33.6" cy="23.8" r="1" fill={C.parchment} />
          {P('M22 32 Q20 36 23 37', 'none', C.flame, 1.6, true)}
        </g>
      );
    default:
      return <Gem />;
  }
}

function Gem(): JSX.Element {
  return (
    <g {...s(C.ink, 0.8)} stroke-linejoin="round">
      {P('M22 20 H42 L48 28 L32 46 L16 28Z', C.blue)}
      {P(
        'M16 28 H48 M22 20 L27 28 L32 46 L37 28 L42 20 M27 28 L32 20 L37 28',
        'none',
        C.parchment,
        0.7,
      )}
    </g>
  );
}

// ---------------------------------------------------------------- amulets

function Amulet({ id }: { id: string }): JSX.Element {
  switch (id) {
    case 'pilgrim-shell':
      return (
        <g>
          {P('M26 46 L21 51 H43 L38 46Z', C.limestone, C.stoneLine, 0.8)}
          {P('M32 48 L16 28 Q18 12 32 11 Q46 12 48 28Z', C.parchment, C.stoneLine, 1, true)}
          {SHELL_RIBS.map(([x, y]) => (
            <path key={x} d={`M32 47 L${x} ${y}`} {...s(C.stoneLine, 0.9)} />
          ))}
          <path d={maltesePath(32, 31, 3.6)} fill={C.red} />
        </g>
      );
    case 'coral-horn':
      return (
        <g>
          <circle cx="28" cy="9" r="3" fill="none" {...s(C.gold, 1.5)} />
          {R(23.5, 12, 9, 4.5, C.gold, 1.2, C.ink, 0.6)}
          {P(
            'M24 16 Q22 32 30 43 Q36 51 46 51 Q37 45 35 34 Q33 24 32.5 16Z',
            C.coral,
            C.red,
            1,
            true,
          )}
          <path
            d="M27 21 Q27 32 32 40"
            fill="none"
            stroke={C.parchment}
            stroke-opacity="0.6"
            stroke-width="1.4"
            stroke-linecap="round"
          />
        </g>
      );
    case 'lace-token':
      return (
        <g fill="none" stroke={C.parchment}>
          <circle cx="32" cy="30" r="17" stroke-width="1.2" stroke-dasharray="1.4 1.6" />
          <circle cx="32" cy="30" r="14" stroke-width="1" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <ellipse
              key={a}
              cx="32"
              cy="21"
              rx="2.8"
              ry="6"
              transform={`rotate(${a} 32 30)`}
              stroke-width="1"
            />
          ))}
          <circle cx="32" cy="30" r="3" fill={C.parchment} />
          <path d="M32 47 V53" {...s(C.gold, 1.4)} />
        </g>
      );
    case 'oath-ring':
      return (
        <g>
          <circle cx="32" cy="36" r="13" fill="none" {...s(C.gold, 4.4)} />
          {R(24, 14, 16, 13, C.gold, 3, C.ink, 0.8)}
          {R(26.5, 16.5, 11, 8, C.red, 1.5)}
          <path d={maltesePath(32, 20.5, 3.4)} fill={C.parchment} />
        </g>
      );
    case 'navigator-medal':
      return (
        <g>
          {P('M25 8 L30 22 H34 L39 8 H34 L32 14 L30 8Z', C.blue, C.ink, 0.6)}
          {P('M30 8 L32 14 L34 8Z', C.red)}
          <circle cx="32" cy="35" r="14" fill={C.gold} {...s(C.ink, 0.9)} />
          <circle cx="32" cy="35" r="11" fill="none" {...s(C.woodDark, 0.8)} />
          {P('M32 25 34 33 42 35 34 37 32 45 30 37 22 35 30 33Z', C.parchment, C.woodDark, 0.6)}
          {P(
            'M32 25 34 33 32 35Z M42 35 34 37 32 35Z M32 45 30 37 32 35Z M22 35 30 33 32 35Z',
            C.woodDark,
          )}
        </g>
      );
    case 'grand-masters-favour':
      return (
        <g>
          {P('M18 12 H46 V30 Q46 43 32 50 Q18 43 18 30Z', C.red, C.goldLight, 1.8, true)}
          <path d={maltesePath(32, 29, 12)} fill={C.parchment} />
          {P('M24 12 L26 7 L29 10 L32 5 L35 10 L38 7 L40 12Z', C.goldLight, C.ink, 0.6)}
        </g>
      );
    default:
      return (
        <g>
          <path d="M32 9 V18" {...s(C.gold, 1.4)} />
          <circle cx="32" cy="33" r="14" fill={C.gold} {...s(C.ink, 0.9)} />
          <circle cx="32" cy="33" r="9" fill={C.plate} />
          <path d={maltesePath(32, 33, 7)} fill={C.goldLight} />
        </g>
      );
  }
}

function Trinket({ kind, id }: { kind: 'charm' | 'amulet'; id: string }): JSX.Element {
  const m = /^charm-(pow|def|bas|agl)-(\d+)$/.exec(id);
  if (m) {
    return (
      <g>
        <CharmGlyph stat={m[1] ?? ''} />
        <Pips level={Number(m[2])} />
      </g>
    );
  }
  if (kind === 'charm' && !AMULET_IDS.has(id)) return <Gem />;
  return <Amulet id={id} />;
}

const SHELL_RIBS: readonly (readonly [number, number])[] = [
  [17, 27],
  [19.5, 19.5],
  [25, 13.5],
  [32, 11.5],
  [39, 13.5],
  [44.5, 19.5],
  [47, 27],
];

const AMULET_IDS = new Set([
  'pilgrim-shell',
  'coral-horn',
  'lace-token',
  'oath-ring',
  'navigator-medal',
  'grand-masters-favour',
]);

// ---------------------------------------------------------------- component

export function ItemIcon(props: ItemIconProps): JSX.Element {
  const { kind, variant, tier = 'common', size = 56, title } = props;
  const label =
    title ??
    t('item.iconLabel', {
      tier: t(`tierWord.${tier}`),
      kind: t(`item.kindLower.${kind}`),
      variant,
    });
  let body: JSX.Element;
  if (kind === 'weapon') body = <Weapon type={variant} />;
  else if (kind === 'frame') body = <Frame model={variant} />;
  else body = <Trinket kind={kind} id={variant} />;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      data-tier={tier}
      style={{ display: 'block', flex: 'none' }}
    >
      <title>{label}</title>
      {R(2, 2, 60, 60, C.plate, 6)}
      {tier === 'masterwork' && <circle cx="32" cy="32" r="22" fill={C.gold} fill-opacity="0.09" />}
      <g transform="translate(3.2 3.2) scale(0.9)">{body}</g>
      <TierFrame tier={tier} />
    </svg>
  );
}
