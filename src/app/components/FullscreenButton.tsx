import { useEffect, useState } from 'react';

/** iPhone Safari has no element fullscreen; the button hides itself where unsupported. */
export const fullscreenSupported = typeof document !== 'undefined' && !!document.fullscreenEnabled;

export function toggleFullscreen(): void {
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  else void document.documentElement.requestFullscreen?.().catch(() => {});
}

function useIsFullscreen(): boolean {
  const [on, setOn] = useState(() => !!document.fullscreenElement);
  useEffect(() => {
    const sync = () => setOn(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  return on;
}

/** `F` toggles fullscreen anywhere (ignored while typing in a field). */
export function useFullscreenHotkey(): void {
  useEffect(() => {
    if (!fullscreenSupported) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyF' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      toggleFullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export function FullscreenButton({ className, nav = false }: { className: string; nav?: boolean }) {
  const on = useIsFullscreen();
  if (!fullscreenSupported) return null;
  return (
    <button
      {...(nav ? { 'data-nav': true } : {})}
      className={className}
      aria-label={on ? 'Exit fullscreen' : 'Fullscreen'}
      title={on ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={toggleFullscreen}
    >
      {nav ? (on ? 'Exit fullscreen' : 'Fullscreen') : on ? '⤡' : '⤢'}
    </button>
  );
}
