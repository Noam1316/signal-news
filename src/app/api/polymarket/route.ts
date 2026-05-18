import { NextResponse } from 'next/server';
import { fetchPolymarketEvents, matchStoriesWithMarkets } from '@/services/polymarket';
import { getCachedArticles } from '@/services/article-cache';
import { generateStories } from '@/services/story-clusterer';
import { analyzeArticles } from '@/services/ai-analyzer';
import { savePredictionSnapshots } from '@/services/prediction-tracker';
import { computeEarlyMovers } from '@/services/signal-intelligence';
import { isGroqEnabled } from '@/services/groq-analyzer';

/**
 * Use Groq to generate a specific, news-grounded explanation for a Signal vs Market gap.
 * Returns null if Groq is unavailable or times out.
 */
async function groqWhyDifferent(
  storyHeadline: string,
  storySummary: string,
  marketQuestion: string,
  signalPct: number,
  marketPct: number,
  direction: 'signal-higher' | 'market-higher' | 'aligned',
): Promise<string | null> {
  if (!isGroqEnabled()) return null;
  try {
    const delta = Math.abs(signalPct - marketPct);
    const dirHe = direction === 'signal-higher'
      ? `Signal מעריך סיכוי גבוה יותר (${signalPct}%) מהשוק (${marketPct}%)`
      : `השוק מעריך סיכוי גבוה יותר (${marketPct}%) מ-Signal (${signalPct}%)`;

    const prompt = `אתה אנליסט מודיעין גיאופוליטי. הסבר בעברית, ב-2-3 משפטים תמציתיים, מדוע קיים פער של ${delta}% בין Signal לשוק הניבוי.

נושא הסיפור: ${storyHeadline}
תקציר: ${storySummary}
שאלת השוק: ${marketQuestion}
${dirHe}

כתוב הסבר ספציפי הקושר בין תוכן הסיפור לפער. אל תשתמש בניסוחים גנריים. התחל ישירות עם התוכן.`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 180,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return null;
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text && text.length > 20 ? text : null;
  } catch {
    return null;
  }
}

let cache: { data: any; ts: number } | null = null;
const TTL = 3 * 60 * 1000; // 3 min

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
        headline: typeof s.headline === 'string' ? s.headline : s.headline.he || s.headline.en || '',
        likelihood: s.likelihood,
        category: typeof s.category === 'string' ? s.category : (s.category?.en ?? s.category?.he ?? ''),
        sourceCount: s.sources?.length || 3,
        sources: s.sources.map(src => ({ name: src.name })),
        sentiment: dominantSentiment,
      };
    });

    const matches = matchStoriesWithMarkets(storyData, markets, earlyMovers);

    // Enrich top matches with Groq-generated explanations (non-aligned only, top 4 by alpha)
    if (isGroqEnabled() && matches.length > 0) {
      const storyMap = new Map(stories.map(s => [s.slug, s]));
      const topToEnrich = [...matches]
        .filter(m => m.alphaDirection !== 'aligned')
        .sort((a, b) => b.alphaScore - a.alphaScore)
        .slice(0, 4);

      await Promise.allSettled(topToEnrich.map(async (match) => {
        const story = storyMap.get(match.topic);
        const headlineHe = story
          ? (typeof story.headline === 'string' ? story.headline : story.headline.he || '')
          : match.topic;
        const summaryHe = story
          ? (typeof story.summary === 'string' ? story.summary : story.summary?.he || '')
          : '';

        const groqExplanation = await groqWhyDifferent(
          headlineHe,
          summaryHe,
          match.polymarketTitle,
          match.signalLikelihood,
          match.marketProbability,
          match.alphaDirection,
        );

        if (groqExplanation) {
          match.whyDifferent = groqExplanation;
        }
      }));
    }

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
