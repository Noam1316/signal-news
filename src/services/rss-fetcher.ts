import Parser from 'rss-parser';
import { createHash } from 'crypto';
import { rssSources, RssSource } from './rss-sources';

export interface FetchedArticle {
  id: string;
  sourceId: string;
  sourceName: string;
  lensCategory: string;
  language: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  fetchedAt: string;
}

const parser = new Parser({
  timeout: 15_000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; SignalNews/1.0; +https://signal-news.vercel.app)',
    Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml',
  },
});

function hashUrl(url: string): string {
  return createHash('sha256').update(url).digest('hex').slice(0, 16);
}

export async function fetchFromSource(source: RssSource): Promise<FetchedArticle[]> {
  const feed = await parser.parseURL(source.url);
  const now = new Date().toISOString();

  const items = (feed.items || []).slice(0, 20);

  return items
    .filter((item) => item.link)
    .map((item) => ({
      id: hashUrl(item.link!),
      sourceId: source.id,
      sourceName: source.name,
      lensCategory: source.lensCategory,
      language: source.language,
      title: item.title || '',
      description: item.contentSnippet || item.content || item.summary || '',
      link: item.link!,
      pubDate: item.pubDate || item.isoDate || '',
      fetchedAt: now,
    }));
}

export async function fetchAllSources(): Promise<{
  articles: FetchedArticle[];
  errors: { sourceId: string; error: string }[];
}> {
  const results = await Promise.allSettled(
    rssSources.map(async (source) => ({
      source,
      articles: await fetchFromSource(source),
    }))
  );

  const articles: FetchedArticle[] = [];
  const errors: { sourceId: string; error: string }[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') {
      articles.push(...result.value.articles);
    } else {
      errors.push({
        sourceId: rssSources[i].id,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
      console.error(`[RSS] Failed to fetch ${rssSources[i].id}:`, result.reason);
    }
  }

  return { articles, errors };
}

export function deduplicateArticles(articles: FetchedArticle[]): FetchedArticle[] {
  const seen = new Set<string>();
  return articles.filter((article) => {
    if (seen.has(article.id)) return false;
    seen.add(article.id);
    return true;
  });
}
