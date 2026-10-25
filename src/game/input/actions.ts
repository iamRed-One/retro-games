/**
 * Shared input contract (concept brief §5). Every device adapter translates its hardware into
 * this snapshot; gameplay code never reads a specific device.
 */
export type InputDevice = 'keyboard' | 'touch' | 'gamepad';

export type ButtonAction = 'bounce' | 'special' | 'pause' | 'restart';
/** Derived from movement axes; used for menu navigation. */
export type NavAction = 'up' | 'down' | 'left' | 'right';
export type PressAction = ButtonAction | NavAction;

export const BUTTON_ACTIONS: readonly ButtonAction[] = ['bounce', 'special', 'pause', 'restart'];

export interface InputSnapshot {
  /** -1 (left) .. 1 (right). Analog for gamepads, -1/0/1 for keys and touch. */
  moveX: number;
  /** -1 (up) .. 1 (down). */
  moveY: number;
  buttons: Record<ButtonAction, boolean>;
}

export function emptySnapshot(): InputSnapshot {
  return { moveX: 0, moveY: 0, buttons: { bounce: false, special: false, pause: false, restart: false } };
}

export function isActive(s: InputSnapshot): boolean {
  return s.moveX !== 0 || s.moveY !== 0 || BUTTON_ACTIONS.some((b) => s.buttons[b]);
}

export interface InputAdapter {
  readonly device: InputDevice;
  /** Write the device's current state into `out` (which starts empty). */
  poll(out: InputSnapshot): void;
  /** Drop held state, e.g. after the window loses focus. */
  reset(): void;
  dispose(): void;
}
