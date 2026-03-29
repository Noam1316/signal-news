/**
 * Gmail SMTP mailer via Nodemailer.
 *
 * Requires two env vars:
 *   GMAIL_USER        — your Gmail address, e.g. noamokun1@gmail.com
 *   GMAIL_APP_PASSWORD — 16-char Google App Password (NOT your regular password)
 *
 * Free tier: up to ~500 emails/day via Gmail SMTP.
 * Falls back silently if env vars are missing.
 */

import nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  unsubscribeUrl?: string;
}

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn('[mailer] GMAIL_USER or GMAIL_APP_PASSWORD not set — email disabled');
    return null;
  }

  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  return _transporter;
}

export const FROM_NAME = 'Signal News';

export function getFromAddress(): string {
  const user = process.env.GMAIL_USER ?? 'noreply@gmail.com';
  return `${FROM_NAME} <${user}>`;
}

export async function sendMail({ to, subject, html, text, unsubscribeUrl }: SendMailOptions): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) throw new Error('Mailer not configured (missing GMAIL_USER / GMAIL_APP_PASSWORD)');

  const user = process.env.GMAIL_USER ?? '';
  const headers: Record<string, string> = {};
  if (unsubscribeUrl) {
    headers['List-Unsubscribe'] = `<${unsubscribeUrl}>, <mailto:${user}?subject=unsubscribe>`;
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }

  await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject,
    html,
    text: text ?? html.replace(/<[^>]*>/g, ' ').replace(/\s{2,}/g, ' ').trim(),
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
  });
}

/** Returns true if Gmail SMTP is properly configured */
export function isMailerConfigured(): boolean {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}
