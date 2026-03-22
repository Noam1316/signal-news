'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/context';

interface CoverageGap {
  topic: string;
  coveredBy: string[];
  missingFrom: string[];
  articleCount: number;
  gapScore: number;
  direction: string;
}

interface NarrativeDivergence {
  topic: string;
  leftNarrative: { sentiment: string; framing: string; articleCount: number };
  rightNarrative: { sentiment: string; framing: string; articleCount: number };
  divergenceScore: number;
  examples: { source: string; bias: string; title: string }[];
}

interface BiasData {
  coverageGaps: CoverageGap[];
  narrativeDivergence: NarrativeDivergence[];
  biasDistribution: Record<string, number>;
  factualDistribution: Record<string, number>;
  sourcesInDb: number;
  mappedArticles: number;
  totalArticles: number;
  analyzedAt: string;
}

const BIAS_COLORS: Record<string, { bg: string; text: string; label: { en: string; he: string } }> = {
  'far-left':     { bg: 'bg-red-600',     text: 'text-red-400',    label: { en: 'Far Left',     he: 'שמאל קיצוני' } },
  'left':         { bg: 'bg-red-500',     text: 'text-red-400',    label: { en: 'Left',         he: 'שמאל' } },
  'center-left':  { bg: 'bg-orange-500',  text: 'text-orange-400', label: { en: 'Center-Left',  he: 'מרכז-שמאל' } },
  'center':       { bg: 'bg-gray-400',    text: 'text-gray-300',   label: { en: 'Center',       he: 'מרכז' } },
  'center-right': { bg: 'bg-blue-400',    text: 'text-blue-400',   label: { en: 'Center-Right', he: 'מרכז-ימין' } },
  'right':        { bg: 'bg-violet-500',  text: 'text-violet-400', label: { en: 'Right',        he: 'ימין' } },
  'far-right':    { bg: 'bg-violet-700',  text: 'text-violet-400', label: { en: 'Far Right',    he: 'ימין קיצוני' } },
};

const BIAS_ORDER = ['far-left', 'left', 'center-left', 'center', 'center-right', 'right', 'far-right'];

const DIRECTION_LABELS: Record<string, { en: string; he: string; color: string }> = {
  'left-only':     { en: 'Left Only',     he: 'שמאל בלבד',    color: 'text-red-400' },
  'right-only':    { en: 'Right Only',    he: 'ימין בלבד',    color: 'text-violet-400' },
  'center-only':   { en: 'Center Only',   he: 'מרכז בלבד',   color: 'text-gray-400' },
  'both-extremes': { en: 'Extremes Only', he: 'קצוות בלבד',  color: 'text-amber-400' },
  'balanced':      { en: 'Balanced',      he: 'מאוזן',       color: 'text-green-400' },
};

const SENTIMENT_ICONS: Record<string, string> = {
  positive: '↑', negative: '↓', neutral: '→', mixed: '↔',
};

const FACTUAL_COLORS: Record<string, string> = {
  'very-high': 'bg-emerald-500',
  'high': 'bg-green-500',
  'mostly-factual': 'bg-yellow-500',
  'mixed': 'bg-orange-500',
  'low': 'bg-red-500',
};

export default function MediaBiasPanel() {
  const { lang } = useLanguage();
  const [data, setData] = useState<BiasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'gaps' | 'divergence' | 'distribution'>('distribution');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bias');
      if (res.ok) setData(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-lg bg-gray-800/50" />)}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        {lang === 'he' ? 'שגיאה בטעינת נתוני הטיה' : 'Failed to load bias data'}
      </div>
    );
  }

  const totalBias = Object.values(data.biasDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="flex items-center gap-3 text-[10px] text-gray-500">
        <span>{data.mappedArticles}/{data.totalArticles} {lang === 'he' ? 'כתבות ממופות' : 'articles mapped'}</span>
        <span>{data.sourcesInDb} {lang === 'he' ? 'מקורות במאגר' : 'sources in DB'}</span>
      </div>
      <p className="text-[10px] text-gray-600">
        {lang === 'he' ? 'סנטימנט נקבע לפי ניתוח מילות מפתח בכותרות' : 'Sentiment determined by keyword analysis of titles'}
      </p>

      {/* Sub-tabs */}
      <div className="flex gap-2">
        {([
          { id: 'distribution', en: 'Distribution', he: 'התפלגות' },
          { id: 'gaps', en: 'Coverage Gaps', he: 'פערי כיסוי' },
          { id: 'divergence', en: 'Narrative Split', he: 'פיצול נרטיבי' },
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

      {/* Distribution view */}
      {view === 'distribution' && (
        <div className="space-y-4">
          {/* Bias spectrum bar */}
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300">
              {lang === 'he' ? 'ספקטרום הטיה של מקורות' : 'Source Bias Spectrum'}
            </h3>
            {/* Legend */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
              <span className="text-[10px] text-gray-500">
                {lang === 'he' ? 'ספקטרום:' : 'Spectrum:'}
              </span>
              <span className="text-[10px] text-red-400">←</span>
              <span className="text-[10px] text-gray-400">{lang === 'he' ? 'שמאל' : 'Left'}</span>
              <div className="flex-1 h-1.5 rounded bg-gradient-to-r from-red-500 via-gray-400 to-violet-500" />
              <span className="text-[10px] text-gray-400">{lang === 'he' ? 'ימין' : 'Right'}</span>
              <span className="text-[10px] text-violet-400">→</span>
            </div>
            <div className="flex h-10 rounded-lg overflow-hidden bg-gray-800">
              {BIAS_ORDER.map(bias => {
                const count = data.biasDistribution[bias] || 0;
                const pct = totalBias > 0 ? (count / totalBias) * 100 : 0;
                if (pct === 0) return null;
                const c = BIAS_COLORS[bias];
                return (
                  <div
                    key={bias}
                    className={`${c.bg} flex items-center justify-center transition-all duration-700 relative group cursor-default`}
                    style={{ width: `${pct}%` }}
                  >
                    {pct > 8 && <span className="text-[10px] font-bold text-white">{Math.round(pct)}%</span>}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-1 rounded bg-gray-950 border border-gray-700 text-[10px] text-white whitespace-nowrap z-10">
                      {lang === 'he' ? c.label.he : c.label.en}: {count} ({Math.round(pct)}%)
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {BIAS_ORDER.map(bias => {
                const count = data.biasDistribution[bias] || 0;
                if (count === 0) return null;
                const c = BIAS_COLORS[bias];
                return (
                  <div key={bias} className="flex items-center gap-1.5 text-xs">
                    <span className={`w-3 h-3 rounded ${c.bg}`} />
                    <span className="text-gray-300">{lang === 'he' ? c.label.he : c.label.en}</span>
                    <span className="text-gray-500">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Factual rating */}
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300">
              {lang === 'he' ? 'דירוג עובדתיות מקורות' : 'Source Factual Rating'}
            </h3>
            <div className="space-y-2">
              {Object.entries(data.factualDistribution)
                .sort((a, b) => b[1] - a[1])
                .map(([rating, count]) => {
                  const pct = totalBias > 0 ? (count / totalBias) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-28 capitalize">{rating.replace(/-/g, ' ')}</span>
                      <div className="flex-1 h-4 bg-gray-800 rounded-md overflow-hidden">
                        <div
                          className={`h-full ${FACTUAL_COLORS[rating] || 'bg-gray-500'} rounded-md transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-end">{count}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Coverage Gaps view */}
      {view === 'gaps' && (
        <div className="space-y-3">
          {data.coverageGaps.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              {lang === 'he' ? 'לא נמצאו פערי כיסוי משמעותיים' : 'No significant coverage gaps found'}
            </div>
          ) : (
            data.coverageGaps.map((gap, i) => {
              const dirConfig = DIRECTION_LABELS[gap.direction] || DIRECTION_LABELS['balanced'];
              return (
                <div key={i} className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">{gap.topic}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${dirConfig.color}`}>
                        {lang === 'he' ? dirConfig.he : dirConfig.en}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
                        Gap: {gap.gapScore}%
                      </span>
                    </div>
                  </div>

                  {/* Spectrum visualization */}
                  <div className="flex gap-0.5">
                    {BIAS_ORDER.map(bias => {
                      const covered = gap.coveredBy.includes(bias);
                      const c = BIAS_COLORS[bias];
                      return (
                        <div
                          key={bias}
                          className={`flex-1 h-3 rounded-sm transition-all ${
                            covered ? c.bg : 'bg-gray-800 border border-gray-700 border-dashed'
                          }`}
                          title={`${lang === 'he' ? c.label.he : c.label.en}: ${covered ? 'covered' : 'missing'}`}
                        />
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    <span>{gap.articleCount} {lang === 'he' ? 'כתבות' : 'articles'}</span>
                    <span>
                      {lang === 'he' ? 'חסר: ' : 'Missing: '}
                      {gap.missingFrom.slice(0, 3).map(b => lang === 'he' ? BIAS_COLORS[b]?.label.he : BIAS_COLORS[b]?.label.en).join(', ')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Narrative Divergence view */}
      {view === 'divergence' && (
        <div className="space-y-3">
          {data.narrativeDivergence.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              {lang === 'he' ? 'לא נמצאו פיצולים נרטיביים משמעותיים' : 'No significant narrative divergences found'}
            </div>
          ) : (
            data.narrativeDivergence.map((div, i) => (
              <div key={i} className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">{div.topic}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    div.divergenceScore >= 70
                      ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                      : div.divergenceScore >= 50
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                        : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}>
                    {lang === 'he' ? 'פיצול' : 'Split'}: {div.divergenceScore}%
                  </span>
                </div>

                {/* Left vs Right comparison */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Left side */}
                  <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-[10px] font-semibold text-red-400">
                        {lang === 'he' ? 'שמאל' : 'Left'}
                      </span>
                      <span className="text-[10px] text-gray-600">({div.leftNarrative.articleCount})</span>
                    </div>
                    <div className="text-[10px] text-gray-400 space-y-1">
                      <div>
                        {SENTIMENT_ICONS[div.leftNarrative.sentiment] || '→'}{' '}
                        {div.leftNarrative.sentiment}
                      </div>
                      <div className="capitalize">
                        {lang === 'he' ? 'מסגור: ' : 'Frame: '}{div.leftNarrative.framing}
                      </div>
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-2 h-2 rounded-full bg-violet-500" />
                      <span className="text-[10px] font-semibold text-violet-400">
                        {lang === 'he' ? 'ימין' : 'Right'}
                      </span>
                      <span className="text-[10px] text-gray-600">({div.rightNarrative.articleCount})</span>
                    </div>
                    <div className="text-[10px] text-gray-400 space-y-1">
                      <div>
                        {SENTIMENT_ICONS[div.rightNarrative.sentiment] || '→'}{' '}
                        {div.rightNarrative.sentiment}
                      </div>
                      <div className="capitalize">
                        {lang === 'he' ? 'מסגור: ' : 'Frame: '}{div.rightNarrative.framing}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Example headlines */}
                {div.examples.length > 0 && (
                  <div className="space-y-1">
                    {div.examples.slice(0, 4).map((ex, j) => {
                      const bc = BIAS_COLORS[ex.bias];
                      return (
                        <div key={j} className="flex items-start gap-2 text-[10px]">
                          <span className={`shrink-0 px-1 py-0.5 rounded ${bc?.bg || 'bg-gray-600'} text-white font-bold`}>
                            {ex.source.substring(0, 6)}
                          </span>
                          <span className="text-gray-400 line-clamp-1">{ex.title}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
