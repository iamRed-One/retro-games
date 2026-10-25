import Phaser from 'phaser';
import { TILE_INDEX } from '../art/textures';
import { showToast, uiStore } from '../bridge';
import { DEFAULT_LEVEL_ID, TILE } from '../config';
import { MovingPlatform } from '../entities/MovingPlatform';
import { Checkpoint, Collectible, Exit, Spikes, Spring, type Trigger } from '../entities/pickups';
import { PLAYER_RADIUS, Player, type PlayerEnv } from '../entities/Player';
import { addCurrentStreaks, CrumbleBlock, Geyser, Jelly, Lava, SecretWalls, Updraft, Water } from '../entities/terrain';
import { GHOST_SAMPLE_MS, save, type Ghost } from '../systems/save';
import { BallDisplay } from '../art/ballDisplay';
import { MURKLING_RADIUS, Murkling } from '../entities/Murkling';
import { hasShooterStage } from '../shooter/stages';
import { completeRun } from '../systems/runResult';
import { THEMES } from '../art/palette';
import { input } from '../input/InputManager';
import { getLevel, levelIndex } from '../levels';
import { parseLevel } from '../levels/parseLevel';
import type { ParsedLevel } from '../levels/types';
import { TUNING } from '../physics/tuning';
import { audio } from '../systems/audio';
import { rumble } from '../systems/rumble';
import { CameraRig } from '../systems/camera';
import { CheckpointTracker } from '../systems/checkpoints';
import { Effects } from '../systems/effects';
import { Parallax } from '../systems/parallax';

const SOLID_TILES = [
  TILE_INDEX.grass,
  TILE_INDEX.dirt,
  TILE_INDEX.stone,
  TILE_INDEX.grassLeft,
  TILE_INDEX.grassRight,
  TILE_INDEX.grassSolo,
  TILE_INDEX.cloud,
];
const UI_PUSH_MS = 100;
const RESPAWN_DELAY_MS = 750;
const PROMPT_MS = 5000;
/** The "bounce on its head" hint is shown once per session, the first time a Murkling is seen. */
let murklingHintShown = false;

export class GameScene extends Phaser.Scene {
  private levelId = DEFAULT_LEVEL_ID;
  private level!: ParsedLevel;
  private player!: Player;
  private parallax!: Parallax;
  private cameraRig!: CameraRig;
  private fx!: Effects;
  private checkpointsTracker!: CheckpointTracker;
  private collectibles: Collectible[] = [];
  private spikes: Spikes[] = [];
  private springs: Spring[] = [];
  private checkpoints: Checkpoint[] = [];
  private movers: MovingPlatform[] = [];
  private crumbles: CrumbleBlock[] = [];
  private updrafts: Updraft[] = [];
  private water: Water | null = null;
  private wasSubmerged = false;
  private wasInUpdraft = false;
  private lastWhooshAt = -Infinity;
  private murklings: Murkling[] = [];
  private puffs: Spring[] = [];
  private geysers: Geyser[] = [];
  private jellies: Jelly[] = [];
  private lava: Lava | null = null;
  private secret: SecretWalls | null = null;
  private secretFound = false;
  /** Time Attack: this run's recorded path, and the best previous run replayed as a ghost. */
  private timeAttack = false;
  private recording: number[] = [];
  private nextSampleAt = 0;
  private ghost: Ghost | null = null;
  private ghostBall: BallDisplay | null = null;
  private exit!: Exit;
  private playerCircle = new Phaser.Geom.Circle();

  private elapsedMs = 0;
  private lastUiPush = 0;
  private collected = 0;
  private deaths = 0;
  private finished = false;
  private promptIndex = 0;
  private promptTimer: Phaser.Time.TimerEvent | null = null;
  private collectChain = 0;
  private lastCollectAt = -Infinity;

  constructor() {
    super('Game');
  }

  init(data: { levelId?: string }): void {
    // The scene instance is reused on restart, so reset everything here.
    this.levelId = data.levelId ?? this.levelId;
    this.collectibles = [];
    this.spikes = [];
    this.springs = [];
    this.checkpoints = [];
    this.movers = [];
    this.crumbles = [];
    this.updrafts = [];
    this.murklings = [];
    this.puffs = [];
    this.geysers = [];
    this.jellies = [];
    this.lava = null;
    this.secret = null;
    this.secretFound = false;
    this.timeAttack = uiStore.get().runMode === 'timeattack';
    this.recording = [];
    this.nextSampleAt = 0;
    this.ghost = null;
    this.ghostBall = null;
    this.water = null;
    this.wasSubmerged = false;
    this.wasInUpdraft = false;
    this.lastWhooshAt = -Infinity;
    this.elapsedMs = 0;
    this.lastUiPush = 0;
    this.collected = 0;
    this.deaths = 0;
    this.finished = false;
    this.promptIndex = 0;
    this.promptTimer = null;
    this.collectChain = 0;
    this.lastCollectAt = -Infinity;
  }

  create(): void {
    this.level = parseLevel(getLevel(this.levelId));
    const { widthPx, heightPx } = this.level;

    this.physics.world.gravity.y = TUNING.gravity;
    // Open at the bottom so pits are deadly; closed at the sides and top.
    this.physics.world.setBounds(0, -TILE * 4, widthPx, heightPx + TILE * 12);
    this.physics.world.setBoundsCollision(true, true, true, false);

    const theme = THEMES[this.level.def.theme ?? 'day'];
    this.parallax = new Parallax(this, this.level.def.theme ?? 'day');
    const layer = this.buildTerrain();
    if (theme.terrainTint !== 0xffffff) layer.setTint(theme.terrainTint);
    this.decorate(theme.terrainTint);
    this.buildEntities();

    this.player = new Player(this, this.level.spawn.x, this.level.spawn.y - PLAYER_RADIUS - 1);
    this.physics.add.collider(this.player.sprite, layer);
    for (const mover of this.movers) {
      this.physics.add.collider(this.player.sprite, mover.sprite, undefined, () => mover.canLand(this.player));
    }
    this.crumbles = this.level.crumbles.map(
      (p) =>
        new CrumbleBlock(
          this,
          p,
          (rect) => this.player.alive && Phaser.Geom.Intersects.CircleToRectangle(new Phaser.Geom.Circle(this.player.x, this.player.y, PLAYER_RADIUS), rect),
          () => audio.play('crack'),
        ),
    );
    for (const block of this.crumbles) {
      this.physics.add.collider(this.player.sprite, block.sprite, () => block.touch(this.player));
    }
    this.checkpointsTracker = new CheckpointTracker({ x: this.level.spawn.x, y: this.level.spawn.y - PLAYER_RADIUS - 1 });
    this.fx = new Effects(this);
    this.cameraRig = new CameraRig(this.cameras.main, this.player.sprite, widthPx, heightPx);
    this.cameras.main.fadeIn(250, 16, 20, 42);

    this.player.on('bounce', (kind: string) => {
      audio.play(kind === 'super' ? 'superBounce' : kind === 'spring' || kind === 'puff' ? 'spring' : 'bounce');
      if (kind !== 'normal') rumble('spring');
      this.fx.burst('dust', this.player.x, this.player.bottom, kind === 'normal' ? 4 : 10);
    });
    this.player.on('stroke', () => {
      audio.play('splash', { intensity: 0.2 });
      this.fx.burst('drops', this.player.x, this.player.bottom, 5);
    });
    this.player.on('land', (impact: number) => {
      if (impact < 120) return;
      audio.play('land', { intensity: impact / 700 });
      if (impact > 450) rumble('land', impact / 700);
      this.fx.burst('dust', this.player.x, this.player.bottom, impact > 450 ? 6 : 3);
    });

    const offPress = input.onPress((action) => {
      if (uiStore.get().screen !== 'playing' || this.finished) return;
      if (action === 'bounce') this.player.pressBounce(this.time.now);
      if (action === 'restart') this.respawnAtCheckpoint();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offPress();
      this.player.removeAllListeners();
    });

    uiStore.set({
      screen: 'playing',
      mode: 'platform',
      boss: null,
      hasDive: this.level.hasWater,
      levelId: this.level.def.id,
      levelName: this.level.def.name,
      collected: 0,
      total: this.level.collectibles.length,
      timeMs: 0,
      deaths: 0,
      prompt: null,
      toast: null,
      result: null,
    });
    if (this.timeAttack) {
      this.ghost = save.ghost(this.level.def.id);
      if (this.ghost) {
        this.ghostBall = new BallDisplay(this, this.ghost.samples[0], this.ghost.samples[1]);
        this.ghostBall.container.setDepth(4.5).setAlpha(0.45);
        this.ghostBall.body.setTint(0x9fd8ff);
        this.ghostBall.setFace('face-happy');
      }
    }
    audio.playTrack(this.level.def.track, this.level.def.name);
    audio.duckMusic(false);
    const number = levelIndex(this.level.def.id);
    const label = number >= 0 ? `Level ${number + 1}: ${this.level.def.name}` : this.level.def.name;
    this.flashToast(this.timeAttack ? `Time Attack: ${this.level.def.name}${this.ghost ? ' (vs your ghost)' : ''}` : label);
  }

  private buildTerrain(): Phaser.Tilemaps.TilemapLayer {
    const map = this.make.tilemap({ data: this.level.tiles, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0);
    if (!tileset) throw new Error('Tileset failed to load');
    const layer = map.createLayer(0, tileset, 0, 0);
    if (!layer) throw new Error('Tile layer failed to build');
    layer.setCollision(SOLID_TILES);
    // Planks are one-way: solid only from above.
    layer.forEachTile((tile) => {
      if (tile.index === TILE_INDEX.plank || tile.index === TILE_INDEX.cloudPlank) tile.setCollision(false, false, true, false);
    });
    return layer;
  }

  /** Tufts and flowers on open grass, placed deterministically from the column number. */
  private decorate(tint: number): void {
    const { tiles } = this.level;
    const grassy = new Set<number>([TILE_INDEX.grass, TILE_INDEX.grassLeft, TILE_INDEX.grassRight, TILE_INDEX.grassSolo]);
    for (let r = 0; r < tiles.length; r++) {
      for (let c = 0; c < tiles[r].length; c++) {
        if (!grassy.has(tiles[r][c])) continue;
        const roll = (c * 73 + r * 31) % 100;
        if (roll > 38) continue;
        const key = roll < 12 ? 'flower' : 'tuft';
        const x = c * TILE + 6 + ((c * 13) % 20);
        this.add.image(x, r * TILE + 1, key).setOrigin(0.5, 1).setDepth(1).setTint(tint);
      }
    }
  }

  private buildEntities(): void {
    const L = this.level;
    this.collectibles = L.collectibles.map((p) => new Collectible(this, p));
    this.spikes = L.spikes.map((p) => new Spikes(this, p));
    this.springs = L.springs.map((p) => new Spring(this, p));
    this.checkpoints = L.checkpoints.map((p) => new Checkpoint(this, p));
    this.movers = L.movers.map((m) => new MovingPlatform(this, m));
    this.updrafts = L.fans.map((f) => new Updraft(this, f));
    this.water = L.hasWater ? new Water(this, L.water, L.def.map) : null;
    this.murklings = L.enemies.map((e) => new Murkling(this, e));
    this.puffs = L.puffs.map((p) => new Spring(this, p, { idle: 'puff', pressed: 'puff-squash' }));
    this.geysers = L.geysers.map((p) => new Geyser(this, p));
    this.jellies = L.jellies.map((p) => new Jelly(this, p));
    this.lava = L.hasLava ? new Lava(this, L.lava) : null;
    if (L.hasWater) addCurrentStreaks(this, L.currents);
    this.secret = new SecretWalls(this, L.fakeWalls, THEMES[L.def.theme ?? 'day'].terrainTint);
    this.exit = new Exit(this, L.exit);
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(delta, 50) / 1000;
    const now = this.time.now;
    this.physics.world.gravity.y = TUNING.gravity;

    for (const mover of this.movers) mover.update(this.player.alive ? this.player : undefined);
    this.water?.update(dt);
    for (const m of this.murklings) m.update(dt);
    for (const g of this.geysers) g.update(dt);
    for (const j of this.jellies) j.update(dt);
    this.lava?.update(dt);
    this.player.update(now, dt, input.moveX, input.isHeld('bounce'), this.environment(now));

    if (this.timeAttack && !this.finished) this.updateGhosts();
    if (this.player.alive && !this.finished) {
      this.elapsedMs += delta;
      this.checkTriggers(now);
      if (this.player.y > this.level.heightPx + TILE * 1.5) this.kill();
      this.updatePrompts();
    }

    this.parallax.update(this.cameras.main.scrollX, dt);
    this.cameraRig.update(dt, this.player.alive ? this.player.vx : 0);

    if (!this.finished && now - this.lastUiPush >= UI_PUSH_MS) {
      this.lastUiPush = now;
      uiStore.set({ timeMs: Math.floor(this.elapsedMs) });
    }
  }

  /** Records this run and moves the ghost along the best previous run. */
  private updateGhosts(): void {
    while (this.elapsedMs >= this.nextSampleAt) {
      this.recording.push(Math.round(this.player.x), Math.round(this.player.y));
      this.nextSampleAt += GHOST_SAMPLE_MS;
    }
    if (!this.ghost || !this.ghostBall) return;
    const s = this.ghost.samples;
    const f = this.elapsedMs / GHOST_SAMPLE_MS;
    const i = Math.min(Math.floor(f), s.length / 2 - 2);
    if (i < 0) return;
    const t = Math.min(1, f - i);
    const x = s[i * 2] + (s[i * 2 + 2] - s[i * 2]) * t;
    const y = s[i * 2 + 1] + (s[i * 2 + 3] - s[i * 2 + 1]) * t;
    this.ghostBall.place(x, y, 0);
    this.ghostBall.body.rotation = x / 12;
    this.ghostBall.container.setVisible(f < s.length / 2);
  }

  /** Water and wind acting on the player this frame, plus their splash/whoosh feedback. */
  private environment(now: number): PlayerEnv {
    if (!this.player.alive) return { submersion: 0, diving: false, updraft: false };
    const submersion = this.water?.submersion(this.player.x, this.player.bottom, PLAYER_RADIUS * 2) ?? 0;
    this.playerCircle.setTo(this.player.x, this.player.y, PLAYER_RADIUS - 1);
    const updraft = this.updrafts.some((u) => this.hits(u));

    if (submersion > 0 && !this.wasSubmerged && this.player.vy > 120) {
      audio.play('splash', { intensity: this.player.vy / 600 });
      this.fx.burst('drops', this.player.x, this.player.bottom - 4, 12);
    }
    if (updraft && !this.wasInUpdraft && now - this.lastWhooshAt > 600) {
      this.lastWhooshAt = now;
      audio.play('whoosh');
    }
    this.wasSubmerged = submersion > 0;
    this.wasInUpdraft = updraft;
    const col = Math.floor(this.player.x / TILE);
    const row = Math.floor(this.player.y / TILE);
    const current = submersion > 0 ? (this.level.currents[row]?.[col] ?? 0) : 0;
    return {
      submersion,
      diving: submersion > 0 && input.isHeld('special'),
      updraft,
      current,
      buoyancyScale: this.level.def.buoyancy ?? 1,
    };
  }

  private hits(trigger: Trigger): boolean {
    return Phaser.Geom.Intersects.CircleToRectangle(this.playerCircle, trigger.bounds);
  }

  private checkTriggers(now: number): void {
    this.playerCircle.setTo(this.player.x, this.player.y, PLAYER_RADIUS - 1);

    for (const seed of this.collectibles) {
      if (!seed.collected && this.hits(seed)) this.collect(seed, now);
    }

    const hazard =
      this.spikes.some((s) => this.hits(s)) ||
      this.jellies.some((j) => this.hits(j)) ||
      this.geysers.some((g) => g.active && this.hits(g));
    if (!this.player.invulnerable && hazard) {
      this.kill();
      return;
    }
    // Lava is deadly even right after a respawn.
    if (this.lava?.touches(this.player.x, this.player.bottom)) {
      this.kill();
      return;
    }

    for (const spring of this.springs) {
      if (this.player.vy >= -20 && this.hits(spring) && spring.tryFire(now)) this.player.launch('spring');
    }
    for (const puff of this.puffs) {
      if (this.player.vy >= -20 && this.hits(puff) && puff.tryFire(now)) this.player.launch('puff');
    }

    for (const cp of this.checkpoints) {
      if (this.hits(cp) && this.checkpointsTracker.reach(cp)) {
        audio.play('checkpoint');
        this.fx.burst('sparks', cp.respawnPoint.x, cp.respawnPoint.y - 40, 14);
        this.flashToast('Checkpoint!');
      }
    }

    for (const m of this.murklings) {
      if (!m.alive || Math.hypot(this.player.x - m.x, this.player.y - m.y) > PLAYER_RADIUS + MURKLING_RADIUS - 3) continue;
      if (this.player.vy > 40 && this.player.y < m.y - 4) {
        // Stomp: pop it and bounce off its head (hold Bounce to go higher).
        m.pop();
        this.player.launch('normal');
        audio.play('stomp');
        save.countStomp();
        rumble('explode', 0.6);
        this.fx.burst('bits', m.x, m.y, 10);
      } else if (!this.player.invulnerable) {
        this.kill();
        return;
      }
    }
    this.maybeShowMurklingHint();

    if (this.secret?.check(this.player.x, this.player.y)) {
      this.secretFound = true;
      audio.play('powerup');
      this.flashToast(save.findSecret(this.level.def.id) ? 'Secret room found!' : 'Secret room!');
    }

    if (this.hits(this.exit)) this.finish();
  }

  private maybeShowMurklingHint(): void {
    if (murklingHintShown) return;
    const view = this.cameras.main.worldView;
    if (!this.murklings.some((m) => m.alive && view.contains(m.x, m.y))) return;
    murklingHintShown = true;
    const text = 'A Murkling! Bounce on its head to pop it';
    uiStore.set({ prompt: text });
    this.promptTimer?.remove();
    this.promptTimer = this.time.delayedCall(PROMPT_MS, () => {
      if (uiStore.get().prompt === text) uiStore.set({ prompt: null });
    });
  }

  private collect(seed: Collectible, now: number): void {
    seed.collect();
    this.collected += 1;
    this.collectChain = now - this.lastCollectAt < 650 ? this.collectChain + 1 : 0;
    this.lastCollectAt = now;
    audio.play('collect', { pitch: 1 + Math.min(this.collectChain, 8) * 0.06 });
    this.fx.burst('sparks', seed.sprite.x, seed.sprite.y, 6);
    this.player.cheer();
    uiStore.set({ collected: this.collected });
  }

  private flashToast(text: string): void {
    const id = showToast(text);
    this.time.delayedCall(1600, () => {
      if (uiStore.get().toast?.id === id) uiStore.set({ toast: null });
    });
  }

  private updatePrompts(): void {
    const next = this.level.prompts[this.promptIndex];
    if (!next || this.player.x < next.x - TILE) return;
    this.promptIndex += 1;
    uiStore.set({ prompt: next.text });
    this.promptTimer?.remove();
    this.promptTimer = this.time.delayedCall(PROMPT_MS, () => {
      if (uiStore.get().prompt === next.text) uiStore.set({ prompt: null });
    });
  }

  private kill(): void {
    if (!this.player.alive || this.finished) return;
    this.deaths += 1;
    uiStore.set({ deaths: this.deaths });
    audio.play('fail');
    rumble('death');
    this.fx.burst('bits', this.player.x, Math.min(this.player.y, this.level.heightPx - 8), 18);
    this.cameras.main.shake(160, 0.006);
    this.player.die();
    this.time.delayedCall(RESPAWN_DELAY_MS, () => this.respawn());
  }

  private respawn(): void {
    if (this.finished) return;
    const p = this.checkpointsTracker.respawnPoint;
    this.player.respawn(p.x, p.y);
  }

  /** Restart action (R / Share): return to the last checkpoint without counting a fall. */
  respawnAtCheckpoint(): void {
    if (this.finished || !this.player.alive) return;
    this.fx.burst('dust', this.player.x, this.player.y, 8);
    this.respawn();
  }

  private finish(): void {
    this.finished = true;
    this.player.frozen = true;
    audio.play('complete');
    this.fx.burst('stars', this.exit.center.x, this.exit.center.y, 24);
    this.promptTimer?.remove();
    const stats = {
      timeMs: this.elapsedMs,
      collected: this.collected,
      total: this.level.collectibles.length,
      deaths: this.deaths,
    };
    uiStore.set({ timeMs: Math.floor(this.elapsedMs), prompt: null });
    if (this.collected === this.level.collectibles.length) save.unlock('allSeeds');
    if (this.deaths === 0) save.unlock('noFalls');

    if (this.timeAttack) {
      audio.stopMusic();
      const previous = this.ghost?.timeMs ?? null;
      const newGhost = save.offerGhost(this.level.def.id, { timeMs: Math.floor(this.elapsedMs), samples: this.recording });
      this.time.delayedCall(1300, () =>
        completeRun(this.level.def.id, stats, {
          ghostDeltaMs: previous === null ? null : Math.floor(this.elapsedMs) - previous,
          newGhost,
          secretFound: this.secretFound,
        }),
      );
      return;
    }

    if (!hasShooterStage(this.level.def.id)) {
      audio.stopMusic();
      this.time.delayedCall(1300, () => completeRun(this.level.def.id, stats, { secretFound: this.secretFound }));
      return;
    }
    // Every campaign level ends with a sky battle against the Murklings.
    this.flashToast('Murklings ahead! Take to the skies!');
    this.time.delayedCall(1300, () => {
      this.cameras.main.fadeOut(350, 16, 20, 42);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('Shooter', { levelId: this.level.def.id, carry: stats, secretFound: this.secretFound });
      });
    });
  }
}
