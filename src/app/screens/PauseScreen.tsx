import { useRef, useState } from 'react';
import { gameCommands } from '../../game/bridge';
import { audio } from '../../game/systems/audio';
import { ControlsHelp } from '../components/ControlsHelp';
import { SoundControls } from '../components/SoundControls';
import { useMenuNav } from '../hooks';

export function PauseScreen() {
  const ref = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'main' | 'controls'>('main');
  const resume = () => gameCommands.send({ type: 'resume' });
  useMenuNav(ref, view, view === 'controls' ? () => setView('main') : resume);

  const select = (fn: () => void) => () => {
    audio.play('uiSelect');
    fn();
  };

  return (
    <div className="overlay">
      <div className="panel" ref={ref} role="dialog" aria-modal="true" aria-labelledby="pause-title">
        {view === 'main' ? (
          <>
            <h2 id="pause-title">Paused</h2>
            <button data-nav className="btn btn-primary" onClick={select(resume)}>
              Resume
            </button>
            <button data-nav className="btn" onClick={select(() => gameCommands.send({ type: 'restartCheckpoint' }))}>
              Back to checkpoint
            </button>
            <button data-nav className="btn" onClick={select(() => gameCommands.send({ type: 'restartLevel' }))}>
              Restart level
            </button>
            <button data-nav className="btn btn-secondary" onClick={select(() => setView('controls'))}>
              Controls
            </button>
            <SoundControls />
            <button data-nav className="btn btn-ghost" onClick={select(() => gameCommands.send({ type: 'quitToTitle' }))}>
              Quit to title
            </button>
          </>
        ) : (
          <ControlsHelp onBack={() => setView('main')} />
        )}
      </div>
    </div>
  );
}
