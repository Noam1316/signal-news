/**
 * Preview today's tweet without actually posting it.
 * GET /api/tweet-preview → returns { text, charCount, match }
 * Useful for checking the bot output before Twitter credentials are configured.
 */

import { NextResponse } from 'next/server';
import { getCachedArticles } from '@/services/article-cache';
import { generateStories } from '@/services/story-clusterer';
import { fetchPolymarketEvents, matchStoriesWithMarkets } from '@/services/polymarket';
import { buildAlphaTweet } from '@/services/twitter-bot';

export const runtime = 'nodejs';
export const maxDuration = 60;

let cache: { data: any; ts: number } | null = null;
const TTL = 10 * 60 * 1000;

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json(cache.data);
  }

  try {
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

    // All matches sorted by alpha
    const sorted = [...matches].sort((a, b) => b.alphaScore - a.alphaScore);
    const top = sorted.find(m => m.alphaScore >= 30 && Math.abs(m.delta) >= 10);

    const previews = sorted.slice(0, 5).map(m => {
      const match = {
        topic: m.topic, signalLikelihood: m.signalLikelihood,
        marketProbability: m.marketProbability, delta: m.delta,
        alphaScore: m.alphaScore, alphaDirection: m.alphaDirection,
        whyDifferent: m.whyDifferent, polymarketTitle: m.polymarketTitle,
        polymarketUrl: m.polymarketUrl, volume: m.volume, topicCategory: m.topicCategory,
      };
      const text = buildAlphaTweet(match);
      return { topic: m.topic, alphaScore: m.alphaScore, delta: m.delta, charCount: text.length, text };
    });

    let todaysTweet = null;
    if (top) {
      const match = {
        topic: top.topic, signalLikelihood: top.signalLikelihood,
        marketProbability: top.marketProbability, delta: top.delta,
        alphaScore: top.alphaScore, alphaDirection: top.alphaDirection,
        whyDifferent: top.whyDifferent, polymarketTitle: top.polymarketTitle,
        polymarketUrl: top.polymarketUrl, volume: top.volume, topicCategory: top.topicCategory,
      };
      const text = buildAlphaTweet(match);
      todaysTweet = { text, charCount: text.length, match };
    }

    const result = {
      todaysTweet,
      allPreviews: previews,
      totalMatches: matches.length,
      twitterConfigured: !!(
        process.env.TWITTER_API_KEY &&
        process.env.TWITTER_API_SECRET &&
        process.env.TWITTER_ACCESS_TOKEN &&
        process.env.TWITTER_ACCESS_TOKEN_SECRET
      ),
    };

    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
