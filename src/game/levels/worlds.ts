import { assemble, withPrompt } from './assemble';
import { CHUNKS as K } from './chunks';
import type { LevelDef } from './types';

/* Levels 5-10: new worlds built from the chunk library, each harder than the last. */

export const skyLevel: LevelDef = {
  id: 'sky',
  name: 'Cloud Kingdom',
  theme: 'skyland',
  track: 'skyland',
  map: assemble(
    [withPrompt(K.s_hops, 2), withPrompt(K.s_puffs, 2), K.s_fans, K.s_movers, K.x_vault_sky, K.s_crumble, K.s_puffs2, K.s_lift, K.s_gauntlet],
    { ground: 'K' },
  ),
  prompts: ['Fluffy clouds over a long drop. Watch your step!', 'Bounce on the puffy clouds to soar'],
};

export const oceanLevel: LevelDef = {
  id: 'ocean',
  name: 'Coral Deep',
  theme: 'ocean',
  track: 'ocean',
  buoyancy: 0.72,
  map: assemble([withPrompt(K.o_reef, 2), K.o_kelp, K.o_current, K.o_jellies, K.x_vault_ocean, K.o_cave, K.o_split, K.o_kelp, K.o_reef], { waterFrom: 3 }),
  prompts: ['Underwater! Tap {bounce} to swim up, hold {special} to sink. Avoid the jellyfish'],
};

export const magmaLevel: LevelDef = {
  id: 'magma',
  name: 'Magma Caverns',
  theme: 'lava',
  track: 'lava',
  map: assemble([
    withPrompt(K.l_hops, 2),
    withPrompt(K.l_geysers, 3),
    K.l_bridge,
    K.l_fans,
    K.x_vault,
    K.l_ventjumps,
    K.l_mix,
    K.b_murks,
    K.l_hops,
    K.c_overspikes,
  ]),
  prompts: ['Lava! One touch and you pop', 'Fire geysers erupt in a rhythm. Time your run'],
};

export const stormLevel: LevelDef = {
  id: 'storm',
  name: 'Thunder Spires',
  theme: 'storm',
  track: 'storm',
  map: assemble([K.w_spikefans, K.c_islands, K.b_movers, K.f_gauntlet, K.x_vault, K.w_stack, K.c_overspikes, K.b_super, K.f_pillars, K.b_murks]),
};

export const starfallLevel: LevelDef = {
  id: 'starfall',
  name: 'Starfall Heights',
  theme: 'starsky',
  track: 'starsky',
  map: assemble([K.s_gauntlet, K.s_puffs2, K.s_crumble, K.s_fans, K.x_vault_sky, K.s_movers, K.s_lift, K.s_puffs, K.s_hops, K.s_gauntlet], {
    ground: 'K',
  }),
};

export const fortressLevel: LevelDef = {
  id: 'fortress',
  name: 'Murk Fortress',
  theme: 'fortress',
  track: 'fortress',
  map: assemble(
    [K.f_gauntlet, K.l_geysers, K.c_overspikes, K.w_stack, K.x_vault, K.a_current, K.b_super, K.l_bridge, K.f_tower, K.w_pillars, K.f_pillars, K.l_ventjumps],
    { checkpointEvery: 2 },
  ),
};
