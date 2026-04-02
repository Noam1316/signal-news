/**
 * GET /api/v1/shocks
 * Signal News Public API v1 — Active geopolitical shock events.
 *
 * Query params:
 *   limit      — max shocks to return (default: 5, max: 20)
 *   confidence — filter: "high" | "medium" | "low" (default: all)
 *   type       — filter: "likelihood" | "narrative" | "fragmentation" (default: all)
 *
 * Response: { data: Shock[], meta: { total, detectedAt, version } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCachedArticles } from '@/services/article-cache';
import { detectShocks } from '@/services/shock-detector';
import type { ShockEvent } from '@/lib/types';

let cache: { shocks: ShockEvent[]; ts: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit      = Math.min(20, Math.max(1, Number(searchParams.get('limit') || '5')));
  const confidence = searchParams.get('confidence') || 'all';
  const type       = searchParams.get('type') || 'all';

  try {
    if (!cache || Date.now() - cache.ts > CACHE_TTL) {
      const articles = await getCachedArticles();
      const shocks = articles.length >= 5 ? detectShocks(articles) : [];
      cache = { shocks, ts: Date.now() };
    }

    let results = cache.shocks;
    if (confidence !== 'all') results = results.filter(s => s.confidence === confidence);
    if (type !== 'all') results = results.filter(s => s.type === type);

    const data = results.slice(0, limit).map(s => ({
      id:         s.id,
      type:       s.type,
      confidence: s.confidence,
      headline: {
        en: s.headline?.en || '',
        he: s.headline?.he || '',
      },
      whatMoved: {
        en: s.whatMoved?.en || '',
        he: s.whatMoved?.he || '',
      },
      delta:            s.delta,
      timestamp:        s.timestamp,
      relatedStorySlug: s.relatedStorySlug || null,
    }));

    return NextResponse.json(
      {
        data,
        meta: {
          total:      data.length,
          detectedAt: new Date(cache.ts).toISOString(),
          version:    'v1',
          filters:    { confidence, type, limit },
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
    return NextResponse.json({ error: 'Failed to detect shocks', version: 'v1' }, { status: 500 });
  }
}
