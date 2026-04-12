/**
 * Telegram Bot Service
 * Sends proactive intelligence alerts to a Telegram channel.
 * Requires BOT_TOKEN and TELEGRAM_CHAT_ID environment variables.
 * Bot setup: @BotFather → create bot → add to channel → set as admin
 */

export function isTelegramEnabled(): boolean {
  return !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export async function sendTelegramMessage(text: string): Promise<boolean> {
  if (!isTelegramEnabled()) return false;
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(8000),
      }
    );
    return res.ok;
  } catch { return false; }
}

/**
 * Format and send a shock alert to Telegram
 */
export async function sendShockAlert(shock: {
  headline: { he: string; en: string };
  type: string;
  confidence: string;
  whyNow: { he: string; en: string };
}): Promise<boolean> {
  const icon = shock.type === 'likelihood' ? '⚡' : shock.type === 'narrative' ? '🔀' : '💥';
  const conf = shock.confidence === 'high' ? '🔴' : shock.confidence === 'medium' ? '🟡' : '🟢';

  const text = [
    `${icon} <b>זיקוק | Signal Alert</b>`,
    ``,
    `<b>${shock.headline.he}</b>`,
    `${shock.headline.en}`,
    ``,
    `${conf} עוצמה: ${shock.confidence} · סוג: ${shock.type}`,
    ``,
    `📝 ${shock.whyNow.he}`,
    ``,
    `🔗 <a href="https://signal-news-demo.vercel.app/dashboard#shocks">פתח דאשבורד</a>`,
  ].join('\n');

  return sendTelegramMessage(text);
}

/**
 * Send daily synthesis summary to Telegram
 */
export async function sendDailySynthesis(synthesis: {
  mainDevelopment: { he: string };
  watchFor: { he: string };
  threatLevel: string;
}): Promise<boolean> {
  const threatIcon = synthesis.threatLevel === 'critical' ? '🚨' :
                     synthesis.threatLevel === 'high' ? '🔴' :
                     synthesis.threatLevel === 'medium' ? '🟡' : '🟢';

  const text = [
    `📊 <b>זיקוק | הערכת מודיעין יומית</b>`,
    ``,
    `${threatIcon} ${synthesis.mainDevelopment.he}`,
    ``,
    `👁️ <b>לצפות ב-24 שעות:</b>`,
    synthesis.watchFor.he,
    ``,
    `🔗 <a href="https://signal-news-demo.vercel.app/dashboard">פתח דאשבורד מלא</a>`,
  ].join('\n');

  return sendTelegramMessage(text);
}
