import { NextResponse } from 'next/server';
import { analyzeArticles, extractTrendingTopics } from '@/services/ai-analyzer';
import type { FetchedArticle } from '@/services/rss-fetcher';

// Cache analysis results for 10 minutes
let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

export async function GET() {
  // Return cached if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    // Fetch latest articles
    const res = await fetch('http://localhost:3000/api/rss/latest?limit=100', {
      cache: 'no-store',
    });
    const { articles }: { articles: FetchedArticle[] } = await res.json();

    if (!articles || articles.length === 0) {
      return NextResponse.json({
        analyses: [],
        trending: [],
        stats: { total: 0, signals: 0, noise: 0, sentimentBreakdown: {} },
      });
    }

    // Analyze all articles
    const analyses = analyzeArticles(articles);
    const trending = extractTrendingTopics(articles, analyses);

    // Compute stats
    const signals = analyses.filter((a) => a.isSignal).length;
    const sentimentBreakdown: Record<string, number> = {};
    for (const a of analyses) {
      sentimentBreakdown[a.sentiment] = (sentimentBreakdown[a.sentiment] || 0) + 1;
    }

    const regionBreakdown: Record<string, number> = {};
    for (const a of analyses) {
      regionBreakdown[a.region] = (regionBreakdown[a.region] || 0) + 1;
    }

    const result = {
      analyses,
      trending: trending.slice(0, 10),
      stats: {
        total: articles.length,
        signals,
        noise: articles.length - signals,
        signalRatio: Math.round((signals / articles.length) * 100),
        sentimentBreakdown,
        regionBreakdown,
      },
      analyzedAt: new Date().toISOString(),
    };

    cache = { data: result, timestamp: Date.now() };
    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis failed:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
