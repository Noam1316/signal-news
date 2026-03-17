'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/i18n/context';
import ArticleCard from './ArticleCard';
import SourceBar from './SourceBar';
import { FeedSkeleton } from '@/components/shared/LoadingSkeleton';

interface FetchedArticle {
  id: string;
  sourceId: string;
  sourceName: string;
  lensCategory: string;
  language: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  fetchedAt: string;
}

type LensFilter = 'all' | 'il-mainstream' | 'il-partisan' | 'international';

const FILTERS: { value: LensFilter; label: { en: string; he: string } }[] = [
  { value: 'all', label: { en: 'All Sources', he: 'כל המקורות' } },
  { value: 'il-mainstream', label: { en: 'IL Mainstream', he: 'מיינסטרים ישראלי' } },
  { value: 'il-partisan', label: { en: 'IL Partisan', he: 'מפלגתי ישראלי' } },
  { value: 'international', label: { en: 'International', he: 'בינלאומי' } },
];

export default function LiveWire() {
  const { ui, t, dir, lang } = useLanguage();
  const [articles, setArticles] = useState<FetchedArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LensFilter>('all');
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [showStats, setShowStats] = useState(true);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/rss/latest?limit=200');
      const data = await res.json();
      if (data.articles) {
        setArticles(data.articles);
        setLastFetch(new Date());
      }
    } catch (err) {
      setError(lang === 'he' ? 'שגיאה בטעינת כתבות' : 'Failed to load articles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  // Initial fetch
  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Auto-refresh every 3 minutes
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchArticles, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchArticles]);

  // Unique sources for dropdown
  const uniqueSources = useMemo(() => {
    const map = new Map<string, string>();
    articles.forEach((a) => map.set(a.sourceId, a.sourceName));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [articles]);

  // Source counts for stats
  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    articles.forEach((a) => {
      counts[a.sourceName] = (counts[a.sourceName] || 0) + 1;
    });
    return counts;
  }, [articles]);

  // Lens counts for stats bar
  const lensCounts = useMemo(() => ({
    'il-mainstream': articles.filter((a) => a.lensCategory === 'il-mainstream').length,
    'il-partisan': articles.filter((a) => a.lensCategory === 'il-partisan').length,
    international: articles.filter((a) => a.lensCategory === 'international').length,
  }), [articles]);

  // Apply all filters
  const filtered = useMemo(() => {
    let result = articles;

    // Lens filter
    if (filter !== 'all') {
      result = result.filter((a) => a.lensCategory === filter);
    }

    // Source filter
    if (sourceFilter !== 'all') {
      result = result.filter((a) => a.sourceId === sourceFilter);
    }

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.sourceName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [articles, filter, sourceFilter, search]);

  // Group by time buckets
  const now = Date.now();
  const oneHour = 3600 * 1000;
  const buckets = {
    recent: filtered.filter((a) => a.pubDate && now - new Date(a.pubDate).getTime() < oneHour),
    today: filtered.filter((a) => {
      if (!a.pubDate) return false;
      const diff = now - new Date(a.pubDate).getTime();
      return diff >= oneHour && diff < 24 * oneHour;
    }),
    older: filtered.filter((a) => {
      if (!a.pubDate) return true;
      return now - new Date(a.pubDate).getTime() >= 24 * oneHour;
    }),
  };

  const sourceCount = new Set(articles.map((a) => a.sourceId)).size;

  return (
    <section dir={dir} className="space-y-5">
      {/* Header */}
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{ui('explore')}</h1>
            {loading && (
              <div className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                showStats
                  ? 'border-gray-600 text-gray-300 bg-gray-800/50'
                  : 'border-gray-800 text-gray-600'
              }`}
              title={lang === 'he' ? 'סטטיסטיקות' : 'Stats'}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                autoRefresh
                  ? 'border-green-500/50 text-green-400 bg-green-500/10'
                  : 'border-gray-700 text-gray-500'
              }`}
            >
              {autoRefresh
                ? (lang === 'he' ? 'חי' : 'LIVE')
                : (lang === 'he' ? 'מושהה' : 'PAUSED')}
            </button>
            <button
              onClick={fetchArticles}
              disabled={loading}
              className="text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-400">
          {lang === 'he'
            ? `${articles.length} כתבות מ-${sourceCount} מקורות`
            : `${articles.length} articles from ${sourceCount} sources`}
          {lastFetch && (
            <span className="text-gray-600">
              {' '}&middot;{' '}
              {lang === 'he' ? 'עודכן ' : 'updated '}
              {lastFetch.toLocaleTimeString(lang === 'he' ? 'he-IL' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </p>
      </header>

      {/* Stats bar */}
      {showStats && articles.length > 0 && (
        <SourceBar
          lensCounts={lensCounts}
          sourceCounts={sourceCounts}
          total={articles.length}
          lang={lang}
        />
      )}

      {/* Search bar */}
      <div className="relative">
        <svg
          className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === 'he' ? 'חפש כתבות...' : 'Search articles...'}
          className="w-full bg-gray-900 border border-gray-800 rounded-lg ps-9 pe-3 py-2.5
                     text-sm text-gray-200 placeholder-gray-600
                     focus:border-yellow-400/50 focus:outline-none focus:ring-1 focus:ring-yellow-400/20
                     transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Lens filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1">
          {FILTERS.map((f) => {
            const isActive = filter === f.value;
            const count = f.value === 'all'
              ? articles.length
              : articles.filter((a) => a.lensCategory === f.value).length;

            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  isActive
                    ? 'border-yellow-400/50 bg-yellow-400/10 text-yellow-400'
                    : 'border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-300'
                }`}
              >
                {t(f.label)}
                <span className="ms-1.5 text-[10px] opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Source dropdown */}
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="text-xs bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5
                     text-gray-300 focus:border-yellow-400/50 focus:outline-none
                     cursor-pointer transition-colors"
        >
          <option value="all">{lang === 'he' ? 'כל המקורות' : 'All Sources'}</option>
          {uniqueSources.map(([id, name]) => (
            <option key={id} value={id}>
              {name} ({sourceCounts[name] || 0})
            </option>
          ))}
        </select>
      </div>

      {/* Active filters indicator */}
      {(search || sourceFilter !== 'all' || filter !== 'all') && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>
            {lang === 'he'
              ? `מציג ${filtered.length} מתוך ${articles.length}`
              : `Showing ${filtered.length} of ${articles.length}`}
          </span>
          <button
            onClick={() => { setSearch(''); setFilter('all'); setSourceFilter('all'); }}
            className="text-yellow-400/70 hover:text-yellow-400 transition-colors"
          >
            {lang === 'he' ? 'נקה הכל' : 'Clear all'}
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && articles.length === 0 && (
        <FeedSkeleton count={8} />
      )}

      {/* Error */}
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && !error && (
        <div className="text-center py-16 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <p className="text-sm">
            {search
              ? (lang === 'he' ? `לא נמצאו תוצאות ל-"${search}"` : `No results for "${search}"`)
              : (lang === 'he' ? 'אין כתבות. לחץ רענון לטעינה.' : 'No articles yet. Hit refresh to load.')}
          </p>
        </div>
      )}

      {/* Article groups */}
      {buckets.recent.length > 0 && (
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-yellow-400/70 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            {lang === 'he' ? 'השעה האחרונה' : 'Last Hour'}
            <span className="text-gray-600 font-normal">({buckets.recent.length})</span>
          </h2>
          <div className="space-y-0.5">
            {buckets.recent.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      )}

      {buckets.today.length > 0 && (
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {lang === 'he' ? 'היום' : 'Today'}
            <span className="text-gray-600 font-normal ms-2">({buckets.today.length})</span>
          </h2>
          <div className="space-y-0.5">
            {buckets.today.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      )}

      {buckets.older.length > 0 && (
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            {lang === 'he' ? 'קודם' : 'Earlier'}
            <span className="text-gray-700 font-normal ms-2">({buckets.older.length})</span>
          </h2>
          <div className="space-y-0.5">
            {buckets.older.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
