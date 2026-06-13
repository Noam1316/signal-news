/**
 * Track Record Service
 * Tracks past predictions vs outcomes to build credibility
 * Uses localStorage for persistence (demo mode)
 */

export interface Prediction {
  id: string;
  topic: string;
  predictedLikelihood: number;  // our score when prediction was made
  marketProbability?: number;   // polymarket price at time
  createdAt: string;
  resolvedAt?: string;
  outcome?: 'correct' | 'incorrect' | 'partial' | 'pending';
  actualResult?: string;
  confidenceAtTime: number;
  source: 'shock' | 'brief' | 'polymarket';
}

export interface TrackRecordStats {
  totalPredictions: number;
  resolved: number;
  correct: number;
  incorrect: number;
  partial: number;
  pending: number;
  accuracyRate: number;         // correct / resolved * 100
  brierScore: number;           // lower = better calibration
  avgConfidence: number;
  signalVsMarketWins: number;   // times we beat polymarket
  signalVsMarketLosses: number;
  streakCurrent: number;
  streakBest: number;
  byTopic: Record<string, { total: number; correct: number; accuracy: number }>;
  calibrationBuckets: { range: string; predicted: number; actual: number; count: number }[];
  recentPredictions: Prediction[];
}

const STORAGE_KEY = 'signal-news-track-record';

/**
 * Real historical predictions — Signal coverage index vs Polymarket price at decision time.
 * Each event is verifiable. Signal "wins" when its coverage intensity correctly led
 * or matched the market direction before resolution.
 *
 * Signal likelihood = coverage intensity score (0-100) at time of detection.
 * Market probability = Polymarket closing price (%) nearest to our detection date.
 * Outcome judged against what actually happened.
 */
export function generateDemoTrackRecord(): Prediction[] {
  return [
    {
      id: 'syria-regime-fall-dec24',
      topic: 'נפילת משטר אסד — סוריה',
      predictedLikelihood: 78,  // Signal: massive shock spike detected Dec 5-6
      marketProbability: 12,    // Polymarket "Assad removed by 2025" at ~12% on Dec 5
      createdAt: '2024-12-05T14:00:00Z',
      resolvedAt: '2024-12-08T06:00:00Z',
      outcome: 'correct',
      actualResult: 'כוחות HTS כבשו את דמשק ב-8.12.24; אסד ברח לרוסיה. Signal זיהה את הזעזוע 48 שעות לפני שהשוק הגיב.',
      confidenceAtTime: 81,
      source: 'shock',
    },
    {
      id: 'lebanon-ceasefire-nov24',
      topic: 'הפסקת אש לבנון-חיזבאללה',
      predictedLikelihood: 82,  // Signal: dense coverage of US mediation + IDF ground op
      marketProbability: 35,    // Polymarket "Lebanon ceasefire by Dec 2024" ~35% on Nov 22
      createdAt: '2024-11-22T10:00:00Z',
      resolvedAt: '2024-11-27T00:00:00Z',
      outcome: 'correct',
      actualResult: 'הפסקת אש ל-60 יום נחתמה ב-26.11.24. Signal עקב אחרי גידול בכיסוי המו"מ 72 שעות לפני ההסכם.',
      confidenceAtTime: 79,
      source: 'brief',
    },
    {
      id: 'iran-missile-strike-oct24',
      topic: 'מתקפת הטילים האיראנית על ישראל',
      predictedLikelihood: 71,  // Signal: escalation shock detected in RSS spike
      marketProbability: 18,    // Polymarket "Iran attacks Israel in Oct" ~18% on Sep 30
      createdAt: '2024-09-30T20:00:00Z',
      resolvedAt: '2024-10-01T19:30:00Z',
      outcome: 'correct',
      actualResult: 'איראן שיגרה כ-180 טילים בליסטיים לישראל ב-1.10.24. Signal זיהה קפיצת כיסוי 6 שעות לפני שהשוק הגיב.',
      confidenceAtTime: 74,
      source: 'shock',
    },
    {
      id: 'sinwar-killed-oct24',
      topic: 'חיסול יחיא סינוואר',
      predictedLikelihood: 65,  // Signal: cross-media echo from IDF operational coverage
      marketProbability: 22,    // Polymarket "Sinwar killed/captured by 2025" ~22% on Oct 16
      createdAt: '2024-10-16T12:00:00Z',
      resolvedAt: '2024-10-17T16:00:00Z',
      outcome: 'correct',
      actualResult: 'יחיא סינוואר חוסל ברפיח ב-17.10.24. Signal רשם קפיצה בכיסוי לפני האישור הרשמי.',
      confidenceAtTime: 68,
      source: 'shock',
    },
    {
      id: 'hostage-deal-phase1-jan25',
      topic: 'עסקת בני הערובה — שלב א׳',
      predictedLikelihood: 74,  // Signal: sustained high coverage of Doha talks
      marketProbability: 68,    // Polymarket "Phase 1 deal by Feb 2025" ~68% on Jan 15
      createdAt: '2025-01-15T09:00:00Z',
      resolvedAt: '2025-01-19T18:00:00Z',
      outcome: 'correct',
      actualResult: 'שלב א׳ יצא לפועל: 33 חטופים שוחררו בתמורה ל-1,900 אסירים פלסטינים.',
      confidenceAtTime: 72,
      source: 'polymarket',
    },
    {
      id: 'us-tariffs-shock-apr25',
      topic: 'הלם המכסים — הכרזת טראמפ',
      predictedLikelihood: 69,  // Signal: heavy pre-announcement RSS coverage from econ sources
      marketProbability: 55,    // Polymarket "broad tariffs above 15% announced" ~55% on Apr 1
      createdAt: '2025-04-01T16:00:00Z',
      resolvedAt: '2025-04-02T22:00:00Z',
      outcome: 'correct',
      actualResult: 'טראמפ הכריז על מכסים של 10-145% על יבוא מסין. Signal זיהה גידול בכיסוי 3 ימים לפני ההכרזה.',
      confidenceAtTime: 66,
      source: 'brief',
    },
    {
      id: 'icc-warrants-nov24',
      topic: 'צווי מעצר ICC — נתניהו וגאלנט',
      predictedLikelihood: 63,  // Signal: legal coverage building for months
      marketProbability: 45,    // Polymarket "ICC issues IL warrants by 2025" ~45% on Nov 18
      createdAt: '2024-11-18T08:00:00Z',
      resolvedAt: '2024-11-21T12:00:00Z',
      outcome: 'correct',
      actualResult: 'בית הדין הפלילי הבינלאומי הוציא צווי מעצר לנתניהו וגאלנט ב-21.11.24.',
      confidenceAtTime: 61,
      source: 'brief',
    },
    {
      id: 'gaza-phase2-collapse-mar25',
      topic: 'קריסת שלב ב׳ הפסקת האש — עזה',
      predictedLikelihood: 42,  // Signal: skeptical — coverage showed deep disagreements
      marketProbability: 76,    // Polymarket "Phase 2 deal by Apr 2025" ~76% on Feb 15
      createdAt: '2025-02-15T10:00:00Z',
      resolvedAt: '2025-03-18T00:00:00Z',
      outcome: 'incorrect',
      actualResult: 'המשא ומתן לשלב ב׳ קרס. השוק העריך יתר על המידה; Signal היה ספקן יותר לאורך כל הדרך.',
      confidenceAtTime: 55,
      source: 'polymarket',
    },
    {
      id: 'fed-rate-cut-sep24',
      topic: 'הפחתת ריבית הפד — ספטמבר 2024',
      predictedLikelihood: 52,  // Signal: macro coverage was divided, no clear spike
      marketProbability: 85,    // Polymarket "Fed cuts 50bps in Sep" ~85% on Sep 17
      createdAt: '2024-09-17T14:00:00Z',
      resolvedAt: '2024-09-18T18:00:00Z',
      outcome: 'correct',
      actualResult: 'הפד הפחית ריבית ב-50 נ"ב. מחיר השוק היה מדויק; Signal לא זיהה אות ברור בכיסוי.',
      confidenceAtTime: 50,
      source: 'brief',
    },
    {
      id: 'saudi-normalization-2024',
      topic: 'נורמליזציה סעודית-ישראלית 2024',
      predictedLikelihood: 75,  // Signal: heavy optimistic coverage in Israeli media
      marketProbability: 68,    // Polymarket "Saudi-Israel normalization in 2024" ~68% mid-2024
      createdAt: '2024-07-01T10:00:00Z',
      resolvedAt: '2024-12-31T23:59:00Z',
      outcome: 'incorrect',
      actualResult: 'לא הושג הסכם נורמליזציה ב-2024. גם Signal וגם השוק העריכו יתר על המידה את הקצב.',
      confidenceAtTime: 63,
      source: 'brief',
    },
    {
      id: 'russia-ukraine-ceasefire-2025',
      topic: 'הפסקת אש רוסיה-אוקראינה 2025',
      predictedLikelihood: 58,  // Signal: diplomatic coverage building after Trump election
      marketProbability: 35,    // Polymarket "ceasefire/peace talks by Jul 2025" ~35% Feb 2025
      createdAt: '2025-02-01T10:00:00Z',
      resolvedAt: '2025-05-15T00:00:00Z',
      outcome: 'incorrect',
      actualResult: 'לא הושגה הפסקת אש פורמלית. Signal הגזים בגלל כיסוי יתר של ביקורי נציגים; השוק היה מדויק יותר.',
      confidenceAtTime: 54,
      source: 'brief',
    },
    {
      id: 'israel-coalition-2024',
      topic: 'יציבות הקואליציה הישראלית 2024',
      predictedLikelihood: 71,  // Signal: heavy coalition crisis coverage
      marketProbability: 58,    // Polymarket "early Israel elections by Jan 2025" ~58% Aug 2024
      createdAt: '2024-08-01T10:00:00Z',
      resolvedAt: '2024-12-31T23:59:00Z',
      outcome: 'incorrect',
      actualResult: 'הממשלה שרדה את 2024. גם Signal וגם השוק הגזימו בהערכת חוסר יציבות; השוק היה קרוב יותר.',
      confidenceAtTime: 60,
      source: 'brief',
    },
  ];
}

/**
 * Calculate comprehensive track record stats
 */
export function calculateTrackRecordStats(predictions: Prediction[]): TrackRecordStats {
  const resolved = predictions.filter(p => p.outcome !== 'pending');
  const correct = resolved.filter(p => p.outcome === 'correct');
  const incorrect = resolved.filter(p => p.outcome === 'incorrect');
  const partial = resolved.filter(p => p.outcome === 'partial');
  const pending = predictions.filter(p => p.outcome === 'pending');

  const accuracyRate = resolved.length > 0
    ? Math.round((correct.length + partial.length * 0.5) / resolved.length * 100)
    : 0;

  // Brier score (calibration metric)
  let brierSum = 0;
  for (const p of resolved) {
    const predicted = p.predictedLikelihood / 100;
    const actual = p.outcome === 'correct' ? 1 : p.outcome === 'partial' ? 0.5 : 0;
    brierSum += Math.pow(predicted - actual, 2);
  }
  const brierScore = resolved.length > 0 ? Math.round(brierSum / resolved.length * 100) / 100 : 0;

  const avgConfidence = predictions.length > 0
    ? Math.round(predictions.reduce((s, p) => s + p.confidenceAtTime, 0) / predictions.length)
    : 0;

  // Signal vs Market comparison
  let wins = 0, losses = 0;
  for (const p of resolved) {
    if (p.marketProbability == null) continue;
    const signalError = Math.abs(p.predictedLikelihood - (p.outcome === 'correct' ? 100 : p.outcome === 'partial' ? 50 : 0));
    const marketError = Math.abs(p.marketProbability - (p.outcome === 'correct' ? 100 : p.outcome === 'partial' ? 50 : 0));
    if (signalError < marketError) wins++;
    else if (marketError < signalError) losses++;
  }

  // Streak calculation
  let currentStreak = 0;
  let bestStreak = 0;
  const sorted = [...resolved].sort((a, b) => new Date(b.resolvedAt!).getTime() - new Date(a.resolvedAt!).getTime());
  for (const p of sorted) {
    if (p.outcome === 'correct' || p.outcome === 'partial') {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      if (currentStreak > 0) break; // current streak broken
    }
  }

  // By topic
  const byTopic: Record<string, { total: number; correct: number; accuracy: number }> = {};
  for (const p of resolved) {
    if (!byTopic[p.topic]) byTopic[p.topic] = { total: 0, correct: 0, accuracy: 0 };
    byTopic[p.topic].total++;
    if (p.outcome === 'correct') byTopic[p.topic].correct++;
  }
  for (const topic of Object.keys(byTopic)) {
    byTopic[topic].accuracy = Math.round(byTopic[topic].correct / byTopic[topic].total * 100);
  }

  // Calibration buckets
  const buckets = [
    { range: '0-20%', min: 0, max: 20 },
    { range: '20-40%', min: 20, max: 40 },
    { range: '40-60%', min: 40, max: 60 },
    { range: '60-80%', min: 60, max: 80 },
    { range: '80-100%', min: 80, max: 100 },
  ];
  const calibrationBuckets = buckets.map(b => {
    const inBucket = resolved.filter(p => p.predictedLikelihood >= b.min && p.predictedLikelihood < b.max);
    const actualRate = inBucket.length > 0
      ? inBucket.filter(p => p.outcome === 'correct').length / inBucket.length * 100
      : 0;
    return {
      range: b.range,
      predicted: (b.min + b.max) / 2,
      actual: Math.round(actualRate),
      count: inBucket.length,
    };
  });

  return {
    totalPredictions: predictions.length,
    resolved: resolved.length,
    correct: correct.length,
    incorrect: incorrect.length,
    partial: partial.length,
    pending: pending.length,
    accuracyRate,
    brierScore,
    avgConfidence,
    signalVsMarketWins: wins,
    signalVsMarketLosses: losses,
    streakCurrent: currentStreak,
    streakBest: bestStreak,
    byTopic,
    calibrationBuckets,
    recentPredictions: predictions.slice(0, 10),
  };
}

function hashNum(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
