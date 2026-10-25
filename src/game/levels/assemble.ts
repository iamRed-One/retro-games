import { SOLID_CHARS } from './parseLevel';

const HEIGHT = 20;

export interface AssembleOptions {
  /** Ground character for generated pieces (start, goal, stairs, rest stops). */
  ground?: string;
  /** Fill generated pieces with water from this row down to the ground (underwater worlds). */
  waterFrom?: number;
  /** Put a checkpoint before every Nth piece. */
  checkpointEvery?: number;
}

/** Row of the first solid cell in a column, i.e. the top of the ground at that edge. */
function groundTop(rows: string[], col: number): number {
  for (let r = 0; r < rows.length; r++) if (SOLID_CHARS.has(rows[r][col])) return r;
  return HEIGHT;
}

/** A generated piece `width` wide whose ground top follows `topAt(col)`. */
function makePiece(width: number, topAt: (col: number) => number, opts: AssembleOptions): string[] {
  const ground = opts.ground ?? '#';
  return Array.from({ length: HEIGHT }, (_, r) =>
    Array.from({ length: width }, (_, c) => {
      if (r >= topAt(c)) return ground;
      if (opts.waterFrom !== undefined && r >= opts.waterFrom) return '~';
      return '.';
    }).join(''),
  );
}

/** Stairs from one ground height to another, one row per two columns. */
function stairs(from: number, to: number, opts: AssembleOptions): string[] {
  const steps = Math.abs(to - from);
  const width = steps * 2 + 2;
  return makePiece(
    width,
    (c) => {
      const step = Math.min(steps, Math.floor(c / 2));
      return from + Math.sign(to - from) * step;
    },
    opts,
  );
}

function stamp(rows: string[], col: number, row: number, ch: string): string[] {
  return rows.map((line, r) => (r === row ? line.slice(0, col) + ch + line.slice(col + 1) : line));
}

/**
 * Builds a full level map from pieces: a start area with the spawn, the pieces in order with
 * stairs wherever two edges sit at different heights, rest stops with checkpoints, and a goal
 * area with the exit. Spawns, exits and checkpoints inside pieces are removed so every level
 * gets them in consistent places.
 */
export function assemble(pieces: string[][], opts: AssembleOptions = {}): string[] {
  const every = opts.checkpointEvery ?? 2;
  const clean = pieces.map((rows, i) => {
    if (rows.length !== HEIGHT) throw new Error(`Piece ${i} has ${rows.length} rows, expected ${HEIGHT}`);
    const width = rows[0].length;
    if (rows.some((r) => r.length !== width)) throw new Error(`Piece ${i} has rows of different widths`);
    return rows.map((r) => r.replace(/[SEC]/g, '.'));
  });

  const out: string[][] = [];
  let height = 17;
  out.push(stamp(makePiece(8, () => height, opts), 2, height - 1, 'S'));

  clean.forEach((piece, i) => {
    const left = groundTop(piece, 0);
    if (i > 0 && i % every === 0) {
      out.push(stamp(makePiece(4, () => height, opts), 1, height - 1, 'C'));
    }
    if (left !== height && left < HEIGHT) out.push(stairs(height, left, opts));
    out.push(piece);
    const right = groundTop(piece, piece[0].length - 1);
    if (right < HEIGHT) height = right;
  });

  if (height !== 17) out.push(stairs(height, 17, opts));
  height = 17;
  out.push(stamp(makePiece(12, () => height, opts), 7, height - 1, 'E'));

  return Array.from({ length: HEIGHT }, (_, r) => out.map((p) => p[r]).join(''));
}

/** Copy of a piece with a tutorial prompt marker standing on the ground at `col`. */
export function withPrompt(rows: string[], col: number): string[] {
  const top = groundTop(rows, col);
  return stamp(rows, col, top - 1, '?');
}
