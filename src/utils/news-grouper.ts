/**
 * News Grouper — Ground News-style article clustering
 * Groups FetchedArticle[] by title keyword similarity (Jaccard index).
 * No API needed — pure keyword matching.
 */

import type { FetchedArticle } from '@/services/rss-fetcher';

// ─── Stopwords ────────────────────────────────────────────────────────────────

const EN_STOPWORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by',
  'from','as','is','was','are','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','that','this',
  'it','its','says','said','over','after','before','about','into','up','out',
  'new','us','he','she','they','we','not','no','s','after','amid','as','its',
]);

const HE_STOPWORDS = new Set([
  'של','עם','על','כי','את','הם','הן','הוא','היא','זה','זו','אבל','כן','לא',
  'גם','כבר','עוד','רק','אחרי','לפני','בין','אל','מן','ב','ל','מ','ו','ה',
  'כ','ש','אחד','שני','כל','יש','אין','מה','מי','הכי','מאוד','כך','אם',
  'כדי','כדיאי', 'עד','מול','ביחס','לפי','בגלל','בשל','בעוד',
]);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GroupedArticle {
  id: string;
  articles: FetchedArticle[];  // all articles covering this story
  primaryArticle: FetchedArticle;  // "lead" — the best article to show first
  sharedKeywords: string[];  // keywords shared across ≥2 sources
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\u0590-\u05FF\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !EN_STOPWORDS.has(w) && !HE_STOPWORDS.has(w))
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersect = 0;
  a.forEach(x => { if (b.has(x)) intersect++; });
  return intersect / (a.size + b.size - intersect);
}

/** Union-Find: finds root of a node */
function find(parent: number[], i: number): number {
  if (parent[i] !== i) parent[i] = find(parent, parent[i]);
  return parent[i];
}

function union(parent: number[], rank: number[], a: number, b: number): void {
  const ra = find(parent, a);
  const rb = find(parent, b);
  if (ra === rb) return;
  if (rank[ra] < rank[rb]) parent[ra] = rb;
  else if (rank[ra] > rank[rb]) parent[rb] = ra;
  else { parent[rb] = ra; rank[ra]++; }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Groups articles by title keyword similarity (Jaccard ≥ threshold).
 * Returns only groups with ≥ minSources unique sources.
 *
 * @param articles  Array of FetchedArticle
 * @param threshold Jaccard similarity threshold (default 0.2)
 * @param minSources Minimum unique sources per group (default 2)
 */
export function groupArticles(
  articles: FetchedArticle[],
  threshold = 0.2,
  minSources = 2,
): GroupedArticle[] {
  if (articles.length === 0) return [];

  // Pre-compute token sets
  const tokens = articles.map(a => tokenize(a.title + ' ' + (a.description ?? '')));

  // Union-Find initialisation
  const parent = articles.map((_, i) => i);
  const rank = new Array(articles.length).fill(0);

  // Pair-wise similarity → merge if above threshold
  for (let i = 0; i < articles.length - 1; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      if (jaccard(tokens[i], tokens[j]) >= threshold) {
        union(parent, rank, i, j);
      }
    }
  }

  // Collect groups
  const groupMap = new Map<number, number[]>();
  articles.forEach((_, i) => {
    const root = find(parent, i);
    if (!groupMap.has(root)) groupMap.set(root, []);
    groupMap.get(root)!.push(i);
  });

  const result: GroupedArticle[] = [];

  groupMap.forEach((indices, root) => {
    const groupArticles = indices.map(i => articles[i]);

    // Unique sources check
    const uniqueSources = new Set(groupArticles.map(a => a.sourceName));
    if (uniqueSources.size < minSources) return;

    // Shared keywords: words that appear in ≥2 articles
    const wordCounts = new Map<string, number>();
    indices.forEach(i => {
      tokens[i].forEach(w => wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1));
    });
    const sharedKeywords = [...wordCounts.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([w]) => w);

    // Primary article: from the source with most unique articles in the group,
    // or simply the first (most recent)
    const primaryArticle = groupArticles[0];

    result.push({
      id: `group-${root}-${articles[root].id}`,
      articles: groupArticles,
      primaryArticle,
      sharedKeywords,
    });
  });

  // Sort by group size desc
  return result.sort((a, b) => b.articles.length - a.articles.length);
}
