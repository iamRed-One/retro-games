import Phaser from 'phaser';
import { TUNING } from '../physics/tuning';

/** Follow camera with a deadzone and a gentle look-ahead in the direction of travel. */
export class CameraRig {
  private lookAhead = 0;

  constructor(
    private readonly cam: Phaser.Cameras.Scene2D.Camera,
    target: Phaser.GameObjects.GameObject & { x: number; y: number },
    worldWidth: number,
    worldHeight: number,
  ) {
    cam.setBounds(0, 0, worldWidth, worldHeight);
    cam.startFollow(target, true, 0.12, 0.14);
    cam.setDeadzone(80, 90);
    cam.setRoundPixels(true);
  }

  update(dt: number, velocityX: number): void {
    const goal = Phaser.Math.Clamp(velocityX / TUNING.maxSpeed, -1, 1) * 90;
    this.lookAhead += (goal - this.lookAhead) * Math.min(1, dt * 2.5);
    this.cam.setFollowOffset(-this.lookAhead, 24);
  }
}
