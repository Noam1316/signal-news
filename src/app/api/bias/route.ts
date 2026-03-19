import { NextResponse } from 'next/server';
import { getCachedArticles } from '@/services/article-cache';
import { detectCoverageGaps, detectNarrativeDivergence, getSourceBias, SOURCE_BIAS_DB } from '@/services/media-bias';
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

    // Classify and enrich articles
    const enriched = recent.map(a => {
      const classified = classifyArticle(a);
      return {
        sourceId: a.sourceId,
        title: a.title,
        sentiment: classified.sentiment,
        topics: classified.topics,
      };
    });

    // Analyze
    const coverageGaps = detectCoverageGaps(enriched);
    const narrativeDivergence = detectNarrativeDivergence(enriched);

    // Source bias distribution
    const biasDistribution: Record<string, number> = {};
    const factualDistribution: Record<string, number> = {};
    let mapped = 0;

    for (const a of recent) {
      const bias = getSourceBias(a.sourceId);
      if (bias) {
        mapped++;
        biasDistribution[bias.bias] = (biasDistribution[bias.bias] || 0) + 1;
        factualDistribution[bias.factual] = (factualDistribution[bias.factual] || 0) + 1;
      }
    }

    const result = {
      coverageGaps,
      narrativeDivergence,
      biasDistribution,
      factualDistribution,
      sourcesInDb: Object.keys(SOURCE_BIAS_DB).length,
      mappedArticles: mapped,
      totalArticles: recent.length,
      analyzedAt: new Date().toISOString(),
    };

    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (err) {
    console.error('Bias route error:', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
