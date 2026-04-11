/**
 * GET /api/market-data
 * Returns real-time financial market data for geopolitically relevant instruments.
 * Cached 10 minutes. No API key required (Yahoo Finance).
 */

import { NextResponse } from 'next/server';
import { fetchMarketData } from '@/services/market-data';

export async function GET() {
  try {
    const instruments = await fetchMarketData();
    return NextResponse.json({
      instruments,
      count: instruments.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[market-data] Failed:', error);
    return NextResponse.json({ instruments: [], count: 0 }, { status: 500 });
  }
}
