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
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/** Returns true if text is predominantly Latin (English) */
const isEnglish = (t: string) => /^[a-zA-Z]/.test(t.trim());

/**
 * Translate a single English string to Hebrew via MyMemory free API.
 * No API key required. Falls back to original on any error.
 */
async function translateToHebrew(text: string): Promise<string> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|he`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return text;
    const data = await res.json() as { responseData?: { translatedText?: string }; responseStatus?: number };
    const translated = data?.responseData?.translatedText;
    if (translated && translated.length > 5 && data?.responseStatus === 200) return translated;
    return text;
  } catch {
    return text; // fallback: show English as-is
  }
}

/**
 * Post-process stories: translate English summary.he to Hebrew.
 * Only translates stories where summary.he is English text.
 * Results baked into the 5-min cache — translation runs once per window.
 */
async function translateEnglishSummaries(stories: BriefStory[]): Promise<BriefStory[]> {
  const toTranslate = stories.filter(s => s.summary?.he && isEnglish(s.summary.he));
  if (toTranslate.length === 0) return stories;

  const translated = await Promise.all(
    toTranslate.map(s => translateToHebrew(s.summary.he))
  );

  return stories.map(story => {
    const idx = toTranslate.indexOf(story);
    if (idx === -1) return story;
    return { ...story, summary: { ...story.summary, he: translated[idx] } };
  });
}

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
    const rawStories = generateStories(articles, 20);

    if (rawStories.length === 0) {
      throw new Error('No clusters formed');
    }

    // Translate English summaries to Hebrew using MyMemory free API (no key needed)
    const stories = await translateEnglishSummaries(rawStories);

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
