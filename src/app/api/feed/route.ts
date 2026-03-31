import { NextResponse } from 'next/server';
import { generateStories } from '@/services/story-clusterer';
import { getCachedArticles } from '@/services/article-cache';
import type { BriefStory } from '@/lib/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://signal-news-noam1316s-projects.vercel.app';
const FEED_TITLE = 'Signal News — Geopolitical Intelligence Feed';
const FEED_DESC  = 'Real-time geopolitical signals, shock events, and prediction market analysis. Powered by keyword-based AI analysis of 28+ RSS sources.';

function escapeXml(str: string): string {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

function likelihoodLabel(n: number): string {
  if (n >= 70) return '🟢 High';
  if (n >= 45) return '🟡 Medium';
  return '🔴 Low';
}

export async function GET() {
  try {
    const articles = await getCachedArticles();
    const stories  = generateStories(articles, 30);

    // Top 20 stories by likelihood × signal weight
    const top: BriefStory[] = stories
      .map((s: BriefStory) => ({ ...s, score: s.likelihood * (s.isSignal ? 1.3 : 1) }))
      .sort((a: BriefStory & { score: number }, b: BriefStory & { score: number }) => b.score - a.score)
      .slice(0, 20);

    const now = new Date().toUTCString();

    const items = top.map((story: BriefStory) => {
      const headlineEn = typeof story.headline === 'string'
        ? story.headline
        : (story.headline as any)?.en || (story.headline as any)?.he || 'Signal Story';

      const summaryEn = typeof story.summary === 'string'
        ? story.summary
        : (story.summary as any)?.en || (story.summary as any)?.he || '';

      const categoryEn = typeof story.category === 'string'
        ? story.category
        : (story.category as any)?.en || 'General';

      const storyUrl = `${SITE_URL}/story/${story.slug}`;
      const pubDate  = story.updatedAt ? new Date(story.updatedAt).toUTCString() : now;

      const signalTag  = story.isSignal ? '[⚡ SIGNAL] ' : '';
      const likelihood = `${likelihoodLabel(story.likelihood)} (${story.likelihood}%)`;
      const srcCount   = story.sources?.length ?? 0;

      const description = [
        summaryEn,
        `\nLikelihood: ${likelihood}`,
        `Sources: ${srcCount}`,
        story.isSignal ? '⚡ Flagged as a statistical signal anomaly.' : '',
      ].filter(Boolean).join(' · ');

      return `    <item>
      <title>${escapeXml(signalTag + headlineEn)}</title>
      <link>${escapeXml(storyUrl)}</link>
      <guid isPermaLink="true">${escapeXml(storyUrl)}</guid>
      <description>${escapeXml(description)}</description>
      <category>${escapeXml(categoryEn)}</category>
      <pubDate>${pubDate}</pubDate>
      <source url="${escapeXml(SITE_URL + '/api/feed')}">Signal News</source>
    </item>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>${escapeXml(FEED_DESC)}</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
    <ttl>15</ttl>
    <atom:link href="${escapeXml(SITE_URL + '/api/feed')}" rel="self" type="application/rss+xml" />
    <image>
      <url>${escapeXml(SITE_URL + '/favicon.ico')}</url>
      <title>${escapeXml(FEED_TITLE)}</title>
      <link>${escapeXml(SITE_URL)}</link>
    </image>
${items}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
