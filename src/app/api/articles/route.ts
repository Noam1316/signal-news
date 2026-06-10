import { NextResponse } from 'next/server';
import { getCachedArticles } from '@/services/article-cache';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lens = searchParams.get('lens') ?? '';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '40', 10), 100);

  try {
    const articles = await getCachedArticles();
    const filtered = lens
      ? articles.filter(a => a.lensCategory === lens)
      : articles;

    const sorted = [...filtered]
      .sort((a, b) => new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime())
      .slice(0, limit)
      .map(a => ({
        id:          a.id,
        sourceId:    a.sourceId,
        sourceName:  a.sourceName,
        lensCategory:a.lensCategory,
        language:    a.language,
        title:       a.title,
        description: a.description,
        link:        a.link,
        pubDate:     a.pubDate,
      }));

    return NextResponse.json({ articles: sorted, total: filtered.length });
  } catch {
    return NextResponse.json({ articles: [], total: 0 }, { status: 500 });
  }
}
