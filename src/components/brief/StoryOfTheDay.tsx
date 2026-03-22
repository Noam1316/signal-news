'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';
import type { BriefStory } from '@/lib/types';

export default function StoryOfTheDay() {
  const { lang, dir } = useLanguage();
  const [story, setStory] = useState<BriefStory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stories')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.stories?.length) {
          // Pick highest-value story: max(likelihood * ln(sources+1))
          const scored = data.stories.map((s: BriefStory) => ({
            story: s,
            score: s.likelihood * Math.log((s.sources?.length || 1) + 1),
          }));
          scored.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
          setStory(scored[0].story);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl bg-gray-900/50 border border-gray-800 h-28 animate-pulse" />
    );
  }

  if (!story) return null;

  const headline = lang === 'he' ? story.headline.he : story.headline.en;
  const summary = lang === 'he' ? story.summary.he : story.summary.en;

  const likelihoodColor = story.likelihood >= 70
    ? 'text-emerald-400'
    : story.likelihood >= 45
      ? 'text-yellow-400'
      : 'text-red-400';

  const deltaPositive = (story.delta ?? 0) > 0;

  return (
    <div
      dir={dir}
      className="rounded-2xl border border-yellow-400/20 bg-gradient-to-br from-yellow-400/5 via-gray-900 to-gray-900 p-5 space-y-3 relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-0 start-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-3xl pointer-events-none" />

      {/* Label */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/80 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          {lang === 'he' ? 'סיגנל היום' : "Today's Top Signal"}
        </span>
      </div>

      {/* Headline */}
      <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
        {headline}
      </h2>

      {/* Summary (1 line) */}
      {summary && (
        <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
          {summary}
        </p>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Likelihood */}
        <div className="flex items-center gap-1.5">
          <span className={`text-2xl font-black ${likelihoodColor}`}>
            {story.likelihood}%
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 leading-tight">
              {lang === 'he' ? 'סבירות' : 'likelihood'}
            </span>
            <span className={`text-[10px] font-semibold leading-tight ${deltaPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {deltaPositive ? '↑' : '↓'} {Math.abs(story.delta ?? 0)}%
            </span>
          </div>
        </div>

        <div className="h-8 w-px bg-gray-800" />

        {/* Sources */}
        <div className="text-center">
          <div className="text-sm font-bold text-white">{story.sources?.length ?? 0}</div>
          <div className="text-[10px] text-gray-500">{lang === 'he' ? 'מקורות' : 'sources'}</div>
        </div>

        {/* Why it matters */}
        <div className="ms-auto hidden sm:block">
          <div className="text-[10px] text-gray-600 text-end">
            {lang === 'he' ? 'למה חשוב?' : 'Why it matters'}
          </div>
          <div className="text-[11px] text-gray-400 text-end max-w-[180px] line-clamp-2">
            {story.likelihood >= 70
              ? (lang === 'he' ? 'סבירות גבוהה — מכוסה ע"י מקורות מרובים' : 'High likelihood — covered by multiple credible sources')
              : story.likelihood >= 45
                ? (lang === 'he' ? 'מגמה מתפתחת — עקוב אחרי ההתפתחויות' : 'Developing trend — watch for updates')
                : (lang === 'he' ? 'סיגנל חלש — עדיין לא מגובה' : 'Weak signal — not yet corroborated')
            }
          </div>
        </div>
      </div>

      {/* Likelihood bar */}
      <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            story.likelihood >= 70 ? 'bg-emerald-400' : story.likelihood >= 45 ? 'bg-yellow-400' : 'bg-red-400'
          }`}
          style={{ width: `${story.likelihood}%` }}
        />
      </div>
    </div>
  );
}
