'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AlphaPreview {
  topic: string;
  alphaScore: number;
  delta: number;
  text: string;
}

interface PreviewData {
  todaysTweet: { text: string; charCount: number; match: any } | null;
  allPreviews: AlphaPreview[];
}

export default function LiveAlphaCard({ lang }: { lang: 'he' | 'en' }) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tweet-preview')
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const match = data?.todaysTweet?.match ?? data?.allPreviews?.[0];

  if (loading) {
    return (
      <div className="w-full max-w-lg mx-auto rounded-2xl border border-gray-800 bg-gray-900/60 p-5 animate-pulse space-y-3">
        <div className="h-3 w-32 bg-gray-800 rounded" />
        <div className="h-5 w-full bg-gray-800 rounded" />
        <div className="h-8 bg-gray-800/60 rounded-xl" />
      </div>
    );
  }

  if (!match) return null;

  const signal = match.signalLikelihood ?? match.signal ?? 0;
  const market = match.marketProbability ?? match.market ?? 0;
  const delta  = match.delta ?? 0;
  const alpha  = match.alphaScore ?? match.alphaScore ?? 0;
  const topic  = match.topic ?? match.polymarketTitle ?? '';
  const signalHigher = delta > 0;

  return (
    <div className="w-full max-w-lg mx-auto rounded-2xl border border-yellow-400/20 bg-gradient-to-br from-yellow-400/5 via-gray-900 to-gray-900 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/80">
            {lang === 'he' ? 'Alpha חי עכשיו' : 'Live Alpha Right Now'}
          </span>
        </div>
        <span className="text-[10px] text-gray-600">
          {lang === 'he' ? 'מחושב מ-28+ מקורות' : 'From 28+ sources'}
        </span>
      </div>

      {/* Topic */}
      <p className="text-sm font-semibold text-white leading-snug line-clamp-2">{topic}</p>

      {/* Signal vs Market axis */}
      <div className="space-y-2">
        {/* Labels */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-yellow-400 font-bold">⚡ Signal {signal}%</span>
          <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
            Math.abs(delta) >= 20
              ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
              : 'bg-gray-800 text-gray-400 border border-gray-700'
          }`}>
            Δ {delta > 0 ? '+' : ''}{delta}pts
          </span>
          <span className="text-blue-400 font-bold">Market {market}%</span>
        </div>

        {/* Visual axis */}
        <div className="relative h-6 flex items-center" dir="ltr">
          <div className="absolute inset-x-0 h-1.5 rounded-full bg-gray-800" />
          {/* gap */}
          <div
            className="absolute h-1.5 rounded-full bg-yellow-400/30"
            style={{
              left: `${Math.min(signal, market)}%`,
              width: `${Math.abs(delta)}%`,
            }}
          />
          {/* market dot */}
          <div className="absolute w-4 h-4 rounded-full bg-blue-400 border-2 border-gray-900 shadow-lg"
            style={{ left: `calc(${market}% - 8px)` }} />
          {/* signal dot */}
          <div className="absolute w-4 h-4 rounded-full bg-yellow-400 border-2 border-gray-900 shadow-lg"
            style={{ left: `calc(${signal}% - 8px)` }} />
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span>0%</span>
          <span className={`font-medium ${signalHigher ? 'text-yellow-400' : 'text-blue-400'}`}>
            {signalHigher
              ? (lang === 'he' ? 'Signal רואה יותר סיכוי מהשוק ↑' : 'Signal sees more upside than market ↑')
              : (lang === 'he' ? 'Signal רואה פחות סיכוי מהשוק ↓' : 'Signal sees less upside than market ↓')}
          </span>
          <span>100%</span>
        </div>
      </div>

      {/* Alpha score */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-800">
        <span className="text-[11px] text-gray-500">
          {lang === 'he' ? 'ציון Alpha' : 'Alpha Score'}
        </span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${alpha}%` }} />
          </div>
          <span className="text-xs font-bold text-yellow-400 font-mono">{alpha}/100</span>
        </div>
      </div>

      {/* CTA */}
      <Link
        href="/dashboard"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-yellow-400/10 border border-yellow-400/25 text-yellow-400 text-sm font-semibold hover:bg-yellow-400/20 transition-colors"
      >
        {lang === 'he' ? 'ראה את כל ה-Signals ←' : 'See all signals →'}
      </Link>
    </div>
  );
}
