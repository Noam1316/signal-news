'use client';

import { useMemo } from 'react';
import { useLanguage } from '@/i18n/context';
import { loadHistory } from '@/hooks/useLikelihoodHistory';
import { likelihoodColor } from '@/lib/utils';

interface Props {
  slug: string;
  currentLikelihood: number;
}

function formatTime(ts: number, lang: string): string {
  try {
    return new Date(ts).toLocaleString(lang === 'he' ? 'he-IL' : 'en-US', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function StoryTimeline({ slug, currentLikelihood }: Props) {
  const { lang, dir } = useLanguage();

  const snapshots = useMemo(() => loadHistory(slug), [slug]);

  if (snapshots.length < 2) {
    return (
      <div dir={dir} className="text-xs text-gray-500 italic py-1">
        {lang === 'he' ? 'מעקב התחיל עכשיו — היסטוריה תיבנה בביקורים הבאים' : 'Tracking started — history builds over future visits'}
      </div>
    );
  }

  const first = snapshots[0];
  const peak = snapshots.reduce((m, s) => s.v > m.v ? s : m, snapshots[0]);
  const trend = currentLikelihood > first.v ? 'up' : currentLikelihood < first.v ? 'down' : 'flat';

  return (
    <div dir={dir} className="space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
        {lang === 'he' ? 'ציר זמן סבירות' : 'Likelihood Timeline'}
      </p>

      {/* Compact bar chart */}
      <div className="flex items-end gap-0.5 h-10">
        {snapshots.slice(-16).map((snap, i) => {
          const pct = Math.max(4, snap.v);
          const color = likelihoodColor(snap.v);
          return (
            <div
              key={i}
              title={`${snap.v}% — ${formatTime(snap.t, lang)}`}
              className="flex-1 rounded-sm transition-all cursor-default"
              style={{ height: `${pct}%`, backgroundColor: color, opacity: 0.8 }}
            />
          );
        })}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-[10px] text-gray-400 flex-wrap">
        <span>
          {lang === 'he' ? 'ראשון' : 'First'}{' '}
          <span className="font-mono" style={{ color: likelihoodColor(first.v) }}>{first.v}%</span>
          {' · '}{formatTime(first.t, lang)}
        </span>
        <span>
          {lang === 'he' ? 'שיא' : 'Peak'}{' '}
          <span className="font-mono text-yellow-400">{peak.v}%</span>
          {' · '}{formatTime(peak.t, lang)}
        </span>
        <span>
          {lang === 'he' ? 'מגמה' : 'Trend'}{' '}
          <span className={trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        </span>
        <span className="text-gray-600">
          {snapshots.length}{' '}{lang === 'he' ? 'נקודות מדידה' : 'data points'}
        </span>
      </div>
    </div>
  );
}
