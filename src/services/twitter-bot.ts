/**
 * Twitter Bot Service — Signal News Daily Alpha Tweet
 *
 * Posts once per day with the top Signal vs Market divergence.
 * When a prediction resolves correctly, auto quote-tweets "Called it ✅".
 *
 * Required env vars (Vercel → Settings → Environment Variables):
 *   TWITTER_API_KEY              — App API Key (Consumer Key)
 *   TWITTER_API_SECRET           — App API Secret (Consumer Secret)
 *   TWITTER_ACCESS_TOKEN         — Account Access Token
 *   TWITTER_ACCESS_TOKEN_SECRET  — Account Access Token Secret
 */

import { TwitterApi } from 'twitter-api-v2';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://signal-news-noam1316s-projects.vercel.app';

// ── Client ────────────────────────────────────────────────────────────────────

function getClient(): TwitterApi | null {
  const { TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET } = process.env;
  if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_TOKEN_SECRET) {
    return null;
  }
  return new TwitterApi({
    appKey:            TWITTER_API_KEY,
    appSecret:         TWITTER_API_SECRET,
    accessToken:       TWITTER_ACCESS_TOKEN,
    accessSecret:      TWITTER_ACCESS_TOKEN_SECRET,
  });
}

// ── Tweet formatters ──────────────────────────────────────────────────────────

interface AlphaMatch {
  topic: string;
  signalLikelihood: number;
  marketProbability: number;
  delta: number;
  alphaScore: number;
  alphaDirection: 'signal-higher' | 'market-higher' | 'aligned';
  whyDifferent: string;
  polymarketTitle: string;
  polymarketUrl: string;
  volume: number;
  topicCategory: string;
}

/** Truncate string to maxLen, appending ellipsis if needed */
function trunc(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 1) + '…';
}

/** Format volume as $XM / $XK */
function fmtVol(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

/** Category → hashtags */
const CATEGORY_TAGS: Record<string, string> = {
  'Middle East':  '#MiddleEast #geopolitics',
  'Iran':         '#Iran #geopolitics',
  'Ukraine':      '#Ukraine #geopolitics',
  'US Politics':  '#USpolitics #geopolitics',
  'China':        '#China #geopolitics',
  'Energy':       '#energy #oilprice',
  'Tech':         '#tech #geopolitics',
  'Security':     '#security #defense',
  'Economy':      '#economy #markets',
};

function getTags(category: string): string {
  return CATEGORY_TAGS[category] ?? '#geopolitics';
}

/**
 * Build the daily alpha tweet (≤280 chars).
 *
 * Format:
 * ⚡ Signal vs Market — [Topic]
 *
 * 📊 Signal: X% · Market: Y%
 * Δ +Zpts · Alpha: W/100 · Vol: $XM
 *
 * [Why different — truncated]
 *
 * 🔗 signal-news.../dashboard
 * #geopolitics #Polymarket
 */
export function buildAlphaTweet(match: AlphaMatch): string {
  const dir    = match.alphaDirection === 'signal-higher' ? '▲ Signal higher' : '▼ Signal lower';
  const sign   = match.delta > 0 ? '+' : '';
  const vol    = match.volume > 0 ? ` · Vol: ${fmtVol(match.volume)}` : '';
  const tags   = `${getTags(match.topicCategory)} #Polymarket`;
  const url    = `${SITE_URL}/dashboard`;

  // Build in sections, measure, truncate `why` to fit
  const header = `⚡ Signal vs Market\n\n`;
  const topic  = `${trunc(match.topic || match.polymarketTitle, 60)}\n\n`;
  const stats  = `📊 Signal: ${match.signalLikelihood}% · Market: ${match.marketProbability}%\n${dir} · Δ ${sign}${match.delta}pts · Alpha: ${match.alphaScore}/100${vol}\n\n`;
  const footer = `\n🔗 ${url}\n${tags}`;

  const fixedLen = header.length + topic.length + stats.length + footer.length;
  const whyBudget = 280 - fixedLen;
  const why = whyBudget > 20 ? trunc(match.whyDifferent || '', whyBudget) : '';

  return `${header}${topic}${stats}${why}${footer}`;
}

/**
 * Build a "called it" quote tweet when a prediction resolves correctly.
 */
export function buildCalledItTweet(match: AlphaMatch, resolvedAt: string): string {
  const date = new Date(resolvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `✅ Called it.\n\nSignal predicted ${match.topic} at ${match.signalLikelihood}% vs Market's ${match.marketProbability}% — resolved in our favor on ${date}.\n\nAlpha gap: ${match.delta}pts 📈\n\n${SITE_URL}/dashboard\n#Polymarket #geopolitics`;
}

// ── Main actions ──────────────────────────────────────────────────────────────

export interface TweetResult {
  success: boolean;
  tweetId?: string;
  text?: string;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

/**
 * Post the daily alpha tweet.
 * Returns { success, tweetId, text } on success.
 * Returns { skipped: true, reason } if credentials missing or alpha too low.
 */
export async function postDailyAlpha(match: AlphaMatch): Promise<TweetResult> {
  // Minimum quality gate — don't tweet noise
  if (match.alphaScore < 30 || Math.abs(match.delta) < 10) {
    return { success: false, skipped: true, reason: `Alpha too low (${match.alphaScore}, Δ${match.delta})` };
  }

  const client = getClient();
  if (!client) {
    return { success: false, skipped: true, reason: 'Twitter credentials not configured' };
  }

  const text = buildAlphaTweet(match);

  try {
    const rwClient = client.readWrite;
    const res = await rwClient.v2.tweet(text);
    return { success: true, tweetId: res.data.id, text };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Post a "Called it" quote tweet for a resolved prediction.
 */
export async function postCalledIt(match: AlphaMatch, resolvedAt: string, originalTweetId: string): Promise<TweetResult> {
  const client = getClient();
  if (!client) {
    return { success: false, skipped: true, reason: 'Twitter credentials not configured' };
  }

  const text = buildCalledItTweet(match, resolvedAt);

  try {
    const rwClient = client.readWrite;
    // Quote tweet the original prediction
    const res = await rwClient.v2.tweet({ text, quote_tweet_id: originalTweetId });
    return { success: true, tweetId: res.data.id, text };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
