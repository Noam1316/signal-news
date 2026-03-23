/**
 * Resend email client wrapper.
 * Requires RESEND_API_KEY env var.
 * If missing → logs warning and skips silently.
 */

import { Resend } from 'resend';

let _client: Resend | null = null;

export function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] RESEND_API_KEY not set — email sending disabled');
    return null;
  }
  if (!_client) _client = new Resend(process.env.RESEND_API_KEY);
  return _client;
}

export const FROM_EMAIL = process.env.RESEND_FROM ?? 'Signal News <brief@signal-news.io>';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://signal-news-noam1316s-projects.vercel.app';
