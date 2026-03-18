'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/i18n/context';
import type { BriefStory } from '@/lib/types';
import SignalLabel from '@/components/shared/SignalLabel';
import LikelihoodMeter from '@/components/shared/LikelihoodMeter';
import DeltaIndicator from '@/components/shared/DeltaIndicator';
import SourceList from '@/components/shared/SourceList';
import ShareButton from '@/components/shared/ShareButton';

// Static story slugs that have detail pages
const STATIC_SLUGS = [
  'iran-nuclear-talks',
  'israel-saudi-normalization',
  'global-tech-layoffs',
  'us-midterms-middle-east',
  'northern-border-security',
];

interface BriefCardProps {
  story: BriefStory;
}

export default function BriefCard({ story }: BriefCardProps) {
  const { t, dir, lang } = useLanguage();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const hasDetailPage = STATIC_SLUGS.includes(story.slug);

  const handleClick = () => {
    if (hasDetailPage) {
      router.push(`/story/${story.slug}`);
    } else {
      setExpanded(!expanded);
    }
  };

  return (
    <article
      dir={dir}
      onClick={handleClick}
      className="rounded-xl border border-gray-800 bg-gray-900/80 hover:bg-gray-800/80 transition-all cursor-pointer p-5 space-y-3 card-glow"
    >
      {/* Top row: category + signal */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-gray-400">
          {t(story.category)}
        </span>
        <div className="flex items-center gap-2">
          {!hasDetailPage && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              LIVE
            </span>
          )}
          <SignalLabel isSignal={story.isSignal} />
        </div>
      </div>

      {/* Headline */}
      <h2 className="text-lg font-semibold leading-snug">{t(story.headline)}</h2>

      {/* Summary */}
      <p className={`text-sm text-gray-300 ${expanded ? '' : 'line-clamp-2'}`}>{t(story.summary)}</p>

      {/* Likelihood + Delta */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <LikelihoodMeter value={story.likelihood} label={story.likelihoodLabel} />
        </div>
        <DeltaIndicator delta={story.delta} />
      </div>

      {/* Why */}
      <p className="text-sm italic text-gray-400">{t(story.why)}</p>

      {/* Expanded: show article sources as clickable links */}
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
