import { useEffect } from 'react';
import { gameCommands, uiStore } from '../game/bridge';
import { input } from '../game/input/InputManager';
import { audio } from '../game/systems/audio';
import { ArcadeHub } from '../arcade/ArcadeHub';
import { SocialLinks } from '../arcade/SocialLinks';
import { useFullscreenHotkey } from './components/FullscreenButton';
import { AchievementBanner } from './components/AchievementBanner';
import { Hud } from './components/Hud';
import { NowPlaying } from './components/NowPlaying';
import { RotateHint } from './components/RotateHint';
import { TouchControls } from './components/TouchControls';
import { TuningPanel } from './dev/TuningPanel';
import { GameCanvas } from './GameCanvas';
import { useUi } from './hooks';
import { CompleteScreen } from './screens/CompleteScreen';
import { PauseScreen } from './screens/PauseScreen';
import { StoryScreen } from './screens/StoryScreen';
import { TitleScreen } from './screens/TitleScreen';

export function App() {
  const screen = useUi((s) => s.screen);
  useFullscreenHotkey();

  useEffect(() => {
    input.start();
    return () => input.stop();
  }, []);

  // Pause toggles from any device; a single held button can't toggle repeatedly.
  useEffect(
    () =>
      input.onPress((action) => {
        if (action !== 'pause') return;
        const current = uiStore.get().screen;
        if (current === 'playing') gameCommands.send({ type: 'pause' });
        else if (current === 'paused') gameCommands.send({ type: 'resume' });
      }),
    [],
  );

  // Auto-pause when the tab or window loses focus; unlock audio on the first real gesture.
  useEffect(() => {
    const autoPause = () => {
      if (uiStore.get().screen === 'playing') gameCommands.send({ type: 'pause' });
    };
    const onVisibility = () => {
      if (document.hidden) autoPause();
    };
    const unlock = () => audio.unlock();
    // Matches the CSS rule that shows the rotate hint, so play never continues behind it.
    const portrait = window.matchMedia('(orientation: portrait) and (pointer: coarse)');
    const onOrientation = () => {
      if (portrait.matches) autoPause();
    };
    portrait.addEventListener('change', onOrientation);
    window.addEventListener('blur', autoPause);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      portrait.removeEventListener('change', onOrientation);
      window.removeEventListener('blur', autoPause);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const inGame = screen === 'playing' || screen === 'paused';

  return (
    <div className="app">
      <main className="stage" onContextMenu={(e) => e.preventDefault()}>
        <GameCanvas />
        {inGame && <Hud />}
        {inGame && <NowPlaying />}
        {screen === 'playing' && <TouchControls />}
        {screen === 'hub' && <ArcadeHub />}
        {screen === 'title' && <TitleScreen />}
        {(screen === 'hub' || screen === 'title') && <SocialLinks />}
        {screen === 'paused' && <PauseScreen />}
        {screen === 'complete' && <CompleteScreen />}
        {screen === 'story' && <StoryScreen />}
        <AchievementBanner />
        {screen === 'loading' && <div className="loading">Loading…</div>}
        {import.meta.env.DEV && <TuningPanel />}
      </main>
      <RotateHint />
    </div>
  );
}
