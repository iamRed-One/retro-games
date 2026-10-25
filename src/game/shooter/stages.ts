import type { EnemyKind } from './enemies';

/**
 * Sky battles after each level's exit. A stage is a wave timeline followed by that level's
 * boss. Waves are generated from a pool of patterns that grows with difficulty, using a fixed
 * seed per level so each battle is the same every time you play it.
 */
export interface Spawn {
  /** Seconds from the start of the battle. */
  at: number;
  kind: EnemyKind;
  /** 0 = top of the screen, 1 = bottom. */
  y: number;
}

export interface ShooterStage {
  /** 1..10: scales enemy speed, fire rate and toughness. */
  difficulty: number;
  spawns: Spawn[];
  bossId: string;
}

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pattern = (at: number, r: () => number, d: number) => Spawn[];

const line = (kind: EnemyKind, count: number, gap: number): Pattern => (at, r) => {
  const y = 0.15 + r() * 0.7;
  return Array.from({ length: count }, (_, i) => ({ at: at + i * gap, kind, y }));
};

/** V formation: pairs fanning out from a leader. */
const vee: Pattern = (at, r, d) => {
  const y = 0.3 + r() * 0.4;
  const out: Spawn[] = [{ at, kind: 'flier', y }];
  for (let i = 1; i <= 2 + Math.min(2, Math.floor(d / 3)); i++) {
    out.push({ at: at + i * 0.25, kind: 'flier', y: y - i * 0.08 }, { at: at + i * 0.25, kind: 'flier', y: y + i * 0.08 });
  }
  return out;
};

const scatter = (kind: EnemyKind, count: number, gap: number): Pattern => (at, r) =>
  Array.from({ length: count }, (_, i) => ({ at: at + i * gap, kind, y: 0.1 + r() * 0.8 }));

const pair = (kind: EnemyKind): Pattern => (at, r) => {
  const y = 0.2 + r() * 0.2;
  return [
    { at, kind, y },
    { at: at + 0.6, kind, y: y + 0.45 },
  ];
};

const single = (kind: EnemyKind, y?: number): Pattern => (at, r) => [{ at, kind, y: y ?? 0.15 + r() * 0.7 }];

/** Patterns become available as difficulty rises; harder ones appear more often later. */
function patternPool(d: number): Pattern[] {
  const pool: Pattern[] = [line('flier', 5 + Math.min(4, d), 0.4), vee, scatter('diver', 2 + Math.floor(d / 2), 0.6)];
  if (d >= 2) pool.push(pair('turret'), single('rock'));
  if (d >= 3) pool.push(line('zigzag', 4 + Math.floor(d / 3), 0.45), single('tank'));
  if (d >= 4) pool.push(single('bomber', 0.12), single('thundercloud', 0.15));
  if (d >= 5) pool.push(pair('sniper'), scatter('zigzag', 5, 0.35));
  if (d >= 7) pool.push(pair('tank'), scatter('diver', 6, 0.4), single('bomber', 0.1));
  if (d >= 9) pool.push(pair('thundercloud'), scatter('sniper', 3, 0.8));
  return pool;
}

/** Bosses by level: nine world bosses, then Baron Murk in his final form. */
const BOSS_BY_LEVEL: Record<string, string> = {
  meadow: 'grumble',
  cliffs: 'crag',
  peaks: 'gustav',
  lake: 'ripple',
  sky: 'nimbus',
  ocean: 'ink',
  magma: 'magmaw',
  storm: 'volt',
  starfall: 'eclipse',
  fortress: 'baron',
};

const LEVEL_DIFFICULTY: Record<string, number> = {
  meadow: 1,
  cliffs: 2,
  peaks: 3,
  lake: 4,
  sky: 5,
  ocean: 6,
  magma: 7,
  storm: 8,
  starfall: 9,
  fortress: 10,
};

export function hasShooterStage(levelId: string): boolean {
  return levelId in LEVEL_DIFFICULTY;
}

export function getStage(levelId: string): ShooterStage {
  const d = LEVEL_DIFFICULTY[levelId] ?? 1;
  const r = rng(1000 + d * 97);
  const duration = 50 + d * 4;
  const pool = patternPool(d);
  const spawns: Spawn[] = [];
  // Pattern slots get closer together as difficulty rises.
  const slot = Math.max(2.2, 4 - d * 0.18);
  for (let at = 1.5; at < duration; at += slot * (0.8 + r() * 0.4)) {
    // Bias toward the newest (hardest) patterns in later worlds.
    const pick = Math.min(pool.length - 1, Math.floor(Math.pow(r(), d >= 6 ? 0.6 : 1) * pool.length));
    spawns.push(...pool[pick](at, r, d));
  }
  spawns.sort((a, b) => a.at - b.at);
  return { difficulty: d, spawns, bossId: BOSS_BY_LEVEL[levelId] ?? 'grumble' };
}
