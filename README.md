# Retro Arcade Revival

A free, instant-play browser arcade. The first game is **Bopple** (working title), an original
pixel-art bouncing-ball platformer for keyboard, touch, and PS4/PS5/standard gamepads.

## The arcade

The site opens on the **Retro Arcade Revival** home menu: a card for every game (Bopple is
playable; Slither Byte, Star Drift, Block Rush, Turbo Lane and Pop Pairs are "coming soon"),
an animated synthwave backdrop, arcade music, and animated GitHub / LinkedIn links at the top
left that open in a new tab. Add a game in `src/arcade/games.ts`; change the links in
`src/arcade/profile.ts`. Cover pictures live in `public/assets/covers/`.

## Bopple levels

| # | Level | New idea | Boss |
| - | ----- | -------- | ---- |
| 1 | Meadow Run | Rolling, bouncing, springs, platforms, Murklings | Grumble |
| 2 | Sunset Cliffs | Crumbling blocks | Crag |
| 3 | Breezy Peaks | Updraft fans | Gustav |
| 4 | Moonlit Lake | Water: float, dive, currents | Lady Ripple |
| 5 | Cloud Kingdom | Cloud platforms, bouncy puffs, bottomless drops | Nimbus |
| 6 | Coral Deep | Underwater: swim strokes, jellyfish, currents | Captain Ink |
| 7 | Magma Caverns | Lava pools and fire geysers | Magmaw |
| 8 | Thunder Spires | Storm world mixing everything so far | Volt |
| 9 | Starfall Heights | Night clouds, harder remix | Eclipse |
| 10 | Murk Fortress | Every mechanic, hardest | **Baron Murk** (4-phase super boss) |

Each level is 340-490 tiles long with 3-5 checkpoints, then a sky battle (waves that get
harder each level, then the boss). Levels unlock in order; in dev builds add `?unlockall` to
open them all. Title → **Levels** shows best times and seeds.

### Sky battles

Fly in any direction and hold Bounce to shoot. Villains: fliers, divers, zigzaggers, turrets,
armored tanks, bombers that drop bombs, and snipers. Scenery hazards: rocks that soak up
shots and thunderclouds that call down lightning (red warning line first). Power-ups: **Spread**
shot, **Rapid** fire, **Shield** (absorbs one hit). Bosses use aimed bursts, fans, rings,
spirals, falling debris, wavy and homing shots, lightning and charges, and change phase as
they lose health. Running out of hearts restarts the waves, or the boss fight once it began.

## Music

Music and Effects have separate on/off and volume. Turn game music off to play your own
(Spotify, YouTube Music, ...) alongside, with gameplay sounds still on. Game music plays through a
real media element, so the browser's media controls (Chrome's media button, the Windows media
overlay, phone lock screens) show the track name with working play/pause. A "Now playing" chip
appears in-game when a level's track starts.

## Extras, rewards and story

- **Extras menu** (title screen): Time Attack, Boss Rush, Co-op, Skin Shop, Achievements,
  Hall of Fame and Story replay.
- **Time Attack** skips the sky battle and races a translucent ghost of your best run on that
  level. Your best ghost is saved per level.
- **Boss Rush** chains every boss you have already beaten, with one heart back between bosses.
  It opens after you beat 2 bosses.
- **Co-op** is a two-player sky battle. P1 uses WASD + Space (or the first pad), P2 uses arrows +
  Enter (or the second pad). A downed player comes back after 4 seconds while the partner lives.
- **Seeds** from every run go into a bank. Spend them on 10 ball skins in the Skin Shop.
- **17 achievements**, such as beating a boss without getting hit, finding every secret, and
  clearing Boss Rush.
- **Hall of Fame**: top-5 times per level, mode and Boss Rush, with arcade 3-letter initials.
  Saved in this browser (`rar.bopple.save.v1`). The data is shaped so an online leaderboard can
  sync it later.
- **Secret rooms**: every level hides a vault behind a fake wall (`F` tile, `f` underwater) with
  bonus seeds. Levels with a found secret show a star in level select.
- **Story scenes** play before each world the first time, plus an ending after Baron Murk.
  Skip with the Skip button or Esc.
- **Rumble**: controllers that support vibration shake on hits, explosions, boss roars and hard
  landings. Turn it off in Controls.

## Install as an app

The arcade is a Progressive Web App and works offline after the first visit.

- Chrome / Edge on desktop: click the install icon in the address bar, or the **Install app**
  button on the hub. It opens in its own window. To pin it, right-click its taskbar icon and
  choose **Pin to taskbar** (or Start → right-click → Pin).
- Android Chrome: menu → **Install app** / **Add to Home screen**.
- iPhone Safari: Share → **Add to Home Screen**.

Updates install themselves the next time the app is opened online.

Built from `Retro_Arcade_Revival_Project_Concept.docx` with React, TypeScript, Vite, and Phaser 3.

## Play it

Live at **https://iamred-one.github.io/retro-games/** (GitHub Pages, served from the
`gh-pages` branch). To publish a new version:

```bash
npm run deploy     # builds, then pushes dist/ to gh-pages (tools/deploy.mjs)
```

Pushing to `main` only updates the source; run `npm run deploy` to update the live site.
Players with the installed app get the update the next time they open it online.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

Dev-only extras:

- `?autostart` skips the title screen (combine with `&level=cliffs`, `peaks`, `lake`).
- `window.__bopple` is the Phaser game, for console debugging and automated playtests.
- `?level=test` opens the grey-box tuning area (also works in production).
- Press **`** (backquote) in-game for the live movement tuning panel.

## Controls

| Action             | Keyboard      | Gamepad            | Touch             |
| ------------------ | ------------- | ------------------ | ----------------- |
| Move               | ← → / A D     | Left stick / D-pad | ◀ ▶ buttons       |
| Bounce             | Space / ↑ / W | ✕ / A              | Bounce button     |
| Super bounce       | Tap bounce just before landing | same | same      |
| Fly (sky battles)  | Arrows / WASD | Stick / D-pad      | 4-way arrows      |
| Shoot (hold)       | Space / Z / J | X, R1 or R2        | Fire button       |
| Dive (in water)    | ↓ / S / Shift | ○ / B              | Dive button       |
| Fullscreen         | F             | (menu button)      | ⤢ button          |
| Pause              | Esc / P       | Options / Menu     | II button         |
| Back to checkpoint | R             | Share / View       | Pause menu        |

Menus work with arrows, the D-pad or stick, and the Bounce button to select or ○/B to go back.

**Plug-and-play pads** (non-standard mapping, like the common "USB Joystick" 0079:0006) use X
for Bounce by default and their hat-switch D-pad works. If the buttons are still wrong, use
**Controls → Set up controller** and press the buttons you want for Bounce and Dive. The choice
is saved per controller model, in this browser only.

## Project structure

```
public/assets/          Real art and audio go here (currently generated in code; see its README)
src/main.tsx            Entry point
src/arcade/             Arcade home menu, game registry, creator links, menu music
src/app/                React shell for Bopple
  App.tsx                 Screen switching, global pause, auto-pause on blur/hidden/portrait
  GameCanvas.tsx          Creates the Phaser game on mount, destroys it on unmount
  screens/                Title, Pause, Level-complete
  components/             HUD, touch controls, sound controls, controls help, rotate hint
  dev/TuningPanel.tsx     Live physics tuning (dev builds only)
src/game/
  bridge.ts               The only React <-> Phaser link: uiStore (state) + gameCommands
  createGame.ts           Phaser config and the command handlers (start/pause/restart/quit)
  config.ts               Names, canvas size (960x540), tile size
  scenes/                 Boot (generate art), Title (animated backdrop), Game (gameplay)
  entities/               Player ball, collectibles/spikes/springs/checkpoints/exit, moving platforms
  input/                  Shared action contract + keyboard, touch, gamepad adapters + InputManager
  physics/tuning.ts       Every movement number in one place
  levels/                 Tile format, parser, chunk library, assembler, checker, 10 levels
  shooter/                Wave generator, villains and hazards, boss definitions and engine
  systems/                Audio synth, music sequencer, camera, parallax, effects, checkpoints,
                          settings and local best-time storage
  art/                    Palette, procedural pixel art, the hero's display (roll/squash/face)
```

## How the pieces fit

- **One input model.** Every device writes the same `InputSnapshot` (move axis plus bounce,
  special, pause and restart buttons). `InputManager` merges them and fires each press once,
  so a held button never repeats. Gameplay never checks which device is in use. Held state
  is cleared on blur or a hidden tab, and a controller ignores buttons it was already holding
  until they are released.
- **Movement feel.** Acceleration and deceleration, coyote time, bounce buffering, variable
  bounce height, super bounce timing, a small passive hop on hard landings, and squash and
  stretch. All of it is tuned through `physics/tuning.ts`.
- **Levels are text, built from a chunk library.** Each character is a 32px tile (full
  legend in `levels/types.ts`). `levels/chunks.ts` holds ~40 reusable pieces, generated by
  `python tools/gen_chunks.py src/game/levels/chunks.ts` (edit pieces there by coordinates);
  `levels/assemble.ts` stitches pieces into a level, adding the start, goal, stairs between
  pieces of different heights, and checkpoints. `levels/lint.ts` is a reachability checker
  that proves every level can be finished with normal bounces; run it from the dev console
  with `(await import('/src/game/levels/lint.ts')).lintAll()`.
- **Fills any screen.** The canvas height is fixed (540) and its width follows the window's
  shape, from 4:3 up to about 2.7:1. Wide screens see more of the level, there are no black
  bars, and the pixel art stays crisp.
- **Sound.** Every effect and the music loop are synthesized with Web Audio, so all audio is
  original. Audio only starts after a click or key press. Mute and volume settings persist
  locally.

## Status against the brief

Done: phases 1–7 in a first pass. That covers the shell, movement, unified input, controller
handling (deadzone, edges, connect and disconnect), touch, one complete level, and the
presentation (art, sound, HUD, pause, failure and completion screens).

Still to do:

- Phase 8 QA on real devices: PS4/PS5 over USB and Bluetooth, Android, iPhone.
- Replacing the generated placeholder art with final pixel art.
- Confirming the product and game names.
- Deploying to HTTPS hosting.
