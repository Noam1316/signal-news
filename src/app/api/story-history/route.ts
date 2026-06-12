/**
 * GET /api/story-history?slug=<story-slug>
 * Returns the persisted likelihood time series for one story,
 * recorded hourly by /api/stories into Vercel KV.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStoryHistory } from '@/services/likelihood-history';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) {
    return NextResponse.json({ error: 'missing slug' }, { status: 400 });
  }

  try {
    const points = await getStoryHistory(slug);
    return NextResponse.json({ slug, points, count: points.length });
  } catch {
    return NextResponse.json({ slug, points: [], count: 0 });
  }
}
