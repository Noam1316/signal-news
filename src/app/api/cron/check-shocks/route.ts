/**
 * GET /api/cron/check-shocks
 * Triggered every 2 hours by Vercel Cron.
 * If a HIGH-confidence shock is detected that wasn't sent yet — emails all subscribers immediately.
 * This is the "Breaking News" alert system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCachedArticles } from '@/services/article-cache';
import { detectShocks } from '@/services/shock-detector';
import { getAllSubscribers } from '@/services/subscriber-store';
import { sendMail, isMailerConfigured } from '@/lib/mailer';
import { getResend, FROM_EMAIL, SITE_URL } from '@/lib/resend';

export const runtime = 'nodejs';

// In-memory dedup: store shock IDs already alerted in this server instance
// (Works across invocations within the same warm lambda, resets on cold start)
const alertedShockIds = new Set<string>();

function buildShockAlertEmail(shockTitle: string, shockSummary: string, confidence: string, siteUrl: string, unsubUrl: string): string {
  const confColor = confidence === 'high' ? '#ef4444' : '#f59e0b';
  const confLabel = confidence === 'high' ? '🔴 זעזוע קריטי' : '🟡 זעזוע מתפתח';

  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;padding:24px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- Header -->
      <tr><td style="background:#111827;padding:16px 24px;border-radius:12px 12px 0 0;border-bottom:1px solid #1e293b;">
        <table width="100%"><tr>
          <td><span style="font-size:20px;font-weight:900;color:#facc15;">⚡ Zikuk</span></td>
          <td align="left"><span style="font-size:11px;color:#ef4444;font-weight:700;background:#7f1d1d;padding:3px 8px;border-radius:20px;">🚨 התראת זעזוע</span></td>
        </tr></table>
      </td></tr>

      <!-- Alert body -->
      <tr><td style="background:#111827;padding:24px;border-radius:0 0 12px 12px;border:1px solid #1e293b;border-top:none;">

        <!-- Confidence badge -->
        <div style="margin-bottom:16px;">
          <span style="font-size:12px;font-weight:700;color:${confColor};background:${confColor}22;padding:4px 12px;border-radius:20px;border:1px solid ${confColor}44;">
            ${confLabel}
          </span>
        </div>

        <!-- Title -->
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:900;color:#f8fafc;line-height:1.3;">
          ${shockTitle}
        </h1>

        <!-- Summary -->
        <p style="margin:0 0 20px;font-size:14px;color:#94a3b8;line-height:1.7;">
          ${shockSummary}
        </p>

        <!-- CTA -->
        <a href="${siteUrl}/dashboard#shocks"
           style="display:inline-block;padding:12px 28px;background:#facc15;color:#0a0f1e;font-weight:900;font-size:14px;border-radius:8px;text-decoration:none;">
          ← פתח דשבורד מלא
        </a>

        <!-- Footer -->
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #1e293b;font-size:11px;color:#475569;text-align:center;">
          קיבלת את ההתראה הזו כי נרשמת ל-Zikuk Intelligence.
          <a href="${unsubUrl}" style="color:#64748b;margin-right:8px;">הסרה מרשימת תפוצה</a>
        </div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`.trim();
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const gmailOk = isMailerConfigured();
  const resend = getResend();
  if (!gmailOk && !resend) {
    return NextResponse.json({ ok: false, reason: 'No email provider configured' });
  }

  try {
    // Get current articles and detect shocks
    const articles = await getCachedArticles();
    const shocks = await detectShocks(articles);

    // Filter to only HIGH confidence shocks not yet alerted
    const newHighShocks = shocks.filter(s =>
      s.confidence === 'high' && !alertedShockIds.has(s.id ?? s.headline)
    );

    if (newHighShocks.length === 0) {
      return NextResponse.json({ ok: true, alerted: 0, checked: shocks.length });
    }

    // Get subscribers with shock alerts enabled
    const allSubs = await getAllSubscribers();
    const targets = allSubs.filter(s => s.watchlistAlerts !== false);

    if (targets.length === 0) {
      return NextResponse.json({ ok: true, alerted: 0, reason: 'No alert subscribers' });
    }

    let alerted = 0;
    // Send for the top shock only (avoid flooding)
    const shock = newHighShocks[0];
    const shockId = shock.id ?? shock.headline;

    const headlineStr = typeof shock.headline === 'string' ? shock.headline : (shock.headline?.he ?? shock.headline?.en ?? 'זעזוע חדש');
    const subject = `🚨 זיקוק | זעזוע: ${headlineStr}`;

    for (const sub of targets) {
      const unsubUrl = `${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(sub.email)}`;
      const html = buildShockAlertEmail(
        headlineStr,
        `זוהה זעזוע חדש עם ביטחון גבוה. כנס לדשבורד לפרטים מלאים.`,
        shock.confidence,
        SITE_URL,
        unsubUrl
      );

      try {
        if (gmailOk) {
          await sendMail({ to: sub.email, subject, html, unsubscribeUrl: unsubUrl });
        } else if (resend) {
          await resend.emails.send({
            from: `זיקוק <${FROM_EMAIL}>`,
            to: sub.email,
            subject,
            html,
            headers: { 'List-Unsubscribe': `<${unsubUrl}>` },
          });
        }
        alerted++;
      } catch (err) {
        console.error(`[check-shocks] failed to send to ${sub.email}:`, err);
      }
    }

    // Mark shock as alerted
    alertedShockIds.add(shockId);

    return NextResponse.json({ ok: true, alerted, shockHeadline: headlineStr, subscribers: targets.length });

  } catch (err) {
    console.error('[check-shocks] error:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
