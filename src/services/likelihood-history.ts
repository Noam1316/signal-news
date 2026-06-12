/**
 * Likelihood History — persists hourly snapshots of story likelihood scores
 * to Vercel KV (with in-memory fallback), so the UI can show real trend
 * charts that survive deploys.
 *
 * Storage shape (single KV key):
 *   [{ ts: epochMs, scores: { [slug]: likelihood } }, ...]
 *
 * Snapshots are bucketed to one per hour, capped at 7 days (168 entries).
 */

const HISTORY_KEY = 'signal:likelihood-history';
const BUCKET_MS = 60 * 60 * 1000;        // one snapshot per hour
const MAX_ENTRIES = 168;                 // 7 days of hourly buckets

export interface HistorySnapshot {
  ts: number;
  scores: Record<string, number>;
}

export interface HistoryPoint {
  ts: number;
  likelihood: number;
}

// ─── KV helpers (same pattern as prediction-tracker.ts) ─────────────────────

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

// ─── In-memory fallback ──────────────────────────────────────────────────────

let memHistory: HistorySnapshot[] = [];
let lastRecordTs = 0;

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Record current likelihoods. Throttled to one snapshot per hour bucket —
 * cheap to call on every /api/stories request.
 */
export async function recordLikelihoods(
  stories: Array<{ slug: string; likelihood: number }>,
): Promise<void> {
  if (stories.length === 0) return;

  const now = Date.now();
  const bucket = Math.floor(now / BUCKET_MS);

  // Fast path: already recorded this hour (per warm instance)
  if (Math.floor(lastRecordTs / BUCKET_MS) === bucket) return;

  const history = (await kvGet<HistorySnapshot[]>(HISTORY_KEY)) ?? memHistory;

  // Double-check against persisted data (other instances may have recorded)
  const last = history[history.length - 1];
  if (last && Math.floor(last.ts / BUCKET_MS) === bucket) {
    lastRecordTs = now;
    memHistory = history;
    return;
  }

  const scores: Record<string, number> = {};
  for (const s of stories) {
    if (s.slug) scores[s.slug] = s.likelihood;
  }

  const updated = [...history, { ts: now, scores }].slice(-MAX_ENTRIES);
  memHistory = updated;
  lastRecordTs = now;
  await kvSet(HISTORY_KEY, updated);
}

/**
 * Get the likelihood time series for one story slug.
 * Returns chronological points; empty array if no history.
 */
export async function getStoryHistory(slug: string): Promise<HistoryPoint[]> {
  const history = (await kvGet<HistorySnapshot[]>(HISTORY_KEY)) ?? memHistory;
  const points: HistoryPoint[] = [];
  for (const snap of history) {
    const v = snap.scores[slug];
    if (typeof v === 'number') points.push({ ts: snap.ts, likelihood: v });
  }
  return points;
}

/**
 * Get the biggest movers over the last `hours` (default 24h):
 * stories whose likelihood changed the most between the oldest in-window
 * snapshot and the newest.
 */
export async function getTopMovers(
  hours = 24,
  limit = 5,
): Promise<Array<{ slug: string; from: number; to: number; delta: number }>> {
  const history = (await kvGet<HistorySnapshot[]>(HISTORY_KEY)) ?? memHistory;
  if (history.length < 2) return [];

  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  const inWindow = history.filter(h => h.ts >= cutoff);
  if (inWindow.length < 2) return [];

  const oldest = inWindow[0];
  const newest = inWindow[inWindow.length - 1];

  const movers: Array<{ slug: string; from: number; to: number; delta: number }> = [];
  for (const [slug, to] of Object.entries(newest.scores)) {
    const from = oldest.scores[slug];
    if (typeof from !== 'number') continue;
    const delta = to - from;
    if (Math.abs(delta) >= 3) movers.push({ slug, from, to, delta });
  }

  return movers
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, limit);
}
