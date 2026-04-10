/**
 * GET /api/cron/save-snapshots
 * Triggered daily at 08:30 Israel time (06:30 UTC).
 * Fetches current Signal vs Market state and saves prediction snapshots to KV.
 * This ensures track record data accumulates even on days with no user traffic.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCachedArticles } from '@/services/article-cache';
import { generateStories } from '@/services/story-clusterer';
import { fetchPolymarketEvents, matchStoriesWithMarkets } from '@/services/polymarket';
import { savePredictionSnapshots, getPendingCount } from '@/services/prediction-tracker';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch current state
    const articles = await getCachedArticles();
    const stories = generateStories(articles, 10);
    const markets = await fetchPolymarketEvents();

    if (markets.length === 0) {
      return NextResponse.json({ ok: true, saved: 0, reason: 'No Polymarket data available' });
    }

    // Match stories with markets — flatten LocalizedText to string
    const flatStories = stories.map(s => ({
      ...s,
      headline: typeof s.headline === 'string' ? s.headline : (s.headline.en || s.headline.he),
      category: typeof s.category === 'string' ? s.category : (s.category.en || s.category.he),
    }));
    const matches = matchStoriesWithMarkets(flatStories, markets, []);

    // Save snapshots (only new ones — function deduplicates by slug)
    await savePredictionSnapshots(matches);

    const pending = await getPendingCount();
    const today = new Date().toISOString().slice(0, 10);

    return NextResponse.json({
      ok: true,
      saved: matches.length,
      pending,
      date: today,
      topMatches: matches.slice(0, 3).map(m => ({
        topic: m.topic,
        signal: m.signalLikelihood,
        market: m.marketProbability,
        alpha: m.alphaScore,
      })),
    });
  } catch (err) {
    console.error('[save-snapshots] error:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
