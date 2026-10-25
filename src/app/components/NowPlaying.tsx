import { useEffect, useState } from 'react';
import { useUi } from '../hooks';

const VISIBLE_MS = 4200;

/** Radio-style "Now playing" chip with equalizer bars, shown when a level's track starts. */
export function NowPlaying() {
  const nowPlaying = useUi((s) => s.nowPlaying);
  const musicOn = useUi((s) => s.musicOn);
  const [visibleId, setVisibleId] = useState<number | null>(null);

  useEffect(() => {
    if (!nowPlaying) return;
    setVisibleId(nowPlaying.id);
    const timer = window.setTimeout(() => setVisibleId(null), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [nowPlaying]);

  if (!nowPlaying || !musicOn || visibleId !== nowPlaying.id) return null;
  return (
    <div key={nowPlaying.id} className="now-playing" role="status" aria-label={`Now playing ${nowPlaying.title}`}>
      <span className="eq" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="now-playing-text">
        <small>Now playing</small>
        {nowPlaying.title}
      </span>
    </div>
  );
}
