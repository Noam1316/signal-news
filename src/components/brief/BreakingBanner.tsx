'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/i18n/context';
import type { BriefStory } from '@/lib/types';

interface Props {
  stories: BriefStory[];
}

const THREE_HOURS = 3 * 60 * 60 * 1000;

export default function BreakingBanner({ stories }: Props) {
  const { lang, dir } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  const breakingStories = useMemo(() => {
    const now = Date.now();
    return stories
      .filter(s => {
        if (!s.updatedAt || !s.isSignal) return false;
        const age = now - new Date(s.updatedAt).getTime();
        return s.likelihood >= 75 && age < THREE_HOURS;
      })
      .sort((a, b) => b.likelihood - a.likelihood)
      .slice(0, 3);
  }, [stories]);

  if (breakingStories.length === 0 || dismissed) return null;

  const top = breakingStories[0];
  const headline = lang === 'he' ? top.headline.he : top.headline.en;
  const category = lang === 'he' ? top.category.he : top.category.en;

  return (
    <div dir={dir} className="rounded-xl border border-red-500/50 bg-red-950/30 overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center justify-between px-4 py-2 bg-red-500/15 border-b border-red-500/25">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
            {lang === 'he' ? '🔴 ידיעה שבירה' : '🔴 Breaking'}
          </span>
          {breakingStories.length > 1 && (
            <span className="text-[10px] text-red-400/60">
              {lang === 'he' ? `+${breakingStories.length - 1} נוספים` : `+${breakingStories.length - 1} more`}
            </span>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
          aria-label={lang === 'he' ? 'סגור' : 'Dismiss'}
        >
          ✕
        </button>
      </div>

      {/* Main story */}
      <div className="px-4 py-3 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-red-400/70 font-semibold">{category}</span>
          <span className="text-[10px] text-red-400 font-mono font-bold bg-red-500/10 px-1.5 rounded">
            {top.likelihood}%
          </span>
        </div>
        <p className="text-sm font-semibold text-white leading-snug">{headline}</p>

        {/* Additional breaking stories */}
        {breakingStories.slice(1).map(s => (
          <div key={s.slug} className="flex items-center gap-2 pt-1 border-t border-red-500/10">
            <span className="text-[10px] text-red-400/50 font-mono">{s.likelihood}%</span>
            <p className="text-xs text-gray-300 leading-snug">
              {lang === 'he' ? s.headline.he : s.headline.en}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
