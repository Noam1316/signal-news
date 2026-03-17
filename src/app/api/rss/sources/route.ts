import { NextResponse } from 'next/server';
import { rssSources } from '@/services/rss-sources';

export async function GET() {
  return NextResponse.json({ sources: rssSources });
}
