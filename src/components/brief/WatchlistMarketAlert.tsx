'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/context';
import { useWatchlist } from '@/hooks/useWatchlist';
import type { SignalVsMarket } from '@/services/polymarket';

interface WatchlistMatch extends SignalVsMarket {
  dismissed?: boolean;
}

const DISMISS_KEY = 'signal_watchlist_alerts_dismissed';

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveDismissed(s: Set<string>) {
  try { localStorage.setItem(DISMISS_KEY, JSON.stringify([...s])); } catch { /* silent */ }
}

export default function WatchlistMarketAlert() {
  const { lang, dir } = useLanguage();
  const { watchlist } = useWatchlist();
  const [matches, setMatches] = useState<WatchlistMatch[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const isHe = lang === 'he';

  useEffect(() => {
    setDismissed(loadDismissed());
  }, []);

  useEffect(() => {
    if (watchlist.size === 0) return;
    fetch('/api/polymarket')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.matches) return;
        const watched = (data.matches as SignalVsMarket[]).filter(
          m => m.storySlug && watchlist.has(m.storySlug) && m.alphaDirection !== 'aligned'
        );
        setMatches(watched);
      })
      .catch(() => {});
  }, [watchlist]);

  const dismiss = (slug: string) => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(slug);
      saveDismissed(next);
      return next;
    });
  };

  const visible = matches.filter(m => !dismissed.has(m.storySlug));
  if (visible.length === 0) return null;

  return (
    <div dir={dir} className="space-y-2">
      {visible.map(m => {
        const isHigher = m.alphaDirection === 'signal-higher';
        const deltaAbs = Math.abs(m.delta);
        return (
          <div
            key={m.storySlug}
            className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 px-4 py-3 flex items-start gap-3"
          >
            <span className="text-yellow-400 text-lg shrink-0 mt-0.5">⚡</span>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-yellow-400/70">
                {isHe ? 'התראת מעקב — שוק זוהה' : 'Watchlist Alert — Market Found'}
              </p>
              <p className="text-sm font-semibold text-gray-100 truncate">{m.topic}</p>
              <div className="flex items-center gap-3 flex-wrap text-xs text-gray-400">
                <span>
                  Signal <span className="font-mono text-yellow-300">{m.signalLikelihood}%</span>
                </span>
                <span>
                  Market <span className="font-mono text-blue-300">{m.marketProbability}%</span>
                </span>
                <span className={`font-semibold ${isHigher ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isHigher ? '↑' : '↓'} {deltaAbs}%{' '}
                  {isHe
                    ? (isHigher ? 'Signal גבוה מהשוק' : 'שוק גבוה מ-Signal')
                    : (isHigher ? 'Signal above market' : 'Market above signal')}
                </span>
              </div>
              <a
                href={m.polymarketUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[11px] text-yellow-400/60 hover:text-yellow-400 transition-colors mt-0.5"
              >
                {isHe ? 'פתח שוק ב-Polymarket' : 'Open on Polymarket'} ↗
              </a>
            </div>
            <button
              onClick={() => dismiss(m.storySlug)}
              className="shrink-0 text-gray-600 hover:text-gray-400 transition-colors text-lg leading-none"
              title={isHe ? 'סגור' : 'Dismiss'}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
