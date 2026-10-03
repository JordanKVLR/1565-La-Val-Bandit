import type { TerrainAtlas } from './terrainTextures';

/**
 * Optional art listed in public/art/manifest.json. Missing entries (or a missing manifest, as in
 * the single-file preview) fall back to placeholders, so art can arrive piece by piece.
 */
export interface ArtManifest {
  readonly portraits: Readonly<Record<string, string>>;
  readonly terrain: Readonly<Record<string, string>>;
  readonly terrainSides: Readonly<Record<string, string>>;
}

const EMPTY: ArtManifest = { portraits: {}, terrain: {}, terrainSides: {} };
let manifest: Promise<ArtManifest> | null = null;
let loaded: ArtManifest = EMPTY;

// The single-file build embeds its art (as data: URLs) because it has no folder to fetch from.
const embedded = (globalThis as { __M1565_ART__?: Partial<ArtManifest> }).__M1565_ART__;
if (embedded) loaded = { ...EMPTY, ...embedded };

const artUrl = (path: string) =>
  path.startsWith('data:') ? path : `${import.meta.env.BASE_URL}art/${path}`;

export function loadArtManifest(): Promise<ArtManifest> {
  if (embedded) return (manifest ??= Promise.resolve(loaded));
  manifest ??= fetch(artUrl('manifest.json'))
    .then((r) => (r.ok ? (r.json() as Promise<Partial<ArtManifest>>) : {}))
    .then((m) => (loaded = { ...EMPTY, ...m }))
    .catch(() => EMPTY);
  return manifest;
}

/**
 * The stand-in portrait for a unit with no character of its own: Order and militia frames get
 * the soldier, Ottoman and corsair frames the janissary, and machines none.
 */
export function genericPortraitId(faction: string, model: string): string | null {
  if (model === 'machine' || model === 'barge' || model === 'tower') return null;
  if (faction === 'order' || faction === 'militia') return 'soldier';
  if (faction === 'ottoman' || faction === 'corsair') return 'janissary';
  return null;
}

/** Portrait image URL for a cast member, if one has been provided. */
export function portraitUrl(castId: string | null | undefined): string | undefined {
  const path = castId ? loaded.portraits[castId] : undefined;
  return path ? artUrl(path) : undefined;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Paints any provided terrain images over the procedural atlas cells. Returns true if any changed. */
export async function applyTerrainArt(atlas: TerrainAtlas): Promise<boolean> {
  const m = await loadArtManifest();
  const jobs = [
    ...Object.entries(m.terrain).map(([id, path]) => ({ id, path, part: 'top' as const })),
    ...Object.entries(m.terrainSides).map(([id, path]) => ({ id, path, part: 'side' as const })),
  ];
  let changed = false;
  for (const job of jobs) {
    const img = await loadImage(artUrl(job.path));
    if (img) {
      atlas.paintImage(job.id, img, job.part);
      changed = true;
    }
  }
  return changed;
}
