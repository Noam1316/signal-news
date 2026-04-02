/**
 * GET /api/v1/signals
 * Zikuk Public API v1 — Signal vs Market alpha divergences.
 *
 * Query params:
 *   limit     — max matches (default: 5, max: 20)
 *   minAlpha  — minimum alpha score (default: 0)
 *   minDelta  — minimum absolute delta % (default: 0)
 *
 * Response: { data: AlphaMatch[], meta: { total, generatedAt, version } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCachedArticles } from '@/services/article-cache';
import { generateStories } from '@/services/story-clusterer';
import { fetchPolymarketEvents, matchStoriesWithMarkets } from '@/services/polymarket';

let cache: { data: any[]; ts: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit    = Math.min(20, Math.max(1, Number(searchParams.get('limit') || '5')));
  const minAlpha = Number(searchParams.get('minAlpha') || '0');
  const minDelta = Number(searchParams.get('minDelta') || '0');

  try {
    if (!cache || Date.now() - cache.ts > CACHE_TTL) {
      const articles = await getCachedArticles();
      const stories  = generateStories(articles, 30);
      const markets  = await fetchPolymarketEvents();

      const storyInputs = stories.map(s => ({
        slug:        s.slug,
        headline:    typeof s.headline === 'string' ? s.headline : (s.headline as any)?.en || '',
        likelihood:  s.likelihood,
        category:    typeof s.category === 'string' ? s.category : (s.category as any)?.en || '',
        sourceCount: s.sources?.length ?? 0,
      }));

      const matches = matchStoriesWithMarkets(storyInputs, markets);
      cache = {
        data: matches.sort((a, b) => b.alphaScore - a.alphaScore),
        ts: Date.now(),
      };
    }

    let results = cache.data;
    if (minAlpha > 0) results = results.filter((m: any) => m.alphaScore >= minAlpha);
    if (minDelta > 0) results = results.filter((m: any) => Math.abs(m.delta) >= minDelta);

    const data = results.slice(0, limit).map((m: any) => ({
      topic:             m.topic,
      topicCategory:     m.topicCategory,
      signalLikelihood:  m.signalLikelihood,
      marketProbability: m.marketProbability,
      delta:             m.delta,
      alphaDirection:    m.alphaDirection,
      alphaScore:        m.alphaScore,
      whyDifferent:      m.whyDifferent,
      polymarketTitle:   m.polymarketTitle,
      polymarketUrl:     m.polymarketUrl,
      volume:            m.volume,
    }));

    return NextResponse.json(
      {
        data,
        meta: {
          total:       data.length,
          generatedAt: new Date(cache.ts).toISOString(),
          version:     'v1',
          filters:     { limit, minAlpha, minDelta },
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to compute signals', version: 'v1' }, { status: 500 });
  }
}
