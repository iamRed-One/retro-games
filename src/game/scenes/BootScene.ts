import Phaser from 'phaser';
import { getSkin } from '../art/skins';
import { applyBallSkin, generateTextures } from '../art/textures';
import { initSaveUi, save } from '../systems/save';
import { uiStore } from '../bridge';
import { levelFromUrl } from '../levels';

/** Builds all generated art, then hands over to the title backdrop. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generateTextures(this);
    applyBallSkin(this, getSkin(save.get().skin));
    initSaveUi();
    // Dev convenience: ?autostart skips the title screen.
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('autostart')) {
      this.scene.start('Game', { levelId: levelFromUrl() });
      return;
    }
    uiStore.set({ screen: 'hub' });
    this.scene.start('Title');
  }
}
