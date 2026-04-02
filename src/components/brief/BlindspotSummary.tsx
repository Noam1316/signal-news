'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';

interface CoverageGap {
  topic: string;
  direction: 'left-only' | 'right-only' | 'center-only' | 'both-extremes' | 'balanced';
  gapScore: number;
  missingFrom: string[];
}

const TOPIC_HE: Record<string, string> = {
  'Iran Nuclear':        'הגרעין האיראני',
  'Gaza Conflict':       'עימות בעזה',
  'Lebanon/Hezbollah':   'לבנון/חיזבאללה',
  'Saudi Normalization': 'נורמליזציה עם סעודיה',
  'US Politics':         'פוליטיקה אמריקאית',
  'West Bank':           'יהודה ושומרון',
  'Ukraine/Russia':      'אוקראינה/רוסיה',
  'Economy':             'כלכלה',
  'Syria':               'סוריה',
  'China':               'סין',
};

const DIRECTION_HE: Record<string, string> = {
  'left-only':     'מכוסה רק בשמאל',
  'right-only':    'מכוסה רק בימין',
  'center-only':   'מכוסה רק במרכז',
  'both-extremes': 'רק בקצוות',
};

const DIRECTION_EN: Record<string, string> = {
  'left-only':     'Left media only',
  'right-only':    'Right media only',
  'center-only':   'Center media only',
  'both-extremes': 'Extremes only',
};

export default function BlindspotSummary() {
  const { lang } = useLanguage();
  const [gaps, setGaps] = useState<CoverageGap[]>([]);

  useEffect(() => {
    fetch('/api/bias')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const g: CoverageGap[] = (data?.coverageGaps ?? [])
          .filter((g: CoverageGap) => g.gapScore >= 40 && g.direction !== 'balanced')
          .slice(0, 3);
        setGaps(g);
      })
      .catch(() => {});
  }, []);

  if (gaps.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 space-y-2 mb-4">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-500/80">
        <span>🕳️</span>
        <span>{lang === 'he' ? 'נקודות עיוורון תקשורתיות' : 'Media Blind Spots'}</span>
        <span className="font-normal text-amber-500/50">
          {lang === 'he' ? '— נושאים שנסקרים רק בצד אחד' : '— topics covered by one side only'}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {gaps.map((gap, i) => {
          const topicLabel = lang === 'he'
            ? (TOPIC_HE[gap.topic] || gap.topic)
            : gap.topic;
          const dirLabel = lang === 'he'
            ? (DIRECTION_HE[gap.direction] || gap.direction)
            : (DIRECTION_EN[gap.direction] || gap.direction);

          return (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-900/60 border border-amber-500/20 text-xs"
            >
              <span className="text-amber-400 font-semibold">{topicLabel}</span>
              <span className="text-gray-500">—</span>
              <span className="text-gray-400">{dirLabel}</span>
              <span className="text-amber-500/60 font-bold text-[10px]">{gap.gapScore}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
