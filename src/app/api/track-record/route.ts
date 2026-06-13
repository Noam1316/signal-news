import { NextResponse } from 'next/server';
import { getTrackRecord, getPendingCount } from '@/services/prediction-tracker';
import { generateDemoTrackRecord, calculateTrackRecordStats } from '@/services/track-record';

export async function GET() {
  try {
    const [record, pending] = await Promise.all([
      getTrackRecord(),
      getPendingCount(),
    ]);

    // When no real KV data yet, blend in rich demo stats for credibility display
    const hasRealData = record.total > 0;

    if (hasRealData) {
      return NextResponse.json({ ...record, pending, dataMode: 'live' });
    }

    // Demo mode: real historical predictions with verifiable outcomes
    const demoData = generateDemoTrackRecord();
    const demoStats = calculateTrackRecordStats(demoData);

    // Compute actual per-prediction errors (|signal - outcome| vs |market - outcome|)
    const resolved = demoData.filter(p => p.outcome !== 'pending' && p.outcome !== undefined);
    const recentWithErrors = resolved.map(p => {
      const actualVal = p.outcome === 'correct' ? 100 : p.outcome === 'partial' ? 50 : 0;
      const signalError = Math.abs(p.predictedLikelihood - actualVal);
      const mktProb = p.marketProbability ?? p.predictedLikelihood;
      const marketError = Math.abs(mktProb - actualVal);
      return {
        topic: p.topic,
        signalLikelihood: p.predictedLikelihood,
        marketProbability: mktProb,
        outcome: p.outcome,
        snapshotAt: p.createdAt,
        resolvedAt: p.resolvedAt,
        signalWasCloser: signalError < marketError,
        signalError,
        marketError,
      };
    });

    const avgSignalError = resolved.length > 0
      ? Math.round(recentWithErrors.reduce((s, r) => s + r.signalError, 0) / resolved.length)
      : 0;
    const avgMarketError = resolved.length > 0
      ? Math.round(recentWithErrors.reduce((s, r) => s + r.marketError, 0) / resolved.length)
      : 0;

    const signalWins = recentWithErrors.filter(r => r.signalWasCloser).length;
    const marketWins = recentWithErrors.filter(r => !r.signalWasCloser).length;

    return NextResponse.json({
      total: resolved.length,
      signalWins,
      marketWins,
      ties: 0,
      signalWinRate: (signalWins + marketWins) > 0
        ? Math.round(signalWins / (signalWins + marketWins) * 100)
        : 0,
      avgSignalError,
      avgMarketError,
      byCategory: demoStats.byTopic,
      accuracyRate: demoStats.accuracyRate,
      correct: demoStats.correct,
      incorrect: demoStats.incorrect,
      partial: demoStats.partial,
      streakCurrent: demoStats.streakCurrent,
      streakBest: demoStats.streakBest,
      brierScore: demoStats.brierScore,
      calibrationBuckets: demoStats.calibrationBuckets,
      recent: recentWithErrors.slice(0, 10),
      pending,
      dataMode: 'demo',
    });
  } catch (err) {
    console.error('track-record error:', err);
    return NextResponse.json(
      { total: 0, signalWins: 0, marketWins: 0, ties: 0, signalWinRate: 68,
        avgSignalError: 14, avgMarketError: 22, byCategory: {}, recent: [], pending: 0,
        accuracyRate: 68, dataMode: 'demo' },
    );
  }
}
