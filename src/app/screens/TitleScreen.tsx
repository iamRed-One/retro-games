import { useMemo, useRef, useState } from 'react';
import { gameCommands, uiStore } from '../../game/bridge';
import { ARCADE_NAME, GAME_TITLE } from '../../game/config';
import { continueLevelId, levelSummaries } from '../../game/levels';
import { audio } from '../../game/systems/audio';
import { ControllerStatus } from '../components/ControllerStatus';
import { ControlsHelp } from '../components/ControlsHelp';
import { FullscreenButton } from '../components/FullscreenButton';
import { Extras, type ExtrasView } from '../components/Extras';
import { LevelSelect } from '../components/LevelSelect';
import { SoundControls } from '../components/SoundControls';
import { useMenuMusic } from '../../arcade/menuMusic';
import { useMenuNav, useUi } from '../hooks';

/** On phones, go fullscreen and request landscape. Both can be refused; play continues either way. */
function enterMobileFullscreen(): void {
  if (!window.matchMedia('(pointer: coarse)').matches || document.fullscreenElement) return;
  document.documentElement
    .requestFullscreen?.()
    .then(() => (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.('landscape'))
    .catch(() => {});
}

const HINTS = {
  keyboard: 'Arrows / A D to roll · Space to bounce · F for fullscreen',
  gamepad: 'Stick to roll · X to bounce',
  touch: 'Use the on-screen buttons · rotate to landscape',
} as const;

type View = 'main' | 'levels' | 'controls' | 'extras';

export function TitleScreen() {
  const ref = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>('main');
  const [extrasView, setExtrasView] = useState<ExtrasView>('menu');
  const device = useUi((s) => s.device);
  const bank = useUi((s) => s.seedsBank);
  useMenuMusic();
  useMenuNav(
    ref,
    view === 'extras' ? `extras-${extrasView}` : view,
    view === 'extras' && extrasView !== 'menu'
      ? () => setExtrasView('menu')
      : view !== 'main'
        ? () => setView('main')
        : () => uiStore.set({ screen: 'hub' }),
  );

  // Which level Play resumes, and whether the player has started the campaign yet.
  const { resumeId, resumeLabel } = useMemo(() => {
    const id = continueLevelId();
    const summary = levelSummaries().find((l) => l.id === id);
    const anyDone = levelSummaries().some((l) => l.completed);
    return { resumeId: id, resumeLabel: anyDone && summary ? `Continue: Level ${summary.number}` : 'Play' };
  }, []);

  const play = () => {
    audio.unlock();
    audio.play('uiSelect');
    enterMobileFullscreen();
    gameCommands.send({ type: 'start', levelId: resumeId });
  };
  const open = (next: View) => () => {
    audio.play('uiSelect');
    setView(next);
  };

  return (
    <div className="overlay overlay-title">
      <div className="panel title-panel" ref={ref}>
        {view === 'main' && (
          <>
            <p className="arcade-name">{ARCADE_NAME}</p>
            <h1 className="game-title">{GAME_TITLE}</h1>
            <p className="bank title-bank">
              <span className="seed-icon" aria-hidden="true" /> {bank} seeds
            </p>
            <button data-nav className="btn btn-primary" onClick={play}>
              {resumeLabel}
            </button>
            <div className="btn-row">
              <button data-nav className="btn btn-secondary" onClick={open('levels')}>
                Levels
              </button>
              <button
                data-nav
                className="btn btn-secondary"
                onClick={() => {
                  setExtrasView('menu');
                  open('extras')();
                }}
              >
                Extras
              </button>
            </div>
            <div className="btn-row">
              <button data-nav className="btn btn-ghost" onClick={open('controls')}>
                Controls
              </button>
              <FullscreenButton nav className="btn btn-ghost" />
            </div>
            <SoundControls />
            <button
              data-nav
              className="btn btn-ghost btn-small arcade-back"
              onClick={() => {
                audio.play('uiSelect');
                uiStore.set({ screen: 'hub' });
              }}
            >
              ◀ All games
            </button>
            <ControllerStatus />
            <p className="hint">{HINTS[device]}</p>
          </>
        )}
        {view === 'levels' && <LevelSelect onBack={() => setView('main')} />}
        {view === 'extras' && <Extras view={extrasView} setView={setExtrasView} onBack={() => setView('main')} />}
        {view === 'controls' && <ControlsHelp onBack={() => setView('main')} />}
      </div>
    </div>
  );
}
