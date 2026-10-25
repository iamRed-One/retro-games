import Phaser from 'phaser';
import { THEMES, type Theme, type ThemeId } from '../art/palette';
import { VIEW_HEIGHT } from '../config';

const CLOUD_COUNT = 8;

/**
 * Layered backdrop for a theme, plus its atmosphere (bubbles, embers, rain, sparkles,
 * underwater tint and light shafts, lightning). Layers stay fixed to the camera and scroll
 * their texture instead, and re-lay themselves out when the canvas width changes.
 */
export class Parallax {
  private readonly sky: Phaser.GameObjects.Image;
  private readonly sun: Phaser.GameObjects.Image;
  private readonly far: Phaser.GameObjects.TileSprite;
  private readonly near: Phaser.GameObjects.TileSprite;
  private readonly base: Phaser.GameObjects.Rectangle;
  private readonly clouds: { img: Phaser.GameObjects.Image; speed: number; baseX: number }[] = [];
  private readonly overlay: Phaser.GameObjects.Rectangle | null = null;
  private readonly flash: Phaser.GameObjects.Rectangle | null = null;
  private readonly rays: Phaser.GameObjects.Graphics | null = null;
  private readonly ambient: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private width: number;
  private drift = 0;
  private nextLightning = 4;

  constructor(private readonly scene: Phaser.Scene, themeId: ThemeId = 'day') {
    const theme = THEMES[themeId];
    this.width = scene.scale.width;
    this.sky = scene.add.image(0, 0, `sky-${themeId}`).setOrigin(0).setScrollFactor(0).setDepth(-10);
    this.sun = scene.add.image(0, 96, `sun-${themeId}`).setScrollFactor(0).setDepth(-9);
    for (let i = 0; i < CLOUD_COUNT; i++) {
      const img = scene.add
        .image(0, 40 + ((i * 53) % 150), 'cloud')
        .setScrollFactor(0)
        .setDepth(-8)
        .setAlpha(0.9)
        .setTint(theme.cloudTint);
      this.clouds.push({ img, speed: 6 + i * 2.5, baseX: i * 190 });
    }
    this.far = scene.add.tileSprite(0, VIEW_HEIGHT - 300, this.width, 160, `hills-far-${themeId}`).setOrigin(0).setScrollFactor(0).setDepth(-7);
    this.near = scene.add.tileSprite(0, VIEW_HEIGHT - 200, this.width, 140, `hills-near-${themeId}`).setOrigin(0).setScrollFactor(0).setDepth(-6);
    // Solid base under the near hills so pits and short levels never show bare sky below them.
    this.base = scene.add
      .rectangle(0, VIEW_HEIGHT - 61, this.width, 61, Phaser.Display.Color.HexStringToColor(theme.hillNear).color)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-6);

    if (theme.lightRays) {
      this.rays = scene.add.graphics().setScrollFactor(0).setDepth(-5).setBlendMode(Phaser.BlendModes.ADD);
    }
    if (theme.overlay) {
      this.overlay = scene.add
        .rectangle(0, 0, this.width, VIEW_HEIGHT, theme.overlay.color, theme.overlay.alpha)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(6.5);
    }
    if (theme.lightning) {
      this.flash = scene.add.rectangle(0, 0, this.width, VIEW_HEIGHT, 0xe8eeff, 0).setOrigin(0).setScrollFactor(0).setDepth(-5);
    }
    this.ambient = this.createAmbient(theme);

    this.layout(this.width);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this));
  }

  private createAmbient(theme: Theme): Phaser.GameObjects.Particles.ParticleEmitter | null {
    const zone = (y: number, h: number) => ({
      type: 'random' as const,
      source: new Phaser.Geom.Rectangle(0, y, this.width, h),
      quantity: 1,
    });
    const make = (texture: string, config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig, depth = -4) =>
      this.scene.add.particles(0, 0, texture, config).setScrollFactor(0).setDepth(depth);
    switch (theme.ambient) {
      case 'bubbles':
        return make('bubble', {
          emitZone: zone(VIEW_HEIGHT, 10),
          speedY: { min: -70, max: -30 },
          speedX: { min: -10, max: 10 },
          lifespan: 9000,
          scale: { min: 1, max: 2.2 },
          frequency: 160,
        });
      case 'embers':
        return make('ember', {
          emitZone: zone(VIEW_HEIGHT, 10),
          speedY: { min: -90, max: -40 },
          speedX: { min: -25, max: 25 },
          lifespan: 7000,
          alpha: { start: 1, end: 0 },
          scale: { min: 1, max: 2 },
          frequency: 120,
        });
      case 'rain':
        return make(
          'raindrop',
          {
            emitZone: zone(-20, 10),
            speedY: { min: 520, max: 640 },
            speedX: -120,
            rotate: 12,
            lifespan: 1300,
            scaleY: { min: 2, max: 3.5 },
            scaleX: 2,
            frequency: 12,
          },
          7,
        );
      case 'sparkles':
        return make('spark', {
          emitZone: zone(0, VIEW_HEIGHT * 0.7),
          lifespan: 1400,
          alpha: { start: 0, end: 0, ease: (t: number) => Math.sin(t * Math.PI) },
          scale: { start: 1.2, end: 0.2 },
          frequency: 220,
        });
      default:
        return null;
    }
  }

  private onResize(gameSize: Phaser.Structs.Size): void {
    this.layout(gameSize.width);
  }

  private layout(width: number): void {
    this.width = width;
    // The sky is horizontal bands, so stretching it sideways is invisible.
    this.sky.setDisplaySize(width, VIEW_HEIGHT);
    this.sun.x = width - 170;
    this.far.setSize(width, 160);
    this.near.setSize(width, 140);
    this.base.setSize(width, 61);
    this.overlay?.setSize(width, VIEW_HEIGHT);
    this.flash?.setSize(width, VIEW_HEIGHT);
    const zone = this.ambient?.emitZones[0] as { source?: Phaser.Geom.Rectangle } | undefined;
    if (zone?.source) zone.source.width = width;
  }

  update(scrollX: number, dt: number): void {
    this.drift += dt;
    this.far.tilePositionX = Math.round(scrollX * 0.15);
    this.near.tilePositionX = Math.round(scrollX * 0.35);
    const span = this.width + 128;
    for (const c of this.clouds) {
      const x = c.baseX - scrollX * 0.06 - this.drift * c.speed;
      c.img.x = Math.round((((x % span) + span) % span) - 64);
    }
    if (this.rays) this.drawRays(scrollX);
    if (this.flash) {
      this.nextLightning -= dt;
      if (this.nextLightning <= 0) {
        this.nextLightning = 4 + Math.random() * 6;
        this.flash.setAlpha(0.55);
        this.scene.tweens.add({ targets: this.flash, alpha: 0, duration: 450, ease: 'Quad.easeOut' });
      }
    }
  }

  /** Swaying shafts of light from the surface. */
  private drawRays(scrollX: number): void {
    const g = this.rays!;
    g.clear();
    for (let i = 0; i < 5; i++) {
      const x = ((i * 260 - scrollX * 0.1) % (this.width + 300)) - 150 + Math.sin(this.drift * 0.4 + i) * 30;
      g.fillStyle(0xbff4ff, 0.06 + 0.03 * Math.sin(this.drift * 0.7 + i * 2));
      g.fillTriangle(x, 0, x + 80, 0, x + 220, VIEW_HEIGHT);
    }
  }
}
