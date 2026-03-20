'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/context';

interface SignalVsMarket {
  topic: string;
  signalLikelihood: number;
  marketProbability: number;
  delta: number;
  alphaDirection: 'signal-higher' | 'market-higher' | 'aligned';
  alphaScore: number;
  whyDifferent: string;
  polymarketTitle: string;
  polymarketSlug: string;
  polymarketUrl: string;
  volume: number;
  liquidity: number;
  endDate: string;
  confidence: number;
  matchedKeywords: string[];
  sourceCount: number;
}

interface PolyData {
  matches: SignalVsMarket[];
  totalMarkets: number;
  totalStories: number;
  source: string;
  fetchedAt: string;
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function formatDate(d: string): string {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch { return ''; }
}

export default function PolymarketComparison() {
  const { lang } = useLanguage();
  const [data, setData] = useState<PolyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/polymarket');
      if (res.ok) setData(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 rounded-xl bg-gray-800/50" />
        ))}
      </div>
    );
  }

  if (!data || data.matches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        {lang === 'he' ? 'אין התאמות לשווקי תחזיות כרגע' : 'No prediction market matches found'}
      </div>
    );
  }

  // Summary stats
  const alphas = data.matches.filter(m => m.alphaDirection !== 'aligned');
  const avgDelta = data.matches.length > 0
    ? Math.round(data.matches.reduce((s, m) => s + Math.abs(m.delta), 0) / data.matches.length)
    : 0;
  const signalHigherCount = data.matches.filter(m => m.alphaDirection === 'signal-higher').length;
  const marketHigherCount = data.matches.filter(m => m.alphaDirection === 'market-higher').length;

  return (
    <div className="space-y-4">
      {/* Overview bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2.5 rounded-lg bg-gray-900 border border-gray-800 text-center">
          <div className="text-[9px] text-gray-500 uppercase">{lang === 'he' ? 'התאמות' : 'Matches'}</div>
          <div className="text-lg font-bold text-white">{data.matches.length}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-gray-900 border border-gray-800 text-center">
          <div className="text-[9px] text-gray-500 uppercase">{lang === 'he' ? 'אלפא' : 'Alphas'}</div>
          <div className="text-lg font-bold text-yellow-400">{alphas.length}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-gray-900 border border-gray-800 text-center">
          <div className="text-[9px] text-gray-500 uppercase">{lang === 'he' ? 'דלתא ממוצע' : 'Avg Delta'}</div>
          <div className="text-lg font-bold text-amber-400">{avgDelta}%</div>
        </div>
        <div className="p-2.5 rounded-lg bg-gray-900 border border-gray-800 text-center">
          <div className="text-[9px] text-gray-500 uppercase">Signal / Market</div>
          <div className="text-lg font-bold">
            <span className="text-yellow-400">{signalHigherCount}</span>
            <span className="text-gray-600 mx-1">/</span>
            <span className="text-blue-400">{marketHigherCount}</span>
          </div>
        </div>
      </div>

      {/* Source badge */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
          data.source === 'live'
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
            : 'bg-gray-800 text-gray-500 border border-gray-700'
        }`}>
          {data.source === 'live' ? 'LIVE Polymarket API' : 'DEMO DATA'}
        </span>
        <button onClick={fetchData} disabled={loading}
          className="text-[10px] text-gray-500 hover:text-white transition-colors">
          {loading ? '...' : '↻'}
        </button>
      </div>

      {/* Match cards */}
      {data.matches.map((match, i) => {
        const absDelta = Math.abs(match.delta);
        const isAligned = match.alphaDirection === 'aligned';
        const signalHigher = match.alphaDirection === 'signal-higher';
        const isExpanded = expandedIdx === i;

        // Visual: position marker on a divergence scale
        const midpoint = 50;
        const signalPos = match.signalLikelihood;
        const marketPos = match.marketProbability;

        return (
          <div
            key={i}
            onClick={() => setExpandedIdx(isExpanded ? null : i)}
            className={`rounded-xl border bg-gray-900/80 p-4 space-y-3 cursor-pointer transition-all ${
              isExpanded ? 'border-yellow-400/30 bg-gray-900' : 'border-gray-800 hover:border-gray-700'
            }`}
          >
            {/* Top: topic + alpha badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white">{match.topic}</h4>
                <p className="text-[10px] text-gray-500 truncate mt-0.5">
                  {match.polymarketTitle}
                </p>
              </div>
              <div className={`shrink-0 flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg ${
                isAligned
                  ? 'bg-gray-800 border border-gray-700'
                  : signalHigher
                    ? 'bg-yellow-500/10 border border-yellow-500/20'
                    : 'bg-blue-500/10 border border-blue-500/20'
              }`}>
                <span className={`text-lg font-black leading-none ${
                  isAligned ? 'text-gray-400' : signalHigher ? 'text-yellow-400' : 'text-blue-400'
                }`}>
                  {isAligned ? '=' : signalHigher ? `+${absDelta}` : `-${absDelta}`}
                </span>
                <span className="text-[8px] text-gray-500 uppercase">
                  {isAligned
                    ? (lang === 'he' ? 'מיושר' : 'aligned')
                    : (lang === 'he' ? 'אלפא' : 'alpha')
                  }
                </span>
              </div>
            </div>

            {/* Dual gauge */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-yellow-400 w-14 shrink-0 text-end font-semibold">Signal</span>
                <div className="flex-1 h-6 bg-gray-800 rounded-md overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500/90 to-yellow-400/70 rounded-md transition-all duration-700 flex items-center justify-end pr-2"
                    style={{ width: `${Math.max(8, match.signalLikelihood)}%` }}
                  >
                    <span className="text-[11px] font-bold text-gray-950">{match.signalLikelihood}%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-blue-400 w-14 shrink-0 text-end font-semibold">Market</span>
                <div className="flex-1 h-6 bg-gray-800 rounded-md overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500/90 to-blue-400/70 rounded-md transition-all duration-700 flex items-center justify-end pr-2"
                    style={{ width: `${Math.max(8, match.marketProbability)}%` }}
                  >
                    <span className="text-[11px] font-bold text-gray-950">{match.marketProbability}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-3 text-gray-500">
                <span>Vol: <span className="text-gray-400 font-medium">{formatVolume(match.volume)}</span></span>
                <span>{(match as any).sourceCount || match.sourceCount || '?'} {lang === 'he' ? 'מקורות' : 'sources'}</span>
                {match.endDate && (
                  <span className="hidden sm:inline">
                    {lang === 'he' ? 'עד' : 'Exp'}: {formatDate(match.endDate)}
                  </span>
                )}
              </div>
              <a
                href={match.polymarketUrl || `https://polymarket.com/event/${match.polymarketSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-blue-400 hover:text-blue-300 transition-colors underline underline-offset-2"
              >
                Polymarket ↗
              </a>
            </div>

            {/* Expanded: why different + details */}
            {isExpanded && (
              <div className="pt-3 border-t border-gray-800 space-y-3 animate-in fade-in duration-200">
                {/* Why different */}
                {match.whyDifferent && (
                  <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                    <h5 className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-1.5">
                      {lang === 'he' ? 'למה אנחנו חושבים אחרת?' : 'Why does Signal differ?'}
                    </h5>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {match.whyDifferent}
                    </p>
                  </div>
                )}

                {/* Detail grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded bg-gray-800/50 text-center">
                    <div className="text-[9px] text-gray-500">Alpha Score</div>
                    <div className={`text-sm font-bold ${
                      (match.alphaScore || 0) > 50 ? 'text-yellow-400' : 'text-gray-400'
                    }`}>{match.alphaScore || absDelta}</div>
                  </div>
                  <div className="p-2 rounded bg-gray-800/50 text-center">
                    <div className="text-[9px] text-gray-500">{lang === 'he' ? 'ביטחון' : 'Confidence'}</div>
                    <div className="text-sm font-bold text-gray-300">{match.confidence}%</div>
                  </div>
                  <div className="p-2 rounded bg-gray-800/50 text-center">
                    <div className="text-[9px] text-gray-500">{lang === 'he' ? 'נזילות' : 'Liquidity'}</div>
                    <div className="text-sm font-bold text-gray-300">{formatVolume(match.liquidity || 0)}</div>
                  </div>
                </div>

                {/* Keywords */}
                <div className="flex flex-wrap gap-1">
                  {match.matchedKeywords.map(kw => (
                    <span key={kw} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700/50">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Expand hint */}
            {!isExpanded && (match.whyDifferent || !isAligned) && (
              <div className="text-[9px] text-gray-600 text-center">
                {lang === 'he' ? 'לחץ לפרטים ▾' : 'Click for details ▾'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
