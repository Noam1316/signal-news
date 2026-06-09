'use client';

/**
 * AnalystBriefing — intel digest for power users.
 * Shows what changed since the analyst's last visit:
 *   - New stories (no localStorage history)
 *   - Rising / falling likelihood
 *   - Active Signal vs Market alpha gaps
 *   - Active shocks
 * Max 6 lines. No decoration — straight signal.
 */

import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/i18n/context';
import type { BriefStory, ShockEvent } from '@/lib/types';
import { loadHistory } from '@/hooks/useLikelihoodHistory';
import type { SignalVsMarket } from '@/services/polymarket';

interface BriefLine {
  icon: string;
  tag: string;   // e.g. "NEW" | "↑ +18%" | "↓ -12%" | "ALPHA" | "SHOCK"
  tagColor: string;
  text: string;
  sub?: string;  // secondary detail
  href?: string;
}

function formatTime(lang: string) {
  return new Date().toLocaleString(lang === 'he' ? 'he-IL' : 'en-US', {
    weekday: 'short', hour: '2-digit', minute: '2-digit',
  });
}

const COLLAPSE_KEY = 'signal_analyst_briefing_collapsed';

export default function AnalystBriefing() {
  const { lang, dir } = useLanguage();
  const isHe = lang === 'he';

  const [stories, setStories] = useState<BriefStory[]>([]);
  const [shocks, setShocks] = useState<ShockEvent[]>([]);
  const [markets, setMarkets] = useState<SignalVsMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
  });

  useEffect(() => {
    const toggle = (v: boolean) => {
      try { localStorage.setItem(COLLAPSE_KEY, v ? '1' : '0'); } catch { /* silent */ }
    };
    toggle(collapsed);
  }, [collapsed]);

  useEffect(() => {
    Promise.all([
      fetch('/api/stories').then(r => r.ok ? r.json() : null),
      fetch('/api/shocks').then(r => r.ok ? r.json() : null),
      fetch('/api/polymarket').then(r => r.ok ? r.json() : null),
    ]).then(([storiesData, shocksData, marketData]) => {
      setStories(storiesData?.stories ?? []);
      setShocks(shocksData?.shocks ?? []);
      setMarkets(marketData?.matches ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const lines = useMemo((): BriefLine[] => {
    if (!stories.length) return [];
    const result: BriefLine[] = [];

    // --- 1. New stories (no localStorage history) ---
    const newStories = stories
      .filter(s => s.isSignal && loadHistory(s.slug).length === 0)
      .slice(0, 2);
    for (const s of newStories) {
      const headline = isHe ? s.headline.he : s.headline.en;
      const cat = isHe ? s.category.he : s.category.en;
      result.push({
        icon: '🆕',
        tag: isHe ? 'חדש' : 'NEW',
        tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
        text: headline,
        sub: `${cat} · ${s.sources.length} ${isHe ? 'מקורות' : 'sources'} · ${s.likelihood}%`,
      });
    }

    // --- 2. Biggest likelihood movers (24h delta from localStorage) ---
    const movers: Array<{ story: BriefStory; delta: number }> = [];
    for (const s of stories) {
      const hist = loadHistory(s.slug);
      if (hist.length < 2) continue;
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      const older = hist.filter(h => h.t <= cutoff + 2 * 60 * 60 * 1000); // ±2h tolerance
      if (!older.length) continue;
      const ref = older[older.length - 1].v;
      const delta = Math.round(s.likelihood - ref);
      if (Math.abs(delta) >= 8) movers.push({ story: s, delta });
    }
    movers.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    for (const { story: s, delta } of movers.slice(0, 3)) {
      const headline = isHe ? s.headline.he : s.headline.en;
      const cat = isHe ? s.category.he : s.category.en;
      const up = delta > 0;
      result.push({
        icon: up ? '⬆' : '⬇',
        tag: `${up ? '+' : ''}${delta}%`,
        tagColor: up
          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
          : 'text-red-400 bg-red-500/10 border-red-500/25',
        text: headline,
        sub: `${cat} · ${s.likelihood}% ${isHe ? 'כעת' : 'now'} · ${s.sources.length} ${isHe ? 'מקורות' : 'src'}`,
      });
    }

    // --- 3. Top alpha gap (Signal vs Market divergence) ---
    const topAlpha = markets
      .filter(m => m.alphaDirection !== 'aligned' && m.alphaScore >= 35)
      .sort((a, b) => b.alphaScore - a.alphaScore)[0];
    if (topAlpha) {
      const isHigher = topAlpha.alphaDirection === 'signal-higher';
      result.push({
        icon: '📊',
        tag: `α ${topAlpha.alphaScore}`,
        tagColor: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/25',
        text: topAlpha.topic,
        sub: `Signal ${topAlpha.signalLikelihood}% · Market ${topAlpha.marketProbability}% · ${isHe ? (isHigher ? 'Signal גבוה' : 'שוק גבוה') : (isHigher ? 'Signal higher' : 'Market higher')}`,
        href: topAlpha.polymarketUrl,
      });
    }

    // --- 4. Active high-confidence shocks ---
    const topShock = shocks.find(sh => sh.confidence === 'high' && sh.status !== 'fading');
    if (topShock) {
      const headline = isHe ? topShock.headline.he : topShock.headline.en;
      const whatMoved = isHe ? topShock.whatMoved.he : topShock.whatMoved.en;
      result.push({
        icon: '⚡',
        tag: isHe ? 'זעזוע' : 'SHOCK',
        tagColor: 'text-orange-400 bg-orange-500/10 border-orange-500/25',
        text: headline,
        sub: whatMoved,
      });
    }

    return result.slice(0, 6);
  }, [stories, shocks, markets, isHe]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3 animate-pulse space-y-2">
        <div className="h-3 w-40 bg-gray-800 rounded" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-2 items-center">
            <div className="h-3 w-10 bg-gray-800 rounded" />
            <div className="h-3 flex-1 bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!lines.length) return null;

  return (
    <div dir={dir} className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(p => !p)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-gray-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {isHe ? 'עדכון מודיעין' : 'INTEL UPDATE'}
          </span>
          <span className="text-[10px] text-gray-600 font-mono">{formatTime(lang)}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-400 font-mono border border-gray-700">
            {lines.length} {isHe ? 'עדכונים' : 'updates'}
          </span>
        </div>
        <span className="text-gray-600 text-xs">{collapsed ? '▼' : '▲'}</span>
      </button>

      {/* Lines */}
      {!collapsed && (
        <div className="border-t border-gray-800 divide-y divide-gray-800/60">
          {lines.map((line, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-2.5">
              <span className="shrink-0 text-sm mt-0.5">{line.icon}</span>
              <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border mt-0.5 ${line.tagColor}`}>
                {line.tag}
              </span>
              <div className="flex-1 min-w-0">
                {line.href ? (
                  <a
                    href={line.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-sm text-gray-200 hover:text-yellow-400 transition-colors leading-snug line-clamp-1"
                  >
                    {line.text} ↗
                  </a>
                ) : (
                  <p className="text-sm text-gray-200 leading-snug line-clamp-1">{line.text}</p>
                )}
                {line.sub && (
                  <p className="text-[11px] text-gray-500 mt-0.5">{line.sub}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
