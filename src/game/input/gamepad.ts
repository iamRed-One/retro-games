import { emptySnapshot, isActive, type InputAdapter, type InputSnapshot } from './actions';

/** Radial stick deadzone; filters drift on worn PS4/PS5 and generic pads. */
export const STICK_DEADZONE = 0.25;
/** Until a stick is pushed further, assume it reaches at least this far. */
const MIN_AXIS_RANGE = 0.6;

/**
 * Standard Gamepad API mapping (https://w3c.github.io/gamepad/#remapping), used by PS4/PS5,
 * Xbox and most branded pads. Plug-and-play pads often report `mapping: ""` with their own
 * button order and a "hat" axis for the D-pad, so their face buttons come from bindings.
 */
const STANDARD = {
  south: 0, // Cross on PlayStation, A on Xbox
  east: 1, // Circle / B
  r1: 5,
  r2: 7,
  select: 8, // Share / Create / View: restart at checkpoint
  start: 9, // Options / Menu: pause
  dpadUp: 12,
  dpadDown: 13,
  dpadLeft: 14,
  dpadRight: 15,
} as const;

/** Which buttons do Bounce/Shoot and Dive/Back on the active pad. */
export interface PadBindings {
  bounce: number;
  special: number;
}

/**
 * Defaults: PlayStation ✕ on standard pads. On plug-and-play pads "X" is the usual action
 * button and sits at index 2 on the common generic chipsets.
 */
function defaultBindings(standard: boolean): PadBindings {
  return standard ? { bounce: STANDARD.south, special: STANDARD.east } : { bounce: 2, special: 1 };
}

const BINDINGS_KEY = 'rar.padBindings.v1';

/** Saved per controller model, in this browser only; never sent anywhere. */
function loadBindings(id: string): PadBindings | null {
  try {
    const all = JSON.parse(localStorage.getItem(BINDINGS_KEY) ?? '{}') as Record<string, PadBindings>;
    const b = all[id];
    return b && Number.isInteger(b.bounce) && Number.isInteger(b.special) ? b : null;
  } catch {
    return null;
  }
}

function saveBindings(id: string, bindings: PadBindings): void {
  try {
    const all = JSON.parse(localStorage.getItem(BINDINGS_KEY) ?? '{}') as Record<string, PadBindings>;
    all[id] = bindings;
    localStorage.setItem(BINDINGS_KEY, JSON.stringify(all));
  } catch {
    // Bindings just won't persist.
  }
}

/**
 * Hat-switch D-pads report one axis: -1 = up, then clockwise in steps of 2/7, and a value
 * above 1 (often 3.29) when centered.
 */
const HAT_DIRECTIONS: [number, number][] = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
];

function readHat(value: number | undefined): [number, number] {
  if (value === undefined || value < -1.05 || value > 1.05) return [0, 0];
  return HAT_DIRECTIONS[Math.round((value + 1) / (2 / 7)) % 8];
}

export type GamepadStatusListener = (connected: boolean, label: string) => void;

/** A friendly label only; the raw controller id is never shown or sent anywhere. */
function labelFor(id: string): string {
  if (/054c|dualsense|dualshock|playstation|wireless controller/i.test(id)) return 'PlayStation controller';
  if (/xbox|xinput|045e/i.test(id)) return 'Xbox controller';
  return 'Gamepad';
}

function getPads(): (Gamepad | null)[] {
  try {
    return navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
  } catch {
    // Can throw when blocked by a permissions policy.
    return [];
  }
}

const clampUnit = (v: number) => Math.max(-1, Math.min(1, v));

function pressed(pad: Gamepad, i: number): boolean {
  const b = pad.buttons[i];
  return !!b && (b.pressed || b.value > 0.5);
}

export class GamepadAdapter implements InputAdapter {
  readonly device = 'gamepad' as const;
  private activeIndex: number | null = null;
  private activeId = '';
  private standard = true;
  private bindings: PadBindings = defaultBindings(true);
  /** After focus loss, ignore buttons that were already held until they are released. */
  private suppressUntilRelease = false;
  /** Controller setup: the next newly pressed button is reported here instead of playing. */
  private capture: ((button: number) => void) | null = null;
  private capturePrev = new Set<number>();
  /**
   * Largest deflection seen per stick axis. Many plug-and-play sticks only reach about ±0.5,
   * which barely moved the ball and never reached menu thresholds; dividing by the observed
   * range makes a full push read as a full push on any pad.
   */
  private axisRange = [MIN_AXIS_RANGE, MIN_AXIS_RANGE];

  constructor(private readonly onStatus: GamepadStatusListener) {
    window.addEventListener('gamepadconnected', this.onConnect);
    window.addEventListener('gamepaddisconnected', this.onDisconnect);
  }

  get currentBindings(): PadBindings {
    return { ...this.bindings };
  }

  /** Wait for the player to press a button (controller setup screen). */
  captureNextButton(callback: (button: number) => void): void {
    const pad = this.activePad();
    this.capturePrev = new Set(pad ? pad.buttons.map((_, i) => i).filter((i) => pressed(pad, i)) : []);
    this.capture = callback;
  }

  cancelCapture(): void {
    this.capture = null;
  }

  setBindings(bindings: PadBindings): void {
    this.bindings = { ...bindings };
    if (this.activeId) saveBindings(this.activeId, this.bindings);
    this.suppressUntilRelease = true;
  }

  resetBindings(): void {
    this.setBindings(defaultBindings(this.standard));
  }

  private onConnect = (e: GamepadEvent): void => {
    if (this.activeIndex === null) this.adopt(e.gamepad);
  };

  private onDisconnect = (e: GamepadEvent): void => {
    if (e.gamepad.index !== this.activeIndex) return;
    this.activeIndex = null;
    const next = this.firstConnected();
    if (next) this.adopt(next);
    else this.onStatus(false, '');
  };

  private adopt(pad: Gamepad): void {
    this.activeIndex = pad.index;
    this.activeId = pad.id;
    this.standard = pad.mapping === 'standard';
    this.bindings = loadBindings(pad.id) ?? defaultBindings(this.standard);
    this.axisRange = [MIN_AXIS_RANGE, MIN_AXIS_RANGE];
    this.suppressUntilRelease = true;
    this.onStatus(true, labelFor(pad.id));
  }

  private firstConnected(): Gamepad | null {
    return getPads().find((p): p is Gamepad => !!p && p.connected) ?? null;
  }

  private activePad(): Gamepad | null {
    const pad = this.activeIndex !== null ? getPads()[this.activeIndex] ?? null : null;
    return pad && pad.connected ? pad : null;
  }

  poll(out: InputSnapshot): void {
    let pad = this.activePad();
    if (!pad) {
      // Some browsers skip the connect event; polling also catches pads that appear later.
      pad = this.firstConnected();
      if (pad) {
        this.adopt(pad);
      } else {
        if (this.activeIndex !== null) {
          this.activeIndex = null;
          this.onStatus(false, '');
        }
        return;
      }
    }
    const active = pad;
    const held = (i: number) => pressed(active, i);

    if (this.capture) {
      const now = active.buttons.map((_, i) => i).filter(held);
      const fresh = now.find((i) => !this.capturePrev.has(i));
      this.capturePrev = new Set(now);
      if (fresh !== undefined) {
        const callback = this.capture;
        this.capture = null;
        this.suppressUntilRelease = true;
        callback(fresh);
      }
      return; // No gameplay or menu input while waiting for a button.
    }

    const rawX = active.axes[0] ?? 0;
    const rawY = active.axes[1] ?? 0;
    this.axisRange[0] = Math.min(1, Math.max(this.axisRange[0], Math.abs(rawX)));
    this.axisRange[1] = Math.min(1, Math.max(this.axisRange[1], Math.abs(rawY)));
    const ax = clampUnit(rawX / this.axisRange[0]);
    const ay = clampUnit(rawY / this.axisRange[1]);
    const magnitude = Math.hypot(ax, ay);
    let moveX = 0;
    let moveY = 0;
    if (magnitude > STICK_DEADZONE) {
      const scaled = Math.min(1, (magnitude - STICK_DEADZONE) / (1 - STICK_DEADZONE));
      moveX = (ax / magnitude) * scaled;
      moveY = (ay / magnitude) * scaled;
    }
    if (this.standard) {
      if (held(STANDARD.dpadLeft)) moveX = -1;
      if (held(STANDARD.dpadRight)) moveX = 1;
      if (held(STANDARD.dpadUp)) moveY = -1;
      if (held(STANDARD.dpadDown)) moveY = 1;
    } else {
      const [hx, hy] = readHat(active.axes[9]);
      if (hx) moveX = hx;
      if (hy) moveY = hy;
    }

    const snap = emptySnapshot();
    snap.moveX = moveX;
    snap.moveY = moveY;
    // Shoulder buttons also fire in sky battles.
    snap.buttons.bounce = held(this.bindings.bounce) || held(STANDARD.r1) || held(STANDARD.r2);
    snap.buttons.special = held(this.bindings.special);
    snap.buttons.pause = held(STANDARD.start);
    snap.buttons.restart = held(STANDARD.select);

    if (this.suppressUntilRelease) {
      if (isActive(snap)) return;
      this.suppressUntilRelease = false;
    }
    Object.assign(out, snap);
  }

  /**
   * Reads one specific pad by connection order (0 = first pad, 1 = second), for co-op.
   * Uses that pad's saved bindings, or the defaults for its layout.
   */
  readPad(order: number): { moveX: number; moveY: number; fire: boolean } | null {
    const pads = getPads().filter((p): p is Gamepad => !!p && p.connected).sort((a, b) => a.index - b.index);
    const pad = pads[order];
    if (!pad) return null;
    const standard = pad.mapping === 'standard';
    const bindings = loadBindings(pad.id) ?? defaultBindings(standard);
    const ax = pad.axes[0] ?? 0;
    const ay = pad.axes[1] ?? 0;
    const mag = Math.hypot(ax, ay);
    let moveX = 0;
    let moveY = 0;
    if (mag > STICK_DEADZONE) {
      const scaled = Math.min(1, (mag - STICK_DEADZONE) / (MIN_AXIS_RANGE - STICK_DEADZONE));
      moveX = clampUnit((ax / mag) * scaled);
      moveY = clampUnit((ay / mag) * scaled);
    }
    if (standard) {
      if (pressed(pad, STANDARD.dpadLeft)) moveX = -1;
      if (pressed(pad, STANDARD.dpadRight)) moveX = 1;
      if (pressed(pad, STANDARD.dpadUp)) moveY = -1;
      if (pressed(pad, STANDARD.dpadDown)) moveY = 1;
    } else {
      const [hx, hy] = readHat(pad.axes[9]);
      if (hx) moveX = hx;
      if (hy) moveY = hy;
    }
    const fire = pressed(pad, bindings.bounce) || pressed(pad, STANDARD.r1) || pressed(pad, STANDARD.r2);
    return { moveX, moveY, fire };
  }

  reset(): void {
    this.suppressUntilRelease = true;
  }

  dispose(): void {
    window.removeEventListener('gamepadconnected', this.onConnect);
    window.removeEventListener('gamepaddisconnected', this.onDisconnect);
  }
}
