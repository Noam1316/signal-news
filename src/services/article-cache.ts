/**
 * Shared article cache
 * Used by API routes to avoid internal HTTP calls (which break on Vercel).
 */

import { fetchAllSources, deduplicateArticles, type FetchedArticle } from './rss-fetcher';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cache: { articles: FetchedArticle[]; timestamp: number } | null = null;

export async function getCachedArticles(): Promise<FetchedArticle[]> {
  const now = Date.now();

  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    return cache.articles;
  }

  const { articles } = await fetchAllSources();
  const deduped = deduplicateArticles(articles);

  // Sort by pubDate descending (most recent first)
  deduped.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });

  cache = { articles: deduped, timestamp: now };
  return deduped;
}

export function getCacheTimestamp(): string | null {
  return cache ? new Date(cache.timestamp).toISOString() : null;
}
