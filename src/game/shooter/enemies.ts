import Phaser from 'phaser';

export type EnemyKind = 'flier' | 'diver' | 'turret' | 'tank' | 'zigzag' | 'bomber' | 'sniper' | 'rock' | 'thundercloud';

export interface OrbOptions {
  /** Steers toward the player for a while. */
  homing?: boolean;
  /** Wavy shot: sine motion perpendicular to travel. */
  wave?: { amp: number; freq: number };
  /** Falls with gravity (bombs). */
  gravity?: number;
  texture?: string;
}

/** What enemies and bosses may ask of the shooter scene. */
export interface ShooterWorld {
  readonly width: number;
  readonly height: number;
  readonly playerX: number;
  readonly playerY: number;
  readonly difficulty: number;
  /** Position of the player nearest to (x, y): who enemies aim at in co-op. */
  target(x: number, y: number): { x: number; y: number };
  fireOrb(x: number, y: number, vx: number, vy: number, opts?: OrbOptions): void;
  /** Telegraph then strike a vertical bolt of lightning at x (from y down). */
  lightning(x: number, fromY?: number): void;
  spawnEnemy(kind: EnemyKind, x: number, y: number): void;
}

interface KindSpec {
  texture: string;
  frames: number;
  hp: number;
  radius: number;
  /** Chance of dropping a seed when defeated, and how many. */
  seedChance: number;
  seeds: number;
  /** Chance of dropping a power-up. */
  powerChance: number;
  /** Absorbs player shots (scenery you have to shoot through or go around). */
  blocksShots?: boolean;
}

const KINDS: Record<EnemyKind, KindSpec> = {
  flier: { texture: 'murk-fly', frames: 2, hp: 1, radius: 12, seedChance: 0.4, seeds: 1, powerChance: 0.03 },
  diver: { texture: 'murk-fly', frames: 2, hp: 2, radius: 12, seedChance: 0.6, seeds: 1, powerChance: 0.04 },
  turret: { texture: 'murk-turret', frames: 1, hp: 3, radius: 14, seedChance: 1, seeds: 1, powerChance: 0.08 },
  tank: { texture: 'murk-tank', frames: 1, hp: 6, radius: 21, seedChance: 1, seeds: 3, powerChance: 0.2 },
  zigzag: { texture: 'murk-zig', frames: 2, hp: 2, radius: 12, seedChance: 0.5, seeds: 1, powerChance: 0.04 },
  bomber: { texture: 'murk-bomber', frames: 1, hp: 4, radius: 16, seedChance: 1, seeds: 2, powerChance: 0.12 },
  sniper: { texture: 'murk-sniper', frames: 1, hp: 3, radius: 13, seedChance: 1, seeds: 1, powerChance: 0.1 },
  rock: { texture: 'sky-rock', frames: 1, hp: 10, radius: 22, seedChance: 1, seeds: 2, powerChance: 0.25, blocksShots: true },
  thundercloud: { texture: 'thundercloud', frames: 1, hp: 6, radius: 24, seedChance: 1, seeds: 2, powerChance: 0.15, blocksShots: true },
};

/** Velocity toward the player at `speed`, optionally rotated by `spread` radians. */
export function aimAt(w: ShooterWorld, x: number, y: number, speed: number, spread = 0): [number, number] {
  const t = w.target(x, y);
  const angle = Math.atan2(t.y - y, t.x - x) + spread;
  return [Math.cos(angle) * speed, Math.sin(angle) * speed];
}

/** A Murkling (or hazard) in the shooter sections. */
export class SkyEnemy {
  readonly sprite: Phaser.GameObjects.Image;
  readonly radius: number;
  readonly seedChance: number;
  readonly seeds: number;
  readonly powerChance: number;
  readonly blocksShots: boolean;
  hp: number;
  gone = false;
  private t = 0;
  private readonly baseY: number;
  private readonly phase = Math.random() * Math.PI * 2;
  private vx = 0;
  private vy = 0;
  private state: 'enter' | 'aim' | 'dash' | 'hold' | 'leave' = 'enter';
  private fireTimer: number;
  private shotsLeft = 2;
  private readonly targetX: number;
  private readonly spec: KindSpec;
  private readonly tint: number | null;

  constructor(scene: Phaser.Scene, readonly kind: EnemyKind, x: number, y: number, difficulty: number) {
    this.spec = KINDS[kind];
    this.radius = this.spec.radius;
    this.seedChance = this.spec.seedChance;
    this.seeds = this.spec.seeds;
    this.powerChance = this.spec.powerChance;
    this.blocksShots = !!this.spec.blocksShots;
    // Later worlds have tougher villains.
    const toughness = kind === 'flier' ? 0 : Math.floor((difficulty - 1) / 4);
    this.hp = this.spec.hp + toughness + (kind === 'tank' ? difficulty : 0);
    this.baseY = y;
    const tex = this.spec.frames > 1 ? `${this.spec.texture}-0` : this.spec.texture;
    this.sprite = scene.add.image(x, y, tex).setDepth(4);
    this.targetX = scene.scale.width - 110 - Math.random() * 120;
    this.fireTimer = 0.8 + Math.random() * 0.6;
    this.tint = kind === 'diver' ? 0xffb0b0 : null;
    if (this.tint) this.sprite.setTint(this.tint);
  }

  get x(): number {
    return this.sprite.x;
  }
  get y(): number {
    return this.sprite.y;
  }

  update(dt: number, w: ShooterWorld): void {
    this.t += dt;
    const d = w.difficulty;
    const speedUp = 1 + 0.05 * (d - 1);
    const fireRate = 1 + 0.08 * (d - 1);
    const orbSpeed = 210 + 14 * d;
    const s = this.sprite;
    if (this.spec.frames > 1) s.setTexture(`${this.spec.texture}-${Math.floor(this.t * 8) % 2}`);

    switch (this.kind) {
      case 'flier':
        s.x -= 160 * speedUp * dt;
        s.y = this.baseY + Math.sin(this.t * 3 + this.phase) * 45;
        break;
      case 'zigzag': {
        s.x -= 175 * speedUp * dt;
        // Triangle wave: sharp turns are harder to track than a sine.
        const f = (this.t * 1.4 + this.phase) % 1;
        s.y = this.baseY + (1 - 4 * Math.abs(f - 0.5)) * 75;
        break;
      }
      case 'diver':
        if (this.state === 'enter') {
          s.x += (w.width * 0.72 - s.x) * Math.min(1, dt * 3);
          s.y += (this.baseY - s.y) * Math.min(1, dt * 3);
          if (this.t > 1.0) this.state = 'aim';
        } else if (this.state === 'aim') {
          s.x += Math.sin(this.t * 60) * 1.5;
          if (this.t > 1.35) {
            [this.vx, this.vy] = aimAt(w, s.x, s.y, (380 + 25 * d) * speedUp);
            this.state = 'dash';
          }
        } else {
          s.x += this.vx * dt;
          s.y += this.vy * dt;
        }
        break;
      case 'turret':
        if (this.state === 'enter') {
          s.x += (this.targetX - s.x) * Math.min(1, dt * 2.5);
          if (this.t > 1.1) this.state = 'hold';
        } else if (this.state === 'hold') {
          s.y = this.baseY + Math.sin(this.t * 1.5 + this.phase) * 14;
          this.fireTimer -= dt;
          if (this.fireTimer <= 0) {
            this.fireTimer = 1.7 / fireRate;
            // Later turrets fire short bursts.
            const shots = d >= 6 ? 3 : d >= 3 ? 2 : 1;
            for (let i = 0; i < shots; i++) {
              const [vx, vy] = aimAt(w, s.x - 10, s.y, orbSpeed, (i - (shots - 1) / 2) * 0.18);
              w.fireOrb(s.x - 10, s.y, vx, vy);
            }
          }
          if (this.t > 7.5) this.state = 'leave';
        } else {
          s.x -= 220 * dt;
        }
        break;
      case 'tank':
        s.x -= 55 * speedUp * dt;
        s.y = this.baseY + Math.sin(this.t * 1.2 + this.phase) * 20;
        this.fireTimer -= dt;
        if (this.fireTimer <= 0 && s.x < w.width - 20) {
          this.fireTimer = 2.3 / fireRate;
          const spreads = d >= 5 ? [-0.36, -0.18, 0, 0.18, 0.36] : [-0.25, 0, 0.25];
          for (const spread of spreads) {
            const [vx, vy] = aimAt(w, s.x - 16, s.y, orbSpeed - 10, spread);
            w.fireOrb(s.x - 16, s.y, vx, vy);
          }
        }
        break;
      case 'bomber':
        // Cruises along the top and drops bombs when roughly above the player.
        s.x -= 90 * speedUp * dt;
        s.y = this.baseY + Math.sin(this.t * 2 + this.phase) * 8;
        this.fireTimer -= dt;
        if (this.fireTimer <= 0 && Math.abs(s.x - w.target(s.x, s.y).x) < 160) {
          this.fireTimer = 1.1 / fireRate;
          w.fireOrb(s.x, s.y + 14, -30, 40, { gravity: 420, texture: 'bomb' });
        }
        break;
      case 'sniper':
        if (this.state === 'enter') {
          s.x += (this.targetX - s.x) * Math.min(1, dt * 2.5);
          if (this.t > 1.1) this.state = 'hold';
        } else if (this.state === 'hold') {
          this.fireTimer -= dt;
          // Red flash telegraphs the shot.
          s.setTint(this.fireTimer < 0.4 && Math.floor(this.t * 16) % 2 === 0 ? 0xff5050 : 0xffffff);
          if (this.fireTimer <= 0) {
            this.fireTimer = 1.6 / fireRate;
            // Lead the target a little.
            const lead = w.target(s.x, s.y);
            const angle = Math.atan2(lead.y - s.y, lead.x - (s.x - 12));
            const speed = 430 + 12 * d;
            w.fireOrb(s.x - 12, s.y, Math.cos(angle) * speed, Math.sin(angle) * speed, { texture: 'snipe' });
            this.shotsLeft -= 1;
            if (this.shotsLeft <= 0) this.state = 'leave';
          }
        } else {
          s.clearTint();
          s.x -= 240 * dt;
        }
        break;
      case 'rock':
        s.x -= 85 * dt;
        s.y = this.baseY + Math.sin(this.t * 0.8 + this.phase) * 10;
        s.rotation += dt * 0.6;
        break;
      case 'thundercloud':
        s.x -= 60 * dt;
        this.fireTimer -= dt;
        s.setTint(this.fireTimer < 0.6 && Math.floor(this.t * 12) % 2 === 0 ? 0xfff2a0 : 0xffffff);
        if (this.fireTimer <= 0 && s.x < w.width - 40) {
          this.fireTimer = 2.6 / fireRate;
          w.lightning(s.x, s.y + 18);
        }
        break;
    }

    if (s.x < -90 || s.x > w.width + 240 || s.y < -120 || s.y > w.height + 120) this.gone = true;
  }

  /** Returns true when this hit defeats the enemy. */
  hit(damage: number): boolean {
    this.hp -= damage;
    this.sprite.setTintFill(0xffffff);
    this.sprite.scene.time.delayedCall(50, () => {
      if (!this.sprite.active) return;
      if (this.tint) this.sprite.setTint(this.tint);
      else this.sprite.clearTint();
    });
    return this.hp <= 0;
  }

  destroy(): void {
    this.gone = true;
    this.sprite.destroy();
  }
}
