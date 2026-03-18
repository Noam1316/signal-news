'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/context';

interface TrendingTopic {
  topic: string;
  count: number;
  sources: string[];
  lenses: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  leaningBreakdown: Record<string, number>;
}

interface TopicByLeaning {
  topic: string;
  leanings: Record<string, { count: number; sentiment: string }>;
  totalCount: number;
}

interface AnalysisData {
  trending: TrendingTopic[];
  topicsByLeaning: TopicByLeaning[];
  stats: {
    total: number;
    signals: number;
    noise: number;
    signalRatio: number;
    sentimentBreakdown: Record<string, number>;
    regionBreakdown: Record<string, number>;
    politicalBreakdown: Record<string, number>;
    sentimentByLeaning: Record<string, Record<string, number>>;
  };
  analyzedAt: string;
}

const SENTIMENT_CONFIG = {
  positive: { color: 'text-green-400', bg: 'bg-green-400', icon: '↑', he: 'חיובי', en: 'Positive' },
  negative: { color: 'text-red-400', bg: 'bg-red-400', icon: '↓', he: 'שלילי', en: 'Negative' },
  neutral: { color: 'text-gray-400', bg: 'bg-gray-400', icon: '→', he: 'ניטרלי', en: 'Neutral' },
  mixed: { color: 'text-amber-400', bg: 'bg-amber-400', icon: '↔', he: 'מעורב', en: 'Mixed' },
};

const REGION_CONFIG: Record<string, { he: string; en: string; color: string }> = {
  israel: { he: 'ישראל', en: 'Israel', color: 'bg-blue-400' },
  'middle-east': { he: 'מזרח תיכון', en: 'Middle East', color: 'bg-amber-400' },
  global: { he: 'עולמי', en: 'Global', color: 'bg-green-400' },
};

type PoliticalLeaning = 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'unknown';

const LEANING_CONFIG: Record<PoliticalLeaning, { he: string; en: string; color: string; bg: string; textColor: string }> = {
  left:           { he: 'שמאל',       en: 'Left',          color: '#ef4444', bg: 'bg-red-500',    textColor: 'text-red-400' },
  'center-left':  { he: 'מרכז-שמאל',  en: 'Center-Left',   color: '#f97316', bg: 'bg-orange-500', textColor: 'text-orange-400' },
  center:         { he: 'מרכז',       en: 'Center',        color: '#a3a3a3', bg: 'bg-gray-400',   textColor: 'text-gray-300' },
  'center-right': { he: 'מרכז-ימין',  en: 'Center-Right',  color: '#60a5fa', bg: 'bg-blue-400',   textColor: 'text-blue-400' },
  right:          { he: 'ימין',       en: 'Right',         color: '#8b5cf6', bg: 'bg-violet-500', textColor: 'text-violet-400' },
  unknown:        { he: 'לא ידוע',    en: 'Unknown',       color: '#525252', bg: 'bg-gray-600',   textColor: 'text-gray-500' },
};

const LEANING_ORDER: PoliticalLeaning[] = ['left', 'center-left', 'center', 'center-right', 'right'];

export default function IntelDashboard() {
  const { lang, dir } = useLanguage();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze');
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setData(json);
    } catch {
      setError(lang === 'he' ? 'שגיאה בניתוח' : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const totalSentiment = data?.stats.sentimentBreakdown
    ? Object.values(data.stats.sentimentBreakdown).reduce((a, b) => a + b, 0) : 0;
  const totalRegion = data?.stats.regionBreakdown
    ? Object.values(data.stats.regionBreakdown).reduce((a, b) => a + b, 0) : 0;
  const totalPolitical = data?.stats.politicalBreakdown
    ? Object.values(data.stats.politicalBreakdown).reduce((a, b) => a + b, 0) : 0;

  return (
    <div dir={dir} className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-yellow-400">🧠</span>
            {lang === 'he' ? 'מודיעין AI' : 'AI Intelligence'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {lang === 'he' ? 'ניתוח אוטומטי של כתבות RSS בזמן אמת' : 'Automated analysis of live RSS articles'}
          </p>
        </div>
        <button onClick={fetchAnalysis} disabled={loading}
          className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-50">
          {loading ? (lang === 'he' ? 'מנתח...' : 'Analyzing...') : (lang === 'he' ? 'רענן' : 'Refresh')}
        </button>
      </header>

      {loading && !data && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</div>
      )}

      {data && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
              <div className="text-xs text-gray-500 uppercase tracking-wider">{lang === 'he' ? 'כתבות' : 'Articles'}</div>
              <div className="text-3xl font-bold text-white mt-1">{data.stats.total}</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
              <div className="text-xs text-gray-500 uppercase tracking-wider">{lang === 'he' ? 'סיגנל' : 'Signal'}</div>
              <div className="text-3xl font-bold text-yellow-400 mt-1">{data.stats.signals}</div>
              <div className="text-xs text-gray-500 mt-0.5">{data.stats.signalRatio}%</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
              <div className="text-xs text-gray-500 uppercase tracking-wider">{lang === 'he' ? 'רעש' : 'Noise'}</div>
              <div className="text-3xl font-bold text-gray-500 mt-1">{data.stats.noise}</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
              <div className="text-xs text-gray-500 uppercase tracking-wider">{lang === 'he' ? 'נושאים' : 'Topics'}</div>
              <div className="text-3xl font-bold text-blue-400 mt-1">{data.trending.length}</div>
            </div>
          </div>

          {/* Sentiment & Region */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
              <h3 className="text-sm font-semibold text-gray-300">{lang === 'he' ? 'סנטימנט' : 'Sentiment'}</h3>
              <div className="flex h-3 rounded-full overflow-hidden bg-gray-800">
                {Object.entries(data.stats.sentimentBreakdown).map(([s, count]) => {
                  const c = SENTIMENT_CONFIG[s as keyof typeof SENTIMENT_CONFIG];
                  return <div key={s} className={`${c?.bg || 'bg-gray-500'} transition-all`} style={{ width: `${totalSentiment > 0 ? (count/totalSentiment)*100 : 0}%` }} />;
                })}
              </div>
              <div className="flex flex-wrap gap-3">
                {Object.entries(data.stats.sentimentBreakdown).map(([s, count]) => {
                  const c = SENTIMENT_CONFIG[s as keyof typeof SENTIMENT_CONFIG];
                  return <div key={s} className="flex items-center gap-1.5 text-xs"><span className={`w-2 h-2 rounded-full ${c?.bg}`} /><span className="text-gray-400">{lang === 'he' ? c?.he : c?.en}: {count}</span></div>;
                })}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
              <h3 className="text-sm font-semibold text-gray-300">{lang === 'he' ? 'אזור גאוגרפי' : 'Region'}</h3>
              <div className="flex h-3 rounded-full overflow-hidden bg-gray-800">
                {Object.entries(data.stats.regionBreakdown).map(([r, count]) => {
                  const c = REGION_CONFIG[r];
                  return <div key={r} className={`${c?.color || 'bg-gray-500'} transition-all`} style={{ width: `${totalRegion > 0 ? (count/totalRegion)*100 : 0}%` }} />;
                })}
              </div>
              <div className="flex flex-wrap gap-3">
                {Object.entries(data.stats.regionBreakdown).map(([r, count]) => {
                  const c = REGION_CONFIG[r];
                  return <div key={r} className="flex items-center gap-1.5 text-xs"><span className={`w-2 h-2 rounded-full ${c?.color}`} /><span className="text-gray-400">{lang === 'he' ? c?.he : c?.en}: {count}</span></div>;
                })}
              </div>
            </div>
          </div>

          {/* Political Distribution */}
          <section className="p-5 rounded-xl bg-gray-900 border border-gray-800 space-y-4">
            <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
              <span>🏛️</span>{lang === 'he' ? 'התפלגות פוליטית של מקורות' : 'Political Distribution of Sources'}
            </h3>
            <div className="flex h-8 rounded-lg overflow-hidden bg-gray-800">
              {LEANING_ORDER.map((l) => {
                const count = data.stats.politicalBreakdown[l] || 0;
                const pct = totalPolitical > 0 ? (count/totalPolitical)*100 : 0;
                if (pct === 0) return null;
                const c = LEANING_CONFIG[l];
                return (
                  <div key={l} className="flex items-center justify-center transition-all duration-700 relative group"
                    style={{ width: `${pct}%`, backgroundColor: c.color }}>
                    {pct > 8 && <span className="text-[10px] font-bold text-white">{Math.round(pct)}%</span>}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-1 rounded bg-gray-950 border border-gray-700 text-[10px] text-white whitespace-nowrap z-10">
                      {lang === 'he' ? c.he : c.en}: {count}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {LEANING_ORDER.map((l) => {
                const count = data.stats.politicalBreakdown[l] || 0;
                if (count === 0) return null;
                const c = LEANING_CONFIG[l];
                return <div key={l} className="flex items-center gap-1.5 text-xs"><span className={`w-3 h-3 rounded ${c.bg}`} /><span className="text-gray-300 font-medium">{lang === 'he' ? c.he : c.en}</span><span className="text-gray-500">{count}</span></div>;
              })}
            </div>
          </section>

          {/* Sentiment × Political Leaning */}
          <section className="p-5 rounded-xl bg-gray-900 border border-gray-800 space-y-4">
            <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
              <span>📊</span>{lang === 'he' ? 'סנטימנט לפי הפלגה פוליטית' : 'Sentiment by Political Leaning'}
            </h3>
            <p className="text-xs text-gray-500">{lang === 'he' ? 'איך כל צד של הספקטרום הפוליטי מכסה את החדשות' : 'How each side of the political spectrum covers the news'}</p>
            <div className="space-y-3">
              {LEANING_ORDER.map((l) => {
                const sents = data.stats.sentimentByLeaning?.[l];
                if (!sents) return null;
                const total = Object.values(sents).reduce((a, b) => a + b, 0);
                if (total === 0) return null;
                const c = LEANING_CONFIG[l];
                return (
                  <div key={l} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${c.textColor}`}>{lang === 'he' ? c.he : c.en}</span>
                      <span className="text-[10px] text-gray-500">{total} {lang === 'he' ? 'כתבות' : 'articles'}</span>
                    </div>
                    <div className="flex h-5 rounded-md overflow-hidden bg-gray-800">
                      {(['negative', 'mixed', 'neutral', 'positive'] as const).map((s) => {
                        const cnt = sents[s] || 0;
                        const pct = (cnt/total)*100;
                        if (pct === 0) return null;
                        const sc = SENTIMENT_CONFIG[s];
                        return <div key={s} className={`${sc.bg} flex items-center justify-center transition-all`} style={{ width: `${pct}%` }}
                          title={`${lang === 'he' ? sc.he : sc.en}: ${cnt}`}>
                          {pct > 12 && <span className="text-[9px] font-bold text-gray-950">{Math.round(pct)}%</span>}
                        </div>;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 pt-1">
              {(['negative', 'mixed', 'neutral', 'positive'] as const).map((s) => {
                const c = SENTIMENT_CONFIG[s];
                return <div key={s} className="flex items-center gap-1 text-[10px]"><span className={`w-2 h-2 rounded-sm ${c.bg}`} /><span className="text-gray-400">{lang === 'he' ? c.he : c.en}</span></div>;
              })}
            </div>
          </section>

          {/* Topic × Political Heatmap */}
          {data.topicsByLeaning && data.topicsByLeaning.length > 0 && (
            <section className="p-5 rounded-xl bg-gray-900 border border-gray-800 space-y-4">
              <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                <span>🗺️</span>{lang === 'he' ? 'נושאים × הפלגה פוליטית' : 'Topics × Political Leaning'}
              </h3>
              <p className="text-xs text-gray-500">{lang === 'he' ? 'גודל העיגול = כמות כתבות, צבע = סנטימנט' : 'Circle size = article count, color = sentiment'}</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-start text-xs text-gray-500 font-medium pb-2 pe-4 min-w-[120px]">{lang === 'he' ? 'נושא' : 'Topic'}</th>
                      {LEANING_ORDER.map((l) => <th key={l} className="text-center text-[10px] font-medium pb-2 px-2 min-w-[60px]"><span className={LEANING_CONFIG[l].textColor}>{lang === 'he' ? LEANING_CONFIG[l].he : LEANING_CONFIG[l].en}</span></th>)}
                      <th className="text-center text-xs text-gray-500 font-medium pb-2 ps-3">{lang === 'he' ? 'סה"כ' : 'Total'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topicsByLeaning.map((topic) => {
                      const maxInRow = Math.max(...LEANING_ORDER.map((l) => topic.leanings[l]?.count || 0));
                      return (
                        <tr key={topic.topic} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 pe-4 text-sm font-medium text-white">{topic.topic}</td>
                          {LEANING_ORDER.map((l) => {
                            const cell = topic.leanings[l];
                            const count = cell?.count || 0;
                            if (count === 0) return <td key={l} className="py-3 px-2 text-center text-gray-700">—</td>;
                            const size = Math.max(16, Math.min(36, (count/Math.max(maxInRow,1))*36));
                            const sentColor = cell?.sentiment ? SENTIMENT_CONFIG[cell.sentiment as keyof typeof SENTIMENT_CONFIG]?.bg || 'bg-gray-500' : 'bg-gray-500';
                            return <td key={l} className="py-3 px-2"><div className="flex items-center justify-center"><div className={`rounded-full ${sentColor} flex items-center justify-center`} style={{ width: `${size}px`, height: `${size}px` }}><span className="text-[9px] font-bold text-gray-950">{count}</span></div></div></td>;
                          })}
                          <td className="py-3 ps-3 text-center"><span className="text-sm font-mono font-bold text-yellow-400">{topic.totalCount}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Trending Topics */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
              <span className="text-yellow-400">🔥</span>{lang === 'he' ? 'נושאים חמים' : 'Trending Topics'}
            </h2>
            <div className="space-y-2">
              {data.trending.map((topic, i) => {
                const maxCount = data.trending[0]?.count || 1;
                const pct = (topic.count / maxCount) * 100;
                const sc = SENTIMENT_CONFIG[topic.sentiment];
                return (
                  <div key={topic.topic} className="relative p-3 rounded-lg bg-gray-900 border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors">
                    <div className="absolute inset-y-0 start-0 bg-yellow-400/5" style={{ width: `${pct}%` }} />
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-gray-600 w-5">{String(i+1).padStart(2,'0')}</span>
                        <div>
                          <span className="font-medium text-white">{topic.topic}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] ${sc?.color}`}>{sc?.icon} {lang === 'he' ? sc?.he : sc?.en}</span>
                            <span className="text-[10px] text-gray-600">·</span>
                            <span className="text-[10px] text-gray-500">{topic.sources.length} {lang === 'he' ? 'מקורות' : 'sources'}</span>
                          </div>
                          <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-800 mt-1.5 max-w-[180px]">
                            {LEANING_ORDER.map((l) => {
                              const cnt = topic.leaningBreakdown?.[l] || 0;
                              const lPct = topic.count > 0 ? (cnt/topic.count)*100 : 0;
                              if (lPct === 0) return null;
                              return <div key={l} style={{ width: `${lPct}%`, backgroundColor: LEANING_CONFIG[l].color }} />;
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold text-yellow-400">{topic.count}</span>
                        <span className="text-[10px] text-gray-600">{lang === 'he' ? 'כתבות' : 'articles'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {data.trending.length === 0 && (
              <div className="text-center py-10 text-gray-500 text-sm">
                {lang === 'he' ? 'אין מספיק כתבות לניתוח. טען כתבות מדף Explore קודם.' : 'Not enough articles to analyze. Load articles from Explore first.'}
              </div>
            )}
          </section>

          {data.analyzedAt && (
            <p className="text-xs text-gray-600 text-center">
              {lang === 'he' ? 'נותח ב-' : 'Analyzed at '}
              {new Date(data.analyzedAt).toLocaleString(lang === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
            </p>
          )}
        </>
      )}
    </div>
  );
}
