/**
 * Webhook endpoint for n8n article enrichment
 * Receives full article text scraped by n8n and stores it for enhanced analysis.
 *
 * POST /api/webhooks/enrich
 * Body: { articleId, sourceId, fullText } or Array of same
 * Header: X-Webhook-Secret (optional, checked if WEBHOOK_SECRET env is set)
 */

import { NextRequest, NextResponse } from 'next/server';
import { storeEnrichment, storeBatchEnrichment, getEnrichmentStats } from '@/services/article-enrichment';

export async function POST(req: NextRequest) {
  // Auth check (optional — only if WEBHOOK_SECRET is configured)
  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    const headerSecret = req.headers.get('x-webhook-secret');
    if (headerSecret !== secret) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing X-Webhook-Secret header' },
        { status: 401 }
      );
    }
  }

  try {
    const body = await req.json();

    // Batch mode: array of articles
    if (Array.isArray(body)) {
      const stored = storeBatchEnrichment(body);
      const stats = getEnrichmentStats();
      return NextResponse.json({
        success: true,
        mode: 'batch',
        stored,
        total: body.length,
        cacheStats: stats,
      });
    }

    // Single article mode
    const { articleId, sourceId, fullText } = body;

    if (!articleId || !fullText) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'articleId and fullText are required' },
        { status: 400 }
      );
    }

    // Validate articleId format (16-char hex from SHA256)
    if (!/^[a-f0-9]{16}$/.test(articleId)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'articleId must be a 16-character hex string' },
        { status: 400 }
      );
    }

    const enriched = storeEnrichment({
      articleId,
      sourceId: sourceId || 'unknown',
      fullText: typeof fullText === 'string' ? fullText.slice(0, 50000) : '', // Max 50KB text
    });

    return NextResponse.json({
      success: true,
      mode: 'single',
      articleId: enriched.articleId,
      receivedAt: enriched.receivedAt,
      textLength: enriched.fullText.length,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to process enrichment data' },
      { status: 500 }
    );
  }
}

// GET endpoint to check enrichment stats
export async function GET() {
  const stats = getEnrichmentStats();
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/webhooks/enrich',
    description: 'POST full article text from n8n for enhanced political analysis',
    stats,
  });
}
