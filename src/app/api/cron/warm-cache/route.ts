/**
 * GET /api/cron/warm-cache
 * Pre-warms the article cache every hour so users never hit a cold start.
 * Also pre-runs story generation to warm the stories cache.
 * Protected by CRON_SECRET.
 * Also warms Groq KV cache for cross-instance availability.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCachedArticles } from '@/services/article-cache';
import { generateStories } from '@/services/story-clusterer';
import { preAnalyzeWithGroq, isGroqEnabled } from '@/services/groq-analyzer';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();

  try {
    // 1. Refresh article cache
    const articles = await getCachedArticles();

    // 2. Pre-analyze with Groq if enabled
    if (isGroqEnabled()) {
      await preAnalyzeWithGroq(articles).catch(err =>
        console.warn('[warm-cache] Groq pre-analysis failed:', err?.message)
      );
    }

    // 3. Generate stories (warms the stories cache)
    const stories = generateStories(articles, 20);

    const elapsed = Date.now() - start;
    console.log(`[warm-cache] Done in ${elapsed}ms — ${articles.length} articles, ${stories.length} stories`);

    return NextResponse.json({
      ok: true,
      articles: articles.length,
      stories: stories.length,
      elapsed,
    });
  } catch (error) {
    console.error('[warm-cache] Failed:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
