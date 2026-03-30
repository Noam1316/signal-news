'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/context';
import IntelDigest from './IntelDigest';

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
    enrichment?: {
      enrichedArticles: number;
      totalInCache: number;
      maxCapacity: number;
    };
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
    <div dir={dir} className="space-y-4">
      {/* Intelligence Digest — synthesized top insights */}
      <IntelDigest />

      {/* Compact header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400">
          {lang === 'he' ? 'ניתוח חי' : 'Live Analysis'}
        </h3>
        <button onClick={fetchAnalysis} disabled={loading}
          className="text-[10px] text-gray-500 hover:text-white transition-colors disabled:opacity-50">
          {loading ? '...' : '↻'}
        </button>
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">{error}</div>
      )}

      {data && (
        <>
          {/* Compact stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: { he: 'כתבות', en: 'Articles' }, value: data.stats.total, color: 'text-white' },
              { label: { he: 'סיגנל', en: 'Signal' }, value: data.stats.signals, color: 'text-yellow-400', sub: `${data.stats.signalRatio}%` },
              { label: { he: 'רעש', en: 'Noise' }, value: data.stats.noise, color: 'text-gray-500' },
              { label: { he: 'נושאים', en: 'Topics' }, value: data.trending.length, color: 'text-blue-400' },
            ].map((s) => (
              <div key={s.label.en} className="p-3 rounded-lg bg-gray-900 border border-gray-800 text-center">
                <div className="text-[10px] text-gray-500 uppercase">{lang === 'he' ? s.label.he : s.label.en}</div>
                <div className={`text-2xl font-bold ${s.color} mt-0.5`}>{s.value}</div>
                {s.sub && <div className="text-[10px] text-gray-500">{s.sub}</div>}
              </div>
            ))}
          </div>

          {/* Enrichment stats — full text scraping */}
          {data.stats.enrichment && data.stats.enrichment.enrichedArticles > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-emerald-400 font-medium">
                {lang === 'he'
                  ? `${data.stats.enrichment.enrichedArticles}/${data.stats.enrichment.totalInCache} כתבות מועשרות בטקסט מלא`
                  : `${data.stats.enrichment.enrichedArticles}/${data.stats.enrichment.totalInCache} articles enriched with full text`}
              </span>
              <span className="text-[9px] text-gray-600 ms-auto">
                {lang === 'he' ? 'ניתוח פוליטי מבוסס תוכן' : 'Content-based political analysis'}
              </span>
            </div>
          )}

          {/* Sentiment + Political — compact side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-gray-900 border border-gray-800 space-y-2">
              <h3 className="text-xs font-semibold text-gray-400">{lang === 'he' ? 'סנטימנט' : 'Sentiment'}</h3>
              <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-800">
                {Object.entries(data.stats.sentimentBreakdown).map(([s, count]) => {
                  const c = SENTIMENT_CONFIG[s as keyof typeof SENTIMENT_CONFIG];
                  return <div key={s} className={`${c?.bg || 'bg-gray-500'}`} style={{ width: `${totalSentiment > 0 ? (count/totalSentiment)*100 : 0}%` }} />;
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.stats.sentimentBreakdown).map(([s, count]) => {
                  const c = SENTIMENT_CONFIG[s as keyof typeof SENTIMENT_CONFIG];
                  return <span key={s} className="text-[10px] text-gray-400">{c?.icon} {count}</span>;
                })}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-gray-900 border border-gray-800 space-y-2">
              <h3 className="text-xs font-semibold text-gray-400">{lang === 'he' ? 'נטייה פוליטית' : 'Political Leaning'}</h3>
              <div className="flex h-2.5 rounded-lg overflow-hidden bg-gray-800">
                {LEANING_ORDER.map((l) => {
                  const count = data.stats.politicalBreakdown[l] || 0;
                  const pct = totalPolitical > 0 ? (count/totalPolitical)*100 : 0;
                  if (pct === 0) return null;
                  return <div key={l} style={{ width: `${pct}%`, backgroundColor: LEANING_CONFIG[l].color }} />;
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {LEANING_ORDER.map((l) => {
                  const count = data.stats.politicalBreakdown[l] || 0;
                  if (count === 0) return null;
                  return <span key={l} className={`text-[10px] ${LEANING_CONFIG[l].textColor}`}>{lang === 'he' ? LEANING_CONFIG[l].he : LEANING_CONFIG[l].en} {count}</span>;
                })}
              </div>
            </div>
          </div>

          {/* Trending Topics — compact list, max 8 */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
              <span className="text-yellow-400">🔥</span>{lang === 'he' ? 'נושאים חמים' : 'Trending'}
            </h3>
            {data.trending.slice(0, 8).map((topic, i) => {
              const maxCount = data.trending[0]?.count || 1;
              const pct = (topic.count / maxCount) * 100;
              const sc = SENTIMENT_CONFIG[topic.sentiment];
              return (
                <div key={topic.topic} className="relative flex items-center justify-between p-2.5 rounded-lg bg-gray-900 border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors">
                  <div className="absolute inset-y-0 start-0 bg-yellow-400/5" style={{ width: `${pct}%` }} />
                  <div className="relative flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-600 w-4">{i+1}</span>
                    <span className="text-sm font-medium text-white">{topic.topic}</span>
                    <span className={`text-[10px] ${sc?.color}`}>{sc?.icon}</span>
                  </div>
                  <div className="relative flex items-center gap-1.5">
                    <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-800 w-16">
                      {LEANING_ORDER.map((l) => {
                        const cnt = topic.leaningBreakdown?.[l] || 0;
                        const lPct = topic.count > 0 ? (cnt/topic.count)*100 : 0;
                        if (lPct === 0) return null;
                        return <div key={l} style={{ width: `${lPct}%`, backgroundColor: LEANING_CONFIG[l].color }} />;
                      })}
                    </div>
                    <span className="text-xs font-mono font-bold text-yellow-400 w-6 text-end">{topic.count}</span>
                  </div>
                </div>
              );
            })}
            {data.trending.length === 0 && (
              <div className="text-center py-6 text-gray-500 text-sm">
                {lang === 'he' ? 'אין מספיק כתבות לניתוח' : 'Not enough articles to analyze'}
              </div>
            )}
          </div>

          {data.analyzedAt && (
            <p className="text-[10px] text-gray-600 text-center">
              {new Date(data.analyzedAt).toLocaleString(lang === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </>
      )}
    </div>
  );
}
