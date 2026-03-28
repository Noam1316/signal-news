/**
 * Media Bias Analysis Service
 * Based on AllSides / MBFC methodology
 * Maps sources to political bias, detects coverage gaps and narrative divergence
 */

export type BiasRating = 'far-left' | 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'far-right';
export type FactualRating = 'very-high' | 'high' | 'mostly-factual' | 'mixed' | 'low';

export interface SourceBias {
  sourceId: string;
  sourceName: string;
  bias: BiasRating;
  factual: FactualRating;
  country: string;
  type: 'mainstream' | 'partisan' | 'state' | 'independent';
  methodology: string; // brief note on why this rating
}

export interface CoverageGapItem {
  topic: string;
  coveredBy: BiasRating[];
  missingFrom: BiasRating[];
  articleCount: number;
  gapScore: number; // 0-100, higher = bigger gap
  direction: 'left-only' | 'right-only' | 'center-only' | 'both-extremes' | 'balanced';
}

export interface NarrativeDivergenceItem {
  topic: string;
  leftNarrative: { sentiment: string; framing: string; articleCount: number };
  rightNarrative: { sentiment: string; framing: string; articleCount: number };
  divergenceScore: number; // 0-100
  examples: { source: string; bias: BiasRating; title: string }[];
}

/**
 * Source bias database — based on AllSides, MBFC, and academic research
 * For Israeli media: based on IDI media research and Pew/Reuters Institute
 */
export const SOURCE_BIAS_DB: Record<string, Omit<SourceBias, 'sourceId' | 'sourceName'>> = {
  // Israeli Mainstream
  'ynet': { bias: 'center', factual: 'high', country: 'IL', type: 'mainstream', methodology: 'IDI media survey: perceived center by Israeli public' },
  'haaretz': { bias: 'left', factual: 'high', country: 'IL', type: 'mainstream', methodology: 'AllSides equivalent: editorial line consistently left-progressive' },
  'haaretz-en': { bias: 'left', factual: 'high', country: 'IL', type: 'mainstream', methodology: 'English edition of Haaretz, same editorial line' },
  'jpost': { bias: 'center-right', factual: 'high', country: 'IL', type: 'mainstream', methodology: 'MBFC: right-center. English-language Israeli daily' },
  'kan': { bias: 'center', factual: 'high', country: 'IL', type: 'mainstream', methodology: 'Public broadcaster, regulatory mandate for balance' },
  'i24': { bias: 'center-right', factual: 'mostly-factual', country: 'IL', type: 'mainstream', methodology: 'International Israeli channel, leans center-right' },
  'walla': { bias: 'center', factual: 'high', country: 'IL', type: 'mainstream', methodology: 'IDI: perceived center, commercial portal' },
  'mako': { bias: 'center', factual: 'high', country: 'IL', type: 'mainstream', methodology: 'Channel 12 digital, mainstream center' },
  'n12': { bias: 'center', factual: 'high', country: 'IL', type: 'mainstream', methodology: 'Channel 12 news site, mainstream center' },
  'reshet13': { bias: 'center-left', factual: 'high', country: 'IL', type: 'mainstream', methodology: 'Channel 13, commercial TV, center-left editorial' },
  'israelhayom': { bias: 'right', factual: 'mostly-factual', country: 'IL', type: 'partisan', methodology: 'MBFC: right. Free daily, historically aligned with Likud' },
  'ch7': { bias: 'far-right', factual: 'mixed', country: 'IL', type: 'partisan', methodology: 'Arutz 7/INN: religious-nationalist editorial line' },
  'ch14': { bias: 'right', factual: 'mostly-factual', country: 'IL', type: 'partisan', methodology: 'Channel 14: right-wing editorial stance' },
  'maariv': { bias: 'center-right', factual: 'high', country: 'IL', type: 'mainstream', methodology: 'Center-right daily newspaper' },
  'globes': { bias: 'center', factual: 'high', country: 'IL', type: 'mainstream', methodology: 'Business newspaper, factual reporting' },
  'calcalist': { bias: 'center-left', factual: 'high', country: 'IL', type: 'mainstream', methodology: 'Business/tech newspaper' },
  'the-marker': { bias: 'center-left', factual: 'high', country: 'IL', type: 'mainstream', methodology: 'Haaretz business section' },

  // International
  'bbc': { bias: 'center', factual: 'high', country: 'UK', type: 'mainstream', methodology: 'AllSides: center. MBFC: left-center. Global consensus: center' },
  'bbc-arabic': { bias: 'center', factual: 'high', country: 'UK', type: 'mainstream', methodology: 'BBC Arabic service, same editorial standards' },
  'reuters': { bias: 'center', factual: 'very-high', country: 'UK', type: 'mainstream', methodology: 'AllSides: center. Wire service, factual focus' },
  'ap': { bias: 'center', factual: 'very-high', country: 'US', type: 'mainstream', methodology: 'AllSides: center. Wire service' },
  'cnn': { bias: 'center-left', factual: 'mostly-factual', country: 'US', type: 'mainstream', methodology: 'AllSides: left. MBFC: left. Consistently left-leaning' },
  'fox': { bias: 'right', factual: 'mixed', country: 'US', type: 'partisan', methodology: 'AllSides: right. MBFC: right. Conservative editorial' },
  'nytimes': { bias: 'center-left', factual: 'high', country: 'US', type: 'mainstream', methodology: 'AllSides: left. MBFC: left-center' },
  'guardian': { bias: 'left', factual: 'high', country: 'UK', type: 'mainstream', methodology: 'AllSides: left. MBFC: left-center' },
  'aljazeera': { bias: 'center-left', factual: 'mostly-factual', country: 'QA', type: 'state', methodology: 'MBFC: left-center bias, mixed factual. Qatar state-funded' },
  'aljazeera-en': { bias: 'center-left', factual: 'mostly-factual', country: 'QA', type: 'state', methodology: 'English edition of Al Jazeera' },
  'rt': { bias: 'far-right', factual: 'low', country: 'RU', type: 'state', methodology: 'MBFC: right-center bias, low factual. Russian state media' },
  'toi': { bias: 'center', factual: 'high', country: 'IL', type: 'mainstream', methodology: 'Times of Israel, English-language Israeli news' },
  'wsj': { bias: 'center-right', factual: 'high', country: 'US', type: 'mainstream', methodology: 'AllSides: center. MBFC: right-center. Factual reporting' },
  'sky': { bias: 'center', factual: 'high', country: 'UK', type: 'mainstream', methodology: 'Sky News, UK mainstream' },
  'dw': { bias: 'center', factual: 'high', country: 'DE', type: 'mainstream', methodology: 'Deutsche Welle, German public broadcaster' },
  'france24': { bias: 'center', factual: 'high', country: 'FR', type: 'mainstream', methodology: 'France 24, French public broadcaster' },

  // Arab/Middle East
  'alarabiya': { bias: 'center-right', factual: 'mostly-factual', country: 'SA', type: 'state', methodology: 'Saudi-owned, pro-Saudi editorial line' },

  // Left / Progressive
  '972mag': { bias: 'far-left', factual: 'mostly-factual', country: 'IL', type: 'independent', methodology: 'Israeli-Palestinian independent, explicitly progressive, anti-occupation' },
  'intercept': { bias: 'left', factual: 'mostly-factual', country: 'US', type: 'independent', methodology: 'MBFC: left. Investigative, progressive editorial line' },
  'thenation': { bias: 'left', factual: 'high', country: 'US', type: 'independent', methodology: 'AllSides: left. Oldest US progressive magazine' },
  'huffpost': { bias: 'left', factual: 'mostly-factual', country: 'US', type: 'mainstream', methodology: 'AllSides: left. MBFC: left-center. Large digital outlet' },
};

/**
 * Get bias info for a source
 */
export function getSourceBias(sourceId: string): SourceBias | null {
  const normalized = sourceId.toLowerCase().replace(/[\s_]/g, '-');

  // Try exact match first
  if (SOURCE_BIAS_DB[normalized]) {
    return { sourceId, sourceName: sourceId, ...SOURCE_BIAS_DB[normalized] };
  }

  // Try partial match
  for (const [key, data] of Object.entries(SOURCE_BIAS_DB)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return { sourceId, sourceName: sourceId, ...data };
    }
  }

  return null;
}

/**
 * Calculate bias score on a -3 to +3 scale
 */
const BIAS_SCORE: Record<BiasRating, number> = {
  'far-left': -3,
  'left': -2,
  'center-left': -1,
  'center': 0,
  'center-right': 1,
  'right': 2,
  'far-right': 3,
};

/**
 * Analyze coverage gaps: topics covered by only one side of the spectrum
 */
export function detectCoverageGaps(
  articles: Array<{ sourceId: string; topics?: string[]; title: string }>
): CoverageGapItem[] {
  // Group articles by topic
  const topicMap = new Map<string, { sources: Set<string>; biases: BiasRating[]; count: number }>();

  for (const article of articles) {
    const topics = article.topics || extractSimpleTopics(article.title);
    for (const topic of topics) {
      if (!topicMap.has(topic)) {
        topicMap.set(topic, { sources: new Set(), biases: [], count: 0 });
      }
      const entry = topicMap.get(topic)!;
      entry.sources.add(article.sourceId);
      entry.count++;

      const bias = getSourceBias(article.sourceId);
      if (bias) entry.biases.push(bias.bias);
    }
  }

  const gaps: CoverageGapItem[] = [];
  const allBiasCategories: BiasRating[] = ['far-left', 'left', 'center-left', 'center', 'center-right', 'right', 'far-right'];

  for (const [topic, data] of topicMap) {
    if (data.count < 3) continue; // need enough articles

    const coveredBiases = new Set(data.biases);
    const coveredBy = Array.from(coveredBiases);
    const missingFrom = allBiasCategories.filter(b => !coveredBiases.has(b));

    // Calculate average bias score
    const avgBias = data.biases.reduce((sum, b) => sum + BIAS_SCORE[b], 0) / data.biases.length;

    // Determine direction
    let direction: CoverageGapItem['direction'] = 'balanced';
    const hasLeft = data.biases.some(b => BIAS_SCORE[b] < 0);
    const hasRight = data.biases.some(b => BIAS_SCORE[b] > 0);
    const hasCenter = data.biases.some(b => BIAS_SCORE[b] === 0);

    if (hasLeft && !hasRight && !hasCenter) direction = 'left-only';
    else if (hasRight && !hasLeft && !hasCenter) direction = 'right-only';
    else if (hasCenter && !hasLeft && !hasRight) direction = 'center-only';
    else if (hasLeft && hasRight && !hasCenter) direction = 'both-extremes';

    // Gap score: how unbalanced is coverage
    const biasVariance = data.biases.reduce((sum, b) => sum + Math.pow(BIAS_SCORE[b] - avgBias, 2), 0) / data.biases.length;
    const gapScore = Math.min(100, Math.round(
      (missingFrom.length / allBiasCategories.length) * 50 +
      Math.abs(avgBias) * 15 +
      (1 / (biasVariance + 0.5)) * 10
    ));

    if (direction !== 'balanced' || gapScore > 40) {
      gaps.push({
        topic,
        coveredBy,
        missingFrom,
        articleCount: data.count,
        gapScore,
        direction,
      });
    }
  }

  return gaps.sort((a, b) => b.gapScore - a.gapScore).slice(0, 10);
}

/**
 * Detect narrative divergence: same topic, different framing by left vs right
 */
export function detectNarrativeDivergence(
  articles: Array<{
    sourceId: string;
    title: string;
    sentiment?: string;
    topics?: string[];
  }>
): NarrativeDivergenceItem[] {
  // Group by topic
  const topicArticles = new Map<string, Array<{
    sourceId: string;
    title: string;
    sentiment: string;
    bias: BiasRating;
  }>>();

  for (const article of articles) {
    const topics = article.topics || extractSimpleTopics(article.title);
    const bias = getSourceBias(article.sourceId);
    if (!bias) continue;

    for (const topic of topics) {
      if (!topicArticles.has(topic)) topicArticles.set(topic, []);
      topicArticles.get(topic)!.push({
        sourceId: article.sourceId,
        title: article.title,
        sentiment: article.sentiment || 'neutral',
        bias: bias.bias,
      });
    }
  }

  const divergences: NarrativeDivergenceItem[] = [];

  for (const [topic, arts] of topicArticles) {
    const leftArts = arts.filter(a => BIAS_SCORE[a.bias] < 0);
    const rightArts = arts.filter(a => BIAS_SCORE[a.bias] > 0);

    if (leftArts.length < 2 || rightArts.length < 2) continue;

    // Sentiment analysis per side
    const leftSentiments = countSentiments(leftArts.map(a => a.sentiment));
    const rightSentiments = countSentiments(rightArts.map(a => a.sentiment));

    const leftDominant = getDominantSentiment(leftSentiments);
    const rightDominant = getDominantSentiment(rightSentiments);

    // Framing analysis (keyword-based)
    const leftFraming = detectFraming(leftArts.map(a => a.title));
    const rightFraming = detectFraming(rightArts.map(a => a.title));

    // Calculate divergence score
    const sentimentDiff = Math.abs(
      sentimentToScore(leftDominant) - sentimentToScore(rightDominant)
    );
    const framingDiff = leftFraming !== rightFraming ? 30 : 0;
    const divergenceScore = Math.min(100, sentimentDiff * 25 + framingDiff + Math.min(20, (leftArts.length + rightArts.length) * 2));

    if (divergenceScore >= 30) {
      // Pick example articles
      const examples = [
        ...leftArts.slice(0, 2).map(a => ({ source: a.sourceId, bias: a.bias, title: a.title })),
        ...rightArts.slice(0, 2).map(a => ({ source: a.sourceId, bias: a.bias, title: a.title })),
      ];

      divergences.push({
        topic,
        leftNarrative: {
          sentiment: leftDominant,
          framing: leftFraming,
          articleCount: leftArts.length,
        },
        rightNarrative: {
          sentiment: rightDominant,
          framing: rightFraming,
          articleCount: rightArts.length,
        },
        divergenceScore,
        examples,
      });
    }
  }

  return divergences.sort((a, b) => b.divergenceScore - a.divergenceScore).slice(0, 8);
}

// ── Helpers ──

function extractSimpleTopics(title: string): string[] {
  const topics: string[] = [];
  const lower = title.toLowerCase();

  const topicKeywords: Record<string, string[]> = {
    'Iran Nuclear': ['iran', 'nuclear', 'enrichment', 'jcpoa', 'atomic'],
    'Gaza Conflict': ['gaza', 'hamas', 'ceasefire', 'hostage', 'rafah'],
    'Lebanon/Hezbollah': ['hezbollah', 'lebanon', 'nasrallah', 'northern border'],
    'US Politics': ['trump', 'biden', 'congress', 'white house', 'senate'],
    'Ukraine War': ['ukraine', 'russia', 'putin', 'zelensky', 'crimea'],
    'Saudi Relations': ['saudi', 'normalization', 'abraham accords', 'mbs'],
    'Tech Industry': ['ai ', 'tech layoffs', 'startup', 'cyber', 'openai'],
    'Economy': ['inflation', 'recession', 'interest rate', 'gdp', 'economic'],
    'Climate': ['climate', 'carbon', 'emissions', 'renewable'],
    'Judicial Reform': ['judicial reform', 'supreme court', 'democracy', 'protest'],
    'Syria': ['syria', 'assad', 'damascus'],
    'China-Taiwan': ['china', 'taiwan', 'beijing', 'xi jinping'],
  };

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) {
      topics.push(topic);
    }
  }

  return topics.length > 0 ? topics : ['General'];
}

function countSentiments(sentiments: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of sentiments) {
    counts[s] = (counts[s] || 0) + 1;
  }
  return counts;
}

function getDominantSentiment(counts: Record<string, number>): string {
  let max = 0;
  let dominant = 'neutral';
  for (const [s, c] of Object.entries(counts)) {
    if (c > max) { max = c; dominant = s; }
  }
  return dominant;
}

function sentimentToScore(sentiment: string): number {
  switch (sentiment) {
    case 'positive': return 2;
    case 'neutral': return 0;
    case 'negative': return -2;
    case 'mixed': return -1;
    default: return 0;
  }
}

function detectFraming(titles: string[]): string {
  const text = titles.join(' ').toLowerCase();
  const frames = {
    'security': ['attack', 'threat', 'terror', 'defense', 'military', 'war', 'strike', 'security'],
    'humanitarian': ['civilian', 'aid', 'refugee', 'crisis', 'human rights', 'victims', 'suffering'],
    'diplomatic': ['talks', 'agreement', 'negotiate', 'deal', 'summit', 'peace', 'diplomacy'],
    'economic': ['cost', 'price', 'market', 'trade', 'sanctions', 'economy', 'budget'],
    'political': ['election', 'vote', 'party', 'opposition', 'coalition', 'government'],
  };

  let bestFrame = 'neutral';
  let bestScore = 0;

  for (const [frame, keywords] of Object.entries(frames)) {
    const score = keywords.filter(kw => text.includes(kw)).length;
    if (score > bestScore) { bestScore = score; bestFrame = frame; }
  }

  return bestFrame;
}
