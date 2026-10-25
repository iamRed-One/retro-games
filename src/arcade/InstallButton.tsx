import { useEffect, useState } from 'react';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
// Capture the browser's install offer as early as possible (it fires once per page load).
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches;

/**
 * "Install app" on the arcade menu. Shown only when the browser offers installation (Chrome,
 * Edge, Android) and the arcade isn't already running as an installed app.
 */
export function InstallButton() {
  const [available, setAvailable] = useState(() => !!deferred && !isStandalone());

  useEffect(() => {
    const sync = () => setAvailable(!!deferred && !isStandalone());
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  if (!available) return null;
  return (
    <button
      data-nav
      className="install-btn"
      title="Install Retro Arcade as an app: opens in its own window, pin it to your taskbar, plays offline"
      onClick={async () => {
        if (!deferred) return;
        await deferred.prompt();
        await deferred.userChoice;
        deferred = null;
        setAvailable(false);
      }}
    >
      ⬇ Install app
    </button>
  );
}
