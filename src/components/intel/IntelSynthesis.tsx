'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/context';
import type { IntelSynthesis as IntelSynthesisType } from '@/services/ai-synthesis';

const THREAT_CONFIG = {
  critical: { label: { he: 'קריטי', en: 'Critical' }, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', dot: 'bg-red-400' },
  high:     { label: { he: 'גבוה',  en: 'High'     }, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', dot: 'bg-orange-400' },
  medium:   { label: { he: 'בינוני',en: 'Medium'   }, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-400' },
  low:      { label: { he: 'נמוך',  en: 'Low'      }, color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30',  dot: 'bg-green-400' },
};

export default function IntelSynthesis() {
  const { lang, dir } = useLanguage();
  const [data, setData] = useState<IntelSynthesisType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // First fetch stories (already cached from BriefList), then POST to synthesis
    // This avoids cold-start RSS fetching inside the synthesis endpoint
    fetch('/api/stories')
      .then(r => r.ok ? r.json() : null)
      .then(async storiesData => {
        if (!storiesData?.stories?.length) { setLoading(false); return; }
        const res = await fetch('/api/synthesis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stories: storiesData.stories }),
        });
        const d = res.ok ? await res.json() : null;
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div dir={dir} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 animate-pulse">
        <div className="h-4 bg-white/5 rounded w-1/3 mb-3" />
        <div className="h-3 bg-white/5 rounded w-full mb-2" />
        <div className="h-3 bg-white/5 rounded w-3/4" />
      </div>
    );
  }

  if (!data) return null;

  const threat = THREAT_CONFIG[data.threatLevel] || THREAT_CONFIG.medium;
  const isHe = lang === 'he';

  const bullets = [
    { icon: '🌍', label: { he: 'התפתחות מרכזית', en: 'Main Development' }, text: isHe ? data.mainDevelopment.he : data.mainDevelopment.en },
    { icon: '📈', label: { he: 'סיגנל שוק',       en: 'Market Signal'    }, text: isHe ? data.marketSignal.he    : data.marketSignal.en    },
    { icon: '👁️', label: { he: 'לצפות ב-24 שעות', en: 'Watch Next 24h'   }, text: isHe ? data.watchFor.he        : data.watchFor.en        },
  ].filter(b => b.text && !b.text.includes('GROQ_API_KEY') && !b.text.includes('Groq analysis'));

  const generatedAgo = (() => {
    const diff = Date.now() - new Date(data.generatedAt).getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 60) return isHe ? `לפני ${mins} דק'` : `${mins}m ago`;
    return isHe ? `לפני ${Math.round(mins / 60)} שע'` : `${Math.round(mins / 60)}h ago`;
  })();

  return (
    <div dir={dir} className={`rounded-xl border p-4 ${threat.bg} mb-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white/90">
            {isHe ? '🧠 הערכת מודיעין' : '🧠 Intel Assessment'}
          </span>
          {data.source === 'groq' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/20">
              AI
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-xs font-semibold ${threat.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${threat.dot} animate-pulse`} />
            {isHe ? `רמת איום: ${threat.label.he}` : `Threat: ${threat.label.en}`}
          </span>
          <span className="text-[10px] text-gray-500">{generatedAgo}</span>
        </div>
      </div>

      {/* Bullets */}
      <div className="space-y-2">
        {bullets.map((b, i) => (
          <div key={i} className="flex gap-2 text-sm">
            <span className="shrink-0 mt-0.5">{b.icon}</span>
            <div>
              <span className="text-white/50 text-xs font-medium me-1">
                {isHe ? b.label.he : b.label.en}:
              </span>
              <span className="text-white/80">{b.text}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
