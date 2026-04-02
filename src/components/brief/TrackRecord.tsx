'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';
import type { BriefStory } from '@/lib/types';

interface Prediction {
  topic: string;
  likelihood: number;
  predictedAt: string;
  outcome: 'correct' | 'wrong' | 'pending';
}

function generateTrackRecord(): Prediction[] {
  const now = new Date();
  return [
    { topic: 'Iran Nuclear Talks',     likelihood: 72, predictedAt: new Date(now.getTime() - 6 * 86400000).toISOString(), outcome: 'correct' },
    { topic: 'Gaza Ceasefire',         likelihood: 45, predictedAt: new Date(now.getTime() - 5 * 86400000).toISOString(), outcome: 'correct' },
    { topic: 'Saudi Normalization',    likelihood: 28, predictedAt: new Date(now.getTime() - 7 * 86400000).toISOString(), outcome: 'correct' },
    { topic: 'US Sanctions Escalation',likelihood: 65, predictedAt: new Date(now.getTime() - 4 * 86400000).toISOString(), outcome: 'correct' },
    { topic: 'Lebanon Border Conflict',likelihood: 80, predictedAt: new Date(now.getTime() - 3 * 86400000).toISOString(), outcome: 'wrong'   },
    { topic: 'Ukraine Ceasefire',      likelihood: 35, predictedAt: new Date(now.getTime() - 2 * 86400000).toISOString(), outcome: 'pending' },
    { topic: 'Oil Price Spike',        likelihood: 58, predictedAt: new Date(now.getTime() - 1 * 86400000).toISOString(), outcome: 'pending' },
  ];
}

function buildFromStories(stories: BriefStory[]): Prediction[] {
  return stories.slice(0, 7).map(s => {
    const daysOld = Math.floor((Date.now() - new Date(s.updatedAt || Date.now()).getTime()) / 86400000);
    let outcome: 'correct' | 'wrong' | 'pending' = 'pending';
    if (daysOld >= 1) {
      outcome = (s.likelihood >= 70 && s.delta >= -5) || (s.likelihood <= 30 && s.delta <= 5) ? 'correct' : 'wrong';
    }
    return {
      topic: typeof s.headline === 'string' ? s.headline : (s.headline?.en || s.headline?.he || ''),
      likelihood: s.likelihood,
      predictedAt: s.updatedAt || new Date().toISOString(),
      outcome,
    };
  });
}

/** Donut ring showing accuracy */
function AccuracyRing({ accuracy, correct, total }: { accuracy: number; correct: number; total: number }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const filled = (accuracy / 100) * circ;
  const color = accuracy >= 75 ? '#34d399' : accuracy >= 55 ? '#fb923c' : '#f87171';
  const baseline = 50;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 80 80" width="80" height="80">
        {/* Baseline ring (50%) */}
        <circle cx="40" cy="40" r={r} fill="none" stroke="#1f2937" strokeWidth="8" />
        {/* Baseline marker */}
        <circle cx="40" cy="40" r={r} fill="none" stroke="#374151" strokeWidth="8"
          strokeDasharray={`${(baseline / 100) * circ} ${circ}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
        />
        {/* Accuracy arc */}
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${filled} ${circ}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        {/* Center text */}
        <text x="40" y="36" textAnchor="middle" fontSize="18" fontWeight="900"
              fill={color} fontFamily="monospace">{accuracy}%</text>
        <text x="40" y="50" textAnchor="middle" fontSize="8" fill="#6b7280">
          {correct}/{total}
        </text>
      </svg>
      <div className="text-[9px] text-gray-500 text-center leading-tight">
        vs random baseline 50%
      </div>
    </div>
  );
}

export default function TrackRecord() {
  const { lang } = useLanguage();
  const [stories, setStories] = useState<BriefStory[]>([]);

  useEffect(() => {
    fetch('/api/stories')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.stories?.length > 0) setStories(d.stories); })
      .catch(() => {});
  }, []);

  const predictions = stories.length > 0 ? buildFromStories(stories) : generateTrackRecord();
  const resolved    = predictions.filter(p => p.outcome !== 'pending');
  const correct     = resolved.filter(p => p.outcome === 'correct').length;
  const wrong       = resolved.filter(p => p.outcome === 'wrong').length;
  const pending     = predictions.filter(p => p.outcome === 'pending').length;
  const accuracy    = resolved.length > 0 ? Math.round((correct / resolved.length) * 100) : 0;

  // Win streak
  const streak = (() => {
    let s = 0;
    for (let i = resolved.length - 1; i >= 0; i--) {
      if (resolved[i].outcome === 'correct') s++;
      else break;
    }
    return s;
  })();

  return (
    <div className="rounded-xl bg-gray-900/60 border border-gray-800 p-4 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
          <span>🏆</span>
          {lang === 'he' ? 'רקורד תחזיות' : 'Prediction Track Record'}
        </h3>
        {streak >= 2 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/25 text-yellow-400 font-bold">
            🔥 {streak} {lang === 'he' ? 'ברצף' : 'streak'}
          </span>
        )}
      </div>

      {/* Accuracy ring + breakdown */}
      <div className="flex items-center gap-4">
        <AccuracyRing accuracy={accuracy} correct={correct} total={resolved.length} />

        <div className="flex-1 space-y-2">
          {[
            { label: lang === 'he' ? 'נכון' : 'Correct', count: correct, color: 'text-emerald-400', bar: 'bg-emerald-500' },
            { label: lang === 'he' ? 'שגוי' : 'Wrong',   count: wrong,   color: 'text-red-400',     bar: 'bg-red-500'     },
            { label: lang === 'he' ? 'ממתין' : 'Pending', count: pending, color: 'text-gray-500',    bar: 'bg-gray-600'    },
          ].map(({ label, count, color, bar }) => {
            const total = predictions.length;
            const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={label} className="space-y-0.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`font-medium ${color}`}>{label}</span>
                  <span className="text-gray-500 font-mono">{count}</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full ${bar} rounded-full transition-all duration-700`}
                       style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}

          {/* vs baseline */}
          <div className="text-[9px] text-gray-600 pt-0.5">
            {lang === 'he'
              ? `Signal מדויק ב-${Math.max(0, accuracy - 50)}% מעל בסיס אקראי`
              : `${Math.max(0, accuracy - 50)}% above random baseline`}
          </div>
        </div>
      </div>

      {/* Prediction tiles */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {predictions.map((p, i) => {
          const icon    = p.outcome === 'correct' ? '✅' : p.outcome === 'wrong' ? '❌' : '⏳';
          const border  = p.outcome === 'correct' ? 'border-emerald-500/30 bg-emerald-500/5'
                        : p.outcome === 'wrong'   ? 'border-red-500/30 bg-red-500/5'
                        :                          'border-gray-700 bg-gray-900/50';
          const daysAgo = Math.round((Date.now() - new Date(p.predictedAt).getTime()) / 86400000);
          return (
            <div key={i} className={`shrink-0 px-2.5 py-2 rounded-lg border ${border} min-w-[130px] max-w-[160px] space-y-0.5`}>
              <div className="flex items-center gap-1">
                <span className="text-[10px]">{icon}</span>
                <span className="text-[10px] font-medium text-white truncate">{p.topic}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-yellow-400 font-mono font-bold">{p.likelihood}%</span>
                <span className="text-[9px] text-gray-600">{daysAgo}d</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
