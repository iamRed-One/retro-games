/** Local-only best records (concept brief §16: simple, privacy-conscious progress). */
const KEY = 'rar.progress.v1';

export interface LevelRecord {
  bestTimeMs: number;
  bestCollected: number;
  completions: number;
}

type ProgressFile = Record<string, LevelRecord>;

function read(): ProgressFile {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProgressFile) : {};
  } catch {
    return {};
  }
}

function write(data: ProgressFile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Records just won't persist this session.
  }
}

export function getRecord(levelId: string): LevelRecord | null {
  return read()[levelId] ?? null;
}

export function recordRun(levelId: string, timeMs: number, collected: number): { record: LevelRecord; newBest: boolean } {
  const data = read();
  const prev = data[levelId];
  const newBest = !prev || timeMs < prev.bestTimeMs;
  const record: LevelRecord = {
    bestTimeMs: newBest ? timeMs : prev.bestTimeMs,
    bestCollected: Math.max(prev?.bestCollected ?? 0, collected),
    completions: (prev?.completions ?? 0) + 1,
  };
  data[levelId] = record;
  write(data);
  return { record, newBest };
}
