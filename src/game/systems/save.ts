/**
 * Player profile kept in this browser: spendable seeds, skins, achievements, stats, secrets,
 * story progress, local leaderboards and Time Attack ghosts. Online leaderboards can later sync
 * from `leaderboards` here without changing the game code.
 */
import { uiStore } from '../bridge';
import { ACHIEVEMENTS, type AchievementId } from './achievements';

const KEY = 'rar.bopple.save.v1';
const BOARD_SIZE = 5;

export interface BoardEntry {
  name: string;
  /** Lower is better (milliseconds), except Boss Rush which ranks by bosses then time. */
  timeMs: number;
  bosses?: number;
  date: number;
}

export interface Ghost {
  timeMs: number;
  /** Flat [x, y, x, y, ...] positions sampled every GHOST_SAMPLE_MS. */
  samples: number[];
}

export const GHOST_SAMPLE_MS = 50;

interface SaveData {
  seedsBank: number;
  seedsLifetime: number;
  skin: string;
  skinsOwned: string[];
  achievements: Partial<Record<AchievementId, number>>;
  stomps: number;
  skyKills: number;
  bossesBeaten: string[];
  powersUsed: string[];
  secrets: string[];
  storySeen: string[];
  initials: string;
  boards: Record<string, BoardEntry[]>;
  ghosts: Record<string, Ghost>;
}

const EMPTY: SaveData = {
  seedsBank: 0,
  seedsLifetime: 0,
  skin: 'classic',
  skinsOwned: ['classic'],
  achievements: {},
  stomps: 0,
  skyKills: 0,
  bossesBeaten: [],
  powersUsed: [],
  secrets: [],
  storySeen: [],
  initials: 'AAA',
  boards: {},
  ghosts: {},
};

let data: SaveData = load();

function load(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<SaveData>) } : structuredClone(EMPTY);
  } catch {
    return structuredClone(EMPTY);
  }
}

function persist(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked: progress just won't persist this session.
  }
  uiStore.set({ seedsBank: data.seedsBank });
}

let achievementToastId = 0;

export const save = {
  get: (): Readonly<SaveData> => data,

  addSeeds(count: number): void {
    if (count <= 0) return;
    data.seedsBank += count;
    data.seedsLifetime += count;
    persist();
    if (data.seedsLifetime >= 1000) save.unlock('rich');
  },

  spendSeeds(count: number): boolean {
    if (data.seedsBank < count) return false;
    data.seedsBank -= count;
    persist();
    return true;
  },

  buySkin(id: string, price: number): boolean {
    if (data.skinsOwned.includes(id) || !save.spendSeeds(price)) return false;
    data.skinsOwned.push(id);
    data.skin = id;
    persist();
    save.unlock('skin');
    return true;
  },

  equipSkin(id: string): void {
    if (!data.skinsOwned.includes(id)) return;
    data.skin = id;
    persist();
  },

  unlock(id: AchievementId): void {
    if (data.achievements[id]) return;
    data.achievements[id] = Date.now();
    persist();
    achievementToastId += 1;
    uiStore.set({ achievement: { id: achievementToastId, title: ACHIEVEMENTS[id].title } });
  },

  has(id: AchievementId): boolean {
    return !!data.achievements[id];
  },

  countStomp(): void {
    data.stomps += 1;
    if (data.stomps >= 25) save.unlock('stomps');
    persist();
  },

  countSkyKill(): void {
    data.skyKills += 1;
    if (data.skyKills >= 200) save.unlock('skyAce');
    // Saved in batches by the shooter scene to avoid writing every frame.
  },

  flush(): void {
    persist();
  },

  usePower(kind: string): void {
    if (!data.powersUsed.includes(kind)) data.powersUsed.push(kind);
    if (data.powersUsed.length >= 3) save.unlock('powers');
    persist();
  },

  beatBoss(id: string, flawless: boolean): void {
    if (!data.bossesBeaten.includes(id)) data.bossesBeaten.push(id);
    if (flawless) save.unlock('flawless');
    if (id === 'baron') save.unlock('baron');
    persist();
  },

  findSecret(levelId: string): boolean {
    if (data.secrets.includes(levelId)) return false;
    data.secrets.push(levelId);
    save.unlock('explorer');
    if (data.secrets.length >= 10) save.unlock('treasure');
    persist();
    return true;
  },

  markStorySeen(id: string): void {
    if (!data.storySeen.includes(id)) data.storySeen.push(id);
    persist();
  },

  setInitials(initials: string): void {
    data.initials = initials;
    persist();
  },

  /** Adds an entry; returns its rank (0-based) if it made the top list, else -1. */
  submitScore(board: string, entry: Omit<BoardEntry, 'date' | 'name'>): number {
    const list = data.boards[board] ?? [];
    const full: BoardEntry = { ...entry, name: data.initials, date: Date.now() };
    list.push(full);
    const better = (a: BoardEntry, b: BoardEntry) => (b.bosses ?? 0) - (a.bosses ?? 0) || a.timeMs - b.timeMs;
    list.sort(better);
    data.boards[board] = list.slice(0, BOARD_SIZE);
    persist();
    return data.boards[board].indexOf(full);
  },

  renameScore(board: string, rank: number, name: string): void {
    const entry = data.boards[board]?.[rank];
    if (!entry) return;
    entry.name = name;
    data.initials = name;
    persist();
  },

  board(board: string): BoardEntry[] {
    return data.boards[board] ?? [];
  },

  ghost(levelId: string): Ghost | null {
    return data.ghosts[levelId] ?? null;
  },

  /** Keeps the faster ghost. Returns true if this run became the new ghost. */
  offerGhost(levelId: string, ghost: Ghost): boolean {
    const current = data.ghosts[levelId];
    if (current && current.timeMs <= ghost.timeMs) return false;
    data.ghosts[levelId] = ghost;
    persist();
    return true;
  },
};

export function initSaveUi(): void {
  uiStore.set({ seedsBank: data.seedsBank });
}
