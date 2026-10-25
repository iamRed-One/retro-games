import { assemble } from './assemble';
import { CHUNKS } from './chunks';
import type { LevelDef } from './types';

/*
 * Original first level. Reach targets (from TUNING): a normal bounce clears ~3 tiles up and
 * ~7 tiles across, a super bounce ~5.5 tiles up, a spring ~8 tiles up.
 */
const E40 = '........................................';
const E44 = '............................................';
const E48 = '................................................';
const G40 = '########################################';

/** 1: learn to roll, bounce, hold for height, cross a gap. */
const warmup = [
  E40, E40, E40, E40, E40, E40, E40, E40, E40, E40, E40, E40, E40,
  '.................oo..........ooooo......',
  '.............................-----......',
  '.....?........?.####.?..................',
  '...S....o.o.o...####..........M.........',
  '########################...#############',
  '########################...#############',
  '########################...#############',
];

/** 2: spikes, a spring up to a high ledge, and an optional super-bounce shortcut. */
const springs = [
  E40, E40, E40, E40, E40, E40, E40, E40, E40,
  '.........................oooooo.........',
  '.........................#######........',
  '.........................#######........',
  E40,
  '..........ooo.......................####',
  '................................---.####',
  '......?..........?...............?..####',
  '..C.......^^^..M....T....^^^........####',
  G40, G40, G40,
];

/** 3: a wide pit crossed on drifting platforms. */
const drift = [
  E48, E48, E48, E48, E48, E48, E48, E48, E48, E48, E48, E48, E48,
  '..........ooo......ooo......ooo.................',
  E48,
  '...?.....H........---....H......................',
  '....................................C...o.o.o.M.',
  '########........................################',
  '########........................################',
  '########........................################',
];

/** 4: ride the lift, cross the spiked walkway, spring for bonus seeds, reach the exit. */
const climb = [
  E44, E44, E44, E44, E44, E44, E44, E44,
  '............ooooo.^^.ooo....................',
  '..........###############...ooo.............',
  '..........####..............................',
  '..........####..............................',
  '..........####..............................',
  '..........####..............................',
  '..........####..............................',
  '....I.....####..............................',
  'C.?.......####..ooo...M.......T.........E...',
  '############################################',
  '############################################',
  '############################################',
];

export const meadowLevel: LevelDef = {
  id: 'meadow',
  name: 'Meadow Run',
  map: assemble([warmup, springs, CHUNKS.b_steps, CHUNKS.b_murks, CHUNKS.x_vault, drift, CHUNKS.b_spikes, CHUNKS.b_lift, climb, CHUNKS.b_springs]),
  prompts: [
    '{move} to roll',
    '{bounce} to bounce',
    'Hold {bounce} to bounce higher. Mind the gap!',
    'Spikes pop you. Bounce over them!',
    'Springs launch you sky-high',
    'Tap {bounce} just before you land for a SUPER bounce',
    'Ride the drifting platforms',
    'Hop on the lift to climb the wall',
  ],
};
