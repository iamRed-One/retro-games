import Phaser from 'phaser';
import { BallDisplay } from '../art/ballDisplay';
import { showToast, uiStore } from '../bridge';
import { DEFAULT_LEVEL_ID } from '../config';
import { input } from '../input/InputManager';
import { getLevel } from '../levels';
import { Boss, type BossWorld } from '../shooter/Boss';
import { BOSSES, type BossDef } from '../shooter/bosses';
import { SkyEnemy, type EnemyKind, type OrbOptions } from '../shooter/enemies';
import { getStage, type ShooterStage } from '../shooter/stages';
import { audio } from '../systems/audio';
import { Effects } from '../systems/effects';
import { Parallax } from '../systems/parallax';
import { rumble } from '../systems/rumble';
import { completeRun, type RunStats } from '../systems/runResult';
import { save } from '../systems/save';

const SCROLL_SPEED = 120;
const PLAYER_SPEED = 320;
const PLAYER_ACCEL = 14;
/** Small hitbox (shmup convention): only the core of the ball counts as hit. */
const PLAYER_HIT_RADIUS = 8;
const SHOT_SPEED = 700;
const FIRE_INTERVAL_MS = 140;
const RAPID_INTERVAL_MS = 80;
const POWER_MS = 10000;
const MAX_HP = 3;
const INVULNERABLE_MS = 1400;
const REVIVE_MS = 4000;
const MAGNET_RADIUS = 120;
const UI_PUSH_MS = 100;
const LIGHTNING_WARN = 0.7;
const LIGHTNING_STRIKE = 0.25;

type PowerKind = 'spread' | 'rapid' | 'shield';
type PickupKind = 'seed' | 'heart' | PowerKind;
export type ShooterMode = 'campaign' | 'bossrush' | 'coop';

interface Projectile {
  sprite: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  t: number;
  homing?: boolean;
  gravity?: number;
  wave?: { amp: number; freq: number; baseX: number; baseY: number };
}

interface Pickup {
  sprite: Phaser.GameObjects.Image;
  kind: PickupKind;
}

interface Strike {
  x: number;
  fromY: number;
  t: number;
  struck: boolean;
}

export interface ShooterData {
  levelId: string;
  /** Stats carried over from the platform part of the level. */
  carry?: RunStats;
  secretFound?: boolean;
  mode?: ShooterMode;
  /** Boss Rush: boss ids to fight in order. */
  bosses?: string[];
}

/** One flying ball. Co-op has two; player 2 is tinted so the pair is easy to tell apart. */
class Ship {
  px: number;
  py: number;
  vx = 0;
  vy = 0;
  hp = MAX_HP;
  invulnerableUntil = 0;
  lastShotAt = 0;
  alive = true;
  reviveAt = 0;
  power: { kind: 'spread' | 'rapid'; until: number } | null = null;
  shield = false;
  readonly ball: BallDisplay;
  readonly flame: Phaser.GameObjects.Particles.ParticleEmitter;
  readonly bubble: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, readonly index: number, startY: number) {
    this.px = 160 - index * 40;
    this.py = startY;
    this.ball = new BallDisplay(scene, this.px, this.py);
    this.ball.container.setDepth(5);
    if (index === 1) this.ball.body.setTint(0x8fd8ff);
    this.bubble = scene.add.image(this.px, this.py, 'shield-bubble').setDepth(5.2).setVisible(false);
    this.flame = scene.add
      .particles(0, 0, 'flame', {
        speedX: { min: -200, max: -110 },
        speedY: { min: -20, max: 20 },
        lifespan: 220,
        scale: { start: 1.4, end: 0 },
        frequency: 28,
      })
      .setDepth(4);
    if (index === 1) this.flame.setParticleTint(0x7be3ff);
    this.flame.startFollow(this.ball.container, -14, 3);
  }

  reset(x: number, y: number, now: number): void {
    this.px = x;
    this.py = y;
    this.vx = this.vy = 0;
    this.hp = MAX_HP;
    this.alive = true;
    this.reviveAt = 0;
    this.power = null;
    this.shield = false;
    this.invulnerableUntil = now + INVULNERABLE_MS;
    this.ball.container.scene.tweens.killTweensOf(this.ball.container);
    this.ball.container.setAlpha(1).setScale(1).setVisible(true);
    this.flame.start();
  }
}

/**
 * Sky battles. Campaign: the battle after each level's exit (waves, then the level's boss).
 * Boss Rush: every boss you've beaten, back to back. Co-op: two players share a battle; a
 * downed player revives after a few seconds while the other survives.
 */
export class ShooterScene extends Phaser.Scene implements BossWorld {
  private levelId = DEFAULT_LEVEL_ID;
  private carry: RunStats = { timeMs: 0, collected: 0, total: 0, deaths: 0 };
  private secretFound = false;
  private mode: ShooterMode = 'campaign';
  private bossQueue: string[] = [];
  private bossesDefeated = 0;
  private stage!: ShooterStage;
  private bossDef!: BossDef;
  private parallax!: Parallax;
  private fx!: Effects;
  private bolts!: Phaser.GameObjects.Graphics;
  private ships: Ship[] = [];

  private finished = false;
  private spawnIndex = 0;
  private phaseTime = 0;
  private scroll = 0;
  private elapsedMs = 0;
  private lastUiPush = 0;
  private enemies: SkyEnemy[] = [];
  private shots: Projectile[] = [];
  private orbs: Projectile[] = [];
  private pickups: Pickup[] = [];
  private strikes: Strike[] = [];
  private boss: Boss | null = null;
  private bossStarted = false;
  private hitDuringBoss = false;
  private collected = 0;
  private dropped = 0;
  private deaths = 0;
  private lastHitSoundAt = 0;

  constructor() {
    super('Shooter');
  }

  get width(): number {
    return this.scale.width;
  }
  get height(): number {
    return this.scale.height;
  }
  private get living(): Ship[] {
    return this.ships.filter((s) => s.alive);
  }
  /** Primary target for screen-wide attacks (falling debris, lightning). */
  get playerX(): number {
    const live = this.living;
    return (live[Math.floor(this.time.now / 4000) % Math.max(1, live.length)] ?? this.ships[0]).px;
  }
  get playerY(): number {
    return (this.living[0] ?? this.ships[0]).py;
  }
  get difficulty(): number {
    return this.stage.difficulty;
  }

  target(x: number, y: number): { x: number; y: number } {
    let best = this.living[0] ?? this.ships[0];
    let bestD = Infinity;
    for (const s of this.living) {
      const d = Math.hypot(s.px - x, s.py - y);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    return { x: best.px, y: best.py };
  }

  init(data: ShooterData): void {
    this.levelId = data.levelId ?? this.levelId;
    this.mode = data.mode ?? 'campaign';
    this.carry = data.carry ?? { timeMs: 0, collected: 0, total: 0, deaths: 0 };
    this.secretFound = !!data.secretFound;
    this.stage = getStage(this.levelId);
    this.bossQueue = this.mode === 'bossrush' ? [...(data.bosses ?? ['grumble'])] : [this.stage.bossId];
    this.bossesDefeated = 0;
    this.bossDef = BOSSES[this.bossQueue[0]];
    this.ships = [];
    this.finished = false;
    // Boss Rush skips the waves.
    this.spawnIndex = this.mode === 'bossrush' ? this.stage.spawns.length : 0;
    this.phaseTime = 0;
    this.scroll = 0;
    this.elapsedMs = 0;
    this.lastUiPush = 0;
    this.enemies = [];
    this.shots = [];
    this.orbs = [];
    this.pickups = [];
    this.strikes = [];
    this.boss = null;
    this.bossStarted = false;
    this.hitDuringBoss = false;
    this.collected = 0;
    this.dropped = 0;
    this.deaths = 0;
  }

  create(): void {
    const def = getLevel(this.levelId);
    const theme = this.mode === 'bossrush' ? 'fortress' : def.theme ?? 'day';
    this.parallax = new Parallax(this, theme);
    this.fx = new Effects(this);
    this.bolts = this.add.graphics().setDepth(5.5);
    const players = this.mode === 'coop' ? 2 : 1;
    for (let i = 0; i < players; i++) this.ships.push(new Ship(this, i, this.scale.height / 2 + (players === 2 ? (i - 0.5) * 120 : 0)));
    this.cameras.main.fadeIn(350, 16, 20, 42);

    const offPress = input.onPress((action) => {
      if (uiStore.get().screen !== 'playing' || this.finished) return;
      if (action === 'restart' && this.mode !== 'bossrush') this.restartFromCheckpoint(false);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offPress();
      save.flush();
      uiStore.set({ mode: 'platform', boss: null, power: null, hp2: null });
    });

    const prompt =
      this.mode === 'coop'
        ? 'Co-op! P1: WASD + Space · P2: Arrows + Enter · or two gamepads'
        : this.mode === 'bossrush'
          ? `Boss Rush: ${this.bossQueue.length} bosses back to back. Hearts carry over!`
          : 'Sky battle! {fly} to fly, hold {bounce} to shoot';
    uiStore.set({
      screen: 'playing',
      mode: 'shooter',
      hasDive: false,
      hp: MAX_HP,
      hp2: this.mode === 'coop' ? MAX_HP : null,
      maxHp: MAX_HP,
      boss: null,
      power: null,
      collected: this.carry.collected,
      total: this.carry.total,
      timeMs: Math.floor(this.carry.timeMs),
      prompt,
      toast: null,
    });
    this.time.delayedCall(6000, () => {
      if (uiStore.get().prompt === prompt) uiStore.set({ prompt: null });
    });
    if (this.mode === 'bossrush') {
      this.startBoss();
    } else {
      audio.playTrack('skirmish', `${def.name}: sky battle`);
      audio.duckMusic(false);
    }
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(delta, 50) / 1000;
    const now = this.time.now;
    this.scroll += SCROLL_SPEED * dt;
    this.parallax.update(this.scroll, dt);

    if (!this.finished) this.elapsedMs += delta;
    for (const ship of this.ships) this.updateShip(ship, dt, now);
    this.updateTimeline(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateStrikes(dt, now);
    this.updatePickups(dt, now);
    if (!this.finished) this.checkCollisions(now);
    this.checkProgress();

    if (now - this.lastUiPush >= UI_PUSH_MS) {
      this.lastUiPush = now;
      uiStore.set({ timeMs: Math.floor(this.carry.timeMs + this.elapsedMs) });
      if (this.boss && !this.boss.defeated) uiStore.set({ boss: { name: this.bossDef.name, hp: this.boss.fraction } });
      const p1 = this.ships[0];
      if (p1.power && p1.power.until - now <= 0) p1.power = null;
      for (const s of this.ships) if (s.power && s.power.until - now <= 0) s.power = null;
      uiStore.set({ power: p1.power?.kind ?? (p1.shield ? 'shield' : null) });
    }
  }

  private controls(ship: Ship): { moveX: number; moveY: number; fire: boolean } {
    if (this.mode === 'coop') return input.readPlayer(ship.index === 0 ? 1 : 2);
    return { moveX: input.moveX, moveY: input.moveY, fire: input.isHeld('bounce') };
  }

  private updateShip(ship: Ship, dt: number, now: number): void {
    if (!ship.alive) {
      // Co-op: revive while the partner is still flying.
      if (ship.reviveAt && now >= ship.reviveAt && this.living.length > 0 && !this.finished) {
        const partner = this.living[0];
        ship.reset(partner.px, Phaser.Math.Clamp(partner.py + 60, 40, this.height - 30), now);
        this.syncHearts();
        this.flashToast(`P${ship.index + 1} is back!`);
      }
      return;
    }
    const c = this.controls(ship);
    const k = Math.min(1, dt * PLAYER_ACCEL);
    ship.vx += (c.moveX * PLAYER_SPEED - ship.vx) * k;
    ship.vy += (c.moveY * PLAYER_SPEED - ship.vy) * k;
    ship.px = Phaser.Math.Clamp(ship.px + ship.vx * dt, 30, this.width * 0.72);
    ship.py = Phaser.Math.Clamp(ship.py + ship.vy * dt, 40, this.height - 30);

    ship.ball.place(ship.px, ship.py, -Math.min(0.12, Math.hypot(ship.vx, ship.vy) / 3000));
    ship.ball.body.rotation += (SCROLL_SPEED + ship.vx) * dt * 0.02;
    ship.ball.face.setPosition(2, Math.round((ship.vy / PLAYER_SPEED) * 1.5));
    const flicker = now < ship.invulnerableUntil && Math.floor(now / 80) % 2 === 0;
    ship.ball.container.setAlpha(flicker ? 0.35 : 1);
    ship.bubble.setPosition(ship.px, ship.py).setVisible(ship.shield);
    if (!this.finished) ship.ball.setFace(now < ship.invulnerableUntil ? 'face-scared' : 'face-idle');

    const interval = ship.power?.kind === 'rapid' ? RAPID_INTERVAL_MS : FIRE_INTERVAL_MS;
    if (!this.finished && c.fire && now - ship.lastShotAt >= interval) {
      ship.lastShotAt = now;
      const angles = ship.power?.kind === 'spread' ? [-0.2, 0, 0.2] : [0];
      for (const a of angles) {
        const sprite = this.add.image(ship.px + 16, ship.py + 1, 'shot').setDepth(4).setRotation(a);
        if (ship.index === 1) sprite.setTint(0x9fe8ff);
        this.shots.push({ sprite, vx: Math.cos(a) * SHOT_SPEED, vy: Math.sin(a) * SHOT_SPEED, t: 0 });
      }
      audio.play('shoot');
    }
  }

  private updateTimeline(dt: number): void {
    if (this.finished || this.bossStarted) return;
    this.phaseTime += dt;
    const spawns = this.stage.spawns;
    while (this.spawnIndex < spawns.length && spawns[this.spawnIndex].at <= this.phaseTime) {
      const s = spawns[this.spawnIndex++];
      this.spawnEnemy(s.kind, this.width + 40, 60 + s.y * (this.height - 120));
    }
  }

  private updateEnemies(dt: number): void {
    // Enemies defeated last frame are already destroyed; only filter them out.
    for (const e of this.enemies) if (!e.gone) e.update(dt, this);
    this.enemies = this.enemies.filter((e) => {
      if (e.gone && e.sprite.active) e.sprite.destroy();
      return !e.gone;
    });
    this.boss?.update(dt, this);
  }

  private updateProjectiles(dt: number): void {
    const keep = (p: Projectile) => {
      p.t += dt;
      if (p.homing && p.t < 1.6) {
        const speed = Math.hypot(p.vx, p.vy);
        const t = this.target(p.sprite.x, p.sprite.y);
        const angle = Math.atan2(t.y - p.sprite.y, t.x - p.sprite.x);
        const k = Math.min(1, dt * 2.4);
        p.vx += (Math.cos(angle) * speed - p.vx) * k;
        p.vy += (Math.sin(angle) * speed - p.vy) * k;
      }
      if (p.gravity) p.vy += p.gravity * dt;
      if (p.wave) {
        p.wave.baseX += p.vx * dt;
        p.wave.baseY += p.vy * dt;
        const speed = Math.hypot(p.vx, p.vy) || 1;
        const offset = Math.sin(p.t * p.wave.freq) * p.wave.amp;
        p.sprite.setPosition(p.wave.baseX + (-p.vy / speed) * offset, p.wave.baseY + (p.vx / speed) * offset);
      } else {
        p.sprite.x += p.vx * dt;
        p.sprite.y += p.vy * dt;
      }
      const inside = p.sprite.x > -30 && p.sprite.x < this.width + 30 && p.sprite.y > -40 && p.sprite.y < this.height + 30;
      if (!inside) p.sprite.destroy();
      return inside;
    };
    this.shots = this.shots.filter(keep);
    this.orbs = this.orbs.filter(keep);
  }

  /** Lightning: a flickering warning line, then a short deadly bolt. */
  private updateStrikes(dt: number, now: number): void {
    const g = this.bolts;
    g.clear();
    this.strikes = this.strikes.filter((s) => {
      s.t += dt;
      if (s.t < LIGHTNING_WARN) {
        if (Math.floor(s.t * 14) % 2 === 0) {
          g.fillStyle(0xff4d5e, 0.35);
          g.fillRect(s.x - 2, s.fromY, 4, this.height - s.fromY);
        }
        return true;
      }
      if (!s.struck) {
        s.struck = true;
        audio.play('zap');
        this.cameras.main.shake(90, 0.004);
      }
      g.fillStyle(0xfff6a0, 0.95);
      g.fillRect(s.x - 7, s.fromY, 14, this.height - s.fromY);
      g.fillStyle(0xffffff, 1);
      g.fillRect(s.x - 2, s.fromY, 4, this.height - s.fromY);
      if (!this.finished) {
        for (const ship of this.living) {
          if (now >= ship.invulnerableUntil && Math.abs(ship.px - s.x) < 16 && ship.py > s.fromY) this.hurt(ship, now);
        }
      }
      return s.t < LIGHTNING_WARN + LIGHTNING_STRIKE;
    });
  }

  private updatePickups(dt: number, now: number): void {
    this.pickups = this.pickups.filter((p) => {
      const s = p.sprite;
      let nearest: Ship | null = null;
      let dist = Infinity;
      for (const ship of this.living) {
        const d = Math.hypot(ship.px - s.x, ship.py - s.y);
        if (d < dist) {
          dist = d;
          nearest = ship;
        }
      }
      if (nearest && dist < MAGNET_RADIUS) {
        s.x += ((nearest.px - s.x) / dist) * 420 * dt;
        s.y += ((nearest.py - s.y) / dist) * 420 * dt;
      } else {
        s.x -= 90 * dt;
      }
      if (p.kind !== 'seed' && p.kind !== 'heart') s.setScale(1.6 + Math.sin(now / 120) * 0.15);
      if (nearest && dist < 22) {
        this.collectPickup(p, nearest, now);
        return false;
      }
      if (s.x < -20) {
        s.destroy();
        return false;
      }
      return true;
    });
  }

  private checkCollisions(now: number): void {
    this.shots = this.shots.filter((shot) => {
      const { x, y } = shot.sprite;
      const target = this.enemies.find((e) => !e.gone && Math.hypot(e.x - x, e.y - y) < e.radius + 4);
      if (target) {
        shot.sprite.destroy();
        this.fx.burst('sparks', x, y, 3);
        if (target.hit(1)) this.defeatEnemy(target);
        else this.hitSound(now);
        return false;
      }
      if (this.boss && !this.boss.defeated && this.boss.contains(x, y)) {
        shot.sprite.destroy();
        this.fx.burst('sparks', x, y, 3);
        if (this.boss.damage(1, this)) this.defeatBoss();
        else this.hitSound(now);
        return false;
      }
      return true;
    });

    for (const ship of this.living) {
      if (now < ship.invulnerableUntil) continue;
      const orbHit = this.orbs.findIndex((o) => Math.hypot(o.sprite.x - ship.px, o.sprite.y - ship.py) < PLAYER_HIT_RADIUS + 3);
      if (orbHit >= 0) {
        this.orbs[orbHit].sprite.destroy();
        this.orbs.splice(orbHit, 1);
        this.hurt(ship, now);
        continue;
      }
      const rammed = this.enemies.find((e) => !e.gone && Math.hypot(e.x - ship.px, e.y - ship.py) < e.radius + PLAYER_HIT_RADIUS);
      if (rammed) {
        if (rammed.kind === 'flier' || rammed.kind === 'diver' || rammed.kind === 'zigzag') this.defeatEnemy(rammed);
        this.hurt(ship, now);
        continue;
      }
      if (this.boss && !this.boss.defeated && this.boss.contains(ship.px, ship.py, PLAYER_HIT_RADIUS)) this.hurt(ship, now);
    }
  }

  private hitSound(now: number): void {
    if (now - this.lastHitSoundAt < 60) return;
    this.lastHitSoundAt = now;
    audio.play('enemyHit');
  }

  private defeatEnemy(e: SkyEnemy): void {
    const big = e.kind === 'tank' || e.kind === 'rock' || e.kind === 'thundercloud' || e.kind === 'bomber';
    this.fx.burst('bits', e.x, e.y, big ? 20 : 10);
    audio.play('explode', { intensity: big ? 1 : 0.5 });
    if (big) rumble('explode');
    save.countSkyKill();
    if (Math.random() < e.seedChance) {
      for (let i = 0; i < e.seeds; i++) this.dropPickup('seed', e.x + i * 10, e.y + (i - 1) * 8);
    }
    if (Math.random() < e.powerChance) this.dropPickup(this.randomPower(), e.x, e.y + 12);
    else if (this.living.some((s) => s.hp < MAX_HP) && Math.random() < 0.06) this.dropPickup('heart', e.x, e.y - 14);
    e.destroy();
  }

  private randomPower(): PowerKind {
    const pool: PowerKind[] = ['spread', 'rapid', 'shield'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private dropPickup(kind: PickupKind, x: number, y: number): void {
    if (kind === 'seed') this.dropped += 1;
    const texture = kind === 'seed' ? 'seed' : kind === 'heart' ? 'heart' : `pow-${kind}`;
    const sprite = this.add.image(x, y, texture).setDepth(4);
    const full = kind === 'seed' || kind === 'heart' ? 1 : 1.6;
    this.tweens.add({ targets: sprite, scale: { from: 0.4, to: full }, duration: 160, ease: 'Back.easeOut' });
    this.pickups.push({ sprite, kind });
  }

  private collectPickup(p: Pickup, ship: Ship, now: number): void {
    switch (p.kind) {
      case 'seed':
        this.collected += 1;
        audio.play('collect', { pitch: 1 + Math.random() * 0.2 });
        uiStore.set({ collected: this.carry.collected + this.collected });
        break;
      case 'heart':
        ship.hp = Math.min(MAX_HP, ship.hp + 1);
        audio.play('checkpoint');
        this.syncHearts();
        break;
      case 'shield':
        ship.shield = true;
        audio.play('powerup');
        save.usePower('shield');
        this.flashToast('Shield!');
        break;
      default:
        ship.power = { kind: p.kind, until: now + POWER_MS };
        audio.play('powerup');
        save.usePower(p.kind);
        this.flashToast(p.kind === 'spread' ? 'Spread shot!' : 'Rapid fire!');
    }
    rumble('pickup');
    this.fx.burst('sparks', p.sprite.x, p.sprite.y, 6);
    p.sprite.destroy();
  }

  private syncHearts(): void {
    uiStore.set({ hp: this.ships[0].alive ? this.ships[0].hp : 0, hp2: this.ships[1] ? (this.ships[1].alive ? this.ships[1].hp : 0) : null });
  }

  private hurt(ship: Ship, now: number): void {
    if (this.bossStarted) this.hitDuringBoss = true;
    if (ship.shield) {
      ship.shield = false;
      ship.invulnerableUntil = now + 900;
      audio.play('shieldPop');
      this.fx.burst('drops', ship.px, ship.py, 14);
      return;
    }
    ship.hp -= 1;
    ship.invulnerableUntil = now + INVULNERABLE_MS;
    this.cameras.main.shake(140, 0.008);
    this.fx.burst('bits', ship.px, ship.py, 8);
    this.syncHearts();
    if (ship.hp <= 0) {
      rumble('death');
      this.knockOut(ship, now);
    } else {
      rumble('hurt');
      audio.play('hurt');
      ship.ball.setFace('face-hurt');
    }
  }

  private knockOut(ship: Ship, now: number): void {
    ship.alive = false;
    ship.power = null;
    ship.shield = false;
    this.deaths += 1;
    audio.play('fail');
    ship.ball.setFace('face-hurt');
    ship.flame.stop();
    ship.bubble.setVisible(false);
    this.tweens.add({ targets: ship.ball.container, scale: 1.5, alpha: 0, duration: 200 });
    this.syncHearts();
    if (this.living.length > 0) {
      ship.reviveAt = now + REVIVE_MS;
      this.flashToast(`P${ship.index + 1} is down! Back in ${REVIVE_MS / 1000}s`);
      return;
    }
    if (this.mode === 'bossrush') {
      // Boss Rush ends on the first knockout.
      this.finished = true;
      audio.stopMusic();
      this.time.delayedCall(1400, () => this.finishRun({ cleared: false }));
      return;
    }
    this.time.delayedCall(1300, () => this.restartFromCheckpoint(true));
  }

  /** Back to the start of the current phase: the waves, or the boss fight once it has begun. */
  restartFromCheckpoint(afterKnockOut: boolean): void {
    if (this.finished) return;
    if (!afterKnockOut && this.living.length === 0) return;
    for (const e of this.enemies) e.destroy();
    for (const p of [...this.shots, ...this.orbs]) p.sprite.destroy();
    for (const p of this.pickups) p.sprite.destroy();
    this.enemies = [];
    this.shots = [];
    this.orbs = [];
    this.pickups = [];
    this.strikes = [];
    if (this.bossStarted) {
      this.boss?.sprite.destroy();
      this.boss = new Boss(this, this.bossDef, this);
      this.hitDuringBoss = false;
      uiStore.set({ boss: { name: this.bossDef.name, hp: 1 } });
    } else {
      this.spawnIndex = 0;
      this.phaseTime = 0;
    }
    const now = this.time.now;
    this.ships.forEach((s, i) => s.reset(160 - i * 40, this.height / 2 + (this.ships.length === 2 ? (i - 0.5) * 120 : 0), now));
    this.syncHearts();
    this.flashToast(this.bossStarted ? `Try again: ${this.bossDef.name}!` : 'Try again!');
  }

  /** Waves done: the level's boss arrives. */
  private checkProgress(): void {
    if (this.finished || this.living.length === 0 || this.bossStarted) return;
    if (this.spawnIndex >= this.stage.spawns.length && this.enemies.length === 0) this.startBoss();
  }

  private startBoss(): void {
    this.bossStarted = true;
    this.hitDuringBoss = false;
    audio.play('warning');
    this.flashToast(`Warning! ${this.bossDef.name} approaches!`);
    audio.stopMusic();
    this.time.delayedCall(1600, () => {
      if (this.finished) return;
      this.boss = new Boss(this, this.bossDef, this);
      uiStore.set({ boss: { name: this.bossDef.name, hp: 1 } });
      audio.playTrack(this.bossDef.track, `${this.bossDef.name} showdown`);
    });
  }

  private defeatBoss(): void {
    const boss = this.boss;
    if (!boss) return;
    save.beatBoss(this.bossDef.id, !this.hitDuringBoss);
    this.bossesDefeated += 1;
    for (const o of this.orbs) o.sprite.destroy();
    this.orbs = [];
    this.strikes = [];
    for (const e of this.enemies) if (!e.gone) this.defeatEnemy(e);
    uiStore.set({ boss: { name: this.bossDef.name, hp: 0 } });
    audio.stopMusic();
    for (let i = 0; i < 8; i++) {
      this.time.delayedCall(i * 180, () => {
        this.fx.burst('stars', boss.x + Phaser.Math.Between(-50, 50), boss.y + Phaser.Math.Between(-35, 35), 10);
        audio.play('explode', { intensity: 1 });
      });
    }
    this.cameras.main.shake(900, 0.01);
    rumble('bossDown');
    boss.vanish(() => {
      for (let i = 0; i < 12; i++) this.dropPickup('seed', boss.x + Phaser.Math.Between(-60, 60), boss.y + Phaser.Math.Between(-40, 40));
      if (this.mode === 'bossrush' && this.bossesDefeated < this.bossQueue.length) {
        this.nextRushBoss();
        return;
      }
      this.clearSection(this.bossDef.id === 'baron' && this.mode === 'campaign');
    });
  }

  /** Boss Rush: a breather, a heart back, then the next boss. */
  private nextRushBoss(): void {
    this.boss = null;
    this.bossDef = BOSSES[this.bossQueue[this.bossesDefeated]];
    for (const s of this.living) s.hp = Math.min(MAX_HP, s.hp + 1);
    this.syncHearts();
    this.flashToast(`${this.bossesDefeated} down! Next: ${this.bossDef.name}`);
    this.time.delayedCall(2200, () => {
      if (!this.finished) this.startBoss();
    });
  }

  private clearSection(finale: boolean): void {
    this.finished = true;
    for (const s of this.living) s.ball.setFace('face-happy');
    audio.stopMusic();
    audio.play('complete');
    const message =
      this.mode === 'bossrush'
        ? 'Boss Rush complete!'
        : finale
          ? 'Baron Murk is beaten! Sunny skies return!'
          : this.mode === 'coop'
            ? 'Co-op victory!'
            : `${this.bossDef.name} is beaten!`;
    this.flashToast(message);
    uiStore.set({ prompt: null });
    // Let magnetized seeds finish flying in before totting up.
    this.time.delayedCall(finale ? 2600 : 1800, () => this.finishRun({ finale, cleared: true }));
  }

  private finishRun(opts: { finale?: boolean; cleared: boolean }): void {
    save.flush();
    completeRun(
      this.levelId,
      {
        timeMs: this.carry.timeMs + this.elapsedMs,
        collected: this.carry.collected + this.collected,
        total: this.carry.total + this.dropped,
        deaths: this.carry.deaths + this.deaths,
      },
      {
        finale: opts.finale,
        secretFound: this.secretFound,
        bosses: this.mode === 'bossrush' ? this.bossesDefeated : undefined,
        cleared: opts.cleared,
      },
    );
  }

  private flashToast(text: string): void {
    const id = showToast(text);
    this.time.delayedCall(1800, () => {
      if (uiStore.get().toast?.id === id) uiStore.set({ toast: null });
    });
  }

  // ---- ShooterWorld / BossWorld ----

  fireOrb(x: number, y: number, vx: number, vy: number, opts: OrbOptions = {}): void {
    if (this.finished) return;
    const sprite = this.add.image(x, y, opts.texture ?? (opts.homing ? 'orb-homing' : 'orb')).setDepth(4);
    const orb: Projectile = { sprite, vx, vy, t: 0, homing: opts.homing, gravity: opts.gravity };
    if (opts.wave) orb.wave = { ...opts.wave, baseX: x, baseY: y };
    this.orbs.push(orb);
  }

  lightning(x: number, fromY = 0): void {
    if (this.finished) return;
    this.strikes.push({ x, fromY, t: 0, struck: false });
  }

  spawnEnemy(kind: EnemyKind, x: number, y: number): void {
    this.enemies.push(new SkyEnemy(this, kind, x, y, this.stage.difficulty));
  }

  onBossPhase(phase: number, total: number): void {
    this.flashToast(phase === total ? `${this.bossDef.name} is furious!` : `${this.bossDef.name} is getting angry!`);
    // A little help between phases.
    this.dropPickup(this.randomPower(), this.width * 0.55, this.height / 2);
  }

  onBossRoar(): void {
    rumble('roar');
    audio.play('bossRoar');
    this.cameras.main.shake(300, 0.006);
  }
}
