import { assemble } from './assemble';
import { CHUNKS } from './chunks';
import type { LevelDef } from './types';

/*
 * Level 4. New idea: water. The ball floats at the surface, Bounce hops out, and holding Dive
 * sinks you to collect sunken seeds (*). Lake-bed spikes (!) punish careless dives.
 */
const E40 = '........................................';
const E44 = '............................................';
const G40 = '########################################';
const G44 = '############################################';

/** 1: a first pond: float across, dive for seeds, hop out onto the bank. */
const pond = [
  E40, E40, E40, E40, E40, E40, E40, E40, E40, E40, E40, E40,
  '...............o.o.o.o..................',
  '..S...?.....?...................M.......',
  '##########~~~~~~~~~~~~~~~~##############',
  '##########~~~~~~~~~~~~~~~~##############',
  '##########~~~~******~~~~~~##############',
  G40, G40, G40,
];

/** 2: a wide, deep lake with spikes on the bed and a drifting log. */
const lake = [
  E40, E40, E40, E40, E40, E40, E40, E40, E40, E40, E40,
  '..........ooo...........................',
  E40,
  '.C........H....................?........',
  '####~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~####',
  '####~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~####',
  '####~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~####',
  '####~~~~~**~~~~~~**~~~~~~~**~~~~~~~~####',
  '####~~~!!!~~~~!!!!~~~~!!!~~~~!!!~~~~####',
  G40,
];

/** 3: a crumbling bridge over a pool; if it drops you, swim to the fan that lifts you up. */
const pool = [
  E44, E44, E44, E44, E44, E44, E44, E44, E44,
  '...............................ooooooooo.C..',
  '..............................##############',
  '..............................##############',
  '..............................##############',
  '......o.o.o.o.o.o.o.o.o.o....W##############',
  '######XXXXXXXXXXXXXXXXXXXXXX################',
  '######~~~~~~~~~~~~~~~~~~~~~~################',
  '######~~~~~~~~~~~~~~~~~~~~~~################',
  '######~~~~~~~~~*****~~~~~~~~################',
  '######~~~~~~~~~~~~~~~~~~~~~~################',
  G44,
];

/** 4: drop into the moonlit lake, hop along lily pads, and climb out to the exit. */
const finale = [
  E40, E40, E40, E40, E40, E40, E40, E40, E40, E40,
  '######..................................',
  '######......ooo.....ooo.................',
  '######..................................',
  '######......---.....---..........M...E..',
  '######~~~~~~~~~~~~~~~~~~~~~~~~##########',
  '######~~~~~~~~~~~~~~~~~~~~~~~~##########',
  '######~~~~~~~~**~~~~~~~**~~~~~##########',
  '######~~~~~~~~~~~~~~~~~~~~~~~~##########',
  '######~~~!!!~~~~~~!!!~~~~~~~~~##########',
  G40,
];

export const lakeLevel: LevelDef = {
  id: 'lake',
  name: 'Moonlit Lake',
  theme: 'night',
  track: 'night',
  map: assemble([pond, lake, CHUNKS.a_current, CHUNKS.b_murks, CHUNKS.a_logs, CHUNKS.x_vault, pool, CHUNKS.a_pond, finale]),
  prompts: [
    'You float in water. {bounce} to hop out',
    'Hold {special} to dive for sunken seeds',
    'Careful: spikes lurk on the lake bed',
  ],
};
