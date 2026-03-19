import { NextResponse } from 'next/server';
import { getCachedArticles } from '@/services/article-cache';
import { generateStories } from '@/services/story-clusterer';
import { generateCredibilityReport, type CredibilityReport } from '@/services/credibility-engine';
import { classifyArticle } from '@/services/classifier';

let cache: { data: any; ts: number } | null = null;
const TTL = 10 * 60 * 1000;

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const articles = await getCachedArticles();
    const recent = articles.slice(0, 200);

    // Generate stories for topic grouping
    const stories = generateStories(recent);

    // Generate credibility reports for each story
    const reports: CredibilityReport[] = stories.map(story => {
      const headline = typeof story.headline === 'string'
        ? story.headline
        : story.headline.en || story.headline.he || '';

      // Find articles matching this story's topic
      const storyArticles = recent
        .filter(a => {
          const classified = classifyArticle(a);
          return classified.topics.some(t =>
            headline.toLowerCase().includes(t.toLowerCase()) ||
            t.toLowerCase().includes(story.slug)
          );
        })
        .slice(0, 20)
        .map(a => {
          const classified = classifyArticle(a);
          return {
            sourceId: a.sourceId,
            title: a.title,
            pubDate: a.pubDate,
            sentiment: classified.sentiment,
            topics: classified.topics,
            signalScore: classified.signalScore,
          };
        });

      // If no matches, use the first few articles as a fallback
      const articlesToUse = storyArticles.length >= 2
        ? storyArticles
        : recent.slice(0, 5).map(a => {
            const classified = classifyArticle(a);
            return {
              sourceId: a.sourceId,
              title: a.title,
              pubDate: a.pubDate,
              sentiment: classified.sentiment,
              topics: classified.topics,
              signalScore: classified.signalScore,
            };
          });

      return generateCredibilityReport(
        headline,
        articlesToUse,
        story.likelihood
      );
    });

    // Summary stats
    const avgCredibility = reports.length > 0
      ? Math.round(reports.reduce((s, r) => s + r.overallScore, 0) / reports.length)
      : 0;

    const gradeDistribution: Record<string, number> = {};
    for (const r of reports) {
      gradeDistribution[r.overallGrade] = (gradeDistribution[r.overallGrade] || 0) + 1;
    }

    const totalContradictions = reports.reduce((s, r) => s + r.contradictions.length, 0);
    const insufficientData = reports.filter(r => r.uncertaintyLevel === 'insufficient').length;

    const result = {
      reports,
      summary: {
        totalTopics: reports.length,
        avgCredibility,
        gradeDistribution,
        totalContradictions,
        topicsWithInsufficientData: insufficientData,
        reliableTopics: reports.filter(r => r.isReliable).length,
      },
      analyzedAt: new Date().toISOString(),
    };

    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (err) {
    console.error('Credibility route error:', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
