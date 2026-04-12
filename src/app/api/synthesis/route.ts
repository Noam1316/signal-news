import { NextRequest, NextResponse } from 'next/server';
import { generateSynthesis } from '@/services/ai-synthesis';
import type { BriefStory, ShockEvent } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — used by crons (fetches its own articles)
export async function GET() {
  try {
    const { getCachedArticles } = await import('@/services/article-cache');
    const { generateStories } = await import('@/services/story-clusterer');
    const { detectShocks } = await import('@/services/shock-detector');

    const articles = (await getCachedArticles()).slice(0, 200);
    if (!articles.length) return NextResponse.json({ error: 'No articles' }, { status: 503 });

    const stories = generateStories(articles, 12);
    const shocks = detectShocks(articles);
    const synthesis = await generateSynthesis(stories, shocks, []);
    return NextResponse.json(synthesis);
  } catch (err) {
    console.error('[synthesis GET]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST — client sends stories + shocks, we just call Groq (fast, no RSS fetch)
export async function POST(req: NextRequest) {
  try {
    const { stories, shocks } = await req.json() as {
      stories: BriefStory[];
      shocks?: ShockEvent[];
    };
    if (!stories?.length) return NextResponse.json({ error: 'No stories' }, { status: 400 });

    const synthesis = await generateSynthesis(stories, shocks ?? [], []);
    return NextResponse.json(synthesis);
  } catch (err) {
    console.error('[synthesis POST]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
