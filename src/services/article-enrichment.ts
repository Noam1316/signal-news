/**
 * Article Enrichment Cache
 * Stores full article text received from n8n webhooks.
 * In-memory LRU cache — max 500 articles.
 */

export interface EnrichedArticle {
  articleId: string;
  sourceId: string;
  fullText: string;
  extractedAt: string;
  receivedAt: string;
}

export interface EnrichmentStats {
  totalEnriched: number;
  maxCapacity: number;
  oldestEntry: string | null;
  newestEntry: string | null;
}

const MAX_CACHE_SIZE = 500;

// LRU cache: Map preserves insertion order, we delete oldest when full
const enrichmentCache = new Map<string, EnrichedArticle>();

/**
 * Store enriched article data from n8n webhook
 */
export function storeEnrichment(data: {
  articleId: string;
  sourceId: string;
  fullText: string;
}): EnrichedArticle {
  // LRU eviction: remove oldest if at capacity
  if (enrichmentCache.size >= MAX_CACHE_SIZE && !enrichmentCache.has(data.articleId)) {
    const oldestKey = enrichmentCache.keys().next().value;
    if (oldestKey) enrichmentCache.delete(oldestKey);
  }

  // If already exists, delete first to update insertion order
  if (enrichmentCache.has(data.articleId)) {
    enrichmentCache.delete(data.articleId);
  }

  const enriched: EnrichedArticle = {
    articleId: data.articleId,
    sourceId: data.sourceId,
    fullText: data.fullText,
    extractedAt: new Date().toISOString(),
    receivedAt: new Date().toISOString(),
  };

  enrichmentCache.set(data.articleId, enriched);
  return enriched;
}

/**
 * Get enriched data for an article (if available)
 */
export function getEnrichment(articleId: string): EnrichedArticle | null {
  return enrichmentCache.get(articleId) || null;
}

/**
 * Check if an article has been enriched
 */
export function hasEnrichment(articleId: string): boolean {
  return enrichmentCache.has(articleId);
}

/**
 * Get enrichment cache statistics
 */
export function getEnrichmentStats(): EnrichmentStats {
  const entries = Array.from(enrichmentCache.values());
  return {
    totalEnriched: enrichmentCache.size,
    maxCapacity: MAX_CACHE_SIZE,
    oldestEntry: entries.length > 0 ? entries[0].receivedAt : null,
    newestEntry: entries.length > 0 ? entries[entries.length - 1].receivedAt : null,
  };
}

/**
 * Store multiple enrichments at once (batch from n8n)
 */
export function storeBatchEnrichment(
  items: Array<{ articleId: string; sourceId: string; fullText: string }>
): number {
  let stored = 0;
  for (const item of items) {
    if (item.articleId && item.fullText) {
      storeEnrichment(item);
      stored++;
    }
  }
  return stored;
}
