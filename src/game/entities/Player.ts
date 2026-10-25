import Phaser from 'phaser';
import { BallDisplay, type FaceKey } from '../art/ballDisplay';
import { TUNING } from '../physics/tuning';

export const PLAYER_RADIUS = 12;
const BODY_RADIUS = 11;

export type BounceKind = 'normal' | 'super' | 'spring' | 'puff';

/** What the world is doing to the ball this frame (computed by GameScene). */
export interface PlayerEnv {
  /** 0 = dry, 1 = fully under water. */
  submersion: number;
  /** Holding Dive while in water. */
  diving: boolean;
  /** Inside a fan's column. */
  updraft: boolean;
  /** Water current direction at the player: 1 right, -1 left, 0 none. */
  current?: number;
  /** Per-level multiplier on water buoyancy. */
  buoyancyScale?: number;
}

const DRY: PlayerEnv = { submersion: 0, diving: false, updraft: false };

function approach(value: number, target: number, step: number): number {
  return value < target ? Math.min(value + step, target) : Math.max(value - step, target);
}

/**
 * The hero ball. An invisible physics image does the collision work; the visible BallDisplay
 * follows it after each physics step, adding roll, squash/stretch and facial expressions.
 *
 * Events: 'bounce' (kind), 'land' (impact speed px/s).
 */
export class Player extends Phaser.Events.EventEmitter {
  readonly sprite: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  readonly display: BallDisplay;
  alive = true;
  /** Ignores input (level complete). */
  frozen = false;

  private squash = 0;
  private roll = 0;
  private wasGrounded = false;
  private airVy = 0;
  private lastGroundAt = -Infinity;
  private lastLandAt = -Infinity;
  private landImpact = 0;
  private bouncePressedAt = -Infinity;
  private canCutJump = false;
  private happyUntil = 0;
  private nextBlinkAt = 0;
  private invulnerableUntil = 0;
  /** Extra uniform scale for the respawn pop-in; tweened, applied on top of squash. */
  private spawnScale = 1;

  constructor(private readonly scene: Phaser.Scene, x: number, y: number) {
    super();
    this.sprite = scene.physics.add.image(x, y, 'ball');
    this.sprite.setVisible(false);
    this.sprite.setCircle(BODY_RADIUS, PLAYER_RADIUS - BODY_RADIUS, PLAYER_RADIUS - BODY_RADIUS);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setMaxVelocityY(TUNING.maxFall);
    this.display = new BallDisplay(scene, x, y);
    this.display.container.setDepth(5);
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncDisplay, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncDisplay, this));
  }

  get body(): Phaser.Physics.Arcade.Body {
    return this.sprite.body;
  }
  get x(): number {
    return this.body.center.x;
  }
  get y(): number {
    return this.body.center.y;
  }
  get vx(): number {
    return this.body.velocity.x;
  }
  get vy(): number {
    return this.body.velocity.y;
  }
  get bottom(): number {
    return this.body.bottom;
  }
  get invulnerable(): boolean {
    return this.scene.time.now < this.invulnerableUntil;
  }
  get grounded(): boolean {
    return this.body.blocked.down || this.body.touching.down;
  }

  /** Called on the press edge only; the press is buffered so early taps still count. */
  pressBounce(now: number): void {
    this.bouncePressedAt = now;
  }

  update(now: number, dt: number, moveX: number, bounceHeld: boolean, env: PlayerEnv = DRY): void {
    if (!this.alive) return;
    const body = this.body;
    body.setMaxVelocityY(TUNING.maxFall);
    const grounded = this.grounded;
    if (this.frozen) {
      moveX = 0;
      bounceHeld = false;
      this.bouncePressedAt = -Infinity;
    }

    if (grounded) {
      if (!this.wasGrounded) this.onLand(now);
      this.lastGroundAt = now;
    } else {
      this.airVy = body.velocity.y;
    }
    this.wasGrounded = grounded;

    // Horizontal: accelerate toward the stick/key direction, decelerate when released.
    let vx = body.velocity.x;
    if (Math.abs(moveX) > 0.05) {
      const accel = grounded ? TUNING.accel : TUNING.airAccel;
      const turning = Math.sign(moveX) !== Math.sign(vx) && Math.abs(vx) > 10;
      vx += moveX * accel * (turning ? TUNING.turnBoost : 1) * dt;
      const cap = TUNING.maxSpeed * Math.abs(moveX) * (1 - (1 - TUNING.waterSpeed) * env.submersion);
      if (Math.abs(vx) > cap) vx = approach(vx, Math.sign(vx) * cap, TUNING.groundDecel * dt);
    } else {
      // Wind columns act like air resistance, so letting go of the stick hovers you in place.
      const decel = grounded ? TUNING.groundDecel : env.updraft ? TUNING.updraftDrift : TUNING.airDecel;
      vx = approach(vx, 0, decel * dt);
    }
    body.setVelocityX(vx);

    if (env.updraft) {
      // Push up, with damping so the ball settles into a steady hover near the column top.
      let vy = body.velocity.y - TUNING.updraftAccel * dt;
      vy -= vy * TUNING.updraftDamping * dt;
      body.setVelocityY(Math.max(vy, -TUNING.updraftMaxRise));
    }
    if (env.submersion > 0) {
      const s = env.submersion;
      let vy = body.velocity.y;
      vy += (env.diving ? TUNING.diveAccel : -TUNING.buoyancy * (env.buoyancyScale ?? 1) * s) * dt;
      // No drag on a fresh hop out of the water, so it reaches full bounce height.
      if (vy > -200) vy -= vy * TUNING.waterDrag * s * dt;
      body.setVelocityY(vy);
      // Floating at the surface counts as footing, so Bounce hops out of the water.
      if (s < 0.95 && !env.diving) this.lastGroundAt = now;
      // Fully underwater, Bounce is a swim stroke upward.
      if (s >= 0.95 && now - this.bouncePressedAt <= TUNING.bufferMs) {
        this.bouncePressedAt = -Infinity;
        body.setVelocityY(Math.min(body.velocity.y, -TUNING.swimStroke));
        this.emit('stroke');
      }
      if (env.current) {
        const push = env.current * TUNING.currentAccel * s * dt;
        body.setVelocityX(Phaser.Math.Clamp(body.velocity.x + push, -TUNING.maxSpeed * 1.4, TUNING.maxSpeed * 1.4));
      }
    }

    // Bounce with buffering and coyote time.
    const buffered = now - this.bouncePressedAt <= TUNING.bufferMs;
    const onGroundRecently = now - this.lastGroundAt <= TUNING.coyoteMs;
    if (buffered && onGroundRecently) {
      const pressedJustBeforeLanding =
        this.bouncePressedAt < this.lastLandAt &&
        this.lastLandAt - this.bouncePressedAt <= TUNING.superWindowMs &&
        this.landImpact > 250;
      this.launch(pressedJustBeforeLanding ? 'super' : 'normal');
    }

    // Releasing early cuts a normal bounce short (variable height).
    if (this.canCutJump) {
      if (body.velocity.y >= 0) this.canCutJump = false;
      else if (!bounceHeld) {
        body.setVelocityY(body.velocity.y * TUNING.jumpCut);
        this.canCutJump = false;
      }
    }

    this.roll += (vx * dt) / PLAYER_RADIUS;
    this.squash = Math.max(0, this.squash - dt * 4);
    this.updateFace(now);
  }

  launch(kind: BounceKind): void {
    const vy =
      kind === 'super'
        ? TUNING.superBounceVelocity
        : kind === 'spring'
          ? TUNING.springVelocity
          : kind === 'puff'
            ? TUNING.puffVelocity
            : TUNING.bounceVelocity;
    this.body.setVelocityY(vy);
    this.lastGroundAt = -Infinity;
    this.bouncePressedAt = -Infinity;
    this.canCutJump = kind === 'normal';
    this.wasGrounded = false;
    // Brief stretch on takeoff.
    this.squash = 0;
    if (kind !== 'normal') this.happyUntil = this.scene.time.now + 500;
    this.emit('bounce', kind);
  }

  private onLand(now: number): void {
    const impact = Math.max(0, this.airVy);
    this.lastLandAt = now;
    this.landImpact = impact;
    this.squash = Phaser.Math.Clamp(impact / 650, 0.08, 0.55);
    this.emit('land', impact);
    const bounceQueued = now - this.bouncePressedAt <= TUNING.bufferMs;
    if (impact > TUNING.hopThreshold && !bounceQueued) {
      this.body.setVelocityY(-impact * TUNING.hopRestitution);
    }
  }

  private updateFace(now: number): void {
    let face: FaceKey = 'face-idle';
    if (!this.alive) face = 'face-hurt';
    else if (now < this.happyUntil || this.frozen) face = 'face-happy';
    else if (this.body.velocity.y > 520) face = 'face-scared';
    else if (now >= this.nextBlinkAt) {
      face = 'face-blink';
      if (now >= this.nextBlinkAt + 120) this.nextBlinkAt = now + Phaser.Math.Between(1800, 4200);
    }
    this.display.setFace(face);
  }

  cheer(): void {
    this.happyUntil = this.scene.time.now + 700;
  }

  private syncDisplay(): void {
    if (!this.alive) return;
    const body = this.body;
    const stretch = this.grounded ? 0 : Phaser.Math.Clamp(Math.abs(body.velocity.y) / 1500, 0, 0.16);
    this.display.place(body.center.x, body.center.y, this.squash - stretch, PLAYER_RADIUS);
    if (this.spawnScale !== 1) {
      const c = this.display.container;
      c.setScale(c.scaleX * this.spawnScale, c.scaleY * this.spawnScale);
    }
    this.display.body.rotation = this.roll;
    const lookX = Phaser.Math.Clamp(body.velocity.x / TUNING.maxSpeed, -1, 1) * 2.5;
    const lookY = Phaser.Math.Clamp(body.velocity.y / 600, -1, 1) * 1.5;
    this.display.face.setPosition(Math.round(lookX), Math.round(lookY));
    const flicker = this.invulnerable && Math.floor(this.scene.time.now / 80) % 2 === 0;
    this.display.container.setAlpha(flicker ? 0.35 : 1);
  }

  die(): void {
    if (!this.alive) return;
    this.alive = false;
    this.display.setFace('face-hurt');
    this.body.setVelocity(0, 0);
    this.body.enable = false;
    this.scene.tweens.add({
      targets: this.display.container,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0,
      duration: 160,
      ease: 'Quad.easeOut',
    });
  }

  respawn(x: number, y: number): void {
    this.scene.tweens.killTweensOf([this.display.container, this]);
    this.body.enable = true;
    this.body.reset(x, y);
    this.alive = true;
    this.frozen = false;
    this.wasGrounded = false;
    this.airVy = 0;
    this.squash = 0;
    this.lastGroundAt = -Infinity;
    this.bouncePressedAt = -Infinity;
    this.canCutJump = false;
    this.invulnerableUntil = this.scene.time.now + 900;
    this.display.container.setAlpha(1);
    this.spawnScale = 0.2;
    this.scene.tweens.add({ targets: this, spawnScale: 1, duration: 220, ease: 'Back.easeOut' });
  }
}
