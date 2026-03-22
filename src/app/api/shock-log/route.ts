import { NextResponse } from 'next/server';
import { getShockLog, getShockAccuracy } from '@/services/shock-log';

export const runtime = 'nodejs';

export async function GET() {
  const [log, accuracy] = await Promise.all([getShockLog(), getShockAccuracy()]);
  return NextResponse.json({ log, accuracy });
}
