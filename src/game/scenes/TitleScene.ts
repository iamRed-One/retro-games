import Phaser from 'phaser';
import { BallDisplay } from '../art/ballDisplay';
import { TILE, VIEW_HEIGHT } from '../config';
import { Parallax } from '../systems/parallax';

const FLOOR_Y = VIEW_HEIGHT - TILE * 2;
const DEMO_GRAVITY = 900;
const DEMO_BOUNCE = -430;
const SCROLL_SPEED = 70;
/** Ball sits a quarter of the way in, left of the title menu. */
const BALL_X_RATIO = 0.24;

/** Animated backdrop behind the React title menu: the hero bouncing along the meadow. */
export class TitleScene extends Phaser.Scene {
  private parallax!: Parallax;
  private grass!: Phaser.GameObjects.TileSprite;
  private dirt!: Phaser.GameObjects.TileSprite;
  private ball!: BallDisplay;
  private scroll = 0;
  private y = FLOOR_Y - 60;
  private vy = 0;
  private squash = 0;

  constructor() {
    super('Title');
  }

  create(): void {
    this.scroll = 0;
    this.vy = 0;
    const width = this.scale.width;
    this.parallax = new Parallax(this);
    this.grass = this.add.tileSprite(0, FLOOR_Y, width, TILE, 'tiles', 'grass').setOrigin(0);
    this.dirt = this.add.tileSprite(0, FLOOR_Y + TILE, width, TILE, 'tiles', 'dirt').setOrigin(0);
    this.ball = new BallDisplay(this, width * BALL_X_RATIO, this.y);
    this.ball.setFace('face-happy');

    const onResize = (size: Phaser.Structs.Size) => {
      this.grass.setSize(size.width, TILE);
      this.dirt.setSize(size.width, TILE);
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, onResize));
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(delta, 50) / 1000;
    this.scroll += SCROLL_SPEED * dt;
    this.parallax.update(this.scroll, dt);
    this.grass.tilePositionX = Math.round(this.scroll);
    this.dirt.tilePositionX = Math.round(this.scroll);

    this.vy += DEMO_GRAVITY * dt;
    this.y += this.vy * dt;
    const restY = FLOOR_Y - 12;
    if (this.y >= restY) {
      this.y = restY;
      this.vy = DEMO_BOUNCE;
      this.squash = 0.45;
    }
    this.squash = Math.max(0, this.squash - dt * 4);
    const stretch = Math.min(0.14, Math.abs(this.vy) / 1500);
    this.ball.place(this.scale.width * BALL_X_RATIO, this.y, this.squash > 0 ? this.squash : -stretch);
    this.ball.body.rotation += (SCROLL_SPEED * dt) / 12;
  }
}
