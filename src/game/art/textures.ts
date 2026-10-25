/**
 * Placeholder pixel art generated at boot. Everything is drawn on a 16px art grid and doubled,
 * so it stays crisp under Phaser's pixelArt scaling. Swap any key for a real image in
 * public/assets/ later by loading it under the same texture key.
 */
import Phaser from 'phaser';
import { ART_SCALE, TILE, VIEW_HEIGHT, VIEW_WIDTH } from '../config';
import { PALETTE as P, THEMES, type Theme, type ThemeId } from './palette';
import { getSkin, skinColorAt, type SkinDef } from './skins';

/** Frame order inside the generated `tiles` tileset. */
export const TILE_INDEX = {
  grass: 0,
  dirt: 1,
  stone: 2,
  plank: 3,
  grassLeft: 4,
  grassRight: 5,
  grassSolo: 6,
  /** Solid cloud block (sky worlds). */
  cloud: 7,
  /** One-way cloud ledge. */
  cloudPlank: 8,
} as const;
const TILESET_FRAMES = 9;

class Painter {
  constructor(
    readonly ctx: CanvasRenderingContext2D,
    readonly scale: number,
    public ox = 0,
    public oy = 0,
  ) {}

  px(x: number, y: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect((this.ox + x) * this.scale, (this.oy + y) * this.scale, this.scale, this.scale);
  }

  rect(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect((this.ox + x) * this.scale, (this.oy + y) * this.scale, w * this.scale, h * this.scale);
  }

  clear(x: number, y: number, w = 1, h = 1): void {
    this.ctx.clearRect((this.ox + x) * this.scale, (this.oy + y) * this.scale, w * this.scale, h * this.scale);
  }

  /** Filled pixel disc; `color` may pick a color per pixel from its distance to the center. */
  disc(cx: number, cy: number, r: number, color: string | ((x: number, y: number, d: number) => string | null)): void {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d > r) continue;
        const c = typeof color === 'function' ? color(x, y, d) : color;
        if (c) this.px(x, y, c);
      }
    }
  }
}

function canvasTexture(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (p: Painter) => void,
  scale = ART_SCALE,
): Phaser.Textures.CanvasTexture {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w * scale, h * scale);
  if (!tex) throw new Error(`Could not create texture "${key}"`);
  draw(new Painter(tex.getContext(), scale));
  tex.refresh();
  return tex;
}

/** Deterministic random so generated art looks the same every load. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateTextures(scene: Phaser.Scene): void {
  tileset(scene);
  ball(scene);
  faces(scene);
  pickups(scene);
  hazards(scene);
  props(scene);
  particles(scene);
  mechanics(scene);
  background(scene);
  clouds(scene);
  villains(scene);
  shooterArt(scene);
  worldArt(scene);
  skyHazardArt(scene);
  bossArt(scene);
}

function speckleDirt(p: Painter, r: () => number, fromY: number): void {
  p.rect(0, fromY, 16, 16 - fromY, P.dirt);
  for (let i = 0; i < 12; i++) {
    const x = Math.floor(r() * 16);
    const y = fromY + Math.floor(r() * (16 - fromY));
    p.px(x, y, r() < 0.55 ? P.dirtDark : P.dirtLight);
  }
}

function grassTop(p: Painter, r: () => number, capLeft: boolean, capRight: boolean): void {
  speckleDirt(p, r, 0);
  p.rect(0, 0, 16, 1, P.grassLight);
  p.rect(0, 1, 16, 3, P.grass);
  for (let x = 0; x < 16; x++) {
    p.px(x, 4, x % 2 === 0 ? P.grassDark : P.grass);
    if (x % 5 === 1) p.px(x, 5, P.grassDark);
  }
  if (capLeft) {
    p.clear(0, 0);
    p.rect(0, 1, 1, 4, P.grassDark);
    p.rect(0, 5, 1, 11, P.dirtEdge);
  }
  if (capRight) {
    p.clear(15, 0);
    p.rect(15, 1, 1, 4, P.grassDark);
    p.rect(15, 5, 1, 11, P.dirtEdge);
  }
}

function tileset(scene: Phaser.Scene): void {
  const tex = canvasTexture(scene, 'tiles', 16 * TILESET_FRAMES, 16, (p) => {
    const at = (index: number) => {
      p.ox = index * 16;
      return rng(100 + index);
    };
    grassTop(p, at(TILE_INDEX.grass), false, false);
    speckleDirt(p, at(TILE_INDEX.dirt), 0);

    at(TILE_INDEX.stone);
    p.rect(0, 0, 16, 16, P.stone);
    p.rect(0, 0, 16, 1, P.stoneLight);
    p.rect(0, 7, 16, 1, P.stoneDark);
    p.rect(0, 15, 16, 1, P.stoneDark);
    p.rect(7, 0, 1, 7, P.stoneDark);
    p.rect(3, 8, 1, 7, P.stoneDark);
    p.rect(11, 8, 1, 7, P.stoneDark);

    at(TILE_INDEX.plank);
    p.rect(0, 0, 16, 1, P.plankLight);
    p.rect(0, 1, 16, 4, P.plank);
    p.rect(0, 5, 16, 1, P.plankDark);
    p.px(2, 2, P.plankDark);
    p.px(13, 2, P.plankDark);
    p.rect(3, 6, 1, 2, P.plankDark);
    p.rect(12, 6, 1, 2, P.plankDark);

    grassTop(p, at(TILE_INDEX.grassLeft), true, false);
    grassTop(p, at(TILE_INDEX.grassRight), false, true);
    grassTop(p, at(TILE_INDEX.grassSolo), true, true);

    at(TILE_INDEX.cloud);
    p.rect(0, 0, 16, 16, P.cloudBlock);
    p.rect(0, 11, 16, 5, P.cloudBlockShade);
    for (const x of [1, 6, 11]) p.disc(x + 2, 1.5, 2.2, P.cloudBlock);
    p.px(3, 4, P.cloudBlockShade);
    p.px(12, 7, P.cloudBlockShade);

    at(TILE_INDEX.cloudPlank);
    p.rect(0, 1, 16, 4, P.cloudBlock);
    p.rect(0, 4, 16, 2, P.cloudBlockShade);
    for (const x of [0, 5, 10]) p.disc(x + 3, 1.5, 2.4, P.cloudBlock);
  });
  // Named frames so the title screen can tile single frames.
  tex.add('grass', 0, TILE_INDEX.grass * TILE, 0, TILE, TILE);
  tex.add('dirt', 0, TILE_INDEX.dirt * TILE, 0, TILE, TILE);
  for (let i = 0; i < TILESET_FRAMES; i++) tex.add(`t${i}`, 0, i * TILE, 0, TILE, TILE);
}

/** Redraws the rolling ball layer (and its pop particles) in a shop skin. */
export function applyBallSkin(scene: Phaser.Scene, skin: SkinDef): void {
  const paintBall = (p: Painter) => {
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
        const c = skinColorAt(skin, x, y);
        if (c) p.px(x, y, c);
      }
    }
  };
  // Repaint in place when the texture exists, so balls already on screen update instantly
  // instead of pointing at a removed texture.
  for (const [key, w, h, draw] of [
    ['ball', 12, 12, paintBall],
    ['bit', 2, 2, (p: Painter) => p.rect(0, 0, 2, 2, skin.base)],
  ] as const) {
    const existing = scene.textures.exists(key) ? scene.textures.get(key) : null;
    if (existing instanceof Phaser.Textures.CanvasTexture) {
      existing.context.clearRect(0, 0, existing.width, existing.height);
      draw(new Painter(existing.context, ART_SCALE));
      existing.refresh();
    } else {
      canvasTexture(scene, key, w, h, draw);
    }
  }
}

function ball(scene: Phaser.Scene): void {
  // Rotating layer: flat color plus freckles so rolling is visible.
  applyBallSkin(scene, getSkin('classic'));
  // Non-rotating lighting layer so the light source stays fixed while the ball rolls.
  canvasTexture(scene, 'ball-shine', 12, 12, (p) => {
    p.disc(6, 6, 5.1, (x, y) => (x + y > 13 ? 'rgba(120, 30, 0, 0.32)' : null));
    p.px(3, 3, 'rgba(255, 245, 225, 0.9)');
    p.px(4, 3, 'rgba(255, 245, 225, 0.6)');
    p.px(3, 4, 'rgba(255, 245, 225, 0.6)');
  });
}

function faces(scene: Phaser.Scene): void {
  const eyes = (p: Painter, pupilY = 4) => {
    p.rect(3, 3, 2, 3, P.white);
    p.rect(7, 3, 2, 3, P.white);
    p.rect(4, pupilY, 1, 2, P.ink);
    p.rect(8, pupilY, 1, 2, P.ink);
  };
  canvasTexture(scene, 'face-idle', 12, 12, (p) => {
    eyes(p);
    p.rect(5, 8, 2, 1, P.ballOutline);
  });
  canvasTexture(scene, 'face-blink', 12, 12, (p) => {
    p.rect(3, 5, 2, 1, P.ink);
    p.rect(7, 5, 2, 1, P.ink);
    p.rect(5, 8, 2, 1, P.ballOutline);
  });
  canvasTexture(scene, 'face-happy', 12, 12, (p) => {
    for (const ox of [3, 7]) {
      p.px(ox, 5, P.ink);
      p.px(ox + 1, 4, P.ink);
      p.px(ox + 2, 5, P.ink);
    }
    p.px(4, 8, P.ballOutline);
    p.rect(5, 9, 2, 1, P.ballOutline);
    p.px(7, 8, P.ballOutline);
  });
  canvasTexture(scene, 'face-scared', 12, 12, (p) => {
    p.rect(3, 2, 2, 4, P.white);
    p.rect(7, 2, 2, 4, P.white);
    p.px(4, 3, P.ink);
    p.px(8, 3, P.ink);
    p.rect(5, 8, 2, 2, P.ballOutline);
  });
  canvasTexture(scene, 'face-hurt', 12, 12, (p) => {
    for (const ox of [3, 7]) {
      p.px(ox, 3, P.ink);
      p.px(ox + 1, 4, P.ink);
      p.px(ox, 5, P.ink);
      p.px(ox + 1, 3, P.ink);
      p.px(ox, 4, P.ink);
      p.px(ox + 1, 5, P.ink);
    }
    p.rect(4, 8, 4, 1, P.ballOutline);
  });
}

function pickups(scene: Phaser.Scene): void {
  // Sun seed collectible.
  canvasTexture(scene, 'seed', 8, 8, (p) => {
    p.disc(4, 4, 3.8, (_x, _y, d) => (d > 2.9 ? P.seedDark : P.seed));
    p.px(3, 2, P.seedLight);
    p.px(2, 3, P.seedLight);
    p.px(5, 5, P.seedDark);
  });
}

function hazards(scene: Phaser.Scene): void {
  canvasTexture(scene, 'spikes', 16, 16, (p) => {
    for (let k = 0; k < 4; k++) {
      const x0 = k * 4;
      for (let y = 8; y <= 14; y++) {
        const half = Math.floor(((y - 8) / 6) * 2);
        for (let x = x0 + 1 - half; x <= x0 + 2 + half; x++) {
          if (x < x0 || x > x0 + 3) continue;
          p.px(x, y, x <= x0 + 1 ? P.metal : P.metalDark);
        }
      }
    }
    p.rect(0, 15, 16, 1, P.metalBase);
  });

  const spring = (key: string, padY: number) =>
    canvasTexture(scene, key, 16, 16, (p) => {
      p.rect(2, 14, 12, 2, P.metalBase);
      for (let y = padY + 3; y < 14; y++) {
        const x = (y - padY) % 2 === 0 ? 4 : 5;
        p.rect(x, y, 7, 1, (y - padY) % 2 === 0 ? P.metal : P.metalDark);
      }
      p.rect(1, padY, 14, 2, P.springPad);
      p.rect(1, padY + 2, 14, 1, P.springPadDark);
    });
  spring('spring', 5);
  spring('spring-pressed', 10);
}

function props(scene: Phaser.Scene): void {
  canvasTexture(scene, 'mover', 48, 8, (p) => {
    p.rect(0, 0, 48, 1, P.plankLight);
    p.rect(0, 1, 48, 5, P.plank);
    p.rect(0, 6, 48, 2, P.plankDark);
    for (let x = 6; x < 48; x += 12) p.px(x, 3, P.plankDark);
    p.rect(0, 0, 2, 8, P.metalDark);
    p.rect(46, 0, 2, 8, P.metalDark);
  });

  const flag = (key: string, on: boolean) =>
    canvasTexture(scene, key, 16, 32, (p) => {
      p.rect(3, 2, 2, 28, P.stone);
      p.rect(3, 2, 1, 28, P.stoneLight);
      p.disc(4, 1.5, 1.6, on ? P.gold : P.stoneDark);
      p.rect(1, 29, 6, 3, P.stoneDark);
      if (on) {
        for (let y = 3; y <= 11; y++) {
          const w = 10 - Math.abs(y - 7) * 2;
          p.rect(5, y, Math.max(1, w), 1, y < 6 ? P.flagOnLight : P.flagOn);
        }
      } else {
        p.rect(5, 19, 4, 5, P.flagOff);
        p.rect(5, 24, 2, 2, P.flagOff);
      }
    });
  flag('flag-off', false);
  flag('flag-on', true);

  canvasTexture(scene, 'exit', 24, 32, (p) => {
    p.disc(12, 12, 12, P.stone);
    p.rect(0, 12, 24, 20, P.stone);
    p.disc(12, 12, 12, (_x, y, d) => (d > 11 && y < 12 ? P.stoneLight : null));
    p.disc(12, 13, 8, (_x, y) => (y < 11 ? P.portalLight : P.portal));
    p.rect(4, 13, 16, 19, P.portal);
    for (let y = 20; y < 32; y++) p.rect(4, y, 16, 1, y % 4 === 0 ? P.portalDark : P.portal);
    p.rect(0, 29, 24, 3, P.stoneDark);
    p.px(9, 9, P.white);
    p.px(15, 15, P.white);
    p.px(8, 22, P.portalLight);
  });

  canvasTexture(scene, 'tuft', 8, 4, (p) => {
    p.px(1, 2, P.grassDark);
    p.px(1, 3, P.grassDark);
    p.px(3, 1, P.grass);
    p.rect(3, 2, 1, 2, P.grassDark);
    p.px(5, 2, P.grass);
    p.px(5, 3, P.grassDark);
  });
  canvasTexture(scene, 'flower', 5, 7, (p) => {
    p.rect(2, 3, 1, 4, P.grassDark);
    p.px(1, 1, P.flowerPink);
    p.px(3, 1, P.flowerPink);
    p.px(2, 0, P.flowerPink);
    p.px(2, 2, P.flowerPink);
    p.px(2, 1, P.flowerWhite);
  });
}

function particles(scene: Phaser.Scene): void {
  canvasTexture(scene, 'spark', 3, 3, (p) => {
    p.px(1, 0, P.seedLight);
    p.rect(0, 1, 3, 1, P.seedLight);
    p.px(1, 2, P.seedLight);
    p.px(1, 1, P.white);
  });
  canvasTexture(scene, 'dust', 2, 2, (p) => p.rect(0, 0, 2, 2, P.dust));
  canvasTexture(scene, 'bit', 2, 2, (p) => p.rect(0, 0, 2, 2, P.ballBase));
  canvasTexture(scene, 'star', 5, 5, (p) => {
    p.rect(2, 0, 1, 5, P.gold);
    p.rect(0, 2, 5, 1, P.gold);
    p.px(2, 2, P.white);
  });
}

function mechanics(scene: Phaser.Scene): void {
  // Cracked wooden block that crumbles after being stood on.
  canvasTexture(scene, 'crumble', 16, 16, (p) => {
    p.rect(0, 0, 16, 16, P.plank);
    p.rect(0, 0, 16, 1, P.plankLight);
    p.rect(0, 15, 16, 1, P.plankDark);
    p.rect(0, 7, 16, 1, P.plankDark);
    p.rect(0, 0, 1, 16, P.plankDark);
    p.rect(15, 0, 1, 16, P.plankDark);
    const crack: [number, number][] = [[4, 1], [5, 2], [5, 3], [6, 4], [6, 5], [10, 8], [9, 9], [9, 10], [10, 11], [11, 12], [12, 13]];
    crack.forEach(([x, y]) => p.px(x, y, P.dirtEdge));
    p.px(2, 11, P.plankLight);
    p.px(12, 3, P.plankLight);
  });

  // Updraft fan, two frames for spinning blades.
  const fan = (key: string, wide: boolean) =>
    canvasTexture(scene, key, 16, 16, (p) => {
      p.rect(1, 12, 14, 4, P.metalBase);
      p.rect(1, 12, 14, 1, P.metalDark);
      p.rect(2, 9, 12, 3, P.metalDark);
      p.rect(7, 6, 2, 3, P.metal);
      if (wide) {
        p.rect(2, 7, 12, 2, P.metal);
      } else {
        p.rect(5, 5, 6, 2, P.metal);
        p.rect(4, 8, 8, 1, P.metal);
      }
    });
  fan('fan', true);
  fan('fan-2', false);

  canvasTexture(scene, 'wind', 1, 5, (p) => {
    p.px(0, 0, 'rgba(255,255,255,0.3)');
    p.rect(0, 1, 1, 3, 'rgba(255,255,255,0.85)');
    p.px(0, 4, 'rgba(255,255,255,0.3)');
  });

  // Animated wave crest along water surfaces; tiles horizontally.
  canvasTexture(scene, 'water-top', 16, 4, (p) => {
    for (let x = 0; x < 16; x++) {
      const y = x % 8 < 4 ? 0 : 1;
      p.px(x, y, 'rgba(212, 248, 255, 0.95)');
      p.px(x, y + 1, 'rgba(123, 227, 255, 0.7)');
    }
  });
  canvasTexture(scene, 'drop', 2, 2, (p) => p.rect(0, 0, 2, 2, P.portalLight));
}

function worldArt(scene: Phaser.Scene): void {
  // Bouncy cloud puff: lands you into a big soft bounce.
  canvasTexture(scene, 'puff', 16, 12, (p) => {
    const px = (_x: number, y: number) => (y > 8 ? P.cloudBlockShade : P.cloudBlock);
    p.disc(5, 7, 4.5, px);
    p.disc(11, 7, 4.5, px);
    p.disc(8, 5, 5, px);
    p.rect(2, 8, 12, 3, P.cloudBlockShade);
    p.px(6, 5, P.ink);
    p.px(10, 5, P.ink);
    p.rect(7, 7, 2, 1, P.flowerPink);
  });
  canvasTexture(scene, 'puff-squash', 16, 12, (p) => {
    p.disc(8, 9, 6, P.cloudBlock);
    p.rect(1, 9, 14, 3, P.cloudBlockShade);
    p.rect(5, 8, 1, 1, P.ink);
    p.rect(10, 8, 1, 1, P.ink);
  });

  // Fire geyser vent and its flame puff particle.
  canvasTexture(scene, 'geyser', 16, 8, (p) => {
    p.rect(1, 3, 14, 5, P.stoneDark);
    p.rect(1, 3, 14, 1, P.stone);
    p.rect(5, 2, 6, 2, P.lavaDark);
    p.rect(6, 1, 4, 1, P.lava);
  });
  canvasTexture(scene, 'fire', 4, 4, (p) => {
    p.disc(2, 2, 2, (_x, _y, d) => (d > 1.2 ? P.lava : P.lavaLight));
  });

  // Jellyfish: bobbing, stinging hazard in the ocean.
  for (const frame of [0, 1]) {
    canvasTexture(scene, `jelly-${frame}`, 14, 16, (p) => {
      p.disc(7, 5, 5.5, (_x, y, d) => (d > 4.5 ? P.jelly : y < 4 ? P.jellyLight : 'rgba(255, 122, 217, 0.75)'));
      p.rect(2, 6, 11, 2, 'rgba(255, 122, 217, 0.75)');
      p.px(5, 5, P.ink);
      p.px(9, 5, P.ink);
      for (const x of [3, 6, 9, 11]) {
        const sway = (x + frame) % 2;
        p.rect(x + sway, 8, 1, 3, P.jelly);
        p.rect(x + 1 - sway, 11, 1, 3, P.jellyLight);
      }
    });
  }

  // Lava surface crest (tiles horizontally) and atmosphere particles.
  canvasTexture(scene, 'lava-top', 16, 4, (p) => {
    for (let x = 0; x < 16; x++) {
      const y = x % 8 < 4 ? 0 : 1;
      p.px(x, y, P.lavaLight);
      p.px(x, y + 1, P.lava);
    }
  });
  canvasTexture(scene, 'bubble', 3, 3, (p) => {
    p.disc(1.5, 1.5, 1.5, (_x, _y, d) => (d > 0.9 ? 'rgba(212, 248, 255, 0.85)' : 'rgba(212, 248, 255, 0.25)'));
  });
  canvasTexture(scene, 'ember', 2, 2, (p) => {
    p.rect(0, 0, 2, 2, P.lava);
    p.px(0, 0, P.lavaLight);
  });
  canvasTexture(scene, 'raindrop', 1, 4, (p) => p.rect(0, 0, 1, 4, 'rgba(190, 210, 255, 0.7)'));
}

function background(scene: Phaser.Scene): void {
  for (const [id, theme] of Object.entries(THEMES) as [ThemeId, Theme][]) themedBackground(scene, id, theme);
}

/** Generates `sky-<theme>`, `sun-<theme>`, `hills-far-<theme>`, `hills-near-<theme>`. */
function themedBackground(scene: Phaser.Scene, id: ThemeId, t: Theme): void {
  const bands = 9;
  const skyW = VIEW_WIDTH / ART_SCALE;
  const skyH = VIEW_HEIGHT / ART_SCALE;
  canvasTexture(scene, `sky-${id}`, skyW, skyH, (p) => {
    const top = Phaser.Display.Color.HexStringToColor(t.skyTop);
    const bottom = Phaser.Display.Color.HexStringToColor(t.skyBottom);
    const bandH = Math.ceil(skyH / bands);
    for (let i = 0; i < bands; i++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, bands - 1, i);
      p.rect(0, i * bandH, skyW, bandH, Phaser.Display.Color.RGBToString(c.r, c.g, c.b));
    }
    if (t.stars) {
      const r = rng(77);
      for (let i = 0; i < 70; i++) {
        p.px(Math.floor(r() * skyW), Math.floor(r() * skyH * 0.6), r() < 0.25 ? P.white : 'rgba(255,255,255,0.55)');
      }
    }
  });

  canvasTexture(scene, `sun-${id}`, 32, 32, (p) => {
    p.disc(16, 16, 15, (_x, _y, d) => (d > 13 ? t.sunRing : t.sun));
    if (t.moon) {
      p.disc(11, 12, 3, t.sunRing);
      p.disc(20, 19, 2.2, t.sunRing);
      p.disc(18, 9, 1.5, t.sunRing);
    }
  });

  // Hill strips tile horizontally: every period divides the strip width evenly.
  const W = 240;
  const shape = t.hillShape ?? 'round';
  const wave = (x: number, periods: number, phase = 0) => Math.sin((2 * Math.PI * x * periods) / W + phase);
  /** Triangle wave in -1..1 with `periods` peaks across the strip. */
  const tri = (x: number, periods: number) => {
    const f = ((x * periods) / W) % 1;
    return 1 - 4 * Math.abs(f - 0.5);
  };
  const farHeight = (x: number) =>
    shape === 'jagged'
      ? Math.round(36 - 18 * tri(x, 5) - 6 * tri(x + 17, 11))
      : shape === 'cloud'
        ? Math.round(44 - 6 * Math.abs(wave(x, 8)) - 4 * Math.abs(wave(x, 13, 1)))
        : Math.round(38 + 14 * wave(x, 2) + 7 * wave(x, 5, 1));
  const nearHeight = (x: number) =>
    shape === 'jagged'
      ? Math.round(30 - 14 * tri(x + 9, 6) - 5 * tri(x, 15))
      : shape === 'cloud'
        ? Math.round(34 - 8 * Math.abs(wave(x, 6, 0.5)) - 4 * Math.abs(wave(x, 11)))
        : Math.round(30 + 11 * wave(x, 3, 0.5) + 5 * wave(x, 7));

  canvasTexture(scene, `hills-far-${id}`, W, 80, (p) => {
    for (let x = 0; x < W; x++) {
      const h = farHeight(x);
      p.rect(x, h, 1, 80 - h, t.hillFar);
      p.px(x, h, t.hillFarLight);
    }
  });
  canvasTexture(scene, `hills-near-${id}`, W, 70, (p) => {
    for (let x = 0; x < W; x++) {
      const h = nearHeight(x);
      p.rect(x, h, 1, 70 - h, t.hillNear);
      p.px(x, h, t.hillNearLight);
      if (shape === 'cloud') p.px(x, h + 1, t.hillNearLight);
    }
    const decor = t.decor ?? 'trees';
    for (let tx = 20; tx < W; tx += 48) {
      const base = nearHeight(tx);
      if (decor === 'trees') {
        p.rect(tx, base - 6, 2, 6, P.trunk);
        p.disc(tx + 1, base - 9, 5, t.treeDark);
        p.px(tx - 1, base - 12, t.hillNearLight);
      } else if (decor === 'spires') {
        for (let y = 0; y < 12; y++) p.rect(tx - Math.floor((12 - y) / 4), base - y, 1 + Math.floor((12 - y) / 2), 1, t.treeDark);
      } else if (decor === 'kelp') {
        for (const dx of [0, 4, 7]) {
          for (let y = 0; y < 16 - dx; y++) p.px(tx + dx + Math.round(Math.sin(y / 2.5)), base - y, t.treeDark);
        }
      }
    }
  });
}

// Clouds are shared by every theme (tinted per theme at runtime).
function clouds(scene: Phaser.Scene): void {
  canvasTexture(scene, 'cloud', 32, 12, (p) => {
    const cloudPx = (_x: number, y: number) => (y > 8 ? P.cloudShade : P.cloud);
    p.disc(9, 7, 5, cloudPx);
    p.disc(17, 5, 6, cloudPx);
    p.disc(24, 7, 5, cloudPx);
    p.rect(5, 8, 23, 4, P.cloudShade);
    p.rect(5, 8, 23, 1, P.cloud);
  });
}

/** Murkling body: a lumpy storm cloud with angry red eyes. `frame` shifts the wisps. */
function murkBody(p: Painter, frame: number): void {
  const cloud = (_x: number, y: number, d: number) => (d > 3.3 ? P.murkDark : y < 6 ? P.murkLight : P.murk);
  p.disc(5, 8, 4, cloud);
  p.disc(11, 8, 4, cloud);
  p.disc(8, 6, 4.5, cloud);
  p.rect(3, 9, 10, 3, P.murk);
  p.rect(3, 12, 10, 1, P.murkDark);
  // Wisps on top swap sides between frames.
  p.px(frame ? 5 : 10, 1, P.murkLight);
  p.px(frame ? 6 : 9, 0, P.murkLight);
  // Brows and eyes.
  p.rect(4, 6, 3, 1, P.ink);
  p.rect(9, 6, 3, 1, P.ink);
  p.rect(5, 7, 2, 2, P.murkEye);
  p.rect(9, 7, 2, 2, P.murkEye);
  p.px(5, 7, P.white);
  p.px(9, 7, P.white);
  // Frown.
  p.rect(7, 10, 2, 1, P.ink);
}

function villains(scene: Phaser.Scene): void {
  // Ground patroller (platform levels): little feet that alternate.
  for (const frame of [0, 1]) {
    canvasTexture(scene, `murk-walk-${frame}`, 16, 16, (p) => {
      murkBody(p, frame);
      p.rect(frame ? 4 : 5, 13, 2, 2, P.murkDark);
      p.rect(frame ? 10 : 9, 13, 2, 2, P.murkDark);
    });
    // Flier (shooter sections): flapping storm wings.
    canvasTexture(scene, `murk-fly-${frame}`, 20, 16, (p) => {
      p.ox = 2;
      murkBody(p, frame);
      p.ox = 0;
      const wingY = frame ? 4 : 8;
      p.rect(0, wingY, 3, 2, P.murkLight);
      p.rect(17, wingY, 3, 2, P.murkLight);
      p.px(frame ? 0 : 1, wingY + (frame ? -1 : 2), P.murkDark);
      p.px(frame ? 19 : 18, wingY + (frame ? -1 : 2), P.murkDark);
    });
  }
  // Turret Murkling: heavier, with a stubby cannon pointing left.
  canvasTexture(scene, 'murk-turret', 20, 16, (p) => {
    p.ox = 3;
    murkBody(p, 0);
    p.ox = 0;
    p.rect(0, 8, 5, 3, P.metalDark);
    p.rect(0, 8, 5, 1, P.metal);
    p.px(0, 9, P.ink);
  });
  // Tank Murkling: big, armored brow, glowing core.
  canvasTexture(scene, 'murk-tank', 24, 20, (p) => {
    const cloud = (_x: number, y: number, d: number) => (d > 5 ? P.murkDark : y < 7 ? P.murkLight : P.murk);
    p.disc(7, 11, 6, cloud);
    p.disc(17, 11, 6, cloud);
    p.disc(12, 8, 7, cloud);
    p.rect(3, 13, 18, 4, P.murk);
    p.rect(3, 17, 18, 1, P.murkDark);
    p.rect(5, 7, 14, 2, P.metalDark);
    p.rect(6, 9, 4, 3, P.murkEye);
    p.rect(14, 9, 4, 3, P.murkEye);
    p.px(6, 9, P.white);
    p.px(14, 9, P.white);
    p.rect(9, 14, 6, 1, P.ink);
  });

  // Baron Murk, the boss: a crowned thundercloud. Drawn at 3x for a chunky, imposing look.
  const drawBaron = (p: Painter, mouthOpen: boolean) => {
    const cloud = (_x: number, y: number, d: number) => (d > 8 ? P.murkDark : y < 12 ? P.murkLight : P.murk);
    p.disc(10, 20, 9, cloud);
    p.disc(30, 20, 9, cloud);
    p.disc(20, 15, 11, cloud);
    p.disc(20, 23, 9, cloud);
    p.rect(4, 22, 32, 6, P.murk);
    p.rect(4, 28, 32, 1, P.murkDark);
    // Crown.
    p.rect(12, 3, 16, 3, P.gold);
    for (const x of [12, 18, 25]) {
      p.rect(x, 0, 3, 3, P.gold);
      p.px(x + 1, 0, P.storm);
    }
    p.px(19, 4, P.murkEye);
    // Brows, eyes, mouth.
    p.rect(11, 12, 7, 2, P.ink);
    p.rect(22, 12, 7, 2, P.ink);
    p.rect(12, 14, 5, 4, P.white);
    p.rect(23, 14, 5, 4, P.white);
    p.rect(14, 15, 3, 3, P.murkEye);
    p.rect(23, 15, 3, 3, P.murkEye);
    if (mouthOpen) {
      p.rect(15, 21, 10, 4, P.ink);
      for (let x = 15; x < 25; x += 2) p.px(x, 21, P.white);
    } else {
      p.rect(15, 22, 10, 1, P.ink);
      p.px(14, 21, P.ink);
      p.px(25, 21, P.ink);
    }
    // Lightning bolts crackling at the edges.
    for (const [x, y] of [[1, 24], [2, 25], [1, 26], [38, 18], [37, 19], [38, 20]]) p.px(x, y, P.storm);
  };
  canvasTexture(scene, 'baron', 40, 30, (p) => drawBaron(p, false), 3);
  canvasTexture(scene, 'baron-roar', 40, 30, (p) => drawBaron(p, true), 3);
}

function shooterArt(scene: Phaser.Scene): void {
  // Player shot: a glowing sun seed streak.
  canvasTexture(scene, 'shot', 7, 3, (p) => {
    p.rect(0, 1, 3, 1, 'rgba(255, 246, 166, 0.5)');
    p.rect(3, 0, 3, 3, P.seed);
    p.px(6, 1, P.seedLight);
    p.px(4, 1, P.white);
  });
  // Villain shot: a purple storm orb.
  canvasTexture(scene, 'orb', 5, 5, (p) => {
    p.disc(2.5, 2.5, 2.5, (_x, _y, d) => (d > 1.6 ? P.orb : P.orbLight));
  });
  canvasTexture(scene, 'heart', 7, 6, (p) => {
    p.rect(1, 0, 2, 1, P.heart);
    p.rect(4, 0, 2, 1, P.heart);
    p.rect(0, 1, 7, 2, P.heart);
    p.rect(1, 3, 5, 1, P.heart);
    p.rect(2, 4, 3, 1, P.heart);
    p.px(3, 5, P.heart);
    p.px(1, 1, P.heartLight);
  });
  // Little jet flame behind the flying ball.
  canvasTexture(scene, 'flame', 3, 3, (p) => {
    p.px(1, 0, P.gold);
    p.rect(0, 1, 3, 1, P.ballBase);
    p.px(1, 2, P.gold);
  });
}

type BossExtra = 'horns' | 'rocks' | 'swirl' | 'tiara' | 'bolt' | 'hat' | 'flames' | 'zap' | 'halo' | 'crown';

interface BossLook {
  body: string;
  light: string;
  dark: string;
  eye: string;
  extra: BossExtra;
  mouth: 'frown' | 'grin' | 'fangs';
}

/** Every boss shares one storm-cloud body; color, headgear and mouth make each one distinct. */
const BOSS_LOOKS: Record<string, BossLook> = {
  grumble: { body: '#5a3f8a', light: '#7c5fb0', dark: '#33225a', eye: '#ff4d5e', extra: 'horns', mouth: 'frown' },
  crag: { body: '#6e5a48', light: '#94806a', dark: '#40332a', eye: '#ffb347', extra: 'rocks', mouth: 'fangs' },
  gustav: { body: '#5f8fbf', light: '#9cc4ea', dark: '#355a80', eye: '#ffffff', extra: 'swirl', mouth: 'grin' },
  ripple: { body: '#2f8f9a', light: '#5cc6c8', dark: '#1b5560', eye: '#ff7ad9', extra: 'tiara', mouth: 'grin' },
  nimbus: { body: '#a8b0c8', light: '#e2e6f2', dark: '#6a7290', eye: '#ffe066', extra: 'bolt', mouth: 'frown' },
  ink: { body: '#283a6a', light: '#43599a', dark: '#141e3c', eye: '#9fe8ff', extra: 'hat', mouth: 'grin' },
  magmaw: { body: '#a8301a', light: '#e05a28', dark: '#5a1408', eye: '#ffd04a', extra: 'flames', mouth: 'fangs' },
  volt: { body: '#4a3a8a', light: '#7a68c8', dark: '#271c52', eye: '#fff36a', extra: 'zap', mouth: 'fangs' },
  eclipse: { body: '#1c1630', light: '#3a2f5c', dark: '#0a0814', eye: '#c86bff', extra: 'halo', mouth: 'frown' },
  baron: { body: P.murk, light: P.murkLight, dark: P.murkDark, eye: P.murkEye, extra: 'crown', mouth: 'frown' },
};

function drawBoss(p: Painter, look: BossLook, roar: boolean): void {
  // Halo sits behind the body.
  if (look.extra === 'halo') p.disc(20, 16, 15, (_x, _y, d) => (d > 13.5 ? '#f4f1d0' : d > 12.5 ? 'rgba(244, 241, 208, 0.35)' : null));
  const cloud = (_x: number, y: number, d: number) => (d > 8 ? look.dark : y < 12 ? look.light : look.body);
  p.disc(10, 20, 9, cloud);
  p.disc(30, 20, 9, cloud);
  p.disc(20, 15, 11, cloud);
  p.disc(20, 23, 9, cloud);
  p.rect(4, 22, 32, 6, look.body);
  p.rect(4, 28, 32, 1, look.dark);

  switch (look.extra) {
    case 'horns':
      for (const [x, dir] of [[12, -1], [27, 1]] as const) {
        p.rect(x, 4, 2, 3, look.dark);
        p.rect(x + dir, 2, 2, 2, look.dark);
        p.px(x + dir * 2, 1, P.white);
      }
      break;
    case 'rocks':
      for (const [x, y] of [[13, 4], [19, 3], [25, 4]]) {
        p.rect(x, y, 4, 3, P.stoneDark);
        p.rect(x, y, 4, 1, P.stone);
      }
      for (const [x, y] of [[8, 23], [9, 24], [31, 19], [30, 20], [32, 21]]) p.px(x, y, look.dark);
      break;
    case 'swirl':
      for (const [x, y] of [[6, 18], [7, 17], [8, 17], [9, 18], [31, 18], [32, 17], [33, 17], [34, 18]]) p.px(x, y, P.white);
      p.rect(14, 3, 3, 1, look.light);
      p.rect(22, 2, 4, 1, look.light);
      break;
    case 'tiara':
      for (let x = 13; x <= 27; x += 2) p.px(x, 4 + ((x / 2) % 2), '#7be3ff');
      p.rect(13, 5, 15, 1, '#d4f8ff');
      p.px(11, 13, P.ink);
      p.px(28, 13, P.ink);
      break;
    case 'bolt':
      for (const [x, y] of [[21, 0], [20, 1], [19, 2], [20, 2], [21, 2], [20, 3], [19, 4]]) p.px(x, y, P.storm);
      break;
    case 'hat':
      p.rect(10, 4, 20, 3, P.ink);
      p.rect(14, 1, 12, 3, P.ink);
      p.px(20, 2, P.white);
      for (const x of [6, 12, 18, 24, 30]) p.rect(x, 28, 2, 2, look.dark);
      break;
    case 'flames':
      for (const [x, h] of [[13, 4], [17, 6], [21, 5], [25, 4]] as const) {
        p.rect(x, 6 - h, 2, h, P.lava);
        p.px(x, 6 - h, P.lavaLight);
      }
      break;
    case 'zap':
      for (const [x, y] of [[1, 14], [2, 15], [1, 16], [38, 22], [37, 23], [38, 24], [8, 5], [9, 6], [30, 6], [31, 5]]) p.px(x, y, P.storm);
      break;
    case 'crown':
      p.rect(12, 3, 16, 3, P.gold);
      for (const x of [12, 18, 25]) {
        p.rect(x, 0, 3, 3, P.gold);
        p.px(x + 1, 0, P.storm);
      }
      p.px(19, 4, P.murkEye);
      break;
    case 'halo':
      break;
  }

  // Brows, eyes.
  p.rect(11, 12, 7, 2, P.ink);
  p.rect(22, 12, 7, 2, P.ink);
  p.rect(12, 14, 5, 4, P.white);
  p.rect(23, 14, 5, 4, P.white);
  p.rect(14, 15, 3, 3, look.eye);
  p.rect(23, 15, 3, 3, look.eye);

  if (roar || look.mouth === 'fangs') {
    p.rect(15, 21, 10, roar ? 4 : 3, P.ink);
    for (let x = 15; x < 25; x += 3) p.px(x, 21, P.white);
    if (look.mouth === 'fangs') {
      p.px(16, 22, P.white);
      p.px(23, 22, P.white);
    }
  } else if (look.mouth === 'grin') {
    p.rect(14, 21, 12, 2, P.ink);
    for (let x = 15; x < 25; x += 2) p.px(x, 21, P.white);
  } else {
    p.rect(15, 22, 10, 1, P.ink);
    p.px(14, 21, P.ink);
    p.px(25, 21, P.ink);
  }
}

function bossArt(scene: Phaser.Scene): void {
  for (const [id, look] of Object.entries(BOSS_LOOKS)) {
    const scale = id === 'baron' ? 4 : 3;
    canvasTexture(scene, `boss-${id}`, 40, 30, (p) => drawBoss(p, look, false), scale);
    canvasTexture(scene, `boss-${id}-roar`, 40, 30, (p) => drawBoss(p, look, true), scale);
  }
}

function skyHazardArt(scene: Phaser.Scene): void {
  // Zigzag Murkling: jagged, with a crackling tail.
  for (const frame of [0, 1]) {
    canvasTexture(scene, `murk-zig-${frame}`, 20, 16, (p) => {
      p.ox = 2;
      murkBody(p, frame);
      p.ox = 0;
      for (const [x, y] of frame ? [[17, 6], [18, 7], [19, 6]] : [[17, 9], [18, 8], [19, 9]]) p.px(x, y, P.storm);
      p.px(2, 2, P.murkLight);
      p.px(1, 1, P.murkLight);
    });
  }
  // Bomber: chunky with a bomb bay.
  canvasTexture(scene, 'murk-bomber', 24, 18, (p) => {
    p.ox = 4;
    murkBody(p, 0);
    p.ox = 0;
    p.rect(9, 14, 6, 3, P.metalDark);
    p.rect(10, 17, 4, 1, P.ink);
    p.rect(0, 7, 4, 2, P.murkLight);
    p.rect(20, 7, 4, 2, P.murkLight);
  });
  // Sniper: one big scope eye.
  canvasTexture(scene, 'murk-sniper', 22, 16, (p) => {
    p.ox = 3;
    murkBody(p, 1);
    p.ox = 0;
    p.rect(0, 7, 6, 2, P.metalDark);
    p.disc(8.5, 8, 2.5, P.metal);
    p.disc(8.5, 8, 1.4, '#ff3040');
  });
  canvasTexture(scene, 'sky-rock', 24, 24, (p) => {
    p.disc(12, 12, 11, (x, y, d) => (d > 9.6 ? P.stoneDark : (x + y) % 7 === 0 ? P.stoneDark : y < 9 ? P.stoneLight : P.stone));
    p.disc(8, 9, 2, P.stoneDark);
    p.disc(15, 15, 2.5, P.stoneDark);
  });
  canvasTexture(scene, 'thundercloud', 30, 18, (p) => {
    const px = (_x: number, y: number, d: number) => (d > 5 ? '#2d3352' : y < 8 ? '#5a6280' : '#434a70');
    p.disc(8, 11, 6, px);
    p.disc(21, 11, 6, px);
    p.disc(15, 7, 7, px);
    p.rect(4, 12, 22, 4, '#434a70');
    p.rect(9, 9, 3, 1, P.ink);
    p.rect(18, 9, 3, 1, P.ink);
    p.px(10, 10, P.storm);
    p.px(19, 10, P.storm);
  });
  canvasTexture(scene, 'bomb', 6, 7, (p) => {
    p.disc(3, 4, 3, (_x, _y, d) => (d > 2 ? P.ink : '#3a3f5c'));
    p.px(3, 0, P.lavaLight);
    p.px(3, 1, P.metalDark);
  });
  canvasTexture(scene, 'snipe', 7, 3, (p) => {
    p.rect(0, 1, 7, 1, '#ff3040');
    p.rect(2, 0, 3, 3, '#ff8090');
  });
  canvasTexture(scene, 'orb-homing', 6, 6, (p) => {
    p.disc(3, 3, 3, (_x, _y, d) => (d > 2 ? '#ff6ad5' : '#ffd0f2'));
  });
  canvasTexture(scene, 'rock-chunk', 6, 6, (p) => {
    p.disc(3, 3, 3, (_x, y) => (y < 3 ? P.stoneLight : P.stoneDark));
  });

  // Power-ups: Spread, Rapid, Shield.
  const badge = (key: string, fill: string, draw: (p: Painter) => void) =>
    canvasTexture(scene, key, 11, 11, (p) => {
      p.disc(5.5, 5.5, 5.5, (_x, _y, d) => (d > 4.6 ? P.white : fill));
      draw(p);
    });
  badge('pow-spread', '#37c3a1', (p) => {
    p.rect(3, 5, 5, 1, P.white);
    p.px(7, 3, P.white);
    p.px(7, 7, P.white);
    p.px(6, 4, P.white);
    p.px(6, 6, P.white);
  });
  badge('pow-rapid', '#e8486a', (p) => {
    p.rect(3, 3, 2, 5, P.white);
    p.rect(6, 3, 2, 5, P.white);
  });
  badge('pow-shield', '#3a8fd6', (p) => {
    p.rect(3, 3, 5, 3, P.white);
    p.rect(4, 6, 3, 1, P.white);
    p.px(5, 7, P.white);
  });
  canvasTexture(scene, 'shield-bubble', 20, 20, (p) => {
    p.disc(10, 10, 10, (_x, _y, d) => (d > 8.8 ? 'rgba(123, 227, 255, 0.85)' : d > 7.5 ? 'rgba(123, 227, 255, 0.25)' : null));
    p.px(6, 5, P.white);
  });
}
