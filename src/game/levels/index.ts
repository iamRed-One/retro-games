import { DEFAULT_LEVEL_ID } from '../config';
import { getRecord } from '../systems/progress';
import { cliffsLevel } from './cliffs';
import { lakeLevel } from './lake';
import { meadowLevel } from './meadow';
import { parseLevel } from './parseLevel';
import { peaksLevel } from './peaks';
import { testArea } from './testArea';
import { fortressLevel, magmaLevel, oceanLevel, skyLevel, starfallLevel, stormLevel } from './worlds';
import type { LevelDef } from './types';

/** Campaign order. Each level unlocks when the one before it is completed. */
export const LEVEL_ORDER: readonly LevelDef[] = [
  meadowLevel,
  cliffsLevel,
  peaksLevel,
  lakeLevel,
  skyLevel,
  oceanLevel,
  magmaLevel,
  stormLevel,
  starfallLevel,
  fortressLevel,
];

export const LEVELS: Record<string, LevelDef> = Object.fromEntries(
  [...LEVEL_ORDER, testArea].map((level) => [level.id, level]),
);

export function getLevel(id: string): LevelDef {
  return LEVELS[id] ?? LEVELS[DEFAULT_LEVEL_ID];
}

/** `?level=test` opens a specific level; otherwise the default first level. */
export function levelFromUrl(): string {
  const id = new URLSearchParams(window.location.search).get('level');
  return id && LEVELS[id] ? id : DEFAULT_LEVEL_ID;
}

export function levelIndex(id: string): number {
  return LEVEL_ORDER.findIndex((l) => l.id === id);
}

export function nextLevelId(id: string): string | null {
  const i = levelIndex(id);
  return i >= 0 && i < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[i + 1].id : null;
}

export interface LevelSummary {
  id: string;
  number: number;
  name: string;
  totalSeeds: number;
  unlocked: boolean;
  completed: boolean;
  bestTimeMs: number | null;
  bestSeeds: number;
}

const seedCounts = new Map<string, number>();

/** Levels unlock in order. Dev builds accept `?unlockall` to open every level for testing. */
export const unlockAll = import.meta.env.DEV && new URLSearchParams(window.location.search).has('unlockall');

export function levelSummaries(): LevelSummary[] {
  return LEVEL_ORDER.map((level, i) => {
    if (!seedCounts.has(level.id)) seedCounts.set(level.id, parseLevel(level).collectibles.length);
    const record = getRecord(level.id);
    const prevDone = i === 0 || (getRecord(LEVEL_ORDER[i - 1].id)?.completions ?? 0) > 0;
    return {
      id: level.id,
      number: i + 1,
      name: level.name,
      totalSeeds: seedCounts.get(level.id) ?? 0,
      unlocked: prevDone || unlockAll,
      completed: (record?.completions ?? 0) > 0,
      bestTimeMs: record?.bestTimeMs ?? null,
      bestSeeds: record?.bestCollected ?? 0,
    };
  });
}

/** The level "Play" should start: the first unlocked level not yet completed, else the first. */
export function continueLevelId(): string {
  const summaries = levelSummaries();
  return summaries.find((s) => s.unlocked && !s.completed)?.id ?? LEVEL_ORDER[0].id;
}
