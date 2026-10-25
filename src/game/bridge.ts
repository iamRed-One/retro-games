/**
 * The only connection between React (menus, HUD, overlays) and Phaser (the game world).
 * Phaser writes UI state into `uiStore`; React sends `gameCommands` back.
 */
import { DEFAULT_LEVEL_ID } from './config';
import type { InputDevice } from './input/actions';
import { loadSettings } from './systems/settings';

/** 'hub' is the arcade home menu listing every game; 'title' is Bopple's own menu. */
export type Screen = 'loading' | 'hub' | 'title' | 'story' | 'playing' | 'paused' | 'complete';

/** Campaign (platform + sky battle), Time Attack (platform only, with ghost), Boss Rush, Co-op sky battle. */
export type RunMode = 'campaign' | 'timeattack' | 'bossrush' | 'coop';

export interface RunResult {
  levelId: string;
  timeMs: number;
  collected: number;
  total: number;
  deaths: number;
  bestTimeMs: number;
  newBest: boolean;
  /** The final boss was beaten on this run. */
  finale: boolean;
  mode: RunMode;
  /** Leaderboard this run was submitted to, and its rank there (-1 = not in the top list). */
  board: string;
  rank: number;
  /** Time Attack: difference to the previous ghost (negative = faster), null if no ghost yet. */
  ghostDeltaMs?: number | null;
  newGhost?: boolean;
  /** Boss Rush: bosses defeated. */
  bosses?: number;
  /** Boss Rush: true when every boss in the rush was beaten. */
  cleared?: boolean;
  secretFound?: boolean;
  /** Seeds added to the shop bank from this run. */
  banked: number;
}

export interface UiState {
  screen: Screen;
  levelId: string;
  levelName: string;
  collected: number;
  total: number;
  timeMs: number;
  deaths: number;
  toast: { id: number; text: string } | null;
  /** Raw prompt text; may contain {move} / {bounce} tokens that React fills in per device. */
  prompt: string | null;
  gamepad: { connected: boolean; label: string };
  device: InputDevice;
  musicOn: boolean;
  musicVolume: number;
  sfxOn: boolean;
  sfxVolume: number;
  rumbleOn: boolean;
  /** Track that just started, for the "Now playing" chip; id changes on every start. */
  nowPlaying: { id: number; title: string } | null;
  /** The current level has water, so the Dive control is relevant. */
  hasDive: boolean;
  /** Platforming, or the sky-shooter section that follows each level's exit. */
  mode: 'platform' | 'shooter';
  hp: number;
  maxHp: number;
  /** Boss health bar (0..1), shown while a boss is on screen. */
  boss: { name: string; hp: number } | null;
  /** Active sky-battle power-up. */
  power: 'spread' | 'rapid' | 'shield' | null;
  /** Seeds available to spend in the shop. */
  seedsBank: number;
  /** Latest unlocked achievement, for the banner (id changes every unlock). */
  achievement: { id: number; title: string } | null;
  /** Game mode of the current run. */
  runMode: RunMode;
  /** Second player's hearts in co-op sky battles (null when playing solo). */
  hp2: number | null;
  /** Level whose story scene is showing. */
  storyLevel: string | null;
  /** Replaying a story scene from the Extras menu (returns to the title afterwards). */
  storyReplay: boolean;
  result: RunResult | null;
}

type Listener = () => void;

const initialSettings = loadSettings();

let state: UiState = {
  screen: 'loading',
  levelId: DEFAULT_LEVEL_ID,
  levelName: '',
  collected: 0,
  total: 0,
  timeMs: 0,
  deaths: 0,
  toast: null,
  prompt: null,
  gamepad: { connected: false, label: '' },
  device: 'keyboard',
  ...initialSettings,
  nowPlaying: null,
  hasDive: false,
  mode: 'platform',
  hp: 3,
  maxHp: 3,
  boss: null,
  power: null,
  seedsBank: 0,
  achievement: null,
  runMode: 'campaign',
  hp2: null,
  storyLevel: null,
  storyReplay: false,
  result: null,
};

const listeners = new Set<Listener>();

export const uiStore = {
  get(): UiState {
    return state;
  },
  set(patch: Partial<UiState>): void {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

let toastId = 0;
export function showToast(text: string): number {
  toastId += 1;
  uiStore.set({ toast: { id: toastId, text } });
  return toastId;
}

export type GameCommand =
  | { type: 'start'; levelId?: string; mode?: RunMode; skipStory?: boolean }
  | { type: 'bossrush'; bosses: string[] }
  | { type: 'applySkin'; skin: string }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'restartCheckpoint' }
  | { type: 'restartLevel' }
  | { type: 'quitToTitle' };

type CommandListener = (command: GameCommand) => void;
const commandListeners = new Set<CommandListener>();

export const gameCommands = {
  send(command: GameCommand): void {
    commandListeners.forEach((l) => l(command));
  },
  on(listener: CommandListener): () => void {
    commandListeners.add(listener);
    return () => {
      commandListeners.delete(listener);
    };
  },
};
