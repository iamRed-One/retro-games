import { useState } from 'react';
import { gameCommands, uiStore } from '../../game/bridge';
import { unlockAll } from '../../game/levels';
import { BOSSES } from '../../game/shooter/bosses';
import { STORY, STORY_ORDER } from '../../game/story';
import { audio } from '../../game/systems/audio';
import { save } from '../../game/systems/save';
import { LevelSelect } from './LevelSelect';
import { AchievementsList, HallOfFame } from './Records';
import { Shop } from './Shop';

export type ExtrasView = 'menu' | 'timeattack' | 'coop' | 'bossrush' | 'shop' | 'achievements' | 'hall' | 'story';

const BOSS_ORDER = ['grumble', 'crag', 'gustav', 'ripple', 'nimbus', 'ink', 'magmaw', 'volt', 'eclipse', 'baron'];

function BossRush({ onBack }: { onBack: () => void }) {
  const beaten = save.get().bossesBeaten;
  const bosses = unlockAll ? BOSS_ORDER : BOSS_ORDER.filter((id) => beaten.includes(id));
  const ready = bosses.length >= 2;
  return (
    <div className="bossrush-panel">
      <h2>Boss Rush</h2>
      <p className="hint">Every boss you have beaten, back to back. You get one heart back after each boss. One knockout ends the run.</p>
      <ol className="rush-list">
        {BOSS_ORDER.map((id) => (
          <li key={id} className={bosses.includes(id) ? 'is-in' : ''}>
            {bosses.includes(id) ? BOSSES[id].name : '???'}
          </li>
        ))}
      </ol>
      {ready ? (
        <button
          data-nav
          className="btn btn-primary"
          onClick={() => {
            audio.play('uiSelect');
            gameCommands.send({ type: 'bossrush', bosses });
          }}
        >
          Start ({bosses.length} bosses)
        </button>
      ) : (
        <p className="all-clear">Beat at least 2 bosses in the campaign to unlock Boss Rush.</p>
      )}
      <button data-nav className="btn btn-ghost" onClick={onBack}>
        Back
      </button>
    </div>
  );
}

function StoryReplay({ onBack }: { onBack: () => void }) {
  const seen = save.get().storySeen;
  const chapters = STORY_ORDER.filter((id) => seen.includes(id));
  return (
    <div className="story-replay">
      <h2>Story so far</h2>
      {chapters.length ? (
        <div className="btn-column">
          {chapters.map((id) => (
            <button
              data-nav
              key={id}
              className="btn btn-small"
              onClick={() => {
                audio.play('uiSelect');
                uiStore.set({ screen: 'story', storyLevel: id, storyReplay: true });
              }}
            >
              {STORY[id].title}
            </button>
          ))}
        </div>
      ) : (
        <p className="hint">Play the campaign to unlock story scenes.</p>
      )}
      <button data-nav className="btn btn-ghost" onClick={onBack}>
        Back
      </button>
    </div>
  );
}

/** Extra modes and collections, reached from Bopple's title screen. */
export function Extras({ view, setView, onBack }: { view: ExtrasView; setView: (v: ExtrasView) => void; onBack: () => void }) {
  const [hint, setHint] = useState('');
  const back = () => setView('menu');
  const open = (v: ExtrasView, text: string) => ({
    onClick: () => {
      audio.play('uiSelect');
      setView(v);
    },
    onFocus: () => setHint(text),
  });

  switch (view) {
    case 'timeattack':
      return (
        <LevelSelect
          title="Time Attack"
          subtitle="Platform part only. Race your best run's ghost!"
          onBack={back}
          onPick={(id) => gameCommands.send({ type: 'start', levelId: id, mode: 'timeattack' })}
        />
      );
    case 'coop':
      return (
        <LevelSelect
          title="Co-op Sky Battle"
          subtitle="P1: WASD + Space · P2: Arrows + Enter · or two gamepads"
          onBack={back}
          onPick={(id) => gameCommands.send({ type: 'start', levelId: id, mode: 'coop' })}
        />
      );
    case 'bossrush':
      return <BossRush onBack={back} />;
    case 'shop':
      return <Shop onBack={back} />;
    case 'achievements':
      return <AchievementsList onBack={back} />;
    case 'hall':
      return <HallOfFame onBack={back} />;
    case 'story':
      return <StoryReplay onBack={back} />;
    default:
      return (
        <div className="extras">
          <h2>Extras</h2>
          <div className="extras-grid">
            <button data-nav className="btn" {...open('timeattack', 'Race the clock and your own ghost')}>
              ⏱ Time Attack
            </button>
            <button data-nav className="btn" {...open('bossrush', 'Fight every boss you have beaten')}>
              ☠ Boss Rush
            </button>
            <button data-nav className="btn" {...open('coop', 'Two players in a sky battle')}>
              ♥ Co-op
            </button>
            <button data-nav className="btn btn-secondary" {...open('shop', 'Spend sun seeds on ball skins')}>
              ◐ Skin Shop
            </button>
            <button data-nav className="btn btn-secondary" {...open('achievements', 'Badges you have earned')}>
              ★ Achievements
            </button>
            <button data-nav className="btn btn-secondary" {...open('hall', 'Your best times')}>
              ♛ Hall of Fame
            </button>
            <button data-nav className="btn btn-ghost" {...open('story', 'Rewatch story scenes')}>
              ✎ Story
            </button>
            <button data-nav className="btn btn-ghost" onClick={onBack}>
              Back
            </button>
          </div>
          <p className="hint">{hint}</p>
        </div>
      );
  }
}
