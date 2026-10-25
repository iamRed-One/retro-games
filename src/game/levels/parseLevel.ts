import { TILE_INDEX } from '../art/textures';
import { TILE } from '../config';
import type { LevelDef, ParsedLevel, Point } from './types';

/** Characters that are water cells (with whatever else they carry). */
export const WATER_CHARS = new Set(['~', '*', '!', 'J', '>', '<', 'f']);
/** Solid, standable terrain. */
export const SOLID_CHARS = new Set(['#', 'B', 'K', 'X']);
/** One-way ledges you can stand on from above. */
export const LEDGE_CHARS = new Set(['-', '=']);
/** Updraft columns stop at solid terrain. */
const BLOCKS_WIND = SOLID_CHARS;
/** Murklings walk over these cells, standing on FLOOR cells below. */
const OPEN_FOR_WALKING = new Set(['.', 'o', 'M', '?']);
const FLOOR = new Set([...SOLID_CHARS, ...LEDGE_CHARS]);
const PATROL_REACH = 5;
/** Fan cell plus the cells above it that blow upward. */
const FAN_REACH = 8;

/**
 * Converts an ASCII level into tiles and entity positions. Entity points are the bottom-center
 * of their cell (things stand on the floor), except collectibles which use the cell center.
 */
export function parseLevel(def: LevelDef): ParsedLevel {
  const rows = def.map;
  const cols = rows[0]?.length ?? 0;
  const widths = rows.map((r) => r.length);
  if (rows.length === 0 || widths.some((w) => w !== cols)) {
    throw new Error(`Level "${def.id}": every row must be the same width (got ${[...new Set(widths)].join(', ')})`);
  }

  const at = (c: number, r: number) => (r >= 0 && r < rows.length && c >= 0 && c < cols ? rows[r][c] : null);
  // Outside the map counts as ground horizontally so the world edges don't get grass caps.
  const isGround = (c: number, r: number) => {
    const ch = at(c, r);
    return ch === '#' || (ch === null && r >= 0 && r < rows.length);
  };
  const center = (c: number, r: number): Point => ({ x: (c + 0.5) * TILE, y: (r + 0.5) * TILE });
  const floor = (c: number, r: number): Point => ({ x: (c + 0.5) * TILE, y: (r + 1) * TILE });

  const out: ParsedLevel = {
    def,
    cols,
    rows: rows.length,
    widthPx: cols * TILE,
    heightPx: rows.length * TILE,
    tiles: [],
    spawn: { x: 0, y: 0 },
    exit: { x: 0, y: 0 },
    collectibles: [],
    spikes: [],
    springs: [],
    puffs: [],
    checkpoints: [],
    movers: [],
    crumbles: [],
    fans: [],
    geysers: [],
    jellies: [],
    enemies: [],
    fakeWalls: [],
    water: rows.map((row) => Array.from(row, (ch) => WATER_CHARS.has(ch))),
    lava: rows.map((row) => Array.from(row, (ch) => ch === 'L')),
    currents: rows.map((row) => Array.from(row, (ch) => (ch === '>' ? 1 : ch === '<' ? -1 : 0))),
    hasWater: false,
    hasLava: false,
    prompts: [],
  };
  out.hasWater = out.water.some((row) => row.includes(true));
  out.hasLava = out.lava.some((row) => row.includes(true));

  let spawns = 0;
  let exits = 0;
  const promptCells: Point[] = [];

  for (let r = 0; r < rows.length; r++) {
    const tileRow: number[] = [];
    for (let c = 0; c < cols; c++) {
      const ch = rows[r][c];
      let tile = -1;
      switch (ch) {
        case '#': {
          if (isGround(c, r - 1)) {
            tile = TILE_INDEX.dirt;
          } else {
            const left = isGround(c - 1, r);
            const right = isGround(c + 1, r);
            tile = left && right ? TILE_INDEX.grass : left ? TILE_INDEX.grassRight : right ? TILE_INDEX.grassLeft : TILE_INDEX.grassSolo;
          }
          break;
        }
        case 'B':
          tile = TILE_INDEX.stone;
          break;
        case 'K':
          tile = TILE_INDEX.cloud;
          break;
        case '-':
          tile = TILE_INDEX.plank;
          break;
        case '=':
          tile = TILE_INDEX.cloudPlank;
          break;
        case '^':
        case '!':
          out.spikes.push({ ...floor(c, r), ceiling: false });
          break;
        case 'v':
          out.spikes.push({ x: (c + 0.5) * TILE, y: r * TILE, ceiling: true });
          break;
        case 'o':
        case '*':
          out.collectibles.push(center(c, r));
          break;
        case 'S':
          out.spawn = floor(c, r);
          spawns++;
          break;
        case 'C':
          out.checkpoints.push(floor(c, r));
          break;
        case 'E':
          out.exit = floor(c, r);
          exits++;
          break;
        case 'T':
          out.springs.push(floor(c, r));
          break;
        case 'P':
          out.puffs.push(floor(c, r));
          break;
        case 'H':
          out.movers.push({ x: c * TILE, y: r * TILE, axis: 'x', range: 4 * TILE });
          break;
        case 'I':
          out.movers.push({ x: c * TILE, y: r * TILE, axis: 'y', range: 5 * TILE });
          break;
        case '?':
          promptCells.push(floor(c, r));
          break;
        case 'X':
          out.crumbles.push({ x: c * TILE, y: r * TILE });
          break;
        case 'G':
          out.geysers.push(floor(c, r));
          break;
        case 'J':
          out.jellies.push(center(c, r));
          break;
        case 'W': {
          let cells = 1;
          while (cells < FAN_REACH && r - cells >= 0 && !BLOCKS_WIND.has(rows[r - cells][c])) cells++;
          out.fans.push({ x: (c + 0.5) * TILE, bottom: (r + 1) * TILE, heightPx: cells * TILE });
          break;
        }
        case 'M': {
          // Patrol along open floor until a wall, a drop, a hazard or PATROL_REACH tiles.
          const walkable = (cc: number) =>
            cc >= 0 && cc < cols && OPEN_FOR_WALKING.has(rows[r][cc]) && r + 1 < rows.length && FLOOR.has(rows[r + 1][cc]);
          let left = c;
          let right = c;
          while (left - 1 >= c - PATROL_REACH && walkable(left - 1)) left--;
          while (right + 1 <= c + PATROL_REACH && walkable(right + 1)) right++;
          out.enemies.push({ x: (c + 0.5) * TILE, bottom: (r + 1) * TILE, minX: left * TILE + TILE / 2, maxX: right * TILE + TILE / 2 });
          break;
        }
        case 'F':
        case 'f': {
          // Imitate whatever terrain surrounds it: cloud in sky worlds, otherwise dirt or grass.
          const near = [at(c - 1, r), at(c + 1, r), at(c, r - 1), at(c, r + 1)];
          const above = at(c, r - 1);
          const frame = near.includes('K')
            ? TILE_INDEX.cloud
            : above === '#' || above === 'F' || above === 'f' || above === 'B'
              ? TILE_INDEX.dirt
              : TILE_INDEX.grass;
          out.fakeWalls.push({ col: c, row: r, frame });
          break;
        }
        case '~':
        case '>':
        case '<':
        case 'L':
        case '.':
          break;
        default:
          throw new Error(`Level "${def.id}": unknown character "${ch}" at column ${c}, row ${r}`);
      }
      tileRow.push(tile);
    }
    out.tiles.push(tileRow);
  }

  if (spawns !== 1) throw new Error(`Level "${def.id}": needs exactly one spawn "S" (found ${spawns})`);
  if (exits !== 1) throw new Error(`Level "${def.id}": needs exactly one exit "E" (found ${exits})`);

  promptCells.sort((a, b) => a.x - b.x || a.y - b.y);
  const texts = def.prompts ?? [];
  if (texts.length !== promptCells.length && import.meta.env.DEV) {
    console.warn(`Level "${def.id}": ${promptCells.length} "?" markers but ${texts.length} prompt texts`);
  }
  out.prompts = promptCells.flatMap((p, i) => (texts[i] ? [{ ...p, text: texts[i] }] : []));

  return out;
}

/** Joins equally tall map sections left to right, so long levels can be authored in chunks. */
export function joinSections(...sections: string[][]): string[] {
  const height = sections[0]?.length ?? 0;
  sections.forEach((s, i) => {
    if (s.length !== height) throw new Error(`Section ${i} has ${s.length} rows, expected ${height}`);
  });
  return Array.from({ length: height }, (_, r) => sections.map((s) => s[r]).join(''));
}
