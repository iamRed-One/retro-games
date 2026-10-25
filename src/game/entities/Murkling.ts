import Phaser from 'phaser';
import type { EnemyDef } from '../levels/types';

const SPEED = 38;
export const MURKLING_RADIUS = 11;

/**
 * Platform-level villain. Paces back and forth over its patrol range. Bouncing on its head
 * pops it; touching it from the side hurts.
 */
export class Murkling {
  readonly sprite: Phaser.GameObjects.Image;
  alive = true;
  private dir = -1;
  private stepTimer = 0;
  private frame = 0;

  constructor(private readonly scene: Phaser.Scene, private readonly def: EnemyDef) {
    this.sprite = scene.add.image(def.x, def.bottom, 'murk-walk-0').setOrigin(0.5, 1).setDepth(3);
  }

  get x(): number {
    return this.sprite.x;
  }
  /** Center of the body, for collision. */
  get y(): number {
    return this.sprite.y - 13;
  }

  update(dt: number): void {
    if (!this.alive) return;
    if (this.def.maxX > this.def.minX) {
      this.sprite.x += this.dir * SPEED * dt;
      if (this.sprite.x <= this.def.minX) {
        this.sprite.x = this.def.minX;
        this.dir = 1;
      } else if (this.sprite.x >= this.def.maxX) {
        this.sprite.x = this.def.maxX;
        this.dir = -1;
      }
      this.sprite.setFlipX(this.dir > 0);
    }
    this.stepTimer += dt;
    if (this.stepTimer > 0.22) {
      this.stepTimer = 0;
      this.frame = 1 - this.frame;
      this.sprite.setTexture(`murk-walk-${this.frame}`);
    }
  }

  pop(): void {
    this.alive = false;
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.6,
      scaleY: 0.2,
      alpha: 0,
      duration: 220,
      ease: 'Quad.easeOut',
      onComplete: () => this.sprite.destroy(),
    });
  }
}
