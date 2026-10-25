# Assets

Original or properly licensed assets only (concept brief §9 and §17).

| Folder         | What goes here                                       |
| -------------- | ---------------------------------------------------- |
| `sprites/`     | Hero, collectibles, hazards, props, animation frames |
| `tiles/`       | Terrain tile sheets (16px art, displayed at 32px)    |
| `backgrounds/` | Sky, parallax hills, clouds                          |
| `audio/sfx/`   | Bounce, collect, checkpoint, fail, complete, UI      |
| `audio/music/` | Chiptune loops                                       |

For now every texture is generated in code (`src/game/art/textures.ts`) and every sound is
synthesized (`src/game/systems/audio.ts`, `music.ts`), so the game runs with zero binary assets.

To swap in real art, load an image in a Phaser `preload()` under the same texture key the
generator uses (for example `ball`, `tiles`, `seed`, `spikes`, `exit`) and skip generating that key.
