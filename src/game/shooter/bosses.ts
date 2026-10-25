import type { EnemyKind } from './enemies';

/**
 * Boss definitions. Each boss cycles through the attacks of its current phase; phases split
 * its health evenly. Attack kinds are implemented in Boss.ts.
 */
export type Attack =
  | { kind: 'aimed'; count: number; gap: number; speed: number }
  | { kind: 'spread'; count: number; arc: number; speed: number }
  | { kind: 'ring'; count: number; speed: number }
  | { kind: 'spiral'; duration: number; rate: number; speed: number }
  | { kind: 'rain'; count: number; speed: number }
  | { kind: 'wave'; count: number; speed: number }
  | { kind: 'homing'; count: number; speed: number }
  | { kind: 'lightning'; count: number }
  | { kind: 'summon'; enemy: EnemyKind; count: number }
  | { kind: 'charge' };

export interface BossPhase {
  attacks: Attack[];
  /** Seconds between attacks. */
  pace: number;
  /** Vertical sway amplitude (px) and speed. */
  sway: number;
  swaySpeed: number;
}

export interface BossDef {
  id: string;
  name: string;
  /** Texture key (a matching `-roar` texture is used while attacking). */
  texture: string;
  hp: number;
  phases: BossPhase[];
  track: 'boss' | 'super';
  /** Hit ellipse half-size. */
  hitbox: { rx: number; ry: number };
}

const STD = { rx: 52, ry: 36 };

export const BOSSES: Record<string, BossDef> = {
  grumble: {
    id: 'grumble',
    name: 'Grumble',
    texture: 'boss-grumble',
    hp: 40,
    track: 'boss',
    hitbox: STD,
    phases: [
      { pace: 1.5, sway: 110, swaySpeed: 0.9, attacks: [{ kind: 'aimed', count: 3, gap: 0.14, speed: 260 }, { kind: 'summon', enemy: 'flier', count: 2 }] },
      { pace: 1.25, sway: 140, swaySpeed: 1.1, attacks: [{ kind: 'spread', count: 5, arc: 0.8, speed: 250 }, { kind: 'ring', count: 10, speed: 180 }] },
    ],
  },
  crag: {
    id: 'crag',
    name: 'Crag',
    texture: 'boss-crag',
    hp: 50,
    track: 'boss',
    hitbox: STD,
    phases: [
      { pace: 1.5, sway: 100, swaySpeed: 0.8, attacks: [{ kind: 'rain', count: 6, speed: 230 }, { kind: 'aimed', count: 3, gap: 0.14, speed: 270 }] },
      { pace: 1.25, sway: 130, swaySpeed: 1, attacks: [{ kind: 'rain', count: 10, speed: 260 }, { kind: 'spread', count: 5, arc: 0.9, speed: 260 }, { kind: 'charge' }] },
    ],
  },
  gustav: {
    id: 'gustav',
    name: 'Gustav',
    texture: 'boss-gustav',
    hp: 55,
    track: 'boss',
    hitbox: STD,
    phases: [
      { pace: 1.45, sway: 130, swaySpeed: 1, attacks: [{ kind: 'wave', count: 4, speed: 230 }, { kind: 'ring', count: 12, speed: 185 }] },
      { pace: 1.2, sway: 160, swaySpeed: 1.2, attacks: [{ kind: 'wave', count: 6, speed: 250 }, { kind: 'spiral', duration: 2, rate: 0.09, speed: 200 }, { kind: 'summon', enemy: 'diver', count: 2 }] },
    ],
  },
  ripple: {
    id: 'ripple',
    name: 'Lady Ripple',
    texture: 'boss-ripple',
    hp: 60,
    track: 'boss',
    hitbox: STD,
    phases: [
      { pace: 1.4, sway: 120, swaySpeed: 0.9, attacks: [{ kind: 'wave', count: 5, speed: 240 }, { kind: 'homing', count: 2, speed: 170 }] },
      { pace: 1.15, sway: 150, swaySpeed: 1.1, attacks: [{ kind: 'ring', count: 14, speed: 190 }, { kind: 'homing', count: 3, speed: 180 }, { kind: 'wave', count: 6, speed: 260 }] },
    ],
  },
  nimbus: {
    id: 'nimbus',
    name: 'Nimbus',
    texture: 'boss-nimbus',
    hp: 65,
    track: 'boss',
    hitbox: STD,
    phases: [
      { pace: 1.4, sway: 130, swaySpeed: 1, attacks: [{ kind: 'lightning', count: 2 }, { kind: 'aimed', count: 3, gap: 0.12, speed: 290 }] },
      { pace: 1.15, sway: 160, swaySpeed: 1.2, attacks: [{ kind: 'lightning', count: 3 }, { kind: 'ring', count: 12, speed: 200 }, { kind: 'rain', count: 8, speed: 260 }] },
    ],
  },
  ink: {
    id: 'ink',
    name: 'Captain Ink',
    texture: 'boss-ink',
    hp: 70,
    track: 'boss',
    hitbox: STD,
    phases: [
      { pace: 1.4, sway: 120, swaySpeed: 0.9, attacks: [{ kind: 'spiral', duration: 2.2, rate: 0.09, speed: 195 }, { kind: 'homing', count: 2, speed: 180 }] },
      {
        pace: 1.1,
        sway: 150,
        swaySpeed: 1.1,
        attacks: [{ kind: 'spiral', duration: 2, rate: 0.08, speed: 210 }, { kind: 'homing', count: 3, speed: 190 }, { kind: 'summon', enemy: 'turret', count: 1 }, { kind: 'spread', count: 7, arc: 1, speed: 260 }],
      },
    ],
  },
  magmaw: {
    id: 'magmaw',
    name: 'Magmaw',
    texture: 'boss-magmaw',
    hp: 75,
    track: 'boss',
    hitbox: STD,
    phases: [
      { pace: 1.35, sway: 120, swaySpeed: 1, attacks: [{ kind: 'rain', count: 10, speed: 270 }, { kind: 'spread', count: 5, arc: 0.8, speed: 270 }] },
      { pace: 1.1, sway: 160, swaySpeed: 1.2, attacks: [{ kind: 'rain', count: 14, speed: 290 }, { kind: 'charge' }, { kind: 'ring', count: 16, speed: 200 }] },
    ],
  },
  volt: {
    id: 'volt',
    name: 'Volt',
    texture: 'boss-volt',
    hp: 80,
    track: 'boss',
    hitbox: STD,
    phases: [
      { pace: 1.3, sway: 140, swaySpeed: 1.1, attacks: [{ kind: 'lightning', count: 3 }, { kind: 'charge' }, { kind: 'aimed', count: 4, gap: 0.1, speed: 300 }] },
      { pace: 1.0, sway: 170, swaySpeed: 1.3, attacks: [{ kind: 'lightning', count: 4 }, { kind: 'spiral', duration: 2.2, rate: 0.075, speed: 220 }, { kind: 'aimed', count: 5, gap: 0.09, speed: 320 }, { kind: 'charge' }] },
    ],
  },
  eclipse: {
    id: 'eclipse',
    name: 'Eclipse',
    texture: 'boss-eclipse',
    hp: 90,
    track: 'boss',
    hitbox: STD,
    phases: [
      { pace: 1.3, sway: 130, swaySpeed: 1, attacks: [{ kind: 'ring', count: 16, speed: 195 }, { kind: 'homing', count: 3, speed: 185 }] },
      { pace: 1.1, sway: 150, swaySpeed: 1.2, attacks: [{ kind: 'spiral', duration: 2.4, rate: 0.075, speed: 215 }, { kind: 'wave', count: 6, speed: 260 }, { kind: 'summon', enemy: 'diver', count: 3 }] },
      { pace: 0.95, sway: 170, swaySpeed: 1.4, attacks: [{ kind: 'lightning', count: 4 }, { kind: 'rain', count: 12, speed: 290 }, { kind: 'spread', count: 9, arc: 1.2, speed: 280 }] },
    ],
  },
  baron: {
    id: 'baron',
    name: 'Baron Murk',
    texture: 'boss-baron',
    hp: 150,
    track: 'super',
    hitbox: { rx: 70, ry: 48 },
    phases: [
      { pace: 1.2, sway: 120, swaySpeed: 0.9, attacks: [{ kind: 'aimed', count: 5, gap: 0.1, speed: 300 }, { kind: 'summon', enemy: 'flier', count: 3 }, { kind: 'spread', count: 7, arc: 1, speed: 270 }] },
      { pace: 1.05, sway: 150, swaySpeed: 1.1, attacks: [{ kind: 'ring', count: 18, speed: 200 }, { kind: 'wave', count: 6, speed: 260 }, { kind: 'summon', enemy: 'zigzag', count: 3 }] },
      { pace: 0.95, sway: 170, swaySpeed: 1.3, attacks: [{ kind: 'spiral', duration: 2.6, rate: 0.07, speed: 220 }, { kind: 'homing', count: 4, speed: 195 }, { kind: 'lightning', count: 4 }] },
      {
        pace: 0.8,
        sway: 190,
        swaySpeed: 1.5,
        attacks: [{ kind: 'rain', count: 14, speed: 300 }, { kind: 'spiral', duration: 2, rate: 0.06, speed: 240 }, { kind: 'charge' }, { kind: 'spread', count: 11, arc: 1.4, speed: 290 }, { kind: 'lightning', count: 5 }],
      },
    ],
  },
};
