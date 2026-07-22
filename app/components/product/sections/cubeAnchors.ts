import type {ScentTierId} from '~/lib/scentProfile';

export type CubeAnchorPoint = {
  id: ScentTierId;
  /** Screen x relative to the annotation stage */
  x: number;
  /** Screen y relative to the annotation stage */
  y: number;
  /** Which column the label sits in */
  side: 'left' | 'right';
};

export type CubeAnchorsMap = Record<ScentTierId, CubeAnchorPoint | null>;

export const EMPTY_CUBE_ANCHORS: CubeAnchorsMap = {
  top: null,
  heart: null,
  base: null,
};

/** Left column for top/base, right for heart — mirrors the anime.js toolbox split. */
export function tierLabelSide(id: ScentTierId): 'left' | 'right' {
  return id === 'heart' ? 'right' : 'left';
}
