/**
 * GET /api/cron/daily-brief
 * Triggered by Vercel Cron at 07:00 Israel time (05:00 UTC).
 * Sends daily brief email to all subscribers via Gmail SMTP.
 * Protected by CRON_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllSubscribers } from '@/services/subscriber-store';
import { getCachedArticles } from '@/services/article-cache';
import { generateStories } from '@/services/story-clusterer';
import { detectShocks } from '@/services/shock-detector';
import { fetchPolymarketEvents, matchStoriesWithMarkets, getTopAlpha } from '@/services/polymarket';
import { sendMail, isMailerConfigured } from '@/lib/mailer';
import { getResend, FROM_EMAIL } from '@/lib/resend';
import { buildDailyBriefEmail } from '@/lib/email-templates';

export async function GET(req: NextRequest) {
  // Auth check — only enforce if CRON_SECRET is configured
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resend = getResend();
  const gmailOk = isMailerConfigured();
  if (!resend && !gmailOk) {
    return NextResponse.json({ ok: false, reason: 'No email provider configured (set RESEND_API_KEY or GMAIL_USER+GMAIL_APP_PASSWORD)' });
  }

  // Fetch fresh data
  let stories, shocks, topAlpha = null;
  try {
    const articles = await getCachedArticles();
    stories = generateStories(articles, 5);
    shocks = detectShocks(articles);
    // Polymarket alpha
    const markets = await fetchPolymarketEvents();
    const storiesForMatch = stories.map(s => ({
      slug: s.slug,
      headline: typeof s.headline === 'string' ? s.headline : s.headline.he,
      likelihood: s.likelihood,
      category: typeof s.category === 'string' ? s.category : s.category.he,
      sourceCount: Array.isArray(s.sources) ? s.sources.length : 3,
    }));
    const matches = matchStoriesWithMarkets(storiesForMatch, markets);
    topAlpha = getTopAlpha(matches);
  } catch {
    const { stories: s } = await import('@/data/stories');
    const { shocks: sh } = await import('@/data/shocks');
    stories = s;
    shocks = sh;
  }

  const subscribers = await getAllSubscribers();
  const dailySubs = subscribers.filter(s => s.dailyBrief);

  const results = await Promise.allSettled(
    dailySubs.map(async (sub) => {
      const { subject, html } = buildDailyBriefEmail({
        stories,
        shocks,
        topAlpha,
        unsubToken: sub.token,
        email: sub.email,
      });

      const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://signal-news-noam1316s-projects.vercel.app';
      const unsubscribeUrl = `${BASE}/api/unsubscribe?token=${sub.token}&email=${encodeURIComponent(sub.email)}`;

      // Prefer Gmail SMTP (sends to everyone), fall back to Resend
      if (gmailOk) {
        await sendMail({ to: sub.email, subject, html, unsubscribeUrl });
      } else if (resend) {
        await resend.emails.send({
          from: `זיקוק <${FROM_EMAIL}>`,
          to: sub.email,
          subject,
          html,
          headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` },
        });
      }

      return sub.email;
    })
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  // Log any failures
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`[cron/daily-brief] Failed to send to ${dailySubs[i]?.email}:`, r.reason);
    }
  });

  console.log(`[cron/daily-brief] Sent: ${sent}, Failed: ${failed}, Total: ${dailySubs.length}, Provider: ${gmailOk ? 'gmail' : 'resend'}, GmailUser: ${process.env.GMAIL_USER ?? 'NOT_SET'}`);

  return NextResponse.json({ ok: true, sent, failed, total: dailySubs.length, provider: gmailOk ? 'gmail' : 'resend' });
}
