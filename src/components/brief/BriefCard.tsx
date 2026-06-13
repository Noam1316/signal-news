'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/i18n/context';
import type { BriefStory, ShockEvent } from '@/lib/types';
import { useSidebar } from '@/contexts/SidebarContext';
import type { SidebarArticle } from '@/contexts/SidebarContext';
import SignalLabel from '@/components/shared/SignalLabel';
import Link from 'next/link';
import { getStoryLean, LEAN_LABEL, getSourceLeanBreakdown } from '@/utils/political-lean';
import { computeGrade, GRADE_STYLE } from '@/utils/credibility-grade';
import { getSparklineData, getRealDelta } from '@/hooks/useLikelihoodHistory';
import SparkLine from '@/components/shared/SparkLine';

function getAgeLabel(updatedAt: string | undefined, lang: string): string {
  if (!updatedAt) return '';
  const ms = Date.now() - new Date(updatedAt).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return lang === 'he' ? `${mins}ד` : `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return lang === 'he' ? `${hrs}ש` : `${hrs}h`;
  return lang === 'he' ? `${Math.floor(hrs / 24)}י` : `${Math.floor(hrs / 24)}d`;
}
import LikelihoodMeter from '@/components/shared/LikelihoodMeter';
import LikelihoodTooltip from '@/components/shared/LikelihoodTooltip';
import DeltaIndicator from '@/components/shared/DeltaIndicator';
import SourceList from '@/components/shared/SourceList';
import ShareStoryButton from '@/components/shared/ShareStoryButton';
import ReaderMode from '@/components/shared/ReaderMode';
import BiasBar from '@/components/shared/BiasBar';
import BlindspotBadge from '@/components/shared/BlindspotBadge';
import StoryTimeline from '@/components/shared/StoryTimeline';

interface BriefCardProps {
  story: BriefStory;
  isWatched?: boolean;
  onWatchToggle?: () => void;
  relatedShock?: ShockEvent;
  hasIndependentCoverage?: boolean;
}

export default function BriefCard({ story, isWatched = false, onWatchToggle, relatedShock, hasIndependentCoverage }: BriefCardProps) {
  const { t, dir, lang } = useLanguage();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);
  const { open: openSidebar } = useSidebar();

  const hasDetailPage = false;
  const sourceCount = story.sources?.length || 0;
  const lean = getStoryLean(story);
  const leanData = lean ? LEAN_LABEL[lean] : null;

  const grade = computeGrade(story.sources);
  const gradeStyle = GRADE_STYLE[grade];

  const sparkData = getSparklineData(story.slug, 8);

  const leanBreakdown = getSourceLeanBreakdown(story.sources || []);
  const breakdownTitle = [
    leanBreakdown.left > 0 ? `${leanBreakdown.left} ${lang === 'he' ? 'שמאל' : 'Left'}` : '',
    leanBreakdown.center > 0 ? `${leanBreakdown.center} ${lang === 'he' ? 'מרכז' : 'Center'}` : '',
    leanBreakdown.right > 0 ? `${leanBreakdown.right} ${lang === 'he' ? 'ימין' : 'Right'}` : '',
  ].filter(Boolean).join(' · ');

  const realDelta = getRealDelta(story.slug, story.likelihood);
  const displayDelta = realDelta !== null ? realDelta : story.delta;

  // Show LIVE only for recent stories (< 2h) or stories with a shock
  const minsOld = story.updatedAt
    ? Math.floor((Date.now() - new Date(story.updatedAt).getTime()) / 60000)
    : 9999;
  const showLive = !story.resolved && (minsOld < 120 || !!relatedShock);

  const handleClick = () => {
    if (hasDetailPage) {
      router.push(`/story/${story.slug}`);
      return;
    }
    const onMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    if (onMobile) {
      setExpanded(prev => !prev);
      return;
    }
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
      className={`rounded-xl border transition-all cursor-pointer p-4 space-y-3 ${
        story.resolved
          ? 'border-gray-700/50 bg-gray-900/40 opacity-60 hover:opacity-80'
          : `border-gray-800 bg-gray-900/80 hover:bg-gray-800/80 card-glow ${story.isSignal ? 'signal-card' : ''}`
      }`}
    >
      {/* ── Top row ── */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: category + source count */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={`/topic/${encodeURIComponent(lang === 'he' ? story.category.he : story.category.en)}`}
            onClick={e => e.stopPropagation()}
            className="text-[11px] uppercase tracking-wider text-gray-500 hover:text-yellow-400 shrink-0 transition-colors font-medium"
          >
            {t(story.category)}
          </Link>

          {sourceCount > 0 && (() => {
            const veracityStyle = sourceCount === 1
              ? { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: '⚠' }
              : sourceCount >= 3
              ? { bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', text: 'text-emerald-400', icon: '✓' }
              : { bg: 'bg-gray-800', border: 'border-gray-700', text: 'text-gray-500', icon: null };
            return (
              <span
                title={breakdownTitle}
                className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium shrink-0 cursor-default ${veracityStyle.bg} ${veracityStyle.border} ${veracityStyle.text}`}
              >
                {veracityStyle.icon && <span className="me-0.5">{veracityStyle.icon}</span>}
                {sourceCount}
              </span>
            );
          })()}
        </div>

        {/* Right: age + live + signal + share + watch */}
        <div className="flex items-center gap-1.5 shrink-0">
          {(() => {
            const age = getAgeLabel(story.updatedAt, lang);
            const momentum = displayDelta > 3 ? '↑' : displayDelta < -3 ? '↓' : null;
            const momentumColor = displayDelta > 3 ? 'text-emerald-400' : 'text-red-400';
            if (!age) return null;
            return (
              <span className="text-[10px] font-mono text-gray-600 flex items-center gap-0.5">
                {age}
                {momentum && <span className={momentumColor}>{momentum}</span>}
              </span>
            );
          })()}

          {story.resolved ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400 border border-gray-600/30 font-medium">
              {lang === 'he' ? '✓' : '✓'}
            </span>
          ) : showLive && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium">
              LIVE
            </span>
          )}

          <SignalLabel isSignal={story.isSignal} />
          <ShareStoryButton story={story} />

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

      {/* ── Headline ── */}
      <h2 className="text-base font-bold leading-snug tracking-tight">{t(story.headline)}</h2>

      {/* ── Narrative split — compact 1-line ── */}
      {story.narrativeSplit && (
        <div className="flex items-center gap-2 text-[10px] px-2 py-1 rounded-md bg-gray-800/50 border border-gray-700/50">
          <span className="text-blue-400 font-medium truncate max-w-[30%]">{story.narrativeSplit.leftSource}</span>
          <span className="text-gray-600 shrink-0">↔</span>
          <span className="text-red-400 font-medium truncate max-w-[30%]">{story.narrativeSplit.rightSource}</span>
          <span className="ms-auto shrink-0 font-mono text-orange-400/70">gap {story.narrativeSplit.gapPct}%</span>
        </div>
      )}

      {/* ── Summary ── */}
      <p className={`text-sm text-gray-400 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>{t(story.summary)}</p>

      {/* Mobile expand toggle */}
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setExpanded(prev => !prev); }}
        className="sm:hidden text-[11px] text-yellow-400/70 hover:text-yellow-400 transition-colors flex items-center gap-1"
      >
        {expanded
          ? (lang === 'he' ? '▲ פחות' : '▲ Less')
          : (lang === 'he' ? '▼ עוד' : '▼ More')}
      </button>

      {/* ── Likelihood + Delta + Sparkline ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <div className="flex-1">
              <LikelihoodMeter value={story.likelihood} label={story.likelihoodLabel} components={story.signalComponents} />
            </div>
            <LikelihoodTooltip likelihood={story.likelihood} />
          </div>
        </div>
        <DeltaIndicator delta={displayDelta} />
        {sparkData.length >= 2 && <SparkLine data={sparkData} />}
      </div>

      {/* Timeline on watched */}
      {isWatched && sparkData.length >= 2 && (
        <div className="pt-1">
          <StoryTimeline slug={story.slug} currentLikelihood={story.likelihood} />
        </div>
      )}

      {/* ── Shock indicator ── */}
      {relatedShock && (
        <div
          onClick={e => {
            e.stopPropagation();
            document.getElementById('shocks')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30 cursor-pointer hover:border-orange-400/60 transition-colors"
        >
          <span className="text-orange-400 text-sm shrink-0">⚡</span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-orange-400/70 uppercase tracking-wider mb-0.5">
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

      {/* ── Sources (always visible) ── */}
      <SourceList sources={story.sources} />

      {/* ══ Expanded details ══ */}
      {expanded && !hasDetailPage && (
        <div className="pt-3 border-t border-gray-700/60 space-y-4">

          {/* Strategic implication */}
          {story.strategicImplication && (
            <div className="flex items-start gap-1.5 text-xs text-amber-300/80 leading-snug">
              <span className="shrink-0 mt-0.5">🎯</span>
              <span>{lang === 'he' ? story.strategicImplication.he : story.strategicImplication.en}</span>
            </div>
          )}

          {/* Secondary badges */}
          {(() => {
            const secondaryBadges = [];
            if (story.sources) {
              const blindspot = story.sources.filter((s: any) => s.lensCategory === 'il-independent').length > 0
                && story.sources.filter((s: any) => s.lensCategory === 'il-mainstream' || s.lensCategory === 'il-partisan').length === 0;
              if (blindspot) secondaryBadges.push(<BlindspotBadge key="blindspot" sources={story.sources} />);
            }
            if (hasIndependentCoverage) secondaryBadges.push(
              <span key="indie" className="text-[10px] px-1.5 py-0.5 rounded-full border font-medium shrink-0 bg-orange-500/15 border-orange-500/40 text-orange-400 cursor-default">
                🟠 {lang === 'he' ? 'עצמאי' : 'Indie'}
              </span>
            );
            if (story.indieVsMainstream && story.indieVsMainstream.divergenceScore >= 35) secondaryBadges.push(
              <span key="split" title={story.indieVsMainstream.divergenceNote ?? ''}
                className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium shrink-0 cursor-default ${
                  story.indieVsMainstream.divergenceScore >= 60
                    ? 'bg-red-500/10 border-red-500/25 text-red-400'
                    : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                }`}>
                ⚡ {lang === 'he' ? `פיצול ${story.indieVsMainstream.divergenceScore}%` : `Split ${story.indieVsMainstream.divergenceScore}%`}
              </span>
            );
            // Credibility + lean in expanded
            secondaryBadges.push(
              <span key="grade" title={gradeStyle.title}
                className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold shrink-0 ${gradeStyle.bg} ${gradeStyle.color}`}>
                {grade}
              </span>
            );
            if (leanData) secondaryBadges.push(
              <span key="lean" className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium shrink-0 ${leanData.bg} ${leanData.color}`}>
                {lang === 'he' ? leanData.he : leanData.en}
              </span>
            );
            if (secondaryBadges.length === 0) return null;
            return <div className="flex flex-wrap gap-1.5">{secondaryBadges}</div>;
          })()}

          {/* Expected impacts */}
          {story.impacts && story.impacts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
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
                  const arrow = impact.direction === 'positive' ? '↑' : impact.direction === 'negative' ? '↓' : '~';
                  return (
                    <span key={i} className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${color}`}>
                      {arrow} {lang === 'he' ? impact.sector.he : impact.sector.en}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Why + full narrative split */}
          {story.why && (
            <p className="text-sm italic text-gray-400">{t(story.why)}</p>
          )}
          {story.narrativeSplit && (
            <div className="rounded-lg overflow-hidden border border-gray-700/60 text-[11px]">
              <div className="grid grid-cols-2 divide-x divide-gray-700/50">
                <div className="px-3 py-2 space-y-0.5 border-s-2 border-blue-500/60">
                  <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wide truncate">{story.narrativeSplit.leftSource}</p>
                  <p className="text-gray-300 leading-snug line-clamp-2">{story.narrativeSplit.leftHeadline}</p>
                </div>
                <div className="px-3 py-2 space-y-0.5 border-s-2 border-red-500/60">
                  <p className="text-[9px] font-bold text-red-400 uppercase tracking-wide truncate">{story.narrativeSplit.rightSource}</p>
                  <p className="text-gray-300 leading-snug line-clamp-2">{story.narrativeSplit.rightHeadline}</p>
                </div>
              </div>
            </div>
          )}

          {/* Likelihood Timeline */}
          <StoryTimeline slug={story.slug} currentLikelihood={story.likelihood} />

          {/* Bias bar in expanded */}
          <BiasBar sources={story.sources} compact />

          {/* Cross-Media Echo */}
          {story.crossMediaEcho && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span>🔁</span>
              {story.crossMediaEcho.direction === 'indie-first' ? (
                <span className="text-orange-400/90">
                  <span className="font-semibold">{story.crossMediaEcho.firstSourceName}</span>{' '}
                  <span className="text-gray-400">
                    {lang === 'he'
                      ? `(עצמאי) פרסם ${story.crossMediaEcho.delayMinutes >= 60 ? `${Math.round(story.crossMediaEcho.delayMinutes / 60)}ש'` : `${story.crossMediaEcho.delayMinutes}ד'`} לפני הממסד`
                      : `(indie) broke ${story.crossMediaEcho.delayMinutes >= 60 ? `${Math.round(story.crossMediaEcho.delayMinutes / 60)}h` : `${story.crossMediaEcho.delayMinutes}m`} before mainstream`}
                  </span>
                </span>
              ) : (
                <span className="text-blue-400/80">
                  <span className="text-gray-400">
                    {lang === 'he'
                      ? `ממסד ↗ עצמאי — אחרי ${story.crossMediaEcho.delayMinutes >= 60 ? `${Math.round(story.crossMediaEcho.delayMinutes / 60)}ש'` : `${story.crossMediaEcho.delayMinutes}ד'`}`
                      : `mainstream → indie — ${story.crossMediaEcho.delayMinutes >= 60 ? `${Math.round(story.crossMediaEcho.delayMinutes / 60)}h` : `${story.crossMediaEcho.delayMinutes}m`} later`}
                  </span>
                </span>
              )}
            </div>
          )}

          {/* First-Mover */}
          {story.firstMover && story.firstMover.minsAhead >= 10 && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-400/80">
              <span>🚀</span>
              <span className="font-semibold">{story.firstMover.sourceName}</span>
              <span className="text-gray-500">
                {lang === 'he' ? `פרסם ראשון — ${story.firstMover.minsAhead} דקות לפני` : `broke first — ${story.firstMover.minsAhead}m ahead`}
              </span>
            </div>
          )}

          {/* Contradiction */}
          {story.contradiction && (
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-2 text-[11px] space-y-1">
              <div className="flex items-center gap-1 text-orange-400 font-semibold">
                <span>⚔️</span>
                <span>{lang === 'he' ? 'סיקור סותר' : 'Contradictory Coverage'}</span>
                <span className="ms-auto text-orange-400/60">{story.contradiction.gapPct}% gap</span>
              </div>
              <div className="text-gray-400 leading-snug">
                <span className="text-green-400/80 font-medium">{story.contradiction.sourceA}:</span>{' '}
                {story.contradiction.headlineA.slice(0, 80)}{story.contradiction.headlineA.length > 80 ? '…' : ''}
              </div>
              <div className="text-gray-400 leading-snug">
                <span className="text-red-400/80 font-medium">{story.contradiction.sourceB}:</span>{' '}
                {story.contradiction.headlineB.slice(0, 80)}{story.contradiction.headlineB.length > 80 ? '…' : ''}
              </div>
            </div>
          )}

          {/* Reader mode + Source links */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400">
                {lang === 'he' ? '🔗 מקורות' : '🔗 Sources'}
              </p>
              <button
                onClick={e => { e.stopPropagation(); setReaderOpen(true); }}
                title={lang === 'he' ? 'מצב קריאה' : 'Reader mode'}
                className="text-[10px] text-gray-500 hover:text-yellow-400 transition-colors flex items-center gap-1"
              >
                📖 {lang === 'he' ? 'קריאה' : 'Read'}
              </button>
            </div>
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
    </article>

    {readerOpen && <ReaderMode story={story} onClose={() => setReaderOpen(false)} />}
  </>
  );
}
