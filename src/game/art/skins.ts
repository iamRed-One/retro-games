/** Ball skins sold in the shop for sun seeds. Pixel colors come from skinColorAt (12x12 art). */
export interface SkinDef {
  id: string;
  name: string;
  price: number;
  base: string;
  light: string;
  dark: string;
  outline: string;
  pattern?: 'stripes' | 'stars' | 'spots' | 'rainbow' | 'checker' | 'sparkle';
  patternColor?: string;
}

export const SKINS: SkinDef[] = [
  { id: 'classic', name: 'Classic', price: 0, base: '#ff8a3d', light: '#ffb070', dark: '#d9541e', outline: '#7a2e12' },
  { id: 'lime', name: 'Lime Pop', price: 100, base: '#7ed957', light: '#b6f28c', dark: '#3f9e2b', outline: '#1f5214' },
  { id: 'ocean', name: 'Deep Blue', price: 150, base: '#3fa9f5', light: '#8fd3ff', dark: '#1f6fb8', outline: '#0c3460' },
  { id: 'bubblegum', name: 'Bubblegum', price: 200, base: '#ff8fc8', light: '#ffc6e3', dark: '#e05a9e', outline: '#7a1f4f' },
  { id: 'spotty', name: 'Ladybug', price: 250, base: '#e8486a', light: '#ff8fa3', dark: '#a52a49', outline: '#4a0f1f', pattern: 'spots', patternColor: '#10142a' },
  { id: 'tiger', name: 'Tiger', price: 350, base: '#ff9a1f', light: '#ffc46a', dark: '#c46a0c', outline: '#4a2408', pattern: 'stripes', patternColor: '#2a1810' },
  { id: 'midnight', name: 'Midnight', price: 450, base: '#2a2f6a', light: '#4a52a8', dark: '#161a40', outline: '#07091f', pattern: 'stars', patternColor: '#fff6a6' },
  { id: 'racer', name: 'Racer', price: 550, base: '#f4f4f8', light: '#ffffff', dark: '#b8bccc', outline: '#10142a', pattern: 'checker', patternColor: '#10142a' },
  { id: 'gold', name: 'Golden', price: 800, base: '#ffd23f', light: '#fff3a6', dark: '#c98a0c', outline: '#6a4400', pattern: 'sparkle', patternColor: '#ffffff' },
  { id: 'rainbow', name: 'Rainbow', price: 1200, base: '#ff4d6d', light: '#ffffff', dark: '#5b6ee1', outline: '#2a1c45', pattern: 'rainbow' },
];

export function getSkin(id: string): SkinDef {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}

const RAINBOW = ['#ff4d6d', '#ff8a3d', '#fbd536', '#7ed957', '#3fa9f5', '#8a6bff'];

/** Color of pixel (x, y) of the 12x12 ball, or null outside the disc. */
export function skinColorAt(skin: SkinDef, x: number, y: number): string | null {
  const d = Math.hypot(x + 0.5 - 6, y + 0.5 - 6);
  if (d > 6) return null;
  if (d > 5.1) return skin.outline;
  const pc = skin.patternColor ?? skin.dark;
  switch (skin.pattern) {
    case 'stripes':
      if ((x + Math.floor(y / 3)) % 4 === 0) return pc;
      break;
    case 'spots':
      if ((x === 3 && y === 4) || (x === 7 && y === 3) || (x === 8 && y === 7) || (x === 4 && y === 8) || (x === 6 && y === 6)) return pc;
      break;
    case 'stars':
      if ((x === 3 && y === 3) || (x === 8 && y === 5) || (x === 5 && y === 8) || (x === 9 && y === 8)) return pc;
      break;
    case 'checker':
      if ((Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0) return pc;
      break;
    case 'rainbow':
      return RAINBOW[Math.min(RAINBOW.length - 1, Math.floor((y - 1) / 1.7))];
    case 'sparkle':
      if ((x === 8 && y === 3) || (x === 3 && y === 8)) return pc;
      break;
  }
  // Freckles so rolling stays visible on plain skins.
  if ((x === 8 && y === 3) || (x === 9 && y === 4) || (x === 3 && y === 8)) return skin.light;
  if ((x === 7 && y === 9) || (x === 2 && y === 5)) return skin.dark;
  return skin.base;
}
