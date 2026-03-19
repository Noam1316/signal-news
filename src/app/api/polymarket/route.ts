import { NextResponse } from 'next/server';
import { fetchPolymarketEvents, matchStoriesWithMarkets } from '@/services/polymarket';
import { getCachedArticles } from '@/services/article-cache';
import { generateStories } from '@/services/story-clusterer';

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

    // Cluster articles into stories to get likelihood scores
    const stories = generateStories(articles.slice(0, 200));

    // Extract headline text (use English or first available)
    const storyData = stories.map((s) => ({
      slug: s.slug,
      headline: typeof s.headline === 'string' ? s.headline : s.headline.en || s.headline.he || '',
      likelihood: s.likelihood,
      category: typeof s.category === 'string' ? s.category : '',
    }));

    const matches = matchStoriesWithMarkets(storyData, markets);

    const result = {
      matches,
      totalMarkets: markets.length,
      totalStories: stories.length,
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
