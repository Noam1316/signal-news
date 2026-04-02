/**
 * HTML email templates for Zikuk.
 * Hebrew RTL, professional intelligence brief design.
 * Full-page daily digest with executive summary, stories, shocks, statistics.
 */

import type { BriefStory, ShockEvent } from '@/lib/types';
import type { SignalVsMarket } from '@/services/polymarket';
import { SECTOR_STOCKS } from '@/services/polymarket';
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


/* ─── Story card (compact Axios-style) ───────────────────────── */

function fullStoryCard(story: BriefStory, index: number): string {
  const headline = escapeHtml(getT(story.headline));
  const summary = escapeHtml(getT(story.summary));
  const why = escapeHtml(getT(story.why));
  const category = escapeHtml(getT(story.category));
  const color = getLikelihoodColor(story.likelihood);
  const label = getLikelihoodLabel(story.likelihood);
  const srcCount = getSourceCount(story);

  const impactsHtml = story.impacts && story.impacts.length > 0
    ? story.impacts.map(impact => {
        const bg   = impact.direction === 'positive' ? '#052e16' : impact.direction === 'negative' ? '#2d0909' : '#1e293b';
        const col  = impact.direction === 'positive' ? '#4ade80' : impact.direction === 'negative' ? '#f87171' : '#94a3b8';
        const brd  = impact.direction === 'positive' ? '#166534' : impact.direction === 'negative' ? '#7f1d1d' : '#334155';
        const arr  = impact.direction === 'positive' ? '↑' : impact.direction === 'negative' ? '↓' : '~';
        return `<span style="display:inline-block;background:${bg};border:1px solid ${brd};color:${col};font-size:11px;padding:2px 9px;border-radius:20px;font-weight:600;margin:0 3px 3px 0;">${arr} ${impact.sector.he}</span>`;
      }).join('')
    : '';

  const deltaHtml = story.delta && Math.abs(story.delta) >= 3
    ? `<span style="font-size:11px;color:${story.delta > 0 ? '#22c55e' : '#ef4444'};font-weight:700;margin-right:8px;">${story.delta > 0 ? '▲' : '▼'}${Math.abs(story.delta)}%</span>`
    : '';

  return `
    <tr>
      <td style="padding:0 0 16px 0;">
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#111827;border-radius:10px;border-right:3px solid ${color};overflow:hidden;">
          <tr>
            <td style="padding:16px 18px 14px;">

              <!-- Meta row -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                <tr>
                  <td>
                    <span style="font-size:10px;color:#6366f1;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">${category}</span>
                    ${story.isSignal ? `<span style="font-size:10px;background:#422006;color:#fbbf24;padding:1px 7px;border-radius:8px;font-weight:700;margin-right:6px;">⚡ SIGNAL</span>` : ''}
                  </td>
                  <td style="text-align:left;white-space:nowrap;">
                    <span style="font-size:11px;font-weight:800;color:${color};">${story.likelihood}%</span>
                    <span style="font-size:10px;color:#475569;margin-right:4px;">${label}</span>
                  </td>
                </tr>
              </table>

              <!-- Headline -->
              <div style="font-size:17px;font-weight:800;color:#f1f5f9;line-height:1.4;margin-bottom:8px;">${headline}</div>

              <!-- Summary -->
              <div style="font-size:13px;color:#94a3b8;line-height:1.7;margin-bottom:10px;">${summary}</div>

              <!-- Footer row: delta + sources + impacts -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:top;">
                    ${deltaHtml}
                    <span style="font-size:10px;color:#374151;">${srcCount} מקורות</span>
                  </td>
                </tr>
                ${impactsHtml ? `
                <tr>
                  <td style="padding-top:8px;">${impactsHtml}</td>
                </tr>` : ''}
              </table>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

/* ─── Shock card (compact) ──────────────────────────────────────── */

function fullShockCard(shock: ShockEvent): string {
  const headline = escapeHtml(getT(shock.headline));
  const whyNow = escapeHtml(getT(shock.whyNow));
  const typeLabel: Record<string, string> = {
    likelihood: '📊 זעזוע סבירות',
    narrative: '📰 פיצול נרטיבי',
    fragmentation: '🔀 פרגמנטציה',
  };
  const confColor = shock.confidence === 'high' ? '#818cf8' : shock.confidence === 'medium' ? '#a5b4fc' : '#64748b';

  return `
    <tr>
      <td style="padding:0 0 10px 0;">
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#1e1b4b;border-radius:8px;border-right:3px solid #6366f1;overflow:hidden;">
          <tr>
            <td style="padding:12px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td><span style="font-size:10px;color:#818cf8;font-weight:700;">${typeLabel[shock.type] || '⚡ זעזוע'}</span></td>
                  <td style="text-align:left;">
                    <span style="font-size:14px;font-weight:900;color:${shock.delta >= 0 ? '#22c55e' : '#ef4444'};">${shock.delta >= 0 ? '+' : ''}${shock.delta}%</span>
                    <span style="font-size:10px;color:${confColor};margin-right:6px;">${shock.confidence === 'high' ? '● גבוה' : shock.confidence === 'medium' ? '● בינוני' : '● נמוך'}</span>
                  </td>
                </tr>
              </table>
              <div style="font-size:14px;font-weight:700;color:#f1f5f9;line-height:1.4;margin:6px 0 4px;">${headline}</div>
              ${whyNow ? `<div style="font-size:12px;color:#94a3b8;line-height:1.5;">${whyNow}</div>` : ''}
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
  topAlpha: SignalVsMarket | null;
  unsubToken: string;
  email: string;
}): { subject: string; html: string } {
  const { stories, shocks, topAlpha, unsubToken, email } = opts;
  const dateStr = new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  const unsubUrl = `${SITE_URL}/api/unsubscribe?token=${unsubToken}&email=${encodeURIComponent(email)}`;

  // Aggregate stats
  const totalStories = stories.length;
  const highLikelihood = stories.filter(s => s.likelihood >= 70).length;
  const signalCount = stories.filter(s => s.isSignal).length;
  const avgLikelihood = totalStories > 0 ? Math.round(stories.reduce((sum, s) => sum + s.likelihood, 0) / totalStories) : 0;

  // Top story for the executive summary lead
  const topStory = stories[0];
  const topHeadline = topStory ? getT(topStory.headline) : '';

  const subject = `⚡ תקציר מודיעיני — ${dateStr}`;

  const displayStories = stories.slice(0, 5);
  const displayShocks = shocks.slice(0, 2);

  // Preview text — shown in inbox before opening
  const previewText = topStory
    ? `${highLikelihood > 0 ? `${highLikelihood} אירועים חשובים · ` : ''}${topHeadline}${shocks.length > 0 ? ` · ${shocks.length} זעזועים` : ''}`
    : `תקציר מודיעיני — ${dateStr}`;

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${subject}</title>
</head>
<body style="margin:0; padding:0; background:#060a14; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction:rtl;">
  <!-- Preheader: shows in inbox preview -->
  <div style="display:none;font-size:1px;color:#060a14;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${previewText}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>
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
                    <div style="font-size:11px; color:#6366f1; font-weight:700; letter-spacing:4px; text-transform:uppercase;">Zikuk INTELLIGENCE</div>
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
            <td style="padding:20px; background:#0f172a; border-bottom:1px solid #1e293b;">
              <!-- Stats pills -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                <tr>
                  <td style="padding-left:8px;"><span style="background:#052e16;color:#22c55e;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;">${highLikelihood} בסבירות גבוהה</span></td>
                  ${shocks.length > 0 ? `<td style="padding-left:8px;"><span style="background:#1e1b4b;color:#818cf8;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;">${shocks.length} זעזועים</span></td>` : ''}
                  ${signalCount > 0 ? `<td style="padding-left:8px;"><span style="background:#422006;color:#fbbf24;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;">⚡ ${signalCount} סיגנלים</span></td>` : ''}
                </tr>
              </table>
              <!-- Top story lead -->
              ${topStory ? `
              <div style="font-size:15px;color:#f1f5f9;font-weight:700;line-height:1.5;margin-bottom:6px;">${topHeadline}</div>
              <div style="font-size:13px;color:#64748b;line-height:1.6;margin-bottom:12px;">
                סיגנל מוביל · סבירות <span style="color:${getLikelihoodColor(topStory.likelihood)};font-weight:700;">${topStory.likelihood}%</span>${topStory.delta ? ` · ${topStory.delta > 0 ? '↑' : '↓'}${Math.abs(topStory.delta)}% מאתמול` : ''}
              </div>` : ''}
              <!-- Sector impacts + stocks -->
              ${(() => {
                const allImpacts = stories.flatMap(s => s.impacts || []);
                const neg = [...new Set(allImpacts.filter(i => i.direction === 'negative').map(i => i.sector.he))].slice(0, 3);
                const pos = [...new Set(allImpacts.filter(i => i.direction === 'positive').map(i => i.sector.he))].slice(0, 3);
                // Build stock tickers for impacted sectors
                const stockHints = [...pos, ...neg]
                  .map(s => SECTOR_STOCKS[s])
                  .filter(Boolean)
                  .slice(0, 3)
                  .map(s => `${s.label} (${s.tickers.slice(0,2).join(', ')})`)
                  .join(' · ');
                if (!neg.length && !pos.length) return '';
                return `
                <div style="font-size:12px;color:#475569;line-height:1.8;margin-bottom:6px;">
                  ${pos.length ? `<span style="color:#4ade80;">↑ ${pos.join(' · ')}</span>` : ''}
                  ${pos.length && neg.length ? `<span style="color:#374151;"> &nbsp;|&nbsp; </span>` : ''}
                  ${neg.length ? `<span style="color:#f87171;">↓ ${neg.join(' · ')}</span>` : ''}
                </div>
                ${stockHints ? `<div style="font-size:11px;color:#374151;">📈 השפעה אפשרית: ${stockHints}</div>` : ''}`;
              })()}

              <!-- Polymarket Alpha Opportunity -->
              ${topAlpha && topAlpha.alphaScore >= 30 ? `
              <div style="margin-top:12px;padding:10px 14px;background:#0a0f1e;border-radius:8px;border-right:3px solid ${topAlpha.alphaDirection === 'signal-higher' ? '#22c55e' : '#f59e0b'};">
                <div style="font-size:10px;color:#6366f1;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">⚡ הזדמנות — Signal vs Polymarket</div>
                <div style="font-size:13px;color:#e2e8f0;font-weight:600;margin-bottom:4px;">${topAlpha.polymarketTitle.slice(0, 70)}${topAlpha.polymarketTitle.length > 70 ? '...' : ''}</div>
                <div style="font-size:12px;color:#94a3b8;line-height:1.6;">
                  Signal: <strong style="color:${topAlpha.alphaDirection === 'signal-higher' ? '#22c55e' : '#f87171'};">${topAlpha.signalLikelihood}%</strong>
                  &nbsp;·&nbsp; שוק: <strong style="color:#94a3b8;">${topAlpha.marketProbability}%</strong>
                  &nbsp;·&nbsp; פער: <strong style="color:#fbbf24;">${topAlpha.delta > 0 ? '+' : ''}${topAlpha.delta}%</strong>
                  &nbsp;·&nbsp; Alpha: <strong style="color:#818cf8;">${topAlpha.alphaScore}</strong>
                </div>
                <div style="font-size:11px;color:#64748b;margin-top:4px;">${topAlpha.whyDifferent}</div>
              </div>` : ''}
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
              <div style="font-size:11px; color:#374151; font-weight:700; letter-spacing:2px; margin-bottom:8px;">Zikuk</div>
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
        <div style="font-size:13px; color:#6366f1; font-weight:700; letter-spacing:2px;">Zikuk · התראה</div>
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
