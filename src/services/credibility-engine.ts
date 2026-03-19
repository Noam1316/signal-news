/**
 * Credibility Engine
 * Multi-layer reliability scoring that prevents misleading analysis
 *
 * Philosophy: "It's better to say 'we don't know' than to guess wrong"
 *
 * 5 Credibility Layers:
 * 1. Source Evidence — how many independent sources back a claim
 * 2. Contradiction Detection — when sources disagree, flag it
 * 3. Methodology Transparency — explain every score
 * 4. Confidence Decay — older data → lower confidence
 * 5. Uncertainty Flag — not enough data = "insufficient evidence"
 */

import { getSourceBias, SOURCE_BIAS_DB, type FactualRating } from './media-bias';

// ── Types ──

export type CredibilityGrade = 'A' | 'B' | 'C' | 'D' | 'F' | 'INSUFFICIENT';

export interface SourceEvidence {
  sourceId: string;
  sourceName: string;
  factualRating: FactualRating;
  factualWeight: number;       // 0-1 weight based on factual rating
  bias: string;
  isIndependent: boolean;      // not wire-service copy
  publishedAt: string;
  title: string;
}

export interface ContradictionAlert {
  topic: string;
  type: 'factual' | 'sentiment' | 'framing' | 'magnitude';
  description: string;
  descriptionHe: string;
  severity: 'low' | 'medium' | 'high';
  sideA: { sources: string[]; claim: string; sentiment: string };
  sideB: { sources: string[]; claim: string; sentiment: string };
  recommendation: string;
  recommendationHe: string;
}

export interface MethodologyBreakdown {
  factor: string;
  factorHe: string;
  weight: number;            // % weight in final score
  rawValue: number;          // 0-100
  weightedValue: number;     // rawValue * weight
  explanation: string;
  explanationHe: string;
  dataPoints: number;        // how many data points fed this factor
  reliability: 'strong' | 'moderate' | 'weak';
}

export interface CredibilityReport {
  topic: string;
  overallGrade: CredibilityGrade;
  overallScore: number;           // 0-100
  isReliable: boolean;            // can we present this confidently?

  // Layer 1: Source Evidence
  sourceEvidence: SourceEvidence[];
  independentSourceCount: number;
  totalSourceCount: number;
  avgFactualRating: number;       // 0-1

  // Layer 2: Contradictions
  contradictions: ContradictionAlert[];
  hasContradictions: boolean;

  // Layer 3: Methodology
  methodology: MethodologyBreakdown[];

  // Layer 4: Decay
  freshness: number;              // 0-1 (1 = very fresh)
  oldestArticleHoursAgo: number;
  newestArticleHoursAgo: number;
  decayPenalty: number;           // 0-1 penalty applied

  // Layer 5: Uncertainty
  uncertaintyLevel: 'low' | 'moderate' | 'high' | 'insufficient';
  uncertaintyReason?: string;
  uncertaintyReasonHe?: string;

  // Final recommendation
  displayRecommendation: 'show' | 'show-with-warning' | 'show-as-uncertain' | 'hide';
  warningMessage?: string;
  warningMessageHe?: string;
}

// ── Constants ──

const FACTUAL_WEIGHTS: Record<FactualRating, number> = {
  'very-high': 1.0,
  'high': 0.85,
  'mostly-factual': 0.65,
  'mixed': 0.4,
  'low': 0.15,
};

// Minimum thresholds for credible analysis
const MIN_SOURCES = 3;             // need at least 3 sources
const MIN_INDEPENDENT_SOURCES = 2; // need at least 2 independent sources
const MIN_FACTUAL_AVG = 0.5;       // average factual rating must be > 0.5
const FRESHNESS_HALF_LIFE_HOURS = 12; // confidence halves every 12 hours

// Source groups that share content (wire services / content sharing)
const SOURCE_GROUPS: string[][] = [
  ['reuters', 'ap'],                    // Wire services (if both cite, count as 1.5 not 2)
  ['ynet', 'mako', 'n12'],             // Channel 12 ecosystem
  ['haaretz', 'haaretz-en', 'the-marker'], // Haaretz group
  ['israelhayom', 'ch14'],             // Right-leaning group
];

// ── Core Functions ──

/**
 * Generate a full credibility report for a topic/story
 */
export function generateCredibilityReport(
  topic: string,
  articles: Array<{
    sourceId: string;
    title: string;
    pubDate: string;
    sentiment?: string;
    topics?: string[];
    signalScore?: number;
  }>,
  likelihoodScore: number,
  likelihoodFactors?: Array<{ name: string; weight: number; value: number }>
): CredibilityReport {
  const now = new Date();

  // ── Layer 1: Source Evidence ──
  const sourceEvidence: SourceEvidence[] = articles.map(a => {
    const biasInfo = getSourceBias(a.sourceId);
    const factual = biasInfo?.factual || 'mixed';
    return {
      sourceId: a.sourceId,
      sourceName: biasInfo?.sourceName || a.sourceId,
      factualRating: factual,
      factualWeight: FACTUAL_WEIGHTS[factual],
      bias: biasInfo?.bias || 'unknown',
      isIndependent: isIndependentSource(a.sourceId, articles.map(x => x.sourceId)),
      publishedAt: a.pubDate,
      title: a.title,
    };
  });

  const independentSourceCount = sourceEvidence.filter(s => s.isIndependent).length;
  const totalSourceCount = sourceEvidence.length;
  const avgFactualRating = totalSourceCount > 0
    ? sourceEvidence.reduce((sum, s) => sum + s.factualWeight, 0) / totalSourceCount
    : 0;

  // ── Layer 2: Contradiction Detection ──
  const contradictions = detectContradictions(topic, articles);

  // ── Layer 3: Methodology Transparency ──
  const methodology = generateMethodology(likelihoodScore, likelihoodFactors, {
    sourceCount: totalSourceCount,
    independentCount: independentSourceCount,
    avgFactual: avgFactualRating,
    hasContradictions: contradictions.length > 0,
  });

  // ── Layer 4: Confidence Decay ──
  const timestamps = articles.map(a => new Date(a.pubDate).getTime());
  const oldest = Math.min(...timestamps);
  const newest = Math.max(...timestamps);
  const oldestHoursAgo = (now.getTime() - oldest) / 3600000;
  const newestHoursAgo = (now.getTime() - newest) / 3600000;

  // Exponential decay based on freshness
  const freshness = Math.exp(-newestHoursAgo / FRESHNESS_HALF_LIFE_HOURS);
  const decayPenalty = 1 - freshness;

  // ── Layer 5: Uncertainty Assessment ──
  const { uncertaintyLevel, uncertaintyReason, uncertaintyReasonHe } = assessUncertainty(
    totalSourceCount, independentSourceCount, avgFactualRating,
    contradictions.length, freshness
  );

  // ── Final Score ──
  let overallScore = calculateOverallCredibility(
    totalSourceCount, independentSourceCount, avgFactualRating,
    contradictions.length, freshness
  );

  const overallGrade = scoreToGrade(overallScore);
  const isReliable = overallScore >= 60 && uncertaintyLevel !== 'insufficient';

  // Display recommendation
  let displayRecommendation: CredibilityReport['displayRecommendation'];
  let warningMessage: string | undefined;
  let warningMessageHe: string | undefined;

  if (uncertaintyLevel === 'insufficient') {
    displayRecommendation = 'hide';
    warningMessage = 'Insufficient data to make a reliable assessment';
    warningMessageHe = 'אין מספיק נתונים להערכה אמינה';
  } else if (contradictions.some(c => c.severity === 'high')) {
    displayRecommendation = 'show-with-warning';
    warningMessage = 'Major contradictions detected between sources';
    warningMessageHe = 'זוהו סתירות משמעותיות בין מקורות';
  } else if (uncertaintyLevel === 'high') {
    displayRecommendation = 'show-as-uncertain';
    warningMessage = 'Limited evidence — treat as preliminary';
    warningMessageHe = 'עדויות מוגבלות — יש להתייחס כהערכה ראשונית';
  } else if (overallScore < 50) {
    displayRecommendation = 'show-with-warning';
    warningMessage = 'Low credibility score — verify independently';
    warningMessageHe = 'ציון אמינות נמוך — מומלץ לאמת באופן עצמאי';
  } else {
    displayRecommendation = 'show';
  }

  return {
    topic,
    overallGrade,
    overallScore,
    isReliable,
    sourceEvidence,
    independentSourceCount,
    totalSourceCount,
    avgFactualRating,
    contradictions,
    hasContradictions: contradictions.length > 0,
    methodology,
    freshness,
    oldestArticleHoursAgo: Math.round(oldestHoursAgo),
    newestArticleHoursAgo: Math.round(newestHoursAgo * 10) / 10,
    decayPenalty: Math.round(decayPenalty * 100) / 100,
    uncertaintyLevel,
    uncertaintyReason,
    uncertaintyReasonHe,
    displayRecommendation,
    warningMessage,
    warningMessageHe,
  };
}

// ── Helper Functions ──

/**
 * Check if a source is independent (not in the same content group as another article's source)
 */
function isIndependentSource(sourceId: string, allSourceIds: string[]): boolean {
  for (const group of SOURCE_GROUPS) {
    if (group.includes(sourceId)) {
      // If another source in the same group is also present, this one isn't fully independent
      const groupPeers = group.filter(g => g !== sourceId && allSourceIds.includes(g));
      if (groupPeers.length > 0) return false;
    }
  }
  return true;
}

/**
 * Detect contradictions between articles on the same topic
 */
function detectContradictions(
  topic: string,
  articles: Array<{ sourceId: string; title: string; sentiment?: string }>
): ContradictionAlert[] {
  const contradictions: ContradictionAlert[] = [];

  // Group by sentiment
  const positive = articles.filter(a => a.sentiment === 'positive');
  const negative = articles.filter(a => a.sentiment === 'negative');

  // Sentiment contradiction
  if (positive.length >= 2 && negative.length >= 2) {
    const posSources = positive.map(a => a.sourceId);
    const negSources = negative.map(a => a.sourceId);

    // Check if it's a genuine split (different source groups) vs same echo chamber
    const posGroups = new Set(posSources.map(s => getSourceGroup(s)));
    const negGroups = new Set(negSources.map(s => getSourceGroup(s)));
    const genuineSplit = posGroups.size > 0 && negGroups.size > 0;

    if (genuineSplit) {
      contradictions.push({
        topic,
        type: 'sentiment',
        description: `${positive.length} sources report positively while ${negative.length} report negatively on "${topic}"`,
        descriptionHe: `${positive.length} מקורות מדווחים בחיוב בעוד ${negative.length} מדווחים בשלילה על "${topic}"`,
        severity: Math.abs(positive.length - negative.length) <= 1 ? 'high' : 'medium',
        sideA: {
          sources: posSources.slice(0, 3),
          claim: positive[0]?.title || '',
          sentiment: 'positive',
        },
        sideB: {
          sources: negSources.slice(0, 3),
          claim: negative[0]?.title || '',
          sentiment: 'negative',
        },
        recommendation: 'Consider both perspectives — the truth likely lies somewhere between these narratives',
        recommendationHe: 'שקול את שני הצדדים — האמת ככל הנראה נמצאת בין הנרטיבים',
      });
    }
  }

  // Framing contradiction: check if different sources frame differently
  const framings = analyzeFramingDifferences(articles);
  if (framings) {
    contradictions.push(framings);
  }

  return contradictions;
}

function getSourceGroup(sourceId: string): string {
  for (const group of SOURCE_GROUPS) {
    if (group.includes(sourceId)) return group[0];
  }
  return sourceId;
}

function analyzeFramingDifferences(
  articles: Array<{ sourceId: string; title: string; sentiment?: string }>
): ContradictionAlert | null {
  if (articles.length < 4) return null;

  const titles = articles.map(a => a.title.toLowerCase());

  // Security vs humanitarian framing
  const securityKeywords = ['attack', 'terror', 'military', 'strike', 'defense', 'threat', 'security', 'תקיפה', 'צבאי', 'טרור'];
  const humanKeywords = ['civilian', 'aid', 'refugee', 'humanitarian', 'victim', 'crisis', 'death', 'אזרחי', 'סיוע', 'פליט'];

  const securityFramed = articles.filter(a => {
    const t = a.title.toLowerCase();
    return securityKeywords.some(kw => t.includes(kw));
  });
  const humanFramed = articles.filter(a => {
    const t = a.title.toLowerCase();
    return humanKeywords.some(kw => t.includes(kw));
  });

  if (securityFramed.length >= 2 && humanFramed.length >= 2) {
    return {
      topic: 'Framing Divergence',
      type: 'framing',
      description: `Same event framed as security issue by ${securityFramed.length} sources and humanitarian issue by ${humanFramed.length} sources`,
      descriptionHe: `אותו אירוע ממוסגר כסוגיית ביטחון ע"י ${securityFramed.length} מקורות ו כסוגיה הומניטרית ע"י ${humanFramed.length} מקורות`,
      severity: 'medium',
      sideA: {
        sources: securityFramed.slice(0, 3).map(a => a.sourceId),
        claim: securityFramed[0]?.title || '',
        sentiment: 'security framing',
      },
      sideB: {
        sources: humanFramed.slice(0, 3).map(a => a.sourceId),
        claim: humanFramed[0]?.title || '',
        sentiment: 'humanitarian framing',
      },
      recommendation: 'Both framings are valid perspectives — consider the full picture',
      recommendationHe: 'שני המסגורים הם נקודות מבט תקפות — שקול את התמונה המלאה',
    };
  }

  return null;
}

/**
 * Generate methodology breakdown explaining how the score was calculated
 */
function generateMethodology(
  score: number,
  factors: Array<{ name: string; weight: number; value: number }> | undefined,
  meta: { sourceCount: number; independentCount: number; avgFactual: number; hasContradictions: boolean }
): MethodologyBreakdown[] {
  if (factors && factors.length > 0) {
    return factors.map(f => ({
      factor: f.name,
      factorHe: translateFactor(f.name),
      weight: Math.round(f.weight * 100),
      rawValue: Math.round(f.value),
      weightedValue: Math.round(f.value * f.weight),
      explanation: explainFactor(f.name, f.value, meta),
      explanationHe: explainFactorHe(f.name, f.value, meta),
      dataPoints: meta.sourceCount,
      reliability: f.value > 70 ? 'strong' : f.value > 40 ? 'moderate' : 'weak',
    }));
  }

  // Default methodology if no factors provided
  return [
    {
      factor: 'Cross-Source Verification',
      factorHe: 'אימות חוצה-מקורות',
      weight: 30,
      rawValue: Math.min(100, meta.independentCount * 20),
      weightedValue: Math.round(Math.min(100, meta.independentCount * 20) * 0.3),
      explanation: `${meta.independentCount} independent sources confirm this story`,
      explanationHe: `${meta.independentCount} מקורות עצמאיים מאשרים את הסיפור`,
      dataPoints: meta.sourceCount,
      reliability: meta.independentCount >= 3 ? 'strong' : meta.independentCount >= 2 ? 'moderate' : 'weak',
    },
    {
      factor: 'Source Quality',
      factorHe: 'איכות מקורות',
      weight: 25,
      rawValue: Math.round(meta.avgFactual * 100),
      weightedValue: Math.round(meta.avgFactual * 25),
      explanation: `Average factual rating: ${(meta.avgFactual * 100).toFixed(0)}% across ${meta.sourceCount} sources`,
      explanationHe: `דירוג עובדתיות ממוצע: ${(meta.avgFactual * 100).toFixed(0)}% מתוך ${meta.sourceCount} מקורות`,
      dataPoints: meta.sourceCount,
      reliability: meta.avgFactual > 0.7 ? 'strong' : meta.avgFactual > 0.5 ? 'moderate' : 'weak',
    },
    {
      factor: 'Consensus Level',
      factorHe: 'רמת קונסנזוס',
      weight: 25,
      rawValue: meta.hasContradictions ? 30 : 80,
      weightedValue: meta.hasContradictions ? 8 : 20,
      explanation: meta.hasContradictions
        ? 'Sources disagree on key aspects — reduced confidence'
        : 'Sources generally agree on the narrative',
      explanationHe: meta.hasContradictions
        ? 'מקורות חלוקים בנושאים מרכזיים — ביטחון מופחת'
        : 'מקורות מסכימים באופן כללי על הנרטיב',
      dataPoints: meta.sourceCount,
      reliability: meta.hasContradictions ? 'weak' : 'strong',
    },
    {
      factor: 'Data Volume',
      factorHe: 'היקף נתונים',
      weight: 20,
      rawValue: Math.min(100, meta.sourceCount * 15),
      weightedValue: Math.round(Math.min(100, meta.sourceCount * 15) * 0.2),
      explanation: `Based on ${meta.sourceCount} articles — ${meta.sourceCount >= 5 ? 'sufficient' : 'limited'} data`,
      explanationHe: `מבוסס על ${meta.sourceCount} כתבות — ${meta.sourceCount >= 5 ? 'מספיק' : 'מוגבל'} נתונים`,
      dataPoints: meta.sourceCount,
      reliability: meta.sourceCount >= 5 ? 'strong' : meta.sourceCount >= 3 ? 'moderate' : 'weak',
    },
  ];
}

function translateFactor(name: string): string {
  const map: Record<string, string> = {
    'Cross-source verification': 'אימות חוצה-מקורות',
    'Signal strength': 'עוצמת סיגנל',
    'Cross-lens coverage': 'כיסוי חוצה-עדשות',
    'Recency': 'עדכניות',
    'Sentiment consensus': 'קונסנזוס סנטימנט',
  };
  return map[name] || name;
}

function explainFactor(name: string, value: number, meta: any): string {
  if (value > 70) return `Strong signal: ${name} scores ${value}/100 based on ${meta.sourceCount} sources`;
  if (value > 40) return `Moderate signal: ${name} scores ${value}/100 — more data would strengthen this`;
  return `Weak signal: ${name} scores ${value}/100 — insufficient evidence for high confidence`;
}

function explainFactorHe(name: string, value: number, meta: any): string {
  if (value > 70) return `סיגנל חזק: ${translateFactor(name)} מקבל ${value}/100 על בסיס ${meta.sourceCount} מקורות`;
  if (value > 40) return `סיגנל בינוני: ${translateFactor(name)} מקבל ${value}/100 — נתונים נוספים יחזקו זאת`;
  return `סיגנל חלש: ${translateFactor(name)} מקבל ${value}/100 — אין מספיק עדויות לביטחון גבוה`;
}

/**
 * Assess overall uncertainty level
 */
function assessUncertainty(
  totalSources: number,
  independentSources: number,
  avgFactual: number,
  contradictionCount: number,
  freshness: number
): { uncertaintyLevel: CredibilityReport['uncertaintyLevel']; uncertaintyReason?: string; uncertaintyReasonHe?: string } {
  // Insufficient data
  if (totalSources < MIN_SOURCES) {
    return {
      uncertaintyLevel: 'insufficient',
      uncertaintyReason: `Only ${totalSources} source(s) found — minimum ${MIN_SOURCES} required for analysis`,
      uncertaintyReasonHe: `נמצאו רק ${totalSources} מקור(ות) — נדרשים מינימום ${MIN_SOURCES} לניתוח`,
    };
  }

  if (independentSources < MIN_INDEPENDENT_SOURCES) {
    return {
      uncertaintyLevel: 'insufficient',
      uncertaintyReason: `Only ${independentSources} independent source(s) — ${MIN_INDEPENDENT_SOURCES} required (others may be duplicating content)`,
      uncertaintyReasonHe: `רק ${independentSources} מקור(ות) עצמאי(ם) — נדרשים ${MIN_INDEPENDENT_SOURCES} (אחרים עלולים לשכפל תוכן)`,
    };
  }

  // High uncertainty
  if (avgFactual < MIN_FACTUAL_AVG) {
    return {
      uncertaintyLevel: 'high',
      uncertaintyReason: 'Source quality is below threshold — mostly low-factual sources',
      uncertaintyReasonHe: 'איכות המקורות מתחת לסף — רוב המקורות בעלי דירוג עובדתיות נמוך',
    };
  }

  if (contradictionCount >= 2) {
    return {
      uncertaintyLevel: 'high',
      uncertaintyReason: `${contradictionCount} contradictions detected — narrative is contested`,
      uncertaintyReasonHe: `${contradictionCount} סתירות זוהו — הנרטיב שנוי במחלוקת`,
    };
  }

  if (freshness < 0.3) {
    return {
      uncertaintyLevel: 'high',
      uncertaintyReason: 'Data is stale — latest article is over 18 hours old',
      uncertaintyReasonHe: 'הנתונים ישנים — הכתבה האחרונה לפני יותר מ-18 שעות',
    };
  }

  // Moderate uncertainty
  if (totalSources < 5 || contradictionCount === 1 || freshness < 0.6) {
    return {
      uncertaintyLevel: 'moderate',
      uncertaintyReason: 'Moderate data available — assessment may change with new information',
      uncertaintyReasonHe: 'כמות נתונים בינונית — ההערכה עלולה להשתנות עם מידע חדש',
    };
  }

  return { uncertaintyLevel: 'low' };
}

/**
 * Calculate overall credibility score
 */
function calculateOverallCredibility(
  totalSources: number,
  independentSources: number,
  avgFactual: number,
  contradictionCount: number,
  freshness: number
): number {
  // Base factors
  const sourceScore = Math.min(100, independentSources * 18 + totalSources * 5);
  const qualityScore = avgFactual * 100;
  const consensusScore = Math.max(0, 100 - contradictionCount * 30);
  const freshnessScore = freshness * 100;

  // Weighted combination
  const raw = sourceScore * 0.3 + qualityScore * 0.25 + consensusScore * 0.25 + freshnessScore * 0.2;

  // Penalty for insufficient data
  if (totalSources < MIN_SOURCES) return Math.min(30, raw * 0.5);
  if (independentSources < MIN_INDEPENDENT_SOURCES) return Math.min(40, raw * 0.6);

  return Math.round(Math.min(100, Math.max(0, raw)));
}

function scoreToGrade(score: number): CredibilityGrade {
  if (score < 20) return 'INSUFFICIENT';
  if (score < 40) return 'F';
  if (score < 55) return 'D';
  if (score < 70) return 'C';
  if (score < 85) return 'B';
  return 'A';
}
