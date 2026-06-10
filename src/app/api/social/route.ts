import { NextResponse } from 'next/server';
import { getCachedArticles } from '@/services/article-cache';
import { generateStories } from '@/services/story-clusterer';
import { analyzeArticles } from '@/services/ai-analyzer';

// ── Types ────────────────────────────────────────────────────────────────────

export interface RedditPost {
  id: string;
  title: string;
  url: string;
  permalink: string;
  subreddit: string;
  score: number;
  num_comments: number;
  created_utc: number;
  matchedStorySlug?: string;
  matchScore: number;
}

export interface TrendItem {
  title: string;
  traffic: string; // e.g. "50K+"
  relatedQuery?: string;
}

export interface StoryBuzz {
  slug: string;
  totalScore: number;   // sum of upvotes across matched posts
  postCount: number;
  topPost?: RedditPost;
}

export interface SocialData {
  posts: RedditPost[];
  trends: TrendItem[];
  storyBuzz: StoryBuzz[];
  fetchedAt: string;
  source: 'live' | 'error';
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .filter(w => !STOP_WORDS.has(w));
}

const STOP_WORDS = new Set([
  'that', 'this', 'with', 'from', 'they', 'have', 'been', 'will', 'were',
  'their', 'about', 'after', 'over', 'into', 'more', 'what', 'when', 'than',
  'said', 'says', 'also', 'first', 'would', 'could', 'should', 'there',
  'which', 'some', 'such', 'even', 'your', 'amid', 'amid', 'amid',
]);

function matchScore(postTitle: string, storyHeadline: string, storyCategory: string): number {
  const postKw = new Set(extractKeywords(postTitle));
  const storyKw = extractKeywords(storyHeadline + ' ' + storyCategory);
  let hits = 0;
  for (const kw of storyKw) {
    if (postKw.has(kw)) hits++;
  }
  return storyKw.length > 0 ? hits / storyKw.length : 0;
}

// ── Reddit fetcher ────────────────────────────────────────────────────────────

const SUBREDDITS = ['worldnews', 'geopolitics', 'israel', 'middleeast'];

async function fetchRedditPosts(): Promise<RedditPost[]> {
  const results: RedditPost[] = [];

  await Promise.allSettled(
    SUBREDDITS.map(async (sub) => {
      try {
        const res = await fetch(
          `https://www.reddit.com/r/${sub}/top.json?t=day&limit=20&raw_json=1`,
          {
            headers: { 'User-Agent': 'zikuk-intel/1.0 (signal news aggregator)' },
            signal: AbortSignal.timeout(5000),
          }
        );
        if (!res.ok) return;
        const data = await res.json() as { data?: { children?: Array<{ data: any }> } };
        const children = data?.data?.children ?? [];
        for (const child of children) {
          const p = child.data;
          if (!p.title || p.score < 50) continue; // skip low-signal posts
          results.push({
            id: p.id,
            title: p.title,
            url: p.url,
            permalink: `https://reddit.com${p.permalink}`,
            subreddit: p.subreddit,
            score: p.score,
            num_comments: p.num_comments,
            created_utc: p.created_utc,
            matchScore: 0,
          });
        }
      } catch {
        // silent fail per subreddit
      }
    })
  );

  // Deduplicate by title (same story on multiple subreddits)
  const seen = new Set<string>();
  return results.filter(p => {
    const key = p.title.slice(0, 60).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Google Trends RSS (Israel) ────────────────────────────────────────────────

async function fetchGoogleTrends(): Promise<TrendItem[]> {
  try {
    const res = await fetch(
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=IL',
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return [];
    const xml = await res.text();

    const items: TrendItem[] = [];
    const titleRe = /<title><!\[CDATA\[([^\]]+)\]\]><\/title>/g;
    const trafficRe = /<ht:approx_traffic>([^<]+)<\/ht:approx_traffic>/g;

    const titles: string[] = [];
    const traffics: string[] = [];

    let m;
    while ((m = titleRe.exec(xml)) !== null) {
      if (m[1] !== 'Daily Search Trends') titles.push(m[1]);
    }
    while ((m = trafficRe.exec(xml)) !== null) {
      traffics.push(m[1]);
    }

    for (let i = 0; i < Math.min(titles.length, 10); i++) {
      items.push({ title: titles[i], traffic: traffics[i] ?? '' });
    }
    return items;
  } catch {
    return [];
  }
}

// ── Cache ─────────────────────────────────────────────────────────────────────

let cache: { data: SocialData; ts: number } | null = null;
const TTL = 5 * 60 * 1000; // 5 min

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const [posts, trends, articles] = await Promise.all([
      fetchRedditPosts(),
      fetchGoogleTrends(),
      getCachedArticles(),
    ]);

    // Build story slugs + headlines for matching
    const sliced = articles.slice(0, 200);
    const stories = generateStories(sliced);
    const analyses = analyzeArticles(sliced);
    void analyses; // not needed here

    // Match each Reddit post to the best story
    const MATCH_THRESHOLD = 0.12;
    for (const post of posts) {
      let bestSlug = '';
      let bestScore = 0;
      for (const story of stories) {
        const headline = typeof story.headline === 'string'
          ? story.headline
          : story.headline.en || story.headline.he || '';
        const category = typeof story.category === 'string'
          ? story.category
          : story.category?.en || story.category?.he || '';
        const score = matchScore(post.title, headline, category);
        if (score > bestScore) { bestScore = score; bestSlug = story.slug; }
      }
      post.matchScore = bestScore;
      if (bestScore >= MATCH_THRESHOLD) post.matchedStorySlug = bestSlug;
    }

    // Compute per-story buzz
    const buzzMap = new Map<string, StoryBuzz>();
    for (const post of posts) {
      if (!post.matchedStorySlug) continue;
      const slug = post.matchedStorySlug;
      const existing = buzzMap.get(slug);
      if (!existing) {
        buzzMap.set(slug, { slug, totalScore: post.score, postCount: 1, topPost: post });
      } else {
        existing.totalScore += post.score;
        existing.postCount += 1;
        if (post.score > (existing.topPost?.score ?? 0)) existing.topPost = post;
      }
    }

    const storyBuzz = [...buzzMap.values()].sort((a, b) => b.totalScore - a.totalScore);

    const result: SocialData = {
      posts: posts.sort((a, b) => b.score - a.score).slice(0, 60),
      trends,
      storyBuzz,
      fetchedAt: new Date().toISOString(),
      source: 'live',
    };

    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (err) {
    console.error('Social route error:', err);
    return NextResponse.json({ posts: [], trends: [], storyBuzz: [], source: 'error', fetchedAt: new Date().toISOString() });
  }
}
