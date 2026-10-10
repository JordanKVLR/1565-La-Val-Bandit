import type { ExprParams } from './expressions';
import type { Ctx } from './kit';
import type { FaceDef } from './face';

/** A layer painter. `back`, `mid` and `front` draw in head space; `body` in the 200 x 200 design space. */
export type Layer = (c: Ctx, f: FaceDef, e: ExprParams) => void;

export type Setting = 'stone' | 'sky' | 'sea' | 'workshop' | 'tent' | 'night';

export interface CastArt {
  readonly id: string;
  /** The cast colour (cast.json), used for the backdrop tint. */
  readonly accent: string;
  readonly setting: Setting;
  readonly face: FaceDef;
  /** Bust zoom about the bottom centre (default 1.25; tall headwear needs less). */
  readonly zoom?: number;
  /** Behind everything (hair mass, hood, cap flap). */
  readonly back?: Layer;
  readonly body: Layer;
  /** Over the body, behind the head (hair over the shoulders). */
  readonly mid?: Layer;
  /** Hair, headwear and the like, over the face. */
  readonly front?: Layer;
}
