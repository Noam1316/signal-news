'use client';

import { useLanguage } from '@/i18n/context';
import type { BriefStory, ShockEvent } from '@/lib/types';

interface DailySummaryProps {
  stories: BriefStory[];
  shocks: ShockEvent[];
}

export default function DailySummary({ stories, shocks }: DailySummaryProps) {
  const { lang } = useLanguage();

  if (stories.length === 0) return null;

  const top = [...stories].sort((a, b) => b.likelihood - a.likelihood).slice(0, 3);
  const hotShocks = shocks.filter(s => s.confidence === 'high').slice(0, 2);
  const shockedSlugs = new Set(shocks.map(s => s.relatedStorySlug).filter(Boolean));
  const linkedCount = stories.filter(s => shockedSlugs.has(s.slug)).length;

  if (lang === 'he') {
    const topTitles = top.map(s => s.headline?.he || s.headline?.en || '').filter(Boolean);
    const shockTitles = hotShocks.map(s => s.headline?.he || s.headline?.en || '').filter(Boolean);

    return (
      <div className="rounded-xl bg-gray-900/60 border border-gray-800 px-4 py-3.5 space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider flex-wrap">
          <span>🧠</span>
          <span>סיכום מודיעיני יומי</span>
          {linkedCount > 0 && (
            <span className="text-orange-400 font-medium normal-case">
              ⚡ {linkedCount} סיפורים עם זעזועים פעילים
            </span>
          )}
        </div>
        <p className="text-sm text-gray-200 leading-relaxed" dir="rtl">
          {topTitles[0] && (
            <>
              הנושא המוביל כרגע הוא <span className="text-white font-medium">{topTitles[0]}</span>
              {topTitles[1] && <>, לצד <span className="text-white font-medium">{topTitles[1]}</span></>}
              {topTitles[2] && <> ו<span className="text-white font-medium">{topTitles[2]}</span></>}.
              {shockTitles[0] && (
                <> <span className="text-orange-300">זעזוע בסבירות גבוהה זוהה: {shockTitles[0]}.</span></>
              )}
            </>
          )}
        </p>
        <a
          href="/brief/print"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-yellow-400/30 text-yellow-400 hover:text-yellow-300 hover:border-yellow-400/50 transition-colors"
        >
          📄 {lang === 'he' ? 'פתח תקציר מלא' : 'Open Full Brief'}
        </a>
      </div>
    );
  }

  // English
  const topTitles = top.map(s => s.headline?.en || s.headline?.he || '').filter(Boolean);
  const shockTitles = hotShocks.map(s => s.headline?.en || s.headline?.he || '').filter(Boolean);

  return (
    <div className="rounded-xl bg-gray-900/60 border border-gray-800 px-4 py-3.5 space-y-2 mb-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider flex-wrap">
        <span>🧠</span>
        <span>Daily Intelligence Summary</span>
        {linkedCount > 0 && (
          <span className="text-orange-400 font-medium normal-case">
            ⚡ {linkedCount} {linkedCount === 1 ? 'story' : 'stories'} with active shocks
          </span>
        )}
      </div>
      <p className="text-sm text-gray-200 leading-relaxed">
        {topTitles[0] && (
          <>
            The leading story is <span className="text-white font-medium">{topTitles[0]}</span>
            {topTitles[1] && <>, alongside <span className="text-white font-medium">{topTitles[1]}</span></>}
            {topTitles[2] && <> and <span className="text-white font-medium">{topTitles[2]}</span></>}.
            {shockTitles[0] && (
              <> <span className="text-orange-300">High-confidence shock detected: {shockTitles[0]}.</span></>
            )}
          </>
        )}
      </p>
      <a
        href="/brief/print"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-yellow-400/30 text-yellow-400 hover:text-yellow-300 hover:border-yellow-400/50 transition-colors"
      >
        📄 Open Full Brief
      </a>
    </div>
  );
}
