'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

interface RssSource {
  id: string;
  name: string;
  url: string;
  language: string;
  lensCategory: string;
  country: string;
}

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

interface FetchError {
  sourceId: string;
  error: string;
}

interface FetchResult {
  articles: FetchedArticle[];
  errors: FetchError[];
  stats: { total: number; sources: number; errors: number };
}

const LENS_COLORS: Record<string, string> = {
  'il-mainstream': 'bg-blue-500/20 text-blue-400',
  'il-partisan': 'bg-purple-500/20 text-purple-400',
  'international': 'bg-green-500/20 text-green-400',
};

export default function RssDebugPage() {
  const [sources, setSources] = useState<RssSource[]>([]);
  const [result, setResult] = useState<FetchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [sourcesLoaded, setSourcesLoaded] = useState(false);
  const [errorSourceIds, setErrorSourceIds] = useState<Set<string>>(new Set());
  const [successSourceIds, setSuccessSourceIds] = useState<Set<string>>(new Set());

  const loadSources = useCallback(async () => {
    try {
      const res = await fetch('/api/rss/sources');
      const data = await res.json();
      setSources(data.sources || []);
      setSourcesLoaded(true);
    } catch {
      console.error('Failed to load sources');
    }
  }, []);

  // Load sources on first render
  if (!sourcesLoaded) {
    loadSources();
  }

  const fetchAll = async () => {
    setLoading(true);
    setResult(null);
    setErrorSourceIds(new Set());
    setSuccessSourceIds(new Set());

    try {
      const res = await fetch('/api/rss/fetch');
      const data: FetchResult = await res.json();
      setResult(data);

      const errIds = new Set(data.errors.map((e) => e.sourceId));
      setErrorSourceIds(errIds);

      const okIds = new Set(
        sources.map((s) => s.id).filter((id) => !errIds.has(id))
      );
      setSuccessSourceIds(okIds);
    } catch (err) {
      console.error('Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const perSourceCounts: Record<string, number> = {};
  if (result) {
    for (const article of result.articles) {
      perSourceCounts[article.sourceId] = (perSourceCounts[article.sourceId] || 0) + 1;
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">RSS Debug Panel</h1>
            <p className="text-sm text-gray-500 mt-1">Monitor and test RSS feed ingestion</p>
          </div>
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Back to home
          </Link>
        </div>

        {/* Sources list */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-300">Configured Sources ({sources.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sources.map((source) => {
              const isError = errorSourceIds.has(source.id);
              const isOk = successSourceIds.has(source.id);
              const count = perSourceCounts[source.id] || 0;

              return (
                <div
                  key={source.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-900 border border-gray-800"
                >
                  {/* Status dot */}
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isError
                        ? 'bg-red-500'
                        : isOk
                        ? 'bg-green-500'
                        : 'bg-gray-600'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-white truncate">{source.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${LENS_COLORS[source.lensCategory] || 'bg-gray-700 text-gray-400'}`}>
                        {source.lensCategory}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">{source.id} | {source.language.toUpperCase()} | {source.country}</div>
                  </div>
                  {isOk && (
                    <span className="text-xs text-gray-400 font-mono">{count}</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Fetch button */}
        <div className="flex items-center gap-4">
          <button
            onClick={fetchAll}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-yellow-400 text-gray-950 font-bold text-sm
                       hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Fetching...' : 'Fetch Now'}
          </button>
          {result && (
            <span className="text-sm text-gray-400">
              {result.stats.total} articles from {result.stats.sources} sources
              {result.stats.errors > 0 && (
                <span className="text-red-400"> ({result.stats.errors} errors)</span>
              )}
            </span>
          )}
        </div>

        {/* Errors */}
        {result && result.errors.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-red-400">Errors</h2>
            <div className="space-y-1">
              {result.errors.map((err) => (
                <div key={err.sourceId} className="flex items-center gap-2 text-sm p-2 rounded bg-red-500/10 border border-red-500/20">
                  <span className="font-mono text-red-400">{err.sourceId}</span>
                  <span className="text-gray-400">{err.error}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Per-source stats */}
        {result && Object.keys(perSourceCounts).length > 0 && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-300">Per-Source Counts</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(perSourceCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([sourceId, count]) => (
                  <span
                    key={sourceId}
                    className="text-xs px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-gray-300"
                  >
                    {sourceId}: <span className="font-mono font-bold text-white">{count}</span>
                  </span>
                ))}
            </div>
          </section>
        )}

        {/* Articles table */}
        {result && result.articles.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-300">Articles ({result.articles.length})</h2>
            <div className="overflow-auto max-h-[600px] rounded-lg border border-gray-800">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-900 border-b border-gray-800">
                  <tr>
                    <th className="text-left p-3 text-gray-400 font-medium">Time</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Source</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Title</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Lens</th>
                  </tr>
                </thead>
                <tbody>
                  {result.articles.map((article) => (
                    <tr key={article.id} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                      <td className="p-3 text-xs text-gray-500 whitespace-nowrap font-mono">
                        {article.pubDate
                          ? new Date(article.pubDate).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="p-3 text-xs text-gray-300 whitespace-nowrap">{article.sourceName}</td>
                      <td className="p-3 text-gray-100 max-w-md">
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-yellow-400 transition-colors line-clamp-1"
                        >
                          {article.title}
                        </a>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${LENS_COLORS[article.lensCategory] || 'bg-gray-700 text-gray-400'}`}>
                          {article.lensCategory}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
