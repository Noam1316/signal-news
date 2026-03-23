'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';
import { groupArticles, type GroupedArticle } from '@/utils/news-grouper';
import GroupedStoryCard from './GroupedStoryCard';
import type { FetchedArticle } from '@/services/rss-fetcher';

export default function GroupedFeed() {
  const { lang, dir } = useLanguage();
  const [groups, setGroups] = useState<GroupedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [threshold, setThreshold] = useState(0.2);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/rss/latest?limit=200');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { articles?: FetchedArticle[] };
        if (!cancelled) {
          const articles = data.articles ?? [];
          setGroups(groupArticles(articles, threshold, 2));
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [threshold]);

  return (
    <div dir={dir} className="space-y-4">
      {/* Header + controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <span>🗞️</span>
            {lang === 'he' ? 'כתבות מקובצות' : 'Grouped Stories'}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {lang === 'he'
              ? 'כתבות על אותו נושא ממקורות שונים — לחץ על מקור לעבור אליו'
              : 'Same story across multiple sources — click a source badge to switch'}
          </p>
        </div>
        {/* Threshold slider */}
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <span>{lang === 'he' ? 'רגישות:' : 'Sensitivity:'}</span>
          <input
            type="range" min={0.1} max={0.4} step={0.05}
            value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
            className="w-20 accent-indigo-500"
          />
          <span className="text-indigo-400 w-6">{Math.round(threshold * 100)}%</span>
        </label>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-500 text-sm gap-2">
          <span className="animate-spin text-indigo-400">⟳</span>
          {lang === 'he' ? 'טוען ומקבץ כתבות…' : 'Loading and grouping articles…'}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-red-400 text-sm p-4 bg-red-900/20 rounded-lg border border-red-800">
          {lang === 'he' ? 'שגיאה בטעינת הכתבות' : 'Error loading articles'}: {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && groups.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">
          <div className="text-3xl mb-2">🗂️</div>
          {lang === 'he'
            ? 'לא נמצאו קבוצות — נסה להוריד את הרגישות'
            : 'No groups found — try lowering sensitivity'}
        </div>
      )}

      {/* Groups count */}
      {!loading && groups.length > 0 && (
        <p className="text-xs text-gray-500">
          {lang === 'he'
            ? `נמצאו ${groups.length} נושאים מקובצים`
            : `Found ${groups.length} grouped stories`}
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
        {groups.map(g => (
          <GroupedStoryCard key={g.id} group={g} />
        ))}
      </div>
    </div>
  );
}
