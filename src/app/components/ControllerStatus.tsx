import { useUi } from '../hooks';

/** Small connected/ready indicator (concept brief §5). */
export function ControllerStatus() {
  const connected = useUi((s) => s.gamepad.connected);
  const label = useUi((s) => s.gamepad.label);

  return (
    <p className={`controller-status ${connected ? 'is-ready' : ''}`} role="status">
      <span className="dot" aria-hidden="true" />
      {connected ? `${label} ready` : 'Controller: plug in and press any button'}
    </p>
  );
}
