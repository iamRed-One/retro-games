/**
 * The arcade's game library. Add a new game by adding an entry here (status 'soon' shows a
 * "coming soon" card; 'play' makes it launchable). Ideas follow the concept brief §12.
 */
export interface ArcadeGame {
  id: string;
  title: string;
  tagline: string;
  genre: string;
  status: 'play' | 'soon';
  /** Two colors for the card's cover art gradient. */
  colors: [string, string];
  /** Short text drawn as the cover's emblem (shown when there is no cover picture). */
  emblem: string;
  /** Cover picture in public/assets/covers/ (a screenshot of the game). */
  cover?: string;
}

export const GAMES: ArcadeGame[] = [
  {
    id: 'bopple',
    title: 'Bopple',
    tagline: 'Bounce, float and blast through 10 worlds to stop Baron Murk',
    genre: 'Platformer + sky shooter',
    status: 'play',
    colors: ['#ff8a3d', '#5a3f99'],
    emblem: '●',
    cover: 'assets/covers/bopple.png',
  },
  {
    id: 'slither',
    title: 'Slither Byte',
    tagline: 'Grow, turn, and do not bite your own tail',
    genre: 'Snake-inspired arcade',
    status: 'soon',
    colors: ['#37c3a1', '#10142a'],
    emblem: '≈',
  },
  {
    id: 'stardrift',
    title: 'Star Drift',
    tagline: 'Dodge, aim and fire through an endless starfield',
    genre: 'Space shooter',
    status: 'soon',
    colors: ['#5b6ee1', '#0b0f30'],
    emblem: '✦',
  },
  {
    id: 'blockrush',
    title: 'Block Rush',
    tagline: 'Drop, rotate and clear the lines before the stack tops out',
    genre: 'Block puzzle',
    status: 'soon',
    colors: ['#e8486a', '#2a1c45'],
    emblem: '▦',
  },
  {
    id: 'turbolane',
    title: 'Turbo Lane',
    tagline: 'Weave through traffic at full throttle',
    genre: 'Racing',
    status: 'soon',
    colors: ['#fbd536', '#663931'],
    emblem: '➤',
  },
  {
    id: 'poppairs',
    title: 'Pop Pairs',
    tagline: 'Tap and match against the clock',
    genre: 'Tap-match',
    status: 'soon',
    colors: ['#ff8fb8', '#3a8fd6'],
    emblem: '◆',
  },
];
