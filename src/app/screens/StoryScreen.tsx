import { useEffect, useRef, useState } from 'react';
import { gameCommands, uiStore } from '../../game/bridge';
import { input } from '../../game/input/InputManager';
import { STORY, type StoryLine } from '../../game/story';
import { audio } from '../../game/systems/audio';
import { save } from '../../game/systems/save';
import { useUi } from '../hooks';

/** Pixel portraits drawn as SVG so they stay crisp at any size. */
function Portrait({ line }: { line: StoryLine }) {
  if (line.speaker === 'narrator') return null;
  if (line.speaker === 'bopple') {
    return (
      <svg className="portrait" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="#7a2e12" />
        <circle cx="8" cy="8" r="6" fill="#ff8a3d" />
        <rect x="5" y="5" width="2" height="3" fill="#fff" />
        <rect x="9" y="5" width="2" height="3" fill="#fff" />
        <rect x="6" y="6" width="1" height="2" fill="#10142a" />
        <rect x="10" y="6" width="1" height="2" fill="#10142a" />
        <rect x="6" y="10" width="4" height="1" fill="#7a2e12" />
        <rect x="4" y="4" width="1" height="1" fill="#ffd0a0" />
      </svg>
    );
  }
  const body = line.speaker === 'baron' ? '#6e56a0' : line.color ?? '#6e56a0';
  return (
    <svg className="portrait" viewBox="0 0 20 16" shapeRendering="crispEdges" aria-hidden="true">
      <circle cx="6" cy="10" r="5" fill={body} />
      <circle cx="14" cy="10" r="5" fill={body} />
      <circle cx="10" cy="8" r="6" fill={body} />
      {line.speaker === 'baron' && <rect x="6" y="1" width="8" height="2" fill="#ffd23f" />}
      {line.speaker === 'baron' && <rect x="6" y="0" width="1" height="1" fill="#ffd23f" />}
      {line.speaker === 'baron' && <rect x="9" y="0" width="2" height="1" fill="#ffd23f" />}
      {line.speaker === 'baron' && <rect x="13" y="0" width="1" height="1" fill="#ffd23f" />}
      <rect x="5" y="6" width="3" height="1" fill="#10142a" />
      <rect x="12" y="6" width="3" height="1" fill="#10142a" />
      <rect x="6" y="7" width="2" height="2" fill="#fff" />
      <rect x="12" y="7" width="2" height="2" fill="#fff" />
      <rect x="7" y="8" width="1" height="1" fill="#ff4d5e" />
      <rect x="12" y="8" width="1" height="1" fill="#ff4d5e" />
      <rect x="8" y="11" width="4" height="1" fill="#10142a" />
    </svg>
  );
}

function speakerName(line: StoryLine): string {
  if (line.speaker === 'bopple') return 'Bopple';
  if (line.speaker === 'baron') return 'Baron Murk';
  if (line.speaker === 'boss') return line.name ?? '???';
  return '';
}

/**
 * Comic-style dialogue before a world (or the ending). Advance with Bounce, Enter, click or
 * tap; Skip jumps straight in. Lines type out letter by letter.
 */
export function StoryScreen() {
  const storyId = useUi((s) => s.storyLevel) ?? 'meadow';
  const scene = STORY[storyId];
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(0);
  const finishing = useRef(false);
  const line = scene?.lines[index];

  const finish = () => {
    if (finishing.current) return;
    finishing.current = true;
    save.markStorySeen(storyId);
    const { storyReplay } = uiStore.get();
    if (storyReplay) uiStore.set({ screen: 'title', storyLevel: null, storyReplay: false });
    else if (storyId === 'ending') uiStore.set({ screen: 'complete', storyLevel: null });
    else gameCommands.send({ type: 'start', levelId: storyId, skipStory: true });
  };

  const advance = () => {
    if (!line) return;
    if (shown < line.text.length) {
      setShown(line.text.length);
      return;
    }
    audio.play('uiMove');
    if (index + 1 < scene.lines.length) {
      setIndex(index + 1);
      setShown(0);
    } else {
      finish();
    }
  };

  // Typewriter effect.
  useEffect(() => {
    if (!line || shown >= line.text.length) return;
    const t = window.setTimeout(() => setShown((n) => Math.min(line.text.length, n + 2)), 22);
    return () => window.clearTimeout(t);
  }, [line, shown]);

  const advanceRef = useRef(advance);
  advanceRef.current = advance;
  useEffect(
    () =>
      input.onPress((action, device) => {
        if (action === 'bounce' && device !== 'keyboard') advanceRef.current();
        if (action === 'pause') finish();
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp') {
        e.preventDefault();
        advanceRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!scene || !line) return null;
  const right = line.speaker !== 'bopple' && line.speaker !== 'narrator';

  return (
    <div className="overlay story-overlay" onPointerDown={advance} role="dialog" aria-label={scene.title}>
      <p className="story-title">{scene.title}</p>
      <div className={`story-box ${right ? 'is-right' : ''} ${line.speaker === 'narrator' ? 'is-narrator' : ''}`}>
        <Portrait line={line} />
        <div className="story-text">
          {speakerName(line) && <span className="story-speaker">{speakerName(line)}</span>}
          <p aria-live="polite">{line.text.slice(0, shown)}</p>
        </div>
      </div>
      <div className="story-footer">
        <span className="hint">
          {index + 1} / {scene.lines.length} · press Bounce, Enter or tap to continue
        </span>
        <button
          className="btn btn-ghost btn-small story-skip"
          onPointerDown={(e) => {
            e.stopPropagation();
            finish();
          }}
        >
          Skip ▶▶
        </button>
      </div>
    </div>
  );
}
