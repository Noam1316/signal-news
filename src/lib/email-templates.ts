/**
 * HTML email templates for Signal News.
 * Hebrew RTL, professional intelligence brief design.
 * Full-page daily digest with executive summary, stories, shocks, statistics.
 */

import type { BriefStory, ShockEvent } from '@/lib/types';
import { SITE_URL } from '@/lib/resend';

/* ─── Helpers ─────────────────────────────────────────────────── */

function getLikelihoodColor(pct: number): string {
  if (pct >= 70) return '#22c55e';
  if (pct >= 45) return '#f59e0b';
  return '#6b7280';
}

function getLikelihoodLabel(pct: number): string {
  if (pct >= 70) return 'סבירות גבוהה';
  if (pct >= 45) return 'מגמה מתפתחת';
  return 'סיגנל חלש';
}

function getT(field: unknown): string {
  if (typeof field === 'string') return field;
  const obj = field as { he?: string; en?: string } | undefined;
  return obj?.he ?? obj?.en ?? '';
}

function getSourceCount(s: BriefStory): number {
  if (Array.isArray(s.sources)) return s.sources.length;
  return (s.sources as unknown as number) || 0;
}

function getSourceNames(s: BriefStory): string {
  if (!Array.isArray(s.sources)) return '';
  return s.sources.map(src => src.name).join(' · ');
}

/* ─── Story card (full detail) ────────────────────────────────── */

function fullStoryCard(story: BriefStory, index: number): string {
  const headline = getT(story.headline);
  const summary = getT(story.summary);
  const why = getT(story.why);
  const category = getT(story.category);
  const color = getLikelihoodColor(story.likelihood);
  const label = getLikelihoodLabel(story.likelihood);
  const srcCount = getSourceCount(story);
  const srcNames = getSourceNames(story);

  // Detailed analysis text based on data
  const analysisLines: string[] = [];

  // Likelihood assessment
  if (story.likelihood >= 70) {
    analysisLines.push(`הערכת סבירות: <strong style="color:${color}">${story.likelihood}%</strong> — סיפור זה מסווג כבעל סבירות גבוהה להתממשות. הכיסוי התקשורתי רחב ועקבי.`);
  } else if (story.likelihood >= 45) {
    analysisLines.push(`הערכת סבירות: <strong style="color:${color}">${story.likelihood}%</strong> — מגמה מתפתחת שטרם התגבשה. עדיין יש פערים בכיסוי — מומלץ לעקוב.`);
  } else {
    analysisLines.push(`הערכת סבירות: <strong style="color:${color}">${story.likelihood}%</strong> — סיגנל חלש. ייתכן שמדובר בספקולציה או דיווח מוקדם.`);
  }

  // Delta / trend
  if (story.delta && Math.abs(story.delta) >= 3) {
    const dir = story.delta > 0 ? 'עלייה' : 'ירידה';
    const arrow = story.delta > 0 ? '↑' : '↓';
    analysisLines.push(`מגמה: ${arrow} ${dir} של ${Math.abs(story.delta)}% ב-24 השעות האחרונות. ${story.delta > 0 ? 'הסיפור צובר תאוצה — מקורות נוספים מצטרפים לדיווח.' : 'הסיפור מאבד עניין או שהוכחש חלקית.'}`);
  }

  // Why it matters
  if (why) {
    analysisLines.push(`למה חשוב: ${why}`);
  }

  return `
    <tr>
      <td style="padding:0 0 24px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827; border-radius:12px; border:1px solid #1e293b; overflow:hidden;">
          <!-- Card header -->
          <tr>
            <td style="padding:16px 20px 12px; border-bottom:1px solid #1e293b;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:10px; color:#6366f1; font-weight:700; text-transform:uppercase; letter-spacing:2px;">${category}</span>
                  </td>
                  <td style="text-align:left;">
                    <span style="font-size:10px; background:${story.isSignal ? '#422006' : '#1e293b'}; color:${story.isSignal ? '#fbbf24' : '#64748b'}; padding:2px 8px; border-radius:10px; font-weight:600;">
                      ${story.isSignal ? '⚡ SIGNAL' : `#${index + 1}`}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Headline -->
          <tr>
            <td style="padding:16px 20px 8px;">
              <div style="font-size:18px; font-weight:800; color:#f1f5f9; line-height:1.4; margin-bottom:8px;">${headline}</div>
            </td>
          </tr>

          <!-- Summary -->
          <tr>
            <td style="padding:0 20px 12px;">
              <div style="font-size:14px; color:#cbd5e1; line-height:1.7;">${summary}</div>
            </td>
          </tr>

          <!-- Analysis section -->
          <tr>
            <td style="padding:0 20px 16px;">
              <div style="background:#0f172a; border-radius:8px; padding:14px 16px; border-right:3px solid ${color};">
                <div style="font-size:10px; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">🔍 ניתוח מודיעיני</div>
                ${analysisLines.map(line => `<div style="font-size:13px; color:#94a3b8; line-height:1.7; margin-bottom:6px;">${line}</div>`).join('')}
              </div>
            </td>
          </tr>

          <!-- Likelihood bar -->
          <tr>
            <td style="padding:0 20px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:60px;">
                    <div style="font-size:28px; font-weight:900; color:${color}; line-height:1;">${story.likelihood}%</div>
                    <div style="font-size:9px; color:#64748b; margin-top:2px;">${label}</div>
                  </td>
                  <td style="padding-right:12px; vertical-align:middle;">
                    <div style="background:#0f172a; border-radius:6px; height:8px; width:100%;">
                      <div style="background:${color}; width:${story.likelihood}%; height:8px; border-radius:6px;"></div>
                    </div>
                    ${story.delta ? `<div style="font-size:11px; color:${story.delta > 0 ? '#22c55e' : '#ef4444'}; margin-top:4px; font-weight:600;">${story.delta > 0 ? '▲' : '▼'} ${Math.abs(story.delta)}% מאתמול</div>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cross-sector impacts -->
          ${story.impacts && story.impacts.length > 0 ? `
          <tr>
            <td style="padding:0 20px 14px;">
              <div style="font-size:10px; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">🔗 השפעות צפויות</div>
              <div style="display:flex; flex-wrap:wrap; gap:6px;">
                ${story.impacts.map(impact => {
                  const bg = impact.direction === 'positive' ? '#052e16' : impact.direction === 'negative' ? '#2d0909' : '#1e293b';
                  const color = impact.direction === 'positive' ? '#4ade80' : impact.direction === 'negative' ? '#f87171' : '#94a3b8';
                  const border = impact.direction === 'positive' ? '#166534' : impact.direction === 'negative' ? '#7f1d1d' : '#334155';
                  const arrow = impact.direction === 'positive' ? '↑' : impact.direction === 'negative' ? '↓' : '~';
                  return `<span style="display:inline-block; background:${bg}; border:1px solid ${border}; color:${color}; font-size:11px; padding:3px 10px; border-radius:20px; font-weight:600; margin:0 4px 4px 0;">${arrow} ${impact.sector.he}</span>`;
                }).join('')}
              </div>
            </td>
          </tr>
          ` : ''}

        </table>
      </td>
    </tr>
  `;
}

/* ─── Shock card ────────────────────────────────────────────────── */

function fullShockCard(shock: ShockEvent): string {
  const headline = getT(shock.headline);
  const whatMoved = getT(shock.whatMoved);
  const whyNow = getT(shock.whyNow);
  const whoDriving = getT(shock.whoDriving);
  const timeWindow = getT(shock.timeWindow);

  const typeLabel: Record<string, string> = {
    likelihood: '📊 זעזוע סבירות',
    narrative: '📰 פיצול נרטיבי',
    fragmentation: '🔀 פרגמנטציה',
  };

  return `
    <tr>
      <td style="padding:0 0 16px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e1b4b; border-radius:12px; border:1px solid #312e81; overflow:hidden;">
          <tr>
            <td style="padding:16px 20px;">
              <div style="font-size:10px; color:#818cf8; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:8px;">
                ${typeLabel[shock.type] || '⚡ זעזוע'}
              </div>
              <div style="font-size:16px; font-weight:800; color:#f1f5f9; line-height:1.4; margin-bottom:10px;">${headline}</div>
              ${whatMoved ? `<div style="font-size:13px; color:#c7d2fe; line-height:1.6; margin-bottom:8px;"><strong>מה זז:</strong> ${whatMoved}</div>` : ''}
              ${whyNow ? `<div style="font-size:13px; color:#c7d2fe; line-height:1.6; margin-bottom:8px;"><strong>למה עכשיו:</strong> ${whyNow}</div>` : ''}
              ${whoDriving ? `<div style="font-size:13px; color:#c7d2fe; line-height:1.6; margin-bottom:8px;"><strong>מי מניע:</strong> ${whoDriving}</div>` : ''}
              <table cellpadding="0" cellspacing="0" style="margin-top:8px;">
                <tr>
                  <td style="padding-left:12px;">
                    <span style="font-size:20px; font-weight:900; color:${shock.delta >= 0 ? '#22c55e' : '#ef4444'};">${shock.delta >= 0 ? '+' : ''}${shock.delta}%</span>
                  </td>
                  ${timeWindow ? `<td style="padding-right:12px;"><span style="font-size:11px; color:#818cf8;">⏱ ${timeWindow}</span></td>` : ''}
                  <td>
                    <span style="font-size:11px; background:#312e81; color:#a5b4fc; padding:2px 8px; border-radius:10px; font-weight:600;">
                      ${shock.confidence === 'high' ? 'ביטחון גבוה' : shock.confidence === 'medium' ? 'ביטחון בינוני' : 'ביטחון נמוך'}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

/* ─── Main: Daily Brief Email ──────────────────────────────────── */

export function buildDailyBriefEmail(opts: {
  stories: BriefStory[];
  shocks: ShockEvent[];
  unsubToken: string;
  email: string;
}): { subject: string; html: string } {
  const { stories, shocks, unsubToken, email } = opts;
  const dateStr = new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  const unsubUrl = `${SITE_URL}/api/unsubscribe?token=${unsubToken}&email=${encodeURIComponent(email)}`;

  // Aggregate stats
  const totalStories = stories.length;
  const totalSources = new Set(stories.flatMap(s => Array.isArray(s.sources) ? s.sources.map(src => src.name) : [])).size;
  const highLikelihood = stories.filter(s => s.likelihood >= 70).length;
  const signalCount = stories.filter(s => s.isSignal).length;
  const avgLikelihood = totalStories > 0 ? Math.round(stories.reduce((sum, s) => sum + s.likelihood, 0) / totalStories) : 0;

  // Top story for the executive summary lead
  const topStory = stories[0];
  const topHeadline = topStory ? getT(topStory.headline) : '';

  // Categories overview
  const categories = new Map<string, number>();
  stories.forEach(s => {
    const cat = getT(s.category);
    categories.set(cat, (categories.get(cat) || 0) + 1);
  });
  const catSummary = [...categories.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, count]) => `${cat} (${count})`)
    .join(' · ');

  const subject = `⚡ תקציר מודיעיני — ${dateStr}`;

  // Show up to 8 stories and up to 4 shocks for a full-page brief
  const displayStories = stories.slice(0, 8);
  const displayShocks = shocks.slice(0, 4);

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${subject}</title>
</head>
<body style="margin:0; padding:0; background:#060a14; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060a14; padding:24px 12px;">
    <tr>
      <td>
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; margin:0 auto;">

          <!-- ═══════ HEADER ═══════ -->
          <tr>
            <td style="padding:24px 20px 20px; background:#0a0f1e; border-radius:12px 12px 0 0; border-bottom:2px solid #6366f1;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:11px; color:#6366f1; font-weight:700; letter-spacing:4px; text-transform:uppercase;">SIGNAL NEWS INTELLIGENCE</div>
                    <div style="font-size:26px; font-weight:900; color:#f1f5f9; margin-top:6px;">📋 תקציר מודיעיני יומי</div>
                    <div style="font-size:13px; color:#64748b; margin-top:4px;">${dateStr} · ${timeStr}</div>
                  </td>
                  <td style="text-align:left; vertical-align:top;">
                    <div style="background:#111827; border-radius:8px; padding:10px 14px; text-align:center;">
                      <div style="font-size:24px; font-weight:900; color:#6366f1;">${totalStories}</div>
                      <div style="font-size:9px; color:#64748b; text-transform:uppercase;">סיגנלים</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══════ EXECUTIVE SUMMARY ═══════ -->
          <tr>
            <td style="padding:24px 20px; background:#0f172a; border-bottom:1px solid #1e293b;">
              <div style="font-size:10px; color:#22c55e; font-weight:700; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px;">🧠 תמצית מנהלים</div>
              <div style="font-size:14px; color:#e2e8f0; line-height:1.8; margin-bottom:12px;">
                ${highLikelihood > 0 ? `<strong style="color:#22c55e;">${highLikelihood} אירועים</strong> מרכזיים זוהו הבוקר בסבירות גבוהה.` : 'אין אירועים בסבירות גבוהה מיוחדת הבוקר.'}
                ${signalCount > 0 ? ` <strong style="color:#fbbf24;">${signalCount} סיגנלים חריגים</strong> דורשים תשומת לב.` : ''}
                ${shocks.length > 0 ? ` <strong style="color:#818cf8;">${shocks.length} זעזועים סטטיסטיים</strong> זוהו ב-24 השעות האחרונות.` : ''}
              </div>
              ${topStory ? `
              <div style="font-size:14px; color:#e2e8f0; line-height:1.8; margin-bottom:12px;">
                <strong>סיגנל מוביל:</strong> "${topHeadline}" — ${topStory.likelihood >= 70 ? 'נתמך ע"י מקורות מרובים בכיסוי נרחב.' : 'מגמה מתפתחת הדורשת מעקב.'}
                סבירות: <strong style="color:${getLikelihoodColor(topStory.likelihood)}">${topStory.likelihood}%</strong>${topStory.delta ? ` (${topStory.delta > 0 ? '↑' : '↓'}${Math.abs(topStory.delta)}% מאתמול)` : ''}.
              </div>
              ` : ''}
              <div style="font-size:12px; color:#64748b; line-height:1.6;">
                <strong>נושאים מרכזיים:</strong> ${catSummary || 'כללי'}<br/>
                <strong>סבירות ממוצעת:</strong> ${avgLikelihood}%
              </div>
              ${(() => {
                const allImpacts = stories.flatMap(s => s.impacts || []);
                const negImpacts = [...new Set(allImpacts.filter(i => i.direction === 'negative').map(i => i.sector.he))].slice(0, 3);
                const posImpacts = [...new Set(allImpacts.filter(i => i.direction === 'positive').map(i => i.sector.he))].slice(0, 3);
                if (!negImpacts.length && !posImpacts.length) return '';
                return `
              <div style="margin-top:12px; padding:12px 14px; background:#0a0f1e; border-radius:8px; border-right:3px solid #6366f1;">
                <div style="font-size:10px; color:#6366f1; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">🔗 השפעות צפויות לאזורים</div>
                ${posImpacts.length ? `<div style="font-size:12px; color:#4ade80; margin-bottom:4px;">↑ עלייה צפויה: ${posImpacts.join(' · ')}</div>` : ''}
                ${negImpacts.length ? `<div style="font-size:12px; color:#f87171;">↓ לחץ צפוי: ${negImpacts.join(' · ')}</div>` : ''}
              </div>`;
              })()}
            </td>
          </tr>

          <!-- ═══════ STATS BAR ═══════ -->
          <tr>
            <td style="padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;">
                <tr>
                  <td style="padding:12px; text-align:center; border-left:1px solid #1e293b;">
                    <div style="font-size:20px; font-weight:900; color:#22c55e;">${highLikelihood}</div>
                    <div style="font-size:9px; color:#64748b;">סבירות גבוהה</div>
                  </td>
                  <td style="padding:12px; text-align:center; border-left:1px solid #1e293b;">
                    <div style="font-size:20px; font-weight:900; color:#818cf8;">${shocks.length}</div>
                    <div style="font-size:9px; color:#64748b;">זעזועים</div>
                  </td>
                  <td style="padding:12px; text-align:center; border-left:1px solid #1e293b;">
                    <div style="font-size:20px; font-weight:900; color:#fbbf24;">${signalCount}</div>
                    <div style="font-size:9px; color:#64748b;">סיגנלים</div>
                  </td>
                  <td style="padding:12px; text-align:center;">
                    <div style="font-size:20px; font-weight:900; color:#94a3b8;">${avgLikelihood}%</div>
                    <div style="font-size:9px; color:#64748b;">סבירות ממוצעת</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══════ SHOCKS SECTION ═══════ -->
          ${displayShocks.length > 0 ? `
          <tr>
            <td style="padding:28px 20px 12px; background:#0a0f1e;">
              <div style="font-size:10px; color:#818cf8; font-weight:700; text-transform:uppercase; letter-spacing:2px; margin-bottom:4px;">⚡ זעזועים שזוהו</div>
              <div style="font-size:12px; color:#64748b; margin-bottom:16px;">חריגות סטטיסטיות ב-24 השעות האחרונות</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${displayShocks.map(s => fullShockCard(s)).join('')}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- ═══════ STORIES SECTION ═══════ -->
          <tr>
            <td style="padding:28px 20px 12px; background:#0a0f1e;">
              <div style="font-size:10px; color:#22c55e; font-weight:700; text-transform:uppercase; letter-spacing:2px; margin-bottom:4px;">📰 סיגנלים מובילים</div>
              <div style="font-size:12px; color:#64748b; margin-bottom:16px;">ניתוח מלא של הסיפורים המשמעותיים ביותר</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${displayStories.map((s, i) => fullStoryCard(s, i)).join('')}
              </table>
            </td>
          </tr>

          <!-- ═══════ WHAT TO WATCH ═══════ -->
          <tr>
            <td style="padding:20px; background:#111827; border-top:1px solid #1e293b;">
              <div style="font-size:10px; color:#f59e0b; font-weight:700; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px;">👁️ מה לעקוב אחריו</div>
              <div style="font-size:13px; color:#94a3b8; line-height:1.8;">
                ${stories.filter(s => s.likelihood >= 45 && s.likelihood < 70).length > 0
                  ? `• <strong style="color:#f59e0b;">${stories.filter(s => s.likelihood >= 45 && s.likelihood < 70).length} סיפורים</strong> בטווח הסבירות 45-70% — עדיין לא סבירות גבוהה, אבל מגמות שיכולות להתפתח.`
                  : '• אין כרגע מגמות בתפר — רוב הסיפורים ברורים בכיוונם.'}
                <br/>
                ${shocks.filter(s => s.confidence === 'high').length > 0
                  ? `• <strong style="color:#818cf8;">זעזועים בביטחון גבוה:</strong> ${shocks.filter(s => s.confidence === 'high').length} — אלו דורשים תשומת לב מיידית.`
                  : `• אין זעזועים בביטחון גבוה — יום יחסית יציב.`}
                <br/>
                • <strong>סבירות ממוצעת ${avgLikelihood >= 55 ? 'גבוהה מהרגיל' : avgLikelihood >= 40 ? 'בטווח הנורמלי' : 'נמוכה מהרגיל'}</strong> — ${avgLikelihood}% (ממוצע רגיל: 50%).
              </div>
            </td>
          </tr>

          <!-- ═══════ CTA ═══════ -->
          <tr>
            <td style="padding:28px 20px; background:#0a0f1e; text-align:center;">
              <a href="${SITE_URL}/dashboard"
                 style="display:inline-block; background:linear-gradient(135deg, #6366f1, #4f46e5); color:#fff; padding:14px 40px; border-radius:10px; font-size:15px; font-weight:800; text-decoration:none; letter-spacing:0.5px;">
                פתח דשבורד אינטראקטיבי מלא →
              </a>
              <div style="font-size:11px; color:#475569; margin-top:10px;">כולל מפה גיאופוליטית, Signal vs Market, ניתוח הטיה תקשורתית</div>
            </td>
          </tr>

          <!-- ═══════ FOOTER ═══════ -->
          <tr>
            <td style="padding:20px; background:#060a14; border-top:1px solid #1e293b; border-radius:0 0 12px 12px; text-align:center;">
              <div style="font-size:11px; color:#374151; font-weight:700; letter-spacing:2px; margin-bottom:8px;">SIGNAL NEWS</div>
              <div style="font-size:11px; color:#475569; line-height:1.8;">
                תקציר מודיעיני אוטומטי · נשלח כל בוקר ב-07:00<br/>
                ניתוח ע"י AI ללא הטיה פוליטית<br/>
                <a href="${unsubUrl}" style="color:#6366f1; text-decoration:none; font-weight:600;">הסר אותי מהרשימה</a>
                <span style="color:#1e293b;"> | </span>
                <a href="${SITE_URL}/dashboard" style="color:#6366f1; text-decoration:none;">פתח דשבורד</a>
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
          ${fullStoryCard(story, 0)}
          ${shock ? fullShockCard(shock) : ''}
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
