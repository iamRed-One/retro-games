const KEY = 'rar.settings.v2';
const LEGACY_KEY = 'rar.settings.v1';

/**
 * Music and effects are separate so players can switch game music off and listen to their own
 * (Spotify, YouTube Music, ...) while keeping the gameplay sounds.
 */
export interface Settings {
  musicOn: boolean;
  musicVolume: number;
  sfxOn: boolean;
  sfxVolume: number;
  rumbleOn: boolean;
}

const DEFAULTS: Settings = { musicOn: true, musicVolume: 0.6, sfxOn: true, sfxVolume: 0.8, rumbleOn: true };

const clamp01 = (v: unknown, fallback: number) => (typeof v === 'number' ? Math.min(1, Math.max(0, v)) : fallback);

/** Browser storage may be unavailable (private mode, blocked site data), so every access is guarded. */
export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Settings>;
      return {
        musicOn: p.musicOn ?? DEFAULTS.musicOn,
        musicVolume: clamp01(p.musicVolume, DEFAULTS.musicVolume),
        sfxOn: p.sfxOn ?? DEFAULTS.sfxOn,
        sfxVolume: clamp01(p.sfxVolume, DEFAULTS.sfxVolume),
        rumbleOn: p.rumbleOn ?? DEFAULTS.rumbleOn,
      };
    }
    // Carry over the old single mute/volume setting.
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const p = JSON.parse(legacy) as { muted?: boolean; volume?: number };
      const volume = clamp01(p.volume, 0.7);
      return { musicOn: !p.muted, musicVolume: volume, sfxOn: !p.muted, sfxVolume: volume, rumbleOn: true };
    }
  } catch {
    // Fall through to defaults.
  }
  return { ...DEFAULTS };
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Settings simply won't persist.
  }
}
