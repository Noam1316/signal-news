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

const parser = new Parser({ timeout: 15_000 });

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
};

// Fix common XML issues: bare & and invalid control characters
function sanitizeXml(xml: string): string {
  return xml
    .replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-fA-F]+);)/g, '&amp;')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
}

function hashUrl(url: string): string {
  return createHash('sha256').update(url).digest('hex').slice(0, 16);
}

function mapItems(
  feed: Parser.Output<Record<string, unknown>>,
  source: RssSource,
  now: string,
): FetchedArticle[] {
  return (feed.items || [])
    .slice(0, 50)
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

export async function fetchFromSource(source: RssSource): Promise<FetchedArticle[]> {
  const now = new Date().toISOString();
  const res = await fetch(source.url, {
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Status code ${res.status}`);
  const text = await res.text();
  const feed = await parser.parseString(sanitizeXml(text));
  return mapItems(feed, source, now);
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
