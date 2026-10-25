import { uiStore } from '../bridge';

/**
 * Controller vibration (Gamepad API "dual-rumble"). Works on most PS4/PS5/Xbox pads in Chrome
 * and Edge; silently does nothing on pads or browsers without vibration support.
 */
export type RumbleKind = 'land' | 'spring' | 'hurt' | 'death' | 'explode' | 'roar' | 'bossDown' | 'pickup';

const PRESETS: Record<RumbleKind, { ms: number; strong: number; weak: number }> = {
  land: { ms: 60, strong: 0, weak: 0.25 },
  spring: { ms: 120, strong: 0.2, weak: 0.5 },
  pickup: { ms: 40, strong: 0, weak: 0.2 },
  hurt: { ms: 220, strong: 0.7, weak: 0.5 },
  death: { ms: 400, strong: 1, weak: 0.8 },
  explode: { ms: 140, strong: 0.5, weak: 0.4 },
  roar: { ms: 600, strong: 0.6, weak: 0.9 },
  bossDown: { ms: 1100, strong: 1, weak: 1 },
};

interface Actuator {
  playEffect(type: string, params: { duration: number; strongMagnitude: number; weakMagnitude: number; startDelay?: number }): Promise<unknown>;
}

export function rumble(kind: RumbleKind, scale = 1): void {
  if (!uiStore.get().rumbleOn) return;
  const preset = PRESETS[kind];
  let pads: (Gamepad | null)[] = [];
  try {
    pads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
  } catch {
    return;
  }
  for (const pad of pads) {
    const actuator = (pad as (Gamepad & { vibrationActuator?: Actuator }) | null)?.vibrationActuator;
    if (!pad?.connected || !actuator?.playEffect) continue;
    actuator
      .playEffect('dual-rumble', {
        duration: preset.ms,
        strongMagnitude: Math.min(1, preset.strong * scale),
        weakMagnitude: Math.min(1, preset.weak * scale),
      })
      .catch(() => {});
  }
}
