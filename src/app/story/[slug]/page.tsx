'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import PageShell from '@/components/layout/PageShell';
import { useLanguage } from '@/i18n/context';
import { stories } from '@/data/stories';
import LikelihoodMeter from '@/components/shared/LikelihoodMeter';
import DeltaIndicator from '@/components/shared/DeltaIndicator';
import SignalLabel from '@/components/shared/SignalLabel';
import SourceList from '@/components/shared/SourceList';
import ShareButton from '@/components/shared/ShareButton';
import LikelihoodTimeline from '@/components/story/LikelihoodTimeline';
import NarrativeList from '@/components/story/NarrativeList';
import LensView from '@/components/story/LensView';
import SoWhat from '@/components/story/SoWhat';
import WatchNext from '@/components/story/WatchNext';

export default function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t, ui, dir, lang } = useLanguage();
  const [reported, setReported] = useState(false);
  const [liveLikelihood, setLiveLikelihood] = useState<number | null>(null);

  const story = stories.find((s) => s.slug === slug);

  useEffect(() => {
    if (!slug) return;
    fetch('/api/stories')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.stories) {
          const liveStory = data.stories.find((s: { slug: string; likelihood: number }) => s.slug === slug);
          if (liveStory) setLiveLikelihood(liveStory.likelihood);
        }
      })
      .catch(() => { /* silent */ });
  }, [slug]);

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
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Link href="/dashboard" className="hover:text-gray-300 transition-colors">
            {lang === 'he' ? 'דשבורד' : 'Dashboard'}
          </Link>
          <span>/</span>
          <Link href="/dashboard#brief" className="hover:text-gray-300 transition-colors">
            {lang === 'he' ? 'תקציר' : 'Brief'}
          </Link>
          <span>/</span>
          <span className="text-gray-300 truncate max-w-[200px]">
            {typeof story.headline === 'string' ? story.headline : story.headline?.en}
          </span>
        </nav>

        {/* Back button */}
        <Link
          href="/dashboard#brief"
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

        {/* Headline + Share */}
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-50 leading-tight">
            {t(story.headline)}
          </h1>
          <ShareButton title={t(story.headline)} text={t(story.summary)} />
        </div>

        {/* Summary */}
        <p className="text-gray-300 leading-relaxed">
          {t(story.summary)}
        </p>

        {/* Likelihood + Delta */}
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 max-w-xs">
            <LikelihoodMeter value={story.likelihood} label={story.likelihoodLabel} showLabel />
          </div>
          {liveLikelihood !== null && liveLikelihood !== story.likelihood && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shrink-0">
              {lang === 'he' ? `חי: ${liveLikelihood}%` : `Live: ${liveLikelihood}%`}
            </span>
          )}
          <DeltaIndicator delta={story.delta} />
        </div>

        {/* Related shocks link */}
        <Link href="/dashboard#shocks" className="inline-flex items-center gap-1.5 text-xs text-yellow-400/70 hover:text-yellow-400 transition-colors">
          {lang === 'he' ? 'ראה זעזועים קשורים ↓' : 'See related shocks ↓'}
        </Link>

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

        <div className="border-t border-gray-800" />

        {/* Report Issue */}
        <div className="flex justify-center">
          <button
            onClick={() => setReported(true)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            {reported ? (
              <span>{dir === 'rtl' ? 'תודה על הדיווח!' : 'Thanks for reporting!'}</span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
                </svg>
                {dir === 'rtl' ? 'דווח על בעיה' : 'Report Issue'}
              </>
            )}
          </button>
        </div>
      </div>
    </PageShell>
  );
}
