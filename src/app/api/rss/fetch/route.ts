import { NextRequest, NextResponse } from 'next/server';
import { fetchAllSources, fetchFromSource, deduplicateArticles } from '@/services/rss-fetcher';
import { rssSources } from '@/services/rss-sources';

export async function GET(request: NextRequest) {
  const sourceParam = request.nextUrl.searchParams.get('source');

  try {
    if (sourceParam) {
      const source = rssSources.find((s) => s.id === sourceParam);
      if (!source) {
        return NextResponse.json(
          { error: `Unknown source: ${sourceParam}` },
          { status: 400 }
        );
      }

      const articles = await fetchFromSource(source);
      return NextResponse.json({
        articles,
        errors: [],
        stats: {
          total: articles.length,
          sources: 1,
          errors: 0,
        },
      });
    }

    const { articles: rawArticles, errors } = await fetchAllSources();
    const articles = deduplicateArticles(rawArticles);

    return NextResponse.json({
      articles,
      errors,
      stats: {
        total: articles.length,
        sources: rssSources.length - errors.length,
        errors: errors.length,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
