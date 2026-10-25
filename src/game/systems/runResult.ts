import { uiStore, type RunMode, type RunResult } from '../bridge';
import { LEVEL_ORDER } from '../levels';
import { getRecord, recordRun } from './progress';
import { save } from './save';

export interface RunStats {
  timeMs: number;
  collected: number;
  total: number;
  deaths: number;
}

export interface RunExtras {
  finale?: boolean;
  ghostDeltaMs?: number | null;
  newGhost?: boolean;
  bosses?: number;
  cleared?: boolean;
  secretFound?: boolean;
}

function boardFor(mode: RunMode, levelId: string): string {
  if (mode === 'bossrush') return 'bossrush';
  if (mode === 'timeattack') return `ta:${levelId}`;
  if (mode === 'coop') return `coop:${levelId}`;
  return `lvl:${levelId}`;
}

/**
 * End of a run in any mode: bank the seeds, save records and achievements, submit to the
 * local leaderboard, then show the results (after the ending scene, the first time Baron
 * Murk falls).
 */
export function completeRun(levelId: string, stats: RunStats, extras: RunExtras = {}): void {
  const mode = uiStore.get().runMode;
  const timeMs = Math.floor(stats.timeMs);
  let bestTimeMs = timeMs;
  let newBest = false;
  if (mode === 'campaign') {
    const r = recordRun(levelId, timeMs, stats.collected);
    bestTimeMs = r.record.bestTimeMs;
    newBest = r.newBest;
    if (levelId === 'meadow') save.unlock('firstClear');
    if (LEVEL_ORDER.every((l) => (getRecord(l.id)?.completions ?? 0) > 0)) save.unlock('allLevels');
  }
  if (mode === 'timeattack') {
    save.unlock('timeAttack');
    if (extras.ghostDeltaMs !== undefined && extras.ghostDeltaMs !== null && extras.ghostDeltaMs < 0) save.unlock('ghostBuster');
  }
  if (mode === 'bossrush' && extras.cleared) save.unlock('bossRush');
  if (mode === 'coop') save.unlock('coop');

  save.addSeeds(stats.collected);
  const board = boardFor(mode, levelId);
  const rank = save.submitScore(board, { timeMs, bosses: extras.bosses });
  if (mode !== 'campaign') {
    const best = save.board(board)[0];
    bestTimeMs = best?.timeMs ?? timeMs;
    newBest = rank === 0;
  }

  const result: RunResult = {
    levelId,
    ...stats,
    timeMs,
    bestTimeMs,
    newBest,
    finale: !!extras.finale,
    mode,
    board,
    rank,
    ghostDeltaMs: extras.ghostDeltaMs,
    newGhost: extras.newGhost,
    bosses: extras.bosses,
    cleared: extras.cleared,
    secretFound: extras.secretFound,
    banked: stats.collected,
  };

  const showEnding = !!extras.finale && mode === 'campaign' && !save.get().storySeen.includes('ending');
  uiStore.set({
    boss: null,
    result,
    ...(showEnding ? { screen: 'story', storyLevel: 'ending', storyReplay: false } : { screen: 'complete' }),
  });
}
