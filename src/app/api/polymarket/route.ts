import { NextResponse } from 'next/server';
import { fetchPolymarketEvents, matchStoriesWithMarkets } from '@/services/polymarket';
import { getCachedArticles } from '@/services/article-cache';
import { generateStories } from '@/services/story-clusterer';
import { analyzeArticles } from '@/services/ai-analyzer';
import { savePredictionSnapshots } from '@/services/prediction-tracker';
import { computeEarlyMovers } from '@/services/signal-intelligence';

let cache: { data: any; ts: number } | null = null;
const TTL = 10 * 60 * 1000; // 10 min

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    // Fetch both in parallel
    const [markets, articles] = await Promise.all([
      fetchPolymarketEvents(),
      getCachedArticles(),
    ]);

    const sliced = articles.slice(0, 200);

    // Cluster articles into stories to get likelihood scores
    const stories = generateStories(sliced);

    // Analyze articles for sentiment (used by bias-adjusted signal)
    const analyses = analyzeArticles(sliced);
    const sentimentMap = new Map(analyses.map(a => [a.articleId, a.sentiment]));

    // Compute early movers from article timing data
    // Group articles by topic to match story clusters
    const storyArticleMap = new Map<string, Array<{ sourceName: string; pubDate?: string }>>();
    for (const story of stories) {
      const slug = story.slug;
      const storySourceNames = new Set(story.sources.map(s => s.name));
      // Find articles belonging to this story by matching source names
      const storyArticles = sliced
        .filter(a => storySourceNames.has(a.sourceName))
        .map(a => ({ sourceName: a.sourceName, pubDate: a.pubDate }));
      storyArticleMap.set(slug, storyArticles);
    }

    // Build story data for early mover computation
    const storiesForEarlyMover = stories.map(s => ({
      sources: s.sources.map(src => ({ name: src.name })),
      articles: storyArticleMap.get(s.slug) || [],
    }));
    const earlyMovers = computeEarlyMovers(storiesForEarlyMover);

    // Extract headline text + sources + sentiment for matching
    const storyData = stories.map((s) => {
      // Determine dominant sentiment from story's sources
      const storySourceNames = new Set(s.sources.map(src => src.name));
      const storySentiments = sliced
        .filter(a => storySourceNames.has(a.sourceName))
        .map(a => sentimentMap.get(a.id))
        .filter(Boolean) as Array<'positive' | 'negative' | 'neutral' | 'mixed'>;

      const sentimentCounts: Record<string, number> = {};
      for (const sent of storySentiments) {
        sentimentCounts[sent] = (sentimentCounts[sent] || 0) + 1;
      }
      const dominantSentiment = (Object.entries(sentimentCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral') as 'positive' | 'negative' | 'neutral' | 'mixed';

      return {
        slug: s.slug,
        headline: typeof s.headline === 'string' ? s.headline : s.headline.en || s.headline.he || '',
        likelihood: s.likelihood,
        category: typeof s.category === 'string' ? s.category : '',
        sourceCount: s.sources?.length || 3,
        sources: s.sources.map(src => ({ name: src.name })),
        sentiment: dominantSentiment,
      };
    });

    const matches = matchStoriesWithMarkets(storyData, markets, earlyMovers);

    // Save prediction snapshots for track record (non-blocking)
    savePredictionSnapshots(matches).catch(() => {});

    const result = {
      matches,
      totalMarkets: markets.length,
      totalStories: stories.length,
      earlyMovers: earlyMovers.slice(0, 10),
      source: markets.length > 0 && markets[0].id.startsWith('fallback') ? 'fallback' : 'live',
      fetchedAt: new Date().toISOString(),
    };

    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (err) {
    console.error('Polymarket route error:', err);
    return NextResponse.json({ matches: [], totalMarkets: 0, totalStories: 0, source: 'error' }, { status: 500 });
  }
}
