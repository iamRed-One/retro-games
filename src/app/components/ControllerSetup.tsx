import { useEffect, useState } from 'react';
import { input } from '../../game/input/InputManager';
import { audio } from '../../game/systems/audio';

type Step = 'bounce' | 'special' | 'done';

const PROMPTS: Record<Exclude<Step, 'done'>, string> = {
  bounce: 'Press the button you want for BOUNCE / SHOOT',
  special: 'Now press the button for DIVE / BACK',
};

/**
 * Plug-and-play pads number their buttons differently, so the player simply presses the
 * buttons they want. Saved for this controller model in this browser.
 */
export function ControllerSetup({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<Step>('bounce');
  const [bounce, setBounce] = useState<number | null>(null);
  const [warning, setWarning] = useState('');
  /** Bumped to re-arm button capture after a rejected (duplicate) press. */
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (step === 'done') return;
    const pad = input.gamepad;
    pad.captureNextButton((button) => {
      if (step === 'bounce') {
        setBounce(button);
        setWarning('');
        audio.play('uiSelect');
        setStep('special');
      } else if (button === bounce) {
        setWarning('That button is already Bounce. Pick a different one.');
        audio.play('uiMove');
        setAttempt((n) => n + 1);
      } else {
        pad.setBindings({ bounce: bounce ?? 0, special: button });
        audio.play('checkpoint');
        setStep('done');
      }
    });
    return () => pad.cancelCapture();
  }, [step, bounce, attempt]);

  return (
    <div className="controller-setup" role="dialog" aria-labelledby="setup-title">
      <h2 id="setup-title">Controller setup</h2>
      {step !== 'done' ? (
        <>
          <p className="setup-prompt" aria-live="polite">
            {PROMPTS[step]}
          </p>
          <div className="setup-pulse" aria-hidden="true" />
          {warning && <p className="setup-warning">{warning}</p>}
          <p className="hint">Keyboard or mouse: Cancel below</p>
        </>
      ) : (
        <p className="setup-prompt">Saved! Your buttons are set for this controller.</p>
      )}
      <div className="btn-row">
        <button
          data-nav
          className="btn btn-ghost"
          onClick={() => {
            input.gamepad.resetBindings();
            audio.play('uiSelect');
            onDone();
          }}
        >
          Use defaults
        </button>
        <button data-nav className="btn" onClick={onDone}>
          {step === 'done' ? 'Done' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}
