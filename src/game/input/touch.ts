import type { InputAdapter, InputSnapshot } from './actions';

export type TouchControl = 'left' | 'right' | 'up' | 'down' | 'bounce' | 'special';

/**
 * Held state for the on-screen buttons. The React TouchControls component owns the pointer
 * handling (pointer capture, cancel, release) and writes into this adapter.
 */
export class TouchAdapter implements InputAdapter {
  readonly device = 'touch' as const;
  private readonly held: Record<TouchControl, boolean> = { left: false, right: false, up: false, down: false, bounce: false, special: false };
  private readonly latched = new Set<TouchControl>();

  set(control: TouchControl, down: boolean): void {
    this.held[control] = down;
    if (down) this.latched.add(control);
  }

  poll(out: InputSnapshot): void {
    const on = (c: TouchControl) => this.held[c] || this.latched.has(c);
    out.moveX = (on('right') ? 1 : 0) - (on('left') ? 1 : 0);
    out.moveY = (on('down') ? 1 : 0) - (on('up') ? 1 : 0);
    out.buttons.bounce = on('bounce');
    out.buttons.special = on('special');
    this.latched.clear();
  }

  reset(): void {
    for (const key of Object.keys(this.held) as TouchControl[]) this.held[key] = false;
    this.latched.clear();
  }

  dispose(): void {
    this.reset();
  }
}

export const touchAdapter = new TouchAdapter();
