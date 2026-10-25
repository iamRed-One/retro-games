/**
 * Dev-only level checker: a coarse reachability search over the tile grid using the movement
 * limits from TUNING (normal bounce 3 rows up, super 5, spring 8, puff 6, fan hover). It
 * ignores ceilings and timing, so a pass means "no impossible gaps", not "fun". Run it from
 * the browser console: `(await import('/src/game/levels/lint.ts')).lintAll()`.
 */
import { LEDGE_CHARS, SOLID_CHARS, WATER_CHARS } from './parseLevel';

const HAZARDS = new Set(['^', 'v', '!', 'L', 'G']);
const SUPPORT = new Set([...SOLID_CHARS, ...LEDGE_CHARS]);

export interface LintResult {
  id: string;
  ok: boolean;
  cols: number;
  reachedCol: number;
  /** True if the route needed a super bounce somewhere. */
  usesSuper: boolean;
}

export function lintMap(id: string, rows: string[], allowSuper = true): LintResult {
  const H = rows.length;
  const W = rows[0].length;
  const at = (c: number, r: number) => (r >= 0 && r < H && c >= 0 && c < W ? rows[r][c] : '#');
  const open = (c: number, r: number) => !SOLID_CHARS.has(at(c, r)) && !HAZARDS.has(at(c, r));
  const water = (c: number, r: number) => WATER_CHARS.has(at(c, r));

  // Extra standing spots created by moving platforms and lifts.
  const extra = new Set<number>();
  const key = (c: number, r: number) => r * W + c;
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const ch = rows[r][c];
      if (ch === 'H') for (let k = 0; k <= 6; k++) extra.add(key(c + k, r - 1));
      if (ch === 'I') for (let up = 0; up <= 5; up++) for (let k = 0; k <= 2; k++) extra.add(key(c + k, r - 1 - up));
    }
  }

  const standable = (c: number, r: number) =>
    open(c, r) && (SUPPORT.has(at(c, r + 1)) || extra.has(key(c, r)) || water(c, r));

  // Launch height from a cell: springs, puffs, fans.
  const launch = (c: number, r: number): number => {
    const ch = at(c, r);
    if (ch === 'T') return 8;
    if (ch === 'P') return 6;
    return 0;
  };
  const fanTops: { c: number; top: number; bottom: number }[] = [];
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      if (rows[r][c] !== 'W') continue;
      let cells = 1;
      while (cells < 8 && r - cells >= 0 && !SOLID_CHARS.has(rows[r - cells][c])) cells++;
      fanTops.push({ c, top: r - cells, bottom: r });
    }
  }

  let start = -1;
  let goal = -1;
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      if (rows[r][c] === 'S') start = key(c, r);
      if (rows[r][c] === 'E') goal = key(c, r);
    }
  }

  const seen = new Uint8Array(W * H);
  const viaSuper = new Uint8Array(W * H);
  const queue: number[] = [start];
  seen[start] = 1;
  let reachedCol = 0;

  const visit = (c: number, r: number, superUsed: boolean) => {
    if (c < 0 || c >= W || r < 0 || r >= H) return;
    const k = key(c, r);
    if (seen[k] || !standable(c, r)) return;
    seen[k] = 1;
    viaSuper[k] = superUsed ? 1 : 0;
    queue.push(k);
  };

  while (queue.length) {
    const k = queue.shift()!;
    const c = k % W;
    const r = Math.floor(k / W);
    reachedCol = Math.max(reachedCol, c);
    const sup = viaSuper[k] === 1;
    const up = Math.max(3, launch(c, r));

    if (water(c, r)) {
      // Swim: any neighbouring water or standable cell.
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) visit(c + dc, r + dr, sup);
    }

    for (let dc = -7; dc <= 7; dc++) {
      for (let r2 = Math.max(0, r - 5); r2 < H; r2++) {
        const rise = r - r2;
        const reachX = rise > 0 ? 7 : 7 + Math.min(4, -rise);
        if (Math.abs(dc) > reachX) continue;
        if (rise <= up) visit(c + dc, r2, sup);
        else if (rise <= 5 && allowSuper) visit(c + dc, r2, true);
      }
    }
    // Springs/puffs reach higher than the loop above.
    if (up > 5) for (let dc = -6; dc <= 6; dc++) for (let r2 = r - up; r2 < r - 5; r2++) visit(c + dc, r2, sup);

    // Entering a fan column lifts you to its top.
    for (const fan of fanTops) {
      if (Math.abs(c - fan.c) <= 1 && r <= fan.bottom && r > fan.top - 1) {
        for (let dc = -5; dc <= 5; dc++) for (let r2 = fan.top; r2 < H; r2++) visit(fan.c + dc, r2, sup);
      }
    }
  }

  return {
    id,
    ok: goal >= 0 && seen[goal] === 1,
    cols: W,
    reachedCol,
    usesSuper: goal >= 0 && viaSuper[goal] === 1,
  };
}

/** Each level must be finishable without super bounces; those are only for shortcuts and seeds. */
export async function lintAll(): Promise<LintResult[]> {
  const { LEVEL_ORDER } = await import('./index');
  return LEVEL_ORDER.map((l) => {
    const strict = lintMap(l.id, l.map, false);
    return strict.ok ? strict : { ...lintMap(l.id, l.map, true), usesSuper: true };
  });
}
