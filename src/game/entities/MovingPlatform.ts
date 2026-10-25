import Phaser from 'phaser';
import type { MoverDef } from '../levels/types';
import type { Player } from './Player';

const WIDTH = 96;
const HEIGHT = 16;
const SPEED = 70;

/**
 * A one-way platform that drifts between two points. Arcade physics carries a rider along
 * horizontally through the platform's friction, so no extra parenting is needed.
 */
export class MovingPlatform {
  readonly sprite: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private readonly start: number;
  private dir = 1;

  constructor(scene: Phaser.Scene, private readonly def: MoverDef) {
    this.sprite = scene.physics.add.image(def.x + WIDTH / 2, def.y + HEIGHT / 2, 'mover');
    this.sprite.setDepth(2).setImmovable(true);
    this.sprite.body.setAllowGravity(false);
    this.start = def.axis === 'x' ? this.sprite.x : this.sprite.y;
  }

  update(player?: Player): void {
    const body = this.sprite.body;
    if (this.def.axis === 'x') {
      if (this.sprite.x >= this.start + this.def.range) this.dir = -1;
      else if (this.sprite.x <= this.start) this.dir = 1;
      body.setVelocity(SPEED * this.dir, 0);
    } else {
      // Lifts start at the bottom and rise first.
      if (this.sprite.y <= this.start - this.def.range) this.dir = 1;
      else if (this.sprite.y >= this.start) this.dir = -1;
      body.setVelocity(0, SPEED * this.dir);
      // Arcade only carries riders horizontally; on the way down, take the rider with us so
      // they don't float off the lift for a few frames when it reverses.
      if (this.dir === 1 && player && this.isCarrying(player)) {
        player.body.setVelocityY(Math.max(player.vy, SPEED));
      }
    }
  }

  private isCarrying(player: Player): boolean {
    const body = this.sprite.body;
    // A rider may still be moving up at lift speed on the frame the lift reverses.
    const onTop = Math.abs(player.bottom - body.top) <= 3 && player.vy >= -SPEED - 1;
    return onTop && player.x >= body.left - 4 && player.x <= body.right + 4;
  }

  /**
   * One-way: only collide when the player is above the top surface and not moving up relative
   * to the platform. Comparing against the platform's own velocity matters for lifts: a rider
   * on a rising lift moves upward too, and an absolute "falling" check made it drop through
   * and pop back every few frames (visible jitter).
   */
  canLand(player: Player): boolean {
    const body = this.sprite.body;
    return player.vy >= body.velocity.y - 1 && player.bottom <= body.top + 10;
  }
}
