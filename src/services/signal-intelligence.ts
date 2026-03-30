/**
 * Signal Intelligence — enhances story/market analysis with:
 *
 * 1. Bias-Adjusted Signal (Against-Interest Detection)
 *    If a right-wing source writes positively about a ceasefire, or a left-wing
 *    source supports a military operation — that's an "against-interest" signal
 *    worth more than expected-direction coverage.
 *
 * 2. Early Mover Tracking
 *    Sources that historically publish stories first (before others cover them)
 *    get a credibility boost. Tracked via localStorage on client side.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface BiasSignal {
  /** How many sources are reporting against their expected political interest */
  againstInterestCount: number;
  /** Total sources analyzed */
  totalSources: number;
  /** 0-100 boost score from against-interest signals */
  biasBoost: number;
  /** Individual against-interest sources */
  details: Array<{
    source: string;
    leaning: string;
    expectedSentiment: string;
    actualSentiment: string;
  }>;
}

export interface EarlyMover {
  /** Source name */
  source: string;
  /** How many times this source was first to cover a growing story */
  earlyHits: number;
  /** Total stories covered */
  totalCovered: number;
  /** Early mover rate (earlyHits / totalCovered) */
  earlyRate: number;
}

export interface IntelEnhancement {
  biasSignal: BiasSignal;
  earlyMovers: EarlyMover[];
  /** Combined intelligence boost to add to alpha score (0-15) */
  intelBoost: number;
  /** One-line summary of why intel matters here */
  intelSummary: string;
}

// ── Topic × Leaning Expected Sentiment Map ──────────────────────────────────
//
// For each topic, what sentiment do we EXPECT from each political leaning?
// When reality differs, that's an against-interest signal.

type ExpectedSentiment = 'positive' | 'negative' | 'neutral';
type LeaningGroup = 'left' | 'right';

const TOPIC_EXPECTED_SENTIMENT: Record<string, Record<LeaningGroup, ExpectedSentiment>> = {
  // Ceasefire / peace deals: left expects positive, right expects negative
  'ceasefire':        { left: 'positive', right: 'negative' },
  'Gaza Conflict':    { left: 'negative', right: 'neutral' },
  // Military operations: right expects positive, left expects negative
  'Security':         { left: 'negative', right: 'positive' },
  'Lebanon/Hezbollah': { left: 'negative', right: 'positive' },
  // Settlements: right positive, left negative
  'West Bank':        { left: 'negative', right: 'positive' },
  // Iran: both negative, but right more hawkish
  'Iran Nuclear':     { left: 'negative', right: 'negative' },
  'iran':             { left: 'negative', right: 'negative' },
  // Judicial reform: left against, right for
  'Judicial Reform':  { left: 'negative', right: 'positive' },
  // Elections: depends on who's winning, so neutral expected
  'us-election':      { left: 'neutral',  right: 'neutral' },
  'elections-israel': { left: 'neutral',  right: 'neutral' },
  // Economy: generally neutral expectations
  'Economy':          { left: 'neutral',  right: 'neutral' },
  'economy':          { left: 'neutral',  right: 'neutral' },
  // Diplomacy / normalization: left cautious, right positive
  'Saudi Normalization': { left: 'neutral', right: 'positive' },
  'Diplomacy':        { left: 'positive', right: 'neutral' },
  'saudi':            { left: 'neutral',  right: 'positive' },
  // Ukraine: both lean pro-Ukraine in Israeli media
  'Ukraine/Russia':   { left: 'negative', right: 'neutral' },
  'ukraine':          { left: 'negative', right: 'neutral' },
  // Hamas: right hawkish, left humanitarian concern
  'hamas':            { left: 'negative', right: 'negative' },
  // Syria
  'Syria':            { left: 'neutral',  right: 'neutral' },
  'syria':            { left: 'neutral',  right: 'neutral' },
  // Israel (general)
  'israel':           { left: 'neutral',  right: 'neutral' },
  // Hezbollah
  'hezbollah':        { left: 'negative', right: 'negative' },
};

// Map full leaning names to simplified left/right groups
function toLeaningGroup(leaning: string): LeaningGroup | null {
  if (leaning === 'left' || leaning === 'center-left') return 'left';
  if (leaning === 'right' || leaning === 'center-right') return 'right';
  return null; // center/unknown — no expected bias
}

// ── Source Political Leaning (imported from ai-analyzer concept) ────────────

const SOURCE_LEANING: Record<string, string> = {
  // Israeli left/center-left
  'Haaretz': 'left', 'Haaretz English': 'left',
  // Israeli center
  'Ynet': 'center', 'Ynet English': 'center', 'Mako': 'center',
  'Kan News': 'center', 'Walla! News': 'center', 'Calcalist': 'center',
  'Globes': 'center', 'Times of Israel': 'center', 'i24NEWS': 'center',
  // Israeli center-right / right
  'Jerusalem Post': 'center-right',
  'Israel Hayom': 'right', 'Israel National News': 'right',
  'Now 14 (EN)': 'right', 'Channel 14': 'right',
  // International
  'The Guardian': 'center-left', 'NY Times World': 'center-left',
  'NY Times Middle East': 'center-left', 'CNN World': 'center-left',
  'BBC World': 'center', 'BBC Middle East': 'center',
  'Reuters World': 'center', 'Reuters Middle East': 'center',
  'France 24': 'center', 'DW News': 'center',
  'Sky News World': 'center-right', 'The Economist': 'center-right',
  'Al Jazeera': 'left', 'Al-Monitor': 'center',
  'Middle East Eye': 'center-left',
  'The National (UAE)': 'center-right', 'Arab News': 'center-right',
};

// ── Bias-Adjusted Signal ────────────────────────────────────────────────────

/**
 * Analyze sources for against-interest signals.
 * When a source reports against its expected political bias, it's stronger evidence.
 */
export function analyzeBiasSignal(
  sources: Array<{ name: string }>,
  topicCategory: string,
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed',
): BiasSignal {
  // Find expected sentiments for this topic
  const topicExpected = TOPIC_EXPECTED_SENTIMENT[topicCategory];
  if (!topicExpected) {
    return { againstInterestCount: 0, totalSources: sources.length, biasBoost: 0, details: [] };
  }

  const details: BiasSignal['details'] = [];

  for (const src of sources) {
    const leaning = SOURCE_LEANING[src.name];
    if (!leaning) continue;

    const group = toLeaningGroup(leaning);
    if (!group) continue; // center sources have no expected bias

    const expected = topicExpected[group];
    if (expected === 'neutral') continue; // neutral expectation — can't be "against interest"

    // Check if actual sentiment contradicts expected
    const isAgainst =
      (expected === 'positive' && (sentiment === 'negative' || sentiment === 'mixed')) ||
      (expected === 'negative' && (sentiment === 'positive' || sentiment === 'mixed'));

    if (isAgainst) {
      details.push({
        source: src.name,
        leaning,
        expectedSentiment: expected,
        actualSentiment: sentiment,
      });
    }
  }

  const againstInterestCount = details.length;
  // Boost: each against-interest source adds significant credibility
  // Max 15 points (3 against-interest sources = full boost)
  const biasBoost = Math.min(15, againstInterestCount * 5);

  return {
    againstInterestCount,
    totalSources: sources.length,
    biasBoost,
    details,
  };
}

// ── Early Mover Tracking ────────────────────────────────────────────────────
//
// Server-side: analyze article timestamps within each story cluster.
// A source is an "early mover" if it published before the median timestamp.

/**
 * Compute early mover scores from story data.
 * Analyses which sources consistently publish first.
 */
export function computeEarlyMovers(
  stories: Array<{
    sources: Array<{ name: string }>;
    articles?: Array<{ sourceName: string; pubDate?: string }>;
  }>
): EarlyMover[] {
  const sourceStats: Record<string, { earlyHits: number; totalCovered: number }> = {};

  for (const story of stories) {
    if (!story.articles || story.articles.length < 3) continue;

    // Sort by pubDate to find who published first
    const withDates = story.articles
      .filter(a => a.pubDate)
      .map(a => ({ name: a.sourceName, time: new Date(a.pubDate!).getTime() }))
      .sort((a, b) => a.time - b.time);

    if (withDates.length < 3) continue;

    // Median time
    const medianTime = withDates[Math.floor(withDates.length / 2)].time;

    // Track which sources we've seen in this story (deduplicate)
    const seen = new Set<string>();

    for (const article of withDates) {
      if (seen.has(article.name)) continue;
      seen.add(article.name);

      if (!sourceStats[article.name]) {
        sourceStats[article.name] = { earlyHits: 0, totalCovered: 0 };
      }
      sourceStats[article.name].totalCovered++;

      if (article.time < medianTime) {
        sourceStats[article.name].earlyHits++;
      }
    }
  }

  return Object.entries(sourceStats)
    .filter(([, stats]) => stats.totalCovered >= 2) // need at least 2 stories
    .map(([source, stats]) => ({
      source,
      earlyHits: stats.earlyHits,
      totalCovered: stats.totalCovered,
      earlyRate: Math.round((stats.earlyHits / stats.totalCovered) * 100),
    }))
    .sort((a, b) => b.earlyRate - a.earlyRate);
}

/**
 * Get early mover boost for a specific set of sources.
 * If the story's sources include known early movers, boost confidence.
 */
export function getEarlyMoverBoost(
  sources: Array<{ name: string }>,
  earlyMovers: EarlyMover[],
): { boost: number; earlySourceCount: number; topEarlyMover: string | null } {
  if (earlyMovers.length === 0) {
    return { boost: 0, earlySourceCount: 0, topEarlyMover: null };
  }

  const earlyMoverMap = new Map(earlyMovers.map(em => [em.source, em]));
  let earlySourceCount = 0;
  let topEarlyMover: EarlyMover | null = null;

  for (const src of sources) {
    const em = earlyMoverMap.get(src.name);
    if (em && em.earlyRate >= 50) { // only count sources with 50%+ early rate
      earlySourceCount++;
      if (!topEarlyMover || em.earlyRate > topEarlyMover.earlyRate) {
        topEarlyMover = em;
      }
    }
  }

  // Boost: up to 10 points
  const boost = Math.min(10, earlySourceCount * 4);

  return {
    boost,
    earlySourceCount,
    topEarlyMover: topEarlyMover?.source || null,
  };
}

// ── Combined Intelligence Enhancement ───────────────────────────────────────

/**
 * Compute combined intelligence enhancement for a Signal vs Market match.
 * Returns boost score (0-15) and summary.
 */
export function computeIntelEnhancement(
  sources: Array<{ name: string }>,
  topicCategory: string,
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed',
  earlyMovers: EarlyMover[],
): IntelEnhancement {
  const biasSignal = analyzeBiasSignal(sources, topicCategory, sentiment);
  const earlyMoverResult = getEarlyMoverBoost(sources, earlyMovers);

  // Combined boost: max 15 (bias up to 15, early mover up to 10, but total capped)
  const intelBoost = Math.min(15, biasSignal.biasBoost + earlyMoverResult.boost);

  // Generate summary
  const parts: string[] = [];
  if (biasSignal.againstInterestCount > 0) {
    const srcNames = biasSignal.details.map(d => d.source).join(', ');
    parts.push(`${biasSignal.againstInterestCount} against-interest signal${biasSignal.againstInterestCount > 1 ? 's' : ''} (${srcNames})`);
  }
  if (earlyMoverResult.earlySourceCount > 0) {
    parts.push(`${earlyMoverResult.earlySourceCount} early mover${earlyMoverResult.earlySourceCount > 1 ? 's' : ''}`);
  }

  const intelSummary = parts.length > 0
    ? parts.join(' + ')
    : '';

  return {
    biasSignal,
    earlyMovers,
    intelBoost,
    intelSummary,
  };
}
