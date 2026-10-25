import { useRef, useState } from 'react';
import { gameCommands } from '../../game/bridge';
import { getLevel, nextLevelId } from '../../game/levels';
import { audio } from '../../game/systems/audio';
import { InitialsEntry } from '../components/InitialsEntry';
import { formatTime } from '../format';
import { useMenuNav, useUi } from '../hooks';

function signedTime(ms: number): string {
  return `${ms < 0 ? '-' : '+'}${formatTime(Math.abs(ms))}`;
}

export function CompleteScreen() {
  const ref = useRef<HTMLDivElement>(null);
  const result = useUi((s) => s.result);
  const levelName = useUi((s) => s.levelName);
  const bank = useUi((s) => s.seedsBank);
  // A new top-5 record asks for initials first; menus take over afterwards.
  const [naming, setNaming] = useState(() => (result ? result.rank >= 0 : false));
  useMenuNav(ref, naming ? 'complete-naming' : 'complete');

  if (!result) return null;
  const allSeeds = result.collected === result.total;
  const campaign = result.mode === 'campaign';
  const nextId = campaign ? nextLevelId(result.levelId) : null;
  const title =
    result.mode === 'bossrush'
      ? result.cleared
        ? 'Boss Rush cleared!'
        : 'Boss Rush over'
      : result.mode === 'timeattack'
        ? 'Time Attack'
        : result.mode === 'coop'
          ? 'Co-op victory!'
          : result.finale
            ? 'You beat Baron Murk!'
            : 'Level clear!';

  return (
    <div className="overlay">
      <div className="panel complete-panel" ref={ref} role="dialog" aria-modal="true" aria-labelledby="complete-title">
        <h2 id="complete-title">{title}</h2>
        <p className="level-name">{result.mode === 'bossrush' ? 'Every boss, back to back' : levelName}</p>
        <dl className="stats">
          {result.mode === 'bossrush' && (
            <>
              <dt>Bosses beaten</dt>
              <dd>{result.bosses ?? 0}</dd>
            </>
          )}
          <dt>Time</dt>
          <dd>
            {formatTime(result.timeMs)}
            {result.newBest && <span className="badge">BEST!</span>}
          </dd>
          {result.mode === 'timeattack' && (
            <>
              <dt>Vs ghost</dt>
              <dd className={result.ghostDeltaMs !== null && (result.ghostDeltaMs ?? 0) < 0 ? 'good' : ''}>
                {result.ghostDeltaMs === null || result.ghostDeltaMs === undefined ? 'First run: ghost saved' : signedTime(result.ghostDeltaMs)}
              </dd>
            </>
          )}
          <dt>Best</dt>
          <dd>{formatTime(result.bestTimeMs)}</dd>
          <dt>Sun seeds</dt>
          <dd>
            {result.collected}
            {result.mode !== 'bossrush' && ` / ${result.total}`}
            {allSeeds && result.mode !== 'bossrush' && <span className="badge">ALL!</span>}
          </dd>
          <dt>Seed bank</dt>
          <dd>
            +{result.banked} → {bank}
          </dd>
          {result.mode !== 'bossrush' && (
            <>
              <dt>Falls</dt>
              <dd>{result.deaths}</dd>
            </>
          )}
          {result.secretFound && (
            <>
              <dt>Secret</dt>
              <dd className="good">★ Found!</dd>
            </>
          )}
        </dl>

        {naming ? (
          <InitialsEntry board={result.board} rank={result.rank} onDone={() => setNaming(false)} />
        ) : (
          <>
            {nextId && (
              <button
                data-nav
                className="btn btn-primary"
                onClick={() => {
                  audio.play('uiSelect');
                  gameCommands.send({ type: 'start', levelId: nextId });
                }}
              >
                Next: {getLevel(nextId).name}
              </button>
            )}
            {campaign && !nextId && (
              <p className="all-clear">
                {result.finale
                  ? 'The Murklings are gone and sunny skies are back. Try Boss Rush and Time Attack in Extras!'
                  : 'You cleared every level!'}
              </p>
            )}
            <button
              data-nav
              className={`btn ${nextId ? '' : 'btn-primary'}`}
              onClick={() => {
                audio.play('uiSelect');
                gameCommands.send({ type: 'restartLevel' });
              }}
            >
              {result.mode === 'timeattack' ? 'Race again' : 'Play again'}
            </button>
            <button
              data-nav
              className="btn btn-ghost"
              onClick={() => {
                audio.play('uiSelect');
                gameCommands.send({ type: 'quitToTitle' });
              }}
            >
              Title screen
            </button>
            <p className="hint">Spend seeds in Extras → Skin Shop. Records are saved on this device.</p>
          </>
        )}
      </div>
    </div>
  );
}
