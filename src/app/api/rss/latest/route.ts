import { NextRequest, NextResponse } from 'next/server';
import { getCachedArticles, getCacheTimestamp } from '@/services/article-cache';

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get('limit');
  const lensParam = request.nextUrl.searchParams.get('lens');

  try {
    let articles = await getCachedArticles();

    if (lensParam) {
      articles = articles.filter((a) => a.lensCategory === lensParam);
    }

    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 100, 500) : 100;
    articles = articles.slice(0, limit);

    return NextResponse.json({
      articles,
      count: articles.length,
      cachedAt: getCacheTimestamp(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
