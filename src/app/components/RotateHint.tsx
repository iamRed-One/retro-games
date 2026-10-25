/** Shown by CSS only on touch devices held in portrait. */
export function RotateHint() {
  return (
    <div className="rotate-hint" aria-live="polite">
      <div className="rotate-phone" aria-hidden="true" />
      <p>Rotate your device to landscape to play</p>
    </div>
  );
}
