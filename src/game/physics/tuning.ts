/**
 * Movement tuning in px and px/s. Starting values come from the concept brief (§8) and are
 * expected to change through playtesting. In dev builds the tuning panel (press `) edits this
 * object live.
 */
export const TUNING = {
  /** Ground acceleration while holding a direction. */
  accel: 900,
  /** Acceleration while airborne (lower = floatier, less air control). */
  airAccel: 620,
  /** Multiplier applied when pushing against the current direction, so turning feels snappy. */
  turnBoost: 1.8,
  maxSpeed: 260,
  /** Deceleration when no direction is held, so the ball slows predictably instead of sliding. */
  groundDecel: 1000,
  airDecel: 220,
  gravity: 900,
  maxFall: 760,
  bounceVelocity: -430,
  /** Bounce pressed just before landing (within superWindowMs) launches higher. */
  superBounceVelocity: -580,
  springVelocity: -700,
  /** Bouncy cloud puffs: softer than a spring, still big. */
  puffVelocity: -620,
  /** Velocity multiplier applied when Bounce is released early (variable bounce height). */
  jumpCut: 0.5,
  /** Grace period after rolling off a ledge where a bounce still works. */
  coyoteMs: 90,
  /** A bounce pressed this long before touching ground still fires on landing. */
  bufferMs: 130,
  superWindowMs: 90,
  /** Landing faster than this produces a small passive hop, which keeps the ball feeling springy. */
  hopThreshold: 470,
  hopRestitution: 0.22,
  /** Upward push inside a fan's column, and the fastest it can lift you. */
  updraftAccel: 2000,
  updraftMaxRise: 360,
  /** Horizontal slowdown inside a fan column when no direction is held. */
  updraftDrift: 900,
  /** Vertical damping inside a fan column; higher = less bobbing. */
  updraftDamping: 3,
  /** Upward push when fully under water; the ball floats about 60% submerged. */
  buoyancy: 1500,
  waterDrag: 2.4,
  /** Horizontal speed multiplier when fully submerged. */
  waterSpeed: 0.65,
  /** Downward push while holding Dive in water. */
  diveAccel: 650,
  /** Tapping Bounce while fully underwater gives a swim stroke upward. */
  swimStroke: 300,
  /** Sideways push of water currents. */
  currentAccel: 520,
};

export type TuningKey = keyof typeof TUNING;

export const TUNING_DEFAULTS: Readonly<typeof TUNING> = { ...TUNING };

/** [min, max, step] for the dev tuning panel. */
export const TUNING_RANGES: Partial<Record<TuningKey, [number, number, number]>> = {
  accel: [200, 2400, 10],
  airAccel: [100, 2000, 10],
  maxSpeed: [100, 500, 5],
  groundDecel: [100, 3000, 10],
  gravity: [300, 2000, 10],
  bounceVelocity: [-900, -200, 5],
  superBounceVelocity: [-1100, -300, 5],
  springVelocity: [-1400, -400, 10],
  jumpCut: [0.1, 1, 0.05],
  coyoteMs: [0, 250, 5],
  bufferMs: [0, 300, 5],
  superWindowMs: [0, 250, 5],
  updraftAccel: [500, 4000, 50],
  buoyancy: [500, 3000, 50],
  waterDrag: [0, 8, 0.1],
};
