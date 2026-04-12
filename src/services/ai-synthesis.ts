/**
 * AI Intelligence Synthesis
 * Uses Groq to generate a coherent daily intelligence assessment
 * from top stories, shocks, and market data combined.
 * Cached 6 hours — runs ~4x per day.
 */

import type { BriefStory } from '@/lib/types';
import type { ShockEvent } from '@/lib/types';
import type { MarketInstrument } from './market-data';

export interface IntelSynthesis {
  mainDevelopment: { he: string; en: string };   // top geopolitical development
  marketSignal: { he: string; en: string };       // what markets are saying
  watchFor: { he: string; en: string };           // what to watch in next 24h
  blindSpot: { he: string; en: string };          // what mainstream is missing
  threatLevel: 'critical' | 'high' | 'medium' | 'low';
  generatedAt: string;
  source: 'groq' | 'fallback';
}

// In-memory cache (6 hours)
let _cache: { synthesis: IntelSynthesis; timestamp: number } | null = null;
const CACHE_TTL = 6 * 60 * 60 * 1000;

export async function generateSynthesis(
  stories: BriefStory[],
  shocks: ShockEvent[],
  markets: MarketInstrument[]
): Promise<IntelSynthesis> {
  if (_cache && Date.now() - _cache.timestamp < CACHE_TTL) {
    return _cache.synthesis;
  }

  if (!process.env.GROQ_API_KEY) {
    return buildFallback(stories, shocks);
  }

  try {
    const synthesis = await callGroq(stories, shocks, markets);
    _cache = { synthesis, timestamp: Date.now() };
    return synthesis;
  } catch (err) {
    console.warn('[synthesis] Groq failed, using fallback:', err instanceof Error ? err.message : err);
    // Don't cache fallbacks — retry Groq on next request
    return buildFallback(stories, shocks);
  }
}

async function callGroq(
  stories: BriefStory[],
  shocks: ShockEvent[],
  markets: MarketInstrument[]
): Promise<IntelSynthesis> {
  const topStories = stories.slice(0, 6).map(s => ({
    topic: typeof s.category === 'string' ? s.category : (s.category?.en ?? ''),
    headline: typeof s.headline === 'string' ? s.headline : (s.headline?.en ?? ''),
    likelihood: s.likelihood ?? 50,
    isSignal: s.isSignal ?? false,
    sources: (s.sources ?? []).length,
  }));

  const topShocks = (shocks ?? []).slice(0, 3).map(s => ({
    type: s.type ?? '',
    headline: typeof s.headline === 'string' ? s.headline : (s.headline?.en ?? ''),
    confidence: s.confidence ?? 'medium',
  }));

  const marketMoves = markets
    .filter(m => Math.abs(m.changePct) > 0.5)
    .slice(0, 5)
    .map(m => `${m.name}: ${m.changePct > 0 ? '+' : ''}${m.changePct.toFixed(1)}%`);

  const prompt = `You are a senior geopolitical intelligence analyst specializing in Israeli and Middle East affairs. Based on today's news, write a sharp 3-bullet intelligence assessment.

TODAY'S TOP STORIES:
${JSON.stringify(topStories, null, 0)}

DETECTED SHOCKS:
${JSON.stringify(topShocks, null, 0)}

MARKET MOVEMENTS:
${marketMoves.join(', ') || 'No significant moves'}

ANALYSIS PRIORITIES (always address if relevant):
1. US-Iran negotiations — what is the current status, risk of collapse, and what happens to oil/markets if talks fail?
2. Elections worldwide — any upcoming or recent results that shift regional power dynamics?
3. Israel security — active fronts, ceasefire status, hostage deal progress

Write a JSON object with these EXACT fields:
- mainDevelopmentHe: 2 Hebrew sentences on the #1 geopolitical development. Be specific: name actors, locations, numbers. No vague summaries.
- mainDevelopmentEn: same in English
- marketSignalHe: 1-2 Hebrew sentences — what are markets pricing in? If Iran talks risk collapse, say so. Mention oil, VIX, gold, or ILS if relevant.
- marketSignalEn: same in English
- watchForHe: 1-2 Hebrew sentences — top 2 specific events to monitor in next 24h (e.g. "תגובת טהרן להצעת ארה"ב", "תוצאות בחירות הונגריה")
- watchForEn: same in English
- blindSpotHe: 1-2 Hebrew sentences — one important story getting ZERO mainstream attention today
- blindSpotEn: same in English
- threatLevel: "critical"|"high"|"medium"|"low"

Return ONLY valid JSON, no markdown, no explanation.`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  const raw = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');

  return {
    mainDevelopment: { he: raw.mainDevelopmentHe || '', en: raw.mainDevelopmentEn || '' },
    marketSignal:    { he: raw.marketSignalHe    || '', en: raw.marketSignalEn    || '' },
    watchFor:        { he: raw.watchForHe        || '', en: raw.watchForEn        || '' },
    blindSpot:       { he: raw.blindSpotHe       || '', en: raw.blindSpotEn       || '' },
    threatLevel: (['critical','high','medium','low'].includes(raw.threatLevel) ? raw.threatLevel : 'medium') as IntelSynthesis['threatLevel'],
    generatedAt: new Date().toISOString(),
    source: 'groq',
  };
}

function buildFallback(stories: BriefStory[], shocks: ShockEvent[]): IntelSynthesis {
  const topStory = stories[0];
  const hasShocks = shocks.length > 0;
  const headline = topStory ? (typeof topStory.headline === 'string' ? topStory.headline : topStory.headline.en) : '';
  const headlineHe = topStory ? (typeof topStory.headline === 'string' ? topStory.headline : topStory.headline.he) : '';

  return {
    mainDevelopment: {
      he: headlineHe || 'אין נתונים מספיקים לסינתזה',
      en: headline || 'Insufficient data for synthesis',
    },
    marketSignal: {
      he: hasShocks ? 'זוהו זעזועים בנרטיב — שים לב לתגובת השווקים' : 'שווקים יציבים יחסית',
      en: hasShocks ? 'Narrative shocks detected — watch market reaction' : 'Markets relatively stable',
    },
    watchFor: {
      he: stories[1] ? (typeof stories[1].headline === 'string' ? stories[1].headline : stories[1].headline.he) : 'עקוב אחרי התפתחויות',
      en: stories[1] ? (typeof stories[1].headline === 'string' ? stories[1].headline : stories[1].headline.en) : 'Follow developments',
    },
    blindSpot: {
      he: 'נדרש ניתוח Groq לזיהוי blind spots — הפעל GROQ_API_KEY',
      en: 'Groq analysis required for blind spot detection — enable GROQ_API_KEY',
    },
    threatLevel: hasShocks ? 'high' : stories.some(s => s.isSignal) ? 'medium' : 'low',
    generatedAt: new Date().toISOString(),
    source: 'fallback',
  };
}
