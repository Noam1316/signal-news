'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/context';

interface SignalVsMarket {
  topic: string;
  signalLikelihood: number;
  marketProbability: number;
  delta: number;
  alphaDirection: 'signal-higher' | 'market-higher' | 'aligned';
  polymarketTitle: string;
  polymarketSlug: string;
  volume: number;
  confidence: number;
  matchedKeywords: string[];
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

export default function PolymarketComparison() {
  const { lang } = useLanguage();
  const [data, setData] = useState<PolyData | null>(null);
  const [loading, setLoading] = useState(true);

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
          <div key={i} className="h-24 rounded-lg bg-gray-800/50" />
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

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {data.matches.length} {lang === 'he' ? 'התאמות' : 'matches'}
            {' / '}
            {data.totalMarkets} {lang === 'he' ? 'שווקים' : 'markets'}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            data.source === 'live'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
              : 'bg-gray-800 text-gray-500 border border-gray-700'
          }`}>
            {data.source === 'live' ? 'LIVE' : 'DEMO'}
          </span>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="text-xs text-gray-500 hover:text-white transition-colors"
        >
          {lang === 'he' ? 'רענן' : 'Refresh'}
        </button>
      </div>

      {/* Match cards */}
      {data.matches.map((match, i) => {
        const absDelta = Math.abs(match.delta);
        const isAligned = match.alphaDirection === 'aligned';
        const signalHigher = match.alphaDirection === 'signal-higher';

        return (
          <div
            key={i}
            className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 space-y-3 hover:border-gray-700 transition-colors"
          >
            {/* Topic */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white truncate">{match.topic}</h4>
                <p className="text-[10px] text-gray-500 truncate mt-0.5">
                  Polymarket: {match.polymarketTitle}
                </p>
              </div>
              {/* Alpha badge */}
              <div className={`shrink-0 text-[10px] px-2 py-1 rounded-full font-bold ${
                isAligned
                  ? 'bg-gray-800 text-gray-400 border border-gray-700'
                  : signalHigher
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
              }`}>
                {isAligned
                  ? (lang === 'he' ? 'מיושר' : 'Aligned')
                  : signalHigher
                    ? `Signal +${absDelta}%`
                    : `Market +${absDelta}%`
                }
              </div>
            </div>

            {/* Visual comparison bar */}
            <div className="space-y-2">
              {/* Signal bar */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-yellow-400 w-12 shrink-0 text-end">Signal</span>
                <div className="flex-1 h-5 bg-gray-800 rounded-md overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500/80 to-yellow-400/60 rounded-md transition-all duration-700 flex items-center justify-end pr-1.5"
                    style={{ width: `${match.signalLikelihood}%` }}
                  >
                    <span className="text-[10px] font-bold text-gray-950">{match.signalLikelihood}%</span>
                  </div>
                </div>
              </div>
              {/* Market bar */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-blue-400 w-12 shrink-0 text-end">Market</span>
                <div className="flex-1 h-5 bg-gray-800 rounded-md overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500/80 to-blue-400/60 rounded-md transition-all duration-700 flex items-center justify-end pr-1.5"
                    style={{ width: `${match.marketProbability}%` }}
                  >
                    <span className="text-[10px] font-bold text-gray-950">{match.marketProbability}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom row: volume + confidence + keywords */}
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-3">
                <span className="text-gray-500">
                  Vol: <span className="text-gray-400">{formatVolume(match.volume)}</span>
                </span>
                <span className="text-gray-500">
                  {lang === 'he' ? 'ביטחון' : 'Conf'}: <span className="text-gray-400">{match.confidence}%</span>
                </span>
              </div>
              <div className="flex gap-1">
                {match.matchedKeywords.slice(0, 3).map(kw => (
                  <span key={kw} className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700/50">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
