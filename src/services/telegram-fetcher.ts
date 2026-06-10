/**
 * Telegram Channel Fetcher
 * Scrapes public Telegram channel preview pages (t.me/s/{channel})
 * No API key required — these are publicly accessible HTML pages.
 */

import { createHash } from 'crypto';
import type { FetchedArticle } from './rss-fetcher';

interface TelegramSource {
  id: string;
  name: string;
  channel: string; // Telegram @username without @
  language: 'he' | 'en';
  lensCategory: 'il-mainstream' | 'il-independent';
  // 'il-mainstream' = official news brand channels (Ynet, N12, Kan...)
  // 'il-independent' = journalists, analysts, non-institutional channels
}

// ── Mainstream news brand channels on Telegram ──
// These are the official Telegram presence of established outlets
const TELEGRAM_MAINSTREAM: TelegramSource[] = [
  { id: 'tg-ynet',     name: 'Ynet Telegram',    channel: 'ynetnews',      language: 'he', lensCategory: 'il-mainstream' },
  { id: 'tg-n12',      name: 'N12 Telegram',      channel: 'N12news',       language: 'he', lensCategory: 'il-mainstream' },
  { id: 'tg-kan',      name: 'כאן Telegram',      channel: 'kann_news',     language: 'he', lensCategory: 'il-mainstream' },
  { id: 'tg-walla',    name: 'Walla Telegram',    channel: 'wallanews',     language: 'he', lensCategory: 'il-mainstream' },
];

// ── Independent journalists & analysts on Telegram ──
// Opinionated, non-institutional, often break stories before mainstream
const TELEGRAM_INDEPENDENT: TelegramSource[] = [
  { id: 'tg-abuali',         name: 'אבו עלי אקספרס', channel: 'AbuAliExpress',   language: 'he', lensCategory: 'il-independent' },
  { id: 'tg-amitsegal',      name: 'עמית סגל',        channel: 'amitsegal',       language: 'he', lensCategory: 'il-independent' },
  { id: 'tg-politicalarena', name: 'זירה פוליטית',    channel: 'Political_arena', language: 'he', lensCategory: 'il-independent' },
  { id: 'tg-iltoday',        name: 'Israel Today TG', channel: 'ILtoday',         language: 'en', lensCategory: 'il-independent' },
];

export const TELEGRAM_SOURCES: TelegramSource[] = [
  ...TELEGRAM_MAINSTREAM,
  ...TELEGRAM_INDEPENDENT,
];

function hashStr(s: string): string {
  return createHash('sha256').update(s).digest('hex').slice(0, 16);
}

/**
 * Parse a raw Telegram message text into a clean string.
 * Removes HTML tags, trims, collapses whitespace.
 */
function cleanHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetch and parse a single Telegram channel preview page.
 * Returns up to 10 recent messages as FetchedArticle objects.
 */
export async function fetchTelegramChannel(src: TelegramSource): Promise<FetchedArticle[]> {
  const url = `https://t.me/s/${src.channel}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(7000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  const articles: FetchedArticle[] = [];
  const now = new Date().toISOString();

  // Each message is wrapped in <div class="tgme_widget_message_wrap ...">
  // The text is inside <div class="tgme_widget_message_text ...">
  // The timestamp is inside <time class="time" datetime="...">
  // The link is <a class="tgme_widget_message_date" href="...">

  const messageRe = /<div class="tgme_widget_message_wrap[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
  const textRe = /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/;
  const timeRe = /<time[^>]+datetime="([^"]+)"/;
  const linkRe = /href="(https:\/\/t\.me\/[^"]+\/\d+)"/;

  let match;
  let count = 0;
  while ((match = messageRe.exec(html)) !== null && count < 10) {
    const block = match[1];
    const textMatch = textRe.exec(block);
    const timeMatch = timeRe.exec(block);
    const linkMatch = linkRe.exec(block);

    if (!textMatch) continue;

    const rawText = cleanHtml(textMatch[1]);
    if (rawText.length < 15) continue; // skip very short posts (forwarded headers, etc.)

    const pubDate = timeMatch?.[1] ?? now;
    const link = linkMatch?.[1] ?? url;
    const id = hashStr(link + rawText.slice(0, 30));

    // Use first sentence as title, rest as description
    const sentences = rawText.split(/[.!?।\n]/);
    const title = sentences[0].trim().slice(0, 200);
    const description = sentences.slice(1).join('. ').trim().slice(0, 500);

    articles.push({
      id,
      sourceId: src.id,
      sourceName: src.name,
      lensCategory: src.lensCategory,
      language: src.language,
      title,
      description,
      link,
      pubDate,
      fetchedAt: now,
    });
    count++;
  }

  return articles;
}

/**
 * Fetch all Telegram channels — silently ignores failures.
 */
export async function fetchAllTelegramSources(): Promise<FetchedArticle[]> {
  const results = await Promise.allSettled(
    TELEGRAM_SOURCES.map(src => fetchTelegramChannel(src))
  );

  const articles: FetchedArticle[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      articles.push(...result.value);
    }
  }
  return articles;
}
