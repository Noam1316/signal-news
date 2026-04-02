'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';
import AlertBell from '@/components/alerts/AlertBell';
import IntelScore from '@/components/shared/IntelScore';

const STALE_THRESHOLD = 30; // minutes
const STALE_DISMISS_KEY = 'signal_stale_dismissed';
const RISK_HISTORY_KEY = 'signal_risk_history';

// ── Risk Index history helpers ────────────────────────────────────────────────

interface RiskSnapshot { v: number; t: number; }

function loadRiskHistory(): RiskSnapshot[] {
  try { return JSON.parse(localStorage.getItem(RISK_HISTORY_KEY) || '[]'); } catch { return []; }
}

function saveRiskSnapshot(value: number) {
  try {
    const snaps = loadRiskHistory();
    const now = Date.now();
    const last = snaps[snaps.length - 1];
    // Record at most once per hour
    if (last && now - last.t < 60 * 60 * 1000) return;
    snaps.push({ v: value, t: now });
    // Keep 7 days of hourly snapshots = 168 entries max
    if (snaps.length > 168) snaps.splice(0, snaps.length - 168);
    localStorage.setItem(RISK_HISTORY_KEY, JSON.stringify(snaps));
  } catch { /* silent */ }
}

/** Returns risk value from ~24h ago, or null if no history */
function getYesterdayRisk(): number | null {
  try {
    const snaps = loadRiskHistory();
    const target = Date.now() - 24 * 60 * 60 * 1000;
    // Find snapshot closest to 24h ago
    const old = snaps.filter(s => s.t <= target + 2 * 60 * 60 * 1000);
    if (!old.length) return null;
    return old[old.length - 1].v;
  } catch { return null; }
}

interface HeroStats {
  articles: number;
  shocks: number;
  accuracy: number;
  lastUpdate: string;
  riskIndex: number; // 0–100 geopolitical risk
}

function computeRiskIndex(analyzeData: any, shocksData: any): number {
  // Sentiment pressure (0–40): how much negative sentiment
  const sent = analyzeData?.stats?.sentimentBreakdown || {};
  const sentTotal = Object.values(sent).reduce((a: number, b) => a + (b as number), 0) as number;
  const negRatio = sentTotal > 0 ? ((sent.negative || 0) / sentTotal) : 0.4;
  const sentScore = Math.round(negRatio * 40);

  // Shock pressure (0–40): active shocks weighted by confidence
  const shocks: any[] = shocksData?.shocks || [];
  const shockPressure = shocks.reduce((acc: number, s: any) => {
    return acc + (s.confidence === 'high' ? 16 : s.confidence === 'medium' ? 8 : 4);
  }, 0);
  const shockScore = Math.min(40, shockPressure);

  // Signal density (0–20): proportion of signal vs noise
  const signalRatio: number = analyzeData?.stats?.signalRatio || 0;
  const signalScore = Math.round(signalRatio * 20);

  return Math.min(100, sentScore + shockScore + signalScore);
}

function SignalGauge({ value, lang }: { value: number; lang: string }) {
  const [yesterday, setYesterday] = useState<number | null>(null);
  useEffect(() => { setYesterday(getYesterdayRisk()); }, []);

  // SVG arc gauge — semicircle
  const r = 28;
  const cx = 36;
  const cy = 34;
  const circumference = Math.PI * r; // ~87.96
  const filled = (value / 100) * circumference;
  const displayVal = Math.round(value / 10); // 0-10

  const isHigh   = value >= 66;
  const isMedium = value >= 34;
  const arcColor  = isHigh ? '#f87171' : isMedium ? '#fb923c' : '#34d399';
  const textColor = isHigh ? 'text-red-400' : isMedium ? 'text-amber-400' : 'text-emerald-400';
  const label     = isHigh
    ? (lang === 'he' ? 'גבוה' : 'High')
    : isMedium
      ? (lang === 'he' ? 'בינוני' : 'Med')
      : (lang === 'he' ? 'נמוך' : 'Low');

  const delta = yesterday !== null ? Math.round((value - yesterday) / 10) : null;
  const deltaSign = delta !== null && delta > 0 ? '+' : '';
  const deltaColor = delta === null ? '' : delta > 0 ? 'text-red-400' : delta < 0 ? 'text-emerald-400' : 'text-gray-500';

  const tooltip = lang === 'he'
    ? `מדד עוצמת סיגנל: ${displayVal}/10${delta !== null ? ` (${deltaSign}${delta} מאתמול)` : ''}`
    : `Signal Intensity: ${displayVal}/10${delta !== null ? ` (${deltaSign}${delta} vs yesterday)` : ''}`;

  return (
    <div className="hidden sm:flex flex-col items-center cursor-default" title={tooltip}>
      <svg viewBox="0 0 72 42" width="72" height="42">
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="#1f2937" strokeWidth="7" strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={arcColor} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        {/* Value */}
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="14" fontWeight="900"
              fill={arcColor} fontFamily="monospace">{displayVal}</text>
        <text x={cx} y={cy + 7} textAnchor="middle" fontSize="6"
              fill="#6b7280">{lang === 'he' ? '/10 עוצמה' : 'intensity/10'}</text>
      </svg>
      <div className={`flex items-center gap-1 text-[9px] font-bold ${textColor} -mt-1`}>
        <span>{label}</span>
        {delta !== null && delta !== 0 && (
          <span className={`${deltaColor} font-mono`}>{deltaSign}{delta}</span>
        )}
      </div>
    </div>
  );
}

export default function HeroBar() {
  const { lang } = useLanguage();
  const [stats, setStats] = useState<HeroStats | null>(null);
  const [pulse, setPulse] = useState(true);
  const [staleDismissed, setStaleDismissed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const [analyzeRes, shockRes, logRes] = await Promise.allSettled([
        fetch('/api/analyze'),
        fetch('/api/shocks'),
        fetch('/api/shock-log'),
      ]);

      let articles = 0, lastUpdate = new Date().toISOString();
      let shockCount = 0, liveAccuracy = 78;
      let analyzeData: any = null, shocksData: any = null;

      if (analyzeRes.status === 'fulfilled' && analyzeRes.value.ok) {
        analyzeData = await analyzeRes.value.json();
        articles = analyzeData.stats?.total || 0;
        lastUpdate = analyzeData.analyzedAt || lastUpdate;
      }
      if (shockRes.status === 'fulfilled' && shockRes.value.ok) {
        shocksData = await shockRes.value.json();
        shockCount = Array.isArray(shocksData) ? shocksData.length : (shocksData.shocks?.length || 0);
      }
      if (logRes.status === 'fulfilled' && logRes.value.ok) {
        const logData = await logRes.value.json();
        if (logData.accuracy?.rate != null) liveAccuracy = Math.round(logData.accuracy.rate);
      }

      const riskIndex = computeRiskIndex(analyzeData, shocksData);
      saveRiskSnapshot(riskIndex);
      setStats({ articles, shocks: shockCount, accuracy: liveAccuracy, lastUpdate, riskIndex });
    } catch { /* silent */ }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(t);
  }, []);

  // Check stale dismiss (session-scoped)
  useEffect(() => {
    setStaleDismissed(!!sessionStorage.getItem(STALE_DISMISS_KEY));
  }, []);

  const minutesAgo = stats?.lastUpdate
    ? Math.max(1, Math.round((Date.now() - new Date(stats.lastUpdate).getTime()) / 60000))
    : null;

  const isStale = minutesAgo !== null && minutesAgo > STALE_THRESHOLD;
  const showStaleBanner = isStale && !staleDismissed;

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
    setStaleDismissed(true);
    sessionStorage.setItem(STALE_DISMISS_KEY, '1');
  };

  const handleDismissStale = () => {
    setStaleDismissed(true);
    sessionStorage.setItem(STALE_DISMISS_KEY, '1');
  };

  return (
    <div className="w-full bg-gray-950/80 border-b border-gray-800/50 backdrop-blur-sm">
      {/* Stale data banner */}
      {showStaleBanner && (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <span>⚠️</span>
            <span>
              {lang === 'he'
                ? `הנתונים עשויים להיות ישנים (${minutesAgo} דקות) — מומלץ לרענן`
                : `Data may be stale (${minutesAgo}m old) — consider refreshing`}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-colors"
            >
              {refreshing ? '...' : (lang === 'he' ? 'רענן' : 'Refresh')}
            </button>
            <button onClick={handleDismissStale} className="text-amber-500/60 hover:text-amber-400 text-xs">✕</button>
          </div>
        </div>
      )}

      {/* Main bar */}
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-3 overflow-x-auto scrollbar-hide">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${pulse ? 'opacity-100' : 'opacity-40'} transition-opacity duration-1000`} />
          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
            {lang === 'he' ? 'חי' : 'LIVE'}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-[11px]">
          {stats ? (
            <>
              <span className="text-gray-400 whitespace-nowrap">
                <span className="text-white font-bold">{stats.articles}</span>
                {' '}{lang === 'he' ? 'כתבות' : 'articles'}
              </span>
              <span className="text-gray-700">|</span>
              <span className="text-gray-400 whitespace-nowrap">
                <span className="text-yellow-400 font-bold">{stats.shocks}</span>
                {' '}{lang === 'he' ? 'זעזועים' : 'shocks'}
              </span>
              <span className="text-gray-700 hidden sm:inline">|</span>
              <span className="text-gray-400 whitespace-nowrap hidden sm:inline">
                <span className="text-emerald-400 font-bold">{stats.accuracy}%</span>
                {' '}{lang === 'he' ? 'דיוק 7 ימים' : '7d accuracy'}
              </span>
              <span className="text-gray-700 hidden md:inline">|</span>
              <span className={`whitespace-nowrap hidden md:inline ${isStale ? 'text-amber-400' : 'text-gray-500'}`}>
                {lang === 'he' ? `לפני ${minutesAgo} דק'` : `${minutesAgo}m ago`}
              </span>
            </>
          ) : (
            <span className="text-gray-600 text-[10px]">{lang === 'he' ? 'טוען...' : 'Loading...'}</span>
          )}
        </div>

        {/* Right: Risk Index + Intel Score + Signal badge + Bell */}
        <div className="shrink-0 flex items-center gap-2">
          {stats && (
            <SignalGauge value={stats.riskIndex} lang={lang} />
          )}
          <IntelScore />
          <AlertBell />
        </div>
      </div>
    </div>
  );
}
