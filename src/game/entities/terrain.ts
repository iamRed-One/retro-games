import Phaser from 'phaser';
import { TILE } from '../config';
import type { FanDef, Point } from '../levels/types';
import type { Trigger } from './pickups';
import type { Player } from './Player';

const CRUMBLE_DELAY_MS = 450;
const CRUMBLE_RETURN_MS = 2600;

/**
 * A solid block that shakes when stood on, falls away, and returns a few seconds later.
 * Teaches "keep moving" without being a one-way trap.
 */
export class CrumbleBlock {
  readonly sprite: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  private state: 'solid' | 'shaking' | 'gone' = 'solid';
  private readonly home: Point;

  constructor(
    private readonly scene: Phaser.Scene,
    topLeft: Point,
    /** Returns true if the player overlaps this rect (so the block waits before returning). */
    private readonly isOccupied: (rect: Phaser.Geom.Rectangle) => boolean,
    private readonly onCrack: () => void,
  ) {
    this.home = { x: topLeft.x + TILE / 2, y: topLeft.y + TILE / 2 };
    this.sprite = scene.physics.add.staticImage(this.home.x, this.home.y, 'crumble').setDepth(2);
  }

  /** Collision callback: start crumbling only when the player lands on top. */
  touch(player: Player): void {
    if (this.state !== 'solid' || player.bottom > this.sprite.body.top + 4) return;
    this.state = 'shaking';
    this.onCrack();
    this.scene.tweens.add({ targets: this.sprite, x: this.home.x + 1.5, duration: 40, yoyo: true, repeat: 5 });
    this.scene.time.delayedCall(CRUMBLE_DELAY_MS, () => this.fall());
  }

  private fall(): void {
    this.state = 'gone';
    this.sprite.body.enable = false;
    this.scene.tweens.add({ targets: this.sprite, y: this.home.y + 48, alpha: 0, angle: 12, duration: 320, ease: 'Quad.easeIn' });
    this.scene.time.delayedCall(CRUMBLE_RETURN_MS, () => this.restore());
  }

  private restore(): void {
    const rect = new Phaser.Geom.Rectangle(this.home.x - TILE / 2, this.home.y - TILE / 2, TILE, TILE);
    if (this.isOccupied(rect)) {
      this.scene.time.delayedCall(300, () => this.restore());
      return;
    }
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.setPosition(this.home.x, this.home.y).setAngle(0).setAlpha(0);
    this.sprite.body.enable = true;
    this.state = 'solid';
    this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 200 });
  }
}

/** A fan that pushes the player upward while they are inside its column. */
export class Updraft implements Trigger {
  readonly bounds: Phaser.Geom.Rectangle;

  constructor(scene: Phaser.Scene, def: FanDef) {
    // Three tiles wide so steering into it is forgiving.
    this.bounds = new Phaser.Geom.Rectangle(def.x - TILE * 1.5, def.bottom - def.heightPx, TILE * 3, def.heightPx);
    const fan = scene.add.image(def.x, def.bottom, 'fan').setOrigin(0.5, 1).setDepth(2);
    scene.time.addEvent({
      delay: 70,
      loop: true,
      callback: () => fan.setTexture(fan.texture.key === 'fan' ? 'fan-2' : 'fan'),
    });
    const rise = 230;
    scene.add
      .particles(0, 0, 'wind', {
        emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(def.x - 36, def.bottom - 28, 72, 12), quantity: 1 },
        speedY: { min: -rise - 60, max: -rise + 40 },
        lifespan: ((def.heightPx - 20) / rise) * 1000,
        alpha: { start: 0.8, end: 0 },
        scaleY: { start: 1.5, end: 3 },
        frequency: 70,
      })
      .setDepth(1);
  }
}

/**
 * Water cells: semi-transparent volumes drawn over the player, with animated surface crests.
 * Answers how submerged a ball is so the player can float, dive and hop out.
 */
export class Water {
  private readonly crests: Phaser.GameObjects.TileSprite[] = [];

  constructor(
    scene: Phaser.Scene,
    private readonly grid: boolean[][],
    /** Level map, so surface crests only appear where water meets open air (not under rock). */
    private readonly map?: string[],
  ) {
    const color = 0x3a8fd6;
    for (let r = 0; r < grid.length; r++) {
      let c = 0;
      while (c < grid[r].length) {
        if (!grid[r][c]) {
          c++;
          continue;
        }
        const start = c;
        while (c < grid[r].length && grid[r][c]) c++;
        const x = start * TILE;
        const w = (c - start) * TILE;
        scene.add.rectangle(x, r * TILE, w, TILE, color, 0.42).setOrigin(0).setDepth(7);
        // Surface crests where the cell above is open; split into runs that share a surface.
        let s = start;
        while (s < c) {
          if (!this.isSurface(s, r)) {
            s++;
            continue;
          }
          const runStart = s;
          while (s < c && this.isSurface(s, r)) s++;
          this.crests.push(
            scene.add.tileSprite(runStart * TILE, r * TILE - 2, (s - runStart) * TILE, 8, 'water-top').setOrigin(0).setDepth(7.1),
          );
        }
      }
    }
  }

  private isWater(col: number, row: number): boolean {
    return row >= 0 && row < this.grid.length && col >= 0 && col < this.grid[row].length && this.grid[row][col];
  }

  /** Water cell with open air directly above it. */
  private isSurface(col: number, row: number): boolean {
    if (this.isWater(col, row - 1)) return false;
    const above = row > 0 ? this.map?.[row - 1]?.[col] : '.';
    return above === undefined || !'#BKX'.includes(above);
  }

  update(dt: number): void {
    for (const crest of this.crests) crest.tilePositionX += dt * 18;
  }

  /**
   * 0 when the ball is out of the water, 1 when fully under. Based on the bottom of the ball
   * relative to the surface of the water column it is in.
   */
  submersion(x: number, bottom: number, diameter: number): number {
    const col = Math.floor(x / TILE);
    let row = Math.floor((bottom - 1) / TILE);
    if (!this.isWater(col, row)) return 0;
    while (this.isWater(col, row - 1)) row--;
    const surface = row * TILE;
    return Phaser.Math.Clamp((bottom - surface) / diameter, 0, 1);
  }
}

/** Deadly lava pools: glowing volumes with an animated surface. */
export class Lava {
  private readonly crests: Phaser.GameObjects.TileSprite[] = [];

  constructor(scene: Phaser.Scene, private readonly grid: boolean[][]) {
    for (let r = 0; r < grid.length; r++) {
      let c = 0;
      while (c < grid[r].length) {
        if (!grid[r][c]) {
          c++;
          continue;
        }
        const start = c;
        while (c < grid[r].length && grid[r][c]) c++;
        const surface = !this.isLava(start, r - 1);
        scene.add.rectangle(start * TILE, r * TILE, (c - start) * TILE, TILE, 0xff5a1a, 0.92).setOrigin(0).setDepth(7);
        if (surface) {
          this.crests.push(scene.add.tileSprite(start * TILE, r * TILE - 2, (c - start) * TILE, 8, 'lava-top').setOrigin(0).setDepth(7.1));
          // Heat glow above the surface.
          scene.add.rectangle(start * TILE, r * TILE - 24, (c - start) * TILE, 24, 0xff7a2a, 0.12).setOrigin(0).setDepth(1);
        }
      }
    }
  }

  private isLava(col: number, row: number): boolean {
    return row >= 0 && row < this.grid.length && col >= 0 && col < this.grid[row].length && this.grid[row][col];
  }

  update(dt: number): void {
    for (const crest of this.crests) crest.tilePositionX += dt * 10;
  }

  /** True when the bottom of the ball dips into lava. */
  touches(x: number, bottom: number): boolean {
    return this.isLava(Math.floor(x / TILE), Math.floor((bottom - 4) / TILE));
  }
}

const GEYSER_IDLE = 1.6;
const GEYSER_WARN = 0.55;
const GEYSER_ERUPT = 1.1;
const GEYSER_HEIGHT = TILE * 4;

/** A vent that sputters, then shoots a column of fire on a timer. */
export class Geyser implements Trigger {
  readonly bounds: Phaser.Geom.Rectangle;
  private readonly flames: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly sputter: Phaser.GameObjects.Particles.ParticleEmitter;
  private t: number;
  private state: 'idle' | 'warn' | 'erupt' = 'idle';

  constructor(scene: Phaser.Scene, at: Point) {
    scene.add.image(at.x, at.y, 'geyser').setOrigin(0.5, 1).setDepth(3);
    this.bounds = new Phaser.Geom.Rectangle(at.x - 11, at.y - GEYSER_HEIGHT, 22, GEYSER_HEIGHT - 6);
    // Spread vents out of sync so a row of them makes a pattern to time.
    this.t = ((at.x / TILE) * 0.37) % (GEYSER_IDLE + GEYSER_WARN + GEYSER_ERUPT);
    const baseY = at.y - 10;
    this.flames = scene.add
      .particles(at.x, baseY, 'fire', {
        speedY: { min: -460, max: -380 },
        speedX: { min: -25, max: 25 },
        lifespan: 360,
        scale: { start: 2.6, end: 0.8 },
        alpha: { start: 1, end: 0.2 },
        frequency: 14,
        emitting: false,
      })
      .setDepth(6);
    this.sputter = scene.add
      .particles(at.x, baseY, 'fire', {
        speedY: { min: -120, max: -60 },
        speedX: { min: -30, max: 30 },
        lifespan: 300,
        scale: { start: 1.4, end: 0 },
        frequency: 60,
        emitting: false,
      })
      .setDepth(6);
  }

  /** Only dangerous while erupting. */
  get active(): boolean {
    return this.state === 'erupt';
  }

  update(dt: number): void {
    this.t += dt;
    const cycle = GEYSER_IDLE + GEYSER_WARN + GEYSER_ERUPT;
    const phase = this.t % cycle;
    const next = phase < GEYSER_IDLE ? 'idle' : phase < GEYSER_IDLE + GEYSER_WARN ? 'warn' : 'erupt';
    if (next === this.state) return;
    this.state = next;
    if (next === 'warn') this.sputter.start();
    else this.sputter.stop();
    if (next === 'erupt') this.flames.start();
    else this.flames.stop();
  }
}

/** A stinging jellyfish bobbing up and down in the water. */
export class Jelly implements Trigger {
  readonly bounds = new Phaser.Geom.Rectangle(0, 0, 20, 22);
  private readonly sprite: Phaser.GameObjects.Image;
  private t = Math.random() * Math.PI * 2;

  constructor(scene: Phaser.Scene, private readonly home: Point) {
    this.sprite = scene.add.image(home.x, home.y, 'jelly-0').setDepth(4);
  }

  update(dt: number): void {
    this.t += dt;
    const y = this.home.y + Math.sin(this.t * 1.3) * TILE * 1.5;
    this.sprite.setPosition(this.home.x, y).setTexture(`jelly-${Math.floor(this.t * 3) % 2}`);
    this.bounds.setTo(this.home.x - 10, y - 12, 20, 22);
  }
}

/** Visible streaks for water currents. */
export function addCurrentStreaks(scene: Phaser.Scene, currents: number[][]): void {
  for (let r = 0; r < currents.length; r++) {
    let c = 0;
    while (c < currents[r].length) {
      const dir = currents[r][c];
      if (!dir) {
        c++;
        continue;
      }
      const start = c;
      while (c < currents[r].length && currents[r][c] === dir) c++;
      const w = (c - start) * TILE;
      scene.add
        .particles(0, 0, 'wind', {
          emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(start * TILE, r * TILE + 4, w, TILE - 8), quantity: 1 },
          speedX: dir * 220,
          rotate: 90,
          lifespan: Math.min(1800, (w / 220) * 1000),
          alpha: { start: 0.7, end: 0 },
          scaleY: 2,
          frequency: Math.max(40, 2400 / (c - start)),
        })
        .setDepth(7.2);
    }
  }
}

/**
 * A secret room's fake walls: they look exactly like terrain but have no collision. Rolling
 * into them reveals the room (walls turn see-through) and counts the secret as found.
 */
export class SecretWalls {
  found = false;
  private readonly images: Phaser.GameObjects.Image[] = [];
  private readonly area: Phaser.Geom.Rectangle;

  constructor(scene: Phaser.Scene, walls: { col: number; row: number; frame: number }[], tint: number) {
    let minC = Infinity;
    let minR = Infinity;
    let maxC = -Infinity;
    let maxR = -Infinity;
    for (const w of walls) {
      this.images.push(scene.add.image(w.col * TILE, w.row * TILE, 'tiles', `t${w.frame}`).setOrigin(0).setDepth(5.6).setTint(tint));
      minC = Math.min(minC, w.col);
      minR = Math.min(minR, w.row);
      maxC = Math.max(maxC, w.col);
      maxR = Math.max(maxR, w.row);
    }
    this.area = new Phaser.Geom.Rectangle(minC * TILE, minR * TILE, (maxC - minC + 1) * TILE, (maxR - minR + 1) * TILE);
  }

  get exists(): boolean {
    return this.images.length > 0;
  }

  /** True the first time the player rolls into the fake wall. */
  check(x: number, y: number): boolean {
    if (this.found || !this.exists || !this.area.contains(x, y)) return false;
    this.found = true;
    for (const img of this.images) img.scene.tweens.add({ targets: img, alpha: 0.28, duration: 400 });
    return true;
  }
}
