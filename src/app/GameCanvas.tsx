import { useEffect, useRef } from 'react';
import { createGame } from '../game/createGame';

/** Owns the Phaser lifecycle: created once on mount, destroyed on unmount. */
export function GameCanvas() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const handle = createGame(ref.current);
    return () => handle.destroy();
  }, []);

  return <div ref={ref} className="game-canvas" />;
}
