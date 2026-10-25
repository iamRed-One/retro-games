import { useEffect, useRef, useSyncExternalStore, type RefObject } from 'react';
import { uiStore, type UiState } from '../game/bridge';
import { input } from '../game/input/InputManager';
import { audio } from '../game/systems/audio';

/** Subscribe to one slice of game UI state. Selectors must return primitives or stable references. */
export function useUi<T>(selector: (s: UiState) => T): T {
  return useSyncExternalStore(uiStore.subscribe, () => selector(uiStore.get()));
}

/**
 * Gamepad/D-pad/arrow navigation for a menu. Items are elements marked `data-nav` inside `ref`.
 * Keyboard Enter/Space use native button activation; gamepad and touch "bounce" press the
 * focused item. `onBack` runs on the gamepad east button (Circle / B).
 */
export function useMenuNav(ref: RefObject<HTMLElement | null>, viewKey: string, onBack?: () => void): void {
  // Kept in a ref so re-renders (e.g. volume changes) don't re-run the effect and steal focus.
  const backRef = useRef(onBack);
  backRef.current = onBack;

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = () => Array.from(root.querySelectorAll<HTMLElement>('[data-nav]:not([disabled])'));
    const frame = requestAnimationFrame(() => items()[0]?.focus({ preventScroll: true }));

    const off = input.onPress((action, device) => {
      const list = items();
      if (list.length === 0) return;
      const index = list.indexOf(document.activeElement as HTMLElement);
      const move = (delta: number) => {
        const next = index < 0 ? 0 : (index + delta + list.length) % list.length;
        list[next].focus({ preventScroll: true });
        audio.play('uiMove');
      };
      switch (action) {
        case 'up':
        case 'left':
          move(-1);
          break;
        case 'down':
        case 'right':
          move(1);
          break;
        case 'bounce':
          if (device !== 'keyboard') (list[index] ?? list[0]).click();
          break;
        case 'special':
          if (device === 'gamepad') backRef.current?.();
          break;
        default:
          break;
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      off();
    };
  }, [ref, viewKey]);
}
