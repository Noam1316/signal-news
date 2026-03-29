/**
 * Built-in Article Scraper
 * Fetches full article text directly from source URLs.
 * Runs as a background task after article cache refreshes.
 * No n8n dependency — works standalone on Vercel.
 *
 * Rate-limited: scrapes up to 10 articles per batch, only unseen articles.
 */

import { storeEnrichment, hasEnrichment } from './article-enrichment';

const BATCH_SIZE = 10;
const FETCH_TIMEOUT = 8000; // 8 seconds per article
const MIN_TEXT_LENGTH = 150; // ignore pages with barely any content
const MAX_TEXT_LENGTH = 50000; // 50KB cap

// Track recently attempted URLs to avoid retrying failures
const recentlyAttempted = new Set<string>();
const MAX_ATTEMPTED = 500;

/**
 * Extract readable text from HTML, removing scripts/styles/nav/boilerplate.
 */
function extractText(html: string): string {
  return html
    // Remove scripts, styles, nav, header, footer, aside
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    // Remove all HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, MAX_TEXT_LENGTH);
}

/**
 * Scrape full text for a batch of articles.
 * Only scrapes articles not already enriched or recently attempted.
 */
export async function scrapeArticles(
  articles: Array<{ id: string; sourceId: string; link: string }>
): Promise<{ scraped: number; enriched: number; errors: number }> {
  // Filter to unseen, unenriched articles
  const toScrape = articles.filter(a => {
    if (!a.link) return false;
    if (hasEnrichment(a.id)) return false;
    if (recentlyAttempted.has(a.id)) return false;
    return true;
  }).slice(0, BATCH_SIZE);

  if (toScrape.length === 0) return { scraped: 0, enriched: 0, errors: 0 };

  let enriched = 0;
  let errors = 0;

  // Scrape in parallel with concurrency limit
  const results = await Promise.allSettled(
    toScrape.map(async (article) => {
      // Mark as attempted
      recentlyAttempted.add(article.id);
      if (recentlyAttempted.size > MAX_ATTEMPTED) {
        const oldest = recentlyAttempted.values().next().value;
        if (oldest) recentlyAttempted.delete(oldest);
      }

      const res = await fetch(article.link, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SignalNewsBot/1.0)',
          'Accept': 'text/html',
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const html = await res.text();
      const text = extractText(html);

      if (text.length < MIN_TEXT_LENGTH) return null;

      storeEnrichment({
        articleId: article.id,
        sourceId: article.sourceId,
        fullText: text,
      });

      return article.id;
    })
  );

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) enriched++;
    else if (r.status === 'rejected') errors++;
  }

  return { scraped: toScrape.length, enriched, errors };
}
