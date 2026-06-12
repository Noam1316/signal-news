'use client';

/**
 * LiveStoryIntel — intelligence sections for the live story page:
 *  1. LikelihoodHistoryChart — real persisted trend (from /api/story-history)
 *  2. IndieVsMainstreamSection — narrative analysis already on the story
 *  3. MarketMatchCard — the Signal vs Market match for this story, if any
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/i18n/context';
import type { BriefStory } from '@/lib/types';

// ─── 1. Likelihood history chart ─────────────────────────────────────────────

interface HistoryPoint { ts: number; likelihood: number }

function LikelihoodHistoryChart({ slug }: { slug: string }) {
  const { lang, dir } = useLanguage();
  const isHe = lang === 'he';
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/story-history?slug=${encodeURIComponent(slug)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.points) setPoints(d.points); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [slug]);

  if (!loaded || points.length < 2) return null;

  // Chart geometry
  const W = 600, H = 120, PAD = 8;
  const minTs = points[0].ts;
  const maxTs = points[points.length - 1].ts;
  const tsSpan = Math.max(1, maxTs - minTs);

  const x = (ts: number) => PAD + ((ts - minTs) / tsSpan) * (W - PAD * 2);
  const y = (v: number) => H - PAD - (v / 100) * (H - PAD * 2);

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.ts).toFixed(1)} ${y(p.likelihood).toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${x(maxTs).toFixed(1)} ${H - PAD} L ${x(minTs).toFixed(1)} ${H - PAD} Z`;

  const first = points[0].likelihood;
  const last = points[points.length - 1].likelihood;
  const delta = last - first;
  const hoursSpan = Math.round(tsSpan / (60 * 60 * 1000));
  const trendColor = delta > 2 ? '#34d399' : delta < -2 ? '#f87171' : '#9ca3af';

  return (
    <div dir={dir} className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <span>📈</span>
          <span>{isHe ? 'מגמת סבירות' : 'Likelihood Trend'}</span>
          <span className="text-gray-600 normal-case font-normal">
            · {hoursSpan >= 24 ? `${Math.round(hoursSpan / 24)} ${isHe ? 'ימים' : 'd'}` : `${hoursSpan}${isHe ? 'ש' : 'h'}`}
          </span>
        </div>
        <span className="text-xs font-bold tabular-nums" style={{ color: trendColor }}>
          {delta > 0 ? '+' : ''}{delta}%
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24" preserveAspectRatio="none">
        {/* Grid lines at 25/50/75 */}
        {[25, 50, 75].map(v => (
          <line key={v} x1={PAD} x2={W - PAD} y1={y(v)} y2={y(v)} stroke="#1f2937" strokeWidth="1" strokeDasharray="4 4" />
        ))}
        <path d={areaPath} fill={trendColor} opacity="0.08" />
        <path d={linePath} fill="none" stroke={trendColor} strokeWidth="2" strokeLinejoin="round" />
        {/* End dot */}
        <circle cx={x(maxTs)} cy={y(last)} r="3.5" fill={trendColor} />
      </svg>

      <div className="flex justify-between text-[9px] text-gray-600" dir="ltr">
        <span>{new Date(minTs).toLocaleString(isHe ? 'he-IL' : 'en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        <span>{new Date(maxTs).toLocaleString(isHe ? 'he-IL' : 'en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}

// ─── 2. Indie vs Mainstream section ──────────────────────────────────────────

const FRAMING_LABELS: Record<string, { he: string; en: string }> = {
  assertive:     { he: 'סמכותי', en: 'Assertive' },
  skeptical:     { he: 'ספקני', en: 'Skeptical' },
  alarming:      { he: 'מדאיג', en: 'Alarming' },
  investigative: { he: 'חוקר', en: 'Investigative' },
  editorial:     { he: 'דעתי', en: 'Editorial' },
};

function IndieVsMainstreamSection({ story }: { story: BriefStory }) {
  const { lang, dir } = useLanguage();
  const isHe = lang === 'he';
  const ivm = story.indieVsMainstream;
  if (!ivm) return null;

  const scoreColor =
    ivm.divergenceScore >= 60 ? 'text-red-400' :
    ivm.divergenceScore >= 35 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div dir={dir} className="rounded-xl border border-orange-500/15 bg-orange-500/[0.03] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <span>🔍</span>
          <span>{isHe ? 'עצמאי מול ממסד' : 'Indie vs Mainstream'}</span>
        </div>
        <span className={`text-xs font-bold tabular-nums ${scoreColor}`}>
          {isHe ? 'פיצול' : 'split'} {ivm.divergenceScore}%
        </span>
      </div>

      {ivm.divergenceNote && (
        <p className="text-sm text-orange-300/90 leading-snug">{ivm.divergenceNote}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Indie */}
        <div className="rounded-lg border border-orange-500/20 bg-orange-500/[0.04] p-3 space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-orange-400">🟠 {isHe ? 'עצמאי' : 'Indie'}</span>
            <span className="text-gray-500">{ivm.indieCount} {isHe ? 'כתבות' : 'articles'}</span>
          </div>
          {ivm.indieExclusive.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {ivm.indieExclusive.slice(0, 4).map((w, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-200">{w}</span>
              ))}
            </div>
          )}
          {ivm.framingIndie.length > 0 && (
            <p className="text-[10px] text-gray-500">
              {isHe ? 'סגנון: ' : 'Framing: '}
              {ivm.framingIndie.map(f => isHe ? (FRAMING_LABELS[f.category]?.he ?? f.category) : (FRAMING_LABELS[f.category]?.en ?? f.category)).join(' · ')}
            </p>
          )}
        </div>

        {/* Mainstream */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/[0.04] p-3 space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-blue-400">🔵 {isHe ? 'ממסד' : 'Mainstream'}</span>
            <span className="text-gray-500">{ivm.mainstreamCount} {isHe ? 'כתבות' : 'articles'}</span>
          </div>
          {ivm.mainstreamExclusive.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {ivm.mainstreamExclusive.slice(0, 4).map((w, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-200">{w}</span>
              ))}
            </div>
          )}
          {ivm.framingMainstream.length > 0 && (
            <p className="text-[10px] text-gray-500">
              {isHe ? 'סגנון: ' : 'Framing: '}
              {ivm.framingMainstream.map(f => isHe ? (FRAMING_LABELS[f.category]?.he ?? f.category) : (FRAMING_LABELS[f.category]?.en ?? f.category)).join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* Cross-media echo */}
      {story.crossMediaEcho && (
        <p className="text-[11px] text-gray-400">
          🔁 {story.crossMediaEcho.direction === 'indie-first'
            ? (isHe
              ? `${story.crossMediaEcho.firstSourceName} (עצמאי) פרסם ${story.crossMediaEcho.delayMinutes >= 60 ? `${Math.round(story.crossMediaEcho.delayMinutes / 60)} שעות` : `${story.crossMediaEcho.delayMinutes} דק'`} לפני הממסד`
              : `${story.crossMediaEcho.firstSourceName} (indie) broke this ${story.crossMediaEcho.delayMinutes >= 60 ? `${Math.round(story.crossMediaEcho.delayMinutes / 60)}h` : `${story.crossMediaEcho.delayMinutes}m`} before mainstream`)
            : (isHe
              ? `הממסד (${story.crossMediaEcho.firstSourceName}) פרסם ${story.crossMediaEcho.delayMinutes >= 60 ? `${Math.round(story.crossMediaEcho.delayMinutes / 60)} שעות` : `${story.crossMediaEcho.delayMinutes} דק'`} לפני העצמאי`
              : `Mainstream (${story.crossMediaEcho.firstSourceName}) was ${story.crossMediaEcho.delayMinutes >= 60 ? `${Math.round(story.crossMediaEcho.delayMinutes / 60)}h` : `${story.crossMediaEcho.delayMinutes}m`} ahead of indie`)}
        </p>
      )}
    </div>
  );
}

// ─── 3. Market match card ────────────────────────────────────────────────────

interface MarketMatch {
  storySlug: string;
  signalLikelihood: number;
  marketProbability: number;
  delta: number;
  alphaDirection: string;
  alphaScore: number;
  polymarketTitle: string;
  polymarketUrl: string;
  volume: number;
}

function MarketMatchCard({ slug }: { slug: string }) {
  const { lang, dir } = useLanguage();
  const isHe = lang === 'he';
  const [match, setMatch] = useState<MarketMatch | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/polymarket')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const m = (d?.matches ?? []).find((x: MarketMatch) => x.storySlug === slug);
        if (m) setMatch(m);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [slug]);

  if (!loaded || !match) return null;

  const fmtVol = match.volume >= 1_000_000
    ? `$${(match.volume / 1_000_000).toFixed(1)}M`
    : match.volume >= 1_000 ? `$${Math.round(match.volume / 1_000)}K` : `$${match.volume}`;

  const gapColor = Math.abs(match.delta) > 20 ? 'text-amber-400' : 'text-gray-400';

  return (
    <div dir={dir} className="rounded-xl border border-blue-500/15 bg-blue-500/[0.03] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <span>🎰</span>
          <span>{isHe ? 'שוק ניבוי תואם' : 'Matched Prediction Market'}</span>
        </div>
        <span className="text-[10px] text-gray-600">{fmtVol} {isHe ? 'נפח' : 'volume'}</span>
      </div>

      <p className="text-sm text-gray-200 leading-snug" dir="ltr">{match.polymarketTitle}</p>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-yellow-400 font-bold tabular-nums">{match.signalLikelihood}%</span>
          <span className="text-[10px] text-gray-500">Signal</span>
        </div>
        <span className={`text-xs font-bold tabular-nums ${gapColor}`}>
          Δ{Math.abs(match.delta)}%
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-blue-400 font-bold tabular-nums">{match.marketProbability}%</span>
          <span className="text-[10px] text-gray-500">Market</span>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Link
          href="/dashboard#intel"
          className="text-[11px] text-blue-400/80 hover:text-blue-300 transition-colors"
        >
          {isHe ? 'ניתוח מלא ב-Intel Hub ←' : 'Full analysis in Intel Hub →'}
        </Link>
        <a
          href={match.polymarketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          Polymarket ↗
        </a>
      </div>
    </div>
  );
}

// ─── Combined export ─────────────────────────────────────────────────────────

export default function LiveStoryIntel({ story }: { story: BriefStory }) {
  return (
    <div className="space-y-4">
      <LikelihoodHistoryChart slug={story.slug} />
      <IndieVsMainstreamSection story={story} />
      <MarketMatchCard slug={story.slug} />
    </div>
  );
}
