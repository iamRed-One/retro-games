import { audio } from '../../game/systems/audio';
import { useUi } from '../hooks';

function ChannelRow({
  label,
  on,
  volume,
  toggle,
  change,
}: {
  label: string;
  on: boolean;
  volume: number;
  toggle: () => void;
  change: (delta: number) => void;
}) {
  const level = on ? Math.round(volume * 10) : 0;
  return (
    <div className="sound-row" role="group" aria-label={label}>
      <button data-nav className="btn btn-small sound-toggle" aria-pressed={on} onClick={toggle}>
        {label}: {on ? 'on' : 'off'}
      </button>
      <button data-nav className="btn btn-small btn-square" aria-label={`${label} volume down`} onClick={() => change(-0.1)}>
        −
      </button>
      <span className="volume" aria-label={`${label} volume ${level} of 10`}>
        {level}
      </span>
      <button data-nav className="btn btn-small btn-square" aria-label={`${label} volume up`} onClick={() => change(0.1)}>
        +
      </button>
    </div>
  );
}

/**
 * Separate Music and Effects channels. Turning game music off is the "bring your own music"
 * mode: play Spotify or YouTube Music alongside and keep the gameplay sounds.
 */
export function SoundControls() {
  const musicOn = useUi((s) => s.musicOn);
  const musicVolume = useUi((s) => s.musicVolume);
  const sfxOn = useUi((s) => s.sfxOn);
  const sfxVolume = useUi((s) => s.sfxVolume);

  return (
    <div className="sound-controls">
      <ChannelRow
        label="Music"
        on={musicOn}
        volume={musicVolume}
        toggle={() => {
          audio.unlock();
          audio.setMusicOn(!musicOn);
          audio.play('uiSelect');
        }}
        change={(d) => {
          audio.unlock();
          audio.setMusicVolume((musicOn ? musicVolume : 0) + d);
        }}
      />
      <ChannelRow
        label="Effects"
        on={sfxOn}
        volume={sfxVolume}
        toggle={() => {
          audio.unlock();
          audio.setSfxOn(!sfxOn);
          audio.play('uiSelect');
        }}
        change={(d) => {
          audio.unlock();
          audio.setSfxVolume((sfxOn ? sfxVolume : 0) + d);
          audio.play('uiMove');
        }}
      />
      {!musicOn && <p className="hint own-music">Playing your own music? Effects keep working alongside Spotify or YouTube Music.</p>}
    </div>
  );
}
