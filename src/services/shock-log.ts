/**
 * Shock log — persists detected shocks to Vercel KV for track record display.
 * Falls back gracefully when KV is not configured.
 */

export interface ShockLogEntry {
  id: string;
  timestamp: string;
  headline: string;
  shockType: string;
  likelihood: number;
  delta: number;
  confidence: number;
  polymarketMatch?: string;
  resolved?: boolean;
  wasCorrect?: boolean;
}

const LOG_KEY = 'signal:shock-log';
const MAX_ENTRIES = 200;

async function kvGet<T>(key: string): Promise<T | null> {
  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
    const { kv } = await import('@vercel/kv');
    return await kv.get<T>(key);
  } catch { return null; }
}

async function kvSet(key: string, value: unknown): Promise<void> {
  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return;
    const { kv } = await import('@vercel/kv');
    await kv.set(key, value);
  } catch { /* silent */ }
}

// Module-level fallback log (lost on cold start)
let memLog: ShockLogEntry[] = [];

export async function logShock(entry: Omit<ShockLogEntry, 'timestamp'>): Promise<void> {
  const full: ShockLogEntry = { ...entry, timestamp: new Date().toISOString() };

  // Add to memory log
  memLog = [full, ...memLog].slice(0, MAX_ENTRIES);

  // Persist to KV
  const existing = await kvGet<ShockLogEntry[]>(LOG_KEY) ?? [];
  const updated = [full, ...existing].slice(0, MAX_ENTRIES);
  await kvSet(LOG_KEY, updated);
}

export async function getShockLog(): Promise<ShockLogEntry[]> {
  const kvLog = await kvGet<ShockLogEntry[]>(LOG_KEY);
  if (kvLog && kvLog.length > 0) return kvLog;
  return memLog;
}

export async function getShockAccuracy(): Promise<{ total: number; resolved: number; correct: number; accuracy: number }> {
  const log = await getShockLog();
  const resolved = log.filter(e => e.resolved === true);
  const correct = resolved.filter(e => e.wasCorrect === true);
  return {
    total: log.length,
    resolved: resolved.length,
    correct: correct.length,
    accuracy: resolved.length > 0 ? Math.round((correct.length / resolved.length) * 100) : 0,
  };
}
