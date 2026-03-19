'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';
import { generateDemoTrackRecord, calculateTrackRecordStats, type TrackRecordStats, type Prediction } from '@/services/track-record';

const OUTCOME_STYLE: Record<string, { bg: string; text: string; icon: string }> = {
  correct:   { bg: 'bg-emerald-500/15', text: 'text-emerald-400', icon: '✓' },
  incorrect: { bg: 'bg-red-500/15',     text: 'text-red-400',     icon: '✗' },
  partial:   { bg: 'bg-amber-500/15',   text: 'text-amber-400',   icon: '◐' },
  pending:   { bg: 'bg-gray-800',       text: 'text-gray-500',    icon: '⏳' },
};

export default function TrackRecord() {
  const { lang } = useLanguage();
  const [stats, setStats] = useState<TrackRecordStats | null>(null);
  const [view, setView] = useState<'overview' | 'predictions' | 'calibration'>('overview');

  useEffect(() => {
    const predictions = generateDemoTrackRecord();
    setStats(calculateTrackRecordStats(predictions));
  }, []);

  if (!stats) return <div className="animate-pulse h-64 rounded-xl bg-gray-800/50" />;

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: lang === 'he' ? 'דיוק' : 'Accuracy', value: `${stats.accuracyRate}%`, color: 'text-emerald-400' },
          { label: 'Brier Score', value: stats.brierScore.toFixed(2), color: stats.brierScore < 0.25 ? 'text-emerald-400' : 'text-amber-400' },
          { label: lang === 'he' ? 'רצף נוכחי' : 'Current Streak', value: `🔥 ${stats.streakCurrent}`, color: 'text-yellow-400' },
          { label: 'Signal vs Market', value: `${stats.signalVsMarketWins}W-${stats.signalVsMarketLosses}L`, color: stats.signalVsMarketWins > stats.signalVsMarketLosses ? 'text-emerald-400' : 'text-red-400' },
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/80 p-3 text-center">
            <p className="text-[10px] text-gray-500 uppercase">{kpi.label}</p>
            <p className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2">
        {([
          { id: 'overview', en: 'Overview', he: 'סקירה' },
          { id: 'predictions', en: 'Predictions', he: 'תחזיות' },
          { id: 'calibration', en: 'Calibration', he: 'כיול' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              view === tab.id
                ? 'border-yellow-400/50 bg-yellow-400/10 text-yellow-400'
                : 'border-gray-800 text-gray-500 hover:text-gray-300'
            }`}
          >
            {lang === 'he' ? tab.he : tab.en}
          </button>
        ))}
      </div>

      {/* Overview */}
      {view === 'overview' && (
        <div className="space-y-4">
          {/* Donut-style distribution */}
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              {lang === 'he' ? 'התפלגות תוצאות' : 'Outcome Distribution'}
            </h3>
            <div className="flex items-center gap-6">
              <div className="flex gap-1 h-32 items-end flex-1">
                {[
                  { label: lang === 'he' ? 'נכון' : 'Correct', count: stats.correct, color: 'bg-emerald-500' },
                  { label: lang === 'he' ? 'חלקי' : 'Partial', count: stats.partial, color: 'bg-amber-500' },
                  { label: lang === 'he' ? 'שגוי' : 'Wrong', count: stats.incorrect, color: 'bg-red-500' },
                  { label: lang === 'he' ? 'ממתין' : 'Pending', count: stats.pending, color: 'bg-gray-600' },
                ].map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-white">{item.count}</span>
                    <div
                      className={`w-full ${item.color} rounded-t transition-all duration-700`}
                      style={{ height: `${(item.count / stats.totalPredictions) * 100}%`, minHeight: '4px' }}
                    />
                    <span className="text-[8px] text-gray-500">{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="text-center shrink-0">
                <p className="text-4xl font-bold text-emerald-400">{stats.accuracyRate}%</p>
                <p className="text-[10px] text-gray-500">{stats.resolved} {lang === 'he' ? 'נפתרו' : 'resolved'}</p>
              </div>
            </div>
          </div>

          {/* By topic performance */}
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-2">
            <h3 className="text-sm font-semibold text-gray-300">
              {lang === 'he' ? 'ביצועים לפי נושא' : 'Performance by Topic'}
            </h3>
            {Object.entries(stats.byTopic)
              .sort((a, b) => b[1].total - a[1].total)
              .slice(0, 8)
              .map(([topic, data]) => (
                <div key={topic} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-40 truncate">{topic}</span>
                  <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        data.accuracy >= 70 ? 'bg-emerald-500' : data.accuracy >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${data.accuracy}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 w-16 text-end">
                    {data.correct}/{data.total} ({data.accuracy}%)
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Predictions list */}
      {view === 'predictions' && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {stats.recentPredictions.map((p) => {
            const style = OUTCOME_STYLE[p.outcome || 'pending'];
            return (
              <div key={p.id} className="p-3 rounded-xl bg-gray-900 border border-gray-800 flex items-center gap-3">
                <span className={`text-lg w-8 text-center ${style.text}`}>{style.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{p.topic}</p>
                  <p className="text-[10px] text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString()} · {p.source}
                  </p>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-sm font-bold text-yellow-400">{p.predictedLikelihood}%</p>
                  {p.marketProbability != null && (
                    <p className="text-[10px] text-gray-500">mkt: {p.marketProbability}%</p>
                  )}
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full ${style.bg} ${style.text} capitalize`}>
                  {p.outcome}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Calibration chart */}
      {view === 'calibration' && (
        <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300">
            {lang === 'he' ? 'גרף כיול — תחזית מול תוצאה' : 'Calibration Chart — Predicted vs Actual'}
          </h3>
          <p className="text-[10px] text-gray-500">
            {lang === 'he'
              ? 'כיול מושלם = העמודות צמודות לקו האלכסוני'
              : 'Perfect calibration = bars match the diagonal line'}
          </p>
          <div className="space-y-3">
            {stats.calibrationBuckets.map((bucket) => (
              <div key={bucket.range} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-16">{bucket.range}</span>
                <div className="flex-1 space-y-1">
                  {/* Predicted */}
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-gray-600 w-14">{lang === 'he' ? 'תחזית' : 'Predicted'}</span>
                    <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500/60 rounded-full" style={{ width: `${bucket.predicted}%` }} />
                    </div>
                    <span className="text-[8px] text-gray-500 w-8">{bucket.predicted}%</span>
                  </div>
                  {/* Actual */}
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-gray-600 w-14">{lang === 'he' ? 'בפועל' : 'Actual'}</span>
                    <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${
                        Math.abs(bucket.actual - bucket.predicted) < 15 ? 'bg-emerald-500/60' : 'bg-red-500/60'
                      }`} style={{ width: `${bucket.actual}%` }} />
                    </div>
                    <span className="text-[8px] text-gray-500 w-8">{bucket.actual}%</span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-600 w-6">n={bucket.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
