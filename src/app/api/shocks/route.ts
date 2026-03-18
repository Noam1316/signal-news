/**
 * GET /api/shocks
 * Returns dynamically detected shock events from live RSS articles.
 * Falls back to static shocks if RSS analysis yields nothing.
 * Cache: 10 minutes
 */

import { NextResponse } from 'next/server';
import { getCachedArticles } from '@/services/article-cache';
import { detectShocks } from '@/services/shock-detector';
import type { ShockEvent } from '@/lib/types';

let cache: { shocks: ShockEvent[]; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json({
      shocks: cache.shocks,
      source: 'cache',
      detectedAt: new Date(cache.timestamp).toISOString(),
    });
  }

  try {
    const articles = await getCachedArticles();

    if (articles.length < 5) {
      throw new Error('Not enough articles for shock detection');
    }

    const shocks = detectShocks(articles);

    if (shocks.length === 0) {
      throw new Error('No shocks detected');
    }

    cache = { shocks, timestamp: Date.now() };

    return NextResponse.json({
      shocks,
      source: 'live',
      articleCount: articles.length,
      detectedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Shocks] Detection failed, falling back to static:', error);

    // Fallback to static shocks
    const { shocks: staticShocks } = await import('@/data/shocks');

    return NextResponse.json({
      shocks: staticShocks,
      source: 'static-fallback',
      detectedAt: new Date().toISOString(),
    });
  }
}
