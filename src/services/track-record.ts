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
 * Generate demo track record with realistic prediction history
 */
export function generateDemoTrackRecord(): Prediction[] {
  const predictions: Prediction[] = [];
  const now = new Date();

  const topics = [
    'Iran Nuclear Talks', 'Gaza Ceasefire Progress', 'Saudi Normalization',
    'Ukraine Counteroffensive', 'Fed Interest Rate Decision', 'Trump Indictment Impact',
    'Hezbollah Escalation', 'Oil Price Spike', 'AI Regulation Bill',
    'Syria Regime Change', 'China Taiwan Tensions', 'Israeli Judicial Reform',
    'Hamas Hostage Deal', 'US Election Polls', 'Crypto Regulation',
    'Lebanon Border Clash', 'Iran Proxy Attack', 'OPEC Production Cut',
    'Tech Layoffs Wave', 'Russia NATO Tensions', 'Ceasefire Extension',
    'Settler Violence Spike', 'Iran Enrichment Breach', 'US Aid Package',
    'Coalition Crisis', 'Drone Attack Attribution', 'Currency Devaluation',
    'Cyber Attack Attribution', 'Peace Summit Outcome', 'Sanctions Expansion',
  ];

  const sources: Prediction['source'][] = ['shock', 'brief', 'polymarket'];

  for (let i = 0; i < 30; i++) {
    const seed = hashNum(`pred-${i}`);
    const daysAgo = Math.floor(i * 2.5) + (seed % 3);
    const createdAt = new Date(now.getTime() - daysAgo * 86400000);
    const predicted = 30 + (seed % 60); // 30-89%
    const market = predicted + ((seed % 30) - 15); // ±15% from our prediction
    const confidence = 40 + (seed % 50);

    // Resolve older predictions (70% resolved)
    const isResolved = i > 5 || seed % 10 < 7;
    let outcome: Prediction['outcome'] = 'pending';
    let resolvedAt: string | undefined;
    let actualResult: string | undefined;

    if (isResolved) {
      resolvedAt = new Date(createdAt.getTime() + (2 + seed % 10) * 86400000).toISOString();

      // Accuracy depends on confidence — higher confidence predictions are more often correct
      const correctChance = confidence / 100 * 0.85 + 0.1; // 10-95% based on confidence
      const roll = (seed * 13) % 100 / 100;

      if (roll < correctChance) {
        outcome = 'correct';
        actualResult = 'Prediction matched outcome';
      } else if (roll < correctChance + 0.15) {
        outcome = 'partial';
        actualResult = 'Partially correct — direction right, magnitude off';
      } else {
        outcome = 'incorrect';
        actualResult = 'Prediction did not match outcome';
      }
    }

    predictions.push({
      id: `pred-${i}`,
      topic: topics[i % topics.length],
      predictedLikelihood: Math.min(95, Math.max(10, predicted)),
      marketProbability: Math.min(95, Math.max(5, market)),
      createdAt: createdAt.toISOString(),
      resolvedAt,
      outcome,
      actualResult,
      confidenceAtTime: confidence,
      source: sources[seed % 3],
    });
  }

  return predictions;
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
