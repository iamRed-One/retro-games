import { useEffect, useState } from 'react';
import { useUi } from '../hooks';

/** Slides in when an achievement unlocks. */
export function AchievementBanner() {
  const achievement = useUi((s) => s.achievement);
  const [visibleId, setVisibleId] = useState<number | null>(null);

  useEffect(() => {
    if (!achievement) return;
    setVisibleId(achievement.id);
    const t = window.setTimeout(() => setVisibleId(null), 3600);
    return () => window.clearTimeout(t);
  }, [achievement]);

  if (!achievement || visibleId !== achievement.id) return null;
  return (
    <div key={achievement.id} className="achievement-banner" role="status">
      <span className="trophy" aria-hidden="true">
        ★
      </span>
      <span>
        <small>Achievement unlocked</small>
        {achievement.title}
      </span>
    </div>
  );
}
