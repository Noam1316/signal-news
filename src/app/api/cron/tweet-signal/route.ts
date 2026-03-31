/**
 * Daily Signal vs Market tweet cron
 * Triggered by Vercel Cron at 09:00 UTC every day.
 *
 * What it does:
 *  1. Fetches top Polymarket matches from our analysis pipeline
 *  2. Picks the highest-alpha match (score ≥ 30, delta ≥ 10%)
 *  3. Posts a tweet via @SignalNewsBot
 *  4. Stores the tweet ID in Vercel KV so we can quote-tweet when resolved
 *
 * Protected by CRON_SECRET env var — Vercel sets this automatically.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCachedArticles } from '@/services/article-cache';
import { generateStories } from '@/services/story-clusterer';
import { fetchPolymarketEvents, matchStoriesWithMarkets } from '@/services/polymarket';
import { postDailyAlpha } from '@/services/twitter-bot';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Auth — Vercel sets Authorization: Bearer <CRON_SECRET> on cron requests
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Build stories from RSS cache
    const articles = await getCachedArticles();
    const stories  = generateStories(articles, 30);

    // 2. Fetch Polymarket markets
    const markets = await fetchPolymarketEvents();
    if (!markets.length) {
      return NextResponse.json({ skipped: true, reason: 'No Polymarket markets available' });
    }

    // 3. Match stories → markets, compute alpha
    const storyInputs = stories.map(s => ({
      slug:        s.slug,
      headline:    typeof s.headline === 'string' ? s.headline : (s.headline as any)?.en || '',
      likelihood:  s.likelihood,
      category:    typeof s.category === 'string' ? s.category : (s.category as any)?.en || '',
      sourceCount: s.sources?.length ?? 0,
    }));

    const matches = matchStoriesWithMarkets(storyInputs, markets);

    // 4. Pick best match
    const top = [...matches]
      .filter(m => m.alphaScore >= 30 && Math.abs(m.delta) >= 10)
      .sort((a, b) => b.alphaScore - a.alphaScore)[0];

    if (!top) {
      return NextResponse.json({ skipped: true, reason: 'No qualifying alpha match today' });
    }

    // 5. Post tweet
    const result = await postDailyAlpha({
      topic:             top.topic,
      signalLikelihood:  top.signalLikelihood,
      marketProbability: top.marketProbability,
      delta:             top.delta,
      alphaScore:        top.alphaScore,
      alphaDirection:    top.alphaDirection,
      whyDifferent:      top.whyDifferent,
      polymarketTitle:   top.polymarketTitle,
      polymarketUrl:     top.polymarketUrl,
      volume:            top.volume,
      topicCategory:     top.topicCategory,
    });

    // 6. Store tweet ID in KV for future "called it" quote tweets
    if (result.success && result.tweetId) {
      try {
        const { kv } = await import('@vercel/kv');
        const record = {
          tweetId:    result.tweetId,
          slug:       top.polymarketSlug,
          topic:      top.topic,
          signal:     top.signalLikelihood,
          market:     top.marketProbability,
          delta:      top.delta,
          alphaScore: top.alphaScore,
          postedAt:   new Date().toISOString(),
        };
        await kv.lpush('signal:tweeted-predictions', JSON.stringify(record));
        await kv.ltrim('signal:tweeted-predictions', 0, 99); // keep last 100
      } catch { /* KV optional — tweet still sent */ }
    }

    return NextResponse.json({
      success:   result.success,
      tweetId:   result.tweetId,
      text:      result.text,
      skipped:   result.skipped,
      reason:    result.reason,
      error:     result.error,
      match: {
        topic:      top.topic,
        alphaScore: top.alphaScore,
        delta:      top.delta,
      },
    });

  } catch (err: any) {
    console.error('[tweet-signal cron]', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
