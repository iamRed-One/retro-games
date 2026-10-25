/** One small palette for everything in the meadow world (concept brief §9). */
export const PALETTE = {
  ink: '#10142a',
  white: '#ffffff',

  skyTop: '#4fa4e8',
  skyBottom: '#bdeefa',
  sun: '#fff3a8',
  sunRing: '#ffe066',
  cloud: '#ffffff',
  cloudShade: '#d6eefa',

  hillFar: '#8fd3b0',
  hillFarLight: '#a9e3c3',
  hillNear: '#4fa36b',
  hillNearLight: '#62b97c',
  treeDark: '#2f7d55',
  trunk: '#6b4a32',

  grassLight: '#9be35a',
  grass: '#6abe30',
  grassDark: '#37946e',
  dirt: '#8f563b',
  dirtLight: '#a8714f',
  dirtDark: '#663931',
  dirtEdge: '#4a2d22',
  stone: '#9badb7',
  stoneLight: '#c4d2da',
  stoneDark: '#696a6a',
  plank: '#c28a4c',
  plankLight: '#e0a868',
  plankDark: '#7a4a28',

  ballBase: '#ff8a3d',
  ballLight: '#ffb070',
  ballDark: '#d9541e',
  ballOutline: '#7a2e12',

  seed: '#fbd536',
  seedLight: '#fff6a6',
  seedDark: '#c98a0c',

  metal: '#cbdbfc',
  metalDark: '#847e87',
  metalBase: '#595652',
  springPad: '#e8486a',
  springPadDark: '#a52a49',

  flagOff: '#847e87',
  flagOn: '#37c3a1',
  flagOnLight: '#7ff0cf',
  gold: '#ffd23f',

  portal: '#7be3ff',
  portalLight: '#d4f8ff',
  portalDark: '#3a8fd6',

  flowerPink: '#ff8fb8',
  flowerWhite: '#fff4f8',
  dust: '#f1dfb8',

  // Villains: Murklings and Baron Murk, storm clouds that steal sunlight.
  murk: '#4a3470',
  murkLight: '#6e56a0',
  murkDark: '#2a1c45',
  murkEye: '#ff4d5e',
  orb: '#c86bff',
  orbLight: '#f0c8ff',
  heart: '#ff4d6d',
  heartLight: '#ffb3c1',
  storm: '#ffe066',

  lava: '#ff6a1a',
  lavaLight: '#ffd04a',
  lavaDark: '#b8300c',
  cloudBlock: '#ffffff',
  cloudBlockShade: '#c8dcf4',
  jelly: '#ff7ad9',
  jellyLight: '#ffd0f2',
};

export type ThemeId = 'day' | 'sunset' | 'peaks' | 'night' | 'skyland' | 'ocean' | 'lava' | 'storm' | 'starsky' | 'fortress';

export interface Theme {
  skyTop: string;
  skyBottom: string;
  sun: string;
  sunRing: string;
  /** Draw a moon with craters instead of a sun. */
  moon?: boolean;
  /** Scatter stars in the sky. */
  stars?: boolean;
  cloudTint: number;
  hillFar: string;
  hillFarLight: string;
  hillNear: string;
  hillNearLight: string;
  treeDark: string;
  /** Multiplied over terrain and decorations; 0xffffff leaves them untouched. */
  terrainTint: number;
  /** Silhouette of the hill layers. Defaults to 'round'. */
  hillShape?: 'round' | 'jagged' | 'cloud';
  /** What stands on the near hills. Defaults to 'trees'. */
  decor?: 'trees' | 'spires' | 'kelp' | 'none';
  /** Camera-fixed particles for atmosphere. */
  ambient?: 'bubbles' | 'embers' | 'rain' | 'sparkles';
  /** Tint laid over the whole world (underwater). */
  overlay?: { color: number; alpha: number };
  /** Soft light shafts from above (underwater). */
  lightRays?: boolean;
  /** Occasional lightning flashes (storms). */
  lightning?: boolean;
}

/** Backdrop palettes; terrain, hero and pickups keep the shared PALETTE so they always read clearly. */
export const THEMES: Record<ThemeId, Theme> = {
  day: {
    skyTop: PALETTE.skyTop,
    skyBottom: PALETTE.skyBottom,
    sun: PALETTE.sun,
    sunRing: PALETTE.sunRing,
    cloudTint: 0xffffff,
    hillFar: PALETTE.hillFar,
    hillFarLight: PALETTE.hillFarLight,
    hillNear: PALETTE.hillNear,
    hillNearLight: PALETTE.hillNearLight,
    treeDark: PALETTE.treeDark,
    terrainTint: 0xffffff,
  },
  sunset: {
    skyTop: '#5a3f99',
    skyBottom: '#ffb27a',
    sun: '#ffd27a',
    sunRing: '#ff9f5a',
    cloudTint: 0xffc8b0,
    hillFar: '#c98ab0',
    hillFarLight: '#dba3c4',
    hillNear: '#8a5a8f',
    hillNearLight: '#a06fa3',
    treeDark: '#5a3d6b',
    terrainTint: 0xffe2cc,
  },
  peaks: {
    skyTop: '#6fb8ee',
    skyBottom: '#eaf8ff',
    sun: '#fffbe0',
    sunRing: '#fff0a0',
    cloudTint: 0xffffff,
    hillFar: '#b8c4e8',
    hillFarLight: '#e8eeff',
    hillNear: '#7aa0c8',
    hillNearLight: '#9cbde0',
    treeDark: '#3d6a8f',
    terrainTint: 0xf2f8ff,
  },
  night: {
    skyTop: '#0b0f30',
    skyBottom: '#353a80',
    sun: '#f4f1d0',
    sunRing: '#cfcaa0',
    moon: true,
    stars: true,
    cloudTint: 0x7c84b8,
    hillFar: '#2b3a6b',
    hillFarLight: '#3d4f85',
    hillNear: '#1f2d52',
    hillNearLight: '#2c3f6e',
    treeDark: '#14203d',
    terrainTint: 0x9aa4d8,
  },
  skyland: {
    skyTop: '#4d9ef5',
    skyBottom: '#e6f6ff',
    sun: '#fffbe0',
    sunRing: '#ffe98a',
    cloudTint: 0xffffff,
    hillFar: '#f4faff',
    hillFarLight: '#ffffff',
    hillNear: '#d6e8fb',
    hillNearLight: '#ffffff',
    treeDark: '#b8d4f0',
    terrainTint: 0xffffff,
    hillShape: 'cloud',
    decor: 'none',
    ambient: 'sparkles',
  },
  ocean: {
    skyTop: '#062c4a',
    skyBottom: '#1a7aa6',
    sun: '#c8f6ff',
    sunRing: '#7fd8f0',
    cloudTint: 0x6fb6d6,
    hillFar: '#0f4f6e',
    hillFarLight: '#1d6c8c',
    hillNear: '#0a3550',
    hillNearLight: '#16597a',
    treeDark: '#1f7a5a',
    terrainTint: 0xa6d8ee,
    decor: 'kelp',
    ambient: 'bubbles',
    overlay: { color: 0x1a6fa0, alpha: 0.16 },
    lightRays: true,
  },
  lava: {
    skyTop: '#140404',
    skyBottom: '#702010',
    sun: '#ffb04a',
    sunRing: '#ff5a1f',
    cloudTint: 0x6a2a20,
    hillFar: '#3d0f09',
    hillFarLight: '#6a2010',
    hillNear: '#240705',
    hillNearLight: '#4a1208',
    treeDark: '#160403',
    terrainTint: 0xffb894,
    hillShape: 'jagged',
    decor: 'spires',
    ambient: 'embers',
  },
  storm: {
    skyTop: '#151833',
    skyBottom: '#4a5078',
    sun: '#dfe3ff',
    sunRing: '#a8b0e0',
    moon: true,
    cloudTint: 0x6a7090,
    hillFar: '#2d3352',
    hillFarLight: '#434a70',
    hillNear: '#1d2138',
    hillNearLight: '#2d3352',
    treeDark: '#121528',
    terrainTint: 0xb8c0dc,
    hillShape: 'jagged',
    decor: 'spires',
    ambient: 'rain',
    lightning: true,
  },
  starsky: {
    skyTop: '#090c2a',
    skyBottom: '#3a2f7a',
    sun: '#fff6d0',
    sunRing: '#d8cc90',
    moon: true,
    stars: true,
    cloudTint: 0x8a84c8,
    hillFar: '#5a5aa0',
    hillFarLight: '#7a7ac0',
    hillNear: '#3c3c7c',
    hillNearLight: '#5858a0',
    treeDark: '#2a2a5c',
    terrainTint: 0xb4b8f0,
    hillShape: 'cloud',
    decor: 'none',
    ambient: 'sparkles',
  },
  fortress: {
    skyTop: '#0e0618',
    skyBottom: '#3d1f5c',
    sun: '#d68cff',
    sunRing: '#8a3dcc',
    moon: true,
    stars: true,
    cloudTint: 0x5a3a7a,
    hillFar: '#2a1640',
    hillFarLight: '#43265e',
    hillNear: '#1a0d2a',
    hillNearLight: '#2c1844',
    treeDark: '#12081e',
    terrainTint: 0xc4b0e6,
    hillShape: 'jagged',
    decor: 'spires',
    ambient: 'embers',
    lightning: true,
  },
};
