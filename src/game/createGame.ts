import Phaser from 'phaser';
import { getSkin } from './art/skins';
import { applyBallSkin } from './art/textures';
import { gameCommands, uiStore, type RunMode } from './bridge';
import { STORY } from './story';
import { save } from './systems/save';
import { VIEW_HEIGHT, viewWidthFor } from './config';
import { input } from './input/InputManager';
import { levelFromUrl } from './levels';
import { TUNING } from './physics/tuning';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { ShooterScene } from './scenes/ShooterScene';
import { TitleScene } from './scenes/TitleScene';
import { audio } from './systems/audio';

export interface GameHandle {
  destroy(): void;
}

/**
 * Creates the Phaser game inside `parent` and wires React commands to scene changes.
 * Call once when the canvas mounts; call destroy() on unmount.
 */
export function createGame(parent: HTMLElement): GameHandle {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: viewWidthFor(parent.clientWidth, parent.clientHeight),
    height: VIEW_HEIGHT,
    backgroundColor: '#4fa4e8',
    pixelArt: true,
    roundPixels: true,
    banner: false,
    // Input and audio are handled by our own systems (shared input model, Web Audio synth).
    input: { keyboard: false, gamepad: false },
    audio: { noAudio: true },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: TUNING.gravity }, debug: false },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, TitleScene, GameScene, ShooterScene],
  });

  // Dev-only handle for automated playtests and console debugging.
  if (import.meta.env.DEV) (window as unknown as { __bopple?: Phaser.Game }).__bopple = game;

  let levelId = levelFromUrl();
  /** What "Play again" repeats. */
  let lastRun: { mode: RunMode; levelId: string; bosses?: string[] } = { mode: 'campaign', levelId };

  // Widen or narrow the logical canvas as the window changes shape, so it always fills it.
  const resizeObserver = new ResizeObserver(() => {
    const width = viewWidthFor(parent.clientWidth, parent.clientHeight);
    if (width !== game.scale.gameSize.width) game.scale.setGameSize(width, VIEW_HEIGHT);
  });
  resizeObserver.observe(parent);

  // Gameplay happens in either the platform scene or the sky-shooter section after an exit.
  const GAMEPLAY = ['Game', 'Shooter'] as const;
  const current = () => GAMEPLAY.find((key) => game.scene.isActive(key) || game.scene.isPaused(key)) ?? null;
  const stopGameplay = () => GAMEPLAY.forEach((key) => game.scene.stop(key));

  const offCommands = gameCommands.on((command) => {
    const scenes = game.scene;
    const key = current();
    switch (command.type) {
      case 'start': {
        levelId = command.levelId ?? levelId;
        const mode = command.mode ?? 'campaign';
        audio.unlock();
        // Campaign levels open with their story scene the first time.
        if (mode === 'campaign' && !command.skipStory && STORY[levelId] && !save.get().storySeen.includes(levelId)) {
          uiStore.set({ screen: 'story', storyLevel: levelId, storyReplay: false, runMode: 'campaign' });
          break;
        }
        uiStore.set({ runMode: mode });
        lastRun = { mode, levelId };
        input.reset();
        scenes.stop('Title');
        stopGameplay();
        if (mode === 'coop') scenes.start('Shooter', { levelId, mode: 'coop' });
        else scenes.start('Game', { levelId });
        break;
      }
      case 'bossrush':
        audio.unlock();
        uiStore.set({ runMode: 'bossrush' });
        lastRun = { mode: 'bossrush', levelId, bosses: command.bosses };
        input.reset();
        scenes.stop('Title');
        stopGameplay();
        scenes.start('Shooter', { levelId: 'fortress', mode: 'bossrush', bosses: command.bosses });
        break;
      case 'applySkin': {
        const scene = scenes.getScene('Title') ?? scenes.getScene('Boot');
        if (scene) applyBallSkin(scene, getSkin(command.skin));
        break;
      }
      case 'pause':
        if (!key || !scenes.isActive(key) || uiStore.get().screen !== 'playing') return;
        scenes.pause(key);
        audio.duckMusic(true);
        audio.play('pause');
        uiStore.set({ screen: 'paused' });
        break;
      case 'resume':
        if (!key || uiStore.get().screen !== 'paused') return;
        input.reset();
        scenes.resume(key);
        audio.duckMusic(false);
        uiStore.set({ screen: 'playing' });
        break;
      case 'restartCheckpoint': {
        if (!key) return;
        if (scenes.isPaused(key)) {
          scenes.resume(key);
          audio.duckMusic(false);
        }
        uiStore.set({ screen: 'playing' });
        if (key === 'Game') (scenes.getScene('Game') as GameScene).respawnAtCheckpoint();
        else (scenes.getScene('Shooter') as ShooterScene).restartFromCheckpoint(false);
        break;
      }
      case 'restartLevel':
        input.reset();
        stopGameplay();
        uiStore.set({ runMode: lastRun.mode });
        if (lastRun.mode === 'bossrush') scenes.start('Shooter', { levelId: 'fortress', mode: 'bossrush', bosses: lastRun.bosses });
        else if (lastRun.mode === 'coop') scenes.start('Shooter', { levelId, mode: 'coop' });
        else scenes.start('Game', { levelId });
        break;
      case 'quitToTitle':
        audio.stopMusic();
        stopGameplay();
        scenes.start('Title');
        uiStore.set({ screen: 'title', mode: 'platform', runMode: 'campaign', boss: null, prompt: null, toast: null, hp2: null });
        break;
    }
  });

  return {
    destroy() {
      resizeObserver.disconnect();
      offCommands();
      audio.stopMusic();
      game.destroy(true);
    },
  };
}
