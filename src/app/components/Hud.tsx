import { gameCommands } from '../../game/bridge';
import { formatPrompt, formatTime } from '../format';
import { useUi } from '../hooks';
import { FullscreenButton } from './FullscreenButton';

export function Hud() {
  const collected = useUi((s) => s.collected);
  const total = useUi((s) => s.total);
  const timeMs = useUi((s) => s.timeMs);
  const toast = useUi((s) => s.toast);
  const prompt = useUi((s) => s.prompt);
  const device = useUi((s) => s.device);
  const padConnected = useUi((s) => s.gamepad.connected);
  const mode = useUi((s) => s.mode);
  const hp = useUi((s) => s.hp);
  const maxHp = useUi((s) => s.maxHp);
  const boss = useUi((s) => s.boss);
  const power = useUi((s) => s.power);
  const hp2 = useUi((s) => s.hp2);

  return (
    <div className="hud">
      <div className="hud-bar">
        <div className="hud-left">
          <div className="hud-chip" aria-label={mode === 'shooter' ? `Sun seeds ${collected}` : `Sun seeds ${collected} of ${total}`}>
            <span className="seed-icon" aria-hidden="true" />
            {mode === 'shooter' ? collected : `${collected}/${total}`}
          </div>
          {mode === 'shooter' && power && (
            <div className={`hud-chip hud-power power-${power}`}>{power === 'spread' ? 'SPREAD' : power === 'rapid' ? 'RAPID' : 'SHIELD'}</div>
          )}
          {mode === 'shooter' && (
            <div className="hud-chip hud-hearts" aria-label={`${hp} of ${maxHp} hearts`}>
              {hp2 !== null && <span className="player-tag">P1</span>}
              {Array.from({ length: maxHp }, (_, i) => (
                <span key={i} className={`heart-icon ${i < hp ? '' : 'is-empty'}`} aria-hidden="true" />
              ))}
            </div>
          )}
          {mode === 'shooter' && hp2 !== null && (
            <div className="hud-chip hud-hearts p2" aria-label={`Player 2: ${hp2} of ${maxHp} hearts`}>
              <span className="player-tag">P2</span>
              {Array.from({ length: maxHp }, (_, i) => (
                <span key={i} className={`heart-icon ${i < hp2 ? '' : 'is-empty'}`} aria-hidden="true" />
              ))}
            </div>
          )}
        </div>
        <div className="hud-chip hud-time" aria-label="Time">
          {formatTime(timeMs)}
        </div>
        <div className="hud-right">
          {padConnected && (
            <span className="hud-chip hud-pad" title="Controller connected">
              PAD
            </span>
          )}
          <FullscreenButton className="hud-pause" />
          <button
            className="hud-pause"
            aria-label="Pause"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => gameCommands.send({ type: 'pause' })}
          >
            II
          </button>
        </div>
      </div>
      {boss && (
        <div className="boss-bar" role="progressbar" aria-label={boss.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(boss.hp * 100)}>
          <span className="boss-name">{boss.name}</span>
          <span className="boss-track">
            <span className="boss-fill" style={{ transform: `scaleX(${boss.hp})` }} />
          </span>
        </div>
      )}
      {toast && (
        <div key={toast.id} className="toast" role="status">
          {toast.text}
        </div>
      )}
      {prompt && (
        <div key={prompt} className="prompt" role="status">
          {formatPrompt(prompt, device)}
        </div>
      )}
    </div>
  );
}
