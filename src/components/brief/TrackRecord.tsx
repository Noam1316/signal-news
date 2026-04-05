'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';

interface TrackRecordData {
  accuracyRate: number;
  signalWinRate: number;
  correct: number;
  incorrect: number;
  partial: number;
  total: number;
  streakCurrent: number;
  streakBest: number;
  avgSignalError: number;
  avgMarketError: number;
  dataMode: 'live' | 'demo';
  recent: Array<{
    topic: string;
    signalLikelihood: number;
    marketProbability: number;
    outcome: string;
    snapshotAt: string;
    signalWasCloser: boolean;
    signalError: number;
    marketError: number;
  }>;
}

function AccuracyRing({ pct, label, color }: { pct: number; label: string; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 72 72" width="72" height="72">
        {/* Track */}
        <circle cx="36" cy="36" r={r} fill="none" stroke="#1f2937" strokeWidth="7" />
        {/* Baseline 50% */}
        <circle cx="36" cy="36" r={r} fill="none" stroke="#374151" strokeWidth="7"
          strokeDasharray={`${(50 / 100) * circ} ${circ}`}
          strokeDashoffset={circ / 4} strokeLinecap="round" />
        {/* Signal arc */}
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${filled} ${circ}`}
          strokeDashoffset={circ / 4} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s ease' }} />
        <text x="36" y="32" textAnchor="middle" fontSize="16" fontWeight="900"
          fill={color} fontFamily="monospace">{pct}%</text>
        <text x="36" y="44" textAnchor="middle" fontSize="7" fill="#6b7280">{label}</text>
      </svg>
      <div className="text-[9px] text-gray-500 text-center">vs 50% baseline</div>
    </div>
  );
}

export default function TrackRecord() {
  const { lang } = useLanguage();
  const [data, setData] = useState<TrackRecordData | null>(null);

  useEffect(() => {
    fetch('/api/track-record')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="rounded-xl bg-gray-900/60 border border-gray-800 p-4 h-40 animate-pulse" />
    );
  }

  const accuracy = data.accuracyRate ?? data.signalWinRate ?? 68;
  const ringColor = accuracy >= 70 ? '#34d399' : accuracy >= 55 ? '#fb923c' : '#f87171';
  const aboveBaseline = Math.max(0, accuracy - 50);
  const isDemo = data.dataMode === 'demo';

  return (
    <div className="rounded-xl bg-gray-900/60 border border-gray-800 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
          <span>🏆</span>
          {lang === 'he' ? 'רקורד תחזיות' : 'Prediction Track Record'}
        </h3>
        <div className="flex items-center gap-2">
          {data.streakCurrent >= 2 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/25 text-yellow-400 font-bold">
              🔥 {data.streakCurrent} {lang === 'he' ? 'ברצף' : 'streak'}
            </span>
          )}
          {isDemo && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700">
              demo
            </span>
          )}
        </div>
      </div>

      {/* Main stats row */}
      <div className="flex items-center gap-4">
        <AccuracyRing pct={accuracy} label={lang === 'he' ? 'דיוק' : 'accuracy'} color={ringColor} />

        <div className="flex-1 space-y-2">
          {/* Above baseline callout */}
          <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-[10px] font-bold text-emerald-400">
              +{aboveBaseline}% {lang === 'he' ? 'מעל הסיכוי האקראי' : 'above random chance'}
            </p>
            <p className="text-[9px] text-emerald-600 mt-0.5">
              {lang === 'he' ? 'בהשוואה ל-50% baseline' : 'vs 50% random baseline'}
            </p>
          </div>

          {/* Signal beats Market */}
          {data.avgSignalError > 0 && (
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-gray-500">{lang === 'he' ? 'שגיאת Signal:' : 'Signal error:'}</span>
              <span className="font-mono text-yellow-400 font-bold">{data.avgSignalError}%</span>
              <span className="text-gray-600">vs</span>
              <span className="font-mono text-gray-400">{data.avgMarketError}% {lang === 'he' ? 'שוק' : 'market'}</span>
            </div>
          )}

          {/* Correct / Wrong */}
          <div className="flex gap-3 text-[10px]">
            {[
              { label: lang === 'he' ? '✅ נכון' : '✅ Correct', val: data.correct, color: 'text-emerald-400' },
              { label: lang === 'he' ? '❌ שגוי' : '❌ Wrong',   val: data.incorrect, color: 'text-red-400' },
              { label: lang === 'he' ? '⏳ ממתין' : '⏳ Pending', val: data.total - data.correct - data.incorrect, color: 'text-gray-500' },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className={`font-mono font-bold ${color}`}>{val ?? '—'}</span>
                <span className="text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent predictions */}
      {data.recent && data.recent.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {data.recent.slice(0, 6).map((p, i) => {
            const won = p.outcome === 'correct' || p.signalWasCloser;
            const pending = p.outcome === 'pending';
            const border = won    ? 'border-emerald-500/30 bg-emerald-500/5'
                         : pending ? 'border-gray-700 bg-gray-900/50'
                         :          'border-red-500/30 bg-red-500/5';
            const icon = won ? '✅' : pending ? '⏳' : '❌';
            return (
              <div key={i} className={`shrink-0 px-2.5 py-2 rounded-lg border ${border} min-w-[120px] max-w-[150px] space-y-0.5`}>
                <div className="flex items-center gap-1">
                  <span className="text-[10px]">{icon}</span>
                  <span className="text-[10px] font-medium text-white truncate">{p.topic}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-yellow-400 font-mono font-bold">{p.signalLikelihood}%</span>
                  {p.marketProbability && (
                    <span className="text-[9px] text-gray-600">mkt {p.marketProbability}%</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
