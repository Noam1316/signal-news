'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/i18n/context';
import type { BriefStory } from '@/lib/types';
import SignalLabel from '@/components/shared/SignalLabel';
import { getStoryLean, LEAN_LABEL } from '@/utils/political-lean';
import { computeGrade, GRADE_STYLE } from '@/utils/credibility-grade';
import { getSparklineData, getRealDelta } from '@/hooks/useLikelihoodHistory';
import SparkLine from '@/components/shared/SparkLine';
import LikelihoodMeter from '@/components/shared/LikelihoodMeter';
import DeltaIndicator from '@/components/shared/DeltaIndicator';
import SourceList from '@/components/shared/SourceList';
import ShareButton from '@/components/shared/ShareButton';

const STATIC_SLUGS = [
  'iran-nuclear-talks',
  'israel-saudi-normalization',
  'global-tech-layoffs',
  'us-midterms-middle-east',
  'northern-border-security',
];

interface BriefCardProps {
  story: BriefStory;
  isWatched?: boolean;
  onWatchToggle?: () => void;
}

export default function BriefCard({ story, isWatched = false, onWatchToggle }: BriefCardProps) {
  const { t, dir, lang } = useLanguage();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const hasDetailPage = STATIC_SLUGS.includes(story.slug);
  const sourceCount = story.sources?.length || 0;
  const lean = getStoryLean(story);
  const leanData = lean ? LEAN_LABEL[lean] : null;

  // Credibility grade from sources
  const grade = computeGrade(story.sources);
  const gradeStyle = GRADE_STYLE[grade];

  // Sparkline from localStorage history
  const sparkData = getSparklineData(story.slug, 8);

  // Real delta from localStorage (null if not enough history yet)
  const realDelta = getRealDelta(story.slug, story.likelihood);
  const displayDelta = realDelta !== null ? realDelta : story.delta;

  const handleClick = () => {
    if (hasDetailPage) router.push(`/story/${story.slug}`);
    else setExpanded(!expanded);
  };

  return (
    <article
      dir={dir}
      onClick={handleClick}
      className="rounded-xl border border-gray-800 bg-gray-900/80 hover:bg-gray-800/80 transition-all cursor-pointer p-5 space-y-3 card-glow"
    >
      {/* Top row: category + badges + signal + watch */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span className="text-xs uppercase tracking-wider text-gray-400 shrink-0">
            {t(story.category)}
          </span>

          {/* Source count badge */}
          {sourceCount > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-500 font-medium shrink-0">
              {sourceCount} {lang === 'he' ? 'מקורות' : 'src'}
            </span>
          )}

          {/* Credibility grade */}
          <span
            title={gradeStyle.title}
            className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold shrink-0 ${gradeStyle.bg} ${gradeStyle.color}`}
          >
            {grade}
          </span>

          {/* Political lean */}
          {leanData && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium shrink-0 ${leanData.bg} ${leanData.color}`}>
              {lang === 'he' ? leanData.he : leanData.en}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!hasDetailPage && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              LIVE
            </span>
          )}
          <SignalLabel isSignal={story.isSignal} />
          {onWatchToggle && (
            <button
              onClick={e => { e.stopPropagation(); onWatchToggle(); }}
              title={isWatched ? (lang === 'he' ? 'הסר ממעקב' : 'Unwatch') : (lang === 'he' ? 'הוסף למעקב' : 'Watch')}
              className={`text-sm transition-colors ${isWatched ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}
            >
              {isWatched ? '★' : '☆'}
            </button>
          )}
        </div>
      </div>

      {/* Headline */}
      <h2 className="text-lg font-semibold leading-snug">{t(story.headline)}</h2>

      {/* Summary */}
      <p className={`text-sm text-gray-300 ${expanded ? '' : 'line-clamp-2'}`}>{t(story.summary)}</p>

      {/* Likelihood + Delta + Sparkline */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <LikelihoodMeter value={story.likelihood} label={story.likelihoodLabel} />
        </div>
        <DeltaIndicator delta={displayDelta} />
        {sparkData.length >= 2 && <SparkLine data={sparkData} />}
      </div>

      {/* Why */}
      <p className="text-sm italic text-gray-400">{t(story.why)}</p>

      {/* Expanded: source links */}
      {expanded && !hasDetailPage && (
        <div className="pt-2 border-t border-gray-800/50 space-y-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">
            {lang === 'he' ? 'מקורות' : 'Sources'}
          </p>
          <div className="flex flex-wrap gap-2">
            {story.sources.map((src) => (
              <a
                key={src.name}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs px-2.5 py-1 rounded-md bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
              >
                {src.name} ↗
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Sources + Share */}
      <div className="flex items-center justify-between">
        <SourceList sources={story.sources} />
        <ShareButton title={t(story.headline)} text={t(story.summary)} />
      </div>
    </article>
  );
}
