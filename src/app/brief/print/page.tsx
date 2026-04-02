'use client';

import { useEffect, useState } from 'react';
import type { BriefStory, ShockEvent } from '@/lib/types';

interface AlphaItem {
  topic: string;
  signalLikelihood: number;
  marketProbability: number;
  delta: number;
  alphaScore: number;
  alphaDirection: string;
  whyDifferent: string;
  polymarketTitle?: string;
}

interface PrintData {
  stories: BriefStory[];
  shocks: ShockEvent[];
  topAlpha: AlphaItem | null;
  biasTop: { topic: string; gap: string } | null;
  generatedAt: string;
  generatedAtHe: string;
  riskIndex: number | null;
}

const CONFIDENCE_COLOR: Record<string, string> = {
  high:   '#10b981',
  medium: '#f59e0b',
  low:    '#6b7280',
};

function getText(h: any, lang: 'he' | 'en'): string {
  if (!h) return '';
  if (typeof h === 'string') return h;
  return lang === 'he' ? (h.he || h.en || '') : (h.en || h.he || '');
}

export default function PrintBriefPage() {
  const [data, setData] = useState<PrintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [lang, setLang] = useState<'he' | 'en'>('he');

  // Read language from localStorage (same as main app)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('signal_lang');
      if (saved === 'en') setLang('en');
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [storiesRes, shocksRes, previewRes, biasRes, analyzeRes] = await Promise.allSettled([
          fetch('/api/stories'),
          fetch('/api/shocks'),
          fetch('/api/tweet-preview'),
          fetch('/api/bias'),
          fetch('/api/analyze'),
        ]);

        const storiesData = storiesRes.status === 'fulfilled' && storiesRes.value.ok
          ? await storiesRes.value.json() : {};
        const shocksData = shocksRes.status === 'fulfilled' && shocksRes.value.ok
          ? await shocksRes.value.json() : {};
        const previewData = previewRes.status === 'fulfilled' && previewRes.value.ok
          ? await previewRes.value.json() : {};
        const biasData = biasRes.status === 'fulfilled' && biasRes.value.ok
          ? await biasRes.value.json() : {};
        const analyzeData = analyzeRes.status === 'fulfilled' && analyzeRes.value.ok
          ? await analyzeRes.value.json() : {};

        const stories: BriefStory[] = storiesData.stories || [];
        const shocks: ShockEvent[] = shocksData.shocks || [];

        // Risk index
        const sent = analyzeData?.stats?.sentimentBreakdown || {};
        const sentTotal = Object.values(sent).reduce((a: number, b) => a + (b as number), 0) as number;
        const negRatio = sentTotal > 0 ? ((sent.negative || 0) / sentTotal) : 0.4;
        const sentScore = Math.round(negRatio * 40);
        const shockPressure = shocks.reduce((acc, s) => acc + (s.confidence === 'high' ? 16 : s.confidence === 'medium' ? 8 : 4), 0);
        const shockScore = Math.min(40, shockPressure);
        const signalScore = Math.round((analyzeData?.stats?.signalRatio || 0) * 20);
        const riskIndex = sentTotal > 0 ? Math.min(100, sentScore + shockScore + signalScore) : null;

        const topAlpha: AlphaItem | null = previewData?.todaysTweet?.match || null;

        const gaps: any[] = biasData?.coverageGaps || [];
        const topGap = gaps[0] || null;
        const biasTop = topGap ? {
          topic: topGap.topic?.he || topGap.topic?.en || topGap.topic || '',
          gap: topGap.description?.he || topGap.description?.en || topGap.description || '',
        } : null;

        const now = new Date();
        setData({
          stories: stories.slice(0, 7),
          shocks: shocks.slice(0, 4),
          topAlpha,
          biasTop,
          generatedAt: now.toLocaleString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem',
          }),
          generatedAtHe: now.toLocaleString('he-IL', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem',
          }),
          riskIndex,
        });
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => { window.print(); setPrinting(false); }, 100);
  };

  const isHe = lang === 'he';
  const dir = isHe ? 'rtl' : 'ltr';

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-3xl mb-3">📋</div>
          <p>{isHe ? 'מכין תקציר…' : 'Preparing your brief…'}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-3xl mb-3">⚠️</div>
          <p>{isHe ? 'שגיאה בטעינת הנתונים. נסה שוב.' : 'Failed to load brief data. Please try again.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-lg bg-yellow-400 text-gray-900 text-sm font-bold hover:bg-yellow-300"
          >
            {isHe ? 'נסה שוב' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  const d = data;
  const riskLabel = d.riskIndex !== null
    ? (d.riskIndex >= 66
        ? (isHe ? 'סיכון גבוה' : 'High Risk')
        : d.riskIndex >= 34
          ? (isHe ? 'סיכון בינוני' : 'Med Risk')
          : (isHe ? 'סיכון נמוך' : 'Low Risk'))
    : '';

  const shockTypeLabel = (type: string) => {
    if (isHe) return type === 'likelihood' ? 'סבירות' : type === 'narrative' ? 'נרטיב' : 'פיצול';
    return type === 'likelihood' ? 'Likelihood' : type === 'narrative' ? 'Narrative' : 'Fragmentation';
  };

  const confLabel = (c: string) => {
    if (isHe) return c === 'high' ? 'גבוה' : c === 'medium' ? 'בינוני' : 'נמוך';
    return c?.toUpperCase() || '';
  };

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { margin: 1.5cm 2cm; }
        }
        @media screen {
          body { background: #f3f4f6; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="text-gray-400 hover:text-white text-sm"
          >
            {isHe ? '→ חזרה' : '← Back'}
          </button>
          <span className="text-gray-600">|</span>
          <span className="text-white text-sm font-semibold">📋 {isHe ? 'תקציר מודיעין — Signal' : 'Signal Intelligence Brief'}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={() => setLang(l => l === 'he' ? 'en' : 'he')}
            className="text-xs px-2 py-1 rounded border border-gray-700 text-gray-400 hover:text-gray-200"
          >
            {isHe ? 'EN' : 'עב'}
          </button>
          <button
            onClick={handlePrint}
            disabled={printing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 text-gray-900 text-sm font-bold hover:bg-yellow-300 transition-colors disabled:opacity-60"
          >
            {printing ? '…' : (isHe ? '⬇️ ייצוא PDF' : '⬇️ Export PDF')}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div dir={dir} className="max-w-3xl mx-auto px-6 py-8 mt-16 print:mt-0 bg-white min-h-screen shadow-sm">

        {/* Header */}
        <div className="border-b-2 border-gray-900 pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-yellow-500 font-black text-xl tracking-tight">⚡ Signal</span>
                <span className="text-gray-400 text-sm">{isHe ? 'תקציר מודיעין גיאופוליטי' : 'Intelligence Brief'}</span>
              </div>
              <p className="text-xs text-gray-500">{isHe ? d.generatedAtHe : d.generatedAt}</p>
            </div>
            {d.riskIndex !== null && (
              <div className={`text-center px-3 py-2 rounded border-2 ${
                d.riskIndex >= 66 ? 'border-red-500 bg-red-50' : d.riskIndex >= 34 ? 'border-amber-500 bg-amber-50' : 'border-emerald-500 bg-emerald-50'
              }`}>
                <div className={`text-2xl font-black ${
                  d.riskIndex >= 66 ? 'text-red-600' : d.riskIndex >= 34 ? 'text-amber-600' : 'text-emerald-600'
                }`}>{d.riskIndex}</div>
                <div className={`text-[10px] font-bold ${
                  d.riskIndex >= 66 ? 'text-red-500' : d.riskIndex >= 34 ? 'text-amber-500' : 'text-emerald-500'
                }`}>{riskLabel}</div>
                <div className="text-[9px] text-gray-400 mt-0.5">{isHe ? 'מדד סיכון גיאופוליטי' : 'Geopolitical Risk Index'}</div>
              </div>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-2 italic">
            {isHe
              ? `סודי — לשימוש פנימי בלבד. מבוסס על ${d.stories.length > 0 ? '35+' : 'מספר'} מקורות RSS גיאופוליטיים.`
              : `CONFIDENTIAL — For internal use only. Compiled from ${d.stories.length > 0 ? '35+' : 'multiple'} geopolitical RSS sources.`}
          </p>
        </div>

        {/* Section: Top Stories */}
        <section className="mb-8">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <span className="w-3 h-0.5 bg-gray-400 inline-block" />
            {isHe ? 'סיפורים מובילים' : 'Top Stories'}
            <span className="w-3 h-0.5 bg-gray-400 inline-block" />
          </h2>
          <div className="space-y-4">
            {d.stories.map((story, i) => {
              const headline = getText(story.headline, lang);
              const summary  = getText(story.summary, lang);
              const category = getText(story.category, lang);
              const color = CONFIDENCE_COLOR[story.likelihoodLabel] || '#6b7280';
              const deltaSign = story.delta > 0 ? '+' : '';
              return (
                <div key={story.slug} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold text-gray-900 leading-tight">{headline}</h3>
                      <div className="shrink-0 flex items-center gap-1.5">
                        {story.isSignal && (
                          <span className="text-[9px] font-bold bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded">SIGNAL</span>
                        )}
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded"
                          style={{ color, backgroundColor: color + '18' }}>
                          {story.likelihood}%
                        </span>
                        {story.delta !== 0 && (
                          <span className={`text-[9px] font-mono ${story.delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {deltaSign}{story.delta}%
                          </span>
                        )}
                      </div>
                    </div>
                    {summary && <p className="text-xs text-gray-600 leading-relaxed mb-1">{summary}</p>}
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      {category && <span className="bg-gray-100 px-1.5 py-0.5 rounded">{category}</span>}
                      <span>{story.sources?.length || 0} {isHe ? 'מקורות' : 'sources'}</span>
                    </div>
                    <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${story.likelihood}%`, backgroundColor: color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section: Active Shocks */}
        {d.shocks.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
              <span className="w-3 h-0.5 bg-gray-400 inline-block" />
              {isHe ? 'זעזועים פעילים' : 'Active Shocks'}
              <span className="w-3 h-0.5 bg-gray-400 inline-block" />
            </h2>
            <div className="space-y-3">
              {d.shocks.map(shock => {
                const headline  = getText(shock.headline, lang);
                const whatMoved = getText(shock.whatMoved, lang);
                const confColor = shock.confidence === 'high' ? '#ef4444' : shock.confidence === 'medium' ? '#f59e0b' : '#6b7280';
                return (
                  <div key={shock.id} className="flex gap-3 p-3 rounded border border-gray-200 bg-gray-50">
                    <div className="shrink-0 w-1.5 rounded-full self-stretch" style={{ backgroundColor: confColor }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-bold uppercase px-1 py-0.5 rounded"
                          style={{ color: confColor, backgroundColor: confColor + '15' }}>
                          {shockTypeLabel(shock.type)}
                        </span>
                        <span className="text-[9px] text-gray-400 font-medium">{confLabel(shock.confidence)}</span>
                        {shock.delta !== 0 && (
                          <span className={`text-[9px] font-mono ${shock.delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {shock.delta > 0 ? '+' : ''}{shock.delta}%
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-800 leading-tight">{headline}</p>
                      {whatMoved && <p className="text-xs text-gray-500 mt-0.5">{whatMoved}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Section: Signal vs Market */}
        {d.topAlpha && (
          <section className="mb-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
              <span className="w-3 h-0.5 bg-gray-400 inline-block" />
              {isHe ? 'Signal מול שוק' : 'Signal vs Market Alpha'}
              <span className="w-3 h-0.5 bg-gray-400 inline-block" />
            </h2>
            <div className="p-4 rounded border-2 border-yellow-200 bg-yellow-50">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-[10px] font-bold text-yellow-700 uppercase mb-1">
                    {isHe ? 'פער אלפא מוביל' : 'Top Alpha Divergence'}
                  </p>
                  <p className="text-sm font-bold text-gray-900">{d.topAlpha.topic}</p>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-black ${d.topAlpha.delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {d.topAlpha.delta > 0 ? '+' : ''}{d.topAlpha.delta}%
                  </div>
                  <div className="text-[9px] text-gray-500">{isHe ? 'פער' : 'Delta'}</div>
                </div>
              </div>
              <div className="flex gap-4 text-xs mb-2">
                <div>
                  <span className="text-gray-500">Signal: </span>
                  <span className="font-bold text-yellow-700">{d.topAlpha.signalLikelihood}%</span>
                </div>
                <div>
                  <span className="text-gray-500">{isHe ? 'שוק' : 'Market'}: </span>
                  <span className="font-bold text-blue-700">{d.topAlpha.marketProbability}%</span>
                </div>
                <div>
                  <span className="text-gray-500">{isHe ? 'ציון אלפא' : 'Alpha Score'}: </span>
                  <span className="font-bold text-gray-800">{d.topAlpha.alphaScore}/100</span>
                </div>
              </div>
              {d.topAlpha.whyDifferent && (
                <p className="text-xs text-gray-600 italic">"{d.topAlpha.whyDifferent}"</p>
              )}
            </div>
          </section>
        )}

        {/* Section: Media Blind Spot */}
        {d.biasTop && (
          <section className="mb-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
              <span className="w-3 h-0.5 bg-gray-400 inline-block" />
              {isHe ? 'נקודת עיוורון תקשורתית' : 'Media Blind Spot'}
              <span className="w-3 h-0.5 bg-gray-400 inline-block" />
            </h2>
            <div className="p-3 rounded border border-purple-200 bg-purple-50">
              <p className="text-[10px] font-bold text-purple-700 uppercase mb-0.5">{d.biasTop.topic}</p>
              <p className="text-xs text-gray-700">{d.biasTop.gap}</p>
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4 mt-6">
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>⚡ Signal News — signal-news.vercel.app</span>
            <span>{isHe ? `נוצר: ${d.generatedAtHe}` : `Generated ${d.generatedAt}`}</span>
          </div>
          <p className="text-[9px] text-gray-300 mt-1">
            {isHe
              ? 'ניתוח גיאופוליטי מבוסס מילות מפתח. אינו ייעוץ פיננסי או השקעות.'
              : 'Keyword-based geopolitical intelligence. Not financial or investment advice.'}
          </p>
        </div>
      </div>
    </>
  );
}
