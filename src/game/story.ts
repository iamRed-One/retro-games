/** Short story scenes: one before each world (first visit) and an ending after Baron Murk. */
export type Speaker = 'narrator' | 'bopple' | 'baron' | 'boss';

export interface StoryLine {
  speaker: Speaker;
  /** Display name for 'boss' lines. */
  name?: string;
  /** Portrait color for 'boss' lines. */
  color?: string;
  text: string;
}

export interface StoryScene {
  title: string;
  lines: StoryLine[];
}

export const STORY: Record<string, StoryScene> = {
  meadow: {
    title: 'Chapter 1: The Stolen Sun',
    lines: [
      { speaker: 'narrator', text: 'In Sunny Vale, golden sun seeds keep the days warm and bright.' },
      { speaker: 'baron', text: 'Mwahaha! Every seed, every sunbeam... MINE! Murklings, take them all!' },
      { speaker: 'bopple', text: 'Hey! Those seeds belong to everyone. Give them back!' },
      { speaker: 'baron', text: 'Come and take them, little ball. My general Grumble is waiting for you.' },
    ],
  },
  cliffs: {
    title: 'Chapter 2: Sunset Cliffs',
    lines: [
      { speaker: 'bopple', text: 'The sun is setting early... the storm is spreading.' },
      { speaker: 'boss', name: 'Crag', color: '#94806a', text: 'These cliffs crumble under fools. Step lightly, ball!' },
      { speaker: 'bopple', text: 'Then I just won’t stop bouncing.' },
    ],
  },
  peaks: {
    title: 'Chapter 3: Breezy Peaks',
    lines: [
      { speaker: 'narrator', text: 'High above the clouds, the old wind fans still spin.' },
      { speaker: 'boss', name: 'Gustav', color: '#9cc4ea', text: 'Whoosh! I’ll blow you right back to the meadow!' },
      { speaker: 'bopple', text: 'Thanks for the lift, actually.' },
    ],
  },
  lake: {
    title: 'Chapter 4: Moonlit Lake',
    lines: [
      { speaker: 'narrator', text: 'Night falls. Sun seeds glitter at the bottom of the lake.' },
      { speaker: 'boss', name: 'Lady Ripple', color: '#5cc6c8', text: 'Dive for them if you dare, darling. The water is... deep.' },
      { speaker: 'bopple', text: 'Good thing I float!' },
    ],
  },
  sky: {
    title: 'Chapter 5: Cloud Kingdom',
    lines: [
      { speaker: 'bopple', text: 'No ground at all up here... just clouds and a very long drop.' },
      { speaker: 'boss', name: 'Nimbus', color: '#e2e6f2', text: 'One wrong bounce and down you go. I’ll bring the thunder.' },
    ],
  },
  ocean: {
    title: 'Chapter 6: Coral Deep',
    lines: [
      { speaker: 'narrator', text: 'Baron Murk hid a mountain of seeds beneath the waves.' },
      { speaker: 'boss', name: 'Captain Ink', color: '#43599a', text: 'Yarr! Nobody gets past me jellies, matey!' },
      { speaker: 'bopple', text: 'Deep breath... here I go!' },
    ],
  },
  magma: {
    title: 'Chapter 7: Magma Caverns',
    lines: [
      { speaker: 'bopple', text: 'It’s so hot down here... the seeds are glowing red!' },
      { speaker: 'boss', name: 'Magmaw', color: '#e05a28', text: 'I melt bouncy little balls for breakfast. RAAAH!' },
    ],
  },
  storm: {
    title: 'Chapter 8: Thunder Spires',
    lines: [
      { speaker: 'narrator', text: 'Lightning cracks around the spires of the storm.' },
      { speaker: 'boss', name: 'Volt', color: '#7a68c8', text: 'Zzzap! You’re about to have a very shocking day.' },
      { speaker: 'bopple', text: 'Rain or shine, I’m not stopping now.' },
    ],
  },
  starfall: {
    title: 'Chapter 9: Starfall Heights',
    lines: [
      { speaker: 'boss', name: 'Eclipse', color: '#3a2f5c', text: 'I swallowed the moon. Now I’ll swallow your light, too.' },
      { speaker: 'bopple', text: 'The fortress is right ahead. Almost there...' },
    ],
  },
  fortress: {
    title: 'Chapter 10: Murk Fortress',
    lines: [
      { speaker: 'baron', text: 'So, the little ball made it all the way to my fortress.' },
      { speaker: 'bopple', text: 'I beat every one of your generals. Give the sun back, Baron!' },
      { speaker: 'baron', text: 'Never! Behold my FINAL STORM! Mwahahaha!' },
    ],
  },
  ending: {
    title: 'Sunny Skies Again',
    lines: [
      { speaker: 'narrator', text: 'With the last storm cloud gone, sunlight pours back into Sunny Vale.' },
      { speaker: 'bopple', text: 'Every seed is home. Sunny skies for everyone!' },
      { speaker: 'baron', text: 'This isn’t over, ball... I’ll be back... achoo!' },
      { speaker: 'narrator', text: 'And Bopple bounced home, the hero of Sunny Vale. Thanks for playing!' },
    ],
  },
};

export const STORY_ORDER = ['meadow', 'cliffs', 'peaks', 'lake', 'sky', 'ocean', 'magma', 'storm', 'starfall', 'fortress', 'ending'];
