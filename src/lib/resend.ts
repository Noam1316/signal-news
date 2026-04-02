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

// IMPORTANT: RESEND_FROM must be a verified sender in your Resend account.
// Options:
//   1. Your own email address verified in Resend (easiest)
//   2. A domain you own and verified in Resend → e.g. "Zikuk <brief@yourdomain.com>"
//   3. Resend's test address (only works for sending to your own Resend email): onboarding@resend.dev
export const FROM_EMAIL = process.env.RESEND_FROM ?? 'onboarding@resend.dev';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://signal-news-noam1316s-projects.vercel.app';
