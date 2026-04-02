'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';
import type { ShockEvent } from '@/lib/types';

const DISMISS_KEY = 'signal_breaking_dismissed';

export default function BreakingAlertBanner() {
  const { lang } = useLanguage();
  const [topShock, setTopShock] = useState<ShockEvent | null>(null);
  const [dismissed, setDismissed] = useState(true); // start hidden; reveal after hydration

  useEffect(() => {
    // Check session dismiss
    const key = sessionStorage.getItem(DISMISS_KEY);
    if (key) return; // already dismissed this session

    fetch('/api/shocks')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const shocks: ShockEvent[] = data?.shocks ?? [];
        const high = shocks.filter(s => s.confidence === 'high' && s.status !== 'fading');
        if (high.length > 0) {
          setTopShock(high[0]);
          setDismissed(false);
        }
      })
      .catch(() => {});
  }, []);

  if (dismissed || !topShock) return null;

  const headline = lang === 'he' ? topShock.headline?.he : topShock.headline?.en;
  const typeIcon = topShock.type === 'likelihood' ? '📈' : topShock.type === 'narrative' ? '🗣️' : '💥';

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(DISMISS_KEY, '1');
  };

  return (
    <div className="fixed top-16 inset-x-0 z-40 pointer-events-none">
      <div
        dir={lang === 'he' ? 'rtl' : 'ltr'}
        className="pointer-events-auto mx-auto max-w-3xl mt-2 mx-4 rounded-xl border border-red-500/40 bg-red-500/10 backdrop-blur-sm px-4 py-2.5 flex items-center gap-3 shadow-lg shadow-red-500/10 animate-slide-down"
      >
        {/* Pulsing dot */}
        <span className="shrink-0 w-2 h-2 rounded-full bg-red-500 animate-pulse" />

        {/* Badge */}
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded">
          {lang === 'he' ? '⚡ זעזוע פעיל' : '⚡ ACTIVE SHOCK'}
        </span>

        <span className="shrink-0 text-sm">{typeIcon}</span>

        {/* Headline */}
        <p className="flex-1 text-sm text-red-100 font-medium truncate">{headline}</p>

        {/* Delta */}
        {topShock.delta !== 0 && (
          <span className={`shrink-0 text-sm font-black ${topShock.delta > 0 ? 'text-orange-400' : 'text-blue-400'}`}>
            {topShock.delta > 0 ? '+' : ''}{topShock.delta}%
          </span>
        )}

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="shrink-0 text-red-400/60 hover:text-red-400 transition-colors text-lg leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
