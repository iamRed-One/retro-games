import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { touchAdapter, type TouchControl } from '../../game/input/touch';
import { useUi } from '../hooks';

/**
 * Large on-screen buttons. Pointer capture keeps a press alive when a finger drifts slightly,
 * and every release path (up, cancel, lost capture, unmount) clears the held state.
 */
function TouchButton({ control, label, className }: { control: TouchControl; label: string; className: string }) {
  const [down, setDown] = useState(false);

  const press = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    touchAdapter.set(control, true);
    setDown(true);
  };
  const release = () => {
    touchAdapter.set(control, false);
    setDown(false);
  };

  useEffect(() => () => touchAdapter.set(control, false), [control]);

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      className={`touch-btn ${className} ${down ? 'is-down' : ''}`}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}

function useTouchCapable(): boolean {
  const [capable, setCapable] = useState(() => window.matchMedia('(pointer: coarse)').matches);
  useEffect(() => {
    if (capable) return;
    const onTouch = () => setCapable(true);
    window.addEventListener('touchstart', onTouch, { once: true, passive: true });
    return () => window.removeEventListener('touchstart', onTouch);
  }, [capable]);
  return capable;
}

export function TouchControls() {
  const capable = useTouchCapable();
  const hasDive = useUi((s) => s.hasDive);
  const mode = useUi((s) => s.mode);
  if (!capable) return null;
  if (mode === 'shooter') {
    return (
      <div className="touch-controls">
        <div className="touch-dpad">
          <TouchButton control="up" label="Fly up" className="touch-arrow touch-arrow-up dpad-up" />
          <TouchButton control="left" label="Fly left" className="touch-arrow touch-arrow-left dpad-left" />
          <TouchButton control="right" label="Fly right" className="touch-arrow touch-arrow-right dpad-right" />
          <TouchButton control="down" label="Fly down" className="touch-arrow touch-arrow-down dpad-down" />
        </div>
        <div className="touch-cluster touch-right">
          <TouchButton control="bounce" label="Fire" className="touch-bounce touch-fire" />
        </div>
      </div>
    );
  }
  return (
    <div className="touch-controls">
      <div className="touch-cluster touch-left">
        <TouchButton control="left" label="Move left" className="touch-arrow touch-arrow-left" />
        <TouchButton control="right" label="Move right" className="touch-arrow touch-arrow-right" />
      </div>
      <div className="touch-cluster touch-right">
        {hasDive && <TouchButton control="special" label="Dive" className="touch-dive" />}
        <TouchButton control="bounce" label="Bounce" className="touch-bounce" />
      </div>
    </div>
  );
}
