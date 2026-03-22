'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/context';
import type { ShockEvent } from '@/lib/types';
import ShockCard from '@/components/shocks/ShockCard';
import { usePolling } from '@/hooks/usePolling';

export default function ShockFeed() {
  const { ui, dir, lang } = useLanguage();
  const [shocks, setShocks] = useState<ShockEvent[]>([]);
  const [source, setSource] = useState<'live' | 'cache' | 'static-fallback' | 'loading'>('loading');
  const [error, setError] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchShocks = useCallback(async () => {
    try {
      const res = await fetch('/api/shocks');
      if (!res.ok) throw new Error('Failed to fetch shocks');
      const data = await res.json();
      setShocks(data.shocks || []);
      setSource(data.source || 'live');
    } catch {
      // Fallback: import static shocks
      const { shocks: staticShocks } = await import('@/data/shocks');
      setShocks(staticShocks);
      setSource('static-fallback');
      setError(true);
    }
  }, []);

  useEffect(() => {
    fetchShocks();
  }, [fetchShocks]);

  usePolling(fetchShocks, 2 * 60 * 1000, autoRefresh);

  const sorted = [...shocks].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const highConfidenceCount = shocks.filter((s) => s.confidence === 'high').length;
  const isLive = source === 'live' || source === 'cache';

  return (
    <section dir={dir} className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{ui('shockFeed')}</h1>
          <div className="relative">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {highConfidenceCount > 0 && (
              <span className="absolute -top-1.5 -end-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {highConfidenceCount}
              </span>
            )}
          </div>
          {/* Live indicator */}
          {source !== 'loading' && (
            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
              isLive ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
              {isLive
                ? (lang === 'he' ? 'זיהוי חי' : 'Live Detection')
                : (lang === 'he' ? 'נתוני דמו' : 'Demo Data')}
            </span>
          )}
          {/* Auto Refresh toggle */}
          <button
            onClick={() => setAutoRefresh(p => !p)}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
              autoRefresh
                ? 'border-green-500/50 text-green-400 bg-green-500/10'
                : 'border-gray-700 text-gray-500'
            }`}
          >
            {autoRefresh
              ? (lang === 'he' ? 'רענון אוטומטי' : 'AUTO REFRESH')
              : (lang === 'he' ? 'מושהה' : 'PAUSED')}
          </button>
        </div>
        <p className="text-sm text-gray-400">
          {dir === 'rtl'
            ? 'שינויים פתאומיים בסבירות, נרטיב או פיצול תקשורתי — מזוהים אוטומטית מ-RSS'
            : 'Sudden shifts in likelihood, narrative, or media fragmentation — auto-detected from RSS'}
        </p>
      </header>

      {/* Loading state */}
      {source === 'loading' && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-gray-900/80 border border-gray-800 p-5 animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-1/4 mb-3" />
              <div className="h-5 bg-gray-800 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-800 rounded w-full mb-2" />
              <div className="h-3 bg-gray-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Shock cards */}
      {source !== 'loading' && (
        <div className="flex flex-col gap-4">
          {sorted.map((shock) => (
            <ShockCard key={shock.id} shock={shock} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {source !== 'loading' && shocks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">
            {lang === 'he' ? 'לא זוהו זעזועים כרגע' : 'No shocks detected right now'}
          </p>
          <p className="text-sm mt-1">
            {lang === 'he' ? 'המערכת מנטרת כל הזמן' : 'The system is continuously monitoring'}
          </p>
        </div>
      )}
    </section>
  );
}
