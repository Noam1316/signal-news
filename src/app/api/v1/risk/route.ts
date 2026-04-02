/**
 * GET /api/v1/risk
 * Signal News Public API v1 — Geopolitical Risk Index (0–100).
 *
 * Response: { data: { riskIndex, level, components }, meta: { version, generatedAt } }
 */

import { NextResponse } from 'next/server';
import { getCachedArticles } from '@/services/article-cache';
import { analyzeArticles } from '@/services/ai-analyzer';
import { detectShocks } from '@/services/shock-detector';

let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

export async function GET() {
  try {
    if (!cache || Date.now() - cache.ts > CACHE_TTL) {
      const articles = await getCachedArticles();
      const analyses  = articles.length > 0 ? analyzeArticles(articles.slice(0, 100)) : [];
      const shocks    = articles.length >= 5 ? detectShocks(articles) : [];

      // Sentiment pressure (0–40)
      const sentimentCounts: Record<string, number> = {};
      for (const a of analyses) {
        sentimentCounts[a.sentiment] = (sentimentCounts[a.sentiment] || 0) + 1;
      }
      const sentTotal = Object.values(sentimentCounts).reduce((a, b) => a + b, 0);
      const negRatio = sentTotal > 0 ? ((sentimentCounts.negative || 0) / sentTotal) : 0.4;
      const sentScore = Math.round(negRatio * 40);

      // Shock pressure (0–40)
      const shockPressure = shocks.reduce((acc, s) => {
        return acc + (s.confidence === 'high' ? 16 : s.confidence === 'medium' ? 8 : 4);
      }, 0);
      const shockScore = Math.min(40, shockPressure);

      // Signal density (0–20)
      const signals = analyses.filter(a => a.isSignal).length;
      const signalRatio = analyses.length > 0 ? signals / analyses.length : 0;
      const signalScore = Math.round(signalRatio * 20);

      const riskIndex = Math.min(100, sentScore + shockScore + signalScore);
      const level = riskIndex >= 66 ? 'high' : riskIndex >= 34 ? 'medium' : 'low';

      cache = {
        data: {
          riskIndex,
          level,
          components: {
            sentimentPressure: sentScore,
            shockPressure:     shockScore,
            signalDensity:     signalScore,
          },
          activeShocks:   shocks.length,
          articlesScanned: analyses.length,
        },
        ts: Date.now(),
      };
    }

    return NextResponse.json(
      {
        data: cache.data,
        meta: {
          generatedAt: new Date(cache.ts).toISOString(),
          version:     'v1',
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
    return NextResponse.json({ error: 'Failed to compute risk index', version: 'v1' }, { status: 500 });
  }
}
