import Phaser from 'phaser';
import type { Point } from '../levels/types';

/**
 * Trigger-style world objects. Each exposes a `bounds` rectangle that GameScene tests against
 * the player's circle every frame, which keeps overlap logic explicit and easy to follow.
 */
export interface Trigger {
  readonly bounds: Phaser.Geom.Rectangle;
}

export class Collectible implements Trigger {
  readonly bounds: Phaser.Geom.Rectangle;
  readonly sprite: Phaser.GameObjects.Image;
  collected = false;

  constructor(private readonly scene: Phaser.Scene, at: Point) {
    this.sprite = scene.add.image(at.x, at.y, 'seed').setDepth(2);
    this.bounds = new Phaser.Geom.Rectangle(at.x - 10, at.y - 10, 20, 20);
    scene.tweens.add({
      targets: this.sprite,
      y: at.y - 3,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: (at.x * 7) % 700,
    });
  }

  collect(): void {
    this.collected = true;
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - 18,
      scale: 0,
      duration: 220,
      ease: 'Back.easeIn',
      onComplete: () => this.sprite.destroy(),
    });
  }
}

export class Spikes implements Trigger {
  readonly bounds: Phaser.Geom.Rectangle;

  /** `at` is the floor (or ceiling) point the spikes grow from. */
  constructor(scene: Phaser.Scene, at: Point & { ceiling: boolean }) {
    const img = scene.add.image(at.x, at.y, 'spikes').setDepth(2);
    if (at.ceiling) {
      img.setOrigin(0.5, 0).setFlipY(true);
      this.bounds = new Phaser.Geom.Rectangle(at.x - 12, at.y, 24, 12);
    } else {
      img.setOrigin(0.5, 1);
      // Smaller than the art so near misses feel fair.
      this.bounds = new Phaser.Geom.Rectangle(at.x - 12, at.y - 12, 24, 12);
    }
  }
}

export class Spring implements Trigger {
  readonly bounds: Phaser.Geom.Rectangle;
  private readonly sprite: Phaser.GameObjects.Image;
  private readyAt = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    at: Point,
    /** Springs and bouncy cloud puffs share this behaviour with different art. */
    private readonly art: { idle: string; pressed: string } = { idle: 'spring', pressed: 'spring-pressed' },
  ) {
    this.sprite = scene.add.image(at.x, at.y, art.idle).setOrigin(0.5, 1).setDepth(2);
    this.bounds = new Phaser.Geom.Rectangle(at.x - 13, at.y - 16, 26, 16);
  }

  /** Returns true if the spring fired (it has a short cooldown so it can't double-trigger). */
  tryFire(now: number): boolean {
    if (now < this.readyAt) return false;
    this.readyAt = now + 200;
    this.sprite.setTexture(this.art.pressed);
    this.scene.time.delayedCall(120, () => this.sprite.setTexture(this.art.idle));
    return true;
  }
}

export class Checkpoint implements Trigger {
  readonly bounds: Phaser.Geom.Rectangle;
  readonly respawnPoint: Point;
  active = false;
  private readonly sprite: Phaser.GameObjects.Image;

  constructor(private readonly scene: Phaser.Scene, at: Point) {
    this.sprite = scene.add.image(at.x, at.y, 'flag-off').setOrigin(0.5, 1).setDepth(2);
    this.bounds = new Phaser.Geom.Rectangle(at.x - 14, at.y - 64, 28, 64);
    this.respawnPoint = { x: at.x, y: at.y - 14 };
  }

  activate(): void {
    this.active = true;
    this.sprite.setTexture('flag-on');
    this.sprite.setScale(1, 0.7);
    this.scene.tweens.add({ targets: this.sprite, scaleY: 1, duration: 300, ease: 'Back.easeOut' });
  }
}

export class Exit implements Trigger {
  readonly bounds: Phaser.Geom.Rectangle;
  readonly center: Point;

  constructor(scene: Phaser.Scene, at: Point) {
    const sprite = scene.add.image(at.x, at.y, 'exit').setOrigin(0.5, 1).setDepth(1);
    this.bounds = new Phaser.Geom.Rectangle(at.x - 14, at.y - 44, 28, 44);
    this.center = { x: at.x, y: at.y - 30 };
    const glow = scene.add.image(at.x, at.y - 30, 'star').setDepth(2).setAlpha(0.8);
    scene.tweens.add({ targets: glow, angle: 90, alpha: 0.2, duration: 900, yoyo: true, repeat: -1 });
    scene.tweens.add({ targets: sprite, scaleY: 1.03, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}
