'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import PageShell from '@/components/layout/PageShell';
import { useLanguage } from '@/i18n/context';
import { stories as staticStories } from '@/data/stories';
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
import type { BriefStory } from '@/lib/types';

// ── Live Story Card — shown when story comes from RSS (not static data) ──────

function LiveStoryCard({ story, lang, dir }: { story: BriefStory; lang: string; dir: string }) {
  const headline = typeof story.headline === 'string' ? story.headline : (lang === 'he' ? story.headline?.he : story.headline?.en) || '';
  const summary  = typeof story.summary  === 'string' ? story.summary  : (lang === 'he' ? story.summary?.he  : story.summary?.en)  || '';
  const why      = typeof story.why      === 'string' ? story.why      : (lang === 'he' ? story.why?.he      : story.why?.en)      || '';
  const category = lang === 'he' ? story.category?.he : story.category?.en;

  const tier = story.likelihood >= 70 ? 'high' : story.likelihood >= 45 ? 'medium' : 'low';
  const likelihoodColor = tier === 'high' ? 'text-emerald-400' : tier === 'medium' ? 'text-yellow-400' : 'text-red-400';
  const barColor        = tier === 'high' ? 'bg-emerald-400'   : tier === 'medium' ? 'bg-yellow-400'   : 'bg-red-400';

  const delta    = story.delta ?? 0;
  const isUp     = delta > 0;
  const absDelta = Math.abs(delta);
  const srcCount = story.sources?.length ?? 0;

  return (
    <div dir={dir} className="space-y-6">
      {/* Category + badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {category && (
          <span className="text-xs font-medium text-gray-400 bg-gray-800 px-2.5 py-1 rounded-full">
            {category}
          </span>
        )}
        {story.isSignal && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 font-bold">
            ⚡ Signal
          </span>
        )}
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
          {lang === 'he' ? '🔴 מקור חי' : '🔴 Live Source'}
        </span>
      </div>

      {/* Headline + Share */}
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-50 leading-tight">{headline}</h1>
        <ShareButton title={headline} text={summary} />
      </div>

      {/* Summary */}
      {summary && <p className="text-gray-300 leading-relaxed">{summary}</p>}

      {/* Why it matters */}
      {why && (
        <div className="rounded-xl bg-gray-800/60 border border-gray-700/50 px-4 py-3 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            {lang === 'he' ? '🎯 למה זה חשוב?' : '🎯 Why it matters'}
          </div>
          <p className="text-sm text-gray-200 leading-relaxed">{why}</p>
        </div>
      )}

      {/* Likelihood stats */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={`text-4xl font-black ${likelihoodColor}`}>{story.likelihood}%</span>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-500">{lang === 'he' ? 'סבירות' : 'likelihood'}</span>
              {absDelta > 0 && (
                <span className={`text-xs font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isUp ? '▲' : '▼'} {absDelta}%
                </span>
              )}
            </div>
          </div>
          <div className="h-10 w-px bg-gray-800" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white">{srcCount}</span>
            <span className="text-[10px] text-gray-500">{lang === 'he' ? 'מקורות' : 'sources'}</span>
          </div>
          <div className="h-10 w-px bg-gray-800" />
          <div className="flex flex-col">
            <span className={`text-sm font-bold ${likelihoodColor}`}>
              {tier === 'high' ? (lang === 'he' ? 'גבוהה' : 'High') : tier === 'medium' ? (lang === 'he' ? 'בינונית' : 'Medium') : (lang === 'he' ? 'נמוכה' : 'Low')}
            </span>
            <span className="text-[10px] text-gray-500">{lang === 'he' ? 'ביטחון' : 'confidence'}</span>
          </div>
        </div>

        {/* Bar */}
        <div className="space-y-1">
          <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${barColor}`} style={{ width: `${story.likelihood}%` }} />
          </div>
          <div className="flex justify-between text-[9px] text-gray-700">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </div>
      </div>

      {/* Sources */}
      {(story.sources ?? []).length > 0 && (
        <div>
          <h3 className="uppercase tracking-wider text-xs text-gray-500 mb-3">
            {lang === 'he' ? 'מקורות' : 'Sources'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {(story.sources ?? []).map((s: any) => (
              <span key={s.id || s.name} className="text-xs px-2.5 py-1 rounded-full bg-gray-800 border border-gray-700/50 text-gray-300">
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Intelligence assessment */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <span>📡</span>
          <span>{lang === 'he' ? 'הערכת מודיעין' : 'Intelligence Assessment'}</span>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          {lang === 'he'
            ? `סבירות ${story.likelihood}% ${story.isSignal ? '— מסומן כסיגנל סטטיסטי חריג. ' : '. '}${srcCount >= 5 ? `${srcCount} מקורות מאמתים קונסנזוס רחב.` : srcCount >= 3 ? `${srcCount} מקורות — כיסוי מבוסס.` : `${srcCount} מקורות בלבד — כיסוי מוגבל.`}${absDelta > 0 ? ` שינוי של ${absDelta}% בשעות האחרונות.` : ''}`
            : `${story.likelihood}% likelihood${story.isSignal ? ' — flagged as a statistical signal anomaly. ' : '. '}${srcCount >= 5 ? `${srcCount} sources confirm broad consensus.` : srcCount >= 3 ? `${srcCount} sources — solid coverage.` : `Only ${srcCount} source${srcCount === 1 ? '' : 's'} — limited coverage.`}${absDelta > 0 ? ` ${absDelta}% change in recent hours.` : ''}`}
        </p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t, ui, dir, lang } = useLanguage();
  const [reported, setReported] = useState(false);
  const [liveStory, setLiveStory] = useState<BriefStory | null>(null);
  const [loadingLive, setLoadingLive] = useState(true);

  // Try to fetch live story from RSS API
  useEffect(() => {
    if (!slug) return;
    fetch('/api/stories')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.stories) {
          const found = data.stories.find((s: BriefStory) => s.slug === slug);
          if (found) setLiveStory(found);
        }
      })
      .catch(() => { /* silent */ })
      .finally(() => setLoadingLive(false));
  }, [slug]);

  // Check static data
  const staticStory = staticStories.find(s => s.slug === slug);

  // Loading state
  if (loadingLive) {
    return (
      <PageShell>
        <div className="space-y-4 animate-pulse">
          <div className="h-4 w-32 bg-gray-800 rounded" />
          <div className="h-8 w-full bg-gray-800 rounded" />
          <div className="h-4 w-3/4 bg-gray-800 rounded" />
          <div className="h-32 bg-gray-800/50 rounded-xl" />
        </div>
      </PageShell>
    );
  }

  // Not found anywhere
  if (!liveStory && !staticStory) {
    return (
      <PageShell>
        <div className="text-center py-20 space-y-4">
          <p className="text-4xl">🔍</p>
          <p className="text-gray-400 text-lg">
            {lang === 'he' ? 'הסיפור לא נמצא' : 'Story not found'}
          </p>
          <p className="text-gray-600 text-sm">
            {lang === 'he' ? 'ייתכן שהסיפור פג תוקף — חזור לדשבורד לסיפורים עדכניים' : 'This story may have expired — return to the dashboard for current stories'}
          </p>
          <Link href="/dashboard" className="inline-block mt-4 px-4 py-2 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-sm hover:bg-yellow-400/20 transition-colors">
            {lang === 'he' ? '← חזור לדשבורד' : '← Back to Dashboard'}
          </Link>
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
            {liveStory
              ? (typeof liveStory.headline === 'string' ? liveStory.headline : (lang === 'he' ? liveStory.headline?.he : liveStory.headline?.en))
              : (typeof staticStory!.headline === 'string' ? staticStory!.headline : staticStory!.headline?.en)}
          </span>
        </nav>

        {/* Back button */}
        <Link
          href="/dashboard#brief"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d={dir === 'rtl' ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
          </svg>
          {ui('dailyBrief')}
        </Link>

        {/* Live story (from RSS) */}
        {liveStory && (
          <LiveStoryCard story={liveStory} lang={lang} dir={dir} />
        )}

        {/* Static story content (always show if available, supplement live) */}
        {staticStory && (
          <div className={liveStory ? 'border-t border-gray-800 pt-6 space-y-6' : 'space-y-6'}>
            {!liveStory && (
              <>
                {/* Category + Signal */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-400 bg-gray-800 px-2.5 py-1 rounded-full">
                    {t(staticStory.category)}
                  </span>
                  <SignalLabel isSignal={staticStory.isSignal} />
                </div>

                {/* Headline + Share */}
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-2xl font-bold text-gray-50 leading-tight">
                    {t(staticStory.headline)}
                  </h1>
                  <ShareButton title={t(staticStory.headline)} text={t(staticStory.summary)} />
                </div>

                {/* Summary */}
                <p className="text-gray-300 leading-relaxed">{t(staticStory.summary)}</p>

                {/* Likelihood + Delta */}
                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 max-w-xs">
                    <LikelihoodMeter value={staticStory.likelihood} label={staticStory.likelihoodLabel} showLabel />
                  </div>
                  <DeltaIndicator delta={staticStory.delta} />
                </div>

                <Link href="/dashboard#shocks" className="inline-flex items-center gap-1.5 text-xs text-yellow-400/70 hover:text-yellow-400 transition-colors">
                  {lang === 'he' ? 'ראה זעזועים קשורים ↓' : 'See related shocks ↓'}
                </Link>

                <div className="border-t border-gray-800" />
              </>
            )}

            {/* Timeline */}
            {staticStory.timeline?.length > 0 && (
              <div>
                <h3 className="uppercase tracking-wider text-xs text-gray-500 mb-3">{ui('likelihood')}</h3>
                <LikelihoodTimeline timeline={staticStory.timeline} currentValue={staticStory.likelihood} />
                <div className="border-t border-gray-800 mt-6" />
              </div>
            )}

            {/* Narratives */}
            <NarrativeList narratives={staticStory.narratives} />
            <div className="border-t border-gray-800" />

            {/* Lens View */}
            <LensView lensView={staticStory.lensView} />
            <div className="border-t border-gray-800" />

            {/* So What */}
            <SoWhat items={staticStory.soWhat} />
            <div className="border-t border-gray-800" />

            {/* Watch Next */}
            <WatchNext items={staticStory.watchNext} />
            <div className="border-t border-gray-800" />

            {/* Sources */}
            <div>
              <h3 className="uppercase tracking-wider text-xs text-gray-500 mb-3">{ui('sources')}</h3>
              <SourceList sources={staticStory.sources} />
            </div>
          </div>
        )}

        <div className="border-t border-gray-800" />

        {/* Report Issue */}
        <div className="flex justify-center">
          <button
            onClick={() => setReported(true)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            {reported ? (
              <span>{lang === 'he' ? 'תודה על הדיווח!' : 'Thanks for reporting!'}</span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
                </svg>
                {lang === 'he' ? 'דווח על בעיה' : 'Report Issue'}
              </>
            )}
          </button>
        </div>
      </div>
    </PageShell>
  );
}
