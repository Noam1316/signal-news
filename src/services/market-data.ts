/**
 * Market Data Service
 * Fetches real-time financial market data from Yahoo Finance (no API key needed).
 * Tracks geopolitically relevant instruments: oil, gold, VIX, ILS, TA-125, defense stocks, bonds.
 */

export interface MarketInstrument {
  symbol: string;
  name: string;
  nameHe: string;
  price: number;
  change: number;       // absolute change
  changePct: number;    // % change (e.g. 2.3 = +2.3%)
  currency: string;
  category: 'safe-haven' | 'israel' | 'defense' | 'bonds' | 'energy';
  relevantTopics: string[];
}

// Instruments to track
const INSTRUMENTS: Array<{
  symbol: string;
  name: string;
  nameHe: string;
  currency: string;
  category: MarketInstrument['category'];
  relevantTopics: string[];
}> = [
  // Energy
  { symbol: 'CL=F',     name: 'WTI Crude Oil',      nameHe: 'נפט WTI',          currency: 'USD', category: 'energy',     relevantTopics: ['Iran Nuclear', 'Saudi Normalization', 'Ukraine/Russia', 'Syria', 'Turkey/Egypt'] },
  // Safe Haven
  { symbol: 'GC=F',     name: 'Gold',                nameHe: 'זהב',              currency: 'USD', category: 'safe-haven', relevantTopics: ['Iran Nuclear', 'Gaza Conflict', 'Lebanon/Hezbollah', 'Ukraine/Russia', 'Security', 'West Bank'] },
  { symbol: '^VIX',     name: 'VIX Fear Index',      nameHe: 'מדד פחד VIX',      currency: 'USD', category: 'safe-haven', relevantTopics: ['Iran Nuclear', 'US Politics', 'Ukraine/Russia', 'China', 'Economy'] },
  // Israeli Market
  { symbol: 'ILS=X',    name: 'USD/ILS',             nameHe: 'דולר/שקל',         currency: 'ILS', category: 'israel',     relevantTopics: ['Gaza Conflict', 'Lebanon/Hezbollah', 'West Bank', 'Iran Nuclear', 'Judicial Reform'] },
  { symbol: '^TA125.TA',name: 'TA-125',              nameHe: 'מדד ת"א 125',      currency: 'ILS', category: 'israel',     relevantTopics: ['Gaza Conflict', 'Lebanon/Hezbollah', 'West Bank', 'Economy', 'Judicial Reform'] },
  { symbol: 'ESLT',     name: 'Elbit Systems',       nameHe: 'אלביט מערכות',     currency: 'USD', category: 'defense',    relevantTopics: ['Gaza Conflict', 'Lebanon/Hezbollah', 'West Bank', 'Security', 'Iran Nuclear'] },
  // US Defense
  { symbol: 'RTX',      name: 'RTX (Raytheon)',      nameHe: 'ריית\'און',        currency: 'USD', category: 'defense',    relevantTopics: ['Iran Nuclear', 'Ukraine/Russia', 'Security', 'Lebanon/Hezbollah'] },
  { symbol: 'LMT',      name: 'Lockheed Martin',     nameHe: 'לוקהיד מרטין',    currency: 'USD', category: 'defense',    relevantTopics: ['Iran Nuclear', 'Ukraine/Russia', 'Security'] },
  // Bonds
  { symbol: 'TLT',      name: 'US 20yr Treasury',    nameHe: 'אג"ח ארה"ב 20 שנה', currency: 'USD', category: 'bonds',   relevantTopics: ['US Politics', 'Economy', 'Ukraine/Russia'] },
  { symbol: '^TNX',     name: 'US 10yr Yield',       nameHe: 'תשואת אג"ח 10 שנה', currency: '%',  category: 'bonds',   relevantTopics: ['Economy', 'US Politics'] },
];

// In-memory cache
let _cache: { data: MarketInstrument[]; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function fetchMarketData(): Promise<MarketInstrument[]> {
  if (_cache && Date.now() - _cache.timestamp < CACHE_TTL) {
    return _cache.data;
  }

  const results: MarketInstrument[] = [];

  // Fetch in parallel, batched to avoid rate limits
  const chunks = chunkArray(INSTRUMENTS, 5);
  for (const chunk of chunks) {
    const fetched = await Promise.allSettled(
      chunk.map(inst => fetchYahooQuote(inst.symbol))
    );
    for (let i = 0; i < chunk.length; i++) {
      const inst = chunk[i];
      const res = fetched[i];
      if (res.status === 'fulfilled' && res.value) {
        results.push({
          ...inst,
          price: res.value.price,
          change: res.value.change,
          changePct: res.value.changePct,
        });
      }
    }
  }

  if (results.length > 0) {
    _cache = { data: results, timestamp: Date.now() };
  }

  return results;
}

/** Filter instruments relevant to a list of topics */
export function getRelevantInstruments(
  allInstruments: MarketInstrument[],
  topics: string[]
): MarketInstrument[] {
  if (!topics || topics.length === 0) return [];
  const topicSet = new Set(topics);
  return allInstruments.filter(inst =>
    inst.relevantTopics.some(t => topicSet.has(t))
  );
}

// ── Yahoo Finance fetch ──────────────────────────────────────────────────────

async function fetchYahooQuote(symbol: string): Promise<{ price: number; change: number; changePct: number } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice ?? meta.previousClose ?? 0;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prevClose;
    const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;
    return { price, change, changePct };
  } catch {
    return null;
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
