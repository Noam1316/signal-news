'use client';

/**
 * BriefDigest — the single intel digest at the top of the Brief.
 * Merges the former AnalystBriefing ("what changed") and BriefAISummary
 * ("top stories") into one clean panel:
 *   - Primary rows: NEW signals, likelihood movers, top alpha gap, active shock
 *   - Fallback rows: top signal headlines (so the panel is never thin/empty)
 * One consistent row style. Collapsible. Max 6 rows.
 */

import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/i18n/context';
import type { BriefStory, ShockEvent } from '@/lib/types';
import { loadHistory } from '@/hooks/useLikelihoodHistory';
import type { SignalVsMarket } from '@/services/polymarket';

interface DigestRow {
  key: string;
  tag: string;
  tagColor: string;
  text: string;
  sub?: string;
  href?: string;
}

const COLLAPSE_KEY = 'signal_brief_digest_collapsed';
const MAX_ROWS = 6;

export default function BriefDigest() {
  const { lang, dir } = useLanguage();
  const isHe = lang === 'he';

  const [stories, setStories] = useState<BriefStory[]>([]);
  const [shocks, setShocks] = useState<ShockEvent[]>([]);
  const [markets, setMarkets] = useState<SignalVsMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1'); } catch { /* */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); } catch { /* */ }
  }, [collapsed]);

  useEffect(() => {
    Promise.all([
      fetch('/api/stories').then(r => r.ok ? r.json() : null),
      fetch('/api/shocks').then(r => r.ok ? r.json() : null),
      fetch('/api/polymarket').then(r => r.ok ? r.json() : null),
    ]).then(([s, sh, m]) => {
      setStories(s?.stories ?? []);
      setShocks(sh?.shocks ?? []);
      setMarkets(m?.matches ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const rows = useMemo((): DigestRow[] => {
    if (!stories.length) return [];
    const result: DigestRow[] = [];
    const usedSlugs = new Set<string>();

    // 1. NEW signals (no local history yet)
    for (const s of stories.filter(s => s.isSignal && loadHistory(s.slug).length === 0).slice(0, 2)) {
      const cat = isHe ? s.category.he : s.category.en;
      result.push({
        key: `new-${s.slug}`,
        tag: isHe ? 'חדש' : 'NEW',
        tagColor: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/25',
        text: isHe ? s.headline.he : s.headline.en,
        sub: `${cat} · ${s.sources.length} ${isHe ? 'מקורות' : 'sources'} · ${s.likelihood}%`,
      });
      usedSlugs.add(s.slug);
    }

    // 2. Likelihood movers (24h delta)
    const movers: Array<{ story: BriefStory; delta: number }> = [];
    for (const s of stories) {
      const hist = loadHistory(s.slug);
      if (hist.length < 2) continue;
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      const older = hist.filter(h => h.t <= cutoff + 2 * 60 * 60 * 1000);
      if (!older.length) continue;
      const delta = Math.round(s.likelihood - older[older.length - 1].v);
      if (Math.abs(delta) >= 8) movers.push({ story: s, delta });
    }
    movers.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    for (const { story: s, delta } of movers.slice(0, 2)) {
      if (usedSlugs.has(s.slug)) continue;
      const cat = isHe ? s.category.he : s.category.en;
      const up = delta > 0;
      result.push({
        key: `move-${s.slug}`,
        tag: `${up ? '+' : ''}${delta}%`,
        tagColor: up
          ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25'
          : 'text-red-300 bg-red-500/10 border-red-500/25',
        text: isHe ? s.headline.he : s.headline.en,
        sub: `${cat} · ${s.likelihood}% ${isHe ? 'כעת' : 'now'}`,
      });
      usedSlugs.add(s.slug);
    }

    // 3. Top alpha gap
    const topAlpha = markets
      .filter(m => m.alphaDirection !== 'aligned' && m.alphaScore >= 35)
      .sort((a, b) => b.alphaScore - a.alphaScore)[0];
    if (topAlpha) {
      const isHigher = topAlpha.alphaDirection === 'signal-higher';
      result.push({
        key: `alpha-${topAlpha.topic}`,
        tag: `α ${topAlpha.alphaScore}`,
        tagColor: 'text-yellow-300 bg-yellow-400/10 border-yellow-400/25',
        text: topAlpha.topic,
        sub: `Signal ${topAlpha.signalLikelihood}% · ${isHe ? 'שוק' : 'Market'} ${topAlpha.marketProbability}% · ${isHigher ? (isHe ? 'Signal גבוה' : 'Signal higher') : (isHe ? 'שוק גבוה' : 'Market higher')}`,
        href: topAlpha.polymarketUrl,
      });
    }

    // 4. Active high-confidence shock
    const topShock = shocks.find(sh => sh.confidence === 'high' && sh.status !== 'fading');
    if (topShock) {
      result.push({
        key: `shock-${topShock.id}`,
        tag: isHe ? 'זעזוע' : 'SHOCK',
        tagColor: 'text-orange-300 bg-orange-500/10 border-orange-500/25',
        text: isHe ? topShock.headline.he : topShock.headline.en,
        sub: isHe ? topShock.whatMoved.he : topShock.whatMoved.en,
      });
    }

    // 5. Fallback — fill with top signal headlines so the panel stays substantial
    if (result.length < MAX_ROWS) {
      const ranked = [...stories]
        .filter(s => {
          const cat = s.category?.en ?? '';
          return cat !== 'General' && cat !== 'Sports' && !usedSlugs.has(s.slug);
        })
        .sort((a, b) => {
          if (a.isSignal && !b.isSignal) return -1;
          if (!a.isSignal && b.isSignal) return 1;
          return b.likelihood - a.likelihood;
        });
      for (const s of ranked) {
        if (result.length >= MAX_ROWS) break;
        const cat = isHe ? s.category.he : s.category.en;
        result.push({
          key: `top-${s.slug}`,
          tag: `${s.likelihood}%`,
          tagColor: 'text-gray-300 bg-white/5 border-white/10',
          text: isHe ? s.headline.he : s.headline.en,
          sub: cat,
        });
        usedSlugs.add(s.slug);
      }
    }

    return result.slice(0, MAX_ROWS);
  }, [stories, shocks, markets, isHe]);

  const timeStr = new Date().toLocaleString(isHe ? 'he-IL' : 'en-US', {
    weekday: 'short', hour: '2-digit', minute: '2-digit',
  });

  if (loading) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 animate-pulse space-y-3">
        <div className="h-3 w-40 bg-gray-800 rounded" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3 items-center">
            <div className="h-4 w-12 bg-gray-800 rounded" />
            <div className="h-4 flex-1 bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!rows.length) return null;

  return (
    <div dir={dir} className="rounded-xl border border-white/[0.08] bg-white/[0.025] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(p => !p)}
        className="w-full flex items-center gap-2.5 px-5 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-yellow-400/80">
          {isHe ? 'מה חדש' : "What's New"}
        </span>
        <span className="text-[10px] text-gray-600 font-mono">{timeStr}</span>
        <span className="ms-auto flex items-center gap-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-400 font-mono border border-white/10">
            {rows.length}
          </span>
          <span className="text-gray-600 text-[10px]">{collapsed ? '▼' : '▲'}</span>
        </span>
      </button>

      {/* Rows */}
      {!collapsed && (
        <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
          {rows.map((row) => {
            const body = (
              <>
                <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border tabular-nums mt-px ${row.tagColor}`}>
                  {row.tag}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-100 leading-snug line-clamp-1">
                    {row.text}{row.href ? ' ↗' : ''}
                  </p>
                  {row.sub && (
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{row.sub}</p>
                  )}
                </div>
              </>
            );
            return row.href ? (
              <a
                key={row.key}
                href={row.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 px-5 py-2.5 hover:bg-white/[0.02] transition-colors group"
              >
                {body}
              </a>
            ) : (
              <div key={row.key} className="flex items-start gap-3 px-5 py-2.5">
                {body}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
