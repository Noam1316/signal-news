/**
 * Subscriber store — persists email subscriptions.
 *
 * Priority order:
 *  1. Resend Contacts API  — if RESEND_AUDIENCE_ID + RESEND_API_KEY are set (recommended, free, persistent)
 *  2. Vercel KV            — if KV_REST_API_URL + KV_REST_API_TOKEN are set
 *  3. In-memory fallback   — resets on every cold start (dev only, never use in prod)
 */

import { getResend } from '@/lib/resend';

export interface Subscriber {
  email: string;
  topics: string[];
  dailyBrief: boolean;
  watchlistAlerts: boolean;
  token: string;
  subscribedAt: string;
}

// In-memory fallback (resets on cold start)
const memStore = new Map<string, Subscriber>();

function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

// ─── Resend Contacts helpers ───────────────────────────────────────────────

function getAudienceId(): string | null {
  return process.env.RESEND_AUDIENCE_ID ?? null;
}

/** Pack extra subscriber metadata into Resend's firstName/lastName fields */
function packMeta(sub: Subscriber): { firstName: string; lastName: string } {
  // firstName → token (needed for unsubscribe links)
  // lastName  → JSON blob with preferences
  return {
    firstName: sub.token,
    lastName: JSON.stringify({
      topics: sub.topics,
      dailyBrief: sub.dailyBrief,
      watchlistAlerts: sub.watchlistAlerts,
      subscribedAt: sub.subscribedAt,
    }),
  };
}

/** Reconstruct a Subscriber from Resend Contact fields */
function unpackContact(contact: {
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  unsubscribed?: boolean;
}): Subscriber | null {
  if (!contact.email) return null;
  let token = contact.first_name ?? generateToken();
  let topics: string[] = [];
  let dailyBrief = true;
  let watchlistAlerts = false;
  let subscribedAt = new Date().toISOString();

  try {
    if (contact.last_name) {
      const parsed = JSON.parse(contact.last_name);
      topics = parsed.topics ?? [];
      dailyBrief = parsed.dailyBrief ?? true;
      watchlistAlerts = parsed.watchlistAlerts ?? false;
      subscribedAt = parsed.subscribedAt ?? subscribedAt;
    }
  } catch { /* ignore parse errors */ }

  // Respect unsubscribe flag: skip contacts that opted out
  if (contact.unsubscribed) return null;

  return { email: contact.email, token, topics, dailyBrief, watchlistAlerts, subscribedAt };
}

// ─── Vercel KV helpers ────────────────────────────────────────────────────

async function kv(): Promise<import('@vercel/kv').VercelKV | null> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  try {
    const { kv } = await import('@vercel/kv');
    return kv;
  } catch { return null; }
}

// ─── Public API ───────────────────────────────────────────────────────────

export async function addSubscriber(data: Omit<Subscriber, 'token' | 'subscribedAt'>): Promise<Subscriber> {
  const sub: Subscriber = {
    ...data,
    token: generateToken(),
    subscribedAt: new Date().toISOString(),
  };

  const audienceId = getAudienceId();
  const resend = getResend();

  // Try Resend Contacts first
  if (audienceId && resend) {
    try {
      const { firstName, lastName } = packMeta(sub);
      await resend.contacts.create({
        audienceId,
        email: sub.email,
        firstName,
        lastName,
        unsubscribed: false,
      });
      return sub;
    } catch (err) {
      console.error('[subscriber-store] Resend Contacts create error:', err);
      // Fall through to KV / memory
    }
  }

  // Try Vercel KV
  const db = await kv();
  if (db) {
    await db.set(`signal:sub:${sub.email}`, JSON.stringify(sub));
    const idx: string[] = (await db.get<string[]>('signal:subscribers')) ?? [];
    if (!idx.includes(sub.email)) {
      await db.set('signal:subscribers', [...idx, sub.email]);
    }
    return sub;
  }

  // In-memory fallback
  console.warn('[subscriber-store] WARNING: using in-memory store — subscribers will be lost on cold start. Set RESEND_AUDIENCE_ID to persist.');
  memStore.set(sub.email, sub);
  return sub;
}

export async function getSubscriber(email: string): Promise<Subscriber | null> {
  const audienceId = getAudienceId();
  const resend = getResend();

  if (audienceId && resend) {
    try {
      // Resend doesn't support get-by-email directly — list and filter
      const all = await getAllSubscribersFromResend(audienceId, resend);
      return all.find(s => s.email === email) ?? null;
    } catch { /* fall through */ }
  }

  const db = await kv();
  if (db) {
    const raw = await db.get<string>(`signal:sub:${email}`);
    return raw ? JSON.parse(raw) : null;
  }
  return memStore.get(email) ?? null;
}

export async function removeSubscriber(email: string): Promise<void> {
  const audienceId = getAudienceId();
  const resend = getResend();

  if (audienceId && resend) {
    try {
      // Mark as unsubscribed (Resend doesn't have a direct delete-by-email)
      // We list contacts to find the ID, then remove
      const result = await resend.contacts.list({ audienceId });
      const raw2 = result as unknown as { data?: { data?: unknown[] } | unknown[] };
      const contacts = (
        Array.isArray((raw2?.data as { data?: unknown[] })?.data)
          ? (raw2.data as { data: unknown[] }).data
          : Array.isArray(raw2?.data) ? raw2.data as unknown[]
          : []
      ) as Array<{ id: string; email: string }>;
      const match = contacts.find((c) => c.email === email);
      if (match?.id) {
        await resend.contacts.remove({ audienceId, id: match.id });
      }
      return;
    } catch (err) {
      console.error('[subscriber-store] Resend Contacts remove error:', err);
    }
  }

  const db = await kv();
  if (db) {
    await db.del(`signal:sub:${email}`);
    const idx: string[] = (await db.get<string[]>('signal:subscribers')) ?? [];
    await db.set('signal:subscribers', idx.filter(e => e !== email));
    return;
  }
  memStore.delete(email);
}

async function getAllSubscribersFromResend(
  audienceId: string,
  resend: NonNullable<ReturnType<typeof getResend>>
): Promise<Subscriber[]> {
  const result = await resend.contacts.list({ audienceId });
  // Handle different SDK response shapes across versions
  const raw = result as unknown as { data?: { data?: unknown[]; } | unknown[] };
  const contacts = (
    Array.isArray((raw?.data as { data?: unknown[] })?.data)
      ? (raw.data as { data: unknown[] }).data
      : Array.isArray(raw?.data) ? raw.data as unknown[]
      : []
  ) as Array<{ email: string; first_name?: string | null; last_name?: string | null; unsubscribed?: boolean }>;

  return contacts
    .map(unpackContact)
    .filter((s): s is Subscriber => s !== null);
}

export async function getAllSubscribers(): Promise<Subscriber[]> {
  const audienceId = getAudienceId();
  const resend = getResend();

  if (audienceId && resend) {
    try {
      return await getAllSubscribersFromResend(audienceId, resend);
    } catch (err) {
      console.error('[subscriber-store] Resend Contacts list error:', err);
    }
  }

  const db = await kv();
  if (db) {
    const idx: string[] = (await db.get<string[]>('signal:subscribers')) ?? [];
    const subs = await Promise.all(
      idx.map(async (email) => {
        const raw = await db.get<string>(`signal:sub:${email}`);
        return raw ? (JSON.parse(raw) as Subscriber) : null;
      })
    );
    return subs.filter((s): s is Subscriber => s !== null);
  }
  return [...memStore.values()];
}

export async function subscriberExists(email: string): Promise<boolean> {
  const sub = await getSubscriber(email);
  return sub !== null;
}
