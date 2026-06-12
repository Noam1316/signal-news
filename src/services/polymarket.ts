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
  signalRaw?: number;             // original uncalibrated Signal score
  calibrationNote?: string;       // why/how the score was adjusted
  questionDirection?: string;     // detected question direction (for display)
  coverageVelocity?: number | null; // >1 accelerating, <1 decelerating
  velocityDelta?: number;         // pts added/removed due to velocity
  // Multi-story aggregation
  aggregatedStoryCount?: number;  // how many stories contributed to this signal
  contributingHeadlines?: string[]; // up to 3 secondary story headlines
  // Trend direction
  trendDelta?: number;            // pts change since last sample (positive = rising)
  trendDirection?: 'rising' | 'falling' | 'stable'; // direction label
  // Momentum comparison: direction-of-change of coverage vs market over 24h
  momentum?: MomentumComparison;
}

export type MomentumState =
  | 'signal-leads'    // coverage accelerating, market hasn't moved — the interesting signal
  | 'confirmed'       // both moving in the same direction
  | 'market-leads'    // market moved without matching news coverage
  | 'diverging'       // moving in opposite directions
  | 'quiet';          // neither moving

export interface MomentumComparison {
  signalDelta: number;   // story signal index change over window (pts)
  marketDelta: number;   // market probability change over window (pts)
  windowHours: number;
  state: MomentumState;
  note: string;          // Hebrew one-liner interpretation
}

/**
 * Classify momentum: compare direction-of-change of news coverage (signal index)
 * vs market probability. This is the honest comparison — levels are not
 * comparable (intensity vs probability), but *movement* is.
 */
export function classifyMomentum(
  signalDelta: number,
  marketDelta: number,
  windowHours = 24,
): MomentumComparison {
  const sigMoving = Math.abs(signalDelta) >= 5;
  const mktMoving = Math.abs(marketDelta) >= 3;

  let state: MomentumState;
  let note: string;

  if (sigMoving && !mktMoving) {
    state = 'signal-leads';
    note = signalDelta > 0
      ? `הכיסוי מאיץ (+${signalDelta}) אבל השוק סטטי — השוק עוד לא הגיב לחדשות`
      : `הכיסוי דועך (${signalDelta}) אבל השוק סטטי — העניין התקשורתי שוכך`;
  } else if (!sigMoving && mktMoving) {
    state = 'market-leads';
    note = `השוק זז (${marketDelta > 0 ? '+' : ''}${marketDelta}%) בלי שינוי בכיסוי — ייתכן מידע שלא הגיע ל-RSS`;
  } else if (sigMoving && mktMoving) {
    const sameDirection = Math.sign(signalDelta) === Math.sign(marketDelta);
    if (sameDirection) {
      state = 'confirmed';
      note = `חדשות ושוק זזים יחד (${signalDelta > 0 ? '+' : ''}${signalDelta} / ${marketDelta > 0 ? '+' : ''}${marketDelta}%) — הסיגנל מאומת`;
    } else {
      state = 'diverging';
      note = `סתירה: כיסוי ${signalDelta > 0 ? 'עולה' : 'יורד'} אבל השוק ${marketDelta > 0 ? 'עולה' : 'יורד'} — אחד הצדדים טועה`;
    }
  } else {
    state = 'quiet';
    note = 'גם הכיסוי וגם השוק יציבים';
  }

  return { signalDelta, marketDelta, windowHours, state, note };
}

/**
 * Source quality tiers — weights applied when computing weighted source count.
 *
 * Tier 1 (2.0): top-tier newswires / major outlets with strong fact-checking
 * Tier 2 (1.0): standard reliable outlets (default)
 * Tier 3 (0.5): blogs, partisan outlets, aggregators, Telegram channels
 */
const SOURCE_QUALITY: Array<{ pattern: RegExp; weight: number }> = [
  // Tier 1 — major wires & globals
  { pattern: /reuters|associated press|\bap\b|bbc|nyt|new york times|guardian|bloomberg|financial times|\bft\b|al.jazeera|npr/, weight: 2.0 },
  // Tier 1 — major Israeli establishment
  { pattern: /haaretz|ynet|maariv|calcalist|globes|kan\b|walla|n12|channel.?12|channel.?13|i24|jerusalem.?post|times.?of.?israel/, weight: 1.8 },
  // Tier 3 — partisan / Telegram / aggregators
  { pattern: /telegram|t\.me|channel|blog|srugim|kikar|hamodia|behadrei|kipa|arutz.?7|inn\b|7.?online/, weight: 0.5 },
];

/**
 * Get quality weight for a source name (1.0 = default/neutral)
 */
function getSourceWeight(sourceName: string): number {
  const n = sourceName.toLowerCase();
  for (const { pattern, weight } of SOURCE_QUALITY) {
    if (pattern.test(n)) return weight;
  }
  return 1.0;
}

/**
 * Compute weighted source count: sum of quality weights across unique sources.
 * e.g. 2×Tier1 + 1×Tier3 = 2.0+2.0+0.5 = 4.5
 */
function computeWeightedSourceCount(sources: Array<{ name: string }>): number {
  if (!sources.length) return 0;
  const total = sources.reduce((sum, s) => sum + getSourceWeight(s.name), 0);
  return parseFloat(total.toFixed(1));
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

// Story shape accepted by matchStoriesWithMarkets
type StoryInput = {
  slug: string;
  headline: string;
  likelihood: number;
  category?: string;
  sourceCount?: number;
  sources?: Array<{ name: string }>;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
  leanBreakdown?: { left: number; center: number; right: number };
  narrativeSplit?: { rightSource: string; leftSource: string; gapPct: number };
  crossMediaEcho?: { direction: string; delayMinutes: number; firstSourceName: string };
  firstMover?: { sourceName: string; minsAhead: number };
  negativeRatio?: number;
  topHeadlines?: string[];
  coverageVelocity?: number | null;
};

/**
 * In-memory trend history: marketSlug → array of { ts, likelihood } samples
 * Retains up to 48 samples per market (~4h at 5-min poll cadence).
 */
const trendHistory = new Map<string, Array<{ ts: number; likelihood: number }>>();
const TREND_MAX_SAMPLES = 48;
const TREND_MIN_AGE_MS  = 2 * 60 * 60 * 1000; // need at least 2h history to show trend
const TREND_THRESHOLD   = 5; // pts change to qualify as 'rising' / 'falling'

function recordTrend(marketSlug: string, likelihood: number): void {
  const hist = trendHistory.get(marketSlug) ?? [];
  hist.push({ ts: Date.now(), likelihood });
  if (hist.length > TREND_MAX_SAMPLES) hist.splice(0, hist.length - TREND_MAX_SAMPLES);
  trendHistory.set(marketSlug, hist);
}

function getTrend(marketSlug: string, currentLikelihood: number): Pick<SignalVsMarket, 'trendDelta' | 'trendDirection'> {
  const hist = trendHistory.get(marketSlug);
  if (!hist || hist.length < 2) return {};
  // Find oldest sample that's at least TREND_MIN_AGE_MS old
  const cutoff = Date.now() - TREND_MIN_AGE_MS;
  const baseline = hist.find(h => h.ts <= cutoff);
  if (!baseline) return {};
  const delta = Math.round(currentLikelihood - baseline.likelihood);
  return {
    trendDelta: delta,
    trendDirection: Math.abs(delta) < TREND_THRESHOLD ? 'stable' : delta > 0 ? 'rising' : 'falling',
  };
}

/** Score how well a story matches a market. Returns { score, keywords, category } or null. */
function scoreStoryMarketMatch(
  storyText: string,
  market: PolymarketEvent,
): { score: number; keywords: string[]; category: string } | null {
  const marketText = (market.title + ' ' + (market.category || '')).toLowerCase();
  let matchScore = 0;
  const matched: string[] = [];
  const categoryScores: Record<string, number> = {};

  for (const [category, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const kw of keywords) {
      const storyHas = storyText.includes(kw);
      const marketHas = marketText.includes(kw);
      if (storyHas && marketHas) {
        matchScore += 2;
        matched.push(kw);
        categoryScores[category] = (categoryScores[category] || 0) + 2;
      } else if (storyHas) {
        categoryScores[category] = (categoryScores[category] || 0) + 0.5;
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

  const hasCategoryHit = Object.values(categoryScores).some(s => s >= 2);
  if (matchScore < 2 || !hasCategoryHit) return null;

  const bestCat = Object.entries(categoryScores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'other';
  return { score: matchScore, keywords: matched, category: bestCat };
}

/** Process a single story through the signal pipeline → calibrated likelihood */
function processStorySignal(
  story: StoryInput,
  market: PolymarketEvent,
  marketProb: number,
): { calibrated: number; sentimentAdjusted: number; velocityDelta: number; calibrationNote?: string; qDir: QuestionDirection } {
  const qDir = detectQuestionDirection(market.title);

  const sentimentAdjusted = applySentimentDirection(
    story.likelihood,
    story.sentiment || 'neutral',
    story.negativeRatio ?? 0.5,
    qDir,
  );

  const vel = story.coverageVelocity;
  const velocityDelta = vel == null ? 0 : vel >= 2 ? 8 : vel >= 1.5 ? 5 : vel <= 0.3 ? -10 : vel <= 0.5 ? -6 : 0;
  const velocityAdjusted = Math.round(Math.max(5, Math.min(95, sentimentAdjusted + velocityDelta)));

  const calibration = calibrateSignalLikelihood(velocityAdjusted, market.title, marketProb);
  return { calibrated: calibration.calibrated, sentimentAdjusted, velocityDelta, calibrationNote: calibration.note, qDir };
}

/**
 * Match our brief stories with Polymarket events.
 *
 * Market-centric: for each market, collect ALL matching stories (score≥2),
 * then aggregate their calibrated signal likelihoods into one weighted score.
 * The primary story (highest match score) drives the thesis/headline display.
 */
export function matchStoriesWithMarkets(
  stories: StoryInput[],
  markets: PolymarketEvent[],
  earlyMovers?: EarlyMover[],
): SignalVsMarket[] {
  // Step 1: pre-compute all (story, market) pairs above threshold
  type Pair = {
    story: StoryInput;
    market: PolymarketEvent;
    matchScore: number;
    keywords: string[];
    category: string;
    storyText: string;
  };

  const allPairs: Pair[] = [];
  for (const story of stories) {
    const slugNorm = (story.slug || '').replace(/-/g, ' ');
    const storyText = `${story.headline} ${slugNorm} ${story.category || ''}`.toLowerCase();
    for (const market of markets) {
      const result = scoreStoryMarketMatch(storyText, market);
      if (result) {
        allPairs.push({ story, market, matchScore: result.score, keywords: result.keywords, category: result.category, storyText });
      }
    }
  }

  // Step 2: group pairs by market id — each market gets a list of matching stories
  const marketGroups = new Map<string, Pair[]>();
  for (const pair of allPairs) {
    const key = pair.market.id;
    if (!marketGroups.has(key)) marketGroups.set(key, []);
    marketGroups.get(key)!.push(pair);
  }

  const matches: SignalVsMarket[] = [];

  // Step 3: for each market group, aggregate and build one SignalVsMarket entry
  for (const [, pairs] of marketGroups) {
    // Sort: best match score first
    pairs.sort((a, b) => b.matchScore - a.matchScore);

    const market = pairs[0].market;
    const marketProb = Math.round(market.outcomePrices[0] * 100);

    // Process each story through the pipeline, collect calibrated likelihoods
    const processed = pairs.map(p => ({
      ...p,
      ...processStorySignal(p.story, market, marketProb),
    }));

    // Aggregate: weighted average of calibrated likelihoods, weight = matchScore × sourceCount
    const totalWeight = processed.reduce((sum, p) => sum + p.matchScore * (p.story.sourceCount || 1), 0);
    const aggregatedLikelihood = totalWeight > 0
      ? Math.round(processed.reduce((sum, p) => sum + p.calibrated * p.matchScore * (p.story.sourceCount || 1), 0) / totalWeight)
      : processed[0].calibrated;

    // Primary story drives thesis + headline
    const primary = processed[0];
    const primaryStory = primary.story;
    const bestScore    = primary.matchScore;
    const bestCategory = primary.category;
    const bestKeywords = primary.keywords;

    const delta = aggregatedLikelihood - marketProb;
    const absDelta = Math.abs(delta);
    const direction: SignalVsMarket['alphaDirection'] = absDelta <= 10 ? 'aligned' : (delta > 0 ? 'signal-higher' : 'market-higher');

    // Aggregate source count across all contributing stories (deduplicated)
    const allSourceNames = new Set<string>();
    const allSources: Array<{ name: string }> = [];
    for (const p of processed) {
      for (const s of (p.story.sources || [])) {
        if (!allSourceNames.has(s.name)) { allSourceNames.add(s.name); allSources.push(s); }
      }
    }
    const srcCount = allSourceNames.size || primaryStory.sourceCount || 3;
    const weightedSrcCount = allSources.length ? computeWeightedSourceCount(allSources) : srcCount;

    const breakdown = computeAlphaBreakdown(absDelta, market.volume, weightedSrcCount, bestScore);
    const baseAlpha = breakdown.deltaScore + breakdown.volumeScore + breakdown.sourceScore + breakdown.matchScore;

    const intel = computeIntelEnhancement(
      allSources,
      bestCategory,
      primaryStory.sentiment || 'neutral',
      earlyMovers || [],
    );
    // Bonus for multi-story corroboration (up to +8 pts for 3+ stories)
    const corroborationBoost = Math.min(8, (processed.length - 1) * 3);
    const alphaScore = Math.min(100, baseAlpha + intel.intelBoost + corroborationBoost);

    const whyDifferent = generateWhyDifferent(direction, absDelta, aggregatedLikelihood, marketProb, market, srcCount);
    const signalThesis = buildSignalThesis(primaryStory, direction);
    const marketThesis = buildMarketThesis(market, marketProb, direction, absDelta);

    const rawConf = Math.round((bestScore / (bestScore + 4)) * 100);
    const thinPenalty = market.volume < 50_000 ? 15 : 0;
    const confidence = Math.min(88, Math.max(15, rawConf - thinPenalty));

    // Trend direction: record + retrieve
    recordTrend(market.slug || market.id, aggregatedLikelihood);
    const trend = getTrend(market.slug || market.id, aggregatedLikelihood);

    // Contributing story headlines (secondary stories only)
    const contributingHeadlines = processed.slice(1, 4).map(p => p.story.headline);

    matches.push({
      topic: primaryStory.headline,
      storySlug: primaryStory.slug,
      topicCategory: bestCategory,
      signalLikelihood: aggregatedLikelihood,
      signalRaw: primaryStory.likelihood,
      calibrationNote: primary.calibrationNote,
      questionDirection: primary.qDir !== 'neutral' ? primary.qDir : undefined,
      coverageVelocity: primaryStory.coverageVelocity ?? null,
      velocityDelta: primary.velocityDelta !== 0 ? primary.velocityDelta : undefined,
      // Multi-story aggregation
      aggregatedStoryCount: processed.length,
      contributingHeadlines: contributingHeadlines.length > 0 ? contributingHeadlines : undefined,
      // Trend
      ...trend,
      marketProbability: marketProb,
      delta,
      alphaDirection: direction,
      alphaScore,
      alphaBreakdown: breakdown,
      whyDifferent,
      signalThesis,
      marketThesis,
      polymarketTitle: market.title,
      polymarketSlug: market.slug,
      polymarketUrl: market.slug
        ? `https://polymarket.com/event/${market.slug}`
        : 'https://polymarket.com',
      volume: market.volume,
      liquidity: market.liquidity,
      endDate: market.endDate,
      confidence,
      matchedKeywords: bestKeywords.slice(0, 5),
      sourceCount: srcCount,
      intelBoost: intel.intelBoost,
      intelSummary: intel.intelSummary,
    });
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
 * Detect question direction: does negative sentiment raise or lower probability?
 *
 * "Will ceasefire happen?"  → negative news (fighting) = LOWER probability → 'negative-bearish'
 * "Will conflict escalate?" → negative news (fighting) = HIGHER probability → 'negative-bullish'
 * "Will deal be signed?"    → positive news (talks)    = HIGHER probability → 'positive-bullish'
 */
type QuestionDirection = 'negative-bullish' | 'negative-bearish' | 'positive-bullish' | 'neutral';

function detectQuestionDirection(title: string): QuestionDirection {
  const t = title.toLowerCase();

  // Questions where BAD news → higher probability
  const NEGATIVE_BULLISH = [
    'war', 'conflict', 'attack', 'strike', 'invade', 'escalat', 'collapse',
    'crisis', 'fail', 'break down', 'breakdown', 'default', 'recession',
    'sanction', 'protest', 'riot', 'coup', 'assassin',
    'מלחמה', 'קריסה', 'משבר', 'תקיפה', 'הסלמה', 'כישלון', 'מחאה',
  ];

  // Questions where GOOD news → higher probability
  const POSITIVE_BULLISH = [
    'ceasefire', 'deal', 'agreement', 'peace', 'accord', 'sign', 'normalize',
    'release', 'free', 'hostage', 'resolve', 'settle', 'negotiate',
    'הפסקת אש', 'עסקה', 'הסכם', 'שלום', 'נורמליזציה', 'שחרור', 'חטוף',
  ];

  // Questions where negative news → lower probability (ceasefire less likely if fighting)
  const NEGATIVE_BEARISH = [
    'ceasefire', 'deal', 'agreement', 'peace', 'settle', 'resolve',
    'הפסקת אש', 'עסקה', 'הסכם', 'שלום',
  ];

  const isNegBullish  = NEGATIVE_BULLISH.some(kw => t.includes(kw));
  const isPosBullish  = POSITIVE_BULLISH.some(kw => t.includes(kw));
  const isNegBearish  = NEGATIVE_BEARISH.some(kw => t.includes(kw));

  // If question is about a peace/deal: negative news (no deal progress) → bearish
  if (isNegBearish && !isNegBullish) return 'negative-bearish';
  // If question is about conflict/crisis: negative news (fighting) → bullish
  if (isNegBullish && !isPosBullish) return 'negative-bullish';
  // If question is about positive outcome: positive news → bullish
  if (isPosBullish && !isNegBullish) return 'positive-bullish';

  return 'neutral';
}

/**
 * Adjust Signal likelihood based on sentiment direction.
 *
 * Raw Signal likelihood = topic intensity (50–80% for hot topics).
 * We transform it into a directional probability based on the question type.
 */
function applySentimentDirection(
  rawLikelihood: number,
  sentiment: string,
  negativeRatio: number,
  direction: QuestionDirection,
): number {
  if (direction === 'neutral') return rawLikelihood;

  // Sentiment pressure: how negative is the news? (0 = all positive, 1 = all negative)
  const negPressure = negativeRatio;   // 0–1
  const posPressure = 1 - negPressure;

  // Base: topic intensity as a 0–1 scale, centered around 50
  const intensity = rawLikelihood / 100;

  let adjusted: number;

  if (direction === 'negative-bullish') {
    // Bad news = more likely. Combine intensity + negative pressure.
    // e.g. "Will conflict escalate?" + 80% negative news = high probability
    adjusted = (intensity * 0.4 + negPressure * 0.6) * 100;

  } else if (direction === 'negative-bearish') {
    // Bad news = LESS likely. Positive news → deal more likely.
    // e.g. "Will ceasefire happen?" + 80% negative news = low probability
    adjusted = (intensity * 0.4 + posPressure * 0.6) * 100;

  } else {
    // positive-bullish: positive news = more likely
    adjusted = (intensity * 0.4 + posPressure * 0.6) * 100;
  }

  // Clamp to 5–95 (never certain)
  return Math.round(Math.max(5, Math.min(95, adjusted)));
}

/**
 * Calibrate Signal likelihood against the specific Polymarket question.
 *
 * Signal likelihood = topic intensity (how loudly the news covers it).
 * Polymarket probability = specific outcome probability.
 * These are NOT the same. Extreme/specific outcomes need a discount.
 *
 * Rules:
 * 1. Extreme outcome keywords → heavy discount (outcome is specific & rare)
 * 2. Market already at extremes (≤5% or ≥95%) → Signal closer to market (market is probably right)
 * 3. Weak match (score < 4) → moderate discount for mismatch risk
 */
function calibrateSignalLikelihood(
  rawLikelihood: number,
  marketTitle: string,
  marketProb: number,
): { calibrated: number; note?: string } {
  const title = marketTitle.toLowerCase();

  // Extreme outcome keywords — these describe rare, unprecedented, or very specific events
  const EXTREME_KEYWORDS = [
    'annex', 'annexation', 'invade', 'invasion', 'declare war', 'nuclear strike',
    'impeach', 'impeachment', 'coup', 'assassinat', 'collapse', 'default',
    'withdraw from', 'leave the', 'exit the', 'ban', 'outlaw',
    'ספח', 'סיפוח', 'פלישה', 'הכריז מלחמה', 'גרעיני', 'הדחה', 'קריסה',
  ];

  // Specific-event keywords — distinct from general topic coverage
  const SPECIFIC_KEYWORDS = [
    'by june', 'by december', 'by march', 'by end of', 'before ', 'within ',
    'will x win', 'will x be', 'will x happen', 'first', 'ever',
    'עד יוני', 'עד דצמבר', 'עד מרץ', 'עד סוף', 'לפני ', 'תוך ',
  ];

  const hasExtreme  = EXTREME_KEYWORDS.some(kw => title.includes(kw));
  const hasSpecific = SPECIFIC_KEYWORDS.some(kw => title.includes(kw));

  // Market at extreme ends — usually means the consensus is strong; respect it
  const marketAtFloor   = marketProb <= 5;
  const marketAtCeiling = marketProb >= 95;

  if (hasExtreme && marketAtFloor) {
    // Annexation at 1% — Signal coverage noise should not inflate this.
    // Blend strongly toward market: 20% Signal + 80% market signal
    const calibrated = Math.round(rawLikelihood * 0.2 + marketProb * 0.8 + rawLikelihood * 0.05);
    return {
      calibrated: Math.min(calibrated, marketProb + 15), // cap at market + 15pts
      note: `מכויל: ציון גולמי ${rawLikelihood}% הופחת — שאלת הפוליגון עוסקת בתוצאה קיצונית (${EXTREME_KEYWORDS.find(k => title.includes(k))}) שהשוק מתמחר ב-${marketProb}% בלבד`,
    };
  }

  if (hasExtreme && !marketAtFloor && !marketAtCeiling) {
    // Extreme outcome but market is not dismissive — moderate discount
    const calibrated = Math.round(rawLikelihood * 0.5 + marketProb * 0.5);
    return {
      calibrated,
      note: `מכויל: ממוצע בין Signal (${rawLikelihood}%) לשוק (${marketProb}%) — תוצאה ספציפית`,
    };
  }

  if (hasSpecific && marketAtFloor) {
    // Time-bounded specific question at low probability
    const calibrated = Math.round(rawLikelihood * 0.35 + marketProb * 0.65);
    return {
      calibrated: Math.min(calibrated, marketProb + 20),
      note: `מכויל: שאלה עם מועד ספציפי — Signal (${rawLikelihood}%) מייצג עוצמת כיסוי, לא הסתברות התוצאה`,
    };
  }

  if (marketAtCeiling) {
    // Market almost certain → blend toward market
    const calibrated = Math.round(rawLikelihood * 0.3 + marketProb * 0.7);
    return { calibrated };
  }

  // No calibration needed — Signal and question are well-aligned
  return { calibrated: rawLikelihood };
}

/**
 * Build the Signal thesis — what our RSS analysis actually sees.
 */
function buildSignalThesis(
  story: Parameters<typeof matchStoriesWithMarkets>[0][number],
  direction: SignalVsMarket['alphaDirection'],
): SignalThesis {
  const lb = story.leanBreakdown;
  const srcCount = story.sourceCount || 0;

  // Source quality label
  const sources = story.sources || [];
  const weightedCount = sources.length ? computeWeightedSourceCount(sources) : srcCount;
  const tier1Count = sources.filter(s => getSourceWeight(s.name) >= 1.8).length;
  const tier3Count = sources.filter(s => getSourceWeight(s.name) <= 0.5).length;
  const qualityNote =
    tier1Count >= 2 ? ` · ${tier1Count} מקורות מוסמכים` :
    tier3Count > 0 && tier3Count >= srcCount / 2 ? ` · אזהרה: רוב המקורות דרגה 3` :
    weightedCount > srcCount * 1.3 ? ' · מקורות איכותיים' : '';

  // Source spread label
  let sourceSpread: string;
  if (lb && (lb.left + lb.center + lb.right) > 0) {
    const parts: string[] = [];
    if (lb.left   > 0) parts.push(`${lb.left}ש`);
    if (lb.center > 0) parts.push(`${lb.center}מ`);
    if (lb.right  > 0) parts.push(`${lb.right}י`);
    const total = lb.left + lb.center + lb.right;
    const isCrossSpectrum = lb.left > 0 && lb.right > 0;
    sourceSpread = parts.join(' ') + (isCrossSpectrum ? ' — חוצה קווים פוליטיים' : ` — ${total} מקורות`) + qualityNote;
  } else {
    sourceSpread = `${srcCount} מקורות${qualityNote}`;
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
