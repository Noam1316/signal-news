/**
 * GET /api/entities
 * Returns entity extraction and co-occurrence data from live RSS articles.
 * Entity Graph: who appears with whom across multiple articles.
 * Cache: 10 minutes
 */

import { NextResponse } from 'next/server';
import { getCachedArticles } from '@/services/article-cache';
import { extractArticleEntities, getEntityCooccurrence } from '@/services/shock-detector';

let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const articles = await getCachedArticles();

    const entities = extractArticleEntities(articles);
    const cooccurrence = getEntityCooccurrence(articles);

    const result = {
      entities: entities.slice(0, 30),
      cooccurrence: cooccurrence.slice(0, 20),
      totalArticles: articles.length,
      analyzedAt: new Date().toISOString(),
    };

    cache = { data: result, timestamp: Date.now() };
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Entities] Extraction failed:', error);
    return NextResponse.json({ error: 'Entity extraction failed' }, { status: 500 });
  }
}
