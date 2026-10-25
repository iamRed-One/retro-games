import { useEffect, useState } from 'react';
import { audio } from '../game/systems/audio';

const TRACK = 'arcade';
const ALBUM = 'Retro Arcade Revival';

/**
 * Plays the arcade theme on menu screens. Browsers only allow sound after a user gesture, so
 * until then it waits for the first click or key press. Returns true while sound is still
 * locked, so the menu can show a hint.
 */
export function useMenuMusic(): boolean {
  const [locked, setLocked] = useState(() => audio.context?.state !== 'running');

  useEffect(() => {
    const start = () => {
      audio.unlock();
      audio.playTrack(TRACK, ALBUM);
      setLocked(false);
    };
    if (audio.context?.state === 'running') {
      start();
      return;
    }
    window.addEventListener('pointerdown', start, { once: true });
    window.addEventListener('keydown', start, { once: true });
    return () => {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
    };
  }, []);

  return locked;
}
