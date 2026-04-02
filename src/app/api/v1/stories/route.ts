/**
 * GET /api/v1/stories
 * Signal News Public API v1 — Top geopolitical stories with likelihood scores.
 *
 * Query params:
 *   limit   — max stories to return (default: 10, max: 50)
 *   lens    — filter by lens: "israel" | "world" (default: all)
 *   signal  — "true" to return only signal stories
 *   format  — "full" includes summary + why (default: summary only)
 *
 * Response: { data: Story[], meta: { total, generatedAt, version } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateStories } from '@/services/story-clusterer';
import { getCachedArticles } from '@/services/article-cache';

let cache: { stories: any[]; ts: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit   = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '10')));
  const lens    = searchParams.get('lens') || 'all';
  const signal  = searchParams.get('signal') === 'true';
  const format  = searchParams.get('format') || 'default';

  try {
    // Refresh cache if stale
    if (!cache || Date.now() - cache.ts > CACHE_TTL) {
      const articles = (await getCachedArticles()).slice(0, 200);
      const stories = generateStories(articles, 50);
      cache = { stories, ts: Date.now() };
    }

    let results = cache.stories;

    if (lens !== 'all') results = results.filter((s: any) => s.lens === lens);
    if (signal) results = results.filter((s: any) => s.isSignal);

    const data = results.slice(0, limit).map((s: any) => {
      const base: any = {
        slug: s.slug,
        headline: {
          en: typeof s.headline === 'string' ? s.headline : s.headline?.en || '',
          he: typeof s.headline === 'object' ? s.headline?.he || '' : '',
        },
        likelihood:      s.likelihood,
        likelihoodLabel: s.likelihoodLabel,
        delta:           s.delta,
        isSignal:        s.isSignal,
        lens:            s.lens,
        category: {
          en: typeof s.category === 'string' ? s.category : s.category?.en || '',
          he: typeof s.category === 'object' ? s.category?.he || '' : '',
        },
        sourceCount: s.sources?.length || 0,
        updatedAt:   s.updatedAt,
      };

      if (format === 'full') {
        base.summary = {
          en: typeof s.summary === 'string' ? s.summary : s.summary?.en || '',
          he: typeof s.summary === 'object' ? s.summary?.he || '' : '',
        };
        base.why = {
          en: typeof s.why === 'string' ? s.why : s.why?.en || '',
          he: typeof s.why === 'object' ? s.why?.he || '' : '',
        };
        base.sources = s.sources || [];
      }

      return base;
    });

    return NextResponse.json(
      {
        data,
        meta: {
          total:       data.length,
          generatedAt: new Date(cache.ts).toISOString(),
          version:     'v1',
          filters:     { lens, signal, limit },
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=120',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to generate stories', version: 'v1' }, { status: 500 });
  }
}
