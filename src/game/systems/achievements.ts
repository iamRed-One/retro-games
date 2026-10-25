export type AchievementId =
  | 'firstClear'
  | 'allSeeds'
  | 'noFalls'
  | 'flawless'
  | 'stomps'
  | 'skyAce'
  | 'explorer'
  | 'treasure'
  | 'skin'
  | 'powers'
  | 'baron'
  | 'allLevels'
  | 'timeAttack'
  | 'ghostBuster'
  | 'bossRush'
  | 'coop'
  | 'rich';

export interface Achievement {
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  firstClear: { title: 'First Bounce', description: 'Clear Meadow Run', icon: '●' },
  allSeeds: { title: 'Seed Hoarder', description: 'Collect every sun seed in a level', icon: '✦' },
  noFalls: { title: 'Sure Footed', description: 'Clear a level without falling once', icon: '▲' },
  flawless: { title: 'Flawless', description: 'Beat a boss without getting hit', icon: '◆' },
  stomps: { title: 'Murkling Masher', description: 'Pop 25 Murklings by bouncing on them', icon: '✖' },
  skyAce: { title: 'Sky Ace', description: 'Defeat 200 villains in sky battles', icon: '➤' },
  explorer: { title: 'Explorer', description: 'Find a secret room', icon: '?' },
  treasure: { title: 'Treasure Hunter', description: 'Find all 10 secret rooms', icon: '★' },
  skin: { title: 'Fresh Look', description: 'Buy a new ball skin', icon: '◐' },
  powers: { title: 'Power Hungry', description: 'Use spread, rapid and shield power-ups', icon: '⚡' },
  baron: { title: 'Sunny Skies', description: 'Beat Baron Murk', icon: '☀' },
  allLevels: { title: 'Completionist', description: 'Clear all 10 levels', icon: '♛' },
  timeAttack: { title: 'Speed Runner', description: 'Finish a Time Attack run', icon: '⏱' },
  ghostBuster: { title: 'Ghost Buster', description: 'Beat your own ghost in Time Attack', icon: '👻' },
  bossRush: { title: 'Boss Rusher', description: 'Survive a full Boss Rush', icon: '☠' },
  coop: { title: 'Better Together', description: 'Win a co-op sky battle', icon: '♥' },
  rich: { title: 'Seed Tycoon', description: 'Earn 1000 sun seeds in total', icon: '$' },
};

export const ACHIEVEMENT_IDS = Object.keys(ACHIEVEMENTS) as AchievementId[];
