/**
 * Groq LLM Analyzer
 * Replaces keyword-based analysis with LLM understanding when GROQ_API_KEY is set.
 * Falls back to keyword analysis seamlessly when API is unavailable.
 *
 * Model: llama-3.3-70b-versatile (free, 6000 req/day on Groq)
 * Strategy: batch 8 articles per call → ~750 calls/day for 200 articles per cycle
 *
 * Cache: L1 in-memory Map (fast, per-instance) + L2 Vercel KV (shared across all instances)
 * This ensures warm-cache results are visible to /api/analyze on any serverless instance.
 */

import type { FetchedArticle } from './rss-fetcher';

export interface GroqArticleResult {
  articleId: string;
  topics: string[];          // primary topic first, from VALID_TOPICS list
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  isSignal: boolean;         // is this a breaking/significant development?
  signalScore: number;       // 0-100
  politicalLean: 'left' | 'center' | 'right' | 'none';
  summaryHe: string;         // 1-sentence Hebrew summary
  summaryEn: string;         // 1-sentence English summary
  entities: string[];        // key named entities (people, countries, orgs)
}

// All valid topics — must match TOPIC_CATEGORIES in story-clusterer.ts
const VALID_TOPICS = [
  'Iran Nuclear', 'Gaza Conflict', 'Lebanon/Hezbollah', 'Saudi Normalization',
  'US Politics', 'China', 'West Bank', 'Syria', 'Economy', 'Technology',
  'Climate', 'Ukraine/Russia', 'Turkey/Egypt', 'Judicial Reform',
  'Security', 'Diplomacy', 'Sports', 'General',
];

const KV_PREFIX = 'groq:article:';
const KV_TTL_S = 7200; // 2 hours — matches article lifecycle

// L1: in-memory cache (fast, per-instance)
const _memCache = new Map<string, GroqArticleResult>();

// ── KV helpers (same pattern as article-cache.ts) ─────────────────────────────

async function kvGet(articleId: string): Promise<GroqArticleResult | null> {
  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
    const { kv } = await import('@vercel/kv');
    return await kv.get<GroqArticleResult>(`${KV_PREFIX}${articleId}`);
  } catch { return null; }
}

async function kvSet(result: GroqArticleResult): Promise<void> {
  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return;
    const { kv } = await import('@vercel/kv');
    await kv.set(`${KV_PREFIX}${result.articleId}`, result, { ex: KV_TTL_S });
  } catch { /* silent */ }
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function isGroqEnabled(): boolean {
  return !!process.env.GROQ_API_KEY;
}

/**
 * Synchronous L1-only lookup.
 * Always call warmGroqFromKV() before a batch of analyzeArticle() calls
 * to ensure L1 is populated from KV for this serverless instance.
 */
export function getGroqResult(articleId: string): GroqArticleResult | null {
  return _memCache.get(articleId) ?? null;
}

/**
 * Batch-warm L1 from KV for a list of article IDs.
 * Call this once per API request before running analyzeArticles().
 * Uses mget for efficiency (single round-trip to KV).
 */
export async function warmGroqFromKV(articleIds: string[]): Promise<void> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return;
  // Only fetch IDs not already in L1
  const missing = articleIds.filter(id => !_memCache.has(id));
  if (missing.length === 0) return;
  try {
    const { kv } = await import('@vercel/kv');
    const keys = missing.map(id => `${KV_PREFIX}${id}`);
    const results = await kv.mget<GroqArticleResult[]>(...keys);
    for (let i = 0; i < missing.length; i++) {
      const result = results[i];
      if (result) _memCache.set(missing[i], result);
    }
  } catch { /* silent — L1 stays empty, keyword fallback used */ }
}

/**
 * Pre-analyze a batch of articles with Groq.
 * Stores results in both L1 (memory) and L2 (KV) so all instances benefit.
 * Called from /api/cron/warm-cache before generateStories().
 */
export async function preAnalyzeWithGroq(articles: FetchedArticle[]): Promise<void> {
  if (!isGroqEnabled()) return;

  // Only analyze articles not already in L1
  // (KV check would be too slow for 200 articles here — warm-cache is the source of truth)
  const uncached = articles.filter(a => !_memCache.has(a.id));
  if (uncached.length === 0) return;

  // Prioritize articles with meaningful descriptions
  const toAnalyze = uncached
    .filter(a => a.description && a.description.length > 30)
    .slice(0, 120);

  const BATCH_SIZE = 8;
  for (let i = 0; i < toAnalyze.length; i += BATCH_SIZE) {
    const batch = toAnalyze.slice(i, i + BATCH_SIZE);
    try {
      const results = await analyzeBatch(batch);
      for (const result of results) {
        _memCache.set(result.articleId, result);
        // Fire-and-forget KV write — don't block the batch loop
        kvSet(result).catch(() => {});
      }
    } catch (err) {
      console.warn('[Groq] Batch failed:', err instanceof Error ? err.message : err);
    }
    if (i + BATCH_SIZE < toAnalyze.length) {
      await new Promise(r => setTimeout(r, 100));
    }
  }
}

// ── Batch analysis ─────────────────────────────────────────────────────────────

async function analyzeBatch(articles: FetchedArticle[]): Promise<GroqArticleResult[]> {
  const articlesJson = articles.map((a, idx) => ({
    idx,
    id: a.id,
    lang: a.language,
    title: a.title.slice(0, 200),
    desc: (a.description || '').slice(0, 300),
  }));

  const prompt = `You are a geopolitical intelligence analyst specializing in Israeli and Middle East affairs. Analyze these news articles and return a JSON array.

VALID_TOPICS: ${VALID_TOPICS.join(', ')}

SIGNAL SCORE CALIBRATION (critical — be precise):
- 80-100: Active military strike, ceasefire collapse, surprise attack, major hostage deal, nuclear breakthrough
- 60-79: Government falls, major diplomatic shift, significant escalation, large-scale military operation
- 40-59: Significant policy change, notable diplomatic development, major protest, important court ruling
- 20-39: Standard political news, ongoing conflict updates, economic data release, routine diplomacy
- 0-19: Corporate earnings, sports, celebrity news, technology product releases, routine government statements

isSignal = true ONLY if signalScore >= 55 AND the event is geopolitical/security/diplomatic in nature.
Technology company revenues, sports results, and entertainment are NEVER isSignal=true.

SUMMARY RULES:
- summaryHe: exactly 1 complete Hebrew sentence. State the KEY FACT (who did what, where, outcome). No vague phrases like "עדכונים על" or "מצב ב". Be specific.
- summaryEn: exactly 1 complete English sentence with the same key fact.
- Do NOT start summaries with "According to" or "Reports say" — state facts directly.

For each article return:
- articleId: (string, from input id)
- topics: array of matching topics from VALID_TOPICS, ordered by relevance (primary topic first, max 3)
- sentiment: "positive"|"negative"|"neutral"|"mixed"
- isSignal: true ONLY if signalScore >= 55 AND topic is geopolitical/security/diplomatic
- signalScore: 0-100 per calibration above
- politicalLean: "left"|"center"|"right"|"none" based on editorial framing
- summaryHe: 1 specific Hebrew sentence with the key fact
- summaryEn: 1 specific English sentence with the key fact
- entities: key named entities (people, countries, organizations, max 5)

Articles:
${JSON.stringify(articlesJson, null, 0)}

Return ONLY a valid JSON array, no markdown, no explanation.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '[]';

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Groq returned invalid JSON');
  }

  const arr: unknown[] = Array.isArray(parsed)
    ? parsed
    : (parsed as Record<string, unknown>).articles as unknown[] ??
      Object.values(parsed as Record<string, unknown>)[0] as unknown[] ?? [];

  return arr
    .filter((item): item is GroqArticleResult => {
      const r = item as GroqArticleResult;
      return typeof r.articleId === 'string' && Array.isArray(r.topics);
    })
    .map((item) => {
      const r = item as GroqArticleResult;
      const validatedTopics = (r.topics ?? [])
        .filter((t: string) => VALID_TOPICS.includes(t));
      return {
        ...r,
        topics: validatedTopics.length > 0 ? validatedTopics : ['General'],
        signalScore: Math.max(0, Math.min(100, r.signalScore ?? 30)),
        entities: r.entities ?? [],
        summaryHe: r.summaryHe ?? '',
        summaryEn: r.summaryEn ?? '',
      };
    });
}
