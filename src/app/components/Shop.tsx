import { useEffect, useRef, useState } from 'react';
import { SKINS, skinColorAt, type SkinDef } from '../../game/art/skins';
import { gameCommands } from '../../game/bridge';
import { audio } from '../../game/systems/audio';
import { save } from '../../game/systems/save';
import { useUi } from '../hooks';

/** Pixel preview of a skin, drawn with the same colors the game uses. */
export function SkinPreview({ skin, size = 48 }: { skin: SkinDef; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const g = ref.current?.getContext('2d');
    if (!g) return;
    g.clearRect(0, 0, 12, 12);
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
        const c = skinColorAt(skin, x, y);
        if (c) {
          g.fillStyle = c;
          g.fillRect(x, y, 1, 1);
        }
      }
    }
    // Eyes, so it reads as Bopple.
    g.fillStyle = '#fff';
    g.fillRect(3, 3, 2, 3);
    g.fillRect(7, 3, 2, 3);
    g.fillStyle = '#10142a';
    g.fillRect(4, 4, 1, 2);
    g.fillRect(8, 4, 1, 2);
  }, [skin]);
  return <canvas ref={ref} width={12} height={12} className="skin-preview" style={{ width: size, height: size }} aria-hidden="true" />;
}

/** Spend banked sun seeds on ball skins. */
export function Shop({ onBack }: { onBack: () => void }) {
  const bank = useUi((s) => s.seedsBank);
  const [, refresh] = useState(0);
  const [message, setMessage] = useState('');
  const owned = save.get().skinsOwned;
  const equipped = save.get().skin;

  const choose = (skin: SkinDef) => {
    if (owned.includes(skin.id)) {
      save.equipSkin(skin.id);
      gameCommands.send({ type: 'applySkin', skin: skin.id });
      audio.play('uiSelect');
      setMessage(`${skin.name} equipped!`);
    } else if (save.buySkin(skin.id, skin.price)) {
      gameCommands.send({ type: 'applySkin', skin: skin.id });
      audio.play('powerup');
      setMessage(`You bought ${skin.name}!`);
    } else {
      audio.play('uiMove');
      setMessage(`You need ${skin.price - bank} more seeds. Collect them in levels and sky battles!`);
    }
    refresh((n) => n + 1);
  };

  return (
    <div className="shop">
      <h2>Skin Shop</h2>
      <p className="bank">
        <span className="seed-icon" aria-hidden="true" /> {bank} seeds to spend
      </p>
      <div className="skin-grid">
        {SKINS.map((skin) => {
          const isOwned = owned.includes(skin.id);
          const isOn = equipped === skin.id;
          return (
            <button data-nav key={skin.id} className={`skin-card ${isOn ? 'is-on' : ''} ${!isOwned && skin.price > bank ? 'is-poor' : ''}`} onClick={() => choose(skin)}>
              <SkinPreview skin={skin} />
              <span className="skin-name">{skin.name}</span>
              <span className="skin-price">{isOn ? 'Equipped' : isOwned ? 'Owned' : `${skin.price} seeds`}</span>
            </button>
          );
        })}
      </div>
      <p className="hint" role="status">
        {message}
      </p>
      <button data-nav className="btn btn-ghost" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
