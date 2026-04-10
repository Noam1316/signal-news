/**
 * GET /api/stories
 * Generates dynamic BriefStory objects from live RSS articles.
 * Falls back to static stories if RSS fetch fails.
 * Cache: 15 minutes
 */

import { NextResponse } from 'next/server';
import { generateStories } from '@/services/story-clusterer';
import { getCachedArticles } from '@/services/article-cache';
import { preAnalyzeWithGroq, isGroqEnabled, warmGroqFromKV } from '@/services/groq-analyzer';
import type { BriefStory } from '@/lib/types';

let cache: { stories: BriefStory[]; timestamp: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export async function GET() {
  // Return cached if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json({
      stories: cache.stories,
      source: 'cache',
      generatedAt: new Date(cache.timestamp).toISOString(),
    });
  }

  try {
    // Get latest articles from shared cache
    const articles = (await getCachedArticles()).slice(0, 400);

    if (!articles || articles.length < 5) {
      throw new Error('Not enough articles for clustering');
    }

    // ── Groq: warm L1 from KV (results stored by warm-cache cron on another instance) ──
    // Then pre-analyze any articles not yet in cache (first run / new articles)
    await warmGroqFromKV(articles.map(a => a.id)).catch(() => {});
    if (isGroqEnabled()) {
      await preAnalyzeWithGroq(articles).catch(err =>
        console.warn('[Stories] Groq pre-analysis failed, using keywords:', err?.message)
      );
    }

    // Generate stories from clusters (uses Groq results if available)
    const stories = generateStories(articles, 20);

    if (stories.length === 0) {
      throw new Error('No clusters formed');
    }

    cache = { stories, timestamp: Date.now() };

    return NextResponse.json({
      stories,
      source: 'live',
      articleCount: articles.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Stories] Generation failed, falling back to static:', error);

    // Fallback to static stories
    const { stories: staticStories } = await import('@/data/stories');
    // Convert StoryDetail[] to BriefStory[] (strip detail fields)
    const briefStories: BriefStory[] = staticStories.map((s) => ({
      slug: s.slug,
      headline: s.headline,
      summary: s.summary,
      likelihood: s.likelihood,
      likelihoodLabel: s.likelihoodLabel,
      delta: s.delta,
      why: s.why,
      isSignal: s.isSignal,
      category: s.category,
      lens: s.lens,
      sources: s.sources,
      updatedAt: s.updatedAt,
    }));

    return NextResponse.json({
      stories: briefStories,
      source: 'static-fallback',
      generatedAt: new Date().toISOString(),
    });
  }
}
