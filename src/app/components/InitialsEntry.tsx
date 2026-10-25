import { useEffect, useRef, useState } from 'react';
import { input } from '../../game/input/InputManager';
import { audio } from '../../game/systems/audio';
import { save } from '../../game/systems/save';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Arcade-style three-letter initials for a new record. Up/down changes the letter, left/right
 * moves between slots (stick, D-pad or arrows); typing letters works too.
 */
export function InitialsEntry({ board, rank, onDone }: { board: string; rank: number; onDone: () => void }) {
  const [letters, setLetters] = useState(() => save.get().initials.padEnd(3, 'A').slice(0, 3).split(''));
  const [slot, setSlot] = useState(0);
  const state = useRef({ letters, slot });
  state.current = { letters, slot };

  const confirm = () => {
    save.renameScore(board, rank, state.current.letters.join(''));
    audio.play('checkpoint');
    onDone();
  };
  const confirmRef = useRef(confirm);
  confirmRef.current = confirm;

  useEffect(() => {
    const shift = (d: number) => {
      const { letters: l, slot: s } = state.current;
      const i = (LETTERS.indexOf(l[s]) + d + LETTERS.length) % LETTERS.length;
      const next = [...l];
      next[s] = LETTERS[i];
      setLetters(next);
      audio.play('uiMove');
    };
    const offPress = input.onPress((action, device) => {
      if (action === 'up') shift(1);
      if (action === 'down') shift(-1);
      if (action === 'left') setSlot((s) => Math.max(0, s - 1));
      if (action === 'right') setSlot((s) => Math.min(2, s + 1));
      if (action === 'bounce' && device !== 'keyboard') {
        if (state.current.slot < 2) setSlot((s) => s + 1);
        else confirmRef.current();
      }
    });
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      if (k.length === 1 && LETTERS.includes(k)) {
        const { letters: l, slot: s } = state.current;
        const next = [...l];
        next[s] = k;
        setLetters(next);
        setSlot(Math.min(2, s + 1));
        e.preventDefault();
      } else if (e.key === 'Backspace') {
        setSlot((s) => Math.max(0, s - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        confirmRef.current();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      offPress();
      window.removeEventListener('keydown', onKey, true);
    };
  }, []);

  return (
    <div className="initials" role="group" aria-label="Enter your initials">
      <p className="initials-title">New record! #{rank + 1} · Enter your initials</p>
      <div className="initials-slots">
        {letters.map((ch, i) => (
          <button key={i} className={`initial ${i === slot ? 'is-active' : ''}`} onClick={() => setSlot(i)} aria-label={`Letter ${i + 1}: ${ch}`}>
            {ch}
          </button>
        ))}
      </div>
      <button className="btn btn-small" onClick={confirm}>
        Save
      </button>
    </div>
  );
}
