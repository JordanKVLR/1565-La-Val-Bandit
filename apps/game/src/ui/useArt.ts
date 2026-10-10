import { useEffect, useState } from 'preact/hooks';
import { artRevision, onArtChange } from '../render/art';

/**
 * Re-renders the calling component when the art manifest arrives (render/art.ts). The first
 * screens render before it is fetched, so without this a portrait keeps its letter stand-in
 * until something else happens to re-render it. Returns the art revision.
 */
export function useArtRevision(): number {
  const [revision, setRevision] = useState(artRevision);
  useEffect(() => {
    const off = onArtChange(() => setRevision(artRevision()));
    // The manifest may have arrived between the render and this effect.
    setRevision(artRevision());
    return off;
  }, []);
  return revision;
}
