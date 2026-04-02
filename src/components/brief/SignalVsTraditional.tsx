'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';
import type { BriefStory } from '@/lib/types';

export default function SignalVsTraditional() {
  const { lang, dir } = useLanguage();
  const [story, setStory] = useState<BriefStory | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch('/api/stories')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const stories: BriefStory[] = d?.stories ?? [];
        // Pick story with most impact (highest likelihood with isSignal)
        const best = stories.filter(s => s.isSignal).sort((a, b) => b.likelihood - a.likelihood)[0]
          ?? stories[0];
        if (best) setStory(best);
      })
      .catch(() => {});
  }, []);

  if (!story) return null;

  const headline     = lang === 'he' ? story.headline.he : story.headline.en;
  const summary      = lang === 'he' ? story.summary.he  : story.summary.en;
  const implication  = story.strategicImplication
    ? (lang === 'he' ? story.strategicImplication.he : story.strategicImplication.en)
    : null;

  const likeColor = story.likelihood >= 70 ? 'text-emerald-400' : story.likelihood >= 40 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/40 overflow-hidden mb-4">
      {/* Header — toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        dir={dir}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">🔍</span>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
            {lang === 'he' ? 'Signal מול כתבה רגילה' : 'Signal vs Traditional News'}
          </span>
          <span className="text-[10px] text-gray-600">
            {lang === 'he' ? '— מה Signal מוסיף?' : '— what does Signal add?'}
          </span>
        </div>
        <span className="text-gray-600 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div dir={dir} className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-t border-gray-800">

          {/* Left: Traditional */}
          <div className="p-4 space-y-2 border-e border-gray-800">
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-600" />
              {lang === 'he' ? 'כלי תקשורת מסורתי' : 'Traditional Media'}
            </div>

            <p className="text-sm font-semibold text-gray-200 leading-snug">{headline}</p>
            <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">{summary}</p>

            {/* What's missing */}
            <div className="pt-1 space-y-1">
              {[
                lang === 'he' ? '❌ אין ציון סבירות' : '❌ No likelihood score',
                lang === 'he' ? '❌ אין זיהוי זעזוע'  : '❌ No shock detection',
                lang === 'he' ? '❌ אין השלכה אסטרטגית' : '❌ No strategic implication',
                lang === 'he' ? '❌ אין ניגוד נרטיבים' : '❌ No narrative contrast',
              ].map((t, i) => (
                <p key={i} className="text-[10px] text-gray-600">{t}</p>
              ))}
            </div>
          </div>

          {/* Right: Signal */}
          <div className="p-4 space-y-2 bg-yellow-400/3">
            <div className="text-[9px] font-bold uppercase tracking-widest text-yellow-400 flex items-center gap-1.5">
              <span className="text-yellow-400">⚡</span>
              {lang === 'he' ? 'Signal Intelligence' : 'Signal Intelligence'}
            </div>

            <p className="text-sm font-semibold text-white leading-snug">{headline}</p>

            {/* Likelihood */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full transition-all duration-700"
                     style={{ width: `${story.likelihood}%` }} />
              </div>
              <span className={`text-sm font-black font-mono ${likeColor}`}>{story.likelihood}%</span>
              <span className="text-[9px] text-gray-500">
                {lang === 'he' ? 'סבירות' : 'likelihood'}
              </span>
            </div>

            {/* Delta */}
            <div className="flex items-center gap-1 text-xs">
              <span className={story.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {story.delta >= 0 ? '▲' : '▼'} {Math.abs(story.delta)}%
              </span>
              <span className="text-gray-600">
                {lang === 'he' ? 'שינוי' : 'change'}
              </span>
            </div>

            {/* Sources */}
            <div className="text-[10px] text-gray-400">
              ✅ {story.sources?.length ?? 0} {lang === 'he' ? 'מקורות בלתי תלויים' : 'independent sources'}
            </div>

            {/* Narrative split */}
            {story.narrativeSplit && (
              <div className="text-[10px] text-purple-300">
                🗣️ {lang === 'he' ? `פיצול נרטיב: פער ${story.narrativeSplit.gapPct}% בין ימין לשמאל` : `Narrative split: ${story.narrativeSplit.gapPct}% gap right vs left`}
              </div>
            )}

            {/* Strategic implication */}
            {implication && (
              <div className="text-[10px] text-amber-300 leading-snug">
                🎯 {implication}
              </div>
            )}

            {/* Signal badge */}
            {story.isSignal && (
              <div className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                ⚡ {lang === 'he' ? 'זוהה כסיגנל' : 'Identified as Signal'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
