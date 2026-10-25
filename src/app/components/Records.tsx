import { useMemo, useState } from 'react';
import { LEVEL_ORDER } from '../../game/levels';
import { ACHIEVEMENT_IDS, ACHIEVEMENTS } from '../../game/systems/achievements';
import { save } from '../../game/systems/save';
import { formatTime } from '../format';

export function AchievementsList({ onBack }: { onBack: () => void }) {
  const data = save.get();
  const unlocked = ACHIEVEMENT_IDS.filter((id) => data.achievements[id]).length;
  return (
    <div className="achievements">
      <h2>Achievements</h2>
      <p className="bank">
        {unlocked} / {ACHIEVEMENT_IDS.length} unlocked
      </p>
      <ul className="achievement-list">
        {ACHIEVEMENT_IDS.map((id) => {
          const a = ACHIEVEMENTS[id];
          const done = !!data.achievements[id];
          return (
            <li key={id} className={`achievement ${done ? 'is-done' : ''}`}>
              <span className="achievement-icon" aria-hidden="true">
                {done ? a.icon : '?'}
              </span>
              <span className="achievement-text">
                <span className="achievement-title">{a.title}</span>
                <span className="achievement-desc">{a.description}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="hint">
        Murklings popped: {data.stomps} · Sky villains defeated: {data.skyKills} · Secrets: {data.secrets.length} / 10
      </p>
      <button data-nav className="btn btn-ghost" onClick={onBack}>
        Back
      </button>
    </div>
  );
}

interface BoardOption {
  key: string;
  label: string;
}

/** Local leaderboards: top 5 per level (campaign and Time Attack), Boss Rush and co-op. */
export function HallOfFame({ onBack }: { onBack: () => void }) {
  const boards = useMemo<BoardOption[]>(
    () => [
      ...LEVEL_ORDER.map((l, i) => ({ key: `lvl:${l.id}`, label: `${i + 1}. ${l.name}` })),
      ...LEVEL_ORDER.map((l, i) => ({ key: `ta:${l.id}`, label: `Time Attack ${i + 1}. ${l.name}` })),
      { key: 'bossrush', label: 'Boss Rush' },
      ...LEVEL_ORDER.map((l, i) => ({ key: `coop:${l.id}`, label: `Co-op ${i + 1}. ${l.name}` })),
    ],
    [],
  );
  const [index, setIndex] = useState(0);
  const board = boards[index];
  const entries = save.board(board.key);
  const cycle = (d: number) => setIndex((i) => (i + d + boards.length) % boards.length);

  return (
    <div className="hall">
      <h2>Hall of Fame</h2>
      <div className="board-picker">
        <button data-nav className="btn btn-small btn-square" aria-label="Previous board" onClick={() => cycle(-1)}>
          ◀
        </button>
        <span className="board-name">{board.label}</span>
        <button data-nav className="btn btn-small btn-square" aria-label="Next board" onClick={() => cycle(1)}>
          ▶
        </button>
      </div>
      {entries.length ? (
        <ol className="board">
          {entries.map((e, i) => (
            <li key={i}>
              <span className="board-rank">{i + 1}</span>
              <span className="board-who">{e.name}</span>
              <span className="board-score">{e.bosses !== undefined ? `${e.bosses} bosses · ${formatTime(e.timeMs)}` : formatTime(e.timeMs)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="hint">No records yet. Go set one!</p>
      )}
      <p className="hint">Records are kept on this device. Online leaderboards can be added later.</p>
      <button data-nav className="btn btn-ghost" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
