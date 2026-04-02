'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Endpoint {
  method: 'GET' | 'POST';
  path: string;
  description: string;
  params?: { name: string; type: string; default?: string; description: string }[];
  response: string;
  example: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/v1/stories',
    description: 'Top geopolitical stories with likelihood scores, delta, and source counts.',
    params: [
      { name: 'limit',  type: 'number', default: '10',  description: 'Max stories to return (max 50)' },
      { name: 'lens',   type: 'string', default: 'all', description: '"israel" | "world" | "all"' },
      { name: 'signal', type: 'boolean', default: 'false', description: 'true = only signal stories' },
      { name: 'format', type: 'string', default: 'default', description: '"full" includes summary + why + sources' },
    ],
    response: `{
  "data": [{
    "slug": "iran-nuclear-talks",
    "headline": { "en": "Iran nuclear talks resume", "he": "..." },
    "likelihood": 72,
    "likelihoodLabel": "high",
    "delta": 8,
    "isSignal": true,
    "lens": "world",
    "category": { "en": "Iran", "he": "איראן" },
    "sourceCount": 7,
    "updatedAt": "2025-03-31T09:00:00Z"
  }],
  "meta": { "total": 1, "generatedAt": "...", "version": "v1", "filters": {...} }
}`,
    example: '/api/v1/stories?limit=5&signal=true&format=full',
  },
  {
    method: 'GET',
    path: '/api/v1/shocks',
    description: 'Active geopolitical shock events detected by statistical anomaly analysis.',
    params: [
      { name: 'limit',      type: 'number', default: '5',   description: 'Max shocks (max 20)' },
      { name: 'confidence', type: 'string', default: 'all', description: '"high" | "medium" | "low"' },
      { name: 'type',       type: 'string', default: 'all', description: '"likelihood" | "narrative" | "fragmentation"' },
    ],
    response: `{
  "data": [{
    "id": "shock-abc123",
    "type": "likelihood",
    "confidence": "high",
    "headline": { "en": "Sudden escalation detected", "he": "..." },
    "whatMoved": { "en": "Coverage spiked 3x in 2h", "he": "..." },
    "delta": 22,
    "timestamp": "2025-03-31T09:00:00Z",
    "relatedStorySlug": "iran-nuclear-talks"
  }],
  "meta": { "total": 1, "detectedAt": "...", "version": "v1" }
}`,
    example: '/api/v1/shocks?confidence=high&limit=3',
  },
  {
    method: 'GET',
    path: '/api/v1/signals',
    description: 'Signal vs Market alpha divergences — where our AI differs from prediction markets.',
    params: [
      { name: 'limit',    type: 'number', default: '5', description: 'Max matches (max 20)' },
      { name: 'minAlpha', type: 'number', default: '0', description: 'Min alpha score (0–100)' },
      { name: 'minDelta', type: 'number', default: '0', description: 'Min absolute delta %' },
    ],
    response: `{
  "data": [{
    "topic": "Iran Nuclear Deal",
    "signalLikelihood": 68,
    "marketProbability": 45,
    "delta": 23,
    "alphaScore": 71,
    "alphaDirection": "bullish",
    "whyDifferent": "Signal detects rising diplomatic activity...",
    "polymarketTitle": "Will Iran sign deal by Q2?",
    "polymarketUrl": "https://polymarket.com/...",
    "volume": 142500
  }],
  "meta": { "total": 1, "generatedAt": "...", "version": "v1" }
}`,
    example: '/api/v1/signals?minAlpha=30&minDelta=10&limit=3',
  },
  {
    method: 'GET',
    path: '/api/v1/risk',
    description: 'Composite Geopolitical Risk Index (0–100) based on sentiment, shocks, and signal density.',
    response: `{
  "data": {
    "riskIndex": 58,
    "level": "medium",
    "components": {
      "sentimentPressure": 22,
      "shockPressure": 24,
      "signalDensity": 12
    },
    "activeShocks": 3,
    "articlesScanned": 97
  },
  "meta": { "generatedAt": "...", "version": "v1" }
}`,
    example: '/api/v1/risk',
  },
];

const METHOD_COLOR: Record<string, string> = {
  GET:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  POST: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

export default function ApiDocsPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const BASE = 'https://signal-news-noam1316s-projects.vercel.app';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-300 text-sm">← Dashboard</Link>
            <span className="text-gray-700">|</span>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-yellow-400">⚡</span> Signal News API
              <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-yellow-400/15 border border-yellow-400/25 text-yellow-400">v1</span>
            </h1>
          </div>
          <span className="text-[10px] text-gray-500">Free · No auth · CORS open</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Intro */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="text-lg font-bold text-white mb-2">Public API — Geopolitical Intelligence</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            Signal News provides a free, no-auth API for geopolitical intelligence data.
            Pipe it into Excel, Notion, Grafana, or your own dashboard.
            All endpoints return JSON with <code className="text-yellow-400 bg-yellow-400/10 px-1 rounded">CORS: *</code> and 10–15 min server-side cache.
          </p>

          {/* Base URL */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 uppercase font-bold shrink-0">Base URL</span>
            <code className="flex-1 text-xs bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg text-emerald-400 font-mono">
              {BASE}
            </code>
            <button
              onClick={() => copy(BASE, 'base')}
              className="text-[10px] px-2 py-1.5 rounded border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors shrink-0"
            >
              {copied === 'base' ? '✓' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Quick start */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Start</h3>
          <div className="space-y-2">
            {[
              { label: 'JavaScript / fetch', code: `const res = await fetch('${BASE}/api/v1/stories?limit=5');\nconst { data } = await res.json();` },
              { label: 'Python / requests', code: `import requests\ndata = requests.get('${BASE}/api/v1/stories?limit=5').json()['data']` },
              { label: 'Excel Power Query', code: `= Json.Document(Web.Contents("${BASE}/api/v1/stories?limit=10"))` },
            ].map(({ label, code }) => (
              <div key={label}>
                <div className="text-[10px] text-gray-600 mb-1">{label}</div>
                <div className="relative">
                  <pre className="text-[11px] bg-gray-800 border border-gray-700/50 rounded-lg p-3 text-gray-300 overflow-x-auto font-mono leading-relaxed">{code}</pre>
                  <button
                    onClick={() => copy(code, label)}
                    className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400 hover:text-white transition-colors"
                  >
                    {copied === label ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Endpoints */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Endpoints</h3>
          <div className="space-y-3">
            {ENDPOINTS.map((ep, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div key={ep.path} className="rounded-2xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                  {/* Header row */}
                  <button
                    className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-800/40 transition-colors"
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                  >
                    <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded border ${METHOD_COLOR[ep.method]}`}>
                      {ep.method}
                    </span>
                    <code className="text-sm font-mono text-white">{ep.path}</code>
                    <span className="flex-1 text-[11px] text-gray-500 hidden sm:block">{ep.description}</span>
                    <span className="text-gray-600 text-xs shrink-0">{isOpen ? '▲' : '▼'}</span>
                  </button>

                  {/* Detail */}
                  {isOpen && (
                    <div className="border-t border-gray-800 px-5 py-4 space-y-4">
                      <p className="text-sm text-gray-400">{ep.description}</p>

                      {ep.params && ep.params.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Parameters</h4>
                          <div className="rounded-xl overflow-hidden border border-gray-800">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-gray-800/60">
                                  <th className="text-left px-3 py-2 text-gray-500 font-semibold">Name</th>
                                  <th className="text-left px-3 py-2 text-gray-500 font-semibold">Type</th>
                                  <th className="text-left px-3 py-2 text-gray-500 font-semibold">Default</th>
                                  <th className="text-left px-3 py-2 text-gray-500 font-semibold">Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ep.params.map(p => (
                                  <tr key={p.name} className="border-t border-gray-800">
                                    <td className="px-3 py-2"><code className="text-yellow-400">{p.name}</code></td>
                                    <td className="px-3 py-2 text-gray-500">{p.type}</td>
                                    <td className="px-3 py-2 text-gray-600">{p.default ?? '—'}</td>
                                    <td className="px-3 py-2 text-gray-400">{p.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Example URL */}
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Example Request</h4>
                        <div className="relative flex items-center gap-2">
                          <code className="flex-1 text-[11px] bg-gray-800 border border-gray-700/50 px-3 py-2 rounded-lg text-emerald-400 font-mono break-all">
                            {BASE}{ep.example}
                          </code>
                          <button
                            onClick={() => copy(`${BASE}${ep.example}`, `url-${idx}`)}
                            className="shrink-0 text-[10px] px-2 py-1.5 rounded border border-gray-700 text-gray-400 hover:text-white transition-colors"
                          >
                            {copied === `url-${idx}` ? '✓' : 'Copy'}
                          </button>
                        </div>
                      </div>

                      {/* Response schema */}
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Response</h4>
                        <pre className="text-[11px] bg-gray-800 border border-gray-700/50 rounded-xl p-3 text-gray-300 overflow-x-auto font-mono leading-relaxed">
                          {ep.response}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Rate limits + notes */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-5 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Notes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-400">
            {[
              { icon: '🔓', title: 'No auth required', body: 'All endpoints are public. No API key needed.' },
              { icon: '⏱️', title: 'Cache TTL', body: 'Stories: 15 min · Shocks/Signals/Risk: 10 min.' },
              { icon: '🌐', title: 'CORS open', body: 'Access-Control-Allow-Origin: * on all v1 endpoints.' },
              { icon: '📊', title: 'Data source', body: '35+ RSS feeds, keyword-based analysis. No LLM.' },
              { icon: '🔄', title: 'Refresh rate', body: 'Underlying data refreshes every 15 min from RSS.' },
              { icon: '⚡', title: 'Vercel serverless', body: 'Cold starts possible. First request may be ~2s.' },
            ].map(({ icon, title, body }) => (
              <div key={title} className="flex gap-2">
                <span className="text-base shrink-0">{icon}</span>
                <div>
                  <p className="font-semibold text-gray-300">{title}</p>
                  <p className="text-gray-500">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-gray-600 pb-6">
          Built by <span className="text-gray-400">Signal News</span> ·{' '}
          <Link href="/dashboard" className="hover:text-gray-300 transition-colors">Dashboard</Link>
          {' · '}
          <a href="/feed.xml" className="hover:text-gray-300 transition-colors">RSS Feed</a>
        </div>
      </div>
    </div>
  );
}
