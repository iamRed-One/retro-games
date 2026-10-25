import type { InputDevice } from '../game/input/actions';

export function formatTime(ms: number): string {
  const totalTenths = Math.floor(ms / 100);
  const tenths = totalTenths % 10;
  const seconds = Math.floor(totalTenths / 10) % 60;
  const minutes = Math.floor(totalTenths / 600);
  return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`;
}

const LABELS: Record<InputDevice, { move: string; fly: string; bounce: string; special: string }> = {
  keyboard: { move: '← → or A D', fly: 'Arrows / WASD', bounce: 'SPACE', special: '↓ / S' },
  gamepad: { move: 'Stick or D-pad', fly: 'Stick', bounce: 'X', special: '○ / B' },
  touch: { move: '◀ ▶', fly: 'the arrows', bounce: 'the bounce button', special: 'the dive button' },
};

/** Fill {move} / {bounce} / {special} tokens with the labels for the device the player is using. */
export function formatPrompt(text: string, device: InputDevice): string {
  const labels = LABELS[device];
  const filled = text
    .replace('{move}', labels.move)
    .replace('{fly}', labels.fly)
    .replace('{bounce}', labels.bounce)
    .replace('{special}', labels.special);
  return filled.charAt(0).toUpperCase() + filled.slice(1);
}
