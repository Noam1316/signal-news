/**
 * Groq LLM Analyzer
 * Replaces keyword-based analysis with LLM understanding when GROQ_API_KEY is set.
 * Falls back to keyword analysis seamlessly when API is unavailable.
 *
 * Model: llama-3.3-70b-versatile (free, 6000 req/day on Groq)
 * Strategy: batch 8 articles per call → ~750 calls/day for 200 articles per cycle
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

// In-memory cache: articleId → result
const _groqCache = new Map<string, GroqArticleResult>();

export function getGroqResult(articleId: string): GroqArticleResult | null {
  return _groqCache.get(articleId) ?? null;
}

export function isGroqEnabled(): boolean {
  return !!process.env.GROQ_API_KEY;
}

/**
 * Pre-analyze a batch of articles with Groq.
 * Results are stored in the module-level cache.
 * Only analyzes articles not already cached.
 * Called from /api/stories before generateStories().
 */
export async function preAnalyzeWithGroq(articles: FetchedArticle[]): Promise<void> {
  if (!isGroqEnabled()) return;

  // Only analyze articles not yet cached
  const uncached = articles.filter(a => !_groqCache.has(a.id));
  if (uncached.length === 0) return;

  // Prioritize: take up to 80 articles (those with descriptions, skip very short ones)
  const toAnalyze = uncached
    .filter(a => a.description && a.description.length > 30)
    .slice(0, 120);

  // Process in batches of 8
  const BATCH_SIZE = 8;
  for (let i = 0; i < toAnalyze.length; i += BATCH_SIZE) {
    const batch = toAnalyze.slice(i, i + BATCH_SIZE);
    try {
      const results = await analyzeBatch(batch);
      for (const result of results) {
        _groqCache.set(result.articleId, result);
      }
    } catch (err) {
      // Batch failed — continue with remaining batches
      console.warn('[Groq] Batch failed:', err instanceof Error ? err.message : err);
    }
    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < toAnalyze.length) {
      await new Promise(r => setTimeout(r, 100));
    }
  }
}

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

  // Parse — Groq sometimes returns { "articles": [...] } or just [...]
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
      // Validate topics — only keep known ones
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
