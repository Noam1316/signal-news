/**
 * GET /api/cron/daily-brief
 * Triggered by Vercel Cron at 07:00 Israel time (05:00 UTC).
 * Sends daily brief email to all subscribers.
 * Protected by CRON_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllSubscribers } from '@/services/subscriber-store';
import { getCachedArticles } from '@/services/article-cache';
import { generateStories } from '@/services/story-clusterer';
import { detectShocks } from '@/services/shock-detector';
import { getResend, FROM_EMAIL } from '@/lib/resend';
import { buildDailyBriefEmail } from '@/lib/email-templates';

export async function GET(req: NextRequest) {
  // Auth check
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resend = getResend();
  if (!resend) {
    return NextResponse.json({ ok: false, reason: 'RESEND_API_KEY not configured' });
  }

  // Fetch fresh data
  let stories, shocks;
  try {
    const articles = await getCachedArticles();
    stories = generateStories(articles, 5);
    shocks = detectShocks(articles);
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
        unsubToken: sub.token,
        email: sub.email,
      });

      await resend.emails.send({
        from: FROM_EMAIL,
        to: sub.email,
        subject,
        html,
      });

      return sub.email;
    })
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`[cron/daily-brief] Sent: ${sent}, Failed: ${failed}`);

  return NextResponse.json({ ok: true, sent, failed, total: dailySubs.length });
}
