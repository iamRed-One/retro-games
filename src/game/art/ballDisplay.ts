import Phaser from 'phaser';

export type FaceKey = 'face-idle' | 'face-blink' | 'face-happy' | 'face-scared' | 'face-hurt';

/**
 * The hero's visuals: a rolling body, a fixed lighting layer, and a face that looks where it
 * is going. Kept in a container so squash/stretch is applied in world axes, not the rolled axes.
 */
export class BallDisplay {
  readonly container: Phaser.GameObjects.Container;
  readonly body: Phaser.GameObjects.Image;
  readonly face: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.body = scene.add.image(0, 0, 'ball');
    const shine = scene.add.image(0, 0, 'ball-shine');
    this.face = scene.add.image(0, 0, 'face-idle');
    this.container = scene.add.container(x, y, [this.body, shine, this.face]);
  }

  setFace(key: FaceKey): void {
    if (this.face.texture.key !== key) this.face.setTexture(key);
  }

  /** `squash` > 0 flattens, < 0 stretches; the ball stays planted on its bottom edge. */
  place(x: number, y: number, squash: number, radius = 12): void {
    const sx = 1 + squash * 0.45;
    const sy = 1 - squash * 0.45;
    this.container.setScale(sx, sy);
    this.container.setPosition(x, y + (1 - sy) * radius);
  }
}
