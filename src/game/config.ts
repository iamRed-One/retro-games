/** Names are working titles (see concept brief §20: confirm before public release). */
export const ARCADE_NAME = 'Retro Arcade Revival';
export const GAME_TITLE = 'Bopple';

/**
 * Logical canvas size. The height is fixed; the width stretches with the window's aspect ratio
 * (between 4:3 and ~2.7:1) so the game fills the screen and wide displays simply see more of
 * the level. VIEW_WIDTH is the 16:9 design width used for the first frame.
 */
export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 540;
export const MIN_VIEW_WIDTH = 720;
export const MAX_VIEW_WIDTH = 1440;

export function viewWidthFor(pixelWidth: number, pixelHeight: number): number {
  if (pixelWidth <= 0 || pixelHeight <= 0) return VIEW_WIDTH;
  const width = Math.round((VIEW_HEIGHT * pixelWidth) / pixelHeight / 2) * 2;
  return Math.min(MAX_VIEW_WIDTH, Math.max(MIN_VIEW_WIDTH, width));
}

/** World tile size in screen pixels. Art is drawn at 16px and doubled (ART_SCALE). */
export const TILE = 32;
export const ART_SCALE = 2;

export const DEFAULT_LEVEL_ID = 'meadow';
