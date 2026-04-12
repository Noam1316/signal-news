'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/context';
import type { BriefStory } from '@/lib/types';

export default function BriefAISummary() {
  const { lang, dir } = useLanguage();
  const [stories, setStories] = useState<BriefStory[]>([]);
  const [loading, setLoading] = useState(true);
  const isHe = lang === 'he';

  useEffect(() => {
    fetch('/api/stories')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.stories?.length) setStories(d.stories.slice(0, 8));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 space-y-2 animate-pulse">
        <div className="h-3 bg-gray-800 rounded w-1/4" />
        <div className="h-3 bg-gray-800 rounded w-full" />
        <div className="h-3 bg-gray-800 rounded w-5/6" />
        <div className="h-3 bg-gray-800 rounded w-4/5" />
      </div>
    );
  }

  if (!stories.length) return null;

  const now = new Date();
  const timeStr = isHe
    ? `${now.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })} · ${now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`
    : `${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

  // Signals first, then by likelihood
  const sorted = [...stories].sort((a, b) => {
    if (a.isSignal && !b.isSignal) return -1;
    if (!a.isSignal && b.isSignal) return 1;
    return b.likelihood - a.likelihood;
  });

  return (
    <div dir={dir} className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 space-y-2.5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-yellow-400/80">
          {isHe ? 'תקציר השעה האחרונה' : 'Latest Roundup'}
        </span>
        <span className="ms-auto text-[10px] text-gray-600">{timeStr}</span>
      </div>

      {/* Digest lines */}
      <div className="space-y-1.5">
        {sorted.map((story, i) => {
          const headline = isHe ? story.headline?.he : story.headline?.en;
          const category = isHe ? story.category?.he : story.category?.en;
          if (!headline) return null;
          return (
            <div key={story.slug ?? i} className="flex items-start gap-2 text-sm leading-snug">
              <span className="shrink-0 mt-[3px] text-gray-600 text-[10px] font-mono w-3">
                {i + 1}.
              </span>
              <span className="text-white/80">{headline}</span>
              {story.isSignal && (
                <span className="shrink-0 mt-0.5 text-[9px] px-1 py-0.5 rounded bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 font-bold">
                  ⚡
                </span>
              )}
              {category && (
                <span className="shrink-0 mt-0.5 text-[9px] text-gray-600 hidden sm:inline">
                  · {category}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
