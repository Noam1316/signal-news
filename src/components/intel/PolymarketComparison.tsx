'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/context';
import type { AlphaBreakdown } from '@/services/polymarket';

interface SignalVsMarket {
  topic: string;
  topicCategory: string;
  signalLikelihood: number;
  marketProbability: number;
  delta: number;
  alphaDirection: 'signal-higher' | 'market-higher' | 'aligned';
  alphaScore: number;
  alphaBreakdown: AlphaBreakdown;
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

// ─── Convergence tracking (localStorage) ───────────────────────────────────

const HISTORY_KEY = 'signal_market_history';

interface HistoryEntry { prob: number; ts: number }

function loadHistory(): Record<string, HistoryEntry[]> {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}'); } catch { return {}; }
}

function saveHistory(matches: SignalVsMarket[]) {
  try {
    const history = loadHistory();
    const now = Date.now();
    const cutoff = now - 7 * 24 * 60 * 60 * 1000; // 7 days
    for (const m of matches) {
      const slug = m.polymarketSlug;
      if (!slug) continue;
      if (!history[slug]) history[slug] = [];
      const last = history[slug][history[slug].length - 1];
      if (!last || now - last.ts > 10 * 60 * 1000) {
        history[slug].push({ prob: m.marketProbability, ts: now });
      }
      history[slug] = history[slug].filter(e => e.ts > cutoff);
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch { /* silent */ }
}

function getConvergence(slug: string, currentProb: number, signalLikelihood: number) {
  try {
    const entries = loadHistory()[slug];
    if (!entries || entries.length < 2) return null;
    const oldest = entries[0];
    const movement = currentProb - oldest.prob; // positive = market went up
    if (Math.abs(movement) < 2) return null;
    const signalWantsUp = signalLikelihood > currentProb;
    const toward = signalWantsUp ? movement > 0 : movement < 0;
    const hoursAgo = Math.max(1, Math.round((Date.now() - oldest.ts) / (60 * 60 * 1000)));
    return { movement, toward, hoursAgo };
  } catch { return null; }
}

// ─── Days to close ─────────────────────────────────────────────────────────

function daysToClose(endDate: string): number | null {
  if (!endDate) return null;
  const days = (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days >= 0 ? Math.round(days) : null;
}

// ─── Track Record ───────────────────────────────────────────────────────────

interface TrackRecordData {
  total: number;
  signalWins: number;
  marketWins: number;
  ties: number;
  signalWinRate: number;
  avgSignalError: number;
  avgMarketError: number;
  byCategory: Record<string, { total: number; signalWins: number; winRate: number }>;
  recent: Array<{
    slug: string;
    topic: string;
    category: string;
    signalLikelihood: number;
    marketProbability: number;
    actualOutcome: number;
    signalWasCloser: boolean;
    signalError: number;
    marketError: number;
    resolvedAt: string;
  }>;
  pending: number;
}

function TrackRecord({ lang }: { lang: string }) {
  const [data, setData] = useState<TrackRecordData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/track-record')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 animate-pulse">
      <div className="h-4 bg-gray-800 rounded w-1/3 mb-3" />
      <div className="h-16 bg-gray-800 rounded" />
    </div>
  );

  if (!data) return null;

  const hasResolved = data.total > 0;
  const signalBetter = data.avgSignalError < data.avgMarketError;

  return (
    <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 space-y-3">
      <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        <span>📊</span>
        {lang === 'he' ? 'Track Record — Signal מול השוק' : 'Track Record — Signal vs Market'}
      </h5>

      {!hasResolved ? (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            {lang === 'he'
              ? 'אין עדיין שווקים שנסגרו לבדיקה. המערכת שומרת תחזיות ובודקת תוצאות כל שבוע.'
              : 'No resolved markets yet. The system saves predictions and checks outcomes weekly.'}
          </p>
          {data.pending > 0 && (
            <div className="flex items-center gap-2 text-[10px] text-amber-400/80">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {lang === 'he'
                ? `${data.pending} תחזיות ממתינות לבדיקה`
                : `${data.pending} predictions pending verification`}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Win rate headline */}
          <div className="flex items-center gap-3">
            <div className={`text-3xl font-black ${data.signalWinRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
              {data.signalWinRate}%
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white font-medium">
                {lang === 'he' ? 'שיעור ניצחון Signal' : 'Signal Win Rate'}
              </div>
              <div className="text-[10px] text-gray-500">
                {lang === 'he'
                  ? `${data.signalWins} ניצחונות מתוך ${data.total} תחזיות שנבדקו`
                  : `${data.signalWins} wins out of ${data.total} resolved predictions`}
              </div>
            </div>
          </div>

          {/* Signal vs Market bar */}
          <div className="flex items-center gap-1 h-5 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400/80 rounded-s-full flex items-center justify-center"
              style={{ width: `${Math.max(10, (data.signalWins / data.total) * 100)}%` }}
            >
              <span className="text-[9px] font-bold text-gray-900">⚡{data.signalWins}</span>
            </div>
            {data.ties > 0 && (
              <div
                className="h-full bg-gray-600 flex items-center justify-center"
                style={{ width: `${(data.ties / data.total) * 100}%` }}
              >
                <span className="text-[9px] text-gray-300">{data.ties}</span>
              </div>
            )}
            <div
              className="h-full bg-blue-400/80 rounded-e-full flex items-center justify-center"
              style={{ width: `${Math.max(10, (data.marketWins / data.total) * 100)}%` }}
            >
              <span className="text-[9px] font-bold text-gray-900">📈{data.marketWins}</span>
            </div>
          </div>

          {/* Error comparison */}
          <div className="grid grid-cols-2 gap-2">
            <div className={`p-2 rounded-lg border text-center ${signalBetter ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-gray-800 border-gray-700'}`}>
              <div className="text-[9px] text-gray-500 uppercase">Signal Error</div>
              <div className={`text-sm font-bold ${signalBetter ? 'text-yellow-400' : 'text-gray-300'}`}>
                ±{data.avgSignalError}%
              </div>
            </div>
            <div className={`p-2 rounded-lg border text-center ${!signalBetter ? 'bg-blue-500/5 border-blue-500/20' : 'bg-gray-800 border-gray-700'}`}>
              <div className="text-[9px] text-gray-500 uppercase">Market Error</div>
              <div className={`text-sm font-bold ${!signalBetter ? 'text-blue-400' : 'text-gray-300'}`}>
                ±{data.avgMarketError}%
              </div>
            </div>
          </div>

          {/* Recent resolved */}
          {data.recent.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[9px] text-gray-600 uppercase tracking-wider">
                {lang === 'he' ? 'אחרונים שנבדקו' : 'Recently Resolved'}
              </div>
              {data.recent.slice(0, 5).map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] py-1 border-b border-gray-800/50 last:border-0">
                  <span className={r.signalWasCloser ? 'text-emerald-400' : 'text-red-400'}>
                    {r.signalWasCloser ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-300 flex-1 truncate">{r.topic}</span>
                  <span className="text-gray-500 shrink-0">
                    S:{r.signalLikelihood}% M:{r.marketProbability}% → {r.actualOutcome}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Pending count */}
          {data.pending > 0 && (
            <div className="flex items-center gap-2 text-[10px] text-amber-400/70 pt-1 border-t border-gray-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {lang === 'he'
                ? `${data.pending} תחזיות נוספות ממתינות`
                : `${data.pending} more predictions pending`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Category Alpha Leaderboard ─────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, { he: string; en: string; icon: string }> = {
  iran:            { he: 'איראן', en: 'Iran', icon: '🇮🇷' },
  israel:          { he: 'ישראל', en: 'Israel', icon: '🇮🇱' },
  ukraine:         { he: 'אוקראינה', en: 'Ukraine', icon: '🇺🇦' },
  china:           { he: 'סין', en: 'China', icon: '🇨🇳' },
  'us-election':   { he: 'בחירות ארה"ב', en: 'US Election', icon: '🗳️' },
  ceasefire:       { he: 'הפסקת אש', en: 'Ceasefire', icon: '🕊️' },
  hezbollah:       { he: 'חיזבאללה', en: 'Hezbollah', icon: '⚔️' },
  hamas:           { he: 'חמאס', en: 'Hamas', icon: '⚔️' },
  economy:         { he: 'כלכלה', en: 'Economy', icon: '📉' },
  oil:             { he: 'נפט', en: 'Oil', icon: '🛢️' },
  crypto:          { he: 'קריפטו', en: 'Crypto', icon: '₿' },
  ai:              { he: 'בינה מלאכותית', en: 'AI', icon: '🤖' },
  saudi:           { he: 'סעודיה', en: 'Saudi', icon: '🇸🇦' },
  syria:           { he: 'סוריה', en: 'Syria', icon: '🇸🇾' },
  'elections-israel': { he: 'בחירות ישראל', en: 'IL Elections', icon: '🗳️' },
  other:           { he: 'אחר', en: 'Other', icon: '🌐' },
};

function CategoryLeaderboard({ matches, lang }: { matches: SignalVsMarket[]; lang: string }) {
  type CatRow = { cat: string; avgDelta: number; count: number; signalBias: number; avgAlpha: number };
  const map: Record<string, { deltas: number[]; alphas: number[]; signalHigher: number }> = {};
  for (const m of matches) {
    const cat = m.topicCategory || 'other';
    if (!map[cat]) map[cat] = { deltas: [], alphas: [], signalHigher: 0 };
    map[cat].deltas.push(Math.abs(m.delta));
    map[cat].alphas.push(m.alphaScore);
    if (m.alphaDirection === 'signal-higher') map[cat].signalHigher++;
  }
  const rows: CatRow[] = Object.entries(map)
    .map(([cat, d]) => ({
      cat,
      avgDelta: Math.round(d.deltas.reduce((a, b) => a + b, 0) / d.deltas.length),
      avgAlpha: Math.round(d.alphas.reduce((a, b) => a + b, 0) / d.alphas.length),
      count: d.deltas.length,
      signalBias: Math.round((d.signalHigher / d.deltas.length) * 100),
    }))
    .sort((a, b) => b.avgAlpha - a.avgAlpha)
    .slice(0, 6);

  if (rows.length === 0) return null;
  const maxAlpha = rows[0].avgAlpha || 1;

  return (
    <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 space-y-3">
      <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        <span>🏆</span>
        {lang === 'he' ? 'Alpha לפי קטגוריה' : 'Alpha by Category'}
      </h5>
      <div className="space-y-2">
        {rows.map((row, i) => {
          const lbl = CATEGORY_LABELS[row.cat] ?? CATEGORY_LABELS.other;
          const barPct = (row.avgAlpha / maxAlpha) * 100;
          const signalColor = row.signalBias > 60 ? 'text-yellow-400' : row.signalBias < 40 ? 'text-blue-400' : 'text-gray-400';
          return (
            <div key={row.cat} className="relative flex items-center gap-2 py-1.5 px-2 rounded-lg bg-gray-900 border border-gray-800 overflow-hidden">
              {/* Background bar */}
              <div className="absolute inset-y-0 start-0 bg-yellow-400/5 rounded-lg" style={{ width: `${barPct}%` }} />
              {/* Rank */}
              <span className="relative text-[9px] font-mono text-gray-600 w-3 shrink-0">{i + 1}</span>
              {/* Icon + name */}
              <span className="relative text-xs shrink-0">{lbl.icon}</span>
              <span className="relative text-xs text-white font-medium flex-1 truncate">
                {lang === 'he' ? lbl.he : lbl.en}
              </span>
              {/* Stats */}
              <div className="relative flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-amber-400 font-mono">Δ{row.avgDelta}%</span>
                <span className={`text-[10px] font-mono ${signalColor}`}>
                  {row.signalBias}%⚡
                </span>
                <span className="text-[10px] font-bold text-yellow-400 w-6 text-end">{row.avgAlpha}</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[9px] text-gray-600">
        {lang === 'he'
          ? 'Δ = פער ממוצע · ⚡ = % שיטים ש-Signal גבוה מהשוק · Alpha = ציון ממוצע'
          : 'Δ = avg gap · ⚡ = % where Signal > Market · Alpha = avg score'}
      </p>
    </div>
  );
}

/** Single axis position gauge — shows Signal and Market as dots on 0-100 scale */
function PositionAxis({ signal, market, dir }: { signal: number; market: number; dir: string }) {
  const left = Math.min(signal, market);
  const right = Math.max(signal, market);
  const gapPct = right - left;
  const signalIsLeft = (dir === 'ltr') ? signal <= market : signal >= market;

  return (
    <div className="space-y-2">
      {/* Labels */}
      <div className="flex items-center gap-2 text-[10px]">
        <span className="text-yellow-400 font-semibold w-14 text-end">Signal {signal}%</span>
        <span className="flex-1" />
        <span className="text-blue-400 font-semibold">Market {market}%</span>
      </div>

      {/* Axis */}
      <div className="relative h-7 flex items-center" dir="ltr">
        {/* Track */}
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-gray-800" />

        {/* Gap highlight between signal and market */}
        <div
          className="absolute h-1.5 rounded-full opacity-40"
          style={{
            left: `${left}%`,
            width: `${gapPct}%`,
            backgroundColor: gapPct > 20 ? '#f59e0b' : '#6b7280',
          }}
        />

        {/* Market dot (blue) */}
        <div
          className="absolute w-4 h-4 rounded-full bg-blue-400 border-2 border-gray-900 shadow-lg transition-all duration-700"
          style={{ left: `calc(${market}% - 8px)` }}
          title={`Market: ${market}%`}
        />

        {/* Signal dot (yellow) */}
        <div
          className="absolute w-4 h-4 rounded-full bg-yellow-400 border-2 border-gray-900 shadow-lg transition-all duration-700"
          style={{ left: `calc(${signal}% - 8px)` }}
          title={`Signal: ${signal}%`}
        />

        {/* Scale ticks */}
        {[0, 25, 50, 75, 100].map(v => (
          <div
            key={v}
            className="absolute text-[8px] text-gray-700 -translate-x-1/2"
            style={{ left: `${v}%`, top: '18px' }}
          >
            {v}
          </div>
        ))}
      </div>

      {/* Direction label */}
      <div className="flex items-center justify-between text-[10px] pt-1">
        <span className={`font-medium ${signalIsLeft ? 'text-blue-400' : 'text-yellow-400'}`}>
          ← {signalIsLeft ? 'Market' : 'Signal'} חושב פחות סביר
        </span>
        <span className={`font-medium ${signalIsLeft ? 'text-yellow-400' : 'text-blue-400'}`}>
          {signalIsLeft ? 'Signal' : 'Market'} חושב יותר סביר →
        </span>
      </div>
    </div>
  );
}

/** Alpha score breakdown bars */
function AlphaBreakdownBars({ breakdown, total, lang }: { breakdown: AlphaBreakdown; total: number; lang: string }) {
  const rows = [
    { key: 'delta',  label: { he: 'פער', en: 'Gap' },       value: breakdown.deltaScore,  max: 50,  color: 'bg-amber-400' },
    { key: 'volume', label: { he: 'נפח שוק', en: 'Volume' }, value: breakdown.volumeScore, max: 25,  color: 'bg-blue-400' },
    { key: 'src',    label: { he: 'מקורות', en: 'Sources' }, value: breakdown.sourceScore, max: 15,  color: 'bg-emerald-400' },
    { key: 'match',  label: { he: 'התאמה', en: 'Match' },    value: breakdown.matchScore,  max: 10,  color: 'bg-purple-400' },
  ];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
          {lang === 'he' ? 'פירוט Alpha Score' : 'Alpha Score Breakdown'}
        </span>
        <span className="text-sm font-bold text-yellow-400">{total}/100</span>
      </div>
      {rows.map(r => (
        <div key={r.key} className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 w-14 text-end shrink-0">
            {lang === 'he' ? r.label.he : r.label.en}
          </span>
          <div className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${r.color} transition-all duration-700`}
              style={{ width: `${(r.value / r.max) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-gray-400 w-8 shrink-0">
            {r.value}/{r.max}
          </span>
        </div>
      ))}
      <p className="text-[9px] text-gray-600 pt-0.5">
        {lang === 'he'
          ? 'פער (max 50) + נפח שוק (max 25) + מקורות (max 15) + התאמה (max 10)'
          : 'Gap (max 50) + Volume (max 25) + Sources (max 15) + Match (max 10)'}
      </p>
    </div>
  );
}

/** Structured explanation — splits whyDifferent by \n\n and renders paragraphs */
function StructuredExplanation({ text, lang }: { text: string; lang: string }) {
  const paragraphs = text.split('\n\n').filter(Boolean);
  return (
    <div className="space-y-2.5">
      <h5 className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">
        {lang === 'he' ? 'ניתוח הפער' : 'Gap Analysis'}
      </h5>
      {paragraphs.map((p, i) => (
        <p key={i} className="text-xs text-gray-300 leading-relaxed">
          {p}
        </p>
      ))}
    </div>
  );
}

export default function PolymarketComparison() {
  const { lang, dir } = useLanguage();
  const [data, setData] = useState<PolyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [topAlphaOnly, setTopAlphaOnly] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'signal-higher' | 'market-higher' | 'closing-soon'>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/polymarket');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        // Save market snapshots for convergence tracking
        if (json.matches) saveHistory(json.matches);
      }
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

  const alphas = data.matches.filter(m => m.alphaDirection !== 'aligned');
  const avgDelta = data.matches.length > 0
    ? Math.round(data.matches.reduce((s, m) => s + Math.abs(m.delta), 0) / data.matches.length)
    : 0;
  const signalHigherCount = data.matches.filter(m => m.alphaDirection === 'signal-higher').length;
  const marketHigherCount = data.matches.filter(m => m.alphaDirection === 'market-higher').length;
  const topAlpha = [...data.matches].filter(m => m.alphaDirection !== 'aligned').sort((a,b) => b.alphaScore - a.alphaScore)[0];

  return (
    <div dir={dir} className="space-y-4">
      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2.5 rounded-lg bg-gray-900 border border-gray-800 text-center">
          <div className="text-[9px] text-gray-500 uppercase">{lang === 'he' ? 'התאמות' : 'Matches'}</div>
          <div className="text-lg font-bold text-white">{data.matches.length}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-gray-900 border border-gray-800 text-center">
          <div className="text-[9px] text-gray-500 uppercase">{lang === 'he' ? 'הזדמנויות Alpha' : 'Alpha Opps'}</div>
          <div className="text-lg font-bold text-yellow-400">{alphas.length}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-gray-900 border border-gray-800 text-center">
          <div className="text-[9px] text-gray-500 uppercase">{lang === 'he' ? 'פער ממוצע' : 'Avg Gap'}</div>
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

      {/* Top alpha callout */}
      {topAlpha && (
        <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 flex items-center gap-3">
          <span className="text-2xl shrink-0">⚡</span>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] text-yellow-400/70 uppercase tracking-wider">
              {lang === 'he' ? 'הזדמנות Alpha הגבוהה ביותר' : 'Top Alpha Opportunity'}
            </div>
            <div className="text-xs text-yellow-100 font-medium truncate">{topAlpha.topic}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              {lang === 'he' ? `פער: ${Math.abs(topAlpha.delta)}% · Alpha Score: ${topAlpha.alphaScore}` : `Gap: ${Math.abs(topAlpha.delta)}% · Alpha Score: ${topAlpha.alphaScore}`}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-xl font-black text-yellow-400">{topAlpha.alphaScore}</div>
            <div className="text-[9px] text-gray-500">/ 100</div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {[
          { id: 'all',           en: 'All',              he: 'הכל' },
          { id: 'signal-higher', en: '⚡ Signal Higher',  he: '⚡ Signal גבוה' },
          { id: 'market-higher', en: '📈 Market Higher',  he: '📈 שוק גבוה' },
          { id: 'closing-soon',  en: '⏳ Closing Soon',   he: '⏳ נסגר בקרוב' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setFilterTab(tab.id as typeof filterTab)}
            className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
              filterTab === tab.id
                ? 'border-yellow-400/50 bg-yellow-400/10 text-yellow-400'
                : 'border-gray-700 text-gray-500 hover:text-gray-300'
            }`}>
            {lang === 'he' ? tab.he : tab.en}
          </button>
        ))}
      </div>

      {/* Alpha Score formula explanation */}
      <details className="rounded-xl bg-gray-900/50 border border-gray-800 overflow-hidden">
        <summary className="px-4 py-2.5 text-[11px] text-gray-500 cursor-pointer hover:text-gray-300 transition-colors flex items-center gap-2">
          <span>ℹ️</span>
          {lang === 'he' ? 'איך Alpha Score מחושב?' : 'How is Alpha Score calculated?'}
          <span className="ms-auto text-gray-700">▾</span>
        </summary>
        <div className="px-4 pb-4 pt-1 space-y-2.5 border-t border-gray-800">
          <p className="font-mono text-yellow-400/80 bg-gray-950 rounded px-2 py-1.5 text-[11px] mt-2">
            Alpha = פער (0-50) + נפח שוק (0-25) + מקורות (0-15) + התאמה (0-10)
          </p>
          <div className="space-y-1 text-[11px] text-gray-400">
            <p>• <span className="text-amber-400">פער</span> — ההפרש בין תחזית Signal לסבירות Polymarket. פער של 30%+ = 30 נקודות.</p>
            <p>• <span className="text-blue-400">נפח שוק</span> — כמה כסף הוזרם לשוק. שוק עמוק ($10M+) = 25 נקודות. שוק דל = 2.</p>
            <p>• <span className="text-emerald-400">מקורות</span> — כמה מקורות RSS עצמאיים מגבים את ה-Signal. 6 מקורות = 15 נקודות.</p>
            <p>• <span className="text-purple-400">התאמה</span> — עד כמה הסיפור מתאים לשוק Polymarket (התאמת מילות מפתח).</p>
          </div>
          <p className="text-[10px] text-gray-600 pt-1 border-t border-gray-800/50">
            {lang === 'he'
              ? 'Alpha > 60 = Signal מזהה פיגור של השוק. Alpha < 30 = הפרשה קטנה / בסיס מידע חלש.'
              : 'Alpha > 60 = Signal detects a market lag. Alpha < 30 = small gap or weak data basis.'}
          </p>
        </div>
      </details>

      {/* Source badge + top alpha toggle */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
          data.source === 'live'
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
            : 'bg-gray-800 text-gray-500 border border-gray-700'
        }`}>
          {data.source === 'live' ? '● LIVE Polymarket API' : '○ DEMO DATA'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTopAlphaOnly(p => !p)}
            className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${
              topAlphaOnly
                ? 'bg-yellow-400/15 border-yellow-400/40 text-yellow-400'
                : 'bg-transparent border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
            }`}
          >
            ⚡ Top Alpha
          </button>
          <button onClick={fetchData} disabled={loading} className="text-[10px] text-gray-500 hover:text-white transition-colors">
            {loading ? '...' : '↻'}
          </button>
        </div>
      </div>

      {/* Match cards */}
      {(() => {
        const isClosingSoon = (endDate: string) => {
          if (!endDate) return false;
          const days = (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
          return days >= 0 && days <= 14;
        };
        const tabFiltered = [...data.matches].filter(m => {
          if (filterTab === 'signal-higher') return m.alphaDirection === 'signal-higher';
          if (filterTab === 'market-higher') return m.alphaDirection === 'market-higher';
          if (filterTab === 'closing-soon')  return isClosingSoon(m.endDate);
          return true;
        });
        return tabFiltered
          .sort((a, b) => (b.alphaScore || 0) - (a.alphaScore || 0))
          .slice(0, topAlphaOnly ? 5 : undefined)
          .map((match, i) => {
            const absDelta = Math.abs(match.delta);
            const isAligned = match.alphaDirection === 'aligned';
            const signalHigher = match.alphaDirection === 'signal-higher';
            const isExpanded = expandedIdx === i;

            // Convergence tracking
            const convergence = getConvergence(match.polymarketSlug, match.marketProbability, match.signalLikelihood);

            // Days to close
            const days = daysToClose(match.endDate);
            const isUrgent = days !== null && days <= 7;

            const alphaColor = isAligned
              ? 'text-gray-400'
              : match.alphaScore >= 60
              ? 'text-yellow-400'
              : match.alphaScore >= 35
              ? 'text-amber-400'
              : 'text-gray-300';

            const borderColor = isAligned
              ? 'border-gray-800'
              : signalHigher
              ? 'border-s-yellow-500/60'
              : 'border-s-blue-500/60';

            return (
              <div
                key={i}
                onClick={() => setExpandedIdx(isExpanded ? null : i)}
                className={`rounded-xl border border-e-gray-800 border-y-gray-800 border-s-4 bg-gray-900/80 p-4 space-y-3 cursor-pointer transition-all ${borderColor} ${
                  isExpanded ? 'bg-gray-900' : 'hover:bg-gray-800/60'
                }`}
              >
                {/* Top: topic title + alpha badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white leading-snug">{match.topic}</h4>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">📊 {match.polymarketTitle}</p>
                    {/* Convergence badge */}
                    {convergence && (
                      <div className={`mt-1.5 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                        convergence.toward
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}>
                        {convergence.toward ? '📈' : '📉'}
                        {lang === 'he'
                          ? `שוק ${convergence.toward ? 'מתקרב ל' : 'מתרחק מ'}Signal · ${convergence.movement > 0 ? '+' : ''}${convergence.movement}% ב-${convergence.hoursAgo}ש'`
                          : `Market ${convergence.toward ? '→ Signal' : '← away'} · ${convergence.movement > 0 ? '+' : ''}${convergence.movement}% in ${convergence.hoursAgo}h`}
                      </div>
                    )}
                  </div>
                  <div className={`shrink-0 flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg ${
                    isAligned
                      ? 'bg-gray-800 border border-gray-700'
                      : signalHigher
                      ? 'bg-yellow-500/10 border border-yellow-500/25'
                      : 'bg-blue-500/10 border border-blue-500/25'
                  }`}>
                    <span className={`text-lg font-black leading-none ${alphaColor}`}>
                      {match.alphaScore}
                    </span>
                    <span className="text-[8px] text-gray-500 uppercase">alpha</span>
                  </div>
                </div>

                {/* Position axis gauge */}
                <PositionAxis signal={match.signalLikelihood} market={match.marketProbability} dir="ltr" />

                {/* Quick meta row */}
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-3 text-gray-500">
                    <span>
                      {lang === 'he' ? 'נפח:' : 'Vol:'}{' '}
                      <span className="text-gray-400 font-medium">{formatVolume(match.volume)}</span>
                    </span>
                    <span>
                      {match.sourceCount} {lang === 'he' ? 'מקורות' : 'src'}
                    </span>
                    <span className="hidden sm:inline text-gray-600">
                      {lang === 'he' ? 'ביטחון:' : 'Conf:'} {match.confidence}%
                    </span>
                    {isUrgent && days !== null && (
                      <span className="font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400">
                        ⏳ {days === 0 ? (lang === 'he' ? 'היום' : 'today') : `${days}${lang === 'he' ? 'י' : 'd'}`}
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

                {/* Expanded section */}
                {isExpanded && (
                  <div className="pt-3 border-t border-gray-800 space-y-4 animate-in fade-in duration-200">

                    {/* Structured explanation */}
                    {match.whyDifferent && (
                      <div className="p-3 rounded-lg bg-gray-800/40 border border-gray-700/40">
                        <StructuredExplanation text={match.whyDifferent} lang={lang} />
                      </div>
                    )}

                    {/* Alpha breakdown */}
                    <div className="p-3 rounded-lg bg-gray-800/40 border border-gray-700/40">
                      <AlphaBreakdownBars
                        breakdown={match.alphaBreakdown || {
                          deltaScore: Math.min(50, absDelta),
                          volumeScore: 0,
                          sourceScore: 0,
                          matchScore: 0,
                        }}
                        total={match.alphaScore}
                        lang={lang}
                      />
                    </div>

                    {/* End date + keywords */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      {match.endDate && (
                        <span className="text-[10px] text-gray-500">
                          ⏳ {lang === 'he' ? 'תפוגה:' : 'Expires:'} {formatDate(match.endDate)}
                        </span>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {match.matchedKeywords.map(kw => (
                          <span key={kw} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700/50">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Expand hint */}
                {!isExpanded && (
                  <div className="text-[9px] text-gray-700 text-center">
                    {lang === 'he' ? '▾ לחץ לניתוח מלא' : '▾ Click for full analysis'}
                  </div>
                )}
              </div>
            );
          });
      })()}

      {/* Track Record — Signal vs Market accuracy */}
      <TrackRecord lang={lang} />

      {/* Category Alpha Leaderboard */}
      <CategoryLeaderboard matches={data.matches} lang={lang} />
    </div>
  );
}
