'use client';

import { useState } from 'react';
import { useLanguage } from '@/i18n/context';

interface Endpoint {
  method: string;
  path: string;
  description: string;
  descHe: string;
  response: string;
  example: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/rss/latest',
    description: 'Fetch latest RSS articles from all sources',
    descHe: 'שליפת כתבות RSS אחרונות מכל המקורות',
    response: 'FetchedArticle[]',
    example: `[{
  "id": "ynet-abc123",
  "sourceId": "ynet",
  "title": "Iran Nuclear Talks...",
  "sentiment": "negative",
  "topics": ["Iran Nuclear"],
  "signalScore": 78
}]`,
  },
  {
    method: 'GET',
    path: '/api/analyze',
    description: 'Get AI analysis of current news landscape',
    descHe: 'ניתוח AI של נוף החדשות הנוכחי',
    response: '{ stories, topTopics, signalRatio }',
    example: `{
  "stories": [...],
  "topTopics": ["Iran", "Gaza"],
  "signalRatio": 0.42,
  "totalArticles": 156
}`,
  },
  {
    method: 'GET',
    path: '/api/stories',
    description: 'Clustered stories with likelihood scoring',
    descHe: 'סיפורים מקובצים עם ניקוד סבירות',
    response: 'BriefStory[]',
    example: `[{
  "slug": "iran-nuclear",
  "headline": { "en": "Iran..." },
  "likelihood": 72,
  "delta": 5,
  "confidence": 85
}]`,
  },
  {
    method: 'GET',
    path: '/api/shocks',
    description: 'Dynamic shock detection from live data',
    descHe: 'זיהוי זעזועים דינמי מנתונים חיים',
    response: '{ shocks, isLive }',
    example: `{
  "shocks": [{
    "type": "likelihood",
    "topic": "Gaza Ceasefire",
    "confidence": 0.82
  }],
  "isLive": true
}`,
  },
  {
    method: 'GET',
    path: '/api/entities',
    description: 'Named entity extraction with co-occurrence',
    descHe: 'חילוץ ישויות עם מפת קשרים',
    response: '{ entities, cooccurrence }',
    example: `{
  "entities": [{
    "name": "Netanyahu",
    "type": "person",
    "count": 23
  }],
  "cooccurrence": [...]
}`,
  },
  {
    method: 'GET',
    path: '/api/polymarket',
    description: 'Signal vs Prediction Markets comparison',
    descHe: 'השוואת Signal מול שווקי תחזיות',
    response: '{ matches, source }',
    example: `{
  "matches": [{
    "topic": "Iran Nuclear",
    "signalLikelihood": 72,
    "marketProbability": 18,
    "delta": 54
  }],
  "source": "live"
}`,
  },
  {
    method: 'GET',
    path: '/api/bias',
    description: 'Media bias analysis, coverage gaps, narrative divergence',
    descHe: 'ניתוח הטיה תקשורתית, פערי כיסוי, פיצול נרטיבי',
    response: '{ coverageGaps, narrativeDivergence, biasDistribution }',
    example: `{
  "coverageGaps": [{
    "topic": "Judicial Reform",
    "direction": "left-only",
    "gapScore": 72
  }],
  "biasDistribution": {
    "center": 45,
    "left": 22,
    "right": 18
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/agents?view=metrics',
    description: '100 demo agent engagement metrics',
    descHe: 'מטריקות מעורבות של 100 סוכנים',
    response: '{ metrics }',
    example: `{
  "metrics": {
    "totalAgents": 100,
    "activeToday": 42,
    "returnRate": 78.5,
    "topCriticisms": [...]
  }
}`,
  },
];

export default function ApiDocs() {
  const { lang } = useLanguage();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<number | null>(null);

  const copyUrl = (path: string, idx: number) => {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://signal-news.vercel.app';
    navigator.clipboard.writeText(`${base}${path}`);
    setCopyFeedback(idx);
    setTimeout(() => setCopyFeedback(null), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          🔗 {lang === 'he' ? 'גישת API' : 'API Access'}
        </h3>
        <p className="text-[10px] text-gray-500 mt-1">
          {lang === 'he'
            ? 'כל ה-endpoints פתוחים (ללא אותנטיקציה) · JSON · Cache 10 דקות'
            : 'All endpoints are open (no auth) · JSON responses · 10-min cache'}
        </p>
      </div>

      <div className="space-y-2">
        {ENDPOINTS.map((ep, i) => (
          <div key={i} className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
            <button
              onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-800/30 transition-colors text-start"
            >
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                {ep.method}
              </span>
              <code className="text-sm text-yellow-400 font-mono flex-1">{ep.path}</code>
              <span className="text-[10px] text-gray-500 hidden sm:inline">
                {lang === 'he' ? ep.descHe : ep.description}
              </span>
              <span className="text-gray-600 text-xs">{expandedIdx === i ? '▼' : '▶'}</span>
            </button>

            {expandedIdx === i && (
              <div className="border-t border-gray-800 p-4 space-y-3">
                <p className="text-xs text-gray-400">
                  {lang === 'he' ? ep.descHe : ep.description}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">Response:</span>
                  <code className="text-[10px] text-blue-400 font-mono">{ep.response}</code>
                </div>

                {/* Example response */}
                <div className="relative">
                  <pre className="p-3 rounded-lg bg-gray-950 border border-gray-800 text-[10px] text-gray-400 font-mono overflow-x-auto">
                    {ep.example}
                  </pre>
                  <button
                    onClick={() => copyUrl(ep.path, i)}
                    className="absolute top-2 end-2 text-[10px] px-2 py-1 rounded bg-gray-800 text-gray-400 hover:text-white border border-gray-700"
                  >
                    {copyFeedback === i ? '✓ Copied' : 'Copy URL'}
                  </button>
                </div>

                {/* Try it */}
                <a
                  href={ep.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300"
                >
                  ▶ {lang === 'he' ? 'נסה עכשיו' : 'Try it live'} →
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
