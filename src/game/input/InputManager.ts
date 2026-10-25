import { uiStore } from '../bridge';
import {
  BUTTON_ACTIONS,
  emptySnapshot,
  isActive,
  type ButtonAction,
  type InputAdapter,
  type InputDevice,
  type NavAction,
  type PressAction,
} from './actions';
import { GamepadAdapter } from './gamepad';
import { KeyboardAdapter } from './keyboard';
import { touchAdapter } from './touch';

export type PressListener = (action: PressAction, device: InputDevice) => void;

/** Axis thresholds with hysteresis so a stick resting near the edge doesn't spam menu moves. */
const NAV_ON = 0.4;
const NAV_OFF = 0.2;

/**
 * Merges every adapter into one action state and emits a press event exactly once per
 * physical press. It polls on its own animation-frame loop, so menus keep working while the
 * Phaser scene is paused.
 */
export class InputManager {
  moveX = 0;
  moveY = 0;
  private readonly adapters: InputAdapter[];
  /** Exposed for the controller setup screen (button remapping). */
  readonly gamepad: GamepadAdapter;
  private readonly keyboard: KeyboardAdapter;
  private held: Record<ButtonAction, boolean> = emptySnapshot().buttons;
  private navHeld: Record<NavAction, boolean> = { up: false, down: false, left: false, right: false };
  private readonly listeners = new Set<PressListener>();
  private lastDevice: InputDevice = 'keyboard';
  private raf = 0;

  constructor() {
    this.keyboard = new KeyboardAdapter();
    this.adapters = [
      this.keyboard,
      (this.gamepad = new GamepadAdapter((connected, label) => uiStore.set({ gamepad: { connected, label } }))),
      touchAdapter,
    ];
    window.addEventListener('blur', this.reset);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  start(): void {
    if (this.raf) return;
    const loop = () => {
      this.poll();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  /**
   * Co-op controls for one player. Player 1: WASD + Space (or F), the first gamepad, or touch.
   * Player 2: arrow keys + Enter (or /), or the second gamepad.
   */
  readPlayer(player: 1 | 2): { moveX: number; moveY: number; fire: boolean } {
    const k = this.keyboard;
    const keys =
      player === 1
        ? { l: 'KeyA', r: 'KeyD', u: 'KeyW', d: 'KeyS', fire: ['Space', 'KeyF'] }
        : { l: 'ArrowLeft', r: 'ArrowRight', u: 'ArrowUp', d: 'ArrowDown', fire: ['Enter', 'NumpadEnter', 'Slash'] };
    let moveX = (k.isDown(keys.r) ? 1 : 0) - (k.isDown(keys.l) ? 1 : 0);
    let moveY = (k.isDown(keys.d) ? 1 : 0) - (k.isDown(keys.u) ? 1 : 0);
    let fire = keys.fire.some((c) => k.isDown(c));
    const pad = this.gamepad.readPad(player - 1);
    if (pad) {
      if (pad.moveX) moveX = pad.moveX;
      if (pad.moveY) moveY = pad.moveY;
      fire ||= pad.fire;
    }
    if (player === 1) {
      const touch = emptySnapshot();
      touchAdapter.poll(touch);
      if (touch.moveX) moveX = touch.moveX;
      if (touch.moveY) moveY = touch.moveY;
      fire ||= touch.buttons.bounce;
    }
    return { moveX, moveY, fire };
  }

  isHeld(action: ButtonAction): boolean {
    return this.held[action];
  }

  onPress(listener: PressListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Clear everything held; called on blur and when the tab is hidden so nothing gets stuck. */
  reset = (): void => {
    this.adapters.forEach((a) => a.reset());
    this.held = emptySnapshot().buttons;
    this.navHeld = { up: false, down: false, left: false, right: false };
    this.moveX = 0;
    this.moveY = 0;
  };

  private onVisibility = (): void => {
    if (document.hidden) this.reset();
  };

  private poll(): void {
    let moveX = 0;
    let moveY = 0;
    const buttons = emptySnapshot().buttons;
    const sourceOf: Partial<Record<PressAction, InputDevice>> = {};
    let activeDevice: InputDevice | null = null;

    for (const adapter of this.adapters) {
      const snap = emptySnapshot();
      adapter.poll(snap);
      if (!isActive(snap)) continue;
      activeDevice ??= adapter.device;
      moveX += snap.moveX;
      moveY += snap.moveY;
      if (snap.moveX !== 0 || snap.moveY !== 0) {
        sourceOf.up ??= adapter.device;
        sourceOf.down ??= adapter.device;
        sourceOf.left ??= adapter.device;
        sourceOf.right ??= adapter.device;
      }
      for (const b of BUTTON_ACTIONS) {
        if (snap.buttons[b]) {
          buttons[b] = true;
          sourceOf[b] ??= adapter.device;
        }
      }
    }

    this.moveX = Math.max(-1, Math.min(1, moveX));
    this.moveY = Math.max(-1, Math.min(1, moveY));

    const pressed: PressAction[] = [];
    for (const b of BUTTON_ACTIONS) {
      if (buttons[b] && !this.held[b]) pressed.push(b);
    }
    this.held = buttons;

    const nav: Record<NavAction, number> = { up: -this.moveY, down: this.moveY, left: -this.moveX, right: this.moveX };
    for (const dir of Object.keys(nav) as NavAction[]) {
      const value = nav[dir];
      if (!this.navHeld[dir] && value >= NAV_ON) {
        this.navHeld[dir] = true;
        pressed.push(dir);
      } else if (this.navHeld[dir] && value <= NAV_OFF) {
        this.navHeld[dir] = false;
      }
    }

    if (activeDevice && activeDevice !== this.lastDevice) {
      this.lastDevice = activeDevice;
      uiStore.set({ device: activeDevice });
    }

    for (const action of pressed) {
      const device = sourceOf[action] ?? this.lastDevice;
      this.listeners.forEach((l) => l(action, device));
    }
  }
}

export const input = new InputManager();
