'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePolling } from '@/hooks/usePolling';
import { useLanguage } from '@/i18n/context';
import type { BriefStory, ShockEvent } from '@/lib/types';
import BriefCard from './BriefCard';
import DailySummary from './DailySummary';
import LensSwitcher from '@/components/shared/LensSwitcher';
import { useWatchlist } from '@/hooks/useWatchlist';
import { getStoryLean, LEAN_LABEL, type Lean } from '@/utils/political-lean';
import { useRecordStories } from '@/hooks/useLikelihoodHistory';

type SortKey = 'default' | 'likelihood' | 'delta' | 'sources' | 'newest';

interface BriefListProps {
  compactMode?: boolean;
}

export default function BriefList({ compactMode: _compactMode }: BriefListProps = {}) {
  const { lang } = useLanguage();
  const [lens, setLens] = useState<'all' | 'israel' | 'world'>('all');
  const [stories, setStories] = useState<BriefStory[]>([]);
  const [shocks, setShocks] = useState<ShockEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>('');
  const [search, setSearch] = useState('');
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  const [leanFilter, setLeanFilter] = useState<Lean | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const { toggle, isWatched, watchlist } = useWatchlist();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useRecordStories(stories); // persist likelihood history for sparklines + real delta

  // Build slug → shock map for shock indicators on Brief cards
  const shockBySlug = Object.fromEntries(
    shocks.filter(sh => sh.relatedStorySlug).map(sh => [sh.relatedStorySlug!, sh])
  );

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      const [storiesRes, shocksRes] = await Promise.all([
        fetch('/api/stories'),
        fetch('/api/shocks'),
      ]);
      if (!storiesRes.ok) throw new Error('Failed');
      const storiesData = await storiesRes.json();
      setStories(storiesData.stories || []);
      setSource(storiesData.source || '');
      if (shocksRes.ok) {
        const shocksData = await shocksRes.json();
        setShocks(shocksData.shocks || []);
      }
    } catch {
      const { stories: staticStories } = await import('@/data/stories');
      setStories(staticStories);
      setSource('static-import');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  usePolling(fetchStories, 3 * 60 * 1000, autoRefresh);

  const filtered = stories
    .filter(s => lens === 'all' || s.lens === lens)
    .filter(s => !showWatchlistOnly || isWatched(s.slug))
    .filter(s => leanFilter === 'all' || getStoryLean(s) === leanFilter)
    .filter(s => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const h = s.headline as { he?: string; en?: string } | string;
      const sm = s.summary as { he?: string; en?: string } | string;
      const headline = (typeof h === 'string' ? h : h?.he || h?.en || '').toLowerCase();
      const summary = (typeof sm === 'string' ? sm : sm?.he || sm?.en || '').toLowerCase();
      return headline.includes(q) || summary.includes(q);
    });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortKey) {
      case 'likelihood': return b.likelihood - a.likelihood;
      case 'delta':      return Math.abs(b.delta) - Math.abs(a.delta);
      case 'sources':    return (b.sources?.length || 0) - (a.sources?.length || 0);
      case 'newest':     return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      default:           return 0;
    }
  });

  const watchlistCount = watchlist.size;
  const activeFilterCount = (lens !== 'all' ? 1 : 0) + (leanFilter !== 'all' ? 1 : 0) + (showWatchlistOnly ? 1 : 0) + (search.trim() ? 1 : 0);

  const SORT_OPTIONS: { key: SortKey; he: string; en: string }[] = [
    { key: 'default',    he: 'ברירת מחדל', en: 'Default' },
    { key: 'likelihood', he: 'סבירות',     en: 'Likelihood' },
    { key: 'delta',      he: 'שינוי',      en: 'Delta' },
    { key: 'sources',    he: 'מקורות',     en: 'Sources' },
    { key: 'newest',     he: 'חדש',        en: 'Newest' },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Mobile: filter toggle row */}
      <div className="flex sm:hidden items-center gap-2 mb-1">
        <button
          onClick={() => setFiltersOpen(p => !p)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors"
        >
          ⚙️ {lang === 'he' ? 'פילטרים' : 'Filters'}
          {activeFilterCount > 0 && (
            <span className="bg-yellow-400 text-gray-950 text-[10px] font-bold px-1.5 rounded-full">{activeFilterCount}</span>
          )}
          <span className="text-gray-600">{filtersOpen ? '▲' : '▼'}</span>
        </button>
        {/* Auto Refresh toggle (always visible on mobile) */}
        <button
          onClick={() => setAutoRefresh(p => !p)}
          className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
            autoRefresh
              ? 'border-green-500/50 text-green-400 bg-green-500/10'
              : 'border-gray-700 text-gray-500'
          }`}
        >
          {autoRefresh
            ? (lang === 'he' ? 'חי' : 'LIVE')
            : (lang === 'he' ? 'מושהה' : 'PAUSED')}
        </button>
        {source && source !== 'static-import' && source !== 'static-fallback' && (
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 ms-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </span>
        )}
      </div>

      {/* Filter content: hidden on mobile unless filtersOpen, always visible on desktop */}
      <div className={`${filtersOpen ? 'flex' : 'hidden'} sm:flex flex-col gap-3`}>
        {/* Row 1: lens + watchlist + lean filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <LensSwitcher value={lens} onChange={setLens} />

          <button
            onClick={() => setShowWatchlistOnly(p => !p)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors
                        ${showWatchlistOnly
                          ? 'bg-yellow-400/15 border-yellow-400/40 text-yellow-400'
                          : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                        }`}
          >
            <span>★</span>
            <span>{lang === 'he' ? 'מעקב' : 'Watched'}</span>
            {watchlistCount > 0 && (
              <span className={`text-[10px] px-1 rounded-full font-bold
                                ${showWatchlistOnly ? 'bg-yellow-400/30 text-yellow-300' : 'bg-gray-700 text-gray-400'}`}>
                {watchlistCount}
              </span>
            )}
          </button>

          {/* Political lean filter */}
          <div className="flex items-center gap-1">
            {(['all', 'left', 'center', 'right'] as const).map(l => {
              const isActive = leanFilter === l;
              const leanData = l !== 'all' ? LEAN_LABEL[l] : null;
              return (
                <button key={l} onClick={() => setLeanFilter(l)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors
                              ${isActive
                                ? leanData ? `${leanData.bg} ${leanData.color}` : 'bg-gray-700 border-gray-500 text-gray-200'
                                : 'bg-transparent border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                              }`}>
                  {l === 'all' ? (lang === 'he' ? 'הכל' : 'All') : (lang === 'he' ? leanData!.he : leanData!.en)}
                </button>
              );
            })}
          </div>

          <div className="flex-1" />
          {/* Auto Refresh toggle (desktop) */}
          <button
            onClick={() => setAutoRefresh(p => !p)}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
              autoRefresh
                ? 'border-green-500/50 text-green-400 bg-green-500/10'
                : 'border-gray-700 text-gray-500'
            }`}
          >
            {autoRefresh
              ? (lang === 'he' ? 'חי' : 'LIVE')
              : (lang === 'he' ? 'מושהה' : 'PAUSED')}
          </button>
          {source && source !== 'static-import' && source !== 'static-fallback' && (
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {lang === 'he' ? 'חי' : 'Live'}
            </span>
          )}
        </div>

        {/* Row 2: search + sort */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <svg className="absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'he' ? 'חפש סיפור...' : 'Search stories...'}
              dir={lang === 'he' ? 'rtl' : 'ltr'}
              className="w-full ps-8 pe-3 py-1.5 rounded-lg bg-gray-800/60 border border-gray-700/50 text-sm
                         text-gray-200 placeholder-gray-600 focus:outline-none focus:border-yellow-400/40 transition-colors" />
            {search && (
              <button onClick={() => setSearch('')}
                      className="absolute end-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs">✕</button>
            )}
          </div>

          {/* Sort selector */}
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value as SortKey)}
            className="text-xs rounded-lg bg-gray-800 border border-gray-700 text-gray-300 px-2 py-1.5
                       focus:outline-none focus:border-yellow-400/40 cursor-pointer"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.key} value={o.key}>
                {lang === 'he' ? `מיין: ${o.he}` : `Sort: ${o.en}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Daily Intelligence Summary */}
      {!loading && stories.length > 0 && (
        <DailySummary stories={stories} shocks={shocks} />
      )}

      {/* Skeleton */}
      {loading && stories.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/80 p-5 space-y-3 animate-pulse">
              <div className="h-3 w-24 bg-gray-800 rounded" />
              <div className="h-5 w-3/4 bg-gray-800 rounded" />
              <div className="h-3 w-full bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Stories */}
      {sorted.map((story, i) => (
        <div key={story.slug} className="animate-slide-up"
             style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
          <BriefCard
            story={story}
            isWatched={isWatched(story.slug)}
            onWatchToggle={() => toggle(story.slug)}
            relatedShock={shockBySlug[story.slug]}
          />
        </div>
      ))}

      {/* Empty states */}
      {!loading && sorted.length === 0 && showWatchlistOnly && (
        <div className="text-center py-8 text-gray-500 text-sm">
          <p className="text-2xl mb-2">★</p>
          <p>{lang === 'he' ? 'אין סיפורים ברשימת המעקב עדיין' : 'No watched stories yet'}</p>
          <p className="text-xs mt-1 text-gray-600">{lang === 'he' ? 'לחץ ★ על כרטיס' : 'Click ★ on a card'}</p>
        </div>
      )}
      {!loading && sorted.length === 0 && search && !showWatchlistOnly && (
        <div className="text-center py-6 text-gray-500 text-sm">
          {lang === 'he' ? `אין תוצאות עבור "${search}"` : `No results for "${search}"`}
        </div>
      )}
      {!loading && sorted.length === 0 && !search && !showWatchlistOnly && stories.length > 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          {lang === 'he' ? 'אין סיפורים בעדשה הזו' : 'No stories in this lens'}
        </div>
      )}
    </div>
  );
}
