'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';
import AlertBell from '@/components/alerts/AlertBell';
import IntelScore from '@/components/shared/IntelScore';

const STALE_THRESHOLD = 30; // minutes
const STALE_DISMISS_KEY = 'signal_stale_dismissed';

interface HeroStats {
  articles: number;
  shocks: number;
  accuracy: number;
  lastUpdate: string;
}

export default function HeroBar() {
  const { lang } = useLanguage();
  const [stats, setStats] = useState<HeroStats | null>(null);
  const [pulse, setPulse] = useState(true);
  const [staleDismissed, setStaleDismissed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const res = await fetch('/api/analyze');
      if (!res.ok) return;
      const data = await res.json();

      let shockCount = 0;
      let liveAccuracy = 78;
      try {
        const [shockRes, logRes] = await Promise.allSettled([
          fetch('/api/shocks'),
          fetch('/api/shock-log'),
        ]);
        if (shockRes.status === 'fulfilled' && shockRes.value.ok) {
          const shockData = await shockRes.value.json();
          shockCount = Array.isArray(shockData) ? shockData.length : (shockData.shocks?.length || 0);
        }
        if (logRes.status === 'fulfilled' && logRes.value.ok) {
          const logData = await logRes.value.json();
          if (logData.accuracy?.rate != null) {
            liveAccuracy = Math.round(logData.accuracy.rate);
          }
        }
      } catch { /* silent */ }

      setStats({
        articles: data.stats?.total || 0,
        shocks: shockCount,
        accuracy: liveAccuracy,
        lastUpdate: data.analyzedAt || new Date().toISOString(),
      });
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
                {' '}{lang === 'he' ? 'דיוק 7י' : '7d accuracy'}
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

        {/* Right: Intel Score + Signal badge + Bell */}
        <div className="shrink-0 flex items-center gap-2">
          <IntelScore />
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/20">
            <span className="text-[9px] font-bold text-yellow-400 uppercase tracking-wider">Signal</span>
          </div>
          <AlertBell />
        </div>
      </div>
    </div>
  );
}
