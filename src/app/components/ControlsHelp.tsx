import { useState } from 'react';
import { audio } from '../../game/systems/audio';
import { rumble } from '../../game/systems/rumble';
import { useUi } from '../hooks';
import { ControllerSetup } from './ControllerSetup';

const ROWS: [action: string, keyboard: string, gamepad: string, touch: string][] = [
  ['Move', '← → / A D', 'Left stick / D-pad', '◀ ▶'],
  ['Bounce / shoot', 'Space / ↑ / W', 'X (✕ on PlayStation) · remap below', 'Bounce'],
  ['Super bounce', 'Tap just before landing', 'Tap just before landing', 'Tap just before landing'],
  ['Fly (sky battles)', 'Arrows / WASD', 'Left stick / D-pad', '4-way arrows'],
  ['Shoot (sky battles)', 'Hold Space / Z / J', 'Hold X, R1 or R2', 'Hold Fire'],
  ['Dive (in water)', '↓ / S / Shift', '○ / B', 'Dive button'],
  ['Fullscreen', 'F', 'Menu button', '⤢ button'],
  ['Pause', 'Esc / P', 'Options / Menu', 'II button'],
  ['Back to checkpoint', 'R', 'Share / View', 'Pause menu'],
];

export function ControlsHelp({ onBack }: { onBack: () => void }) {
  const padConnected = useUi((s) => s.gamepad.connected);
  const [setup, setSetup] = useState(false);
  const rumbleOn = useUi((s) => s.rumbleOn);
  if (setup) return <ControllerSetup onDone={() => setSetup(false)} />;
  return (
    <div className="controls-help">
      <h2>Controls</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Action</th>
            <th scope="col">Keyboard</th>
            <th scope="col">Gamepad</th>
            <th scope="col">Touch</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([action, ...cells]) => (
            <tr key={action}>
              <th scope="row">{action}</th>
              {cells.map((c, i) => (
                <td key={i}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">
        PS4, PS5 and most USB/Bluetooth pads work in Chrome, Edge and Brave. Plug-and-play pad doing the wrong thing? Use
        Set up controller.
      </p>
      <div className="btn-row">
        {padConnected && (
          <button data-nav className="btn btn-secondary" onClick={() => setSetup(true)}>
            Set up controller
          </button>
        )}
        {padConnected && (
          <button
            data-nav
            className="btn btn-ghost"
            aria-pressed={rumbleOn}
            onClick={() => {
              audio.setRumbleOn(!rumbleOn);
              if (!rumbleOn) rumble('hurt');
            }}
          >
            Rumble: {rumbleOn ? 'on' : 'off'}
          </button>
        )}
        <button data-nav className="btn" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
}
