/**
 * Shared article cache — Vercel KV with in-memory fallback
 * KV is used in production (shared across all serverless instances).
 * Falls back to module-level memory when KV env vars are not set.
 */

import { fetchAllSources, deduplicateArticles, type FetchedArticle } from './rss-fetcher';
import { scrapeArticles } from './article-scraper';

const CACHE_TTL_MS = 15 * 60 * 1000;  // 15 minutes — fresh window
const STALE_TTL_MS = 60 * 60 * 1000;  // 1 hour  — serve stale, refresh in bg
const KV_KEY = 'signal:articles';
const KV_TTL_S = 3600; // 1 hour in KV

// In-memory fallback (single instance, works in dev)
let memCache: { articles: FetchedArticle[]; timestamp: number } | null = null;

// In-flight fetch deduplication — prevents cache stampede
let pendingFetch: Promise<FetchedArticle[]> | null = null;

// Try to get Vercel KV — only if env vars are set
async function kvGet<T>(key: string): Promise<T | null> {
  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
    const { kv } = await import('@vercel/kv');
    return await kv.get<T>(key);
  } catch { return null; }
}

async function kvSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return;
    const { kv } = await import('@vercel/kv');
    await kv.set(key, value, { ex: ttlSeconds });
  } catch { /* silent — fall through to memory */ }
}

async function refreshCache(): Promise<FetchedArticle[]> {
  const { articles } = await fetchAllSources();
  const deduped = deduplicateArticles(articles);
  deduped.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });
  const entry = { articles: deduped, timestamp: Date.now() };
  memCache = entry;
  await kvSet(KV_KEY, entry, KV_TTL_S);
  scrapeArticles(
    deduped.slice(0, 20).map(a => ({ id: a.id, sourceId: a.sourceId, link: a.link }))
  ).catch(() => {});
  return deduped;
}

export async function getCachedArticles(): Promise<FetchedArticle[]> {
  const now = Date.now();

  // 1. Memory cache — still fresh (< 15min)
  if (memCache && now - memCache.timestamp < CACHE_TTL_MS) {
    return memCache.articles;
  }

  // 2. KV — still fresh
  const kvCached = await kvGet<{ articles: FetchedArticle[]; timestamp: number }>(KV_KEY);
  if (kvCached && now - kvCached.timestamp < CACHE_TTL_MS) {
    memCache = kvCached;
    return kvCached.articles;
  }

  // 3. Stale-while-revalidate: if data is old but within 1h, return it immediately
  //    and kick off a background refresh so the NEXT request is fast.
  const staleData = memCache ?? kvCached ?? null;
  if (staleData && now - staleData.timestamp < STALE_TTL_MS) {
    memCache = staleData; // keep serving
    if (!pendingFetch) {
      // Background refresh — do NOT await
      pendingFetch = refreshCache().finally(() => { pendingFetch = null; });
    }
    return staleData.articles;
  }

  // 4. No usable cache — must fetch synchronously (cold start)
  if (pendingFetch) return pendingFetch;
  pendingFetch = refreshCache().finally(() => { pendingFetch = null; });
  return pendingFetch;
}

export function getCacheTimestamp(): string | null {
  return memCache ? new Date(memCache.timestamp).toISOString() : null;
}
