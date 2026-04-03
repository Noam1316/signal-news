'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/i18n/context';
import type { BriefStory, ShockEvent } from '@/lib/types';
import { useSidebar } from '@/contexts/SidebarContext';
import type { SidebarArticle } from '@/contexts/SidebarContext';
import SignalLabel from '@/components/shared/SignalLabel';
import { getStoryLean, LEAN_LABEL, getSourceLeanBreakdown } from '@/utils/political-lean';
import { computeGrade, GRADE_STYLE } from '@/utils/credibility-grade';
import { getSparklineData, getRealDelta } from '@/hooks/useLikelihoodHistory';
import SparkLine from '@/components/shared/SparkLine';
import LikelihoodMeter from '@/components/shared/LikelihoodMeter';
import LikelihoodTooltip from '@/components/shared/LikelihoodTooltip';
import DeltaIndicator from '@/components/shared/DeltaIndicator';
import SourceList from '@/components/shared/SourceList';
import ShareButton from '@/components/shared/ShareButton';
import ShareStoryButton from '@/components/shared/ShareStoryButton';
import ReaderMode from '@/components/shared/ReaderMode';
import BiasBar from '@/components/shared/BiasBar';
import BlindspotBadge from '@/components/shared/BlindspotBadge';

interface BriefCardProps {
  story: BriefStory;
  isWatched?: boolean;
  onWatchToggle?: () => void;
  relatedShock?: ShockEvent;
}

export default function BriefCard({ story, isWatched = false, onWatchToggle, relatedShock }: BriefCardProps) {
  const { t, dir, lang } = useLanguage();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);
  const { open: openSidebar } = useSidebar();

  // All stories are expandable — static slugs also get a detail page
  const hasDetailPage = false; // all stories expand inline now
  const sourceCount = story.sources?.length || 0;
  const lean = getStoryLean(story);
  const leanData = lean ? LEAN_LABEL[lean] : null;

  // Credibility grade from sources
  const grade = computeGrade(story.sources);
  const gradeStyle = GRADE_STYLE[grade];

  // Sparkline from localStorage history
  const sparkData = getSparklineData(story.slug, 8);

  // Source political breakdown for confidence tooltip
  const leanBreakdown = getSourceLeanBreakdown(story.sources || []);
  const breakdownTitle = [
    leanBreakdown.left > 0 ? `${leanBreakdown.left} ${lang === 'he' ? 'שמאל' : 'Left'}` : '',
    leanBreakdown.center > 0 ? `${leanBreakdown.center} ${lang === 'he' ? 'מרכז' : 'Center'}` : '',
    leanBreakdown.right > 0 ? `${leanBreakdown.right} ${lang === 'he' ? 'ימין' : 'Right'}` : '',
  ].filter(Boolean).join(' · ');

  // Real delta from localStorage (null if not enough history yet)
  const realDelta = getRealDelta(story.slug, story.likelihood);
  const displayDelta = realDelta !== null ? realDelta : story.delta;

  const handleClick = () => {
    if (hasDetailPage) {
      router.push(`/story/${story.slug}`);
      return;
    }
    // On mobile: always expand inline (sidebar is desktop-only)
    // Check window.innerWidth directly to avoid SSR/state timing issues
    const onMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    if (onMobile) {
      setExpanded(prev => !prev);
      return;
    }
    // Desktop: open sidebar with article details
    const primarySource = story.sources?.[0];
    if (primarySource) {
      const headline = typeof story.headline === 'string' ? story.headline : (lang === 'he' ? story.headline.he : story.headline.en);
      const summary = typeof story.summary === 'string' ? story.summary : (lang === 'he' ? story.summary.he : story.summary.en);
      const category = typeof story.category === 'string' ? story.category : (lang === 'he' ? story.category.he : story.category.en);
      const sidebarArticle: SidebarArticle = {
        title: headline,
        description: summary,
        url: primarySource.url,
        sourceId: '',
        sourceName: primarySource.name,
        pubDate: story.updatedAt,
        topics: [category].filter(Boolean),
        sentiment: story.isSignal ? 'positive' : 'neutral',
        signalScore: story.likelihood,
        isSignal: story.isSignal,
        impacts: story.impacts,
        category,
        allSources: story.sources?.map(s => ({ name: s.name, url: s.url })),
      };
      openSidebar(sidebarArticle);
    } else {
      setExpanded(!expanded);
    }
  };

  return (
    <>
    <article
      dir={dir}
      onClick={handleClick}
      className={`rounded-xl border transition-all cursor-pointer p-5 space-y-3 ${
        story.resolved
          ? 'border-gray-700/50 bg-gray-900/40 opacity-60 hover:opacity-80'
          : 'border-gray-800 bg-gray-900/80 hover:bg-gray-800/80 card-glow'
      }`}
    >
      {/* Top row: category + badges + signal + watch */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span className="text-xs uppercase tracking-wider text-gray-400 shrink-0">
            {t(story.category)}
          </span>

          {/* Source count badge with political breakdown tooltip */}
          {sourceCount > 0 && (
            <span
              title={breakdownTitle || undefined}
              className="text-[11px] px-1.5 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-400 font-medium shrink-0 cursor-default"
            >
              {sourceCount} {lang === 'he' ? 'מקורות' : 'src'}
              {sourceCount >= 3 && breakdownTitle && (
                <span className="ms-1 opacity-60">
                  {leanBreakdown.left > 0 && <span className="text-blue-400">{leanBreakdown.left}ש</span>}
                  {leanBreakdown.center > 0 && <span className="text-gray-400">{leanBreakdown.center}מ</span>}
                  {leanBreakdown.right > 0 && <span className="text-red-400">{leanBreakdown.right}י</span>}
                </span>
              )}
            </span>
          )}

          {/* Credibility grade */}
          <span
            title={gradeStyle.title}
            className={`text-[11px] px-1.5 py-0.5 rounded-full border font-bold shrink-0 ${gradeStyle.bg} ${gradeStyle.color}`}
          >
            {grade}
          </span>

          {/* Political lean */}
          {leanData && (
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full border font-medium shrink-0 ${leanData.bg} ${leanData.color}`}>
              {lang === 'he' ? leanData.he : leanData.en}
            </span>
          )}

          {/* Blindspot indicator */}
          <BlindspotBadge sources={story.sources} />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {story.resolved ? (
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400 border border-gray-600/30 font-medium">
              {lang === 'he' ? '✓ הושלם' : '✓ Resolved'}
            </span>
          ) : !hasDetailPage && (
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              LIVE
            </span>
          )}
          <SignalLabel isSignal={story.isSignal} />
          <ShareStoryButton story={story} />
          <button
            onClick={e => { e.stopPropagation(); setReaderOpen(true); }}
            title={lang === 'he' ? 'מצב קריאה' : 'Reader mode'}
            className="text-sm text-gray-500 hover:text-yellow-400 transition-colors"
          >
            📖
          </button>
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

      {/* Mobile expand toggle — visible only on mobile */}
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setExpanded(prev => !prev); }}
        className="sm:hidden text-[11px] text-yellow-400/70 hover:text-yellow-400 transition-colors flex items-center gap-1"
      >
        {expanded
          ? (lang === 'he' ? '▲ הצג פחות' : '▲ Show less')
          : (lang === 'he' ? '▼ הצג עוד' : '▼ Show more')}
      </button>

      {/* Likelihood + Delta + Sparkline */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <LikelihoodMeter value={story.likelihood} label={story.likelihoodLabel} />
            <LikelihoodTooltip likelihood={story.likelihood} />
          </div>
        </div>
        <DeltaIndicator delta={displayDelta} />
        {sparkData.length >= 2 && <SparkLine data={sparkData} />}
      </div>

      {/* Why */}
      <p className="text-sm italic text-gray-400">{t(story.why)}</p>

      {/* Strategic implication */}
      {story.strategicImplication && (
        <div className="flex items-start gap-1.5 text-xs text-amber-300/80 leading-snug">
          <span className="shrink-0 mt-0.5">🎯</span>
          <span>{lang === 'he' ? story.strategicImplication.he : story.strategicImplication.en}</span>
        </div>
      )}

      {/* Narrative split: right vs left headline */}
      {story.narrativeSplit && (
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 px-3 py-2 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-gray-500">
            <span>📰</span>
            <span>{lang === 'he' ? `ניגוד נרטיבים — פער ${story.narrativeSplit.gapPct}%` : `Narrative split — ${story.narrativeSplit.gapPct}% gap`}</span>
          </div>
          <div className="grid grid-cols-1 gap-1">
            <div className="flex items-start gap-1.5">
              <span className="shrink-0 mt-0.5 w-2 h-2 rounded-full bg-violet-500" />
              <div className="min-w-0">
                <span className="text-[9px] text-violet-400 font-semibold">{story.narrativeSplit.rightSource} </span>
                <span className="text-[10px] text-gray-300 line-clamp-1">{story.narrativeSplit.rightHeadline}</span>
              </div>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="shrink-0 mt-0.5 w-2 h-2 rounded-full bg-red-500" />
              <div className="min-w-0">
                <span className="text-[9px] text-red-400 font-semibold">{story.narrativeSplit.leftSource} </span>
                <span className="text-[10px] text-gray-300 line-clamp-1">{story.narrativeSplit.leftHeadline}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Always-visible compact impact badges (top 3) */}
      {story.impacts && story.impacts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {story.impacts.slice(0, 3).map((impact, i) => {
            const cls =
              impact.direction === 'positive'
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : impact.direction === 'negative'
                ? 'text-red-400 bg-red-500/10 border-red-500/20'
                : 'text-gray-400 bg-gray-700/40 border-gray-600/30';
            const arrow = impact.direction === 'positive' ? '↑' : impact.direction === 'negative' ? '↓' : '~';
            return (
              <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${cls}`}>
                {arrow} {lang === 'he' ? impact.sector.he : impact.sector.en}
              </span>
            );
          })}
          {story.impacts.length > 3 && (
            <span className="text-[10px] text-gray-500 px-1 py-0.5">+{story.impacts.length - 3}</span>
          )}
        </div>
      )}

      {/* Shock indicator — links this story to a detected shock */}
      {relatedShock && (
        <div
          onClick={e => {
            e.stopPropagation();
            const el = document.getElementById('shocks');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30 cursor-pointer hover:border-orange-400/60 transition-colors"
          title={lang === 'he' ? 'לחץ לראות הזעזוע' : 'Click to see shock'}
        >
          <span className="text-orange-400 text-sm shrink-0">⚡</span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-orange-400/70 uppercase tracking-wider mb-0.5">
              {lang === 'he' ? 'זעזוע זוהה' : 'Shock Detected'}
            </p>
            <p className="text-xs text-orange-200 font-medium truncate">
              {lang === 'he' ? relatedShock.headline?.he : relatedShock.headline?.en}
            </p>
          </div>
          <span className={`text-[10px] font-bold shrink-0 ${relatedShock.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {relatedShock.delta >= 0 ? '+' : ''}{relatedShock.delta}%
          </span>
        </div>
      )}

      {/* Expanded: cross-sector impacts + source links */}
      {expanded && !hasDetailPage && (
        <div className="pt-2 border-t border-gray-800/50 space-y-3">

          {/* Smart Connections */}
          {story.impacts && story.impacts.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>🔗</span>
                {lang === 'he' ? 'השפעות צפויות' : 'Expected Impacts'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {story.impacts.map((impact, i) => {
                  const color =
                    impact.direction === 'positive'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : impact.direction === 'negative'
                      ? 'bg-red-500/10 border-red-500/30 text-red-300'
                      : 'bg-gray-700/40 border-gray-600/40 text-gray-300';
                  const arrow =
                    impact.direction === 'positive' ? '↑' : impact.direction === 'negative' ? '↓' : '~';
                  return (
                    <span
                      key={i}
                      className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${color}`}
                    >
                      {arrow} {lang === 'he' ? impact.sector.he : impact.sector.en}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sources */}
          <div className="space-y-2">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider">
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
        </div>
      )}

      {/* Bias distribution bar */}
      <BiasBar sources={story.sources} compact />

      {/* Sources + Share */}
      <div className="flex items-center justify-between">
        <SourceList sources={story.sources} />
        <ShareButton title={t(story.headline)} text={t(story.summary)} />
      </div>
    </article>

    {readerOpen && <ReaderMode story={story} onClose={() => setReaderOpen(false)} />}
  </>
  );
}
