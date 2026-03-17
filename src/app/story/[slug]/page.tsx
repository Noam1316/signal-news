'use client';

import { use } from 'react';
import Link from 'next/link';
import PageShell from '@/components/layout/PageShell';
import { useLanguage } from '@/i18n/context';
import { stories } from '@/data/stories';
import LikelihoodMeter from '@/components/shared/LikelihoodMeter';
import DeltaIndicator from '@/components/shared/DeltaIndicator';
import SignalLabel from '@/components/shared/SignalLabel';
import SourceList from '@/components/shared/SourceList';
import LikelihoodTimeline from '@/components/story/LikelihoodTimeline';
import NarrativeList from '@/components/story/NarrativeList';
import LensView from '@/components/story/LensView';
import SoWhat from '@/components/story/SoWhat';
import WatchNext from '@/components/story/WatchNext';

export default function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t, ui, dir } = useLanguage();

  const story = stories.find((s) => s.slug === slug);

  if (!story) {
    return (
      <PageShell>
        <div className="text-center py-20 text-gray-400">
          Story not found
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-6" dir={dir}>
        {/* Back button */}
        <Link
          href="/brief"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={dir === 'rtl' ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
            />
          </svg>
          {ui('dailyBrief')}
        </Link>

        {/* Category + Signal */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-400 bg-gray-800 px-2.5 py-1 rounded-full">
            {t(story.category)}
          </span>
          <SignalLabel isSignal={story.isSignal} />
        </div>

        {/* Headline */}
        <h1 className="text-2xl font-bold text-gray-50 leading-tight">
          {t(story.headline)}
        </h1>

        {/* Summary */}
        <p className="text-gray-300 leading-relaxed">
          {t(story.summary)}
        </p>

        {/* Likelihood + Delta */}
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 max-w-xs">
            <LikelihoodMeter value={story.likelihood} label={story.likelihoodLabel} showLabel />
          </div>
          <DeltaIndicator delta={story.delta} />
        </div>

        <div className="border-t border-gray-800" />

        {/* Timeline */}
        <div>
          <h3 className="uppercase tracking-wider text-xs text-gray-500 mb-3">
            {ui('likelihood')}
          </h3>
          <LikelihoodTimeline timeline={story.timeline} currentValue={story.likelihood} />
        </div>

        <div className="border-t border-gray-800" />

        {/* Narratives */}
        <NarrativeList narratives={story.narratives} />

        <div className="border-t border-gray-800" />

        {/* Lens View */}
        <LensView lensView={story.lensView} />

        <div className="border-t border-gray-800" />

        {/* So What */}
        <SoWhat items={story.soWhat} />

        <div className="border-t border-gray-800" />

        {/* Watch Next */}
        <WatchNext items={story.watchNext} />

        <div className="border-t border-gray-800" />

        {/* Sources */}
        <div>
          <h3 className="uppercase tracking-wider text-xs text-gray-500 mb-3">
            {ui('sources')}
          </h3>
          <SourceList sources={story.sources} />
        </div>
      </div>
    </PageShell>
  );
}
