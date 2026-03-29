/**
 * Prediction Tracker — stores Signal vs Market snapshots in Vercel KV,
 * checks resolved Polymarket markets, and computes historical accuracy.
 *
 * Flow:
 * 1. Every time /api/polymarket runs, savePredictionSnapshot() stores each match
 * 2. Weekly cron calls checkResolutions() to find resolved markets
 * 3. TrackRecord UI reads getTrackRecord() to display accuracy stats
 */

export interface PredictionSnapshot {
  /** Polymarket event slug — unique per market */
  slug: string;
  /** Our signal topic headline */
  topic: string;
  /** Category (iran, ukraine, etc.) */
  category: string;
  /** Signal likelihood 0-100 at time of snapshot */
  signalLikelihood: number;
  /** Market probability 0-100 at time of snapshot */
  marketProbability: number;
  /** Alpha score at snapshot time */
  alphaScore: number;
  /** 'signal-higher' | 'market-higher' | 'aligned' */
  alphaDirection: string;
  /** When this snapshot was taken */
  snapshotAt: string;
  /** Polymarket end date */
  endDate: string;
  /** Volume at snapshot time */
  volume: number;
}

export interface ResolvedPrediction {
  slug: string;
  topic: string;
  category: string;
  /** Our prediction at snapshot time */
  signalLikelihood: number;
  /** Market at snapshot time */
  marketProbability: number;
  alphaScore: number;
  alphaDirection: string;
  snapshotAt: string;
  /** When we checked the resolution */
  resolvedAt: string;
  /** Actual outcome probability (0 or 100 for binary markets) */
  actualOutcome: number;
  /** Was Signal closer to the truth than the market? */
  signalWasCloser: boolean;
  /** Signal error = |signalLikelihood - actualOutcome| */
  signalError: number;
  /** Market error = |marketProbability - actualOutcome| */
  marketError: number;
}

export interface TrackRecord {
  /** Total resolved predictions */
  total: number;
  /** How many times Signal was closer to the truth */
  signalWins: number;
  /** How many times Market was closer */
  marketWins: number;
  /** Ties (equal error) */
  ties: number;
  /** Win rate percentage */
  signalWinRate: number;
  /** Average Signal error (lower is better) */
  avgSignalError: number;
  /** Average Market error */
  avgMarketError: number;
  /** Breakdown by category */
  byCategory: Record<string, { total: number; signalWins: number; winRate: number }>;
  /** Last 10 resolved for display */
  recent: ResolvedPrediction[];
}

// ─── KV helpers (same pattern as shock-log.ts) ─────────────────────────────

const SNAPSHOTS_KEY = 'signal:prediction-snapshots';
const RESOLVED_KEY = 'signal:prediction-resolved';
const MAX_SNAPSHOTS = 300;
const MAX_RESOLVED = 200;

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

// ─── In-memory fallback ─────────────────────────────────────────────────────

let memSnapshots: PredictionSnapshot[] = [];
let memResolved: ResolvedPrediction[] = [];

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Save snapshots of current Signal vs Market matches.
 * Called from /api/polymarket on each fetch.
 * Only saves one snapshot per slug (keeps the first/earliest prediction).
 */
export async function savePredictionSnapshots(
  matches: Array<{
    polymarketSlug: string;
    topic: string;
    topicCategory: string;
    signalLikelihood: number;
    marketProbability: number;
    alphaScore: number;
    alphaDirection: string;
    endDate: string;
    volume: number;
  }>
): Promise<void> {
  const existing = (await kvGet<PredictionSnapshot[]>(SNAPSHOTS_KEY)) ?? memSnapshots;
  const existingSlugs = new Set(existing.map(s => s.slug));

  const newSnapshots: PredictionSnapshot[] = [];
  for (const m of matches) {
    if (!m.polymarketSlug || existingSlugs.has(m.polymarketSlug)) continue;
    newSnapshots.push({
      slug: m.polymarketSlug,
      topic: m.topic,
      category: m.topicCategory || 'other',
      signalLikelihood: m.signalLikelihood,
      marketProbability: m.marketProbability,
      alphaScore: m.alphaScore,
      alphaDirection: m.alphaDirection,
      snapshotAt: new Date().toISOString(),
      endDate: m.endDate,
      volume: m.volume,
    });
  }

  if (newSnapshots.length === 0) return;

  const updated = [...existing, ...newSnapshots].slice(-MAX_SNAPSHOTS);
  memSnapshots = updated;
  await kvSet(SNAPSHOTS_KEY, updated);
}

/**
 * Check which snapshots have resolved on Polymarket.
 * Called by weekly cron. Queries Polymarket Gamma API for each stored slug.
 */
export async function checkResolutions(): Promise<{ checked: number; resolved: number; errors: number }> {
  const snapshots = (await kvGet<PredictionSnapshot[]>(SNAPSHOTS_KEY)) ?? memSnapshots;
  const alreadyResolved = (await kvGet<ResolvedPrediction[]>(RESOLVED_KEY)) ?? memResolved;
  const resolvedSlugs = new Set(alreadyResolved.map(r => r.slug));

  // Only check snapshots we haven't resolved yet and whose endDate has passed (or is within 1 day)
  const toCheck = snapshots.filter(s => {
    if (resolvedSlugs.has(s.slug)) return false;
    if (!s.endDate) return false;
    const daysUntilEnd = (new Date(s.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilEnd < 1; // check if end date passed or is within 1 day
  });

  let checked = 0;
  let resolved = 0;
  let errors = 0;
  const newResolved: ResolvedPrediction[] = [];

  for (const snap of toCheck.slice(0, 20)) { // limit to 20 per run to avoid timeout
    checked++;
    try {
      // Query Polymarket Gamma API for this event
      const res = await fetch(
        `https://gamma-api.polymarket.com/events?slug=${encodeURIComponent(snap.slug)}&limit=1`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) { errors++; continue; }

      const events = await res.json();
      const event = events?.[0];
      if (!event) { errors++; continue; }

      // Check if market is resolved (not active, or has a winning outcome)
      const isResolved = event.active === false || event.closed === true;
      if (!isResolved) continue;

      // Get the outcome — first outcome's price (0-1) after resolution
      // In resolved markets, the winning outcome has price ~1.0
      const prices: number[] = typeof event.outcomePrices === 'string'
        ? JSON.parse(event.outcomePrices)
        : event.outcomePrices || [];

      if (prices.length === 0) { errors++; continue; }

      // For binary markets: first outcome price * 100 = actual outcome %
      const actualOutcome = Math.round(prices[0] * 100);

      const signalError = Math.abs(snap.signalLikelihood - actualOutcome);
      const marketError = Math.abs(snap.marketProbability - actualOutcome);

      newResolved.push({
        slug: snap.slug,
        topic: snap.topic,
        category: snap.category,
        signalLikelihood: snap.signalLikelihood,
        marketProbability: snap.marketProbability,
        alphaScore: snap.alphaScore,
        alphaDirection: snap.alphaDirection,
        snapshotAt: snap.snapshotAt,
        resolvedAt: new Date().toISOString(),
        actualOutcome,
        signalWasCloser: signalError < marketError,
        signalError,
        marketError,
      });
      resolved++;
    } catch {
      errors++;
    }
  }

  if (newResolved.length > 0) {
    const updated = [...alreadyResolved, ...newResolved].slice(-MAX_RESOLVED);
    memResolved = updated;
    await kvSet(RESOLVED_KEY, updated);

    // Remove resolved slugs from snapshots
    const resolvedSlugSet = new Set(newResolved.map(r => r.slug));
    const remainingSnapshots = snapshots.filter(s => !resolvedSlugSet.has(s.slug));
    memSnapshots = remainingSnapshots;
    await kvSet(SNAPSHOTS_KEY, remainingSnapshots);
  }

  return { checked, resolved, errors };
}

/**
 * Get the full track record for UI display.
 */
export async function getTrackRecord(): Promise<TrackRecord> {
  const resolved = (await kvGet<ResolvedPrediction[]>(RESOLVED_KEY)) ?? memResolved;

  if (resolved.length === 0) {
    return {
      total: 0, signalWins: 0, marketWins: 0, ties: 0,
      signalWinRate: 0, avgSignalError: 0, avgMarketError: 0,
      byCategory: {}, recent: [],
    };
  }

  let signalWins = 0;
  let marketWins = 0;
  let ties = 0;
  let totalSignalError = 0;
  let totalMarketError = 0;
  const catMap: Record<string, { total: number; signalWins: number }> = {};

  for (const r of resolved) {
    totalSignalError += r.signalError;
    totalMarketError += r.marketError;

    if (r.signalError < r.marketError) {
      signalWins++;
    } else if (r.marketError < r.signalError) {
      marketWins++;
    } else {
      ties++;
    }

    const cat = r.category || 'other';
    if (!catMap[cat]) catMap[cat] = { total: 0, signalWins: 0 };
    catMap[cat].total++;
    if (r.signalError < r.marketError) catMap[cat].signalWins++;
  }

  const byCategory: Record<string, { total: number; signalWins: number; winRate: number }> = {};
  for (const [cat, data] of Object.entries(catMap)) {
    byCategory[cat] = {
      total: data.total,
      signalWins: data.signalWins,
      winRate: data.total > 0 ? Math.round((data.signalWins / data.total) * 100) : 0,
    };
  }

  return {
    total: resolved.length,
    signalWins,
    marketWins,
    ties,
    signalWinRate: Math.round((signalWins / resolved.length) * 100),
    avgSignalError: Math.round(totalSignalError / resolved.length),
    avgMarketError: Math.round(totalMarketError / resolved.length),
    byCategory,
    recent: resolved.slice(-10).reverse(),
  };
}

/**
 * Get count of pending (unresolved) snapshots.
 */
export async function getPendingCount(): Promise<number> {
  const snapshots = (await kvGet<PredictionSnapshot[]>(SNAPSHOTS_KEY)) ?? memSnapshots;
  return snapshots.length;
}
