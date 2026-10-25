import Phaser from 'phaser';
import type { Attack, BossDef } from './bosses';
import { aimAt, type ShooterWorld } from './enemies';

export interface BossWorld extends ShooterWorld {
  onBossPhase(phase: number, total: number): void;
  onBossRoar(): void;
}

/**
 * A data-driven boss: hovers on the right, cycles through its current phase's attacks, and
 * changes phase as its health drops (with a roar and a brief invulnerable moment).
 */
export class Boss {
  readonly sprite: Phaser.GameObjects.Image;
  hp: number;
  defeated = false;
  private t = 0;
  private phase = 0;
  private entering = true;
  private attackTimer = 1.6;
  private attackIndex = 0;
  private homeX: number;
  private invulnerableUntil = 0;
  /** Shots scheduled for the near future (bursts, spirals). */
  private queue: { at: number; fire: () => void }[] = [];
  private charging: { phase: 'out' | 'back'; vy: number } | null = null;

  constructor(private readonly scene: Phaser.Scene, readonly def: BossDef, w: BossWorld) {
    this.hp = def.hp;
    this.homeX = w.width - (def.id === 'baron' ? 190 : 170);
    this.sprite = scene.add.image(w.width + 180, w.height / 2, def.texture).setDepth(4);
  }

  get x(): number {
    return this.sprite.x;
  }
  get y(): number {
    return this.sprite.y;
  }
  get fraction(): number {
    return Math.max(0, this.hp / this.def.hp);
  }

  contains(x: number, y: number, pad = 0): boolean {
    const dx = (x - this.sprite.x) / (this.def.hitbox.rx + pad);
    const dy = (y - (this.sprite.y + 6)) / (this.def.hitbox.ry + pad);
    return dx * dx + dy * dy <= 1;
  }

  update(dt: number, w: BossWorld): void {
    if (this.defeated) return;
    this.t += dt;
    this.homeX = w.width - (this.def.id === 'baron' ? 190 : 170);
    const s = this.sprite;
    const phase = this.def.phases[this.phase];

    // Scheduled shots run even while moving.
    const now = this.t;
    for (let i = this.queue.length - 1; i >= 0; i--) {
      if (this.queue[i].at <= now) {
        this.queue[i].fire();
        this.queue.splice(i, 1);
      }
    }

    if (this.entering) {
      s.x += (this.homeX - s.x) * Math.min(1, dt * 1.6);
      if (Math.abs(s.x - this.homeX) < 4) {
        this.entering = false;
        this.roar(w);
      }
      return;
    }

    if (this.charging) {
      // Dash across the screen at the player's height, then glide back.
      if (this.charging.phase === 'out') {
        s.x -= 620 * dt;
        s.y += this.charging.vy * dt;
        if (s.x < -60) this.charging.phase = 'back';
      } else {
        s.x += (this.homeX - s.x) * Math.min(1, dt * 2.2);
        s.y += (w.height / 2 - s.y) * Math.min(1, dt * 2);
        if (Math.abs(s.x - this.homeX) < 6) this.charging = null;
      }
      return;
    }

    s.y = w.height / 2 + Math.sin(this.t * phase.swaySpeed) * phase.sway;
    s.x = this.homeX + Math.sin(this.t * 0.5) * 30;

    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      const attack = phase.attacks[this.attackIndex % phase.attacks.length];
      this.attackIndex += 1;
      this.attackTimer = phase.pace + this.perform(attack, w);
      this.flashMouth();
    }
  }

  /** Runs an attack; returns extra seconds it occupies (spirals, charges). */
  private perform(a: Attack, w: BossWorld): number {
    const s = this.sprite;
    const mx = s.x - 40;
    const my = s.y + 10;
    switch (a.kind) {
      case 'aimed':
        for (let i = 0; i < a.count; i++) {
          this.schedule(i * a.gap, () => {
            const [vx, vy] = aimAt(w, s.x - 40, s.y + 10, a.speed);
            w.fireOrb(s.x - 40, s.y + 10, vx, vy);
          });
        }
        return a.count * a.gap;
      case 'spread':
        for (let i = 0; i < a.count; i++) {
          const spread = a.count > 1 ? -a.arc / 2 + (a.arc * i) / (a.count - 1) : 0;
          const [vx, vy] = aimAt(w, mx, my, a.speed, spread);
          w.fireOrb(mx, my, vx, vy);
        }
        return 0;
      case 'ring': {
        const offset = Math.random() * Math.PI;
        for (let i = 0; i < a.count; i++) {
          const angle = offset + (i / a.count) * Math.PI * 2;
          w.fireOrb(s.x, s.y + 6, Math.cos(angle) * a.speed, Math.sin(angle) * a.speed);
        }
        return 0;
      }
      case 'spiral': {
        let angle = Math.random() * Math.PI * 2;
        const shots = Math.floor(a.duration / a.rate);
        for (let i = 0; i < shots; i++) {
          this.schedule(i * a.rate, () => {
            angle += 0.47;
            w.fireOrb(s.x, s.y + 6, Math.cos(angle) * a.speed, Math.sin(angle) * a.speed);
          });
        }
        return a.duration;
      }
      case 'rain':
        // Falling debris across the left part of the screen, toward where the player is.
        for (let i = 0; i < a.count; i++) {
          this.schedule(i * 0.08, () => {
            const x = Phaser.Math.Clamp(w.playerX + Phaser.Math.Between(-260, 260), 20, w.width * 0.8);
            w.fireOrb(x, -10, Phaser.Math.Between(-20, 20), a.speed, { texture: 'rock-chunk' });
          });
        }
        return a.count * 0.08;
      case 'wave':
        for (let i = 0; i < a.count; i++) {
          this.schedule(i * 0.18, () => {
            const [vx, vy] = aimAt(w, mx, my, a.speed);
            w.fireOrb(mx, my, vx, vy, { wave: { amp: 70, freq: 4 } });
          });
        }
        return a.count * 0.18;
      case 'homing':
        for (let i = 0; i < a.count; i++) {
          this.schedule(i * 0.3, () => w.fireOrb(mx, my + (i - 1) * 30, -a.speed, (i - 1) * 60, { homing: true, texture: 'orb-homing' }));
        }
        return a.count * 0.3;
      case 'lightning':
        for (let i = 0; i < a.count; i++) {
          this.schedule(i * 0.35, () => {
            const x = Phaser.Math.Clamp(w.playerX + Phaser.Math.Between(-120, 120), 30, w.width * 0.75);
            w.lightning(x);
          });
        }
        return a.count * 0.35;
      case 'summon':
        for (let i = 0; i < a.count; i++) {
          w.spawnEnemy(a.enemy, s.x - 30, Phaser.Math.Clamp(s.y + (i - (a.count - 1) / 2) * 70, 50, w.height - 50));
        }
        return 0;
      case 'charge': {
        const [, vy] = aimAt(w, s.x, s.y, 620);
        this.charging = { phase: 'out', vy: vy * 0.6 };
        w.onBossRoar();
        return 1.2;
      }
    }
  }

  private schedule(delay: number, fire: () => void): void {
    this.queue.push({ at: this.t + delay, fire });
  }

  /** Returns true when this hit defeats the boss. */
  damage(amount: number, w: BossWorld): boolean {
    if (this.defeated || this.entering || this.scene.time.now < this.invulnerableUntil) return false;
    this.hp -= amount;
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(45, () => this.sprite.active && this.sprite.clearTint());
    const phases = this.def.phases.length;
    const next = Math.min(phases - 1, Math.floor((1 - Math.max(0, this.hp) / this.def.hp) * phases));
    if (next !== this.phase && this.hp > 0) {
      this.phase = next;
      this.attackTimer = 1.2;
      this.attackIndex = 0;
      this.queue = [];
      this.invulnerableUntil = this.scene.time.now + 1000;
      w.onBossPhase(next + 1, phases);
      this.roar(w);
    }
    if (this.hp <= 0) {
      this.defeated = true;
      this.queue = [];
      return true;
    }
    return false;
  }

  private roar(w: BossWorld): void {
    w.onBossRoar();
    this.sprite.setTexture(`${this.def.texture}-roar`);
    this.scene.tweens.add({ targets: this.sprite, scaleX: 1.12, scaleY: 0.9, duration: 120, yoyo: true, repeat: 2 });
    this.scene.time.delayedCall(700, () => this.sprite.active && !this.defeated && this.sprite.setTexture(this.def.texture));
  }

  private flashMouth(): void {
    this.sprite.setTexture(`${this.def.texture}-roar`);
    this.scene.time.delayedCall(220, () => this.sprite.active && !this.defeated && this.sprite.setTexture(this.def.texture));
  }

  /** Defeat animation: shake, shrink and fade. */
  vanish(onDone: () => void): void {
    this.sprite.setTexture(`${this.def.texture}-roar`);
    this.scene.tweens.add({ targets: this.sprite, x: this.sprite.x + 4, duration: 40, yoyo: true, repeat: 18 });
    this.scene.tweens.add({
      targets: this.sprite,
      scale: 0.2,
      alpha: 0,
      angle: 25,
      delay: 900,
      duration: 700,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.sprite.destroy();
        onDone();
      },
    });
  }
}
