/**
 * Polymarket Integration Service
 * Fetches prediction market data and compares with our likelihood scores
 * Uses Polymarket's public CLOB API (no key required)
 */

export interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  outcomes: string[];
  outcomePrices: number[];   // 0-1 probability (= market price)
  volume: number;            // total volume traded (USD)
  liquidity: number;
  endDate: string;
  active: boolean;
  category: string;
}

export interface SignalVsMarket {
  topic: string;
  signalLikelihood: number;       // our score 0-100
  marketProbability: number;      // polymarket 0-100
  delta: number;                  // signal - market (positive = we think more likely)
  alphaDirection: 'signal-higher' | 'market-higher' | 'aligned';
  polymarketTitle: string;
  polymarketSlug: string;
  volume: number;
  confidence: number;             // how confident the match is (0-100)
  matchedKeywords: string[];
}

// Keywords to match our topics with Polymarket events
const TOPIC_KEYWORDS: Record<string, string[]> = {
  'iran': ['iran', 'nuclear', 'jcpoa', 'tehran', 'enrichment', 'sanctions'],
  'israel': ['israel', 'israeli', 'netanyahu', 'idf', 'gaza', 'west bank'],
  'saudi': ['saudi', 'arabia', 'mbs', 'normalization', 'abraham accords'],
  'ukraine': ['ukraine', 'russia', 'putin', 'zelensky', 'nato', 'crimea'],
  'china': ['china', 'taiwan', 'beijing', 'xi jinping', 'south china sea'],
  'us-election': ['trump', 'biden', 'election', 'republican', 'democrat', 'presidential'],
  'ai': ['artificial intelligence', 'ai regulation', 'openai', 'chatgpt'],
  'oil': ['oil', 'opec', 'crude', 'energy', 'petroleum', 'barrel'],
  'crypto': ['bitcoin', 'crypto', 'ethereum', 'blockchain'],
  'ceasefire': ['ceasefire', 'hostage', 'hamas', 'truce', 'deal'],
  'hezbollah': ['hezbollah', 'lebanon', 'nasrallah', 'northern border'],
  'syria': ['syria', 'assad', 'damascus', 'rebel'],
  'economy': ['recession', 'inflation', 'fed', 'interest rate', 'gdp'],
};

/**
 * Fetch events from Polymarket Gamma API
 */
export async function fetchPolymarketEvents(): Promise<PolymarketEvent[]> {
  try {
    // Polymarket Gamma API - public, no auth needed
    const res = await fetch(
      'https://gamma-api.polymarket.com/events?closed=false&order=volume&ascending=false&limit=50',
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 600 }, // cache 10 min
      }
    );

    if (!res.ok) {
      console.warn(`Polymarket API returned ${res.status}`);
      return getFallbackEvents();
    }

    const events = await res.json();

    return events
      .filter((e: any) => e.markets && e.markets.length > 0)
      .map((e: any) => {
        const market = e.markets[0];
        const prices = market.outcomePrices
          ? (typeof market.outcomePrices === 'string'
            ? JSON.parse(market.outcomePrices)
            : market.outcomePrices)
          : [0.5, 0.5];

        return {
          id: e.id || market.id,
          title: e.title || market.question,
          slug: e.slug || '',
          outcomes: market.outcomes
            ? (typeof market.outcomes === 'string' ? JSON.parse(market.outcomes) : market.outcomes)
            : ['Yes', 'No'],
          outcomePrices: prices.map((p: any) => parseFloat(p)),
          volume: parseFloat(market.volume || '0'),
          liquidity: parseFloat(market.liquidity || '0'),
          endDate: e.endDate || market.endDate || '',
          active: market.active !== false,
          category: e.category || '',
        };
      })
      .filter((e: PolymarketEvent) => e.outcomePrices.length >= 2);
  } catch (err) {
    console.error('Polymarket fetch error:', err);
    return getFallbackEvents();
  }
}

/**
 * Match our brief stories with Polymarket events
 */
export function matchStoriesWithMarkets(
  stories: Array<{ slug: string; headline: string; likelihood: number; category?: string }>,
  markets: PolymarketEvent[]
): SignalVsMarket[] {
  const matches: SignalVsMarket[] = [];

  for (const story of stories) {
    const storyText = `${story.headline} ${story.slug} ${story.category || ''}`.toLowerCase();

    // Find matching topic keywords
    let bestMatch: PolymarketEvent | null = null;
    let bestScore = 0;
    let bestKeywords: string[] = [];

    for (const market of markets) {
      const marketText = market.title.toLowerCase();
      let matchScore = 0;
      const matched: string[] = [];

      // Check each topic keyword set
      for (const [, keywords] of Object.entries(TOPIC_KEYWORDS)) {
        for (const kw of keywords) {
          const storyHas = storyText.includes(kw);
          const marketHas = marketText.includes(kw);
          if (storyHas && marketHas) {
            matchScore += 2;
            matched.push(kw);
          }
        }
      }

      // Direct word overlap
      const storyWords = new Set(storyText.split(/\s+/).filter(w => w.length > 3));
      const marketWords = marketText.split(/\s+/).filter(w => w.length > 3);
      for (const w of marketWords) {
        if (storyWords.has(w)) {
          matchScore += 1;
          if (!matched.includes(w)) matched.push(w);
        }
      }

      if (matchScore > bestScore) {
        bestScore = matchScore;
        bestMatch = market;
        bestKeywords = matched;
      }
    }

    if (bestMatch && bestScore >= 2) {
      const marketProb = Math.round(bestMatch.outcomePrices[0] * 100);
      const delta = story.likelihood - marketProb;
      const absDelta = Math.abs(delta);

      matches.push({
        topic: story.headline,
        signalLikelihood: story.likelihood,
        marketProbability: marketProb,
        delta,
        alphaDirection: absDelta <= 10 ? 'aligned' : (delta > 0 ? 'signal-higher' : 'market-higher'),
        polymarketTitle: bestMatch.title,
        polymarketSlug: bestMatch.slug,
        volume: bestMatch.volume,
        confidence: Math.min(95, bestScore * 12),
        matchedKeywords: bestKeywords.slice(0, 5),
      });
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Fallback events when API is unreachable
 */
function getFallbackEvents(): PolymarketEvent[] {
  return [
    {
      id: 'fallback-iran',
      title: 'Will Iran develop a nuclear weapon by 2027?',
      slug: 'iran-nuclear',
      outcomes: ['Yes', 'No'],
      outcomePrices: [0.18, 0.82],
      volume: 2400000,
      liquidity: 450000,
      endDate: '2027-12-31',
      active: true,
      category: 'geopolitics',
    },
    {
      id: 'fallback-ceasefire',
      title: 'Will there be a ceasefire in Gaza before July 2025?',
      slug: 'gaza-ceasefire',
      outcomes: ['Yes', 'No'],
      outcomePrices: [0.42, 0.58],
      volume: 5100000,
      liquidity: 890000,
      endDate: '2025-07-01',
      active: true,
      category: 'geopolitics',
    },
    {
      id: 'fallback-saudi',
      title: 'Will Saudi Arabia normalize relations with Israel by 2026?',
      slug: 'saudi-israel',
      outcomes: ['Yes', 'No'],
      outcomePrices: [0.23, 0.77],
      volume: 1800000,
      liquidity: 320000,
      endDate: '2026-12-31',
      active: true,
      category: 'geopolitics',
    },
    {
      id: 'fallback-ukraine',
      title: 'Will there be a Ukraine-Russia ceasefire by end of 2025?',
      slug: 'ukraine-ceasefire',
      outcomes: ['Yes', 'No'],
      outcomePrices: [0.31, 0.69],
      volume: 8900000,
      liquidity: 1200000,
      endDate: '2025-12-31',
      active: true,
      category: 'geopolitics',
    },
    {
      id: 'fallback-recession',
      title: 'Will the US enter a recession in 2025?',
      slug: 'us-recession',
      outcomes: ['Yes', 'No'],
      outcomePrices: [0.28, 0.72],
      volume: 6200000,
      liquidity: 980000,
      endDate: '2025-12-31',
      active: true,
      category: 'economy',
    },
  ];
}
