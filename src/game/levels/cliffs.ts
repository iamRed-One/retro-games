import { assemble } from './assemble';
import { CHUNKS } from './chunks';
import type { LevelDef } from './types';

/* Level 2. New idea: crumbling blocks (X) that fall ~0.45s after you land on them. */
const E40 = '........................................';
const E44 = '............................................';
const G40 = '########################################';

/** 1: roll across a crumbling bridge without stopping. */
const bridge = [
  E40, E40, E40, E40, E40, E40, E40, E40, E40, E40, E40, E40, E40, E40, E40,
  '............o.o.o.o.o.o.o.o.............',
  '..S...?...........................M.....',
  '##########XXXXXXXXXXXXXXXXXXXX##########',
  '##########....................##########',
  '##########....................##########',
];

/** 2: hop up crumbling steps to a high ledge before they give way. */
const steps = [
  E40, E40, E40, E40, E40, E40, E40, E40, E40,
  '...................oooooo...............',
  '..................########..............',
  '..............XX..########..............',
  '..................########..............',
  '..........XX......########..............',
  '..................########....oo........',
  '......XX..........########..............',
  '.C....?...........########....^^...M....',
  G40, G40, G40,
];

/** 3: crumbling islands and a drifting platform over a wide pit. */
const islands = [
  E44, E44, E44, E44, E44, E44, E44, E44, E44, E44, E44, E44,
  '...........................oo...............',
  '......oo....oo....ooo............oo.........',
  '...........................XX...............',
  '......XX....XX....H..............XX.........',
  '.........................................C..',
  '####....................................####',
  '####....................................####',
  '####....................................####',
];

/** 4: a long crumbling bridge over spikes, then the exit. */
const finale = [
  E40, E40, E40, E40, E40, E40, E40, E40, E40, E40, E40, E40,
  '......o.o.o.o.o.o.o.o.o.o...............',
  '......XXXXXXXXXXXXXXXXXXXX####..........',
  '..........................####..........',
  '...###....................####..........',
  '...###^^^^^^^^^^^^^^^^^^^^####..M...E...',
  G40, G40, G40,
];

export const cliffsLevel: LevelDef = {
  id: 'cliffs',
  name: 'Sunset Cliffs',
  theme: 'sunset',
  track: 'sunset',
  map: assemble([bridge, steps, CHUNKS.c_stairs, CHUNKS.x_vault, CHUNKS.b_pitjumps, islands, CHUNKS.c_overspikes, CHUNKS.b_murks, CHUNKS.c_bridge, finale]),
  prompts: ['Cracked planks crumble. Keep rolling!', 'Hop up the crumbling steps before they fall'],
};
