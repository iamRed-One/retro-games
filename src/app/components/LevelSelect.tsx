import { useMemo } from 'react';
import { gameCommands } from '../../game/bridge';
import { levelSummaries } from '../../game/levels';
import { audio } from '../../game/systems/audio';
import { save } from '../../game/systems/save';
import { formatTime } from '../format';

interface Props {
  onBack: () => void;
  /** Mode-specific screens (Time Attack, Co-op) pick a level instead of starting the campaign. */
  onPick?: (levelId: string) => void;
  title?: string;
  subtitle?: string;
}

export function LevelSelect({ onBack, onPick, title = 'Levels', subtitle }: Props) {
  const levels = useMemo(() => levelSummaries(), []);
  const secrets = save.get().secrets;

  return (
    <div className="level-select">
      <h2>{title}</h2>
      {subtitle && <p className="hint level-subtitle">{subtitle}</p>}
      <ul className="level-list">
        {levels.map((level) => (
          <li key={level.id}>
            <button
              data-nav
              className={`level-card ${level.completed ? 'is-done' : ''}`}
              disabled={!level.unlocked}
              onClick={() => {
                audio.unlock();
                audio.play('uiSelect');
                if (onPick) onPick(level.id);
                else gameCommands.send({ type: 'start', levelId: level.id });
              }}
            >
              <span className="level-number">{level.unlocked ? level.number : '🔒'}</span>
              <span className="level-info">
                <span className="level-title">
                  {level.name}
                  {secrets.includes(level.id) && (
                    <span className="secret-star" title="Secret room found">
                      {' '}
                      ★
                    </span>
                  )}
                </span>
                <span className="level-meta">
                  {level.unlocked
                    ? level.completed
                      ? `Best ${formatTime(level.bestTimeMs ?? 0)} · ${level.bestSeeds}/${level.totalSeeds} seeds`
                      : `${level.totalSeeds} seeds to find`
                    : 'Clear the previous level to unlock'}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button data-nav className="btn btn-ghost" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
