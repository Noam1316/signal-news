/**
 * Subscriber store — persists email subscriptions to Vercel KV.
 * Falls back to in-memory if KV not configured.
 */

export interface Subscriber {
  email: string;
  topics: string[];       // keywords to watch e.g. ['איראן', 'Ukraine']
  dailyBrief: boolean;
  watchlistAlerts: boolean;
  token: string;          // random token for unsubscribe link
  subscribedAt: string;   // ISO date
}

// In-memory fallback (resets on cold start)
const memStore = new Map<string, Subscriber>();

async function kv(): Promise<import('@vercel/kv').VercelKV | null> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  try {
    const { kv } = await import('@vercel/kv');
    return kv;
  } catch { return null; }
}

function generateToken(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function addSubscriber(data: Omit<Subscriber, 'token' | 'subscribedAt'>): Promise<Subscriber> {
  const sub: Subscriber = {
    ...data,
    token: generateToken(),
    subscribedAt: new Date().toISOString(),
  };

  const db = await kv();
  if (db) {
    await db.set(`signal:sub:${sub.email}`, JSON.stringify(sub));
    // Add to subscriber index
    const idx: string[] = (await db.get<string[]>('signal:subscribers')) ?? [];
    if (!idx.includes(sub.email)) {
      await db.set('signal:subscribers', [...idx, sub.email]);
    }
  } else {
    memStore.set(sub.email, sub);
  }

  return sub;
}

export async function getSubscriber(email: string): Promise<Subscriber | null> {
  const db = await kv();
  if (db) {
    const raw = await db.get<string>(`signal:sub:${email}`);
    return raw ? JSON.parse(raw) : null;
  }
  return memStore.get(email) ?? null;
}

export async function removeSubscriber(email: string): Promise<void> {
  const db = await kv();
  if (db) {
    await db.del(`signal:sub:${email}`);
    const idx: string[] = (await db.get<string[]>('signal:subscribers')) ?? [];
    await db.set('signal:subscribers', idx.filter(e => e !== email));
  } else {
    memStore.delete(email);
  }
}

export async function getAllSubscribers(): Promise<Subscriber[]> {
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
