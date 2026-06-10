/**
 * Polymarket Integration Service
 * Fetches prediction market data and compares with our likelihood scores
 * Uses Polymarket's public CLOB API (no key required)
 */

import { computeIntelEnhancement, type EarlyMover } from './signal-intelligence';

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

export interface AlphaBreakdown {
  deltaScore: number;    // 0-50: contribution from Signal/Market gap
  volumeScore: number;   // 0-25: how committed the market is (high vol = meaningful divergence)
  sourceScore: number;   // 0-15: how many RSS sources back our Signal
  matchScore: number;    // 0-10: keyword match quality between story and market
}

export interface SignalThesis {
  headline: string;           // top driving headline (he or en)
  sentiment: string;          // 'שלילי רוב' / 'חיובי רוב' / 'מעורב'
  sourceSpread: string;       // e.g. '3ש 2מ 1י — חוצה קווים' or '5 מקורות ימין בלבד'
  echoNote?: string;          // cross-media echo if present
  narrativeNote?: string;     // narrative split if present
  keyFactors: string[];       // 2-3 specific bullet points driving Signal's view
}

export interface MarketThesis {
  impliedView: string;        // what the market's price implies ("השוק מאמין ש...")
  volumeLabel: string;        // e.g. '$2.3M נפח'
  commitment: string;         // 'שוק מחויב / דל / בינוני'
  counterArgument: string;    // what the market might know that RSS doesn't
}

export interface SignalVsMarket {
  topic: string;
  storySlug: string;              // slug of the matched BriefStory (for watchlist cross-reference)
  topicCategory: string;          // which TOPIC_KEYWORDS category matched best (e.g. 'iran', 'ukraine')
  signalLikelihood: number;       // our score 0-100
  marketProbability: number;      // polymarket 0-100
  delta: number;                  // signal - market (positive = we think more likely)
  alphaDirection: 'signal-higher' | 'market-higher' | 'aligned';
  alphaScore: number;             // 0-100 — how significant is the divergence
  alphaBreakdown: AlphaBreakdown; // component breakdown of the alpha score
  whyDifferent: string;           // auto-generated explanation (paragraphs separated by \n\n)
  signalThesis?: SignalThesis;    // structured Signal argument
  marketThesis?: MarketThesis;    // structured Market argument
  polymarketTitle: string;
  polymarketSlug: string;
  polymarketUrl: string;          // direct link to the market
  volume: number;
  liquidity: number;
  endDate: string;
  confidence: number;             // how confident the match is (0-100)
  matchedKeywords: string[];
  sourceCount: number;            // how many RSS sources back our Signal
  intelBoost: number;             // 0-15 boost from bias-adjusted + early mover signals
  intelSummary: string;           // one-line summary of intelligence enhancements
}

// Keywords to match our topics with Polymarket events (English + Hebrew)
const TOPIC_KEYWORDS: Record<string, string[]> = {
  'iran': ['iran', 'nuclear', 'jcpoa', 'tehran', 'enrichment', 'sanctions', 'איראן', 'גרעין', 'טהרן', 'העשרה'],
  'israel': ['israel', 'israeli', 'netanyahu', 'idf', 'gaza', 'west bank', 'ישראל', 'נתניהו', 'צהל', 'עזה', 'גדה'],
  'saudi': ['saudi', 'arabia', 'mbs', 'normalization', 'abraham accords', 'סעודיה', 'נורמליזציה', 'הסכמי אברהם'],
  'ukraine': ['ukraine', 'russia', 'putin', 'zelensky', 'nato', 'crimea', 'אוקראינה', 'רוסיה', 'פוטין', 'נאטו'],
  'china': ['china', 'taiwan', 'beijing', 'xi jinping', 'south china sea', 'סין', 'טייוואן', 'בייג\'ינג'],
  'us-election': ['trump', 'biden', 'election', 'republican', 'democrat', 'presidential', 'טראמפ', 'בחירות', 'קונגרס'],
  'ai': ['artificial intelligence', 'ai regulation', 'openai', 'chatgpt', 'בינה מלאכותית', 'בינה'],
  'oil': ['oil', 'opec', 'crude', 'energy', 'petroleum', 'barrel', 'נפט', 'אנרגיה', 'אופ\'ק', 'חביות'],
  'crypto': ['bitcoin', 'crypto', 'ethereum', 'blockchain', 'ביטקוין', 'קריפטו', 'בלוקצ\'יין'],
  'ceasefire': ['ceasefire', 'hostage', 'hamas', 'truce', 'deal', 'הפסקת אש', 'חטופים', 'חמאס', 'עסקה', 'שבויים'],
  'hezbollah': ['hezbollah', 'lebanon', 'nasrallah', 'northern border', 'חיזבאללה', 'לבנון', 'נסראללה', 'הצפון'],
  'syria': ['syria', 'assad', 'damascus', 'rebel', 'סוריה', 'אסד', 'דמשק'],
  'economy': ['recession', 'inflation', 'fed', 'interest rate', 'gdp', 'מיתון', 'אינפלציה', 'ריבית', 'תוצר'],
  'hamas': ['hamas', 'sinwar', 'rafah', 'חמאס', 'רפיח', 'סינוואר', 'פלסטין'],
  'elections-israel': ['כנסת', 'בחירות', 'ממשלה', 'קואליציה', 'אופוזיציה', 'polling', 'coalition'],
};

// Sector → stock tickers mapping for Israeli/global markets
export const SECTOR_STOCKS: Record<string, { label: string; tickers: string[] }> = {
  'מניות ביטחון ישראליות': { label: 'ביטחון IL', tickers: ['ESLT', 'MNTC', 'AVAV'] },
  'מחירי נפט וגז':         { label: 'אנרגיה',    tickers: ['XOM', 'CVX', 'OIL'] },
  'מניות שבבים ישראליות':  { label: 'שבבים IL',   tickers: ['NVMI', 'TSEM', 'INTC'] },
  'שקל (מול דולר)':        { label: 'USD/ILS',    tickers: ['USD/ILS'] },
  'תיירות נכנסת לישראל':   { label: 'תיירות',     tickers: ['ELAL.TA', 'DAL'] },
  'מדד הנדל"ן':            { label: 'נדל"ן',      tickers: ['IYR', 'REIT'] },
  'פרמיות סיכון':          { label: 'ריבית',      tickers: ['TLT', 'AGG'] },
  'מניות ביטחון':          { label: 'ביטחון',     tickers: ['LMT', 'RTX', 'NOC'] },
  'חברות שבבים':           { label: 'שבבים',      tickers: ['NVDA', 'AMD', 'TSM'] },
  'גיוס בהייטק':           { label: 'הייטק',      tickers: ['QQQ', 'XLK'] },
  'מדד נאסד"ק':            { label: 'נאסד"ק',     tickers: ['QQQ', 'TQQQ'] },
  'ביטוח ואשראי':          { label: 'פיננסים',    tickers: ['XLF', 'JPM'] },
};

/**
 * Fetch events from Polymarket Gamma API
 */
const GEO_TAGS = ['politics', 'middle-east', 'elections', 'science', 'economics'];

function parseEvents(events: any[]): PolymarketEvent[] {
  return events
    .filter((e: any) => e.markets && e.markets.length > 0)
    .map((e: any) => {
      const market = e.markets[0];
      let prices: number[];
      try {
        prices = market.outcomePrices
          ? (typeof market.outcomePrices === 'string'
            ? JSON.parse(market.outcomePrices)
            : market.outcomePrices)
          : [0.5, 0.5];
      } catch {
        prices = [0.5, 0.5];
      }
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
}

export async function fetchPolymarketEvents(): Promise<PolymarketEvent[]> {
  try {
    // Fetch geopolitical markets from multiple relevant tags in parallel
    const results = await Promise.allSettled(
      GEO_TAGS.map(tag =>
        fetch(
          `https://gamma-api.polymarket.com/events?closed=false&limit=15&tag_slug=${tag}`,
          { headers: { 'Accept': 'application/json' }, cache: 'no-store' }
        ).then(r => r.ok ? r.json() : [])
      )
    );

    const allEvents: any[] = [];
    const seenIds = new Set<string>();

    for (const result of results) {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        for (const e of result.value) {
          const id = e.id || e.slug;
          if (id && !seenIds.has(id)) {
            seenIds.add(id);
            allEvents.push(e);
          }
        }
      }
    }

    if (allEvents.length === 0) {
      console.warn('[Polymarket] No events from geo tags, using fallback');
      return getFallbackEvents();
    }

    const parsed = parseEvents(allEvents);
    console.log(`[Polymarket] Fetched ${parsed.length} geo markets from ${GEO_TAGS.length} tags`);
    return parsed;
  } catch (err) {
    console.error('Polymarket fetch error:', err);
    return getFallbackEvents();
  }
}

/**
 * Match our brief stories with Polymarket events
 */
export function matchStoriesWithMarkets(
  stories: Array<{
    slug: string;
    headline: string;
    likelihood: number;
    category?: string;
    sourceCount?: number;
    sources?: Array<{ name: string }>;
    sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
    // Rich story data for thesis generation
    leanBreakdown?: { left: number; center: number; right: number };
    narrativeSplit?: { rightSource: string; leftSource: string; gapPct: number };
    crossMediaEcho?: { direction: string; delayMinutes: number; firstSourceName: string };
    firstMover?: { sourceName: string; minsAhead: number };
    negativeRatio?: number; // 0-1
    topHeadlines?: string[]; // up to 3 driving headlines
  }>,
  markets: PolymarketEvent[],
  earlyMovers?: EarlyMover[],
): SignalVsMarket[] {
  const matches: SignalVsMarket[] = [];

  for (const story of stories) {
    // Normalize slug: replace hyphens with spaces so "iran-nuclear" → "iran nuclear"
    const slugNorm = (story.slug || '').replace(/-/g, ' ');
    const storyText = `${story.headline} ${slugNorm} ${story.category || ''}`.toLowerCase();

    // Find matching topic keywords
    let bestMatch: PolymarketEvent | null = null;
    let bestScore = 0;
    let bestKeywords: string[] = [];
    let bestCategory = 'other';

    for (const market of markets) {
      const marketText = (market.title + ' ' + (market.category || '')).toLowerCase();
      let matchScore = 0;
      const matched: string[] = [];
      const categoryScores: Record<string, number> = {};

      // Check each topic keyword set
      for (const [category, keywords] of Object.entries(TOPIC_KEYWORDS)) {
        for (const kw of keywords) {
          const storyHas = storyText.includes(kw);
          const marketHas = marketText.includes(kw);
          if (storyHas && marketHas) {
            matchScore += 2;
            matched.push(kw);
            categoryScores[category] = (categoryScores[category] || 0) + 2;
          } else if (storyHas) {
            // Partial: keyword in story but not market — small bonus for category context
            categoryScores[category] = (categoryScores[category] || 0) + 0.5;
          }
        }
      }

      // Direct word overlap (normalized)
      const storyWords = new Set(storyText.split(/\s+/).filter(w => w.length > 3));
      const marketWords = marketText.split(/\s+/).filter(w => w.length > 3);
      for (const w of marketWords) {
        if (storyWords.has(w)) {
          matchScore += 1;
          if (!matched.includes(w)) matched.push(w);
        }
      }

      // Require at least one genuine topic-category keyword hit in both texts
      const hasCategoryHit = Object.values(categoryScores).some(s => s >= 2);
      if (matchScore > bestScore && hasCategoryHit) {
        bestScore = matchScore;
        bestMatch = market;
        bestKeywords = matched;
        bestCategory = Object.entries(categoryScores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'other';
      }
    }

    // Lowered threshold from 4 → 2: one strong keyword match is sufficient
    if (bestMatch && bestScore >= 2) {
      const marketProb = Math.round(bestMatch.outcomePrices[0] * 100);
      const delta = story.likelihood - marketProb;
      const absDelta = Math.abs(delta);
      const direction: SignalVsMarket['alphaDirection'] = absDelta <= 10 ? 'aligned' : (delta > 0 ? 'signal-higher' : 'market-higher');

      // --- New Alpha Score formula (4 named components + intel boost, max 100) ---
      const srcCount = story.sourceCount || 3;
      const breakdown = computeAlphaBreakdown(absDelta, bestMatch.volume, srcCount, bestScore);
      const baseAlpha = breakdown.deltaScore + breakdown.volumeScore + breakdown.sourceScore + breakdown.matchScore;

      // Intel enhancement: bias-adjusted signal + early mover boost
      const intel = computeIntelEnhancement(
        story.sources || [],
        bestCategory,
        story.sentiment || 'neutral',
        earlyMovers || [],
      );
      const alphaScore = Math.min(100, baseAlpha + intel.intelBoost);

      // Generate structured explanation for why Signal differs from Market
      const whyDifferent = generateWhyDifferent(direction, absDelta, story.likelihood, marketProb, bestMatch, srcCount);

      // Build structured thesis objects for the "Signal vs Market" card
      const signalThesis = buildSignalThesis(story, direction);
      const marketThesis = buildMarketThesis(bestMatch, marketProb, direction, absDelta);

      // Confidence: asymptotic scale — requires 3+ keywords + penalises thin markets
      const rawConf = Math.round((bestScore / (bestScore + 4)) * 100);
      const thinPenalty = bestMatch.volume < 50_000 ? 15 : 0;
      const confidence = Math.min(88, Math.max(15, rawConf - thinPenalty));

      matches.push({
        topic: story.headline,
        storySlug: story.slug,
        topicCategory: bestCategory,
        signalLikelihood: story.likelihood,
        marketProbability: marketProb,
        delta,
        alphaDirection: direction,
        alphaScore,
        alphaBreakdown: breakdown,
        whyDifferent,
        signalThesis,
        marketThesis,
        polymarketTitle: bestMatch.title,
        polymarketSlug: bestMatch.slug,
        polymarketUrl: bestMatch.slug
          ? `https://polymarket.com/event/${bestMatch.slug}`
          : 'https://polymarket.com',
        volume: bestMatch.volume,
        liquidity: bestMatch.liquidity,
        endDate: bestMatch.endDate,
        confidence,
        matchedKeywords: bestKeywords.slice(0, 5),
        sourceCount: srcCount,
        intelBoost: intel.intelBoost,
        intelSummary: intel.intelSummary,
      });
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Compute alpha score breakdown — 4 named components totalling max 100 pts
 */
function computeAlphaBreakdown(
  absDelta: number,
  volume: number,
  sourceCount: number,
  keywordMatchScore: number,
): AlphaBreakdown {
  // Delta (0-50): core disagreement size
  const deltaScore = Math.min(50, absDelta);

  // Volume (0-25): how committed is the market?
  // High vol = market is right with conviction → divergence is more meaningful
  const volumeScore =
    volume > 10_000_000 ? 25 :
    volume >  5_000_000 ? 20 :
    volume >  1_000_000 ? 14 :
    volume >    100_000 ?  8 :
    volume >     10_000 ?  4 : 2;

  // Sources (0-15): how many independent RSS sources back our read?
  const sourceScore = Math.min(15, Math.round(sourceCount * 2.5));

  // Match quality (0-10): how well does the story actually match this market?
  const matchScore = Math.min(10, Math.round(keywordMatchScore * 1.2));

  return {
    deltaScore,
    volumeScore,
    sourceScore,
    matchScore,
  };
}

/**
/**
 * Build the Signal thesis — what our RSS analysis actually sees.
 */
function buildSignalThesis(
  story: Parameters<typeof matchStoriesWithMarkets>[0][number],
  direction: SignalVsMarket['alphaDirection'],
): SignalThesis {
  const lb = story.leanBreakdown;
  const srcCount = story.sourceCount || 0;

  // Source spread label
  let sourceSpread: string;
  if (lb && (lb.left + lb.center + lb.right) > 0) {
    const parts: string[] = [];
    if (lb.left   > 0) parts.push(`${lb.left}ש`);
    if (lb.center > 0) parts.push(`${lb.center}מ`);
    if (lb.right  > 0) parts.push(`${lb.right}י`);
    const total = lb.left + lb.center + lb.right;
    const isCrossSpectrum = lb.left > 0 && lb.right > 0;
    sourceSpread = parts.join(' ') + (isCrossSpectrum ? ' — חוצה קווים פוליטיים' : ` — ${total} מקורות`);
  } else {
    sourceSpread = `${srcCount} מקורות`;
  }

  // Sentiment label
  const sent = story.sentiment || 'neutral';
  const sentimentLabel =
    sent === 'negative' ? 'סנטימנט שלילי רוב' :
    sent === 'positive' ? 'סנטימנט חיובי רוב' :
    sent === 'mixed'    ? 'סנטימנט מעורב' : 'סנטימנט נייטרלי';

  // Key factors driving Signal's view
  const keyFactors: string[] = [];

  if (direction === 'signal-higher') {
    if (srcCount >= 6) keyFactors.push(`כיסוי רחב — ${srcCount} מקורות עצמאיים מדווחים`);
    else if (srcCount >= 3) keyFactors.push(`${srcCount} מקורות מאשרים את ההתפתחות`);
    else keyFactors.push(`${srcCount} מקורות בלבד — סיגנל מוקדם אפשרי`);

    if (story.crossMediaEcho?.direction === 'indie-first') {
      keyFactors.push(`תקשורת עצמאית הקדימה ב-${story.crossMediaEcho.delayMinutes >= 60 ? `${Math.round(story.crossMediaEcho.delayMinutes / 60)}ש'` : `${story.crossMediaEcho.delayMinutes}ד'`} — מנגנון חדירה לממסד`);
    }
    if (lb && lb.left > 0 && lb.right > 0) {
      keyFactors.push('כיסוי חוצה שמאל ו-ימין — אינדיקטור אמינות גבוה');
    }
    if (story.narrativeSplit) {
      keyFactors.push(`פיצול נרטיבי ${story.narrativeSplit.gapPct}% בין ${story.narrativeSplit.rightSource} ל-${story.narrativeSplit.leftSource}`);
    }
  } else if (direction === 'market-higher') {
    keyFactors.push(`כיסוי תקשורתי ${srcCount <= 2 ? 'חלש — ייתכן מידע מחוץ לRSS' : 'בינוני'}`);
    if (sent === 'negative') keyFactors.push('סנטימנט שלילי — מנגד לציפיות השוק');
    keyFactors.push('שוק עשוי לתמחר מידע דיפלומטי שלא פורסם');
  } else {
    keyFactors.push('Signal והשוק מסכימים — אין הזדמנות Alpha');
  }

  // Echo note
  const echoNote = story.crossMediaEcho
    ? `🔁 ${story.crossMediaEcho.direction === 'indie-first' ? 'עצמאי → ממסד' : 'ממסד → עצמאי'} (${story.crossMediaEcho.delayMinutes}ד')`
    : undefined;

  const narrativeNote = story.narrativeSplit
    ? `פיצול ${story.narrativeSplit.gapPct}% בין ${story.narrativeSplit.rightSource} ל-${story.narrativeSplit.leftSource}`
    : undefined;

  return {
    headline: story.topHeadlines?.[0] || story.headline,
    sentiment: sentimentLabel,
    sourceSpread,
    echoNote,
    narrativeNote,
    keyFactors: keyFactors.slice(0, 3),
  };
}

/**
 * Build the Market thesis — what the prediction market is pricing in.
 */
function buildMarketThesis(
  market: PolymarketEvent,
  marketProb: number,
  direction: SignalVsMarket['alphaDirection'],
  absDelta: number,
): MarketThesis {
  const vol = market.volume;
  const volumeLabel =
    vol > 10_000_000 ? `$${(vol / 1_000_000).toFixed(1)}M נפח` :
    vol >  1_000_000 ? `$${(vol / 1_000_000).toFixed(1)}M נפח` :
    vol >    100_000 ? `$${(vol / 1_000).toFixed(0)}K נפח` :
    vol >     10_000 ? `$${(vol / 1_000).toFixed(0)}K נפח` : `<$10K נפח`;

  const commitment =
    vol > 5_000_000 ? 'שוק עמוק — מחויבות גבוהה' :
    vol > 500_000   ? 'שוק בינוני' :
    vol > 50_000    ? 'שוק קטן' : 'שוק דל — מחויבות נמוכה';

  // What the market implies
  const impliedView = marketProb >= 70
    ? `השוק בטוח (${marketProb}%) שהאירוע יתרחש`
    : marketProb >= 40
    ? `השוק ניטרלי (${marketProb}%) — לא משוכנע לכאן או לכאן`
    : `השוק ספקן (${marketProb}%) שהאירוע יתרחש`;

  // Counter-argument
  let counterArgument: string;
  if (direction === 'signal-higher') {
    counterArgument = vol > 2_000_000
      ? `שוק עמוק עם $${(vol / 1_000_000).toFixed(1)}M — הסוחרים עלולים לדעת יותר ממה שה-RSS מכסה`
      : `ייתכן שהשוק מתמחר מידע מאחורי הקלעים שלא הגיע עדיין לכותרות`;
  } else if (direction === 'market-higher') {
    counterArgument = `RSS שלנו עלול לפגר אחרי ציפיות השוק — בדוק אם יש פיתוח ש-${Math.round(absDelta)}% מהשוק כבר יודע`;
  } else {
    counterArgument = 'שניהם מסכימים — קונסנסוס חזק';
  }

  return { impliedView, volumeLabel, commitment, counterArgument };
}

/**
 * Generate structured explanation for why Signal differs from Market.
 * Returns paragraphs separated by \n\n — component splits and renders each.
 */
function generateWhyDifferent(
  direction: SignalVsMarket['alphaDirection'],
  absDelta: number,
  signalLikelihood: number,
  marketProb: number,
  market: PolymarketEvent,
  sourceCount: number,
): string {
  const volLabel =
    market.volume > 10_000_000 ? 'גבוה מאוד (>$10M)' :
    market.volume >  1_000_000 ? 'גבוה ($1M-$10M)' :
    market.volume >    100_000 ? 'בינוני ($100K-$1M)' :
    market.volume >     10_000 ? 'נמוך ($10K-$100K)' : 'דל מאוד (<$10K)';

  const sourceStrength =
    sourceCount >= 8 ? 'גבוה מאוד' :
    sourceCount >= 5 ? 'גבוה' :
    sourceCount >= 3 ? 'בינוני' : 'חלש';

  if (direction === 'aligned') {
    return [
      `✓ Signal מסכים עם השוק — פער של ${absDelta}% בלבד (מתחת לסף המהותיות של 10%).`,
      `כיסוי תקשורתי ${sourceStrength} (${sourceCount} מקורות). נפח שוק ${volLabel}. `,
      `כאשר Signal והשוק מסכימים, הסיכוי גבוה שהתחזית מדויקת — אך אין כאן הזדמנות Alpha.`,
    ].join('\n\n');
  }

  const sections: string[] = [];

  if (direction === 'signal-higher') {
    // Section 1: What Signal sees
    sections.push(
      sourceCount >= 6
        ? `📡 Signal רואה: ${sourceCount} מקורות עצמאיים מדווחים על התפתחויות בנושא זה עם ביטחון ${sourceStrength}. כיסוי רחב כזה מצביע על שינוי בשטח שטרם חלחל לקונסנסוס השוק.`
        : sourceCount >= 3
        ? `📡 Signal רואה: ${sourceCount} מקורות מדווחים על הנושא. אמנם הכיסוי אינו רחב במיוחד, אך הסיגנל עקבי.`
        : `📡 Signal רואה: ${sourceCount} מקורות בלבד — זהירות. ייתכן שמדובר בסיגנל מוקדם.`
    );

    // Section 2: What the market prices
    sections.push(
      market.volume > 5_000_000
        ? `📈 השוק מתמחר: ${marketProb}% — שוק עמוק (נפח ${volLabel}). סוחרים מחויבים חזק. פער של ${absDelta}% מול שוק כה נזיל הוא הזדמנות Alpha משמעותית, אך גם אזהרה: השוק אולי יודע משהו שה-RSS לא מכסה.`
        : market.volume > 100_000
        ? `📈 השוק מתמחר: ${marketProb}% עם נפח ${volLabel}. שוק בעל גודל סביר — הפיגור אחרי החדשות אפשרי.`
        : `📈 השוק מתמחר: ${marketProb}% אך הנפח דל (${volLabel}). שוק דק עלול לפגר אחרי הכיסוי התקשורתי ולא לשקף מידע חדש.`
    );

    // Section 3: Gap analysis
    sections.push(
      market.volume < 100_000
        ? `⚡ הפער (${absDelta}%): לשוק דל אין מספיק סוחרים לעדכן מחירים בזמן אמת. Signal מנתח ${sourceCount} מקורות RSS — הפיד החדשותי לרוב מקדים את שוקי התחזיות בשוקים קטנים.`
        : `⚡ הפער (${absDelta}%): Signal מזהה כיסוי חדשותי ${sourceStrength} שלא בא לידי ביטוי בתמחור השוק. ייתכן שמדובר בפיגור שהשוק יתקן, או בשוק שמעריך גורמים שה-RSS לא מודד (כמו גורמי מדיניות מאחורי הקלעים).`
    );
  } else {
    // market-higher

    sections.push(
      sourceCount <= 2
        ? `📡 Signal רואה: ${sourceCount} מקורות בלבד — כיסוי ${sourceStrength}. ייתכן שהחדשות טרם חלחלו למקורות שאנו מנטרים, או שמדובר בנושא שמכוסה בערוצים שאינם ב-RSS שלנו.`
        : `📡 Signal רואה: ${sourceCount} מקורות עם ביטחון ${sourceStrength} — ניתוח הסנטימנט מצביע על מגמה שונה ממה שהשוק מתמחר.`
    );

    sections.push(
      market.volume > 5_000_000
        ? `📈 השוק מתמחר: ${marketProb}% עם נפח עצום (${volLabel}). שוק עמוק כזה לרוב אינו טועה — הסוחרים מחויבים חזק לעמדה זו ומביאים מידע שה-RSS שלנו לא מכסה.`
        : `📈 השוק מתמחר: ${marketProb}% עם נפח ${volLabel}. הנפח הסביר מצביע על שוק שיכול לטעות, אך גם על קונסנסוס מסוים.`
    );

    sections.push(
      market.volume > 5_000_000
        ? `⚡ הפער (${absDelta}%): במקרים כאלה — שוק עמוק vs. כיסוי RSS מוגבל — כדאי לשקול ששוק הניבוי "יודע" יותר. זה יכול להיות alpha לנגד עינינו, או שה-RSS שלנו מפספס הקשר רחב יותר.`
        : `⚡ הפער (${absDelta}%): ייתכן שה-RSS מפגר אחרי ציפיות השוק, במיוחד בנושאים שמונעים ממידע שאינו ציבורי. מומלץ לבחון האם יש חדשות שלא כוסו.`
    );
  }

  return sections.join('\n\n');
}

/**
 * Get top alpha opportunity for email summary
 */
export function getTopAlpha(matches: SignalVsMarket[]): SignalVsMarket | null {
  const nonAligned = matches.filter(m => m.alphaDirection !== 'aligned' && m.alphaScore >= 30);
  return nonAligned.sort((a, b) => b.alphaScore - a.alphaScore)[0] || null;
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
