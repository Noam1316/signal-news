/**
 * GET /api/cron/check-resolutions
 * Triggered by Vercel Cron weekly (Sunday 06:00 UTC).
 * Checks which Polymarket events have resolved and computes accuracy.
 * Protected by CRON_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkResolutions, getTrackRecord } from '@/services/prediction-tracker';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await checkResolutions();
    const record = await getTrackRecord();

    return NextResponse.json({
      ...result,
      trackRecord: {
        total: record.total,
        signalWinRate: record.signalWinRate,
        avgSignalError: record.avgSignalError,
        avgMarketError: record.avgMarketError,
      },
    });
  } catch (err) {
    console.error('check-resolutions cron error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
