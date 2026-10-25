import { useEffect, useState } from 'react';
import { TUNING, TUNING_DEFAULTS, TUNING_RANGES, type TuningKey } from '../../game/physics/tuning';

/** Dev-only live movement tuning (concept brief §14, phase 2). Toggle with the ` key. */
export function TuningPanel() {
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Backquote') setOpen((o) => !o);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return null;
  const keys = Object.keys(TUNING_RANGES) as TuningKey[];

  return (
    <div className="tuning-panel" onKeyDown={(e) => e.stopPropagation()}>
      <strong>Tuning (dev)</strong>
      {keys.map((key) => {
        const [min, max, step] = TUNING_RANGES[key]!;
        return (
          <label key={key}>
            <span>
              {key} <b>{TUNING[key]}</b>
            </span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={TUNING[key]}
              onChange={(e) => {
                TUNING[key] = Number(e.target.value);
                force((n) => n + 1);
              }}
            />
          </label>
        );
      })}
      <button
        onClick={() => {
          Object.assign(TUNING, TUNING_DEFAULTS);
          force((n) => n + 1);
        }}
      >
        Reset
      </button>
      <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(TUNING, null, 2)).catch(() => {})}>Copy JSON</button>
    </div>
  );
}
