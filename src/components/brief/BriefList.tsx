'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePolling } from '@/hooks/usePolling';
import { useLanguage } from '@/i18n/context';
import type { BriefStory, ShockEvent } from '@/lib/types';
import BriefCard from './BriefCard';
import DailySummary from './DailySummary';
import BlindspotSummary from './BlindspotSummary';
import AnalystTable from './AnalystTable';
import LensSwitcher from '@/components/shared/LensSwitcher';
import { useWatchlist } from '@/hooks/useWatchlist';
import { getStoryLean, LEAN_LABEL, type Lean } from '@/utils/political-lean';
import { useRecordStories } from '@/hooks/useLikelihoodHistory';
import { usePersonalization } from '@/hooks/usePersonalization';
import { useIntelScore } from '@/hooks/useIntelScore';
import BreakingBanner from './BreakingBanner';

type SortKey = 'default' | 'likelihood' | 'delta' | 'sources' | 'newest';

const TOPIC_FILTER_KEY = 'signal_topic_filter';

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
  const { recordClick, getInterestWeight, isOutsideLane, totalClicks } = usePersonalization();
  const { recordStoryView } = useIntelScore();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [analystMode, setAnalystMode] = useState(false);
  const [topicFilter, setTopicFilter] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(TOPIC_FILTER_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useRecordStories(stories); // persist likelihood history for sparklines + real delta

  // Persist topicFilter to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TOPIC_FILTER_KEY, JSON.stringify(topicFilter));
    } catch {
      // ignore
    }
  }, [topicFilter]);

  // Build slug → shock map for shock indicators on Brief cards
  const shockBySlug = useMemo(
    () => Object.fromEntries(shocks.filter(sh => sh.relatedStorySlug).map(sh => [sh.relatedStorySlug!, sh])),
    [shocks]
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

  // Extract unique categories from all stories
  const uniqueTopics = useMemo(() => {
    const seen = new Set<string>();
    const topics: { he: string; en: string }[] = [];
    for (const s of stories) {
      const key = s.category.he || s.category.en;
      if (key && !seen.has(key)) {
        seen.add(key);
        topics.push({ he: s.category.he, en: s.category.en });
      }
    }
    return topics;
  }, [stories]);

  const filtered = useMemo(() => stories
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
    })
    .filter(s => {
      if (topicFilter.length === 0) return true;
      return topicFilter.includes(s.category.he) || topicFilter.includes(s.category.en);
    }), [stories, lens, showWatchlistOnly, isWatched, leanFilter, search, topicFilter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    switch (sortKey) {
      case 'likelihood': return b.likelihood - a.likelihood;
      case 'delta':      return Math.abs(b.delta) - Math.abs(a.delta);
      case 'sources':    return (b.sources?.length || 0) - (a.sources?.length || 0);
      case 'newest':     return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      default: {
        // Composite importance score for default ranking
        const now = Date.now();
        const ageA = a.updatedAt ? (now - new Date(a.updatedAt).getTime()) / 3600000 : 24;
        const ageB = b.updatedAt ? (now - new Date(b.updatedAt).getTime()) / 3600000 : 24;
        const staleA = ageA > 20 && Math.abs(a.delta) < 2 ? 0.7 : 1;
        const staleB = ageB > 20 && Math.abs(b.delta) < 2 ? 0.7 : 1;
        const hasImpactsA = a.impacts && a.impacts.length > 0 ? 1.15 : 0.85;
        const hasImpactsB = b.impacts && b.impacts.length > 0 ? 1.15 : 0.85;
        const srcA = (a.sources?.length || 1);
        const srcB = (b.sources?.length || 1);

        const scoreA = a.likelihood * (a.isSignal ? 1.3 : 1) * Math.log(srcA + 1) * staleA * hasImpactsA;
        const scoreB = b.likelihood * (b.isSignal ? 1.3 : 1) * Math.log(srcB + 1) * staleB * hasImpactsB;

        // Personalized boost on top
        if (totalClicks >= 5) {
          const wA = getInterestWeight(a.category.en) || getInterestWeight(a.category.he);
          const wB = getInterestWeight(b.category.en) || getInterestWeight(b.category.he);
          const pScoreA = scoreA * (1 + wA * 0.3);
          const pScoreB = scoreB * (1 + wB * 0.3);
          return pScoreB - pScoreA;
        }
        return scoreB - scoreA;
      }
    }
  }), [filtered, sortKey, totalClicks, getInterestWeight]);

  // Anti-filter-bubble: stories outside user's interests
  const outsideLaneStories = useMemo(() => {
    if (totalClicks < 5) return [];
    return sorted.filter(s => isOutsideLane(s.category.en) && isOutsideLane(s.category.he)).slice(0, 2);
  }, [sorted, totalClicks, isOutsideLane]);

  const watchlistCount = watchlist.size;
  const activeFilterCount = (lens !== 'all' ? 1 : 0) + (leanFilter !== 'all' ? 1 : 0) + (showWatchlistOnly ? 1 : 0) + (search.trim() ? 1 : 0) + (topicFilter.length > 0 ? 1 : 0);

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

        {/* Row 3: topic pills */}
        {uniqueTopics.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setTopicFilter([])}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors
                          ${topicFilter.length === 0
                            ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-300'
                            : 'bg-transparent border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                          }`}
            >
              {lang === 'he' ? 'הכל' : 'All'}
            </button>
            {uniqueTopics.map(topic => {
              const label = lang === 'he' ? topic.he : topic.en;
              const key = topic.he || topic.en;
              const isActive = topicFilter.includes(topic.he) || topicFilter.includes(topic.en);
              return (
                <button
                  key={key}
                  onClick={() => {
                    setTopicFilter(prev => {
                      const inHe = prev.includes(topic.he);
                      const inEn = prev.includes(topic.en);
                      if (isActive) {
                        return prev.filter(t => t !== topic.he && t !== topic.en);
                      } else {
                        const next = [...prev];
                        if (topic.he && !inHe) next.push(topic.he);
                        if (topic.en && !inEn) next.push(topic.en);
                        return next;
                      }
                    });
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors
                              ${isActive
                                ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-300'
                                : 'bg-transparent border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                              }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Analyst mode toggle + Export */}
      <div className="flex items-center justify-end gap-2">
        <a
          href="/brief/print"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors bg-transparent border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300"
          title={lang === 'he' ? 'ייצוא PDF — תדריך להדפסה' : 'Export PDF brief'}
        >
          <span>📄</span>
          <span>{lang === 'he' ? 'ייצוא PDF' : 'Export PDF'}</span>
        </a>
        <button
          onClick={() => setAnalystMode(p => !p)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
            analystMode
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
              : 'bg-transparent border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
          }`}
          title={lang === 'he' ? 'מצב מנתח — תצוגת טבלה' : 'Analyst mode — table view'}
        >
          <span>📊</span>
          <span>{lang === 'he' ? 'מצב מנתח' : 'Analyst'}</span>
        </button>
      </div>

      {/* Breaking News Banner */}
      {!loading && stories.length > 0 && <BreakingBanner stories={stories} />}

      {/* Daily Intelligence Summary */}
      {!loading && stories.length > 0 && (
        <DailySummary stories={stories} shocks={shocks} />
      )}

      {/* Blindspot summary */}
      {!loading && <BlindspotSummary />}

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

      {/* Stories — card or analyst table view */}
      {analystMode ? (
        <AnalystTable stories={sorted} shockBySlug={shockBySlug} />
      ) : (
        sorted.map((story, i) => (
          <div key={story.slug} className="animate-slide-up"
               style={{ animationDelay: `${Math.min(i * 30, 300)}ms`, animationFillMode: 'both' }}
               onClick={() => {
                 recordClick(story.category.en || story.category.he);
                 recordStoryView();
               }}>
            <BriefCard
              story={story}
              isWatched={isWatched(story.slug)}
              onWatchToggle={() => toggle(story.slug)}
              relatedShock={shockBySlug[story.slug]}
            />
          </div>
        ))
      )}

      {/* Anti-filter-bubble: "Beyond your interests" */}
      {outsideLaneStories.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="text-sm">🌍</span>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {lang === 'he' ? 'מעבר לתחומי העניין שלך' : 'Beyond your interests'}
            </h3>
            <span className="text-[9px] text-gray-600">
              {lang === 'he' ? 'קצין מודיעין קורא מחוץ לתחום' : 'Intel officers read outside their lane'}
            </span>
          </div>
          {outsideLaneStories.map((story) => (
            <div key={`outside-${story.slug}`}
                 className="opacity-80 border-s-2 border-indigo-500/40 ps-3"
                 onClick={() => {
                   recordClick(story.category.en || story.category.he);
                   recordStoryView();
                 }}>
              <BriefCard
                story={story}
                isWatched={isWatched(story.slug)}
                onWatchToggle={() => toggle(story.slug)}
                relatedShock={shockBySlug[story.slug]}
              />
            </div>
          ))}
        </div>
      )}

      {/* Empty states */}
      {!loading && sorted.length === 0 && showWatchlistOnly && (
        <div className="text-center py-10 space-y-2">
          <p className="text-3xl animate-bounce">★</p>
          <p className="text-sm text-gray-400 font-medium">{lang === 'he' ? 'אין סיפורים ברשימת המעקב עדיין' : 'No watched stories yet'}</p>
          <p className="text-xs text-gray-600">{lang === 'he' ? 'לחץ ★ על כרטיס כדי להוסיף למעקב' : 'Click ★ on any card to start watching'}</p>
        </div>
      )}
      {!loading && sorted.length === 0 && search && !showWatchlistOnly && (
        <div className="text-center py-8 space-y-2">
          <p className="text-3xl">🔍</p>
          <p className="text-sm text-gray-400">{lang === 'he' ? `לא נמצאו תוצאות עבור "${search}"` : `No results for "${search}"`}</p>
          <button onClick={() => setSearch('')} className="text-xs text-yellow-400/70 hover:text-yellow-400 transition-colors">
            {lang === 'he' ? 'נקה חיפוש' : 'Clear search'}
          </button>
        </div>
      )}
      {!loading && sorted.length === 0 && !search && !showWatchlistOnly && stories.length > 0 && (
        <div className="text-center py-8 space-y-2">
          <p className="text-3xl">🔭</p>
          <p className="text-sm text-gray-400">{lang === 'he' ? 'אין סיפורים בעדשה הזו' : 'No stories in this lens'}</p>
        </div>
      )}
      {!loading && stories.length === 0 && !search && !showWatchlistOnly && (
        <div className="text-center py-12 space-y-3">
          <div className="text-4xl animate-pulse">📡</div>
          <p className="text-sm font-medium text-gray-300">{lang === 'he' ? 'אוסף נתונים...' : 'Collecting intelligence...'}</p>
          <p className="text-xs text-gray-600">{lang === 'he' ? 'מנתח ערוצי RSS ומחלץ סיגנלים' : 'Analyzing RSS feeds and extracting signals'}</p>
        </div>
      )}
    </div>
  );
}
