/**
 * HTML email templates for Signal News.
 * Hebrew RTL, minimal dark-style design.
 */

import type { BriefStory, ShockEvent } from '@/lib/types';
import { SITE_URL } from '@/lib/resend';

function getLikelihoodColor(pct: number): string {
  if (pct >= 70) return '#22c55e';
  if (pct >= 45) return '#f59e0b';
  return '#6b7280';
}

function storyRow(story: BriefStory, index: number): string {
  const headline = typeof story.headline === 'string'
    ? story.headline
    : (story.headline as { he?: string; en?: string }).he ?? (story.headline as { he?: string; en?: string }).en ?? '';
  const summary = typeof story.summary === 'string'
    ? story.summary
    : (story.summary as { he?: string; en?: string })?.he ?? '';
  const color = getLikelihoodColor(story.likelihood);

  return `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #1e293b;">
        <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">${index + 1} ·  ${story.sources ?? 0} מקורות</div>
        <div style="font-size: 16px; font-weight: 700; color: #f1f5f9; margin-bottom: 6px;">${headline}</div>
        <div style="font-size: 13px; color: #94a3b8; margin-bottom: 10px; line-height: 1.5;">${summary}</div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 22px; font-weight: 800; color: ${color};">${story.likelihood}%</span>
          <span style="font-size: 11px; color: #64748b;">סבירות</span>
          ${story.delta ? `<span style="font-size: 12px; color: ${story.delta > 0 ? '#22c55e' : '#ef4444'};">${story.delta > 0 ? '↑' : '↓'}${Math.abs(story.delta)}%</span>` : ''}
        </div>
        <div style="background:#0f172a; border-radius:4px; height:4px; margin-top:8px;">
          <div style="background:${color}; width:${story.likelihood}%; height:4px; border-radius:4px;"></div>
        </div>
      </td>
    </tr>
  `;
}

function shockRow(shock: ShockEvent): string {
  return `
    <tr>
      <td style="padding: 16px; background:#1e1b4b; border-radius:8px; margin-bottom:8px;">
        <div style="font-size:11px; color:#818cf8; font-weight:600; margin-bottom:4px;">⚡ זעזוע מזוהה</div>
        <div style="font-size:15px; font-weight:700; color:#f1f5f9;">${shock.headline}</div>
        ${shock.whatMoved ? `<div style="font-size:12px; color:#94a3b8; margin-top:4px;">${shock.whatMoved}</div>` : ''}
      </td>
    </tr>
  `;
}

export function buildDailyBriefEmail(opts: {
  stories: BriefStory[];
  shocks: ShockEvent[];
  unsubToken: string;
  email: string;
}): { subject: string; html: string } {
  const { stories, shocks, unsubToken, email } = opts;
  const top3 = stories.slice(0, 3);
  const topShock = shocks[0];
  const dateStr = new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const unsubUrl = `${SITE_URL}/api/unsubscribe?token=${unsubToken}&email=${encodeURIComponent(email)}`;

  const subject = `⚡ Signal Brief — ${dateStr}`;

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${subject}</title>
</head>
<body style="margin:0; padding:0; background:#0a0f1e; font-family: 'Segoe UI', Arial, sans-serif; direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e; padding: 32px 16px;">
    <tr>
      <td>
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom: 24px; border-bottom: 1px solid #1e293b; text-align:center;">
              <div style="font-size:13px; color:#6366f1; font-weight:700; letter-spacing:3px; text-transform:uppercase; margin-bottom:4px;">SIGNAL NEWS</div>
              <div style="font-size:24px; font-weight:800; color:#f1f5f9;">⚡ תקציר יומי</div>
              <div style="font-size:12px; color:#64748b; margin-top:4px;">${dateStr}</div>
            </td>
          </tr>

          <!-- Top Shock -->
          ${topShock ? `
          <tr>
            <td style="padding: 24px 0 8px;">
              <div style="font-size:12px; color:#818cf8; font-weight:700; margin-bottom:12px; text-transform:uppercase; letter-spacing:1px;">זעזוע מוביל</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${shockRow(topShock)}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Top Stories -->
          <tr>
            <td style="padding: 24px 0 8px;">
              <div style="font-size:12px; color:#22c55e; font-weight:700; margin-bottom:12px; text-transform:uppercase; letter-spacing:1px;">סיגנלים מובילים היום</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${top3.map((s, i) => storyRow(s, i)).join('')}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 24px 0; text-align:center;">
              <a href="${SITE_URL}/dashboard"
                 style="display:inline-block; background:#6366f1; color:#fff; padding:12px 32px; border-radius:8px; font-size:14px; font-weight:700; text-decoration:none;">
                פתח דשבורד מלא →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px; border-top:1px solid #1e293b; text-align:center;">
              <div style="font-size:11px; color:#475569; line-height:1.6;">
                קיבלת מייל זה כי נרשמת לתקציר היומי של Signal News.<br/>
                <a href="${unsubUrl}" style="color:#6366f1; text-decoration:none;">הסר אותי מהרשימה</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

export function buildWatchlistAlertEmail(opts: {
  topic: string;
  story: BriefStory;
  shock?: ShockEvent;
  unsubToken: string;
  email: string;
}): { subject: string; html: string } {
  const { topic, story, shock, unsubToken, email } = opts;
  const headline = typeof story.headline === 'string'
    ? story.headline
    : (story.headline as { he?: string; en?: string }).he ?? '';
  const unsubUrl = `${SITE_URL}/api/unsubscribe?token=${unsubToken}&email=${encodeURIComponent(email)}`;

  const subject = `🔔 Signal Alert — ${topic}: ${headline.slice(0, 60)}`;

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8" /><title>${subject}</title></head>
<body style="margin:0; padding:32px 16px; background:#0a0f1e; font-family: 'Segoe UI', Arial, sans-serif; direction:rtl;">
  <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto;">
    <tr>
      <td style="padding-bottom:16px; border-bottom:1px solid #1e293b;">
        <div style="font-size:13px; color:#6366f1; font-weight:700; letter-spacing:2px;">SIGNAL NEWS · התראה</div>
        <div style="font-size:12px; color:#64748b; margin-top:2px;">נושא עקוב: <strong style="color:#94a3b8;">${topic}</strong></div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${storyRow(story, 0)}
          ${shock ? shockRow(shock) : ''}
        </table>
      </td>
    </tr>
    <tr>
      <td style="text-align:center; padding:16px 0;">
        <a href="${SITE_URL}/dashboard"
           style="display:inline-block; background:#6366f1; color:#fff; padding:10px 28px; border-radius:8px; font-size:14px; font-weight:700; text-decoration:none;">
          צפה בדשבורד →
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding-top:16px; border-top:1px solid #1e293b; text-align:center;">
        <div style="font-size:11px; color:#475569;">
          <a href="${unsubUrl}" style="color:#6366f1; text-decoration:none;">הסר אותי מהרשימה</a>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}
