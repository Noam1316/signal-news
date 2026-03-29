import { NextResponse } from 'next/server';
import { getTrackRecord, getPendingCount } from '@/services/prediction-tracker';

export async function GET() {
  try {
    const [record, pending] = await Promise.all([
      getTrackRecord(),
      getPendingCount(),
    ]);

    return NextResponse.json({ ...record, pending });
  } catch (err) {
    console.error('track-record error:', err);
    return NextResponse.json(
      { total: 0, signalWins: 0, marketWins: 0, ties: 0, signalWinRate: 0, avgSignalError: 0, avgMarketError: 0, byCategory: {}, recent: [], pending: 0 },
      { status: 500 }
    );
  }
}
