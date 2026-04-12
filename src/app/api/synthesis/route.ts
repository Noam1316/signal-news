import { NextResponse } from 'next/server';
import { getCachedArticles } from '@/services/article-cache';
import { generateStories } from '@/services/story-clusterer';
import { detectShocks } from '@/services/shock-detector';
import { generateSynthesis } from '@/services/ai-synthesis';
import { fetchMarketData } from '@/services/market-data';
import { warmGroqFromKV, isGroqEnabled, preAnalyzeWithGroq } from '@/services/groq-analyzer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const articles = (await getCachedArticles()).slice(0, 400);
    if (!articles.length) {
      return NextResponse.json({ error: 'No articles' }, { status: 503 });
    }

    // Warm Groq cache (same pattern as stories route)
    await warmGroqFromKV(articles.map(a => a.id)).catch(() => {});
    if (isGroqEnabled()) {
      await preAnalyzeWithGroq(articles).catch(() => {});
    }

    const stories = generateStories(articles, 20);
    const shocks = detectShocks(articles);
    const markets = await fetchMarketData().catch(() => []);

    const synthesis = await generateSynthesis(stories, shocks, markets);
    return NextResponse.json(synthesis);
  } catch (err) {
    console.error('[synthesis]', err);
    return NextResponse.json({ error: 'Synthesis failed' }, { status: 500 });
  }
}
