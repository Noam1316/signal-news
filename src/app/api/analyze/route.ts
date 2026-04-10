import { NextResponse } from 'next/server';
import { analyzeArticlesWithGroq, extractTrendingTopics, extractTopicsByLeaning } from '@/services/ai-analyzer';
import { getEnrichmentStats } from '@/services/article-enrichment';
import { getCachedArticles } from '@/services/article-cache';

// Cache analysis results for 10 minutes
let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

export async function GET() {
  // Return cached if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    // Get latest articles from shared cache
    const articles = (await getCachedArticles()).slice(0, 500);

    if (!articles || articles.length === 0) {
      return NextResponse.json({
        analyses: [],
        trending: [],
        stats: { total: 0, signals: 0, noise: 0, sentimentBreakdown: {} },
      });
    }

    // Analyze all articles — warms Groq L1 from KV first
    const analyses = await analyzeArticlesWithGroq(articles);
    const trending = extractTrendingTopics(articles, analyses);
    const topicsByLeaning = extractTopicsByLeaning(articles, analyses);

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

    // Political leaning breakdown
    const politicalBreakdown: Record<string, number> = {};
    for (const a of analyses) {
      politicalBreakdown[a.politicalLeaning] = (politicalBreakdown[a.politicalLeaning] || 0) + 1;
    }

    // Sentiment by political leaning
    const sentimentByLeaning: Record<string, Record<string, number>> = {};
    for (const a of analyses) {
      if (!sentimentByLeaning[a.politicalLeaning]) {
        sentimentByLeaning[a.politicalLeaning] = {};
      }
      sentimentByLeaning[a.politicalLeaning][a.sentiment] =
        (sentimentByLeaning[a.politicalLeaning][a.sentiment] || 0) + 1;
    }

    // Enrichment stats
    const enrichmentStats = getEnrichmentStats();
    const enrichedCount = analyses.filter((a) => a.isEnriched).length;

    const result = {
      analyses,
      trending: trending.slice(0, 10),
      topicsByLeaning: topicsByLeaning.slice(0, 8),
      stats: {
        total: articles.length,
        signals,
        noise: articles.length - signals,
        signalRatio: Math.round((signals / articles.length) * 100),
        sentimentBreakdown,
        regionBreakdown,
        politicalBreakdown,
        sentimentByLeaning,
        enrichment: {
          enrichedArticles: enrichedCount,
          totalInCache: enrichmentStats.totalEnriched,
          maxCapacity: enrichmentStats.maxCapacity,
        },
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
