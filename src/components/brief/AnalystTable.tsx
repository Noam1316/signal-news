'use client';

import { useLanguage } from '@/i18n/context';
import type { BriefStory, ShockEvent } from '@/lib/types';
import { computeGrade, GRADE_STYLE } from '@/utils/credibility-grade';
import { getStoryLean, LEAN_LABEL } from '@/utils/political-lean';
import { getSparklineData, getRealDelta } from '@/hooks/useLikelihoodHistory';
import SparkLine from '@/components/shared/SparkLine';

interface AnalystTableProps {
  stories: BriefStory[];
  shockBySlug: Record<string, ShockEvent>;
}

function LikelihoodCell({ value }: { value: number }) {
  const color = value >= 70 ? 'text-emerald-400' : value >= 45 ? 'text-yellow-400' : 'text-red-400';
  const barColor = value >= 70 ? 'bg-emerald-400' : value >= 45 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-1.5 min-w-[80px]">
      <span className={`text-xs font-mono font-bold ${color} w-7 shrink-0`}>{value}%</span>
      <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function AnalystTable({ stories, shockBySlug }: AnalystTableProps) {
  const { lang, dir } = useLanguage();

  if (!stories.length) return null;

  const colHe = {
    rank: '#', headline: 'כותרת', likelihood: 'סבירות', delta: 'Δ',
    sources: 'מקורות', grade: 'דירוג', lean: 'נטייה', signal: '⚡', shock: '🔴', spark: 'טרנד',
  };
  const colEn = {
    rank: '#', headline: 'Headline', likelihood: 'Likelihood', delta: 'Δ',
    sources: 'Src', grade: 'Grade', lean: 'Lean', signal: '⚡', shock: '🔴', spark: 'Trend',
  };
  const col = lang === 'he' ? colHe : colEn;

  // Mobile: rank + headline + likelihood + delta only
  // Desktop: full columns
  const mobileGrid = '24px 1fr 72px 36px';
  const desktopGrid = '24px 1fr 100px 36px 36px 36px 56px 20px 20px 60px';

  return (
    <div dir={dir} className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
      {/* Header — mobile */}
      <div className="sm:hidden grid items-center gap-2 px-3 py-2 bg-gray-900 border-b border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-500"
        style={{ gridTemplateColumns: mobileGrid }}>
        <span>{col.rank}</span>
        <span>{col.headline}</span>
        <span>{col.likelihood}</span>
        <span className="text-center">{col.delta}</span>
      </div>
      {/* Header — desktop */}
      <div className="hidden sm:grid items-center gap-2 px-3 py-2 bg-gray-900 border-b border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-500"
        style={{ gridTemplateColumns: desktopGrid }}>
        <span>{col.rank}</span>
        <span>{col.headline}</span>
        <span>{col.likelihood}</span>
        <span className="text-center">{col.delta}</span>
        <span className="text-center">{col.sources}</span>
        <span className="text-center">{col.grade}</span>
        <span>{col.lean}</span>
        <span className="text-center">{col.signal}</span>
        <span className="text-center">{col.shock}</span>
        <span className="text-center">{col.spark}</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-800/50">
        {stories.map((story, idx) => {
          const headline = typeof story.headline === 'string'
            ? story.headline
            : (lang === 'he' ? story.headline?.he : story.headline?.en) || '';

          const grade = computeGrade(story.sources);
          const gradeStyle = GRADE_STYLE[grade];
          const lean = getStoryLean(story);
          const leanData = lean ? LEAN_LABEL[lean] : null;
          const sparkData = getSparklineData(story.slug, 6);
          const realDelta = getRealDelta(story.slug, story.likelihood);
          const delta = realDelta !== null ? realDelta : (story.delta ?? 0);
          const hasShock = !!shockBySlug[story.slug];
          const srcCount = story.sources?.length ?? 0;
          const deltaColor = delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-gray-600';
          const deltaText = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : '—';

          return (
            <div key={story.slug}>
              {/* Mobile row */}
              <div
                className="sm:hidden grid items-center gap-2 px-3 py-2.5 hover:bg-gray-800/40 transition-colors"
                style={{ gridTemplateColumns: mobileGrid }}
              >
                <span className="text-[10px] font-mono text-gray-600">{idx + 1}</span>
                <div className="min-w-0">
                  <p className="text-xs text-gray-200 truncate font-medium" title={headline}>{headline}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {story.isSignal && <span className="text-[9px]">⚡</span>}
                    {hasShock && <span className="text-[9px]">🔴</span>}
                    <span className="text-[9px] text-gray-600">{srcCount} {lang === 'he' ? 'מקורות' : 'src'}</span>
                    {leanData && <span className={`text-[9px] px-1 rounded border ${leanData.bg} ${leanData.color}`}>{lang === 'he' ? leanData.he : leanData.en}</span>}
                  </div>
                </div>
                <LikelihoodCell value={story.likelihood} />
                <span className={`text-[11px] font-mono font-bold text-center ${deltaColor}`}>{deltaText}</span>
              </div>

              {/* Desktop row */}
              <div
                className="hidden sm:grid items-center gap-2 px-3 py-2 hover:bg-gray-800/40 transition-colors cursor-default group"
                style={{ gridTemplateColumns: desktopGrid }}
              >
                <span className="text-[10px] font-mono text-gray-600">{idx + 1}</span>
                <span className="text-xs text-gray-200 truncate group-hover:text-white transition-colors" title={headline}>{headline}</span>
                <LikelihoodCell value={story.likelihood} />
                <span className={`text-[11px] font-mono font-bold text-center ${deltaColor}`}>{deltaText}</span>
                <span className="text-[11px] text-center text-gray-400 font-mono">{srcCount}</span>
                <span className={`text-[10px] font-bold text-center px-1 py-0.5 rounded border ${gradeStyle.bg} ${gradeStyle.color}`}>{grade}</span>
                {leanData ? (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium truncate ${leanData.bg} ${leanData.color}`}>
                    {lang === 'he' ? leanData.he : leanData.en}
                  </span>
                ) : <span className="text-[10px] text-gray-700">—</span>}
                <span className="text-center">{story.isSignal ? <span className="text-xs">⚡</span> : <span className="text-[10px] text-gray-800">·</span>}</span>
                <span className="text-center">{hasShock ? <span className="text-xs">🔴</span> : <span className="text-[10px] text-gray-800">·</span>}</span>
                <div className="flex justify-center">
                  {sparkData.length >= 2 ? <SparkLine data={sparkData} width={56} height={20} /> : <span className="text-[10px] text-gray-700">—</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-800 bg-gray-900/60 flex items-center justify-between">
        <span className="text-[10px] text-gray-600">
          {stories.length} {lang === 'he' ? 'סיפורים' : 'stories'}
        </span>
        <span className="text-[10px] text-gray-600">
          ⚡ {lang === 'he' ? 'סיגנל' : 'signal'} &nbsp; 🔴 {lang === 'he' ? 'זעזוע' : 'shock'} &nbsp; Δ {lang === 'he' ? 'שינוי' : 'change'}
        </span>
      </div>
    </div>
  );
}
