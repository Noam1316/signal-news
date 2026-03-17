import { NextRequest, NextResponse } from 'next/server';
import { fetchAllSources, deduplicateArticles, FetchedArticle } from '@/services/rss-fetcher';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cache: { articles: FetchedArticle[]; timestamp: number } | null = null;

async function getCachedArticles(): Promise<FetchedArticle[]> {
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

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get('limit');
  const lensParam = request.nextUrl.searchParams.get('lens');

  try {
    let articles = await getCachedArticles();

    if (lensParam) {
      articles = articles.filter((a) => a.lensCategory === lensParam);
    }

    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 50, 200) : 50;
    articles = articles.slice(0, limit);

    return NextResponse.json({
      articles,
      count: articles.length,
      cachedAt: cache ? new Date(cache.timestamp).toISOString() : null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
