import type { ThemeId } from '../art/palette';

/**
 * Levels are ASCII maps, one character per 32px tile:
 *
 *   .  empty               #  ground (auto grass/dirt)    B  stone block
 *   -  one-way plank        ^  floor spikes                v  ceiling spikes
 *   o  sun seed             S  spawn                       C  checkpoint
 *   E  exit                 T  spring                      ?  tutorial prompt (text from `prompts`, in x order)
 *   H  moving platform (3 tiles wide, drifts 4 tiles right and back)
 *   I  lift (3 tiles wide, rises 5 tiles and back)
 *   X  crumbling block (falls ~0.45s after being stood on, returns later)
 *   W  updraft fan (blows upward through the 7 empty cells above it)
 *   ~  water                *  water with a sunken seed    !  water with lake-bed spikes
 *   M  Murkling villain: patrols the floor it stands on; bounce on its head to pop it
 *   K  cloud block (solid)  =  one-way cloud ledge         P  bouncy cloud puff
 *   L  lava (deadly)        G  fire geyser (erupts on a timer)
 *   J  jellyfish in water (stings)    >  <  water current pushing right / left
 *   F  fake wall: looks solid, you can roll through it (secret rooms)   f  fake wall in water
 *
 * Cells right of an H/I should be left empty ('.'); the platform occupies them.
 */
export interface LevelDef {
  id: string;
  name: string;
  map: string[];
  prompts?: string[];
  /** Backdrop palette; defaults to 'day'. */
  theme?: ThemeId;
  /** Music track id from systems/music.ts; defaults to the meadow track. */
  track?: string;
  /** Multiplier on water buoyancy (the ocean world floats you up slowly). */
  buoyancy?: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface MoverDef {
  /** Top-left corner of the platform in px. */
  x: number;
  y: number;
  axis: 'x' | 'y';
  range: number;
}

export interface FanDef {
  /** Fan center x and the floor it stands on. */
  x: number;
  bottom: number;
  /** Height of the updraft column, fan cell included. */
  heightPx: number;
}

export interface EnemyDef {
  /** Start position (bottom-center) and the patrol limits for its center x. */
  x: number;
  bottom: number;
  minX: number;
  maxX: number;
}

export interface FakeWall {
  col: number;
  row: number;
  /** Tileset frame index it imitates. */
  frame: number;
}

export interface ParsedLevel {
  def: LevelDef;
  cols: number;
  rows: number;
  widthPx: number;
  heightPx: number;
  /** Tile frame index per cell, -1 for empty. */
  tiles: number[][];
  spawn: Point;
  exit: Point;
  collectibles: Point[];
  spikes: (Point & { ceiling: boolean })[];
  springs: Point[];
  puffs: Point[];
  checkpoints: Point[];
  movers: MoverDef[];
  /** Top-left corner of each crumbling block. */
  crumbles: Point[];
  fans: FanDef[];
  geysers: Point[];
  jellies: Point[];
  enemies: EnemyDef[];
  fakeWalls: FakeWall[];
  /** water[row][col] is true for water cells. */
  water: boolean[][];
  lava: boolean[][];
  /** Water current per cell: 1 pushes right, -1 left, 0 none. */
  currents: number[][];
  hasWater: boolean;
  hasLava: boolean;
  prompts: (Point & { text: string })[];
}
