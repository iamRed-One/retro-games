import Phaser from 'phaser';

type EffectKind = 'sparks' | 'dust' | 'bits' | 'stars' | 'drops';

/** Small pooled particle bursts for feedback (collect, land, pop, finish). */
export class Effects {
  private readonly emitters: Record<EffectKind, Phaser.GameObjects.Particles.ParticleEmitter>;

  constructor(scene: Phaser.Scene) {
    const make = (texture: string, config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig) =>
      scene.add.particles(0, 0, texture, { emitting: false, ...config }).setDepth(6);
    this.emitters = {
      sparks: make('spark', { speed: { min: 60, max: 170 }, lifespan: 420, scale: { start: 1.2, end: 0 }, gravityY: 200 }),
      dust: make('dust', { speed: { min: 20, max: 70 }, angle: { min: 200, max: 340 }, lifespan: 300, alpha: { start: 0.9, end: 0 }, gravityY: -40 }),
      bits: make('bit', { speed: { min: 120, max: 300 }, lifespan: 600, scale: { start: 1.5, end: 0.5 }, gravityY: 700 }),
      drops: make('drop', { speed: { min: 60, max: 180 }, angle: { min: 230, max: 310 }, lifespan: 500, gravityY: 600, scale: { start: 1.5, end: 0.6 } }),
      stars: make('star', { speed: { min: 80, max: 260 }, lifespan: 900, scale: { start: 1.3, end: 0 }, gravityY: 160, rotate: { min: 0, max: 360 } }),
    };
  }

  burst(kind: EffectKind, x: number, y: number, count: number): void {
    this.emitters[kind].explode(count, x, y);
  }
}
