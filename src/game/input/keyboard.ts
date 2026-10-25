import { uiStore } from '../bridge';
import type { ButtonAction, InputAdapter, InputSnapshot } from './actions';

interface Binding {
  moveX?: -1 | 1;
  moveY?: -1 | 1;
  button?: ButtonAction;
  /** Platforming only: Up/W also bounce, but in the shooter they just steer. */
  platformOnly?: boolean;
}

/** Keyboard defaults from the concept brief §5. */
const BINDINGS: Record<string, Binding[]> = {
  ArrowLeft: [{ moveX: -1 }],
  KeyA: [{ moveX: -1 }],
  ArrowRight: [{ moveX: 1 }],
  KeyD: [{ moveX: 1 }],
  ArrowUp: [{ moveY: -1 }, { button: 'bounce', platformOnly: true }],
  KeyW: [{ moveY: -1 }, { button: 'bounce', platformOnly: true }],
  Space: [{ button: 'bounce' }],
  KeyZ: [{ button: 'bounce' }],
  KeyJ: [{ button: 'bounce' }],
  ArrowDown: [{ moveY: 1 }, { button: 'special' }],
  KeyS: [{ moveY: 1 }, { button: 'special' }],
  ShiftLeft: [{ button: 'special' }],
  ShiftRight: [{ button: 'special' }],
  Escape: [{ button: 'pause' }],
  KeyP: [{ button: 'pause' }],
  KeyR: [{ button: 'restart' }],
};

function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

export class KeyboardAdapter implements InputAdapter {
  readonly device = 'keyboard' as const;
  private readonly down = new Set<string>();
  /** Keys pressed since the last poll, so a tap shorter than one frame is never lost. */
  private readonly latched = new Set<string>();
  /** Every key currently held, bound or not. */
  private readonly raw = new Set<string>();

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    // Every key is tracked for split-keyboard co-op (Enter, F, ...), even ones with no binding.
    if (!e.ctrlKey && !e.metaKey && !e.altKey && !isEditable(e.target)) this.raw.add(e.code);
    if (!BINDINGS[e.code] || e.ctrlKey || e.metaKey || e.altKey) return;
    if (isEditable(e.target) && e.code !== 'Escape') return;
    // Arrows would scroll the page; Space would also activate a focused menu button, so only
    // swallow it during gameplay where no menu is visible.
    if (e.code.startsWith('Arrow') || (e.code === 'Space' && uiStore.get().screen === 'playing')) {
      e.preventDefault();
    }
    this.down.add(e.code);
    this.latched.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.down.delete(e.code);
    this.raw.delete(e.code);
  };

  poll(out: InputSnapshot): void {
    let left = false;
    let right = false;
    let up = false;
    let downward = false;
    const shooter = uiStore.get().mode === 'shooter';
    for (const code of new Set([...this.down, ...this.latched])) {
      for (const b of BINDINGS[code] ?? []) {
        if (b.platformOnly && shooter) continue;
        if (b.moveX === -1) left = true;
        if (b.moveX === 1) right = true;
        if (b.moveY === -1) up = true;
        if (b.moveY === 1) downward = true;
        if (b.button) out.buttons[b.button] = true;
      }
    }
    this.latched.clear();
    out.moveX = (right ? 1 : 0) - (left ? 1 : 0);
    out.moveY = (downward ? 1 : 0) - (up ? 1 : 0);
  }

  /** Raw key state, for split-keyboard co-op. */
  isDown(code: string): boolean {
    return this.raw.has(code);
  }

  reset(): void {
    this.down.clear();
    this.latched.clear();
    this.raw.clear();
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
