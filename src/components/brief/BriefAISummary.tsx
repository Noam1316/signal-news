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

  // Also check IntelSynthesis — same stories, different display (see IntelHub)

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

  // Signals first, then by likelihood — deduplicate by normalized headline
  const seen = new Set<string>();
  const sorted = [...stories]
    .sort((a, b) => {
      if (a.isSignal && !b.isSignal) return -1;
      if (!a.isSignal && b.isSignal) return 1;
      return b.likelihood - a.likelihood;
    })
    .filter(story => {
      const headline = (isHe ? story.headline?.he : story.headline?.en) ?? '';
      const key = headline.trim().slice(0, 40).toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
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

      {/* Digest items */}
      <div className="space-y-3">
        {sorted.map((story, i) => {
          const headline = isHe ? story.headline?.he : story.headline?.en;
          const summary  = isHe ? story.summary?.he  : story.summary?.en;
          const why      = isHe ? story.why?.he       : story.why?.en;
          const category = isHe ? story.category?.he : story.category?.en;
          if (!headline) return null;

          // Pick the best sub-text: summary → why → source names fallback
          const normStart = (s: string) => s.replace(/[^\u05D0-\u05FAa-zA-Z0-9\s]/g, '').trim().slice(0, 35).toLowerCase();
          const isSameAsHeadline = (t: string) => normStart(t) === normStart(headline);

          const subText = (() => {
            if (summary && summary.length >= 20 && !isSameAsHeadline(summary))
              return summary.length > 180 ? summary.slice(0, 177).trimEnd() + '…' : summary;
            if (why && why.length >= 20 && !isSameAsHeadline(why))
              return why.length > 180 ? why.slice(0, 177).trimEnd() + '…' : why;
            // Last resort: source names
            const srcNames = (story.sources ?? []).map(s => s.name).slice(0, 3).join(' · ');
            return srcNames || null;
          })();

          return (
            <div key={story.slug ?? i} className="flex items-start gap-2">
              <span className="shrink-0 mt-[3px] text-gray-600 text-[10px] font-mono w-3">
                {i + 1}.
              </span>
              <div className="space-y-0.5 min-w-0">
                {/* Headline */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-white/90 leading-snug">{headline}</span>
                  {story.isSignal && (
                    <span className="shrink-0 text-[9px] px-1 py-0.5 rounded bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 font-bold">
                      ⚡
                    </span>
                  )}
                  {category && (
                    <span className="text-[10px] text-gray-600">· {category}</span>
                  )}
                </div>
                {/* Sub-text: summary → why → sources */}
                {subText && (
                  <p className="text-xs text-gray-400 leading-snug line-clamp-2">{subText}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
