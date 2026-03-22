/**
 * Shared article cache — Vercel KV with in-memory fallback
 * KV is used in production (shared across all serverless instances).
 * Falls back to module-level memory when KV env vars are not set.
 */

import { fetchAllSources, deduplicateArticles, type FetchedArticle } from './rss-fetcher';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const KV_KEY = 'signal:articles';
const KV_TTL_S = 300; // 5 minutes in seconds

// In-memory fallback (single instance, works in dev)
let memCache: { articles: FetchedArticle[]; timestamp: number } | null = null;

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

export async function getCachedArticles(): Promise<FetchedArticle[]> {
  const now = Date.now();

  // 1. Try KV first
  const kvCached = await kvGet<{ articles: FetchedArticle[]; timestamp: number }>(KV_KEY);
  if (kvCached && now - kvCached.timestamp < CACHE_TTL_MS) {
    memCache = kvCached; // sync memory cache
    return kvCached.articles;
  }

  // 2. Fall back to memory cache
  if (memCache && now - memCache.timestamp < CACHE_TTL_MS) {
    return memCache.articles;
  }

  // 3. Fetch fresh
  const { articles } = await fetchAllSources();
  const deduped = deduplicateArticles(articles);
  deduped.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });

  const entry = { articles: deduped, timestamp: now };
  memCache = entry;
  await kvSet(KV_KEY, entry, KV_TTL_S);

  return deduped;
}

export function getCacheTimestamp(): string | null {
  return memCache ? new Date(memCache.timestamp).toISOString() : null;
}
