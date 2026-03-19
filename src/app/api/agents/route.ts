import { NextResponse } from 'next/server';
import { generateDemoAgents, calculateEngagementMetrics } from '@/services/demo-agents';

let cache: { data: any; ts: number } | null = null;
const TTL = 60 * 60 * 1000; // 1 hour (deterministic data)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view') || 'metrics'; // 'metrics' | 'agents' | 'full'

  if (cache && Date.now() - cache.ts < TTL) {
    if (view === 'agents') return NextResponse.json({ agents: cache.data.agents });
    if (view === 'metrics') return NextResponse.json({ metrics: cache.data.metrics });
    return NextResponse.json(cache.data);
  }

  const agents = generateDemoAgents();
  const metrics = calculateEngagementMetrics(agents);

  const data = { agents, metrics, generatedAt: new Date().toISOString() };
  cache = { data, ts: Date.now() };

  if (view === 'agents') return NextResponse.json({ agents });
  if (view === 'metrics') return NextResponse.json({ metrics });
  return NextResponse.json(data);
}
