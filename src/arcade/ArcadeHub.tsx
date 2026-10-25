import { useMemo, useRef, useState } from 'react';
import { useMenuNav } from '../app/hooks';
import { uiStore } from '../game/bridge';
import { levelSummaries } from '../game/levels';
import { audio } from '../game/systems/audio';
import { GAMES, type ArcadeGame } from './games';
import { InstallButton } from './InstallButton';
import { useMenuMusic } from './menuMusic';
import { PROFILE } from './profile';

function GameCard({ game, progress, onPlay }: { game: ArcadeGame; progress?: string; onPlay: () => void }) {
  const playable = game.status === 'play';
  return (
    <button
      data-nav
      className={`game-card ${playable ? 'is-playable' : 'is-soon'}`}
      style={{ '--c1': game.colors[0], '--c2': game.colors[1] } as React.CSSProperties}
      onClick={onPlay}
      aria-label={playable ? `Play ${game.title}` : `${game.title}, coming soon`}
    >
      <span className="game-cover" aria-hidden="true">
        {game.cover ? (
          <img className="game-cover-img" src={import.meta.env.BASE_URL + game.cover} alt="" draggable={false} />
        ) : (
          <span className="game-emblem">{game.emblem}</span>
        )}
        {!playable && <span className="soon-ribbon">Coming soon</span>}
      </span>
      <span className="game-meta">
        <span className="game-name">{game.title}</span>
        <span className="game-genre">{game.genre}</span>
        <span className="game-tagline">{game.tagline}</span>
        {progress && <span className="game-progress">{progress}</span>}
      </span>
    </button>
  );
}

/** Home menu of the arcade: every game, playable or coming soon. */
export function ArcadeHub() {
  const ref = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState('');
  useMenuNav(ref, 'hub');
  const soundLocked = useMenuMusic();

  const boppleProgress = useMemo(() => {
    const levels = levelSummaries();
    const cleared = levels.filter((l) => l.completed).length;
    return cleared ? `${cleared} / ${levels.length} levels cleared` : `${levels.length} levels`;
  }, []);

  const open = (game: ArcadeGame) => {
    audio.unlock();
    if (game.status !== 'play') {
      audio.play('uiMove');
      setNotice(`${game.title} is coming soon!`);
      return;
    }
    audio.play('uiSelect');
    uiStore.set({ screen: 'title' });
  };

  return (
    <div className="arcade-hub">
      <div className="hub-backdrop" aria-hidden="true">
        <div className="hub-stars" />
        <div className="hub-grid" />
      </div>
      <div className="hub-content" ref={ref}>
        <header className="hub-header">
          <h1 className="hub-title">
            <span>RETRO</span> ARCADE <span>REVIVAL</span>
          </h1>
          <p className="hub-subtitle">Pick a game. Play in seconds.</p>
          <InstallButton />
        </header>
        <div className="game-grid">
          {GAMES.map((game) => (
            <GameCard key={game.id} game={game} progress={game.id === 'bopple' ? boppleProgress : undefined} onPlay={() => open(game)} />
          ))}
        </div>
        <p className="hub-notice" role="status">
          {notice || (soundLocked ? '♪ Press any key or click for sound' : '')}
        </p>
        <p className="hub-credit">Made by {PROFILE.name}</p>
      </div>
    </div>
  );
}
